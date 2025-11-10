'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/features/auth/AuthProvider'
import { useEffect } from 'react'

interface Vendor {
  id: string
  name: string
  slug: string
  isActive: boolean
}

interface User {
  id: string
  email: string
  name: string
  role: string
  vendorId: string | null
  vendor: Vendor | null
}

export function useVendor() {
  const { user: authUser, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !authUser) {
      router.push('/auth/signin')
    }
  }, [authUser, authLoading, router])

  const vendorId = authUser?.vendorId || null
  const vendor = authUser?.vendor || null
  const user: User | null = authUser ? {
    id: authUser.id,
    email: authUser.email,
    name: authUser.name,
    role: authUser.role,
    vendorId: authUser.vendorId || null,
    vendor: authUser.vendor || null
  } : null

  return {
    vendorId,
    vendor,
    user,
    isLoading: authLoading,
    error: null
  }
}


