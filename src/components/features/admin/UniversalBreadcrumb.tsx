'use client'

import { ChevronRight, Home, BarChart3, Users, Store, Calendar, MapPin, Circle, TrendingUp, FileText, Shield, Database, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href: string
  icon?: any
  isCurrent?: boolean
}

export interface BreadcrumbConfig {
  [key: string]: {
    base: BreadcrumbItem[]
    dynamic?: (params: { [key: string]: string }, queryParams?: { [key: string]: string }) => BreadcrumbItem[]
  }
}

const breadcrumbConfig: BreadcrumbConfig = {
  '/admin/dashboard': {
    base: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home, isCurrent: true }
    ]
  },
  '/admin/users': {
    base: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Users', href: '/admin/users', icon: Users, isCurrent: true }
    ]
  },
  '/admin/users/create': {
    base: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Create User', href: '/admin/users/create', icon: Users, isCurrent: true }
    ]
  },
  '/admin/vendors': {
    base: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Vendors', href: '/admin/vendors', icon: Store, isCurrent: true }
    ]
  },
  '/admin/vendors/approval': {
    base: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Vendors', href: '/admin/vendors', icon: Store },
      { label: 'Approval Workflow', href: '/admin/vendors/approval', icon: Shield, isCurrent: true }
    ]
  },
  '/admin/vendors/create': {
    base: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Vendors', href: '/admin/vendors', icon: Store },
      { label: 'Create Vendor', href: '/admin/vendors/create', icon: Store, isCurrent: true }
    ]
  },
  '/admin/venues': {
    base: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Venues', href: '/admin/venues', icon: MapPin, isCurrent: true }
    ]
  },
  '/admin/venues/create': {
    base: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Venues', href: '/admin/venues', icon: MapPin },
      { label: 'Create Venue', href: '/admin/venues/create', icon: MapPin, isCurrent: true }
    ]
  },
  '/admin/courts': {
    base: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Courts', href: '/admin/courts', icon: Circle, isCurrent: true }
    ]
  },
  '/admin/courts/create': {
    base: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Courts', href: '/admin/courts', icon: Circle },
      { label: 'Create Court', href: '/admin/courts/create', icon: Circle, isCurrent: true }
    ]
  },
  '/admin/bookings': {
    base: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Bookings', href: '/admin/bookings', icon: Calendar, isCurrent: true }
    ]
  },
  '/admin/bookings/calendar': {
    base: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Bookings', href: '/admin/bookings', icon: Calendar },
      { label: 'Booking Calendar', href: '/admin/bookings/calendar', icon: Calendar, isCurrent: true }
    ]
  },
  '/admin/analytics': {
    base: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Analytics', href: '/admin/analytics', icon: TrendingUp, isCurrent: true }
    ]
  },
  '/admin/analytics/reports': {
    base: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
      { label: 'Reports', href: '/admin/analytics/reports', icon: FileText, isCurrent: true }
    ]
  },
  '/admin/analytics/insights': {
    base: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
      { label: 'Insights', href: '/admin/analytics/insights', icon: TrendingUp, isCurrent: true }
    ]
  },
  '/admin/settings': {
    base: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Settings', href: '/admin/settings', icon: Settings, isCurrent: true }
    ]
  },
  '/admin/settings/roles': {
    base: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
      { label: 'Roles & Permissions', href: '/admin/settings/roles', icon: Shield, isCurrent: true }
    ]
  },
  '/admin/settings/system': {
    base: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
      { label: 'System', href: '/admin/settings/system', icon: Database, isCurrent: true }
    ]
  }
}

// Dynamic route handlers
const handleDynamicRoutes = (pathname: string): BreadcrumbItem[] | null => {
  // Vendor detail routes: /admin/vendors/[vendorId]
  if (pathname.match(/^\/admin\/vendors\/[^\/]+$/)) {
    return [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Vendors', href: '/admin/vendors', icon: Store },
      { label: 'Vendor Details', href: pathname, icon: Store, isCurrent: true }
    ]
  }

  // Vendor venues: /admin/vendors/[vendorId]/venues
  if (pathname.match(/^\/admin\/vendors\/[^\/]+\/venues$/)) {
    return [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Vendors', href: '/admin/vendors', icon: Store },
      { label: 'Vendor Venues', href: pathname, icon: MapPin, isCurrent: true }
    ]
  }

  // Venue detail under vendor: /admin/vendors/[vendorId]/venues/[venueId]
  if (pathname.match(/^\/admin\/vendors\/[^\/]+\/venues\/[^\/]+$/)) {
    return [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Vendors', href: '/admin/vendors', icon: Store },
      { label: 'Vendor Venues', href: pathname.replace(/\/venues\/[^\/]+$/, '/venues'), icon: MapPin },
      { label: 'Venue Details', href: pathname, icon: MapPin, isCurrent: true }
    ]
  }

  // Venue edit: /admin/vendors/[vendorId]/venues/[venueId]/edit
  if (pathname.match(/^\/admin\/vendors\/[^\/]+\/venues\/[^\/]+\/edit$/)) {
    return [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Vendors', href: '/admin/vendors', icon: Store },
      { label: 'Vendor Venues', href: pathname.replace(/\/venues\/[^\/]+\/edit$/, '/venues'), icon: MapPin },
      { label: 'Venue Details', href: pathname.replace(/\/edit$/, ''), icon: MapPin },
      { label: 'Edit Venue', href: pathname, icon: MapPin, isCurrent: true }
    ]
  }

  // Court management under venue: /admin/vendors/[vendorId]/venues/[venueId]/courts/[courtId]
  if (pathname.match(/^\/admin\/vendors\/[^\/]+\/venues\/[^\/]+\/courts\/[^\/]+$/)) {
    return [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Vendors', href: '/admin/vendors', icon: Store },
      { label: 'Vendor Venues', href: pathname.replace(/\/venues\/[^\/]+\/courts\/[^\/]+$/, '/venues'), icon: MapPin },
      { label: 'Venue Details', href: pathname.replace(/\/courts\/[^\/]+$/, ''), icon: MapPin },
      { label: 'Court Details', href: pathname, icon: Circle, isCurrent: true }
    ]
  }

  // Court edit: /admin/vendors/[vendorId]/venues/[venueId]/courts/[courtId]/edit
  if (pathname.match(/^\/admin\/vendors\/[^\/]+\/venues\/[^\/]+\/courts\/[^\/]+\/edit$/)) {
    return [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Vendors', href: '/admin/vendors', icon: Store },
      { label: 'Vendor Venues', href: pathname.replace(/\/venues\/[^\/]+\/courts\/[^\/]+\/edit$/, '/venues'), icon: MapPin },
      { label: 'Venue Details', href: pathname.replace(/\/courts\/[^\/]+\/edit$/, ''), icon: MapPin },
      { label: 'Court Details', href: pathname.replace(/\/edit$/, ''), icon: Circle },
      { label: 'Edit Court', href: pathname, icon: Circle, isCurrent: true }
    ]
  }

  // New court: /admin/vendors/[vendorId]/venues/[venueId]/courts/new
  if (pathname.match(/^\/admin\/vendors\/[^\/]+\/venues\/[^\/]+\/courts\/new$/)) {
    return [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Vendors', href: '/admin/vendors', icon: Store },
      { label: 'Vendor Venues', href: pathname.replace(/\/venues\/[^\/]+\/courts\/new$/, '/venues'), icon: MapPin },
      { label: 'Venue Details', href: pathname.replace(/\/courts\/new$/, ''), icon: MapPin },
      { label: 'Create Court', href: pathname, icon: Circle, isCurrent: true }
    ]
  }

  // Venue detail direct: /admin/venues/[venueId]
  if (pathname.match(/^\/admin\/venues\/[^\/]+$/)) {
    return [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Venues', href: '/admin/venues', icon: MapPin },
      { label: 'Venue Details', href: pathname, icon: MapPin, isCurrent: true }
    ]
  }

  // Court detail direct: /admin/courts/[courtId]
  if (pathname.match(/^\/admin\/courts\/[^\/]+$/)) {
    return [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Courts', href: '/admin/courts', icon: Circle },
      { label: 'Court Details', href: pathname, icon: Circle, isCurrent: true }
    ]
  }

  return null
}

interface UniversalBreadcrumbProps {
  className?: string
  customItems?: BreadcrumbItem[]
  override?: boolean
}

export function UniversalBreadcrumb({ className, customItems, override = false }: UniversalBreadcrumbProps) {
  const pathname = usePathname()

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    // If custom items are provided and override is true, use them directly
    if (override && customItems) {
      return customItems
    }

    // Try to find exact match in config
    const config = breadcrumbConfig[pathname]
    if (config) {
      return config.base
    }

    // Handle dynamic routes
    const dynamicBreadcrumbs = handleDynamicRoutes(pathname)
    if (dynamicBreadcrumbs) {
      return dynamicBreadcrumbs
    }

    // Fallback: generate from path segments
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === segments.length - 1

      // Map segment to readable label
      let label = segment.charAt(0).toUpperCase() + segment.slice(1)
      let icon: any = undefined

      if (segment === 'admin') {
        label = 'Admin'
        icon = BarChart3
      } else if (segment === 'dashboard') {
        label = 'Dashboard'
        icon = Home
      } else if (segment === 'users') {
        label = 'Users'
        icon = Users
      } else if (segment === 'vendors') {
        label = 'Vendors'
        icon = Store
      } else if (segment === 'venues') {
        label = 'Venues'
        icon = MapPin
      } else if (segment === 'courts') {
        label = 'Courts'
        icon = Circle
      } else if (segment === 'bookings') {
        label = 'Bookings'
        icon = Calendar
      } else if (segment === 'analytics') {
        label = 'Analytics'
        icon = TrendingUp
      } else if (segment === 'settings') {
        label = 'Settings'
        icon = Settings
      } else if (segment === 'edit') {
        label = 'Edit'
      } else if (segment === 'create') {
        label = 'Create'
      } else if (segment === 'new') {
        label = 'New'
      }

      breadcrumbs.push({
        label,
        href: currentPath,
        icon,
        isCurrent: isLast
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  // If custom items are provided and override is false, append them to base breadcrumbs
  const finalBreadcrumbs = customItems && !override
    ? [...breadcrumbs, ...customItems]
    : breadcrumbs

  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}>
      {finalBreadcrumbs.map((item, index) => {
        const Icon = item.icon
        const isLast = index === finalBreadcrumbs.length - 1

        return (
          <div key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
            )}

            {isLast ? (
              <span className="flex items-center gap-1 text-foreground font-medium">
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}