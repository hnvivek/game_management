import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withVendorOwnershipAuth, ApiResponse } from '@/lib/auth/api-auth';
import { z } from 'zod';

// Query parameters schema for filtering venues
const venuesQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).optional().default('all'),
  sportId: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'bookingCount', 'revenue']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  city: z.string().optional()
});

// Schema for creating venues
const createVenueSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  countryCode: z.string().optional(),
  currencyCode: z.string().optional(),
  timezone: z.string().optional(),
  featuredImage: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional().default(true)
});

// Schema for updating venues
const updateVenueSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  countryCode: z.string().length(2).optional(),
  currencyCode: z.string().length(3).optional(),
  timezone: z.string().optional(),
  featuredImage: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional()
});

// GET /api/vendors/[vendorId]/venues - List vendor's venues
export const GET = withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  try {
    // Resolve params (wrapper may pass Promise or resolved object)
    const resolvedParams = params instanceof Promise ? await params : (params || {});
    const vendorId = resolvedParams.vendorId;
    const { searchParams } = new URL(request.url);
    const query = venuesQuerySchema.parse(Object.fromEntries(searchParams));

    const {
      page,
      limit,
      search,
      status,
      sportId,
      sortBy,
      sortOrder,
      city
    } = query;

    // Build where clause
    const where: any = { 
      vendorId,
      deletedAt: null // Exclude soft-deleted venues
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status !== 'all') {
      where.isActive = status === 'active';
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (sportId) {
      where.courts = {
        some: { sportId }
      };
    }

    // Build order clause
    let orderBy: any = {};
    if (sortBy === 'bookingCount' || sortBy === 'revenue') {
      // These require custom sorting
      orderBy = { createdAt: 'desc' };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute main query
    const venues = await db.venue.findMany({
      where,
      include: {
        courts: {
          include: {
            sport: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            }
          }
        }
      },
      orderBy,
      skip,
      take: limit
    });

    // Calculate stats for each venue in parallel
    const venueStatsPromises = venues.map(async (venue) => {
      const [bookingStats, operatingHoursCount] = await Promise.all([
        // Booking stats (last 30 days) - query through court.venue relation
        db.booking.aggregate({
          where: {
            court: {
              venueId: venue.id
            },
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            },
            status: {
              in: ['CONFIRMED', 'COMPLETED']
            }
          },
          _count: {
            id: true
          },
          _sum: {
            totalAmount: true
          }
        }),
        // Operating hours count
        db.venueOperatingHours.count({
          where: {
            venueId: venue.id,
            isOpen: true
          }
        })
      ]);

      return {
        venueId: venue.id,
        bookings: bookingStats._count.id,
        revenue: Number(bookingStats._sum.totalAmount || 0),
        operatingHours: operatingHoursCount
      };
    });

    const venueStatsResults = await Promise.all(venueStatsPromises);
    const statsMap = new Map(venueStatsResults.map(s => [s.venueId, s]));

    // Transform the data
    const transformedVenues = venues.map(venue => {
      const stats = statsMap.get(venue.id) || {
        bookings: 0,
        revenue: 0,
        operatingHours: 0
      };

      return {
        ...venue,
        stats: {
          bookings: stats.bookings,
          revenue: stats.revenue,
          courts: venue.courts.length,
          operatingHours: stats.operatingHours
        },
        sports: [...new Map(venue.courts.map(court => [court.sport.id, court.sport])).values()], // Get unique sports
        courts: undefined // Remove detailed courts from response
      };
    });

    // Apply custom sorting if needed
    if (sortBy === 'bookingCount' || sortBy === 'revenue') {
      // For now, sort by name if booking/revenue sorting is requested
      transformedVenues.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Get total count for pagination
    const totalCount = await db.venue.count({ where });

    // Get summary statistics
    const summaryStats = {
      total: totalCount,
      active: transformedVenues.filter(v => v.isActive).length,
      inactive: transformedVenues.filter(v => !v.isActive).length,
      totalBookings: 0, // TODO: Calculate from bookings table when available
      totalRevenue: 0, // TODO: Calculate from bookings table when available
      totalCourts: transformedVenues.reduce((sum, v) => sum + v.stats.courts, 0)
    };

    // Pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return ApiResponse.success(transformedVenues, {
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
        sportId,
        city,
        sortBy,
        sortOrder
      },
      summary: summaryStats
    });

  } catch (error) {
    console.error('Error fetching venues:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      vendorId: vendorId || 'unknown',
      errorType: error?.constructor?.name,
      errorString: String(error)
    });

    if (error instanceof z.ZodError) {
      return ApiResponse.error('Invalid query parameters', 'INVALID_QUERY', 400);
    }

    // Return more detailed error in development
    if (process.env.NODE_ENV === 'development') {
      return ApiResponse.error(
        `Failed to fetch venues: ${error instanceof Error ? error.message : String(error)}`,
        'VENUES_ERROR',
        500
      );
    }

    return ApiResponse.error('Failed to fetch venues', 'VENUES_ERROR', 500);
  }
});

// POST /api/vendors/[vendorId]/venues - Create new venue
export const POST = withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  try {
    // Resolve params (Next.js 15 passes params as Promise)
    const resolvedParams = params instanceof Promise ? await params : (params || {});
    const vendorId = resolvedParams.vendorId;
    const body = await request.json();
    const venueData = createVenueSchema.parse(body);

    // Verify vendor exists and is active
    const vendor = await db.vendor.findFirst({
      where: { 
        id: vendorId,
        deletedAt: null
      },
      select: { id: true, isActive: true, currencyCode: true, countryCode: true, timezone: true }
    });

    if (!vendor) {
      return ApiResponse.notFound('Vendor');
    }

    if (!vendor.isActive && user.role !== 'PLATFORM_ADMIN') {
      return ApiResponse.error('Cannot create venues for inactive vendor', 'VENDOR_INACTIVE', 403);
    }

    // Default to vendor's currency/country/timezone if not provided
    const venueDataWithDefaults = {
      ...venueData,
      currencyCode: venueData.currencyCode || vendor.currencyCode,
      countryCode: venueData.countryCode || vendor.countryCode,
      timezone: venueData.timezone || vendor.timezone,
    };

    // Create venue
    const venue = await db.venue.create({
      data: {
        ...venueDataWithDefaults,
        vendorId
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            courts: true,
            operatingHours: true
          }
        }
      }
    });

    return ApiResponse.success(venue, {
      message: 'Venue created successfully'
    });

  } catch (error) {
    console.error('Error creating venue:', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.error('Invalid venue data', 'INVALID_VENUE_DATA', 400);
    }

    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return ApiResponse.error('Venue with this name already exists for this vendor', 'VENUE_NAME_EXISTS', 400);
    }

    return ApiResponse.error('Failed to create venue', 'VENUE_CREATE_ERROR', 500);
  }
});

// PUT /api/vendors/[vendorId]/venues - Bulk update venues
export const PUT = withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  try {
    // Resolve params (Next.js 15 passes params as Promise)
    const resolvedParams = params instanceof Promise ? await params : (params || {});
    const vendorId = resolvedParams.vendorId;
    const body = await request.json();
    const { venueIds, updates } = body;

    if (!venueIds || !Array.isArray(venueIds) || venueIds.length === 0) {
      return ApiResponse.error('Venue IDs are required', 'MISSING_VENUE_IDS', 400);
    }

    const validatedUpdates = updateVenueSchema.parse(updates);

    // Update venues (ensure they belong to this vendor)
    const updatedVenues = await db.venue.updateMany({
      where: {
        id: { in: venueIds },
        vendorId // Ensure venues belong to this vendor
      },
      data: validatedUpdates
    });

    return ApiResponse.success({
      updatedCount: updatedVenues.count,
      updates: validatedUpdates
    });

  } catch (error) {
    console.error('Error updating venues:', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.error('Invalid update data', 'INVALID_UPDATE_DATA', 400);
    }

    return ApiResponse.error('Failed to update venues', 'VENUES_UPDATE_ERROR', 500);
  }
});