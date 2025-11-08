'use client'

import { ChevronRight, Home, MapPin, Circle, Store, Calendar } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
  icon?: any
}

interface BreadcrumbNavigationProps {
  className?: string
  vendorName?: string
  venueName?: string
  courtName?: string
}

export function BreadcrumbNavigation({
  className,
  vendorName,
  venueName,
  courtName
}: BreadcrumbNavigationProps) {
  const pathname = usePathname()

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = []

    // Always start with Admin Dashboard
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: Home
    })

    // Parse the current path to build breadcrumbs
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.includes('vendors')) {
      breadcrumbs.push({
        label: 'Vendors',
        href: '/admin/vendors',
        icon: Store
      })

      if (vendorName) {
        breadcrumbs.push({
          label: vendorName,
          href: `/admin/vendors/${pathSegments[pathSegments.indexOf('vendors') + 1]}`,
          icon: Store
        })
      }
    }

    if (pathSegments.includes('venues')) {
      // Check if we're under vendors or direct venues
      if (pathSegments.includes('vendors')) {
        // Venues under vendor context
        if (venueName) {
          breadcrumbs.push({
            label: venueName,
            href: `/admin/vendors/${pathSegments[pathSegments.indexOf('vendors') + 1]}/venues/${pathSegments[pathSegments.indexOf('venues') + 1]}`,
            icon: MapPin
          })
        }
      } else {
        // Direct venues navigation
        breadcrumbs.push({
          label: 'Venues',
          href: '/admin/venues',
          icon: MapPin
        })

        if (venueName) {
          breadcrumbs.push({
            label: venueName,
            href: `/admin/venues/${pathSegments[pathSegments.indexOf('venues') + 1]}`,
            icon: MapPin
          })
        }
      }
    }

    if (pathSegments.includes('courts')) {
      if (pathSegments.includes('vendors')) {
        // Courts under vendor context
        if (courtName) {
          breadcrumbs.push({
            label: courtName,
            href: `/admin/vendors/${pathSegments[pathSegments.indexOf('vendors') + 1]}/venues/${pathSegments[pathSegments.indexOf('venues') + 1]}/courts/${pathSegments[pathSegments.indexOf('courts') + 1]}`,
            icon: Circle
          })
        }
      } else {
        // Direct courts navigation
        breadcrumbs.push({
          label: 'Courts',
          href: '/admin/courts',
          icon: Circle
        })

        if (courtName) {
          breadcrumbs.push({
            label: courtName,
            href: `/admin/courts/${pathSegments[pathSegments.indexOf('courts') + 1]}`,
            icon: Circle
          })
        }
      }
    }

    // Add current page context
    if (pathSegments.includes('edit')) {
      breadcrumbs.push({
        label: 'Edit',
        href: pathname,
        icon: undefined
      })
    } else if (pathSegments.includes('create')) {
      breadcrumbs.push({
        label: 'Create',
        href: pathname,
        icon: undefined
      })
    } else if (pathSegments.includes('new')) {
      breadcrumbs.push({
        label: 'New',
        href: pathname,
        icon: undefined
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}>
      {breadcrumbs.map((item, index) => {
        const Icon = item.icon
        const isLast = index === breadcrumbs.length - 1

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