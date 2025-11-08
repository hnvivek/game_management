import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth, ApiResponse } from '@/lib/auth/api-auth';

const prisma = new PrismaClient();

// Platform-wide statistics endpoint
export const GET = withAdminAuth(async (request: NextRequest, { user }) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Execute all queries in parallel for better performance
    const [
      totalUsers,
      activeUsers,
      totalVendors,
      activeVendors,
      totalVenues,
      activeVenues,
      totalBookings,
      recentBookings,
      totalRevenue,
      monthlyRevenue,
      weeklyRevenue,
      dailyRevenue,
      recentUsers,
      recentVendors,
      topVendorsByBookings,
      topSportsByBookings,
      bookingsByStatus,
      usersByRole
    ] = await Promise.all([
      // User Statistics
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),

      // Vendor Statistics
      prisma.vendor.count(),
      prisma.vendor.count({ where: { isActive: true } }),

      // Venue Statistics
      prisma.venue.count(),
      prisma.venue.count({ where: { isActive: true } }),

      // Booking Statistics
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          createdAt: { gte: lastWeek }
        }
      }),

      // Revenue Calculations
      prisma.booking.aggregate({
        where: {
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _sum: {
          totalAmount: true
        }
      }),

      prisma.booking.aggregate({
        where: {
          createdAt: { gte: lastMonth },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _sum: {
          totalAmount: true
        }
      }),

      prisma.booking.aggregate({
        where: {
          createdAt: { gte: lastWeek },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _sum: {
          totalAmount: true
        }
      }),

      prisma.booking.aggregate({
        where: {
          createdAt: { gte: yesterday },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _sum: {
          totalAmount: true
        }
      }),

      // Recent Activity
      prisma.user.findMany({
        where: {
          createdAt: { gte: lastWeek }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      prisma.vendor.findMany({
        where: {
          createdAt: { gte: lastWeek }
        },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Top Performers
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
        take: 5
      }),

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
        take: 5
      }),

      // Status Breakdowns
      prisma.booking.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      }),

      prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true
        }
      })
    ]);

    // Calculate growth percentages
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);

    const [previousMonthBookings, previousMonthUsers] = await Promise.all([
      prisma.booking.count({
        where: {
          createdAt: {
            gte: previousMonthStart,
            lte: previousMonthEnd
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: previousMonthStart,
            lte: previousMonthEnd
          }
        }
      })
    ]);

    const currentMonthBookings = await prisma.booking.count({
      where: {
        createdAt: { gte: lastMonth }
      }
    });

    const currentMonthUsers = await prisma.user.count({
      where: {
        createdAt: { gte: lastMonth }
      }
    });

    const bookingGrowth = previousMonthBookings > 0
      ? ((currentMonthBookings - previousMonthBookings) / previousMonthBookings) * 100
      : 0;

    const userGrowth = previousMonthUsers > 0
      ? ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100
      : 0;

    // Format the response
    const stats = {
      // User Metrics
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        recentGrowth: userGrowth,
        recent: recentUsers
      },

      // Vendor Metrics
      vendors: {
        total: totalVendors,
        active: activeVendors,
        inactive: totalVendors - activeVendors,
        recent: recentVendors,
        topPerformers: topVendorsByBookings
      },

      // Venue Metrics
      venues: {
        total: totalVenues,
        active: activeVenues,
        inactive: totalVenues - activeVenues
      },

      // Booking Metrics
      bookings: {
        total: totalBookings,
        recent: recentBookings,
        growth: bookingGrowth,
        byStatus: bookingsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>)
      },

      // Revenue Metrics
      revenue: {
        total: totalRevenue._sum.totalAmount || 0,
        monthly: monthlyRevenue._sum.totalAmount || 0,
        weekly: weeklyRevenue._sum.totalAmount || 0,
        daily: dailyRevenue._sum.totalAmount || 0
      },

      // Sport Analytics
      sports: {
        topByBookings: topSportsByBookings
      },

      // User Role Distribution
      userRoles: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count.id;
        return acc;
      }, {} as Record<string, number>),

      // System Health
      system: {
        activeUsersPercentage: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
        activeVendorsPercentage: totalVendors > 0 ? (activeVendors / totalVendors) * 100 : 0,
        activeVenuesPercentage: totalVenues > 0 ? (activeVenues / totalVenues) * 100 : 0,
        conversionRate: totalUsers > 0 ? (totalBookings / totalUsers) * 100 : 0
      }
    };

    return ApiResponse.success(stats, {
      generatedAt: new Date().toISOString(),
      period: {
        monthly: { from: lastMonth.toISOString(), to: now.toISOString() },
        weekly: { from: lastWeek.toISOString(), to: now.toISOString() },
        daily: { from: yesterday.toISOString(), to: now.toISOString() }
      }
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return ApiResponse.error('Failed to fetch platform statistics', 'STATS_ERROR', 500);
  }
});