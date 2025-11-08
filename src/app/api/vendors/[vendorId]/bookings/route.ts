import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, BookingStatus } from '@prisma/client';
import { withVendorOwnershipAuth, ApiResponse } from '@/lib/auth/api-auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withPerformanceTracking } from '@/lib/middleware/performance';

const prisma = new PrismaClient();

// Query parameters schema for filtering bookings
const bookingsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  search: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  type: z.enum(['ONE_TIME', 'RECURRING', 'TOURNAMENT', 'MATCH', 'TRAINING']).optional(),
  venueId: z.string().optional(),
  courtId: z.string().optional(),
  sportId: z.string().optional(),
  userId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'startTime', 'endTime', 'totalAmount', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  dateFrom: z.string().optional().transform(val => val ? new Date(val) : undefined),
  dateTo: z.string().optional().transform(val => val ? new Date(val) : undefined),
  minAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'REFUNDED', 'FAILED', 'CANCELLED', 'PROCESSING']).optional(),
  todayOnly: z.string().optional().transform(val => val === 'true'),
  thisWeek: z.string().optional().transform(val => val === 'true')
});

// Schema for updating booking status
const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
  notes: z.string().optional(),
  cancellationReason: z.string().optional()
});

// GET /api/vendors/[vendorId]/bookings - List vendor's bookings
export const GET = withPerformanceTracking(
  withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  try {
    const resolvedParams = await params;
    const vendorId = resolvedParams.vendorId;
    const { searchParams } = new URL(request.url);
    const query = bookingsQuerySchema.parse(Object.fromEntries(searchParams));

    const {
      page,
      limit,
      search,
      status,
      type,
      venueId,
      courtId,
      sportId,
      userId,
      sortBy,
      sortOrder,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      paymentStatus,
      todayOnly,
      thisWeek
    } = query;

    // Get vendor info with currency
    const vendor = await db.vendor.findFirst({
      where: { 
        id: vendorId,
        deletedAt: null
      },
      select: {
        id: true,
        currencyCode: true
      }
    });

    // Build where clause
    const where: any = {
      court: {
        venue: { 
          vendorId,
          deletedAt: null // Exclude soft-deleted venues
        }
      }
    };

    if (search) {
      // OPTIMIZED: SQLite doesn't support case-insensitive mode, so we'll filter in memory
      // But still use database-level filtering for exact matches
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { court: { venue: { name: { contains: search } } } },
        { court: { sport: { name: { contains: search } } } },
        { court: { sport: { displayName: { contains: search } } } },
        { notes: { contains: search } }
      ];
    }

    if (status) {
      where.status = status;
    }

    // Note: type field doesn't exist in Booking model - removed filter

    // Handle venue, court, and sport filters - they can work together
    if (venueId || courtId || sportId) {
      // Start with base venue filter
      const courtFilter: any = {
        venue: {
          vendorId,
          deletedAt: null
        }
      }
      
      // Add court ID filter if provided
      if (courtId) {
        courtFilter.id = courtId
      }
      
      // Add sport ID filter if provided
      if (sportId) {
        courtFilter.sportId = sportId
      }
      
      // Add venue ID filter if provided
      if (venueId) {
        courtFilter.venue = {
          ...courtFilter.venue,
          id: venueId
        }
      }
      
      where.court = courtFilter
    }

    if (userId) {
      where.userId = userId;
    }

    // Date filtering
    if (todayOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      where.startTime = {
        gte: today,
        lt: tomorrow
      };
    } else if (thisWeek) {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      where.startTime = {
        gte: startOfWeek,
        lt: endOfWeek
      };
    } else if (dateFrom || dateTo) {
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

    // Build order clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // OPTIMIZED: Execute main query and count in parallel
    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,
          totalAmount: true,
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
          court: {
            select: {
              id: true,
              name: true,
              venue: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true,
                  phone: true,
                  timezone: true
                }
              },
              sport: {
                select: {
                  id: true,
                  name: true,
                  displayName: true
                }
              }
            }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              method: true,
              transactionId: true,
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
      }),
      prisma.booking.count({ where })
    ]);

    // Apply case-insensitive search filter if needed (SQLite limitation)
    let filteredBookings = bookings;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBookings = bookings.filter(booking =>
        booking.user.name?.toLowerCase().includes(searchLower) ||
        booking.user.email?.toLowerCase().includes(searchLower) ||
        booking.court.venue.name?.toLowerCase().includes(searchLower) ||
        booking.court.sport.name?.toLowerCase().includes(searchLower) ||
        booking.court.sport.displayName?.toLowerCase().includes(searchLower) ||
        booking.notes?.toLowerCase().includes(searchLower)
      );
    }

    // OPTIMIZED: Calculate summary statistics in parallel, reuse where clause
    const baseWhere = {
      court: {
        venue: { 
          vendorId,
          deletedAt: null
        }
      }
    };

    const [statusBreakdown, revenueStats, todayStats, upcomingBookings] = await Promise.all([
      // Status breakdown
      prisma.booking.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
        _sum: { totalAmount: true }
      }),

      // Revenue statistics
      prisma.booking.aggregate({
        where: {
          ...where,
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _sum: { totalAmount: true },
        _count: { id: true }
      }),

      // Today's statistics
      prisma.booking.aggregate({
        where: {
          ...baseWhere,
          startTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        },
        _count: { id: true },
        _sum: { totalAmount: true }
      }),

      // Upcoming bookings (next 7 days)
      prisma.booking.aggregate({
        where: {
          ...baseWhere,
          startTime: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          },
          status: { in: ['PENDING', 'CONFIRMED'] }
        },
        _count: { id: true }
      })
    ]);

    // Transform the data
    const transformedBookings = filteredBookings.map(booking => ({
      ...booking,
      venue: booking.court.venue, // Extract venue from court
      court: {
        id: booking.court.id,
        name: booking.court.name,
        sport: booking.court.sport
      },
      paymentInfo: {
        totalPaid: booking.payments.reduce((sum, payment) =>
          payment.status === 'COMPLETED' ? sum + Number(payment.amount) : sum, 0),
        status: booking.payments.length > 0 ? booking.payments[0].status : 'PENDING',
        paymentCount: booking._count.payments
      },
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
        venueId,
        sportId,
        userId,
        sortBy,
        sortOrder,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        paymentStatus,
        todayOnly,
        thisWeek
      },
      summary: {
        totalBookings: totalCount,
        totalRevenue: Number(revenueStats._sum.totalAmount || 0),
        confirmedBookings: revenueStats._count.id,
        todayStats: {
          bookings: todayStats._count.id,
          revenue: Number(todayStats._sum.totalAmount || 0)
        },
        upcomingBookings: upcomingBookings._count.id,
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item.status] = {
            count: item._count.id,
            revenue: Number(item._sum.totalAmount || 0)
          };
          return acc;
        }, {} as Record<string, { count: number; revenue: number }>),
        typeBreakdown: {} // Removed as Booking model doesn't have type field
      },
      vendor: {
        currencyCode: vendor?.currencyCode || 'INR'
      }
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.error('Invalid query parameters', 'INVALID_QUERY', 400);
    }

    return ApiResponse.error('Failed to fetch bookings', 'BOOKINGS_ERROR', 500);
  }
}),
'GET /api/vendors/[vendorId]/bookings'
);

// PUT /api/vendors/[vendorId]/bookings - Bulk update bookings
export const PUT = withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  try {
    const resolvedParams = await params;
    const vendorId = resolvedParams.vendorId;
    const body = await request.json();
    const { bookingIds, updates } = body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return ApiResponse.error('Booking IDs are required', 'MISSING_BOOKING_IDS', 400);
    }

    const validatedUpdates = updateBookingSchema.parse(updates);

    // Verify all bookings belong to this vendor
    const vendorBookings = await prisma.booking.findMany({
      where: {
        id: { in: bookingIds },
        court: {
          venue: { 
            vendorId,
            deletedAt: null // Exclude soft-deleted venues
          }
        }
      },
      select: { id: true, status: true }
    });

    if (vendorBookings.length !== bookingIds.length) {
      return ApiResponse.error(
        'Some bookings do not belong to this vendor',
        'INVALID_BOOKING_OWNERSHIP',
        403
      );
    }

    // Validate status transitions
    for (const booking of vendorBookings) {
      if (!isValidStatusTransition(booking.status, validatedUpdates.status)) {
        return ApiResponse.error(
          `Invalid status transition from ${booking.status} to ${validatedUpdates.status}`,
          'INVALID_STATUS_TRANSITION',
          400
        );
      }
    }

    // Update bookings
    const updatedBookings = await prisma.booking.updateMany({
      where: {
        id: { in: bookingIds },
        court: {
          venue: { 
            vendorId,
            deletedAt: null // Exclude soft-deleted venues
          }
        }
      },
      data: {
        status: validatedUpdates.status as BookingStatus,
        notes: validatedUpdates.cancellationReason 
          ? `${validatedUpdates.notes || ''}\nCancellation reason: ${validatedUpdates.cancellationReason}`.trim()
          : validatedUpdates.notes
      }
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

// Helper function to validate status transitions
function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  const validTransitions: Record<string, string[]> = {
    'PENDING': ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED': ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
    'CANCELLED': ['PENDING'], // Allow re-activation
    'COMPLETED': [], // No changes allowed after completion
    'NO_SHOW': ['CANCELLED']
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}