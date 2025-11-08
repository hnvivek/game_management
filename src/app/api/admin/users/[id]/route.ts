import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth, ApiResponse } from '@/lib/auth/api-auth';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema for user updates
const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^[+]?[0-9]{10,15}$/).optional().nullable(),
  role: z.enum(['CUSTOMER', 'VENDOR_ADMIN', 'VENDOR_STAFF', 'PLATFORM_ADMIN']).optional(),
  isActive: z.boolean().optional(),
  isEmailVerified: z.boolean().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().length(2).optional().nullable(),
  currencyCode: z.string().length(3).optional().nullable(),
  timezone: z.string().optional().nullable(),
  locale: z.string().optional().nullable()
});

// GET /api/admin/users/[id] - Get user details
export const GET = withAdminAuth(async (request: NextRequest, { user, params }) => {
  try {
    const userId = params.id;

    if (!userId) {
      return ApiResponse.error('User ID is required', 'MISSING_USER_ID', 400);
    }

    const foundUser = await prisma.user.findFirst({
      where: { 
        id: userId,
        deletedAt: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: true,
        city: true,
        state: true,
        country: true,
        countryCode: true,
        currencyCode: true,
        timezone: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            bookings: true,
            teamMembers: true
          }
        },
        vendorStaff: {
          select: {
            id: true,
            role: true,
            vendor: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
                createdAt: true
              }
            }
          }
        },
        teamMembers: {
          select: {
            id: true,
            role: true,
            team: {
              select: {
                id: true,
                name: true,
                sport: {
                  select: {
                    name: true,
                    displayName: true
                  }
                }
              }
            }
          }
        },
        bookings: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            totalAmount: true,
            court: {
              select: {
                id: true,
                name: true,
                venue: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                sport: {
                  select: {
                    name: true,
                    displayName: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!foundUser) {
      return ApiResponse.notFound('User');
    }

    // Transform the data for better API response
    const transformedUser = {
      ...foundUser,
      vendorInfo: foundUser.vendorStaff[0] || null,
      teamInfo: foundUser.teamMembers,
      recentActivity: foundUser.bookings.map(booking => ({
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        totalAmount: booking.totalAmount,
        venue: booking.court.venue,
        sport: booking.court.sport
      })),
      stats: {
        bookings: foundUser._count.bookings,
        matches: 0, // Not available in current schema
        tournaments: 0, // Not available in current schema
        teams: foundUser._count.teamMembers,
        teamInvitesSent: 0, // Not available in current schema
        teamInvitesReceived: 0, // Not available in current schema
        payments: 0, // Not available as relation in current schema
        playerSkills: 0, // Not available in current schema
        matchResultsSubmitted: 0, // Not available in current schema
        matchResultsVerified: 0, // Not available in current schema
        playerStatsContributed: 0, // Not available in current schema
        playerStatsVerified: 0 // Not available in current schema
      }
    };

    // Remove the nested objects that are now in transformed properties
    delete (transformedUser as any).vendorStaff;
    delete (transformedUser as any).teamMembers;
    delete (transformedUser as any).bookings;
    delete (transformedUser as any)._count;

    return ApiResponse.success(transformedUser);

  } catch (error) {
    console.error('Error fetching user details:', error);
    return ApiResponse.error('Failed to fetch user details', 'USER_ERROR', 500);
  }
});

// PUT /api/admin/users/[id] - Update user
export const PUT = withAdminAuth(async (request: NextRequest, { user, params }) => {
  try {
    const userId = params.id;
    const body = await request.json();
    const updates = updateUserSchema.parse(body);

    if (!userId) {
      return ApiResponse.error('User ID is required', 'MISSING_USER_ID', 400);
    }

    // Don't allow users to update themselves
    if (userId === user.id) {
      return ApiResponse.error('Cannot update your own account through admin API', 'SELF_UPDATE', 403);
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { 
        id: userId,
        deletedAt: null
      },
      select: { id: true, email: true, role: true }
    });

    if (!existingUser) {
      return ApiResponse.notFound('User');
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        city: true,
        state: true,
        country: true,
        countryCode: true,
        currencyCode: true,
        timezone: true,
        locale: true,
        updatedAt: true
      }
    });

    return ApiResponse.success(updatedUser);

  } catch (error) {
    console.error('Error updating user:', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.error('Invalid update data', 'INVALID_UPDATE_DATA', 400);
    }

    return ApiResponse.error('Failed to update user', 'USER_UPDATE_ERROR', 500);
  }
});

// DELETE /api/admin/users/[id] - Deactivate user (soft delete)
export const DELETE = withAdminAuth(async (request: NextRequest, { user, params }) => {
  try {
    const userId = params.id;

    if (!userId) {
      return ApiResponse.error('User ID is required', 'MISSING_USER_ID', 400);
    }

    // Don't allow users to deactivate themselves
    if (userId === user.id) {
      return ApiResponse.error('Cannot deactivate your own account', 'SELF_DEACTIVATION', 403);
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { 
        id: userId,
        deletedAt: null
      },
      select: { id: true, email: true, role: true, isActive: true }
    });

    if (!existingUser) {
      return ApiResponse.notFound('User');
    }

    if (!existingUser.isActive) {
      return ApiResponse.error('User is already deactivated', 'ALREADY_DEACTIVATED', 400);
    }

    // Soft delete user by setting deletedAt timestamp
    const deactivatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        deletedAt: new Date(),
        isActive: false // Also deactivate for backward compatibility
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    return ApiResponse.success(deactivatedUser, {
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Error deactivating user:', error);
    return ApiResponse.error('Failed to deactivate user', 'USER_DEACTIVATION_ERROR', 500);
  }
});

// POST /api/admin/users/[id]/reactivate - Reactivate deactivated user
export async function POST(request: NextRequest, { user, params }: any) {
  try {
    return withAdminAuth(async (req: NextRequest, context: { user: any }) => {
      const userId = params.id;

      if (!userId) {
        return ApiResponse.error('User ID is required', 'MISSING_USER_ID', 400);
      }

      // Check if user exists and is deactivated
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, isActive: true }
      });

      if (!existingUser) {
        return ApiResponse.notFound('User');
      }

      if (existingUser.isActive) {
        return ApiResponse.error('User is already active', 'ALREADY_ACTIVE', 400);
      }

      // Reactivate user
      const reactivatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          updatedAt: true
        }
      });

      return ApiResponse.success(reactivatedUser, {
        message: 'User reactivated successfully'
      });
    })(request, { user });
  } catch (error) {
    console.error('Error reactivating user:', error);
    return ApiResponse.error('Failed to reactivate user', 'USER_REACTIVATION_ERROR', 500);
  }
}