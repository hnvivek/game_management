'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  BarChart3,
  Users,
  Store,
  Calendar,
  Settings,
  TrendingUp,
  FileText,
  Shield,
  Database,
  Bell,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  MapPin,
  Circle
} from 'lucide-react'

interface NavigationItem {
  title: string
  href: string
  icon: any
  badge?: string
  children?: NavigationItem[]
  description?: string
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: BarChart3,
    description: 'Platform overview and metrics'
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    badge: 'New',
    description: 'User management and roles',
    children: [
      {
        title: 'All Users',
        href: '/admin/users',
        icon: Users
      },
      {
        title: 'Create User',
        href: '/admin/users/create',
        icon: Users
      }
    ]
  },
  {
    title: 'Vendors',
    href: '/admin/vendors',
    icon: Store,
    badge: '8',
    description: 'Vendor management and approval',
    children: [
      {
        title: 'All Vendors',
        href: '/admin/vendors',
        icon: Store
      },
      {
        title: 'Approval Workflow',
        href: '/admin/vendors/approval',
        icon: Shield
      },
      {
        title: 'Create Vendor',
        href: '/admin/vendors/create',
        icon: Store
      }
    ]
  },
  {
    title: 'Venues & Courts',
    href: '/admin/venues',
    icon: MapPin,
    badge: '12',
    description: 'Venue and court management',
    children: [
      {
        title: 'All Venues',
        href: '/admin/venues',
        icon: MapPin
      },
      {
        title: 'All Courts',
        href: '/admin/courts',
        icon: Circle
      },
      {
        title: 'Create Venue',
        href: '/admin/venues/create',
        icon: MapPin
      },
      {
        title: 'Create Court',
        href: '/admin/courts/create',
        icon: Circle
      }
    ]
  },
  {
    title: 'Bookings',
    href: '/admin/bookings',
    icon: Calendar,
    badge: '3',
    description: 'Booking management and calendar',
    children: [
      {
        title: 'All Bookings',
        href: '/admin/bookings',
        icon: Calendar
      },
      {
        title: 'Booking Calendar',
        href: '/admin/bookings/calendar',
        icon: Calendar
      }
    ]
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: TrendingUp,
    description: 'Reports and insights',
    children: [
      {
        title: 'Overview',
        href: '/admin/analytics',
        icon: BarChart3
      },
      {
        title: 'Reports',
        href: '/admin/analytics/reports',
        icon: FileText
      },
      {
        title: 'Insights',
        href: '/admin/analytics/insights',
        icon: TrendingUp
      }
    ]
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Platform configuration',
    children: [
      {
        title: 'General',
        href: '/admin/settings',
        icon: Settings
      },
      {
        title: 'Roles & Permissions',
        href: '/admin/settings/roles',
        icon: Shield
      },
      {
        title: 'System',
        href: '/admin/settings/system',
        icon: Database
      }
    ]
  }
]

interface AdminSidebarProps {
  className?: string
  isOpen?: boolean
  onToggle?: () => void
}

export function AdminSidebar({ className, isOpen = true, onToggle }: AdminSidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  const isChildActive = (children?: NavigationItem[]) => {
    if (!children) return false
    return children.some(child => isActive(child.href))
  }

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const Icon = item.icon
    const active = isActive(item.href)
    const childActive = isChildActive(item.children)
    const expanded = expandedItems.includes(item.title)

    if (isMobile && !isOpen) {
      return (
        <TooltipProvider key={item.href}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.badge && (
                  <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {item.badge}
                  </Badge>
                )}
                <span className="sr-only">{item.title}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.title}</p>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return (
      <div key={item.href}>
        <Link
          href={item.href}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative',
            active || childActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
          style={{ paddingLeft: `${level * 12 + 12}px` }}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          {isOpen && (
            <>
              <span className="flex-1 truncate">{item.title}</span>
              {item.badge && (
                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {item.badge}
                </Badge>
              )}
              {item.children && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={(e) => {
                    e.preventDefault()
                    toggleExpanded(item.title)
                  }}
                >
                  {expanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              )}
            </>
          )}
        </Link>

        {item.children && isOpen && expanded && (
          <div className="mt-1">
            {item.children.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (isMobile && !isOpen) {
    return (
      <div className={cn('fixed inset-y-0 left-0 z-50 w-16 bg-card border-r', className)}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={onToggle}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-2">
              {navigationItems.map(item => renderNavigationItem(item))}
            </div>
          </ScrollArea>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full bg-card border-r', className)}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary-foreground" />
          </div>
          {isOpen && (
            <div>
              <h2 className="text-lg font-semibold">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">Platform Management</p>
            </div>
          )}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-8 w-8 p-0"
              onClick={onToggle}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 p-4">
        <nav className="space-y-2">
          {navigationItems.map(item => renderNavigationItem(item))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {isOpen && (
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">System Status</p>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}