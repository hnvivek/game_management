/**
 * Authentication Types
 */

export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: 'CUSTOMER' | 'VENDOR_ADMIN' | 'VENDOR_STAFF' | 'PLATFORM_ADMIN'
  isActive: boolean
  avatarUrl?: string | null
}

export interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

