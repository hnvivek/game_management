import { api } from '@/lib/utils/api'

/**
 * Vendor Analytics API - Get analytics for authenticated vendor
 */

export interface VendorAnalyticsFilters {
  period?: '7d' | '30d' | '90d' | '1y' | 'all'
  metric?: 'revenue' | 'bookings' | 'venues' | 'customers'
  groupBy?: 'day' | 'week' | 'month' | 'year'
  venueId?: string
  sportId?: string
  compareWith?: 'previous_period' | 'last_year'
}

export interface VendorAnalyticsResponse {
  success: boolean
  data: {
    period: {
      from: string
      to: string
      type: string
      groupBy: string
    }
    revenue: {
      total: number
      count: number
      byPeriod: Array<{
        period: Date
        bookingCount: number
        revenue: number
        avgBookingValue: number
      }>
    }
    bookings: {
      total: number
      byPeriod: Array<{
        period: Date
        bookingCount: number
        confirmed: number
        cancelled: number
        completed: number
        revenue: number
      }>
      byStatus: Record<string, number>
    }
    venues: {
      total: number
      active: number
      topPerformers: Array<{
        id: string
        name: string
        bookingCount: number
        revenue: number
      }>
    }
    customers: {
      total: number
      new: number
      returning: number
      retentionRate: number
      topCustomers: Array<{
        id: string
        name: string
        email: string
        bookingCount: number
      }>
    }
    performance: {
      confirmationRate: number
      completionRate: number
      cancellationRate: number
      avgBookingValue: number
      occupancyRate: number
      customerSatisfaction: number
      conversion: {
        visitorToBooking: number
        bookingToConfirmation: number
      }
    }
    timeAnalytics: {
      peakHours: Array<{
        hour: number
        bookingCount: number
      }>
      peakDays: Array<{
        dayOfWeek: number
        dayName: string
        bookingCount: number
      }>
    }
    growth?: {
      revenue: number
      bookings: number
      customers: number
      occupancyRate?: number
      customerSatisfaction?: number
      completionRate?: number
      comparisonPeriod: {
        from: string
        to: string
      }
    }
    summary: {
      totalRevenue: number
      totalBookings: number
      totalCustomers: number
      totalVenues: number
      averageBookingValue: number
      revenuePerCustomer: number
      bookingsPerCustomer: number
      occupancyRate: number
      customerSatisfaction: number
    }
  }
}

/**
 * Fetch analytics for the authenticated vendor
 */
export async function fetchVendorAnalytics(
  vendorId: string,
  filters: VendorAnalyticsFilters = {},
  signal?: AbortSignal
): Promise<VendorAnalyticsResponse['data']> {
  const params: Record<string, string> = {}

  if (filters.period) params.period = filters.period
  if (filters.metric) params.metric = filters.metric
  if (filters.groupBy) params.groupBy = filters.groupBy
  if (filters.venueId) params.venueId = filters.venueId
  if (filters.sportId) params.sportId = filters.sportId
  if (filters.compareWith) params.compareWith = filters.compareWith

  const response = await api.get<VendorAnalyticsResponse>(
    `/api/vendors/${vendorId}/analytics`,
    params,
    {
      showToast: false,
      signal // Pass AbortSignal
    }
  )

  if (response.error) {
    console.error('Analytics API error:', response.error)
    throw new Error(response.error)
  }

  if (!response.data) {
    console.error('Analytics API: No data in response', response)
    throw new Error('No data received from analytics API')
  }

  if (!response.data.success) {
    const errorMsg = typeof response.data.error === 'object' 
      ? response.data.error?.message || 'Unknown error'
      : response.data.error || 'Failed to fetch analytics'
    console.error('Analytics API: success=false', response.data)
    throw new Error(errorMsg)
  }

  return response.data.data
}

