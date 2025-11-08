import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withVendorOwnershipAuth, ApiResponse } from '@/lib/auth/api-auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withPerformanceTracking } from '@/lib/middleware/performance';

const prisma = new PrismaClient();

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
        
        // Get customer aggregation stats (one query)
        prisma.booking.groupBy({
          by: ['userId'],
          where: bookingWhere,
          _count: { id: true },
          _sum: { totalAmount: true },
          _min: { createdAt: true },
          _max: { createdAt: true }
        }),
        
        // Fetch all recent bookings with venue info (one query instead of N queries)
        prisma.booking.findMany({
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
          orderBy: { createdAt: 'desc' }
        }),
        
        // Get status breakdowns for all customers (one query instead of N queries)
        prisma.booking.groupBy({
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

      // Get customer details
      const customers = await prisma.user.findMany({
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
      const recentBookingMap = new Map<string, typeof allBookings[0]>();
      allBookings.forEach(booking => {
        if (!recentBookingMap.has(booking.userId)) {
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

      // OPTIMIZED: Calculate summary statistics in parallel (reuse existing data where possible)
      const summaryStats = await Promise.all([
        Promise.resolve(customerIds.length), // Total customers
        
        // Active customers (with bookings in last 30 days)
        prisma.booking.groupBy({
          by: ['userId'],
          where: {
            ...bookingWhere,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        }).then(result => result.length),
        
        // Total revenue (reuse from customersData if no filters)
        (dateFrom || dateTo || venueId)
          ? prisma.booking.aggregate({
              where: bookingWhere,
              _sum: { totalAmount: true }
            }).then(result => ({ _sum: { totalAmount: result._sum.totalAmount } }))
          : Promise.resolve({ _sum: { totalAmount: customersData.reduce((sum, item) => sum + Number(item._sum.totalAmount || 0), 0) } }),
        
        // New customers this month
        prisma.booking.groupBy({
          by: ['userId'],
          where: {
            ...bookingWhere,
            createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          }
        }).then(result => result.length),
        
        // Customer status breakdown (from enriched data)
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
          statusBreakdown
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