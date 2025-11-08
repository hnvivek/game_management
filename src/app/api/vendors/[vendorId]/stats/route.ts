import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withVendorOwnershipAuth, ApiResponse } from '@/lib/auth/api-auth';

const prisma = new PrismaClient();

// Helper function to get top sports by bookings
async function getTopSportsByBookings(vendorId: string) {
  const sports = await prisma.sportType.findMany({
    where: {
      courts: {
        some: {
          venue: {
            vendorId,
            deletedAt: null // Exclude soft-deleted venues
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      displayName: true
    }
  });

  // Count bookings per sport
  const sportsWithCounts = await Promise.all(
    sports.map(async (sport) => {
      const bookingCount = await prisma.booking.count({
        where: {
          court: {
            sportId: sport.id,
            venue: {
              vendorId,
              deletedAt: null // Exclude soft-deleted venues
            }
          },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        }
      });
      return {
        ...sport,
        _count: {
          bookings: bookingCount
        }
      };
    })
  );

  return sportsWithCounts.sort((a, b) => b._count.bookings - a._count.bookings).slice(0, 5);
}

// Helper function to get occupancy statistics
async function getOccupancyStats(vendorId: string, lastWeek: Date) {
  const bookings = await prisma.booking.findMany({
    where: {
      court: {
        venue: { 
          vendorId,
          deletedAt: null // Exclude soft-deleted venues
        }
      },
      startTime: { gte: lastWeek }
    },
    select: {
      status: true
    }
  });
  
  const total = bookings.length;
  const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length;
  const completed = bookings.filter(b => b.status === 'COMPLETED').length;
  const occupancyRate = total > 0 ? ((confirmed + completed) / total) * 100 : 0;
  
  return [{
    total_bookings: total,
    confirmed_bookings: confirmed,
    completed_bookings: completed,
    occupancy_rate: occupancyRate
  }];
}

// GET /api/vendors/[vendorId]/stats - Vendor-specific statistics
export const GET = withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  // Store vendorId in a variable accessible in catch block
  let vendorId: string | undefined;
  
  try {
    // Await params in Next.js 15 - params is already resolved by withVendorOwnershipAuth
    const resolvedParams = await params;
    vendorId = resolvedParams?.vendorId || request.nextUrl.pathname.split('/')[3];

    if (!vendorId) {
      return ApiResponse.error('Vendor ID is required', 'MISSING_VENDOR_ID', 400);
    }

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Execute all queries in parallel for better performance
    const [
      vendor,
      totalVenues,
      activeVenues,
      totalBookings,
      recentBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      monthlyRevenue,
      weeklyRevenue,
      dailyRevenue,
      totalStaff,
      activeStaff,
      recentBookingsList,
      topVenues,
      topSports,
      bookingsByStatus,
      recentCustomers,
      occupancyStats
    ] = await Promise.all([
      // Vendor information
      prisma.vendor.findFirst({
        where: { 
          id: vendorId,
          deletedAt: null // Exclude soft-deleted vendors
        },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              venues: true,
              vendorStaff: true
            }
          }
        }
      }),

      // Venue statistics
      prisma.venue.count({
        where: { 
          vendorId,
          deletedAt: null // Exclude soft-deleted venues
        }
      }),

      prisma.venue.count({
        where: { 
          vendorId, 
          isActive: true,
          deletedAt: null // Exclude soft-deleted venues
        }
      }),

      // Booking statistics
      prisma.booking.count({
        where: {
          court: {
            venue: { 
              vendorId,
              deletedAt: null // Exclude soft-deleted venues
            }
          }
        }
      }),

      prisma.booking.count({
        where: {
          court: {
            venue: { 
              vendorId,
              deletedAt: null // Exclude soft-deleted venues
            }
          },
          createdAt: { gte: lastWeek }
        }
      }),

      prisma.booking.count({
        where: {
          court: {
            venue: { 
              vendorId,
              deletedAt: null // Exclude soft-deleted venues
            }
          },
          status: 'CONFIRMED'
        }
      }),

      prisma.booking.count({
        where: {
          court: {
            venue: { 
              vendorId,
              deletedAt: null // Exclude soft-deleted venues
            }
          },
          status: 'COMPLETED'
        }
      }),

      prisma.booking.count({
        where: {
          court: {
            venue: { 
              vendorId,
              deletedAt: null // Exclude soft-deleted venues
            }
          },
          status: 'CANCELLED'
        }
      }),

      // Revenue calculations
      prisma.booking.aggregate({
        where: {
          court: {
            venue: { 
              vendorId,
              deletedAt: null // Exclude soft-deleted venues
            }
          },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _sum: {
          totalAmount: true
        }
      }),

      prisma.booking.aggregate({
        where: {
          court: {
            venue: { 
              vendorId,
              deletedAt: null // Exclude soft-deleted venues
            }
          },
          createdAt: { gte: lastMonth },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _sum: {
          totalAmount: true
        }
      }),

      prisma.booking.aggregate({
        where: {
          court: {
            venue: { 
              vendorId,
              deletedAt: null // Exclude soft-deleted venues
            }
          },
          createdAt: { gte: lastWeek },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _sum: {
          totalAmount: true
        }
      }),

      prisma.booking.aggregate({
        where: {
          court: {
            venue: { 
              vendorId,
              deletedAt: null // Exclude soft-deleted venues
            }
          },
          createdAt: { gte: yesterday },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _sum: {
          totalAmount: true
        }
      }),

      // Staff statistics
      prisma.vendorStaff.count({
        where: { vendorId }
      }),

      prisma.vendorStaff.count({
        where: {
          vendorId,
          user: { isActive: true }
        }
      }),

      // Recent bookings list
      prisma.booking.findMany({
        where: {
          court: {
            venue: { 
              vendorId,
              deletedAt: null // Exclude soft-deleted venues
            }
          }
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,
          totalAmount: true,
          notes: true,
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
              },
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
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Top performing venues
      (async () => {
        const venues = await prisma.venue.findMany({
          where: { 
            vendorId,
            deletedAt: null // Exclude soft-deleted venues
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
        });
        
        // Count bookings for each venue through courts
        const venuesWithCounts = await Promise.all(
          venues.map(async (venue) => {
            const bookingCount = await prisma.booking.count({
              where: {
                courtId: { in: venue.courts.map(c => c.id) },
                status: { in: ['CONFIRMED', 'COMPLETED'] }
              }
            });
            return {
              ...venue,
              _count: {
                bookings: bookingCount
              }
            };
          })
        );
        
        // Sort by booking count descending
        return venuesWithCounts.sort((a, b) => b._count.bookings - a._count.bookings).slice(0, 5);
      })(),

      // Top sports by bookings - count bookings through courts
      getTopSportsByBookings(vendorId),

      // Status breakdown
      prisma.booking.groupBy({
        by: ['status'],
        where: {
          court: {
            venue: { 
              vendorId,
              deletedAt: null // Exclude soft-deleted venues
            }
          }
        },
        _count: {
          id: true
        }
      }),

      // Type breakdown - removed as Booking model doesn't have a type field
      Promise.resolve([]),

      // Recent customers
      prisma.user.findMany({
        where: {
          deletedAt: null, // Exclude soft-deleted users
          bookings: {
            some: {
              court: {
                venue: { 
                  vendorId,
                  deletedAt: null // Exclude soft-deleted venues
                }
              },
              createdAt: { gte: lastWeek }
            }
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          createdAt: true
        },
        distinct: ['id'],
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Occupancy statistics - using Prisma instead of raw SQL
      getOccupancyStats(vendorId, lastWeek)
    ]);

    if (!vendor) {
      return ApiResponse.notFound('Vendor');
    }

    // Calculate growth percentages
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);

    const [previousMonthBookings, previousMonthRevenue] = await Promise.all([
      prisma.booking.count({
        where: {
          court: {
            venue: { 
              vendorId,
              deletedAt: null // Exclude soft-deleted venues
            }
          },
          createdAt: {
            gte: previousMonthStart,
            lte: previousMonthEnd
          }
        }
      }),
      prisma.booking.aggregate({
        where: {
          court: {
            venue: { 
              vendorId,
              deletedAt: null // Exclude soft-deleted venues
            }
          },
          createdAt: {
            gte: previousMonthStart,
            lte: previousMonthEnd
          },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        _sum: {
          totalAmount: true
        }
      })
    ]);

    const currentMonthBookings = await prisma.booking.count({
      where: {
        court: {
          venue: { 
            vendorId,
            deletedAt: null // Exclude soft-deleted venues
          }
        },
        createdAt: { gte: lastMonth }
      }
    });

    const bookingGrowth = previousMonthBookings > 0
      ? ((currentMonthBookings - previousMonthBookings) / previousMonthBookings) * 100
      : 0;

    const revenueGrowth = previousMonthRevenue._sum.totalAmount
      ? ((Number(monthlyRevenue._sum.totalAmount || 0) - Number(previousMonthRevenue._sum.totalAmount)) / Number(previousMonthRevenue._sum.totalAmount)) * 100
      : 0;

    // Calculate average booking duration
    const bookingsWithDuration = await prisma.booking.findMany({
      where: {
        court: {
          venue: { 
            vendorId,
            deletedAt: null // Exclude soft-deleted venues
          }
        },
        startTime: { not: null },
        endTime: { not: null }
      },
      select: {
        startTime: true,
        endTime: true
      },
      take: 1000 // Sample for performance
    });

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
      averageDurationHours = totalDurationMs / bookingsWithDuration.length / (1000 * 60 * 60); // Convert to hours
    }

    // Transform recent bookings to extract venue from court
    const transformedRecentBookings = recentBookingsList.map(booking => ({
      ...booking,
      venue: booking.court.venue,
      court: {
        id: booking.court.id,
        name: booking.court.name,
        sport: booking.court.sport
      }
    }));

    // Format the response
    const stats = {
      vendor: {
        ...vendor,
        // Use the filtered venue count instead of vendor._count.venues
        venueCount: totalVenues,
        staffCount: vendor._count.vendorStaff
      },
      venues: {
        total: totalVenues,
        active: activeVenues,
        inactive: totalVenues - activeVenues,
        topPerformers: topVenues.map(venue => ({
          ...venue,
          bookingCount: venue._count.bookings
        }))
      },
      bookings: {
        total: totalBookings,
        recent: recentBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        growth: bookingGrowth,
        byStatus: bookingsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        recentList: transformedRecentBookings
      },
      revenue: {
        total: Number(totalRevenue._sum.totalAmount || 0),
        monthly: Number(monthlyRevenue._sum.totalAmount || 0),
        weekly: Number(weeklyRevenue._sum.totalAmount || 0),
        daily: Number(dailyRevenue._sum.totalAmount || 0),
        growth: revenueGrowth
      },
      staff: {
        total: totalStaff,
        active: activeStaff,
        inactive: totalStaff - activeStaff
      },
      sports: {
        topByBookings: topSports.map(sport => ({
          ...sport,
          bookingCount: sport._count.bookings
        }))
      },
      customers: {
        recent: recentCustomers
      },
      performance: {
        occupancyRate: occupancyStats[0]?.occupancy_rate || 0,
        confirmedRate: totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0,
        completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
        cancellationRate: totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0,
        averageBookingValue: (confirmedBookings + completedBookings) > 0
          ? Number(totalRevenue._sum.totalAmount || 0) / (confirmedBookings + completedBookings)
          : 0,
        averageDurationHours: averageDurationHours
      },
      health: {
        activeVenuesPercentage: totalVenues > 0 ? (activeVenues / totalVenues) * 100 : 0,
        activeStaffPercentage: totalStaff > 0 ? (activeStaff / totalStaff) * 100 : 0,
        bookingConversionRate: totalBookings > 0 ? ((confirmedBookings + completedBookings) / totalBookings) * 100 : 0
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
    console.error('Error fetching vendor stats:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      vendorId: vendorId || 'unknown'
    });
    return ApiResponse.error('Failed to fetch vendor statistics', 'VENDOR_STATS_ERROR', 500);
  }
});