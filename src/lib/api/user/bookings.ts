import { api } from '@/lib/utils/api'

/**
 * User API - Book courts, view own bookings
 */

export interface UserBookingFilters {
  userId: string
  status?: string
  limit?: number
  page?: number
}

/**
 * Fetch bookings for a user
 */
export async function fetchUserBookings(filters: UserBookingFilters) {
  const params: Record<string, string> = {
    userId: filters.userId
  }
  
  if (filters.status) params.status = filters.status
  if (filters.limit) params.limit = filters.limit.toString()
  if (filters.page) params.page = filters.page.toString()

  const response = await api.get('/api/bookings', params, {
    showToast: false
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Create a booking (user)
 */
export async function createBooking(bookingData: {
  venueId: string
  courtId: string
  date: string
  time: string
  duration: number
  playerCount?: number
  notes?: string
}) {
  const response = await api.post('/api/bookings', bookingData, {
    showToast: true,
    successMessage: 'Booking created successfully'
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Cancel a booking (user)
 */
export async function cancelBooking(bookingId: string) {
  const response = await api.delete(`/api/bookings/${bookingId}`, {
    showToast: true,
    successMessage: 'Booking cancelled successfully'
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

