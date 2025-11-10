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

