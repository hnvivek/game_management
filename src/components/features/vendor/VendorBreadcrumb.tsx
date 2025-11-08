'use client'

import { ChevronRight, Home, BarChart3, Calendar, Users, Store, MapPin, Circle, TrendingUp, Settings, FileText } from 'lucide-react'
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
  '/vendor/dashboard': {
    base: [
      { label: 'Dashboard', href: '/vendor/dashboard', icon: Home, isCurrent: true }
    ]
  },
  '/vendor/bookings': {
    base: [
      { label: 'Dashboard', href: '/vendor/dashboard', icon: Home },
      { label: 'Bookings', href: '/vendor/bookings', icon: Calendar, isCurrent: true }
    ]
  },
  '/vendor/analytics': {
    base: [
      { label: 'Dashboard', href: '/vendor/dashboard', icon: Home },
      { label: 'Analytics', href: '/vendor/analytics', icon: TrendingUp, isCurrent: true }
    ]
  },
  '/vendor/customers': {
    base: [
      { label: 'Dashboard', href: '/vendor/dashboard', icon: Home },
      { label: 'Customers', href: '/vendor/customers', icon: Users, isCurrent: true }
    ]
  },
  '/vendor/venues': {
    base: [
      { label: 'Dashboard', href: '/vendor/dashboard', icon: Home },
      { label: 'Venues', href: '/vendor/venues', icon: Store, isCurrent: true }
    ]
  },
  '/vendor/settings': {
    base: [
      { label: 'Dashboard', href: '/vendor/dashboard', icon: Home },
      { label: 'Settings', href: '/vendor/settings', icon: Settings, isCurrent: true }
    ]
  }
}

// Dynamic route handlers
const handleDynamicRoutes = (pathname: string): BreadcrumbItem[] | null => {
  // Venue detail routes: /vendor/venues/[venueId]
  if (pathname.match(/^\/vendor\/venues\/[^\/]+$/)) {
    return [
      { label: 'Dashboard', href: '/vendor/dashboard', icon: Home },
      { label: 'Venues', href: '/vendor/venues', icon: Store },
      { label: 'Venue Details', href: pathname, icon: MapPin, isCurrent: true }
    ]
  }

  // Venue edit: /vendor/venues/[venueId]/edit
  if (pathname.match(/^\/vendor\/venues\/[^\/]+\/edit$/)) {
    return [
      { label: 'Dashboard', href: '/vendor/dashboard', icon: Home },
      { label: 'Venues', href: '/vendor/venues', icon: Store },
      { label: 'Venue Details', href: pathname.replace(/\/edit$/, ''), icon: MapPin },
      { label: 'Edit Venue', href: pathname, icon: MapPin, isCurrent: true }
    ]
  }

  // Court management under venue: /vendor/venues/[venueId]/courts
  if (pathname.match(/^\/vendor\/venues\/[^\/]+\/courts$/)) {
    return [
      { label: 'Dashboard', href: '/vendor/dashboard', icon: Home },
      { label: 'Venues', href: '/vendor/venues', icon: Store },
      { label: 'Venue Details', href: pathname.replace(/\/courts$/, ''), icon: MapPin },
      { label: 'Courts', href: pathname, icon: Circle, isCurrent: true }
    ]
  }

  // Court detail: /vendor/venues/[venueId]/courts/[courtId]
  if (pathname.match(/^\/vendor\/venues\/[^\/]+\/courts\/[^\/]+$/)) {
    return [
      { label: 'Dashboard', href: '/vendor/dashboard', icon: Home },
      { label: 'Venues', href: '/vendor/venues', icon: Store },
      { label: 'Venue Details', href: pathname.replace(/\/courts\/[^\/]+$/, ''), icon: MapPin },
      { label: 'Courts', href: pathname.replace(/\/courts\/[^\/]+$/, '/courts'), icon: Circle },
      { label: 'Court Details', href: pathname, icon: Circle, isCurrent: true }
    ]
  }

  // Court edit: /vendor/venues/[venueId]/courts/[courtId]/edit
  if (pathname.match(/^\/vendor\/venues\/[^\/]+\/courts\/[^\/]+\/edit$/)) {
    return [
      { label: 'Dashboard', href: '/vendor/dashboard', icon: Home },
      { label: 'Venues', href: '/vendor/venues', icon: Store },
      { label: 'Venue Details', href: pathname.replace(/\/courts\/[^\/]+\/edit$/, ''), icon: MapPin },
      { label: 'Courts', href: pathname.replace(/\/courts\/[^\/]+\/edit$/, '/courts'), icon: Circle },
      { label: 'Court Details', href: pathname.replace(/\/edit$/, ''), icon: Circle },
      { label: 'Edit Court', href: pathname, icon: Circle, isCurrent: true }
    ]
  }

  // New court: /vendor/venues/[venueId]/courts/new
  if (pathname.match(/^\/vendor\/venues\/[^\/]+\/courts\/new$/)) {
    return [
      { label: 'Dashboard', href: '/vendor/dashboard', icon: Home },
      { label: 'Venues', href: '/vendor/venues', icon: Store },
      { label: 'Venue Details', href: pathname.replace(/\/courts\/new$/, ''), icon: MapPin },
      { label: 'Courts', href: pathname.replace(/\/courts\/new$/, '/courts'), icon: Circle },
      { label: 'Create Court', href: pathname, icon: Circle, isCurrent: true }
    ]
  }

  return null
}

interface VendorBreadcrumbProps {
  className?: string
  customItems?: BreadcrumbItem[]
  override?: boolean
}

export function VendorBreadcrumb({ className, customItems, override = false }: VendorBreadcrumbProps) {
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

      if (segment === 'vendor') {
        label = 'Vendor'
        icon = Store
      } else if (segment === 'dashboard') {
        label = 'Dashboard'
        icon = Home
      } else if (segment === 'bookings') {
        label = 'Bookings'
        icon = Calendar
      } else if (segment === 'venues') {
        label = 'Venues'
        icon = Store
      } else if (segment === 'courts') {
        label = 'Courts'
        icon = Circle
      } else if (segment === 'analytics') {
        label = 'Analytics'
        icon = TrendingUp
      } else if (segment === 'customers') {
        label = 'Customers'
        icon = Users
      } else if (segment === 'profile') {
        // Redirect profile to settings
        label = 'Settings'
        icon = Settings
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
    <nav className={cn('flex items-center space-x-1 text-sm text-muted-foreground mb-4', className)}>
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

