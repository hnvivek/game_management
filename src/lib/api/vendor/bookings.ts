import { api } from '@/lib/utils/api'

/**
 * Vendor Admin API - Manage own bookings
 * Note: These endpoints automatically scope to the authenticated vendor
 */

export interface VendorBookingFilters {
  page?: number
  limit?: number
  search?: string
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  venueId?: string
  courtId?: string
  sportId?: string
  userId?: string
  sortBy?: 'createdAt' | 'startTime' | 'endTime' | 'totalAmount' | 'status'
  sortOrder?: 'asc' | 'desc'
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
  todayOnly?: boolean
  thisWeek?: boolean
}

export interface VendorBookingStats {
  total: number
  today: number
  thisWeek: number
  thisMonth: number
  confirmed: number
  pending: number
  cancelled: number
  completed: number
  revenue: number
  avgBookingValue: number
  growth: number
}

export interface VendorBookingsResponse {
  success: boolean
  data: any[]
  meta?: {
    pagination: {
      currentPage: number
      totalPages: number
      totalCount: number
      limit: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
    summary: {
      totalBookings: number
      totalRevenue: number
      confirmedBookings: number
      todayStats: {
        bookings: number
        revenue: number
      }
      upcomingBookings: number
      statusBreakdown: Record<string, { count: number; revenue: number }>
    }
    vendor?: {
      currencyCode: string
    }
  }
  pagination?: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  summary?: {
    totalBookings: number
    totalRevenue: number
    confirmedBookings: number
    todayStats: {
      bookings: number
      revenue: number
    }
    upcomingBookings: number
    statusBreakdown: Record<string, { count: number; revenue: number }>
  }
  vendor?: {
    currencyCode: string
  }
}

/**
 * Fetch bookings for the authenticated vendor
 */
export async function fetchVendorBookings(vendorId: string, filters: VendorBookingFilters = {}) {
  const params: Record<string, string> = {}
  
  if (filters.page) params.page = filters.page.toString()
  if (filters.limit) params.limit = filters.limit.toString()
  if (filters.search) params.search = filters.search
  if (filters.status) params.status = filters.status
  if (filters.venueId) params.venueId = filters.venueId
  if (filters.courtId) params.courtId = filters.courtId
  if (filters.sportId) params.sportId = filters.sportId
  if (filters.userId) params.userId = filters.userId
  if (filters.sortBy) params.sortBy = filters.sortBy
  if (filters.sortOrder) params.sortOrder = filters.sortOrder
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo) params.dateTo = filters.dateTo
  if (filters.minAmount) params.minAmount = filters.minAmount.toString()
  if (filters.maxAmount) params.maxAmount = filters.maxAmount.toString()
  if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus
  if (filters.todayOnly) params.todayOnly = 'true'
  if (filters.thisWeek) params.thisWeek = 'true'

  const response = await api.get<VendorBookingsResponse>(`/api/vendors/${vendorId}/bookings`, params, {
    showToast: false
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Fetch booking statistics for vendor dashboard
 * Optimized: Uses the bookings API which already includes summary stats
 */
export async function fetchVendorBookingStats(vendorId: string): Promise<VendorBookingStats> {
  try {
    // Fetch bookings with summary stats in a single call
    const bookingsResponse = await fetchVendorBookings(vendorId, {
      page: 1,
      limit: 1 // We only need the summary, not the actual bookings
    })

    if (!bookingsResponse.success) {
      throw new Error('Failed to fetch vendor booking stats')
    }

    // The summary is in meta.summary
    const summary = bookingsResponse.meta?.summary || bookingsResponse.summary
    if (!summary) {
      throw new Error('Invalid response format - missing summary')
    }
    const statusBreakdown = summary.statusBreakdown || {}

    // Extract counts from status breakdown
    const confirmedCount = statusBreakdown.CONFIRMED?.count || 0
    const pendingCount = statusBreakdown.PENDING?.count || 0
    const cancelledCount = statusBreakdown.CANCELLED?.count || 0
    const completedCount = statusBreakdown.COMPLETED?.count || 0

    // Calculate average booking value from confirmed and completed bookings
    const validBookings = confirmedCount + completedCount
    const avgBookingValue = validBookings > 0 
      ? summary.totalRevenue / validBookings 
      : 0

    // Calculate this week and this month counts
    // We'll need to make additional calls for these, but optimize by using todayStats
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    monthStart.setHours(0, 0, 0, 0)

    // Fetch week and month counts in parallel
    const [weekBookings, monthBookings] = await Promise.all([
      fetchVendorBookings(vendorId, {
        dateFrom: weekStart.toISOString(),
        limit: 1000,
        page: 1
      }).catch(() => ({ success: true, meta: { summary: { totalBookings: 0 } } })),
      fetchVendorBookings(vendorId, {
        dateFrom: monthStart.toISOString(),
        limit: 1000,
        page: 1
      }).catch(() => ({ success: true, meta: { summary: { totalBookings: 0 } } }))
    ])

    const weekSummary = weekBookings.meta?.summary || weekBookings.summary
    const monthSummary = monthBookings.meta?.summary || monthBookings.summary

    return {
      total: summary.totalBookings,
      today: summary.todayStats?.bookings || 0,
      thisWeek: weekSummary?.totalBookings || 0,
      thisMonth: monthSummary?.totalBookings || 0,
      confirmed: confirmedCount,
      pending: pendingCount,
      cancelled: cancelledCount,
      completed: completedCount,
      revenue: summary.totalRevenue,
      avgBookingValue: avgBookingValue,
      growth: 0 // Growth calculation would need historical data
    }
  } catch (error) {
    console.error('Error fetching vendor booking stats:', error)
    throw error
  }
}

