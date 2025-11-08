'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  fallback?: React.ReactNode
}

export function AuthGuard({
  children,
  requireAuth = false,
  redirectTo = '/auth/signin',
  fallback
}: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // If authentication is required and user is not logged in
      if (requireAuth && !user) {
        router.push(redirectTo)
        return
      }

      // If user is logged in and trying to access auth pages, redirect to dashboard
      if (!requireAuth && user) {
        switch (user.role) {
          case 'PLATFORM_ADMIN':
            router.push('/admin/dashboard')
            break
          case 'VENDOR':
            router.push('/vendor/dashboard')
            break
          case 'CUSTOMER':
            router.push('/dashboard')
            break
          default:
            router.push('/')
        }
        return
      }
    }
  }, [user, isLoading, requireAuth, redirectTo, router])

  // Show loading state
  if (isLoading) {
    return fallback || <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // If authentication is required and user is not logged in, don't render children
  if (requireAuth && !user) {
    return fallback || null
  }

  // If user is logged in and trying to access auth pages, don't render children
  if (!requireAuth && user) {
    return fallback || null
  }

  // Otherwise, render children
  return <>{children}</>
}