import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth, ApiResponse } from '@/lib/auth/api-auth';
import { z } from 'zod';

const prisma = new PrismaClient();

// Query parameters schema for analytics
const analyticsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y', 'all']).optional().default('30d'),
  metric: z.enum(['revenue', 'users', 'bookings', 'vendors', 'venues']).optional(),
  groupBy: z.enum(['day', 'week', 'month', 'year']).optional().default('day'),
  vendorId: z.string().optional(),
  country: z.string().optional(),
  sportId: z.string().optional()
});

// GET /api/admin/analytics - Comprehensive platform analytics
export const GET = withAdminAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = analyticsQuerySchema.parse(Object.fromEntries(searchParams));

    const { period, metric, groupBy, vendorId, country, sportId } = query;

    // Calculate date ranges
    const now = new Date();
    let dateFrom: Date;
    let dateTo: Date = new Date(now);

    switch (period) {
      case '7d':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        dateFrom = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'all':
        dateFrom = new Date(0); // Beginning of time
        break;
      default:
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build base where clause
    const baseWhere: any = {};
    if (vendorId) {
      baseWhere.vendorId = vendorId;
    }
    if (country) {
      baseWhere.countryCode = country;
    }

    // Execute all analytics queries in parallel
    const [
      revenueAnalytics,
      userAnalytics,
      bookingAnalytics,
      vendorAnalytics,
      venueAnalytics,
      sportAnalytics,
      geographicAnalytics,
      performanceMetrics
    ] = await Promise.all([
      // Revenue Analytics
      getRevenueAnalytics(dateFrom, dateTo, groupBy, baseWhere),

      // User Analytics
      getUserAnalytics(dateFrom, dateTo, groupBy, baseWhere),

      // Booking Analytics
      getBookingAnalytics(dateFrom, dateTo, groupBy, sportId, baseWhere),

      // Vendor Analytics
      getVendorAnalytics(dateFrom, dateTo, groupBy, baseWhere),

      // Venue Analytics
      getVenueAnalytics(dateFrom, dateTo, groupBy, baseWhere),

      // Sport Analytics
      getSportAnalytics(dateFrom, dateTo, baseWhere),

      // Geographic Analytics
      getGeographicAnalytics(dateFrom, dateTo, baseWhere),

      // Performance Metrics
      getPerformanceMetrics(dateFrom, dateTo, baseWhere)
    ]);

    // Calculate growth rates
    const previousPeriodStart = new Date(dateFrom.getTime() - (dateTo.getTime() - dateFrom.getTime()));
    const previousPeriodEnd = dateFrom;

    const [previousRevenue, previousUsers, previousBookings] = await Promise.all([
      getTotalRevenue(previousPeriodStart, previousPeriodEnd, baseWhere),
      getTotalUsers(previousPeriodStart, previousPeriodEnd),
      getTotalBookings(previousPeriodStart, previousPeriodEnd, sportId, baseWhere)
    ]);

    const currentRevenue = revenueAnalytics.total;
    const currentUsers = userAnalytics.total;
    const currentBookings = bookingAnalytics.total;

    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const userGrowth = previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers) * 100 : 0;
    const bookingGrowth = previousBookings > 0 ? ((currentBookings - previousBookings) / previousBookings) * 100 : 0;

    const analytics = {
      period: {
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
        type: period,
        groupBy
      },
      revenue: {
        ...revenueAnalytics,
        growth: revenueGrowth,
        previousPeriod: previousRevenue
      },
      users: {
        ...userAnalytics,
        growth: userGrowth,
        previousPeriod: previousUsers
      },
      bookings: {
        ...bookingAnalytics,
        growth: bookingGrowth,
        previousPeriod: previousBookings
      },
      vendors: vendorAnalytics,
      venues: venueAnalytics,
      sports: sportAnalytics,
      geographic: geographicAnalytics,
      performance: performanceMetrics,
      summary: {
        totalRevenue: currentRevenue,
        totalUsers: currentUsers,
        totalBookings: currentBookings,
        totalVendors: vendorAnalytics.total,
        totalVenues: venueAnalytics.total,
        averageBookingValue: currentBookings > 0 ? currentRevenue / currentBookings : 0,
        revenuePerUser: currentUsers > 0 ? currentRevenue / currentUsers : 0,
        bookingsPerUser: currentUsers > 0 ? currentBookings / currentUsers : 0
      }
    };

    return ApiResponse.success(analytics);

  } catch (error) {
    console.error('Error fetching analytics:', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.error('Invalid query parameters', 'INVALID_QUERY', 400);
    }

    return ApiResponse.error('Failed to fetch analytics', 'ANALYTICS_ERROR', 500);
  }
});

// Helper functions for different analytics
async function getRevenueAnalytics(dateFrom: Date, dateTo: Date, groupBy: string, baseWhere: any) {
  const timeGrouping = getTimeGrouping(groupBy);

  const revenueByPeriod = await prisma.$queryRaw`
    SELECT
      DATE_TRUNC(${timeGrouping}, b.createdAt) as period,
      COUNT(*) as booking_count,
      COALESCE(SUM(b.totalAmount), 0) as revenue,
      COALESCE(AVG(b.totalAmount), 0) as avg_booking_value
    FROM bookings b
    WHERE
      b.createdAt >= ${dateFrom}
      AND b.createdAt <= ${dateTo}
      AND b.status IN ('CONFIRMED', 'COMPLETED')
      ${baseWhere.vendorId ? `AND b.venueId IN (SELECT id FROM venues WHERE vendorId = ${baseWhere.vendorId})` : ''}
    GROUP BY DATE_TRUNC(${timeGrouping}, b.createdAt)
    ORDER BY period DESC
  ` as Array<{ period: Date; booking_count: number; revenue: bigint; avg_booking_value: number }>;

  const total = await prisma.booking.aggregate({
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
      status: { in: ['CONFIRMED', 'COMPLETED'] },
      ...(baseWhere.vendorId && {
        venue: { vendorId: baseWhere.vendorId }
      })
    },
    _sum: { totalAmount: true },
    _count: { id: true }
  });

  return {
    total: Number(total._sum.totalAmount || 0),
    count: total._count.id,
    byPeriod: revenueByPeriod.map(item => ({
      period: item.period,
      bookingCount: item.booking_count,
      revenue: Number(item.revenue),
      avgBookingValue: Number(item.avg_booking_value)
    }))
  };
}

async function getUserAnalytics(dateFrom: Date, dateTo: Date, groupBy: string, baseWhere: any) {
  const timeGrouping = getTimeGrouping(groupBy);

  const usersByPeriod = await prisma.$queryRaw`
    SELECT
      DATE_TRUNC(${timeGrouping}, createdAt) as period,
      COUNT(*) as user_count
    FROM users
    WHERE
      createdAt >= ${dateFrom}
      AND createdAt <= ${dateTo}
      ${baseWhere.countryCode ? `AND countryCode = ${baseWhere.countryCode}` : ''}
    GROUP BY DATE_TRUNC(${timeGrouping}, createdAt)
    ORDER BY period DESC
  ` as Array<{ period: Date; user_count: number }>;

  const total = await prisma.user.count({
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
      ...(baseWhere.countryCode && { countryCode: baseWhere.countryCode })
    }
  });

  // Active users (users with bookings in the period)
  const activeUsers = await prisma.user.count({
    where: {
      bookings: {
        some: {
          createdAt: { gte: dateFrom, lte: dateTo }
        }
      },
      ...(baseWhere.countryCode && { countryCode: baseWhere.countryCode })
    }
  });

  // User role breakdown
  const roleBreakdown = await prisma.user.groupBy({
    by: ['role'],
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
      ...(baseWhere.countryCode && { countryCode: baseWhere.countryCode })
    },
    _count: { id: true }
  });

  return {
    total,
    active: activeUsers,
    inactive: total - activeUsers,
    byPeriod: usersByPeriod.map(item => ({
      period: item.period,
      userCount: item.user_count
    })),
    byRole: roleBreakdown.reduce((acc, item) => {
      acc[item.role] = item._count.id;
      return acc;
    }, {} as Record<string, number>)
  };
}

async function getBookingAnalytics(dateFrom: Date, dateTo: Date, groupBy: string, sportId?: string, baseWhere?: any) {
  const timeGrouping = getTimeGrouping(groupBy);

  const bookingsByPeriod = await prisma.$queryRaw`
    SELECT
      DATE_TRUNC(${timeGrouping}, b.startTime) as period,
      COUNT(*) as booking_count,
      COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END) as confirmed,
      COUNT(CASE WHEN b.status = 'CANCELLED' THEN 1 END) as cancelled,
      COUNT(CASE WHEN b.status = 'COMPLETED' THEN 1 END) as completed,
      COALESCE(SUM(b.totalAmount), 0) as revenue
    FROM bookings b
    WHERE
      b.startTime >= ${dateFrom}
      AND b.startTime <= ${dateTo}
      ${sportId ? `AND b.sportId = ${sportId}` : ''}
      ${baseWhere?.vendorId ? `AND b.venueId IN (SELECT id FROM venues WHERE vendorId = ${baseWhere.vendorId})` : ''}
    GROUP BY DATE_TRUNC(${timeGrouping}, b.startTime)
    ORDER BY period DESC
  ` as Array<{
    period: Date;
    booking_count: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    revenue: bigint;
  }>;

  const total = await prisma.booking.count({
    where: {
      startTime: { gte: dateFrom, lte: dateTo },
      ...(sportId && { sportId }),
      ...(baseWhere?.vendorId && {
        venue: { vendorId: baseWhere.vendorId }
      })
    }
  });

  const statusBreakdown = await prisma.booking.groupBy({
    by: ['status'],
    where: {
      startTime: { gte: dateFrom, lte: dateTo },
      ...(sportId && { sportId }),
      ...(baseWhere?.vendorId && {
        venue: { vendorId: baseWhere.vendorId }
      })
    },
    _count: { id: true }
  });

  const typeBreakdown = await prisma.booking.groupBy({
    by: ['type'],
    where: {
      startTime: { gte: dateFrom, lte: dateTo },
      ...(sportId && { sportId }),
      ...(baseWhere?.vendorId && {
        venue: { vendorId: baseWhere.vendorId }
      })
    },
    _count: { id: true }
  });

  return {
    total,
    byPeriod: bookingsByPeriod.map(item => ({
      period: item.period,
      bookingCount: item.booking_count,
      confirmed: item.confirmed,
      cancelled: item.cancelled,
      completed: item.completed,
      revenue: Number(item.revenue)
    })),
    byStatus: statusBreakdown.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>),
    byType: typeBreakdown.reduce((acc, item) => {
      acc[item.type] = item._count.id;
      return acc;
    }, {} as Record<string, number>)
  };
}

async function getVendorAnalytics(dateFrom: Date, dateTo: Date, groupBy: string, baseWhere: any) {
  const total = await prisma.vendor.count({
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
      ...(baseWhere.countryCode && { countryCode: baseWhere.countryCode })
    }
  });

  const activeVendors = await prisma.vendor.count({
    where: {
      isActive: true,
      createdAt: { gte: dateFrom, lte: dateTo },
      ...(baseWhere.countryCode && { countryCode: baseWhere.countryCode })
    }
  });

  const vendorsWithBookings = await prisma.vendor.count({
    where: {
      venues: {
        some: {
          bookings: {
            some: {
              createdAt: { gte: dateFrom, lte: dateTo }
            }
          }
        }
      },
      ...(baseWhere.countryCode && { countryCode: baseWhere.countryCode })
    }
  });

  return {
    total,
    active: activeVendors,
    inactive: total - activeVendors,
    withBookings: vendorsWithBookings,
    withoutBookings: total - vendorsWithBookings
  };
}

async function getVenueAnalytics(dateFrom: Date, dateTo: Date, groupBy: string, baseWhere: any) {
  const total = await prisma.venue.count({
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
      ...(baseWhere.vendorId && { vendorId: baseWhere.vendorId })
    }
  });

  const activeVenues = await prisma.venue.count({
    where: {
      isActive: true,
      createdAt: { gte: dateFrom, lte: dateTo },
      ...(baseWhere.vendorId && { vendorId: baseWhere.vendorId })
    }
  });

  const venuesWithBookings = await prisma.venue.count({
    where: {
      bookings: {
        some: {
          createdAt: { gte: dateFrom, lte: dateTo }
        }
      },
      ...(baseWhere.vendorId && { vendorId: baseWhere.vendorId })
    }
  });

  return {
    total,
    active: activeVenues,
    inactive: total - activeVenues,
    withBookings: venuesWithBookings,
    withoutBookings: total - venuesWithBookings
  };
}

async function getSportAnalytics(dateFrom: Date, dateTo: Date, baseWhere: any) {
  const sports = await prisma.sport.findMany({
    select: {
      id: true,
      name: true,
      displayName: true,
      _count: {
        select: {
          bookings: {
            where: {
              createdAt: { gte: dateFrom, lte: dateTo },
              ...(baseWhere.vendorId && {
                venue: { vendorId: baseWhere.vendorId }
              })
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
    take: 20
  });

  return sports.map(sport => ({
    ...sport,
    bookingCount: sport._count.bookings
  }));
}

async function getGeographicAnalytics(dateFrom: Date, dateTo: Date, baseWhere: any) {
  const userByCountry = await prisma.user.groupBy({
    by: ['countryCode'],
    where: {
      createdAt: { gte: dateFrom, lte: dateTo }
    },
    _count: { id: true },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 10
  });

  const vendorByCountry = await prisma.vendor.groupBy({
    by: ['countryCode'],
    where: {
      createdAt: { gte: dateFrom, lte: dateTo }
    },
    _count: { id: true },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 10
  });

  return {
    users: userByCountry,
    vendors: vendorByCountry
  };
}

async function getPerformanceMetrics(dateFrom: Date, dateTo: Date, baseWhere: any) {
  const [topVendors, topVenues, topCustomers, conversionRates] = await Promise.all([
    // Top vendors by revenue
    prisma.vendor.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            venues: {
              where: {
                bookings: {
                  some: {
                    createdAt: { gte: dateFrom, lte: dateTo },
                    status: { in: ['CONFIRMED', 'COMPLETED'] }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        venues: {
          _count: 'desc'
        }
      },
      take: 10
    }),

    // Top venues by bookings
    prisma.venue.findMany({
      where: {
        deletedAt: null, // Exclude soft-deleted venues
        ...(baseWhere.vendorId && { vendorId: baseWhere.vendorId })
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            bookings: {
              where: {
                createdAt: { gte: dateFrom, lte: dateTo },
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
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            bookings: {
              where: {
                createdAt: { gte: dateFrom, lte: dateTo },
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

    // Conversion rates
    prisma.$queryRaw`
      SELECT
        COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END) * 100.0 / COUNT(*) as confirmation_rate,
        COUNT(CASE WHEN b.status = 'COMPLETED' THEN 1 END) * 100.0 / COUNT(*) as completion_rate,
        COUNT(CASE WHEN b.status = 'CANCELLED' THEN 1 END) * 100.0 / COUNT(*) as cancellation_rate
      FROM bookings b
      WHERE
        b.createdAt >= ${dateFrom}
        AND b.createdAt <= ${dateTo}
        ${baseWhere.vendorId ? `AND b.venueId IN (SELECT id FROM venues WHERE vendorId = ${baseWhere.vendorId})` : ''}
    ` as Array<{ confirmation_rate: number; completion_rate: number; cancellation_rate: number }>
  ]);

  return {
    topVendors: topVendors.map(vendor => ({
      ...vendor,
      bookingCount: vendor._count.venues
    })),
    topVenues: topVenues.map(venue => ({
      ...venue,
      bookingCount: venue._count.bookings
    })),
    topCustomers: topCustomers.map(customer => ({
      ...customer,
      bookingCount: customer._count.bookings
    })),
    conversionRates: conversionRates[0] || {
      confirmation_rate: 0,
      completion_rate: 0,
      cancellation_rate: 0
    }
  };
}

// Helper functions for totals
async function getTotalRevenue(dateFrom: Date, dateTo: Date, baseWhere: any) {
  const result = await prisma.booking.aggregate({
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
      status: { in: ['CONFIRMED', 'COMPLETED'] },
      ...(baseWhere.vendorId && {
        venue: { vendorId: baseWhere.vendorId }
      })
    },
    _sum: { totalAmount: true }
  });
  return Number(result._sum.totalAmount || 0);
}

async function getTotalUsers(dateFrom: Date, dateTo: Date) {
  return await prisma.user.count({
    where: { createdAt: { gte: dateFrom, lte: dateTo } }
  });
}

async function getTotalBookings(dateFrom: Date, dateTo: Date, sportId?: string, baseWhere?: any) {
  return await prisma.booking.count({
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
      ...(sportId && { sportId }),
      ...(baseWhere?.vendorId && {
        venue: { vendorId: baseWhere.vendorId }
      })
    }
  });
}

function getTimeGrouping(groupBy: string): string {
  switch (groupBy) {
    case 'hour': return 'hour';
    case 'day': return 'day';
    case 'week': return 'week';
    case 'month': return 'month';
    case 'year': return 'year';
    default: return 'day';
  }
}