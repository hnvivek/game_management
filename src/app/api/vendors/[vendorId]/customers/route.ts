import { NextRequest, NextResponse } from 'next/server';
import { withVendorOwnershipAuth, ApiResponse } from '@/lib/auth/api-auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withPerformanceTracking } from '@/lib/middleware/performance';

// Query parameters schema for filtering customers
const customersQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'FIRST_TIME', 'RETURNING']).optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'lastBookingDate', 'totalBookings', 'totalSpent']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  dateFrom: z.string().optional().transform(val => val ? new Date(val) : undefined),
  dateTo: z.string().optional().transform(val => val ? new Date(val) : undefined),
  minBookings: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  maxBookings: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  minSpent: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxSpent: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  venueId: z.string().optional()
});

// GET /api/vendors/[vendorId]/customers - List vendor's customers
export const GET = withPerformanceTracking(
  withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
    try {
      const resolvedParams = await params;
      const vendorId = resolvedParams.vendorId;
      const { searchParams } = new URL(request.url);
      const query = customersQuerySchema.parse(Object.fromEntries(searchParams));

      const {
        page,
        limit,
        search,
        status,
        sortBy,
        sortOrder,
        dateFrom,
        dateTo,
        minBookings,
        maxBookings,
        minSpent,
        maxSpent,
        venueId
      } = query;

      // Build base where clause for bookings belonging to this vendor
      const bookingWhere: any = {
        court: {
          venue: {
            vendorId,
            deletedAt: null
          }
        }
      };

      // Add venue filter if specified
      if (venueId) {
        bookingWhere.court.venue.id = venueId;
      }

      // Add date filter if specified
      if (dateFrom || dateTo) {
        bookingWhere.createdAt = {};
        if (dateFrom) bookingWhere.createdAt.gte = dateFrom;
        if (dateTo) bookingWhere.createdAt.lte = dateTo;
      }

      // OPTIMIZED: Fetch all booking data in parallel with includes
      // This eliminates N+1 queries by fetching everything upfront
      const [vendor, customersData, allBookings, statusBreakdowns] = await Promise.all([
        // Get vendor info
        db.vendor.findFirst({
          where: { id: vendorId, deletedAt: null },
          select: { id: true, currencyCode: true }
        }),
        
        // OPTIMIZED: Get customer aggregation stats (one query)
        db.booking.groupBy({
          by: ['userId'],
          where: bookingWhere,
          _count: { id: true },
          _sum: { totalAmount: true },
          _min: { createdAt: true },
          _max: { createdAt: true }
        }),
        
        // OPTIMIZED: Get most recent booking per customer efficiently
        // Use the _max.createdAt from the first groupBy, then fetch bookings in a single query
        // This is faster than fetching 5000 bookings or doing N queries
        db.booking.findMany({
          where: bookingWhere,
          select: {
            userId: true,
            createdAt: true,
            status: true,
            court: {
              select: {
                venue: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: [
            { userId: 'asc' },
            { createdAt: 'desc' }
          ],
          // Use a subquery approach: get distinct userIds first, then fetch their latest booking
          // For SQLite, we'll fetch and deduplicate in memory (more efficient than 5000 rows)
          take: 2000 // Reasonable limit - covers most customers with some buffer
        }),
        
        // OPTIMIZED: Get status breakdowns for all customers (one query instead of N queries)
        db.booking.groupBy({
          by: ['userId', 'status'],
          where: bookingWhere,
          _count: { id: true }
        })
      ]);

      const customerIds = customersData.map(item => item.userId);
      if (customerIds.length === 0) {
        return ApiResponse.success([], {
          pagination: { currentPage: page, totalPages: 0, totalCount: 0, limit, hasNextPage: false, hasPreviousPage: false },
          filters: query,
          summary: { totalCustomers: 0, activeCustomers: 0, totalRevenue: 0, newCustomersThisMonth: 0, statusBreakdown: {} },
          vendor: { currencyCode: vendor?.currencyCode || 'INR' }
        });
      }

      // Build user search filter
      const userWhere: any = {
        id: { in: customerIds }
      };

      if (search) {
        userWhere.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } }
        ];
      }

      // OPTIMIZED: Get customer details using shared db instance
      const customers = await db.user.findMany({
        where: userWhere,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true
        }
      });

      // OPTIMIZED: Build lookup maps from pre-fetched data (no additional queries)
      // Only keep the most recent booking per customer (already sorted by createdAt desc)
      const recentBookingMap = new Map<string, typeof allBookings[0]>();
      allBookings.forEach(booking => {
        if (booking.userId && !recentBookingMap.has(booking.userId)) {
          recentBookingMap.set(booking.userId, booking);
        }
      });

      const statusBreakdownMap = new Map<string, Map<string, number>>();
      statusBreakdowns.forEach(item => {
        if (!statusBreakdownMap.has(item.userId)) {
          statusBreakdownMap.set(item.userId, new Map());
        }
        statusBreakdownMap.get(item.userId)!.set(item.status, item._count.id);
      });

      const customerStatsMap = new Map(customersData.map(item => [item.userId, item]));

      // Enhance customer data using pre-fetched data (no additional queries)
      const enrichedCustomers = customers.map(customer => {
        const customerStats = customerStatsMap.get(customer.id);
        const recentBooking = recentBookingMap.get(customer.id);
        const statusBreakdown = statusBreakdownMap.get(customer.id) || new Map();

        // Determine customer status
        let customerStatus: 'ACTIVE' | 'INACTIVE' | 'FIRST_TIME' | 'RETURNING' = 'FIRST_TIME';
        if (customerStats && customerStats._count.id > 1) {
          customerStatus = 'RETURNING';
        }
        if (!customer.isActive) {
          customerStatus = 'INACTIVE';
        }

        return {
          ...customer,
          totalBookings: customerStats?._count.id || 0,
          totalSpent: Number(customerStats?._sum.totalAmount || 0),
          firstBookingDate: customerStats?._min.createdAt,
          lastBookingDate: recentBooking?.createdAt,
          lastVenue: recentBooking?.court.venue.name,
          status: customerStatus,
          bookingStatusBreakdown: Object.fromEntries(statusBreakdown)
        };
      });

      // Apply filters
      let filteredCustomers = enrichedCustomers;

      if (status) {
        filteredCustomers = filteredCustomers.filter(customer => customer.status === status);
      }
      if (minBookings !== undefined) {
        filteredCustomers = filteredCustomers.filter(customer => customer.totalBookings >= minBookings);
      }
      if (maxBookings !== undefined) {
        filteredCustomers = filteredCustomers.filter(customer => customer.totalBookings <= maxBookings);
      }
      if (minSpent !== undefined) {
        filteredCustomers = filteredCustomers.filter(customer => customer.totalSpent >= minSpent);
      }
      if (maxSpent !== undefined) {
        filteredCustomers = filteredCustomers.filter(customer => customer.totalSpent <= maxSpent);
      }

      // Sort customers
      filteredCustomers.sort((a, b) => {
        let aValue: any, bValue: any;
        switch (sortBy) {
          case 'name':
            aValue = (a.name || '').toLowerCase();
            bValue = (b.name || '').toLowerCase();
            break;
          case 'email':
            aValue = (a.email || '').toLowerCase();
            bValue = (b.email || '').toLowerCase();
            break;
          case 'lastBookingDate':
            aValue = a.lastBookingDate ? new Date(a.lastBookingDate).getTime() : 0;
            bValue = b.lastBookingDate ? new Date(b.lastBookingDate).getTime() : 0;
            break;
          case 'totalBookings':
            aValue = a.totalBookings;
            bValue = b.totalBookings;
            break;
          case 'totalSpent':
            aValue = a.totalSpent;
            bValue = b.totalSpent;
            break;
          default:
            aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        }
        return sortOrder === 'asc' 
          ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0)
          : (aValue < bValue ? 1 : aValue > bValue ? -1 : 0);
      });

      // Calculate pagination
      const totalCount = filteredCustomers.length;
      const totalPages = Math.ceil(totalCount / limit);
      const skip = (page - 1) * limit;
      const paginatedCustomers = filteredCustomers.slice(skip, skip + limit);

      // OPTIMIZED: Calculate summary statistics - reuse data from customersData when possible
      // This avoids additional expensive groupBy queries
      const shouldCalculateSummary = !dateFrom && !dateTo && !venueId
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      
      const summaryStats = await Promise.all([
        Promise.resolve(customerIds.length), // Total customers
        
        // OPTIMIZED: Active customers - calculate from existing data if no filters
        shouldCalculateSummary
          ? Promise.resolve(
              customersData.filter(item => 
                item._max.createdAt && new Date(item._max.createdAt) >= thirtyDaysAgo
              ).length
            )
          : db.booking.groupBy({
              by: ['userId'],
              where: {
                ...bookingWhere,
                createdAt: { gte: thirtyDaysAgo }
              }
            }).then(result => result.length),
        
        // OPTIMIZED: Total revenue - reuse from customersData if no filters
        shouldCalculateSummary
          ? Promise.resolve({ 
              _sum: { 
                totalAmount: customersData.reduce((sum, item) => sum + Number(item._sum.totalAmount || 0), 0) 
              } 
            })
          : db.booking.aggregate({
              where: bookingWhere,
              _sum: { totalAmount: true }
            }).then(result => ({ _sum: { totalAmount: result._sum.totalAmount } })),
        
        // OPTIMIZED: New customers this month - calculate from existing data if no filters
        shouldCalculateSummary
          ? Promise.resolve(
              customersData.filter(item => 
                item._min.createdAt && new Date(item._min.createdAt) >= monthStart
              ).length
            )
          : db.booking.groupBy({
              by: ['userId'],
              where: {
                ...bookingWhere,
                createdAt: { gte: monthStart }
              }
            }).then(result => result.length),
        
        // Customer status breakdown (from enriched data - already calculated)
        Promise.resolve(enrichedCustomers.reduce((acc, customer) => {
          acc[customer.status] = (acc[customer.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>))
      ]);

      const [totalCustomers, activeCustomers, revenueStats, newCustomersThisMonth, statusBreakdown] = summaryStats;

      return ApiResponse.success(paginatedCustomers, {
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        },
        filters: {
          search,
          status,
          sortBy,
          sortOrder,
          dateFrom,
          dateTo,
          minBookings,
          maxBookings,
          minSpent,
          maxSpent,
          venueId
        },
        summary: {
          totalCustomers,
          activeCustomers,
          totalRevenue: Number(revenueStats._sum?.totalAmount || 0),
          newCustomersThisMonth,
          statusBreakdown: statusBreakdown
        },
        vendor: {
          currencyCode: vendor?.currencyCode || 'INR'
        }
      });

    } catch (error) {
      console.error('Error fetching customers:', error);

      if (error instanceof z.ZodError) {
        return ApiResponse.error('Invalid query parameters', 'INVALID_QUERY', 400);
      }

      return ApiResponse.error('Failed to fetch customers', 'CUSTOMERS_ERROR', 500);
    }
  }),
  'GET /api/vendors/[vendorId]/customers'
);