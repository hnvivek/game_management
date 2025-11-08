'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchVendorInfo = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          const errorMessage = errorData.error || `Failed to fetch user info: ${response.status} ${response.statusText}`
          
          // If unauthorized or user not found, redirect to login
          if (response.status === 401 || response.status === 404) {
            console.warn('Authentication failed, redirecting to login:', errorMessage)
            router.push('/auth/signin')
            return
          }
          
          throw new Error(errorMessage)
        }

        const data = await response.json()
        
        if (!data || !data.user) {
          throw new Error('Invalid response format from server')
        }

        const userData = data.user

        setUser(userData)
        setVendorId(userData.vendorId)
        setVendor(userData.vendor)
      } catch (err) {
        console.error('Error fetching vendor info:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        // Don't redirect on network errors, only on auth errors
        if (err instanceof Error && (err.message.includes('401') || err.message.includes('404'))) {
          router.push('/auth/signin')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchVendorInfo()
  }, [router])

  return {
    vendorId,
    vendor,
    user,
    isLoading,
    error
  }
}


