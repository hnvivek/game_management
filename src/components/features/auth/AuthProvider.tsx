'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Vendor {
  id: string
  name: string
  slug: string
  isActive: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: 'PLATFORM_ADMIN' | 'VENDOR_ADMIN' | 'VENDOR_STAFF' | 'CUSTOMER'
  phone?: string
  avatarUrl?: string
  isActive: boolean
  vendorId?: string | null
  vendor?: Vendor | null
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const hasCheckedAuth = useRef(false)

  useEffect(() => {
    // Only check auth once on mount
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true
      checkAuthSession()
    }
  }, [])

  const checkAuthSession = async () => {
    try {
      // Use AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

      // Check for token in cookies with cache: 'no-store' to avoid stale data
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Important for cookies
        cache: 'no-store', // Always fetch fresh
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const userData = await response.json()
        // Include vendorId and vendor from the API response
        setUser({
          ...userData.user,
          vendorId: userData.user.vendorId || null,
          vendor: userData.user.vendor || null
        })
      } else {
        // No valid session, clear any stored data
        setUser(null)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Auth session check timed out')
      } else {
        console.error('Auth session check failed:', error)
      }
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        // Include vendorId and vendor from the API response
        setUser({
          ...data.user,
          vendorId: data.user.vendorId || null,
          vendor: data.user.vendor || null
        })

        // Redirect based on user role
        switch (data.user.role) {
          case 'PLATFORM_ADMIN':
            router.push('/admin/dashboard')
            break
          case 'VENDOR_ADMIN':
          case 'VENDOR_STAFF':
            router.push('/vendor/dashboard')
            break
          case 'CUSTOMER':
            router.push('/dashboard')
            break
          default:
            router.push('/')
        }

        return { success: true }
      } else {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error || 'Login failed'
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: 'Network error. Please try again.'
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Call logout API to clear cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      setUser(null)
      router.push('/')
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}