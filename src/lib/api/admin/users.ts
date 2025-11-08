import { api } from '@/lib/utils/api'

/**
 * Platform Admin API - Manage all users across the platform
 */

export interface AdminUserFilters {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: 'active' | 'inactive' | 'all'
  country?: string
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastLoginAt'
  sortOrder?: 'asc' | 'desc'
  createdAfter?: string
  createdBefore?: string
}

export interface AdminUserStats {
  total: number
  active: number
  inactive: number
  newThisMonth: number
  growth: number
}

export interface AdminUsersResponse {
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
  summary?: AdminUserStats
}

/**
 * Fetch all users for platform admin with filters
 */
export async function fetchAdminUsers(filters: AdminUserFilters = {}) {
  const params: Record<string, string> = {}
  
  if (filters.page) params.page = filters.page.toString()
  if (filters.limit) params.limit = filters.limit.toString()
  if (filters.search) params.search = filters.search
  if (filters.role) params.role = filters.role
  if (filters.status) params.status = filters.status
  if (filters.country) params.country = filters.country
  if (filters.sortBy) params.sortBy = filters.sortBy
  if (filters.sortOrder) params.sortOrder = filters.sortOrder
  if (filters.createdAfter) params.createdAfter = filters.createdAfter
  if (filters.createdBefore) params.createdBefore = filters.createdBefore

  const response = await api.get<AdminUsersResponse>('/api/admin/users', params, {
    showToast: false
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Fetch user statistics for platform admin dashboard
 */
export async function fetchAdminUserStats(): Promise<AdminUserStats> {
  const response = await api.get('/api/admin/users/stats', undefined, {
    showToast: false
  })

  if (response.error) {
    throw new Error(response.error)
  }

  if (response.data?.success && response.data?.data) {
    return response.data.data
  }

  // Fallback if stats endpoint doesn't exist
  const usersResponse = await api.get<AdminUsersResponse>('/api/admin/users', { limit: '1' }, {
    showToast: false
  })

  if (usersResponse.error) {
    throw new Error(usersResponse.error)
  }

  const summary = usersResponse.data?.summary || {
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0,
    growth: 0
  }

  return summary
}

/**
 * Fetch single user by ID (platform admin)
 */
export async function fetchAdminUserById(userId: string) {
  const response = await api.get(`/api/admin/users/${userId}`, undefined, {
    showToast: false
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Update user (platform admin)
 */
export async function updateAdminUser(userId: string, updates: any) {
  const response = await api.put(`/api/admin/users/${userId}`, updates, {
    showToast: true,
    successMessage: 'User updated successfully'
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Delete user (soft delete) - Platform admin only
 */
export async function deleteAdminUser(userId: string) {
  const response = await api.delete(`/api/admin/users/${userId}`, {
    showToast: true,
    successMessage: 'User deleted successfully'
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/**
 * Bulk update users (platform admin)
 */
export async function bulkUpdateAdminUsers(userIds: string[], updates: any) {
  const response = await api.put('/api/admin/users', {
    userIds,
    updates
  }, {
    showToast: true,
    successMessage: 'Users updated successfully'
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

