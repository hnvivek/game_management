import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth/authorize';
import { z } from 'zod';

const prisma = new PrismaClient();

// Query parameters schema for filtering
const usersQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  search: z.string().optional(),
  role: z.enum(['CUSTOMER', 'VENDOR_ADMIN', 'VENDOR_STAFF', 'PLATFORM_ADMIN']).optional(),
  status: z.enum(['active', 'inactive', 'all']).optional().default('all'),
  sortBy: z.enum(['name', 'email', 'createdAt', 'lastLoginAt', 'role']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  country: z.string().optional(),
  createdAfter: z.string().optional().transform(val => val ? new Date(val) : undefined),
  createdBefore: z.string().optional().transform(val => val ? new Date(val) : undefined)
});

// GET /api/admin/users - List users with filters and pagination
export async function GET(request: NextRequest) {
  try {
    // Ensure user is admin
    const { user } = await requireAdmin(request);
    console.log('Admin users API called - User:', user.name, user.email, user.role);
    const { searchParams } = new URL(request.url);
    const query = usersQuerySchema.parse(Object.fromEntries(searchParams));

    const {
      page,
      limit,
      search,
      role,
      status,
      sortBy,
      sortOrder,
      country,
      createdAfter,
      createdBefore
    } = query;

    // Build where clause
    const where: any = {
      deletedAt: null // Exclude soft-deleted users
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status !== 'all') {
      where.isActive = status === 'active';
    }

    if (country) {
      where.countryCode = country;
    }

    if (createdAfter || createdBefore) {
      where.createdAt = {};
      if (createdAfter) where.createdAt.gte = createdAfter;
      if (createdBefore) where.createdAt.lte = createdBefore;
    }

    // Build order clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries in parallel
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
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
              vendor: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    // Transform the data
    const transformedUsers = users.map(user => ({
      ...user,
      vendorInfo: user.vendorStaff[0]?.vendor || null,
      stats: {
        bookings: user._count.bookings,
        matches: 0, // Not available in current schema
        tournaments: 0, // Not available in current schema
        teams: user._count.teamMembers,
        payments: 0 // Not available as relation in current schema
      },
      vendorStaff: undefined // Remove vendorStaff from final response
    }));

    // Pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      data: transformedUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPreviousPage
      },
      filters: {
        search,
        role,
        status,
        country,
        sortBy,
        sortOrder
      }
    });

  } catch (error: unknown) {
    console.error('Error fetching users:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Schema for user updates
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(['CUSTOMER', 'VENDOR_ADMIN', 'VENDOR_STAFF', 'PLATFORM_ADMIN']).optional(),
  isActive: z.boolean().optional(),
  isEmailVerified: z.boolean().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().length(2).optional(),
  currencyCode: z.string().length(3).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional()
});

// PUT /api/admin/users - Bulk update users (for admin actions)
export async function PUT(request: NextRequest) {
  try {
    // Ensure user is admin
    const { user } = await requireAdmin(request);

    const body = await request.json();
    const { userIds, updates } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs are required' },
        { status: 400 }
      );
    }

    const validatedUpdates = updateUserSchema.parse(updates);

    // Don't allow admins to deactivate themselves
    if (validatedUpdates.isActive === false && userIds.includes(user.id)) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Don't allow admins to change their own role
    if (validatedUpdates.role && userIds.includes(user.id)) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Update users
    const updatedUsers = await prisma.user.updateMany({
      where: {
        id: { in: userIds }
      },
      data: validatedUpdates
    });

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: updatedUsers.count,
        updates: validatedUpdates
      }
    });

  } catch (error: unknown) {
    console.error('Error updating users:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid update data', details: error.issues },
        { status: 400 }
      );
    }

    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}