import { api } from '@/lib/utils/api'

/**
 * Vendor Admin API - Manage own customers
 * Note: These endpoints automatically scope to the authenticated vendor
 */

export interface VendorCustomerFilters {
  page?: number
  limit?: number
  search?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'FIRST_TIME' | 'RETURNING'
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastBookingDate' | 'totalBookings' | 'totalSpent'
  sortOrder?: 'asc' | 'desc'
  dateFrom?: string
  dateTo?: string
  minBookings?: number
  maxBookings?: number
  minSpent?: number
  maxSpent?: number
  venueId?: string
}

export interface VendorCustomerStats {
  totalCustomers: number
  activeCustomers: number
  newCustomersThisMonth: number
  totalRevenue: number
  statusBreakdown: Record<string, number>
}

export interface VendorCustomersResponse {
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
      totalCustomers: number
      activeCustomers: number
      totalRevenue: number
      newCustomersThisMonth: number
      statusBreakdown: Record<string, number>
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
    totalCustomers: number
    activeCustomers: number
    totalRevenue: number
    newCustomersThisMonth: number
    statusBreakdown: Record<string, number>
  }
  vendor?: {
    currencyCode: string
  }
}

/**
 * Fetch customers for the authenticated vendor
 */
export async function fetchVendorCustomers(vendorId: string, filters: VendorCustomerFilters = {}) {
  const params: Record<string, string> = {}

  if (filters.page) params.page = filters.page.toString()
  if (filters.limit) params.limit = filters.limit.toString()
  if (filters.search) params.search = filters.search
  if (filters.status) params.status = filters.status
  if (filters.sortBy) params.sortBy = filters.sortBy
  if (filters.sortOrder) params.sortOrder = filters.sortOrder
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo) params.dateTo = filters.dateTo
  if (filters.minBookings) params.minBookings = filters.minBookings.toString()
  if (filters.maxBookings) params.maxBookings = filters.maxBookings.toString()
  if (filters.minSpent) params.minSpent = filters.minSpent.toString()
  if (filters.maxSpent) params.maxSpent = filters.maxSpent.toString()
  if (filters.venueId) params.venueId = filters.venueId

  const response = await api.get<VendorCustomersResponse>(`/api/vendors/${vendorId}/customers`, params, {
    showToast: false
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Fetch customer statistics for vendor dashboard
 * Optimized: Uses the customers API which already includes summary stats
 */
export async function fetchVendorCustomerStats(vendorId: string): Promise<VendorCustomerStats> {
  try {
    // Fetch customers with summary stats in a single call
    const customersResponse = await fetchVendorCustomers(vendorId, {
      page: 1,
      limit: 1 // We only need the summary, not the actual customers
    })

    if (!customersResponse.success) {
      throw new Error('Failed to fetch vendor customer stats')
    }

    // The summary is in meta.summary
    const summary = customersResponse.meta?.summary || customersResponse.summary
    if (!summary) {
      throw new Error('Invalid response format - missing summary')
    }

    return {
      totalCustomers: summary.totalCustomers,
      activeCustomers: summary.activeCustomers,
      newCustomersThisMonth: summary.newCustomersThisMonth,
      totalRevenue: summary.totalRevenue,
      statusBreakdown: summary.statusBreakdown || {}
    }
  } catch (error) {
    console.error('Error fetching vendor customer stats:', error)
    throw error
  }
}