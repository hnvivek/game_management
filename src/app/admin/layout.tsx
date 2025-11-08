'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { AdminSidebar } from '@/components/features/admin/AdminSidebar'
import { AdminHeader } from '@/components/features/admin/AdminHeader'
import { AdminProtectedRoute } from '@/components/shared/RoleProtectedRoute'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [vendorName, setVendorName] = useState<string | null>(null)
  const [venueName, setVenueName] = useState<string | null>(null)
  const [courtName, setCourtName] = useState<string | null>(null)
  const pathname = usePathname()

  // Extract IDs from pathname if present
  const getVendorIdFromPath = () => {
    const pathSegments = pathname.split('/').filter(Boolean)
    if (pathSegments.length >= 3 && pathSegments[0] === 'admin' && pathSegments[1] === 'vendors') {
      return pathSegments[2]
    }
    return null
  }

  const getVenueIdFromPath = () => {
    const pathSegments = pathname.split('/').filter(Boolean)
    if (pathSegments.length >= 5 && pathSegments[0] === 'admin' && pathSegments[1] === 'vendors' && pathSegments[3] === 'venues') {
      return pathSegments[4]
    }
    return null
  }

  const getCourtIdFromPath = () => {
    const pathSegments = pathname.split('/').filter(Boolean)
    if (pathSegments.length >= 7 && pathSegments[0] === 'admin' && pathSegments[1] === 'vendors' && pathSegments[3] === 'venues' && pathSegments[5] === 'courts') {
      return pathSegments[6]
    }
    return null
  }

  // Fetch names when IDs are present in URL
  useEffect(() => {
    const vendorId = getVendorIdFromPath()
    const venueId = getVenueIdFromPath()
    const courtId = getCourtIdFromPath()

    if (vendorId) {
      fetchVendorName(vendorId)
    } else {
      setVendorName(null)
    }

    if (venueId && vendorId) {
      fetchVenueName(vendorId, venueId)
    } else {
      setVenueName(null)
    }

    if (courtId && vendorId && venueId) {
      fetchCourtName(vendorId, venueId, courtId)
    } else {
      setCourtName(null)
    }
  }, [pathname])

  const fetchVendorName = async (vendorId: string) => {
    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setVendorName(result.data.name)
        }
      }
    } catch (error) {
      console.error('Error fetching vendor name:', error)
      setVendorName(null)
    }
  }

  const fetchVenueName = async (vendorId: string, venueId: string) => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/venues/${venueId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setVenueName(result.data.name)
        }
      }
    } catch (error) {
      console.error('Error fetching venue name:', error)
      setVenueName(null)
    }
  }

  const fetchCourtName = async (vendorId: string, venueId: string, courtId: string) => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/venues/${venueId}/courts/${courtId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setCourtName(result.data.name)
        }
      }
    } catch (error) {
      console.error('Error fetching court name:', error)
      setCourtName(null)
    }
  }

  // Extract title from pathname
  const getPageTitle = () => {
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length >= 2 && pathSegments[0] === 'admin') {
      // For court pages: show court name and action
      if (pathSegments.includes('courts') && courtName) {
        const page = pathSegments[pathSegments.length - 1].replace(/-/g, ' ')
        const pageName = page === 'edit' ? 'Edit Court' : page === 'new' ? 'New Court' : 'Court Details'
        return `${courtName} - ${pageName}`
      }

      // For venue pages (but not court pages): show venue name and action
      if (pathSegments.includes('venues') && !pathSegments.includes('courts') && venueName) {
        const page = pathSegments[pathSegments.length - 1].replace(/-/g, ' ')
        const pageName = page === 'edit' ? 'Edit Venue' : page === 'new' ? 'New Venue' : 'Venue Details'
        return `${venueName} - ${pageName}`
      }

      // For vendor pages (but not venue/court pages): show vendor name and action
      if (pathSegments[1] === 'vendors' && !pathSegments.includes('venues') && vendorName) {
        const page = pathSegments.slice(3).join('/').replace(/-/g, ' ') || 'details'
        if (page === '' || page === 'details') {
          return vendorName
        }
        return `${vendorName} - ${page.charAt(0).toUpperCase() + page.slice(1)}`
      }

      // Fallback: just show clean page names
      const page = pathSegments[pathSegments.length - 1].replace(/-/g, ' ')
      return page.charAt(0).toUpperCase() + page.slice(1)
    }
    return 'Admin'
  }

  const getPageSubtitle = () => {
    const subtitles: Record<string, string> = {
      dashboard: 'Platform overview and key metrics',
      users: 'Manage user accounts and permissions',
      vendors: 'Vendor management and approval process',
      bookings: 'Booking management and calendar',
      analytics: 'Reports, insights, and platform analytics',
      settings: 'Platform configuration and system settings'
    }

    const page = pathname.split('/')[2]
    return subtitles[page] || ''
  }

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <AdminProtectedRoute requiredRoles={['PLATFORM_ADMIN']}>
      <div className="flex h-screen bg-background">
        {/* Persistent Sidebar - only loads once */}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out',
            sidebarOpen ? 'w-64' : 'w-0 lg:w-16'
          )}
        >
          <AdminSidebar
            isOpen={sidebarOpen}
            onToggle={handleToggleSidebar}
            pathname={pathname}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Persistent Header */}
          <AdminHeader
            title={getPageTitle()}
            subtitle={getPageSubtitle()}
            onToggleSidebar={handleToggleSidebar}
            sidebarOpen={sidebarOpen}
          />

          {/* Page Content - Only this area changes during navigation */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  )
}