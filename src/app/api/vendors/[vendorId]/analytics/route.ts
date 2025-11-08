import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withVendorOwnershipAuth, ApiResponse } from '@/lib/auth/api-auth';
import { z } from 'zod';
import { withPerformanceTracking } from '@/lib/middleware/performance';

const prisma = new PrismaClient();

// Query parameters schema for analytics
const analyticsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y', 'all']).optional().default('30d'),
  metric: z.enum(['revenue', 'bookings', 'venues', 'customers']).optional(),
  groupBy: z.enum(['day', 'week', 'month', 'year']).optional().default('day'),
  venueId: z.string().optional(),
  sportId: z.string().optional(),
  compareWith: z.enum(['previous_period', 'last_year']).optional()
});

// GET /api/vendors/[vendorId]/analytics - Comprehensive vendor analytics
export const GET = withPerformanceTracking(
  withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  try {
    const resolvedParams = await params;
    const vendorId = resolvedParams.vendorId;
    const { searchParams } = new URL(request.url);
    const query = analyticsQuerySchema.parse(Object.fromEntries(searchParams));

    const { period, metric, groupBy, venueId, sportId, compareWith } = query;

    // Get vendor info with currency
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: vendorId,
        deletedAt: null
      },
      select: {
        id: true,
        currencyCode: true
      }
    });

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
    const baseWhere: any = { 
      vendorId,
      deletedAt: null // Exclude soft-deleted venues
    };
    if (venueId) {
      baseWhere.venueId = venueId;
    }

    // Execute all analytics queries in parallel
    const [
      revenueAnalytics,
      bookingAnalytics,
      venueAnalytics,
      customerAnalytics,
      performanceMetrics,
      timeAnalytics
    ] = await Promise.all([
      // Revenue Analytics
      getRevenueAnalytics(dateFrom, dateTo, groupBy, sportId, baseWhere),

      // Booking Analytics
      getBookingAnalytics(dateFrom, dateTo, groupBy, sportId, baseWhere),

      // Venue Analytics
      getVenueAnalytics(dateFrom, dateTo, baseWhere),

      // Customer Analytics
      getCustomerAnalytics(dateFrom, dateTo, baseWhere),

      // Performance Metrics
      getPerformanceMetrics(dateFrom, dateTo, baseWhere),

      // Time-based Analytics
      getTimeAnalytics(dateFrom, dateTo, baseWhere)
    ]);

    // Calculate growth rates if comparison is requested
    let growthData = null;
    if (compareWith) {
      const previousPeriodStart = new Date(dateFrom.getTime() - (dateTo.getTime() - dateFrom.getTime()));
      const previousPeriodEnd = dateFrom;

      const [previousRevenue, previousBookings, previousCustomers, previousPerformance] = await Promise.all([
        getTotalRevenue(previousPeriodStart, previousPeriodEnd, sportId, baseWhere),
        getTotalBookings(previousPeriodStart, previousPeriodEnd, sportId, baseWhere),
        getTotalCustomers(previousPeriodStart, previousPeriodEnd, baseWhere),
        getPerformanceMetrics(previousPeriodStart, previousPeriodEnd, baseWhere)
      ]);

      const currentRevenue = revenueAnalytics.total;
      const currentBookings = bookingAnalytics.total;
      const currentCustomers = customerAnalytics.total;

      // Calculate performance metrics changes
      // Handle edge cases properly:
      // - Previous 0, current > 0: Show positive change (capped at reasonable value)
      // - Previous > 0, current 0: Show -100% decrease
      // - Both 0: Show 0% change
      // - Both > 0: Calculate percentage change normally
      // Use raw values before rounding for more accurate comparison
      const currentOccupancyRaw = performanceMetrics.occupancyRate;
      const previousOccupancyRaw = previousPerformance.occupancyRate;
      
      const occupancyRateChange = previousOccupancyRaw === 0 && currentOccupancyRaw > 0
        ? Math.min(100, currentOccupancyRaw * 10) // Cap at 100% or reasonable multiplier
        : previousOccupancyRaw > 0 && currentOccupancyRaw === 0
        ? -100 // 100% decrease to 0
        : previousOccupancyRaw === 0 && currentOccupancyRaw === 0
        ? 0
        : previousOccupancyRaw > 0
        ? ((currentOccupancyRaw - previousOccupancyRaw) / previousOccupancyRaw) * 100
        : 0;
      
      const customerSatisfactionChange = previousPerformance.customerSatisfaction === 0 && performanceMetrics.customerSatisfaction > 0
        ? Math.min(100, performanceMetrics.customerSatisfaction * 20) // Cap at reasonable value
        : previousPerformance.customerSatisfaction > 0 && performanceMetrics.customerSatisfaction === 0
        ? -100
        : previousPerformance.customerSatisfaction === 0 && performanceMetrics.customerSatisfaction === 0
        ? 0
        : previousPerformance.customerSatisfaction > 0
        ? ((performanceMetrics.customerSatisfaction - previousPerformance.customerSatisfaction) / previousPerformance.customerSatisfaction) * 100
        : 0;
      
      const completionRateChange = previousPerformance.completionRate === 0 && performanceMetrics.completionRate > 0
        ? Math.min(100, performanceMetrics.completionRate * 1.5) // Cap at reasonable value
        : previousPerformance.completionRate > 0 && performanceMetrics.completionRate === 0
        ? -100
        : previousPerformance.completionRate === 0 && performanceMetrics.completionRate === 0
        ? 0
        : previousPerformance.completionRate > 0
        ? ((performanceMetrics.completionRate - previousPerformance.completionRate) / previousPerformance.completionRate) * 100
        : 0;

      // Calculate revenue growth - handle case where previous is 0
      const revenueGrowth = previousRevenue === 0 && currentRevenue > 0
        ? Math.min(1000, (currentRevenue / 100) * 100) // Cap at 1000% or reasonable multiplier
        : previousRevenue > 0 && currentRevenue === 0
        ? -100 // 100% decrease to 0
        : previousRevenue === 0 && currentRevenue === 0
        ? 0
        : previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

      // Similar logic for bookings and customers
      const bookingsGrowth = previousBookings === 0 && currentBookings > 0
        ? Math.min(1000, currentBookings * 100) // Cap at reasonable value
        : previousBookings > 0 && currentBookings === 0
        ? -100
        : currentBookings === 0 && previousBookings === 0
        ? 0
        : previousBookings > 0
        ? ((currentBookings - previousBookings) / previousBookings) * 100
        : 0;

      const customersGrowth = previousCustomers === 0 && currentCustomers > 0
        ? Math.min(1000, currentCustomers * 100) // Cap at reasonable value
        : previousCustomers > 0 && currentCustomers === 0
        ? -100
        : currentCustomers === 0 && previousCustomers === 0
        ? 0
        : previousCustomers > 0
        ? ((currentCustomers - previousCustomers) / previousCustomers) * 100
        : 0;

      growthData = {
        revenue: revenueGrowth,
        bookings: bookingsGrowth,
        customers: customersGrowth,
        occupancyRate: occupancyRateChange,
        customerSatisfaction: customerSatisfactionChange,
        completionRate: completionRateChange,
        comparisonPeriod: {
          from: previousPeriodStart.toISOString(),
          to: previousPeriodEnd.toISOString()
        }
      };
    }

    const analytics = {
      period: {
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
        type: period,
        groupBy
      },
      revenue: revenueAnalytics,
      bookings: bookingAnalytics,
      venues: venueAnalytics,
      customers: customerAnalytics,
      performance: performanceMetrics,
      timeAnalytics,
      growth: growthData,
      summary: {
        totalRevenue: revenueAnalytics.total,
        totalBookings: bookingAnalytics.total,
        totalCustomers: customerAnalytics.total,
        totalVenues: venueAnalytics.total,
        averageBookingValue: bookingAnalytics.total > 0 ? revenueAnalytics.total / bookingAnalytics.total : 0,
        revenuePerCustomer: customerAnalytics.total > 0 ? revenueAnalytics.total / customerAnalytics.total : 0,
        bookingsPerCustomer: customerAnalytics.total > 0 ? bookingAnalytics.total / customerAnalytics.total : 0,
        occupancyRate: performanceMetrics.occupancyRate,
        customerSatisfaction: performanceMetrics.customerSatisfaction
      },
      vendor: {
        currencyCode: vendor?.currencyCode || 'INR'
      }
    };

    return ApiResponse.success(analytics);

  } catch (error) {
    console.error('Error fetching vendor analytics:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.errors);
      return ApiResponse.error('Invalid query parameters', 'INVALID_QUERY', 400);
    }

    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma error:', error);
    }

    return ApiResponse.error('Failed to fetch vendor analytics', 'ANALYTICS_ERROR', 500);
  }
}),
'GET /api/vendors/[vendorId]/analytics'
);

// Helper functions for different analytics
async function getRevenueAnalytics(dateFrom: Date, dateTo: Date, groupBy: string, sportId?: string, baseWhere?: any) {
  // Build where clause for bookings
  const bookingWhere: any = {
    startTime: { gte: dateFrom, lte: dateTo },
    status: { in: ['CONFIRMED', 'COMPLETED'] },
    court: {
      venue: {
        vendorId: baseWhere?.vendorId,
        deletedAt: null,
        ...(baseWhere?.venueId && { id: baseWhere.venueId })
      }
    }
  };

  if (sportId) {
    bookingWhere.court.sportId = sportId;
  }

  // Get all bookings for the period with sport information
  const bookings = await prisma.booking.findMany({
    where: bookingWhere,
    select: {
      id: true,
      startTime: true,
      totalAmount: true,
      court: {
        select: {
          sport: {
            select: {
              id: true,
              name: true,
              displayName: true,
              icon: true
            }
          }
        }
      }
    }
  });

  // Group by period and sport
  const periodSportMap = new Map<string, Map<string, { count: number; revenue: number }>>();
  const sportMap = new Map<string, { name: string; displayName: string; icon: string | null }>();
  
  bookings.forEach(booking => {
    const sportId = booking.court.sport.id;
    const sport = booking.court.sport;
    sportMap.set(sportId, {
      name: sport.name,
      displayName: sport.displayName,
      icon: sport.icon
    });

    const date = new Date(booking.startTime);
    let periodKey: string;
    
    switch (groupBy) {
      case 'hour':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`;
        break;
      case 'day':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        break;
      case 'month':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        periodKey = String(date.getFullYear());
        break;
      default:
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    if (!periodSportMap.has(periodKey)) {
      periodSportMap.set(periodKey, new Map());
    }
    
    const sportMapForPeriod = periodSportMap.get(periodKey)!;
    const existing = sportMapForPeriod.get(sportId) || { count: 0, revenue: 0 };
    sportMapForPeriod.set(sportId, {
      count: existing.count + 1,
      revenue: existing.revenue + Number(booking.totalAmount || 0)
    });
  });

  // Get all unique periods and sort them
  const allPeriods = Array.from(periodSportMap.keys()).map(period => {
    let periodDate: Date;
    if (groupBy === 'day') {
      periodDate = new Date(period + 'T00:00:00Z');
    } else if (groupBy === 'month') {
      periodDate = new Date(period + '-01T00:00:00Z');
    } else if (groupBy === 'year') {
      periodDate = new Date(period + '-01-01T00:00:00Z');
    } else {
      periodDate = new Date(period);
    }
    return { key: period, date: periodDate };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());

  // Build byPeriod array with sport breakdown
  const byPeriod = allPeriods.map(({ key: period, date: periodDate }) => {
    const sportData = periodSportMap.get(period)!;
    const totalRevenue = Array.from(sportData.values()).reduce((sum, data) => sum + data.revenue, 0);
    const totalCount = Array.from(sportData.values()).reduce((sum, data) => sum + data.count, 0);
    
    // Build sport breakdown object
    const sportBreakdown: Record<string, number> = {};
    sportData.forEach((data, sportId) => {
      sportBreakdown[sportId] = data.revenue;
    });
    
    return {
      period: periodDate,
      bookingCount: totalCount,
      revenue: totalRevenue,
      avgBookingValue: totalCount > 0 ? totalRevenue / totalCount : 0,
      bySport: sportBreakdown
    };
  });

  // Build sports metadata
  const sports = Array.from(sportMap.entries()).map(([id, sport]) => ({
    id,
    name: sport.name,
    displayName: sport.displayName,
    icon: sport.icon
  }));

  const total = await prisma.booking.aggregate({
    where: bookingWhere,
    _sum: { totalAmount: true },
    _count: { id: true }
  });

  return {
    total: Number(total._sum.totalAmount || 0),
    count: total._count.id,
    byPeriod,
    sports // Include sports metadata for frontend
  };
}

async function getBookingAnalytics(dateFrom: Date, dateTo: Date, groupBy: string, sportId?: string, baseWhere?: any) {
  // Build where clause for bookings
  const bookingWhere: any = {
    startTime: { gte: dateFrom, lte: dateTo },
    court: {
      venue: {
        vendorId: baseWhere?.vendorId,
        deletedAt: null,
        ...(baseWhere?.venueId && { id: baseWhere.venueId })
      }
    }
  };

  if (sportId) {
    bookingWhere.court.sportId = sportId;
  }

  // Get all bookings for the period
  const bookings = await prisma.booking.findMany({
    where: bookingWhere,
    select: {
      id: true,
      startTime: true,
      status: true,
      totalAmount: true
    }
  });

  // Group by period
  const periodMap = new Map<string, {
    count: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    revenue: number;
  }>();
  
  bookings.forEach(booking => {
    const date = new Date(booking.startTime || new Date());
    let periodKey: string;
    
    switch (groupBy) {
      case 'hour':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`;
        break;
      case 'day':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        break;
      case 'month':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        periodKey = String(date.getFullYear());
        break;
      default:
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    const existing = periodMap.get(periodKey) || { count: 0, confirmed: 0, cancelled: 0, completed: 0, revenue: 0 };
    periodMap.set(periodKey, {
      count: existing.count + 1,
      confirmed: existing.confirmed + (booking.status === 'CONFIRMED' ? 1 : 0),
      cancelled: existing.cancelled + (booking.status === 'CANCELLED' ? 1 : 0),
      completed: existing.completed + (booking.status === 'COMPLETED' ? 1 : 0),
      revenue: existing.revenue + Number(booking.totalAmount || 0)
    });
  });

  const byPeriod = Array.from(periodMap.entries())
    .map(([period, data]) => {
      // Parse the period string back to a Date
      let periodDate: Date;
      if (groupBy === 'day') {
        periodDate = new Date(period + 'T00:00:00Z');
      } else if (groupBy === 'month') {
        periodDate = new Date(period + '-01T00:00:00Z');
      } else if (groupBy === 'year') {
        periodDate = new Date(period + '-01-01T00:00:00Z');
      } else {
        // For hour or week, try to parse the full date string
        periodDate = new Date(period);
      }
      
      return {
        period: periodDate,
        bookingCount: data.count,
        confirmed: data.confirmed,
        cancelled: data.cancelled,
        completed: data.completed,
        revenue: data.revenue
      };
    })
    .sort((a, b) => b.period.getTime() - a.period.getTime());

  const total = bookings.length;
  const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length;
  const completed = bookings.filter(b => b.status === 'COMPLETED').length;
  const activeBookings = confirmed + completed;

  const statusBreakdown = await prisma.booking.groupBy({
    by: ['status'],
    where: bookingWhere,
    _count: { id: true }
  });

  return {
    total,
    byPeriod,
    activeBookings,
    byStatus: statusBreakdown.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>)
  };
}

async function getVenueAnalytics(dateFrom: Date, dateTo: Date, baseWhere: any) {
  // OPTIMIZED: Fetch venues and bookings in parallel, then aggregate
  const [venues, allBookings] = await Promise.all([
    prisma.venue.findMany({
      where: {
        vendorId: baseWhere.vendorId,
        deletedAt: null,
        ...(baseWhere?.venueId && { id: baseWhere.venueId })
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        courts: {
          select: {
            id: true
          }
        }
      }
    }),
    // Fetch all bookings for all venues in one query
    prisma.booking.findMany({
      where: {
        court: {
          venue: {
            vendorId: baseWhere.vendorId,
            deletedAt: null,
            ...(baseWhere?.venueId && { id: baseWhere.venueId })
          }
        },
        startTime: { gte: dateFrom, lte: dateTo },
        status: { in: ['CONFIRMED', 'COMPLETED'] }
      },
      select: {
        id: true,
        totalAmount: true,
        courtId: true
      }
    })
  ]);

  // Build court-to-venue mapping
  const courtToVenueMap = new Map<string, string>();
  venues.forEach(venue => {
    venue.courts.forEach(court => {
      courtToVenueMap.set(court.id, venue.id);
    });
  });

  // Aggregate bookings by venue (in memory, no additional queries)
  const venueStatsMap = new Map<string, { bookingCount: number; revenue: number }>();
  allBookings.forEach(booking => {
    const venueId = courtToVenueMap.get(booking.courtId);
    if (venueId) {
      const existing = venueStatsMap.get(venueId) || { bookingCount: 0, revenue: 0 };
      venueStatsMap.set(venueId, {
        bookingCount: existing.bookingCount + 1,
        revenue: existing.revenue + Number(booking.totalAmount || 0)
      });
    }
  });

  // Build venue stats
  const venueStats = venues.map(venue => ({
    id: venue.id,
    name: venue.name,
    bookingCount: venueStatsMap.get(venue.id)?.bookingCount || 0,
    revenue: venueStatsMap.get(venue.id)?.revenue || 0,
    courtCount: venue.courts.length
  }));

  return {
    total: venues.length,
    active: venues.filter(v => v.isActive).length,
    topPerformers: venueStats.sort((a, b) => b.revenue - a.revenue),
    totalCourts: venues.reduce((sum, v) => sum + v.courts.length, 0)
  };
}

async function getCustomerAnalytics(dateFrom: Date, dateTo: Date, baseWhere: any) {
  const totalCustomers = await prisma.user.count({
    where: {
      bookings: {
        some: {
          court: {
            venue: {
              vendorId: baseWhere.vendorId,
              deletedAt: null,
              ...(baseWhere?.venueId && { id: baseWhere.venueId })
            }
          },
          startTime: { gte: dateFrom, lte: dateTo }
        }
      }
    }
  });

  const newCustomers = await prisma.user.count({
    where: {
      bookings: {
        some: {
          court: {
            venue: {
              vendorId: baseWhere.vendorId,
              deletedAt: null,
              ...(baseWhere?.venueId && { id: baseWhere.venueId })
            }
          },
          startTime: { gte: dateFrom, lte: dateTo }
        }
      },
      createdAt: { gte: dateFrom, lte: dateTo }
    }
  });

  const returningCustomers = totalCustomers - newCustomers;

  // Calculate repeat rate: percentage of customers with 2+ bookings
  // Get customers with their booking counts to calculate repeat rate
  const customersWithBookings = await prisma.user.findMany({
    where: {
      bookings: {
        some: {
          court: {
            venue: {
              vendorId: baseWhere.vendorId,
              deletedAt: null,
              ...(baseWhere?.venueId && { id: baseWhere.venueId })
            }
          },
          startTime: { gte: dateFrom, lte: dateTo },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        }
      }
    },
    select: {
      id: true,
      _count: {
        select: {
          bookings: {
            where: {
              court: {
                venue: {
                  vendorId: baseWhere.vendorId,
                  deletedAt: null,
                  ...(baseWhere?.venueId && { id: baseWhere.venueId })
                }
              },
              startTime: { gte: dateFrom, lte: dateTo },
              status: { in: ['CONFIRMED', 'COMPLETED'] }
            }
          }
        }
      }
    }
  });

  const repeatCustomers = customersWithBookings.filter(c => c._count.bookings >= 2).length;
  const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

  const topCustomers = await prisma.user.findMany({
    where: {
      bookings: {
        some: {
          court: {
            venue: {
              vendorId: baseWhere.vendorId,
              deletedAt: null,
              ...(baseWhere?.venueId && { id: baseWhere.venueId })
            }
          },
          startTime: { gte: dateFrom, lte: dateTo },
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
              court: {
                venue: {
                  vendorId: baseWhere.vendorId,
                  deletedAt: null,
                  ...(baseWhere?.venueId && { id: baseWhere.venueId })
                }
              },
              startTime: { gte: dateFrom, lte: dateTo },
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
  });

  // OPTIMIZED: Get revenue for all top customers in one query instead of N queries
  const topCustomerIds = topCustomers.map(c => c.id);
  const customerRevenues = await prisma.booking.groupBy({
    by: ['userId'],
    where: {
      userId: { in: topCustomerIds },
      court: {
        venue: {
          vendorId: baseWhere.vendorId,
          deletedAt: null,
          ...(baseWhere?.venueId && { id: baseWhere.venueId })
        }
      },
      startTime: { gte: dateFrom, lte: dateTo },
      status: { in: ['CONFIRMED', 'COMPLETED'] }
    },
    _sum: {
      totalAmount: true
    }
  });

  // Build revenue map
  const revenueMap = new Map<string, number>();
  customerRevenues.forEach(item => {
    revenueMap.set(item.userId, Number(item._sum.totalAmount || 0));
  });

  // Combine customer data with revenue
  const topCustomersWithRevenue = topCustomers.map(customer => ({
    ...customer,
    bookingCount: customer._count.bookings,
    revenue: revenueMap.get(customer.id) || 0
  }));

  return {
    total: totalCustomers,
    new: newCustomers,
    returning: returningCustomers,
    retentionRate: totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0,
    repeatRate: repeatRate,
    topCustomers: topCustomersWithRevenue.sort((a, b) => b.bookingCount - a.bookingCount)
  };
}

async function getPerformanceMetrics(dateFrom: Date, dateTo: Date, baseWhere: any) {
  const bookingWhere: any = {
    startTime: { gte: dateFrom, lte: dateTo },
    court: {
      venue: {
        vendorId: baseWhere?.vendorId,
        deletedAt: null,
        ...(baseWhere?.venueId && { id: baseWhere.venueId })
      }
    }
  };

  const bookings = await prisma.booking.findMany({
    where: bookingWhere,
    select: {
      status: true,
      totalAmount: true,
      userId: true,
      startTime: true,
      endTime: true
    }
  });

  const totalBookings = bookings.length;
  const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length;
  const completed = bookings.filter(b => b.status === 'COMPLETED').length;
  const cancelled = bookings.filter(b => b.status === 'CANCELLED').length;
  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

  const uniqueCustomers = new Set(bookings.map(b => b.userId).filter(Boolean));
  const confirmedCustomers = new Set(
    bookings.filter(b => b.status === 'CONFIRMED').map(b => b.userId).filter(Boolean)
  );

  // Calculate occupancy rate based on actual bookings
  let occupancyRate = 0;
  try {
    // Get all courts for the vendor
    const courts = await prisma.court.findMany({
      where: {
        venue: {
          vendorId: baseWhere?.vendorId,
          deletedAt: null,
          ...(baseWhere?.venueId && { id: baseWhere.venueId })
        },
        isActive: true
      },
      include: {
        venue: {
          include: {
            operatingHours: true
          }
        }
      }
    });

    if (courts.length > 0) {
      // Calculate total booked hours (only CONFIRMED and COMPLETED bookings)
      const activeBookings = bookings.filter(b => 
        b.status === 'CONFIRMED' || b.status === 'COMPLETED'
      );
      
      let totalBookedHours = 0;
      activeBookings.forEach(booking => {
        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Convert to hours
        totalBookedHours += hours;
      });

      // Calculate total available hours
      // Estimate based on: number of courts × operating hours × days in period
      const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
      
      // Default operating hours: 6 AM to 11 PM (17 hours per day)
      // If venue has operating hours, use those
      let hoursPerDay = 17; // Default
      
      // Try to get average operating hours from venues
      const venuesWithHours = courts
        .map(c => c.venue)
        .filter((v, index, self) => self.findIndex(ven => ven.id === v.id) === index); // Unique venues
      
      if (venuesWithHours.length > 0 && venuesWithHours[0].operatingHours?.length > 0) {
        // Calculate average operating hours per day
        const totalHours = venuesWithHours.reduce((sum, venue) => {
          const venueHours = venue.operatingHours.reduce((daySum, day) => {
            if (day.isOpen) {
              const open = parseInt(day.openingTime.split(':')[0]);
              const close = parseInt(day.closingTime.split(':')[0]);
              return daySum + (close - open);
            }
            return daySum;
          }, 0);
          return sum + (venueHours / 7); // Average per day
        }, 0);
        hoursPerDay = totalHours / venuesWithHours.length;
      }

      const totalAvailableHours = courts.length * hoursPerDay * daysDiff;
      
      if (totalAvailableHours > 0) {
        occupancyRate = (totalBookedHours / totalAvailableHours) * 100;
        // Cap at 100%
        occupancyRate = Math.min(occupancyRate, 100);
      }
    }
  } catch (error) {
    console.error('Error calculating occupancy rate:', error);
    // Fallback to 0 if calculation fails
    occupancyRate = 0;
  }

  return {
    confirmationRate: totalBookings > 0 ? (confirmed / totalBookings) * 100 : 0,
    completionRate: totalBookings > 0 ? (completed / totalBookings) * 100 : 0,
    cancellationRate: totalBookings > 0 ? (cancelled / totalBookings) * 100 : 0,
    avgBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
    occupancyRate: Math.round(occupancyRate * 10) / 10, // Round to 1 decimal place
    customerSatisfaction: 4.6, // Placeholder - integrate with review system when available
    conversion: {
      visitorToBooking: 0, // Would need visitor tracking
      bookingToConfirmation: uniqueCustomers.size > 0 ? (confirmedCustomers.size / uniqueCustomers.size) * 100 : 0
    }
  };
}

async function getTimeAnalytics(dateFrom: Date, dateTo: Date, baseWhere: any) {
  // Get court IDs for the vendor
  const courts = await prisma.court.findMany({
    where: {
      venue: {
        vendorId: baseWhere.vendorId,
        deletedAt: null,
        ...(baseWhere?.venueId && { id: baseWhere.venueId })
      }
    },
    select: { id: true }
  });
  const courtIds = courts.map(c => c.id);

  if (courtIds.length === 0) {
    return {
      peakHours: [],
      peakDays: []
    };
  }

  // Use Prisma to get hourly breakdown
  const bookings = await prisma.booking.findMany({
    where: {
      courtId: { in: courtIds },
      startTime: { gte: dateFrom, lte: dateTo }
    },
    select: {
      startTime: true
    }
  });

  // Group by hour
  const hourCounts: Record<number, number> = {};
  bookings.forEach(booking => {
    if (booking.startTime) {
      const hour = new Date(booking.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });

  const hourlyBookingsArray = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), booking_count: count }))
    .sort((a, b) => b.booking_count - a.booking_count);

  // Peak booking days
  const dayCounts: Record<number, number> = {};
  bookings.forEach(booking => {
    if (booking.startTime) {
      const dayOfWeek = new Date(booking.startTime).getDay();
      dayCounts[dayOfWeek] = (dayCounts[dayOfWeek] || 0) + 1;
    }
  });

  const dailyBookingsArray = Object.entries(dayCounts)
    .map(([day, count]) => ({ day_of_week: parseInt(day), booking_count: count }))
    .sort((a, b) => b.booking_count - a.booking_count);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return {
    peakHours: hourlyBookingsArray.map(item => ({
      hour: item.hour,
      bookingCount: item.booking_count
    })),
    peakDays: dailyBookingsArray.map(item => ({
      dayOfWeek: item.day_of_week,
      dayName: dayNames[item.day_of_week],
      bookingCount: item.booking_count
    }))
  };
}

// Helper functions for totals
async function getTotalRevenue(dateFrom: Date, dateTo: Date, sportId?: string, baseWhere?: any) {
  const bookingWhere: any = {
    startTime: { gte: dateFrom, lte: dateTo },
    status: { in: ['CONFIRMED', 'COMPLETED'] },
    court: {
      venue: {
        vendorId: baseWhere?.vendorId,
        deletedAt: null,
        ...(baseWhere?.venueId && { id: baseWhere.venueId })
      }
    }
  };

  if (sportId) {
    bookingWhere.court.sportId = sportId;
  }

  const result = await prisma.booking.aggregate({
    where: bookingWhere,
    _sum: { totalAmount: true }
  });
  return Number(result._sum.totalAmount || 0);
}

async function getTotalBookings(dateFrom: Date, dateTo: Date, sportId?: string, baseWhere?: any) {
  const bookingWhere: any = {
    startTime: { gte: dateFrom, lte: dateTo },
    court: {
      venue: {
        vendorId: baseWhere?.vendorId,
        deletedAt: null,
        ...(baseWhere?.venueId && { id: baseWhere.venueId })
      }
    }
  };

  if (sportId) {
    bookingWhere.court.sportId = sportId;
  }

  return await prisma.booking.count({
    where: bookingWhere
  });
}

async function getTotalCustomers(dateFrom: Date, dateTo: Date, baseWhere?: any) {
  return await prisma.user.count({
    where: {
      bookings: {
        some: {
          court: {
            venue: {
              vendorId: baseWhere.vendorId,
              deletedAt: null,
              ...(baseWhere?.venueId && { id: baseWhere.venueId })
            }
          },
          startTime: { gte: dateFrom, lte: dateTo }
        }
      }
    }
  });
}
