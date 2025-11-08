import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth, ApiResponse } from '@/lib/auth/api-auth';

const prisma = new PrismaClient();

// GET /api/admin/users/stats - Get user statistics for dashboard
export const GET = withAdminAuth(async (request: NextRequest, { user }) => {
  try {
    // Get current date and date from 30 days ago
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previousMonthStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const previousMonthEnd = thirtyDaysAgo;

    // Execute all queries in parallel
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      newThisMonth,
      previousMonthNewUsers,
      usersByRole,
      recentLogins
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Active users
      prisma.user.count({
        where: { isActive: true }
      }),

      // Inactive users
      prisma.user.count({
        where: { isActive: false }
      }),

      // New users this month
      prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),

      // New users in previous month (for growth calculation)
      prisma.user.count({
        where: {
          createdAt: {
            gte: previousMonthStart,
            lt: previousMonthEnd
          }
        }
      }),

      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true
        }
      }),

      // Recent logins (last 7 days)
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Calculate growth rate
    const growthRate = previousMonthNewUsers > 0
      ? ((newThisMonth - previousMonthNewUsers) / previousMonthNewUsers * 100)
      : newThisMonth > 0 ? 100 : 0;

    // Format role statistics
    const roleStats = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count.role;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      newThisMonth,
      growth: Math.round(growthRate * 10) / 10, // Round to 1 decimal place
      recentLogins,
      roleStats
    };

    return ApiResponse.success(stats);

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return ApiResponse.error('Failed to fetch user statistics', 'USER_STATS_ERROR', 500);
  }
});