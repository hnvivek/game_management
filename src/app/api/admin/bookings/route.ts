import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth, ApiResponse } from '@/lib/auth/api-auth';
import { z } from 'zod';

const prisma = new PrismaClient();

// Query parameters schema for filtering bookings
const bookingsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  search: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  type: z.enum(['ONE_TIME', 'RECURRING', 'TOURNAMENT', 'MATCH', 'TRAINING']).optional(),
  vendorId: z.string().optional(),
  venueId: z.string().optional(),
  userId: z.string().optional(),
  sportId: z.string().optional(),
  country: z.string().optional(),
  sortBy: z.enum(['createdAt', 'startTime', 'endTime', 'totalAmount', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  dateFrom: z.string().optional().transform(val => val ? new Date(val) : undefined),
  dateTo: z.string().optional().transform(val => val ? new Date(val) : undefined),
  minAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  paymentStatus: z.enum(['PENDING', 'PAID', 'REFUNDED', 'PARTIALLY_REFUNDED']).optional()
});

// GET /api/admin/bookings - List all bookings across platform with advanced filters
export const GET = withAdminAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = bookingsQuerySchema.parse(Object.fromEntries(searchParams));

    const {
      page,
      limit,
      search,
      status,
      type,
      vendorId,
      venueId,
      userId,
      sportId,
      country,
      sortBy,
      sortOrder,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      paymentStatus
    } = query;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { venue: { name: { contains: search, mode: 'insensitive' } } },
        { sport: { name: { contains: search, mode: 'insensitive' } } },
        { sport: { displayName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (vendorId) {
      where.venue = { vendorId };
    }

    if (venueId) {
      where.venueId = venueId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (sportId) {
      where.sportId = sportId;
    }

    if (dateFrom || dateTo) {
      where.startTime = {};
      if (dateFrom) where.startTime.gte = dateFrom;
      if (dateTo) where.startTime.lte = dateTo;
    }

    if (minAmount || maxAmount) {
      where.totalAmount = {};
      if (minAmount) where.totalAmount.gte = minAmount;
      if (maxAmount) where.totalAmount.lte = maxAmount;
    }

    if (paymentStatus) {
      where.payments = {
        some: {
          status: paymentStatus
        }
      };
    }

    // Additional country filtering through venue
    if (country) {
      where.venue = {
        ...where.venue,
        vendor: {
          countryCode: country
        }
      };
    }

    // Build order clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute main query
    const bookings = await prisma.booking.findMany({
      where,
      select: {
        id: true,
        type: true,
        startTime: true,
        endTime: true,
        status: true,
        totalAmount: true,
        currencyCode: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
            vendor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        sport: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            currencyCode: true,
            paymentMethod: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            payments: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.booking.count({ where });

    // Calculate summary statistics
    const [statusBreakdown, typeBreakdown, revenueByPeriod, topVenues, topSports, topCustomers] = await Promise.all([
      // Status breakdown
      prisma.booking.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true
        },
        _sum: {
          totalAmount: true
        }
      }),

      // Type breakdown
      prisma.booking.groupBy({
        by: ['type'],
        where,
        _count: {
          id: true
        },
        _sum: {
          totalAmount: true
        }
      }),

      // Revenue by period (last 30 days)
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('day', startTime) as date,
          COUNT(*) as booking_count,
          COALESCE(SUM(totalAmount), 0) as revenue
        FROM bookings
        WHERE
          startTime >= NOW() - INTERVAL '30 days'
          AND status IN ('CONFIRMED', 'COMPLETED')
          ${vendorId ? `AND venueId IN (SELECT id FROM venues WHERE vendorId = ${vendorId})` : ''}
          ${dateFrom ? `AND startTime >= ${dateFrom.toISOString()}` : ''}
          ${dateTo ? `AND startTime <= ${dateTo.toISOString()}` : ''}
        GROUP BY DATE_TRUNC('day', startTime)
        ORDER BY date DESC
        LIMIT 30
      ` as Array<{ date: Date; booking_count: number; revenue: bigint }>,

      // Top venues by bookings
      prisma.venue.findMany({
        where: { 
          ...(vendorId ? { vendorId } : {}),
          deletedAt: null // Exclude soft-deleted venues
        },
        select: {
          id: true,
          name: true,
          vendor: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              bookings: {
                where: {
                  status: { in: ['CONFIRMED', 'COMPLETED'] }
                }
              }
            }
          }
        },
        orderBy: {
          bookings: {
            _count: 'desc'
          }
        },
        take: 10
      }),

      // Top sports by bookings
      prisma.sport.findMany({
        select: {
          id: true,
          name: true,
          displayName: true,
          _count: {
            select: {
              bookings: {
                where: {
                  status: { in: ['CONFIRMED', 'COMPLETED'] }
                }
              }
            }
          }
        },
        orderBy: {
          bookings: {
            _count: 'desc'
          }
        },
        take: 10
      }),

      // Top customers by bookings
      prisma.user.findMany({
        where: {
          bookings: {
            some: {
              status: { in: ['CONFIRMED', 'COMPLETED'] }
            }
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          _count: {
            select: {
              bookings: {
                where: {
                  status: { in: ['CONFIRMED', 'COMPLETED'] }
                }
              }
            }
          }
        },
        orderBy: {
          bookings: {
            _count: 'desc'
          }
        },
        take: 10
      })
    ]);

    // Calculate total revenue from filtered bookings
    const totalRevenue = await prisma.booking.aggregate({
      where: {
        ...where,
        status: { in: ['CONFIRMED', 'COMPLETED'] }
      },
      _sum: {
        totalAmount: true
      }
    });

    // Transform the data
    const transformedBookings = bookings.map(booking => ({
      ...booking,
      paymentInfo: {
        totalPaid: booking.payments.reduce((sum, payment) =>
          payment.status === 'PAID' ? sum + Number(payment.amount) : sum, 0),
        status: booking.payments.length > 0 ? booking.payments[0].status : 'PENDING',
        paymentCount: booking._count.payments
      },
      vendorInfo: booking.venue?.vendor || null,
      payments: undefined,
      _count: undefined // Remove _count from final response
    }));

    // Pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return ApiResponse.success(transformedBookings, {
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
        type,
        vendorId,
        venueId,
        userId,
        sportId,
        country,
        sortBy,
        sortOrder,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        paymentStatus
      },
      summary: {
        totalBookings: totalCount,
        totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item.status] = {
            count: item._count.id,
            revenue: Number(item._sum.totalAmount || 0)
          };
          return acc;
        }, {} as Record<string, { count: number; revenue: number }>),
        typeBreakdown: typeBreakdown.reduce((acc, item) => {
          acc[item.type] = {
            count: item._count.id,
            revenue: Number(item._sum.totalAmount || 0)
          };
          return acc;
        }, {} as Record<string, { count: number; revenue: number }>),
        revenueTrend: (revenueByPeriod || []).map(item => ({
          date: item.date,
          bookingCount: item.booking_count,
          revenue: Number(item.revenue)
        })),
        topVenues: topVenues.map(venue => ({
          ...venue,
          bookingCount: venue._count.bookings
        })),
        topSports: topSports.map(sport => ({
          ...sport,
          bookingCount: sport._count.bookings
        })),
        topCustomers: topCustomers.map(customer => ({
          ...customer,
          bookingCount: customer._count.bookings
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.error('Invalid query parameters', 'INVALID_QUERY', 400);
    }

    return ApiResponse.error('Failed to fetch bookings', 'BOOKINGS_ERROR', 500);
  }
});

// Schema for bulk booking updates
const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  notes: z.string().optional()
});

// PUT /api/admin/bookings - Bulk update bookings
export const PUT = withAdminAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json();
    const { bookingIds, updates } = body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return ApiResponse.error('Booking IDs are required', 'MISSING_BOOKING_IDS', 400);
    }

    const validatedUpdates = updateBookingSchema.parse(updates);

    // Update bookings
    const updatedBookings = await prisma.booking.updateMany({
      where: {
        id: { in: bookingIds }
      },
      data: validatedUpdates
    });

    return ApiResponse.success({
      updatedCount: updatedBookings.count,
      updates: validatedUpdates
    });

  } catch (error) {
    console.error('Error updating bookings:', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.error('Invalid update data', 'INVALID_UPDATE_DATA', 400);
    }

    return ApiResponse.error('Failed to update bookings', 'BOOKINGS_UPDATE_ERROR', 500);
  }
});