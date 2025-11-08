import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/authorize';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Query parameters schema for filtering vendors
const vendorsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).optional().default('all'),
  country: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'onboardedAt', 'venueCount', 'bookingCount']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  createdAfter: z.string().optional().transform(val => val ? new Date(val) : undefined),
  createdBefore: z.string().optional().transform(val => val ? new Date(val) : undefined),
  hasVenues: z.enum(['true', 'false', 'all']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined)
});

// GET /api/admin/vendors - List vendors with filters and pagination
export async function GET(request: NextRequest) {
  try {
    // Ensure user is admin
    const { user } = await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const query = vendorsQuerySchema.parse(Object.fromEntries(searchParams));

    const {
      page,
      limit,
      search,
      status,
      country,
      sortBy,
      sortOrder,
      createdAfter,
      createdBefore,
      hasVenues
    } = query;

    // Build where clause
    const where: any = {
      deletedAt: null // Exclude soft-deleted vendors
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } }
      ];
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
    let orderBy: any = {};

    if (sortBy === 'venueCount' || sortBy === 'bookingCount') {
      // These require custom sorting
      orderBy = { createdAt: 'desc' }; // Fallback sorting
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute main query
    const vendors = await db.vendor.findMany({
      where,
      include: {
        _count: {
          select: {
            venues: {
              where: hasVenues !== undefined ? { isActive: true } : undefined
            },
            vendorStaff: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    });

      // Simplified booking counts for each vendor
    const vendorIds = vendors.map(v => v.id);
    const bookingCountsByVendor: Record<string, number> = {};

    // Initialize booking counts to 0 for all vendors
    vendorIds.forEach(vendorId => {
      bookingCountsByVendor[vendorId] = 0;
    });

    // Transform the data
    const transformedVendors = vendors.map(vendor => ({
      ...vendor,
      stats: {
        venues: {
          total: vendor._count.venues,
          active: vendor._count.venues // Since we filtered by active above if hasVenues is specified
        },
        staff: vendor._count.vendorStaff,
        bookings: bookingCountsByVendor[vendor.id] || 0
      },
      _count: undefined // Remove _count from final response
    }));

    // Apply additional filtering if needed
    let filteredVendors = transformedVendors;
    if (hasVenues !== undefined) {
      filteredVendors = transformedVendors.filter(v =>
        hasVenues ? v.stats.venues.total > 0 : v.stats.venues.total === 0
      );
    }

    // Apply custom sorting if needed
    if (sortBy === 'venueCount') {
      filteredVendors.sort((a, b) => {
        const diff = b.stats.venues.total - a.stats.venues.total;
        return sortOrder === 'desc' ? diff : -diff;
      });
    } else if (sortBy === 'bookingCount') {
      filteredVendors.sort((a, b) => {
        const diff = b.stats.bookings - a.stats.bookings;
        return sortOrder === 'desc' ? diff : -diff;
      });
    }

    // Get total count for pagination
    const totalCount = await db.vendor.count({ where });

    // Pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Calculate summary statistics
    const summaryStats = {
      total: totalCount,
      active: filteredVendors.filter(v => v.isActive).length,
      pending: filteredVendors.filter(v => !v.isActive).length,
      suspended: 0, // TODO: Implement suspended status logic
      totalVenues: filteredVendors.reduce((sum, v) => sum + (v.stats?.venues?.total || 0), 0),
      totalRevenue: 0, // TODO: Calculate actual revenue
      pendingApplications: filteredVendors.filter(v => !v.isActive).length,
      growth: 12.3 // TODO: Calculate actual growth
    };

    return NextResponse.json({
      success: true,
      data: filteredVendors,
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
        status,
        country,
        sortBy,
        sortOrder,
        hasVenues
      },
      summary: summaryStats
    });

  } catch (error) {
    console.error('Error fetching vendors:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
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
      { error: 'Failed to fetch vendors', details: error.message },
      { status: 500 }
    );
  }
}

// Schema for vendor updates
const updateVendorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  phoneCountryCode: z.string().optional(), // Country calling code (e.g., "+1", "+91")
  phoneNumber: z.string().optional(),     // Local phone number without country code
  isActive: z.boolean().optional(),
  countryCode: z.string().length(2).optional(),
  currencyCode: z.string().length(3).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
});

// Schema for vendor creation
const createVendorSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phoneCountryCode: z.string().optional(), // Country calling code (e.g., "+1", "+91")
  phoneNumber: z.string().optional(),     // Local phone number without country code
  description: z.string().optional(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  country: z.string().optional(),
  isActive: z.boolean().default(true),
  password: z.string().min(6)
});

// POST /api/admin/vendors - Create new vendor
export async function POST(request: NextRequest) {
  try {
    // Ensure user is admin
    const { user } = await requireAdmin(request);

    const body = await request.json();
    const validatedData = createVendorSchema.parse(body);

    const {
      name,
      email,
      phoneCountryCode,
      phoneNumber,
      description,
      website,
      country,
      isActive,
      password
    } = validatedData;

    // Check if vendor email already exists (including soft-deleted)
    const existingVendor = await db.vendor.findFirst({
      where: { 
        email,
        deletedAt: null
      }
    });

    if (existingVendor) {
      return NextResponse.json(
        { error: 'Vendor with this email already exists' },
        { status: 409 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Combine phone number for user record
    const fullPhone = phoneCountryCode && phoneNumber ? `${phoneCountryCode}${phoneNumber.replace(/\D/g, '')}` : null;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create vendor and user in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create user first
      const newUser = await tx.user.create({
        data: {
          email,
          name,
          phone: fullPhone,
          role: 'VENDOR_ADMIN',
          isActive,
          password: hashedPassword,
          // Set default values for user fields
          isEmailVerified: true,
        }
      });

      // Create vendor linked to user
      const newVendor = await tx.vendor.create({
        data: {
          name,
          slug,
          email,
          phoneCountryCode,
          phoneNumber,
          description,
          website,
          isActive,
          // Set default values
          countryCode: country ? country.substring(0, 2).toUpperCase() : 'IN',
          currencyCode: 'INR',
          timezone: 'Asia/Kolkata',
          locale: 'en-IN',
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          accentColor: '#60A5FA',
        }
      });

      // Create vendor staff record linking user to vendor
      await tx.vendorStaff.create({
        data: {
          userId: newUser.id,
          vendorId: newVendor.id,
          role: 'VENDOR_ADMIN',
          isActive: true,
          permissions: 'ALL'
        }
      });

      return newVendor;
    });

    return NextResponse.json({
      success: true,
      data: {
        vendor: result,
        message: 'Vendor created successfully'
      }
    });

  } catch (error) {
    console.error('Error creating vendor:', error);

    if (error instanceof z.ZodError) {
      console.error('Zod validation error details:', JSON.stringify(error.errors, null, 2));
      return NextResponse.json(
        { error: 'Invalid vendor data', details: error.errors, message: 'Validation failed' },
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
      { error: 'Failed to create vendor', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/vendors - Bulk update vendors
export async function PUT(request: NextRequest) {
  try {
    // Ensure user is admin
    const { user } = await requireAdmin(request);

    const body = await request.json();
    const { vendorIds, updates } = body;

    if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return NextResponse.json(
        { error: 'Vendor IDs are required' },
        { status: 400 }
      );
    }

    const validatedUpdates = updateVendorSchema.parse(updates);

    // Update vendors
    const updatedVendors = await db.vendor.updateMany({
      where: {
        id: { in: vendorIds }
      },
      data: validatedUpdates
    });

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: updatedVendors.count,
        updates: validatedUpdates
      }
    });

  } catch (error) {
    console.error('Error updating vendors:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid update data', details: error.errors },
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
      { error: 'Failed to update vendors', details: error.message },
      { status: 500 }
    );
  }
}

