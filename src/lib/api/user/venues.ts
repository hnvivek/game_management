import { api } from '@/lib/utils/api'

/**
 * User API - Browse and search venues for booking
 */

export interface VenueSearchFilters {
  search?: string
  city?: string
  sport?: string
  vendorId?: string
  date?: string
  startTime?: string
  duration?: string
  limit?: number
}

export interface Venue {
  id: string
  name: string
  description?: string
  address?: string
  city?: string
  vendor: {
    id: string
    name: string
  }
  courts: Array<{
    id: string
    sport: {
      displayName: string
    }
  }>
}

export interface VenuesResponse {
  venues: Venue[]
}

/**
 * Search and browse venues (public/user-facing)
 */
export async function searchVenues(filters: VenueSearchFilters = {}) {
  const params: Record<string, string> = {}
  
  if (filters.search) params.search = filters.search
  if (filters.city) params.city = filters.city
  if (filters.sport) params.sport = filters.sport
  if (filters.vendorId) params.vendorId = filters.vendorId
  if (filters.date) params.date = filters.date
  if (filters.startTime) params.startTime = filters.startTime
  if (filters.duration) params.duration = filters.duration
  if (filters.limit) params.limit = filters.limit.toString()

  const response = await api.get<VenuesResponse>('/api/venues', params, {
    showToast: false
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Get venue availability for booking
 */
export async function getVenueAvailability(venueId: string, date: string, duration?: number) {
  const params: Record<string, string> = {
    venueId,
    date
  }
  
  if (duration) params.duration = duration.toString()

  const response = await api.get(`/api/venues/${venueId}/availability`, params, {
    showToast: false
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

