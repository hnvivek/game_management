/**
 * Database Entity Types
 * Type definitions matching Prisma schema
 */

export type UserRole = 'CUSTOMER' | 'VENDOR_ADMIN' | 'VENDOR_STAFF' | 'PLATFORM_ADMIN'

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'

export type BookingType = 'ONE_TIME' | 'RECURRING' | 'TOURNAMENT' | 'MATCH' | 'TRAINING'

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED'

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET'

// Base entity interfaces
export interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  isActive: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Vendor {
  id: string
  name: string
  slug: string
  email: string
  isActive: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Venue {
  id: string
  name: string
  vendorId: string
  isActive: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Booking {
  id: string
  userId: string
  courtId: string
  status: BookingStatus
  type: BookingType
  startTime: Date
  endTime: Date
  totalAmount: number
  createdAt: Date
  updatedAt: Date
}

