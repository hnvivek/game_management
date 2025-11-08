import { api } from '@/lib/utils/api'

/**
 * Platform Admin API - Manage all vendors across the platform
 */

export interface AdminVendorFilters {
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'inactive' | 'all'
  country?: string
  sortBy?: 'name' | 'createdAt' | 'onboardedAt' | 'venueCount' | 'bookingCount'
  sortOrder?: 'asc' | 'desc'
  createdAfter?: string
  createdBefore?: string
  hasVenues?: boolean
}

export interface AdminVendorStats {
  total: number
  active: number
  pending: number
  suspended: number
  totalVenues: number
  totalRevenue: number
  pendingApplications: number
  growth: number
}

export interface AdminVendorsResponse {
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
  summary: AdminVendorStats
}

/**
 * Fetch all vendors for platform admin with filters
 */
export async function fetchAdminVendors(filters: AdminVendorFilters = {}) {
  const params: Record<string, string> = {}
  
  if (filters.page) params.page = filters.page.toString()
  if (filters.limit) params.limit = filters.limit.toString()
  if (filters.search) params.search = filters.search
  if (filters.status) params.status = filters.status
  if (filters.country) params.country = filters.country
  if (filters.sortBy) params.sortBy = filters.sortBy
  if (filters.sortOrder) params.sortOrder = filters.sortOrder
  if (filters.createdAfter) params.createdAfter = filters.createdAfter
  if (filters.createdBefore) params.createdBefore = filters.createdBefore
  if (filters.hasVenues !== undefined) params.hasVenues = filters.hasVenues ? 'true' : 'false'

  const response = await api.get<AdminVendorsResponse>('/api/admin/vendors', params, {
    showToast: false
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Fetch vendor statistics for platform admin dashboard
 */
export async function fetchAdminVendorStats(): Promise<AdminVendorStats> {
  const response = await api.get<AdminVendorsResponse>('/api/admin/vendors', { limit: '1' }, {
    showToast: false
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!.summary || {
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    totalVenues: 0,
    totalRevenue: 0,
    pendingApplications: 0,
    growth: 0
  }
}

/**
 * Fetch single vendor by ID (platform admin)
 */
export async function fetchAdminVendorById(vendorId: string) {
  const response = await api.get(`/api/admin/vendors/${vendorId}`, undefined, {
    showToast: false
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Update vendor (platform admin)
 */
export async function updateAdminVendor(vendorId: string, updates: any) {
  const response = await api.put(`/api/admin/vendors/${vendorId}`, updates, {
    showToast: true,
    successMessage: 'Vendor updated successfully'
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Delete vendor (soft delete) - Platform admin only
 */
export async function deleteAdminVendor(vendorId: string) {
  const response = await api.delete(`/api/admin/vendors/${vendorId}`, {
    showToast: true,
    successMessage: 'Vendor deleted successfully'
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Bulk update vendors (platform admin)
 */
export async function bulkUpdateAdminVendors(vendorIds: string[], updates: any) {
  const response = await api.put('/api/admin/vendors', {
    vendorIds,
    updates
  }, {
    showToast: true,
    successMessage: 'Vendors updated successfully'
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

