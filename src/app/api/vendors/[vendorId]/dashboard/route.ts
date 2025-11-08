import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withVendorOwnershipAuth, ApiResponse } from '@/lib/auth/api-auth';
import { withPerformanceTracking } from '@/lib/middleware/performance';

// GET /api/vendors/[vendorId]/dashboard - Comprehensive dashboard data in a single call
export const GET = withPerformanceTracking(
  withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  try {
    // Resolve params (wrapper may pass Promise or resolved object)
    const resolvedParams = params instanceof Promise ? await params : (params || {});
    const vendorId = resolvedParams.vendorId;
    
    console.log('Dashboard API called with vendorId:', vendorId);

    if (!vendorId) {
      return ApiResponse.error('Vendor ID is required', 'MISSING_VENDOR_ID', 400);
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get vendor info with currency
    console.log('Fetching vendor:', vendorId);
    const vendor = await db.vendor.findFirst({
      where: { 
        id: vendorId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        currencyCode: true
      }
    });

    if (!vendor) {
      console.log('Vendor not found:', vendorId);
      return ApiResponse.notFound('Vendor');
    }

    console.log('Vendor found:', vendor.name);
    
    // OPTIMIZED: Get court IDs and build booking where clause once
    const bookingWhere = {
      court: {
        venue: {
          vendorId,
          deletedAt: null
        }
      }
    };
    
    const courts = await db.court.findMany({
      where: {
        venue: {
          vendorId,
          deletedAt: null
        }
      },
      select: { id: true }
    });
    const courtIds = courts.map(c => c.id);

    if (courtIds.length === 0) {
      // Return empty dashboard if no courts
      return ApiResponse.success({
        vendor: {
          currencyCode: vendor.currencyCode || 'INR'
        },
        stats: {
          total: 0,
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          confirmed: 0,
          pending: 0,
          cancelled: 0,
          completed: 0,
          revenue: 0,
          avgBookingValue: 0,
          growth: 0
        },
        charts: {
          weeklyBookings: [],
          revenueTrend: []
        },
        recentActivity: [],
        insights: {
          peakHours: 'N/A',
          averageDuration: 'N/A',
          conversionRate: 0
        }
      });
    }

    // OPTIMIZED: Use groupBy to get all counts in fewer queries, and fetch only needed data
    const [
      statusCounts,
      totalRevenue,
      monthRevenue,
      lastMonthStats,
      recentBookingsList,
      bookingsForCharts,
      bookingsForPeakHours
    ] = await Promise.all([
      // Get all status counts in one query using groupBy
      db.booking.groupBy({
        by: ['status'],
        where: bookingWhere,
        _count: { id: true }
      }),

      // Total revenue
      db.booking.aggregate({
        where: {
          ...bookingWhere,
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _sum: { totalAmount: true }
      }),

      // Monthly revenue
      db.booking.aggregate({
        where: {
          ...bookingWhere,
          startTime: { gte: monthStart },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _sum: { totalAmount: true }
      }),

      // Last month stats (bookings + revenue) - combined query
      Promise.all([
        db.booking.count({
          where: {
            ...bookingWhere,
            startTime: { gte: lastMonth, lt: monthStart }
          }
        }),
        db.booking.aggregate({
          where: {
            ...bookingWhere,
            startTime: { gte: lastMonth, lt: monthStart },
            status: { in: ['CONFIRMED', 'COMPLETED'] }
          },
          _sum: { totalAmount: true }
        })
      ]).then(([bookings, revenue]) => ({ bookings, revenue })),

      // Recent bookings for activity feed (limit to 5)
      db.booking.findMany({
        where: bookingWhere,
        select: {
          id: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          court: {
            select: {
              id: true,
              name: true,
              venue: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Bookings for charts (last 7 days) - combined with duration calculation
      db.booking.findMany({
        where: {
          ...bookingWhere,
          startTime: { gte: lastWeek }
        },
        select: {
          startTime: true,
          endTime: true,
          totalAmount: true,
          status: true
        }
      }),

      // Bookings for peak hours (last 30 days) - only need startTime
      db.booking.findMany({
        where: {
          ...bookingWhere,
          startTime: { gte: last30Days }
        },
        select: {
          startTime: true
        }
      })
    ]);

    // OPTIMIZED: Calculate counts from groupBy result instead of separate queries
    const statusMap = new Map(statusCounts.map(item => [item.status, item._count.id]));
    const totalBookings = statusCounts.reduce((sum, item) => sum + item._count.id, 0);
    const confirmedBookings = statusMap.get('CONFIRMED') || 0;
    const pendingBookings = statusMap.get('PENDING') || 0;
    const cancelledBookings = statusMap.get('CANCELLED') || 0;
    const completedBookings = statusMap.get('COMPLETED') || 0;

    // Get time-based counts using the chart data (more efficient)
    const todayBookings = bookingsForCharts.filter(b => {
      const date = new Date(b.startTime);
      return date >= todayStart && date <= todayEnd;
    }).length;

    const weekBookings = bookingsForCharts.length; // Already filtered to last week
    const monthBookings = bookingsForCharts.filter(b => {
      const date = new Date(b.startTime);
      return date >= monthStart;
    }).length;

    const lastMonthBookings = lastMonthStats.bookings;
    const lastMonthRevenue = lastMonthStats.revenue;

    // Calculate average duration from chart data (already filtered to last week)
    const bookingsWithDuration = bookingsForCharts.filter(b => b.startTime && b.endTime);

    // Calculate growth
    const bookingGrowth = lastMonthBookings > 0
      ? ((monthBookings - lastMonthBookings) / lastMonthBookings) * 100
      : 0;

    // Calculate average booking value
    const validBookings = confirmedBookings + completedBookings;
    const avgBookingValue = validBookings > 0 
      ? Number(totalRevenue._sum.totalAmount || 0) / validBookings
      : 0;

    // Calculate average duration
    let averageDurationHours = 0;
    if (bookingsWithDuration.length > 0) {
      const totalDurationMs = bookingsWithDuration.reduce((sum, booking) => {
        if (booking.startTime && booking.endTime) {
          const start = new Date(booking.startTime);
          const end = new Date(booking.endTime);
          return sum + (end.getTime() - start.getTime());
        }
        return sum;
      }, 0);
      averageDurationHours = totalDurationMs / bookingsWithDuration.length / (1000 * 60 * 60);
    }

    // Prepare weekly bookings data (last 7 days)
    const weeklyBookingsMap: Record<string, number> = {};
    bookingsForCharts.forEach(booking => {
      if (booking.startTime) {
        const date = new Date(booking.startTime);
        const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
        weeklyBookingsMap[dayKey] = (weeklyBookingsMap[dayKey] || 0) + 1;
      }
    });
    const weeklyBookings = Object.entries(weeklyBookingsMap).map(([day, bookings]) => ({
      day,
      bookings
    }));

    // Prepare revenue trend data (last 7 days)
    const revenueTrendMap: Record<string, number> = {};
    bookingsForCharts.forEach(booking => {
      if (booking.startTime && (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED')) {
        const date = new Date(booking.startTime);
        const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        revenueTrendMap[dateKey] = (revenueTrendMap[dateKey] || 0) + Number(booking.totalAmount || 0);
      }
    });
    const revenueTrend = Object.entries(revenueTrendMap).map(([date, revenue]) => ({
      date,
      revenue
    }));

    // Calculate peak hours
    const hourCounts: Record<number, number> = {};
    bookingsForPeakHours.forEach(booking => {
      if (booking.startTime) {
        const hour = new Date(booking.startTime).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });
    const peakHoursArray = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 2);

    let peakHours = 'N/A';
    if (peakHoursArray.length > 0) {
      const formatHour = (hour: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:00 ${period}`;
      };
      
      if (peakHoursArray.length === 2) {
        peakHours = `${formatHour(peakHoursArray[1].hour)} - ${formatHour(peakHoursArray[0].hour)}`;
      } else {
        peakHours = formatHour(peakHoursArray[0].hour);
      }
    }

    // Transform recent bookings to activity items
    const recentActivity = recentBookingsList.map((booking) => ({
      id: booking.id,
      type: 'booking',
      title: 'New booking',
      description: `${booking.user?.name || 'Customer'} booked ${booking.court?.venue?.name || 'venue'}`,
      time: new Date(booking.createdAt).toLocaleString(),
      status: booking.status === 'CONFIRMED' ? 'success' : booking.status === 'PENDING' ? 'warning' : booking.status === 'COMPLETED' ? 'info' : 'error'
    }));

    // Calculate conversion rate
    const conversionRate = totalBookings > 0 
      ? ((confirmedBookings / totalBookings) * 100)
      : 0;

    const dashboardData = {
      vendor: {
        currencyCode: vendor.currencyCode || 'INR'
      },
      stats: {
        total: totalBookings,
        today: todayBookings,
        thisWeek: weekBookings,
        thisMonth: monthBookings,
        confirmed: confirmedBookings,
        pending: pendingBookings,
        cancelled: cancelledBookings,
        completed: completedBookings,
        revenue: Number(totalRevenue._sum.totalAmount || 0),
        avgBookingValue: avgBookingValue,
        growth: bookingGrowth
      },
      charts: {
        weeklyBookings,
        revenueTrend
      },
      recentActivity,
      insights: {
        peakHours,
        averageDuration: averageDurationHours > 0 
          ? `${averageDurationHours.toFixed(1)} ${averageDurationHours === 1 ? 'hour' : 'hours'}`
          : 'N/A',
        conversionRate
      }
    };

    return ApiResponse.success(dashboardData);

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name,
      errorString: String(error)
    });
    
    // Return more detailed error in development
    if (process.env.NODE_ENV === 'development') {
      return ApiResponse.error(
        `Failed to fetch dashboard data: ${error instanceof Error ? error.message : String(error)}`,
        'DASHBOARD_ERROR',
        500
      );
    }
    
    return ApiResponse.error('Failed to fetch dashboard data', 'DASHBOARD_ERROR', 500);
  }
}),
'GET /api/vendors/[vendorId]/dashboard'
);

