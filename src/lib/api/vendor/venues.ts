import { api } from '@/lib/utils/api'

/**
 * Vendor Admin API - Manage own venues and courts
 * Note: These endpoints automatically scope to the authenticated vendor
 */

export interface VendorVenueFilters {
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  status?: 'active' | 'inactive' | 'all'
}

export interface VendorVenue {
  id: string
  name: string
  description?: string
  address?: string
  city?: string
  postalCode?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  courts: Array<{
    id: string
    sport: {
      displayName: string
    }
  }>
}

/**
 * Fetch venues for the authenticated vendor
 */
export async function fetchVendorVenues(vendorId: string, filters: VendorVenueFilters = {}) {
  const params: Record<string, string> = {}
  
  if (filters.limit) params.limit = filters.limit.toString()
  if (filters.sortBy) params.sortBy = filters.sortBy
  if (filters.sortOrder) params.sortOrder = filters.sortOrder
  if (filters.search) params.search = filters.search

  const response = await api.get(`/api/vendors/${vendorId}/venues`, params, {
    showToast: false
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Fetch single venue by ID (vendor admin - scoped to their vendor)
 */
export async function fetchVendorVenueById(vendorId: string, venueId: string) {
  const response = await api.get(`/api/vendors/${vendorId}/venues/${venueId}`, undefined, {
    showToast: false
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Create venue (vendor admin)
 */
export async function createVendorVenue(vendorId: string, venueData: any) {
  const response = await api.post(`/api/vendors/${vendorId}/venues`, venueData, {
    showToast: true,
    successMessage: 'Venue created successfully'
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Update venue (vendor admin - scoped to their vendor)
 */
export async function updateVendorVenue(vendorId: string, venueId: string, updates: any) {
  const response = await api.put(`/api/vendors/${vendorId}/venues/${venueId}`, updates, {
    showToast: true,
    successMessage: 'Venue updated successfully'
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Delete venue (soft delete) - Vendor admin only (scoped to their vendor)
 */
export async function deleteVendorVenue(vendorId: string, venueId: string) {
  const response = await api.delete(`/api/vendors/${vendorId}/venues/${venueId}`, {
    showToast: true,
    successMessage: 'Venue deleted successfully'
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Toggle venue status (vendor admin)
 */
export async function toggleVendorVenueStatus(vendorId: string, venueId: string) {
  const response = await api.post(`/api/vendors/${vendorId}/venues/${venueId}/toggle-status`, {}, {
    showToast: true,
    successMessage: 'Venue status updated'
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

