import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withVendorOwnershipAuth, ApiResponse } from '@/lib/auth/api-auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { withPerformanceTracking } from '@/lib/middleware/performance';

const prisma = new PrismaClient();

// Query parameters schema for filtering staff
const staffQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) || 1 : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 20, 100) : 20),
  search: z.string().optional(),
  role: z.enum(['VENDOR_ADMIN', 'VENDOR_STAFF']).optional(),
  status: z.enum(['active', 'inactive', 'all']).optional().default('all'),
  sortBy: z.enum(['name', 'email', 'role', 'hiredAt', 'lastLoginAt']).optional().default('hiredAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// Schema for creating staff (inviting new staff members)
const createStaffSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['VENDOR_ADMIN', 'VENDOR_STAFF']),
  phone: z.string().optional(),
  permissions: z.array(z.string()).optional() // For future permission system
});

// Schema for updating staff
const updateStaffSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['VENDOR_ADMIN', 'VENDOR_STAFF']).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.string()).optional()
});

// GET /api/vendors/[vendorId]/staff - List vendor staff
export const GET = withPerformanceTracking(
  withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
    try {
      const resolvedParams = params instanceof Promise ? await params : (params || {});
      const vendorId = resolvedParams.vendorId;
      
      const { searchParams } = new URL(request.url);
      const query = staffQuerySchema.parse(Object.fromEntries(searchParams));

      const {
        page,
        limit,
        search,
        role,
        status,
        sortBy,
        sortOrder
      } = query;

      if (!vendorId) {
        return ApiResponse.error('Vendor ID is required', 'MISSING_VENDOR_ID', 400);
      }

      if (user.role !== 'VENDOR_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
        return ApiResponse.forbidden('Only vendor admins can view staff management');
      }

      // OPTIMIZED FOR SQLITE: Avoid nested relation filters (very slow on SQLite)
      // Use database-level filters only for direct VendorStaff fields
      const where: any = { vendorId };

      if (role) {
        where.role = role;
      }

      // Build order clause - avoid nested relation sorting for SQLite
      const orderBy: any = {};
      if (sortBy === 'role' || sortBy === 'hiredAt') {
        orderBy[sortBy] = sortOrder || (sortBy === 'hiredAt' ? 'desc' : sortOrder);
      } else {
        orderBy.hiredAt = sortOrder || 'desc';
      }

      // OPTIMIZED: Fetch all staff matching vendorId/role (fast DB query, no nested filters)
      // Then filter user fields in memory (fast for typical staff sizes)
      const allStaff = await prisma.vendorStaff.findMany({
        where,
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
              updatedAt: true
            }
          }
        },
        orderBy
      });

      // Apply user-level filters in memory (fast for SQLite)
      let filteredStaff = allStaff;
      
      if (status !== 'all') {
        filteredStaff = filteredStaff.filter(s => 
          status === 'active' ? s.user.isActive : !s.user.isActive
        );
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredStaff = filteredStaff.filter(s => 
          s.user.name?.toLowerCase().includes(searchLower) ||
          s.user.email?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply user-level sorting in memory if needed
      if (sortBy === 'name' || sortBy === 'email' || sortBy === 'lastLoginAt') {
        filteredStaff.sort((a, b) => {
          const aVal = sortBy === 'lastLoginAt' 
            ? (a.user.lastLoginAt?.getTime() || 0)
            : (a.user[sortBy as keyof typeof a.user] || '').toString().toLowerCase();
          const bVal = sortBy === 'lastLoginAt'
            ? (b.user.lastLoginAt?.getTime() || 0)
            : (b.user[sortBy as keyof typeof b.user] || '').toString().toLowerCase();
          
          if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
          }
        });
      }

      // Calculate summary stats from fetched data (fast, no additional queries)
      const summaryStats = {
        total: allStaff.length,
        active: allStaff.filter(s => s.user.isActive).length,
        inactive: allStaff.filter(s => !s.user.isActive).length,
        admins: allStaff.filter(s => s.role === 'VENDOR_ADMIN').length,
        staff: allStaff.filter(s => s.role === 'VENDOR_STAFF').length,
        emailVerified: allStaff.filter(s => s.user.isEmailVerified).length
      };

      // Apply pagination after filtering
      const totalCount = filteredStaff.length;
      const skip = (page - 1) * limit;
      const paginatedStaff = filteredStaff.slice(skip, skip + limit);

      // Transform the data
      const finalStaff = paginatedStaff.map(staffMember => ({
        id: staffMember.id,
        user: {
          ...staffMember.user
        },
        role: staffMember.role,
        hiredAt: staffMember.hiredAt,
        createdAt: staffMember.user.createdAt,
        lastLoginAt: staffMember.user.lastLoginAt,
        isActive: staffMember.user.isActive,
        isEmailVerified: staffMember.user.isEmailVerified
      }));

      const totalPages = Math.ceil(totalCount / limit);

      return ApiResponse.success(finalStaff, {
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        },
        filters: {
          search,
          role,
          status,
          sortBy,
          sortOrder
        },
        summary: summaryStats
      });

    } catch (error) {
      console.error('Error fetching staff:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Unknown argument') || error.message.includes('does not exist')) {
          return ApiResponse.error('Invalid query parameters', 'INVALID_QUERY', 400);
        }
      }

      if (error instanceof z.ZodError) {
        return ApiResponse.error('Invalid query parameters', 'INVALID_QUERY', 400);
      }

      return ApiResponse.error('Failed to fetch staff', 'STAFF_ERROR', 500);
    }
  }),
  'GET /api/vendors/[vendorId]/staff'
);
export const POST = withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  try {
    // Resolve params (wrapper may pass Promise or resolved object)
    const resolvedParams = params instanceof Promise ? await params : (params || {});
    const vendorId = resolvedParams.vendorId;
    
    const body = await request.json();
    const staffData = createStaffSchema.parse(body);

    // Only vendor admins can add staff
    if (user.role !== 'VENDOR_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
      return ApiResponse.forbidden('Only vendor admins can add staff members');
    }

    // Check if user exists
    let existingUser = await prisma.user.findUnique({
      where: { email: staffData.email },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        vendorStaff: {
          select: {
            id: true,
            vendor: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    let userId: string;

    if (existingUser) {
      // Check if user is already staff for this vendor
      const existingStaff = existingUser.vendorStaff.find(vs => vs.vendor.id === vendorId);
      if (existingStaff) {
        return ApiResponse.error('User is already a staff member for this vendor', 'ALREADY_STAFF', 400);
      }

      // Check if user is staff for another vendor
      if (existingUser.vendorStaff.length > 0) {
        return ApiResponse.error('User is already associated with another vendor', 'ASSOCIATED_WITH_OTHER_VENDOR', 400);
      }

      userId = existingUser.id;
    } else {
      // Create new user (they will need to set their password)
      const tempPassword = Math.random().toString(36).slice(-8); // Generate temporary password
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const newUser = await prisma.user.create({
        data: {
          email: staffData.email,
          name: staffData.name,
          phone: staffData.phone,
          password: hashedPassword,
          role: staffData.role,
          isActive: true,
          isEmailVerified: false
        },
        select: {
          id: true,
          email: true,
          name: true
        }
      });

      userId = newUser.id;

      // TODO: Send invitation email with temporary password or reset link
      console.log('Temporary password for new user:', tempPassword);
    }

    // Add staff member to vendor
    const staffMember = await prisma.vendorStaff.create({
      data: {
        vendorId,
        userId,
        role: staffData.role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            isEmailVerified: true,
            createdAt: true
          }
        }
      }
    });

    return ApiResponse.success(staffMember, {
      message: existingUser
        ? 'Existing user added as staff member successfully'
        : 'New staff member created and invited successfully'
    });

  } catch (error) {
    console.error('Error adding staff member:', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.error('Invalid staff data', 'INVALID_STAFF_DATA', 400);
    }

    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return ApiResponse.error('Staff member already exists', 'STAFF_EXISTS', 400);
    }

    return ApiResponse.error('Failed to add staff member', 'STAFF_CREATE_ERROR', 500);
  }
});

// PUT /api/vendors/[vendorId]/staff - Bulk update staff
export const PUT = withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  try {
    // Resolve params (wrapper may pass Promise or resolved object)
    const resolvedParams = params instanceof Promise ? await params : (params || {});
    const vendorId = resolvedParams.vendorId;
    
    const body = await request.json();
    const { staffIds, updates } = body;

    // Only vendor admins can update staff
    if (user.role !== 'VENDOR_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
      return ApiResponse.forbidden('Only vendor admins can update staff members');
    }

    if (!staffIds || !Array.isArray(staffIds) || staffIds.length === 0) {
      return ApiResponse.error('Staff IDs are required', 'MISSING_STAFF_IDS', 400);
    }

    const validatedUpdates = updateStaffSchema.parse(updates);

    // Prevent vendor admin from changing their own role to lower privileges
    if (validatedUpdates.role && staffIds.includes(user.id)) {
      return ApiResponse.error('Cannot change your own role', 'SELF_ROLE_CHANGE', 400);
    }

    // Update staff members (ensure they belong to this vendor)
    const updatedStaff = await prisma.vendorStaff.updateMany({
      where: {
        id: { in: staffIds },
        vendorId
      },
      data: validatedUpdates
    });

    // If updating user fields, update those too
    if (validatedUpdates.name || validatedUpdates.phone || validatedUpdates.isActive !== undefined) {
      // Get user IDs for the staff members
      const staffMembers = await prisma.vendorStaff.findMany({
        where: {
          id: { in: staffIds },
          vendorId
        },
        select: { userId: true }
      });

      const userIds = staffMembers.map(s => s.userId);

      await prisma.user.updateMany({
        where: {
          id: { in: userIds }
        },
        data: {
          name: validatedUpdates.name,
          phone: validatedUpdates.phone,
          isActive: validatedUpdates.isActive
        }
      });
    }

    return ApiResponse.success({
      updatedCount: updatedStaff.count,
      updates: validatedUpdates
    });

  } catch (error) {
    console.error('Error updating staff:', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.error('Invalid update data', 'INVALID_UPDATE_DATA', 400);
    }

    return ApiResponse.error('Failed to update staff', 'STAFF_UPDATE_ERROR', 500);
  }
});