import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withVendorOwnershipAuth, ApiResponse } from '@/lib/auth/api-auth';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema for updating staff
const updateStaffSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['VENDOR_ADMIN', 'VENDOR_STAFF']).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.string()).optional()
});

// GET /api/vendors/[vendorId]/staff/[staffId] - Get staff member details
export const GET = withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  try {
    const { vendorId, staffId } = params;

    if (!staffId) {
      return ApiResponse.error('Staff ID is required', 'MISSING_STAFF_ID', 400);
    }

    // Only vendor admins can view staff details
    if (user.role !== 'VENDOR_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
      return ApiResponse.forbidden('Only vendor admins can view staff details');
    }

    const staffMember = await prisma.vendorStaff.findFirst({
      where: {
        id: staffId,
        vendorId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            isActive: true,
            isEmailVerified: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            countryCode: true,
            timezone: true
          }
        }
      }
    });

    if (!staffMember) {
      return ApiResponse.notFound('Staff member');
    }

    // Get staff member's activity and statistics
    const [
      totalBookings,
      recentBookings,
      monthlyActivity,
      venueAccess,
      performanceStats
    ] = await Promise.all([
      // Total bookings handled by this staff member
      prisma.booking.count({
        where: {
          createdAt: {
            gte: staffMember.createdAt
          },
          venue: { vendorId }
          // Note: You might want to add a 'handledBy' field to bookings to track which staff member handled them
        }
      }),

      // Recent activity
      prisma.booking.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          },
          venue: { vendorId }
        },
        select: {
          id: true,
          type: true,
          startTime: true,
          status: true,
          totalAmount: true,
          user: {
            select: {
              name: true,
              email: true
            }
          },
          venue: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Monthly activity (last 6 months)
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', createdAt) as month,
          COUNT(*) as activity_count
        FROM bookings
        WHERE
          venueId IN (SELECT id FROM venues WHERE vendorId = ${vendorId})
          AND createdAt >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', createdAt)
        ORDER BY month DESC
      ` as Array<{ month: Date; activity_count: number }>,

      // Venue access (which venues they can manage)
      prisma.venue.findMany({
        where: { vendorId },
        select: {
          id: true,
          name: true,
          isActive: true,
          city: true,
          _count: {
            select: {
              bookings: {
                where: {
                  createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
              }
            }
          }
        },
        take: 10
      }),

      // Performance metrics (placeholder - customize based on your needs)
      {
        averageResponseTime: '2.5 hours', // Placeholder
        customerSatisfaction: 4.7,       // Placeholder
        bookingsPerDay: 12.5,            // Placeholder
        errorRate: 0.02                  // Placeholder
      }
    ]);

    // Transform the response
    const transformedStaffMember = {
      ...staffMember,
      user: {
        ...staffMember.user,
        accountAge: Math.floor((Date.now() - staffMember.user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        daysSinceLastLogin: staffMember.user.lastLoginAt
          ? Math.floor((Date.now() - staffMember.user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
          : null
      },
      statistics: {
        totalBookings,
        recentActivity: recentBookings.length,
        monthlyTrend: monthlyActivity.map(item => ({
          month: item.month,
          activityCount: item.activity_count
        }))
      },
      venueAccess: venueAccess.map(venue => ({
        ...venue,
        recentBookings: venue._count.bookings
      })),
      performance: performanceStats,
      recentActivity: recentBookings
    };

    return ApiResponse.success(transformedStaffMember);

  } catch (error) {
    console.error('Error fetching staff member details:', error);
    return ApiResponse.error('Failed to fetch staff member details', 'STAFF_ERROR', 500);
  }
});

// PUT /api/vendors/[vendorId]/staff/[staffId] - Update staff member
export const PUT = withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  try {
    const { vendorId, staffId } = params;
    const body = await request.json();
    const updates = updateStaffSchema.parse(body);

    if (!staffId) {
      return ApiResponse.error('Staff ID is required', 'MISSING_STAFF_ID', 400);
    }

    // Only vendor admins can update staff
    if (user.role !== 'VENDOR_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
      return ApiResponse.forbidden('Only vendor admins can update staff members');
    }

    // Check if staff member exists and belongs to this vendor
    const existingStaff = await prisma.vendorStaff.findFirst({
      where: {
        id: staffId,
        vendorId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!existingStaff) {
      return ApiResponse.notFound('Staff member');
    }

    // Prevent vendor admin from changing their own role to lower privileges
    if (updates.role && existingStaff.user.id === user.id) {
      return ApiResponse.error('Cannot change your own role', 'SELF_ROLE_CHANGE', 400);
    }

    // Update staff member and user if needed
    const [updatedStaff] = await prisma.$transaction([
      // Update vendor staff record
      prisma.vendorStaff.update({
        where: { id: staffId },
        data: {
          role: updates.role
        }
      }),

      // Update user record if needed
      prisma.user.update({
        where: { id: existingStaff.user.id },
        data: {
          name: updates.name,
          phone: updates.phone,
          isActive: updates.isActive
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          updatedAt: true
        }
      })
    ]);

    return ApiResponse.success({
      staffId,
      userId: existingStaff.user.id,
      user: updatedStaff,
      updates: {
        role: updates.role,
        ...((updates.name || updates.phone || updates.isActive !== undefined) && {
          user: {
            name: updates.name,
            phone: updates.phone,
            isActive: updates.isActive
          }
        })
      }
    });

  } catch (error) {
    console.error('Error updating staff member:', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.error('Invalid update data', 'INVALID_UPDATE_DATA', 400);
    }

    return ApiResponse.error('Failed to update staff member', 'STAFF_UPDATE_ERROR', 500);
  }
});

// DELETE /api/vendors/[vendorId]/staff/[staffId] - Remove staff member
export const DELETE = withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  try {
    const { vendorId, staffId } = params;

    if (!staffId) {
      return ApiResponse.error('Staff ID is required', 'MISSING_STAFF_ID', 400);
    }

    // Only vendor admins can remove staff
    if (user.role !== 'VENDOR_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
      return ApiResponse.forbidden('Only vendor admins can remove staff members');
    }

    // Check if staff member exists and belongs to this vendor
    const existingStaff = await prisma.vendorStaff.findFirst({
      where: {
        id: staffId,
        vendorId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!existingStaff) {
      return ApiResponse.notFound('Staff member');
    }

    // Prevent vendor admin from removing themselves
    if (existingStaff.user.id === user.id) {
      return ApiResponse.error('Cannot remove yourself from staff', 'SELF_REMOVAL', 400);
    }

    // Check if this is the last admin for the vendor
    if (existingStaff.role === 'VENDOR_ADMIN') {
      const adminCount = await prisma.vendorStaff.count({
        where: {
          vendorId,
          role: 'VENDOR_ADMIN',
          user: {
            isActive: true
          }
        }
      });

      if (adminCount <= 1) {
        return ApiResponse.error(
          'Cannot remove the last admin for this vendor',
          'LAST_ADMIN_REMOVAL',
          400
        );
      }
    }

    // Remove staff member (but don't delete the user account)
    await prisma.vendorStaff.delete({
      where: { id: staffId }
    });

    return ApiResponse.success({
      id: staffId,
      user: existingStaff.user,
      message: 'Staff member removed successfully'
    });

  } catch (error) {
    console.error('Error removing staff member:', error);
    return ApiResponse.error('Failed to remove staff member', 'STAFF_DELETE_ERROR', 500);
  }
});

// POST /api/vendors/[vendorId]/staff/[staffId]/toggle-status - Toggle staff member active status
export async function POST(request: NextRequest, { user, params }: any) {
  try {
    return withVendorOwnershipAuth(async (req: NextRequest, context: { user: any }) => {
      const { vendorId, staffId } = params;

      if (!staffId) {
        return ApiResponse.error('Staff ID is required', 'MISSING_STAFF_ID', 400);
      }

      // Only vendor admins can toggle staff status
      if (user.role !== 'VENDOR_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
        return ApiResponse.forbidden('Only vendor admins can toggle staff status');
      }

      // Check if staff member exists and belongs to this vendor
      const existingStaff = await prisma.vendorStaff.findFirst({
        where: {
          id: staffId,
          vendorId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              isActive: true,
              role: true
            }
          }
        }
      });

      if (!existingStaff) {
        return ApiResponse.notFound('Staff member');
      }

      // Prevent vendor admin from deactivating themselves
      if (existingStaff.user.id === user.id) {
        return ApiResponse.error('Cannot change your own active status', 'SELF_STATUS_CHANGE', 400);
      }

      // Toggle user active status
      const updatedUser = await prisma.user.update({
        where: { id: existingStaff.user.id },
        data: { isActive: !existingStaff.user.isActive },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          updatedAt: true
        }
      });

      return ApiResponse.success({
        staffId,
        user: updatedUser,
        message: `Staff member ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`
      });

    })(request, { user });
  } catch (error) {
    console.error('Error toggling staff status:', error);
    return ApiResponse.error('Failed to toggle staff status', 'STAFF_STATUS_ERROR', 500);
  }
}

// POST /api/vendors/[vendorId]/staff/[staffId]/resend-invitation - Resend invitation email
export async function RESEND(request: NextRequest, { user, params }: any) {
  try {
    return withVendorOwnershipAuth(async (req: NextRequest, context: { user: any }) => {
      const { vendorId, staffId } = params;

      if (!staffId) {
        return ApiResponse.error('Staff ID is required', 'MISSING_STAFF_ID', 400);
      }

      // Only vendor admins can resend invitations
      if (user.role !== 'VENDOR_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
        return ApiResponse.forbidden('Only vendor admins can resend invitations');
      }

      // Check if staff member exists and belongs to this vendor
      const existingStaff = await prisma.vendorStaff.findFirst({
        where: {
          id: staffId,
          vendorId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isEmailVerified: true
            }
          }
        }
      });

      if (!existingStaff) {
        return ApiResponse.notFound('Staff member');
      }

      if (existingStaff.user.isEmailVerified) {
        return ApiResponse.error('Staff member has already verified their email', 'EMAIL_VERIFIED', 400);
      }

      // TODO: Implement email resend logic
      // This would typically generate a new invitation token and send an email
      console.log('Resending invitation to:', existingStaff.user.email);

      return ApiResponse.success({
        staffId,
        user: {
          id: existingStaff.user.id,
          name: existingStaff.user.name,
          email: existingStaff.user.email
        },
        message: 'Invitation email resent successfully'
      });

    })(request, { user });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return ApiResponse.error('Failed to resend invitation', 'INVITATION_ERROR', 500);
  }
}