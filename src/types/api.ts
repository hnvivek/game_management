/**
 * API Response Types
 * Centralized type definitions for API responses
 */

// Admin API Types
export interface AdminVendorResponse {
  success: boolean
  data: any
  pagination?: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  summary?: any
}

export interface AdminUserResponse {
  success: boolean
  data: any[]
  pagination?: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface AdminBookingResponse {
  success: boolean
  data: any[]
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
    statusBreakdown: Record<string, { count: number; revenue: number }>
  }
}

// Vendor API Types
export interface VendorVenueResponse {
  success: boolean
  data: any[]
}

export interface VendorBookingResponse {
  success: boolean
  data: any[]
}

// User API Types
export interface UserBookingResponse {
  bookings: any[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface VenuesResponse {
  venues: any[]
}

