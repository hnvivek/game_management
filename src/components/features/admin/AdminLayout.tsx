'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'
import { AdminProtectedRoute } from '@/components/shared/RoleProtectedRoute'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()

  // Extract title from pathname if not provided
  const getPageTitle = () => {
    if (title) return title

    const pathSegments = pathname.split('/').filter(Boolean)
    if (pathSegments.length >= 2 && pathSegments[0] === 'admin') {
      const page = pathSegments[1]
      return page.charAt(0).toUpperCase() + page.slice(1).replace(/-/g, ' ')
    }
    return 'Admin'
  }

  const getPageSubtitle = () => {
    if (subtitle) return subtitle

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
        {/* Sidebar */}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out',
            sidebarOpen ? 'w-64' : 'w-0 lg:w-16'
          )}
        >
          <div className={cn('h-full', sidebarOpen ? 'block' : 'hidden lg:block')}>
            <AdminSidebar
              isOpen={sidebarOpen}
              onToggle={handleToggleSidebar}
              className={cn(
                'hidden lg:flex',
                !sidebarOpen && 'lg:w-16'
              )}
            />
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={handleToggleSidebar}
          />
        )}

        {/* Mobile Sidebar */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 lg:hidden',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'transition-transform duration-300 ease-in-out'
          )}
        >
          <AdminSidebar
            isOpen={true}
            onToggle={handleToggleSidebar}
            className="w-64"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <AdminHeader
            onToggleSidebar={handleToggleSidebar}
            sidebarOpen={sidebarOpen}
            title={getPageTitle()}
            subtitle={getPageSubtitle()}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-muted/30">
            <div className="h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  )
}