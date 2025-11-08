import { api } from '@/lib/utils/api'

/**
 * Platform Admin API - Manage all bookings across the platform
 */

export interface AdminBookingFilters {
  page?: number
  limit?: number
  search?: string
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  type?: 'ONE_TIME' | 'RECURRING' | 'TOURNAMENT' | 'MATCH' | 'TRAINING'
  vendorId?: string
  venueId?: string
  userId?: string
  sportId?: string
  country?: string
  sortBy?: 'createdAt' | 'startTime' | 'endTime' | 'totalAmount' | 'status'
  sortOrder?: 'asc' | 'desc'
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
}

export interface AdminBookingStats {
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

export interface AdminBookingsResponse {
  success: boolean
  data: any[]
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
    statusBreakdown: Record<string, { count: number; revenue: number }>
    typeBreakdown: Record<string, { count: number; revenue: number }>
  }
}

/**
 * Fetch all bookings for platform admin with filters
 */
export async function fetchAdminBookings(filters: AdminBookingFilters = {}) {
  const params: Record<string, string> = {}
  
  if (filters.page) params.page = filters.page.toString()
  if (filters.limit) params.limit = filters.limit.toString()
  if (filters.search) params.search = filters.search
  if (filters.status) params.status = filters.status
  if (filters.type) params.type = filters.type
  if (filters.vendorId) params.vendorId = filters.vendorId
  if (filters.venueId) params.venueId = filters.venueId
  if (filters.userId) params.userId = filters.userId
  if (filters.sportId) params.sportId = filters.sportId
  if (filters.country) params.country = filters.country
  if (filters.sortBy) params.sortBy = filters.sortBy
  if (filters.sortOrder) params.sortOrder = filters.sortOrder
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo) params.dateTo = filters.dateTo
  if (filters.minAmount) params.minAmount = filters.minAmount.toString()
  if (filters.maxAmount) params.maxAmount = filters.maxAmount.toString()
  if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus

  const response = await api.get<AdminBookingsResponse>('/api/admin/bookings', params, {
    showToast: false
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Fetch booking statistics for platform admin dashboard
 */
export async function fetchAdminBookingStats(): Promise<AdminBookingStats> {
  try {
    // Fetch summary stats
    const summaryResponse = await fetch('/api/admin/bookings?limit=1', {
      credentials: 'include'
    })

    if (!summaryResponse.ok) {
      throw new Error('Failed to fetch booking stats')
    }

    const summaryData = await summaryResponse.json()

    if (!summaryData.success || !summaryData.summary) {
      throw new Error('Invalid response format')
    }

    const summary = summaryData.summary
    const statusBreakdown = summary.statusBreakdown || {}

    // Calculate today's bookings
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayResponse = await fetch(`/api/admin/bookings?dateFrom=${today.toISOString()}&limit=1000`, {
      credentials: 'include'
    })
    const todayData = todayResponse.ok ? await todayResponse.json() : { success: false, data: { data: [] } }
    const todayCount = todayData.success ? (todayData.data?.data?.length || todayData.data?.length || 0) : 0

    // Calculate this week's bookings
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const weekResponse = await fetch(`/api/admin/bookings?dateFrom=${weekStart.toISOString()}&limit=1000`, {
      credentials: 'include'
    })
    const weekData = weekResponse.ok ? await weekResponse.json() : { success: false, data: { data: [] } }
    const weekCount = weekData.success ? (weekData.data?.data?.length || weekData.data?.length || 0) : 0

    // Calculate this month's bookings
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthResponse = await fetch(`/api/admin/bookings?dateFrom=${monthStart.toISOString()}&limit=1000`, {
      credentials: 'include'
    })
    const monthData = monthResponse.ok ? await monthResponse.json() : { success: false, data: { data: [] } }
    const monthCount = monthData.success ? (monthData.data?.data?.length || monthData.data?.length || 0) : 0

    const totalBookings = summary.totalBookings || 0
    const totalRevenue = summary.totalRevenue || 0
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0

    return {
      total: totalBookings,
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
      confirmed: statusBreakdown.CONFIRMED?.count || 0,
      pending: statusBreakdown.PENDING?.count || 0,
      cancelled: statusBreakdown.CANCELLED?.count || 0,
      completed: statusBreakdown.COMPLETED?.count || 0,
      revenue: totalRevenue,
      avgBookingValue: avgBookingValue,
      growth: 0 // TODO: Calculate growth from revenue trend
    }
  } catch (error) {
    console.error('Error fetching booking stats:', error)
    throw error
  }
}

