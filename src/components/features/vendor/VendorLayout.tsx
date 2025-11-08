'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  BarChart3,
  Calendar,
  Users,
  Settings,
  Store,
  CreditCard,
  FileText,
  Bell,
  Search,
  User,
  Menu,
  X,
  TrendingUp,
  Clock,
  DollarSign,
  MapPin,
  UserCog
} from 'lucide-react'
import { useVendor } from '@/hooks/use-vendor'

interface NavigationItem {
  title: string
  href: string
  icon: any
  badge?: string
  description?: string
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/vendor/dashboard',
    icon: BarChart3,
    description: 'Business overview and metrics'
  },
  {
    title: 'Bookings',
    href: '/vendor/bookings',
    icon: Calendar,
    description: 'Manage reservations and schedule'
  },
  {
    title: 'Customers',
    href: '/vendor/customers',
    icon: Users,
    description: 'Customer management and communication'
  },
  {
    title: 'Venues',
    href: '/vendor/venues',
    icon: Store,
    description: 'Manage venues and facilities'
  },
  {
    title: 'Analytics',
    href: '/vendor/analytics',
    icon: TrendingUp,
    description: 'Revenue and performance insights'
  },
  {
    title: 'Team',
    href: '/vendor/staff',
    icon: UserCog,
    description: 'Manage staff members and permissions'
  },
  {
    title: 'Settings',
    href: '/vendor/settings',
    icon: Settings,
    description: 'Account, business info, and platform configuration'
  }
]

interface VendorLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function VendorLayout({ children, title, subtitle }: VendorLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const { vendor, isLoading: vendorLoading } = useVendor()
  const [user, setUser] = useState<{ name: string | null; email: string; role: string; avatarUrl?: string | null } | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          // Don't throw error for 401/403 - user might not be authenticated
          if (response.status === 401 || response.status === 403) {
            console.log('User not authenticated')
            return
          }
          throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        if (data?.user) {
          setUser(data.user)
        }
      } catch (error) {
        // Only log error if it's not a network error (which might be expected)
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          // Network error - might be offline or server unavailable
          console.warn('Network error fetching user - server may be unavailable')
        } else {
          console.error('Error fetching user:', error)
        }
        // Don't set user state on error - keep it null
      }
    }

    fetchUser()
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const isActive = (href: string) => {
    return pathname === href || (href !== '/vendor/dashboard' && pathname.startsWith(href))
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <div
          className={cn(
            'relative flex flex-col bg-card border-r transition-all duration-300 ease-in-out',
            isSidebarOpen ? 'w-64' : 'w-16'
          )}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b">
            {isSidebarOpen ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                  <Store className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">Vendor Portal</h2>
                  <p className="text-xs text-muted-foreground">Manage your venues</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg mx-auto">
                <Store className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="hidden md:flex"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {isSidebarOpen && (
                          <span className="flex-1">{item.title}</span>
                        )}
                      </Link>
                    </TooltipTrigger>
                    {!isSidebarOpen && (
                      <TooltipContent side="right" className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <div className="font-medium">{item.title}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground w-48">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              })}
            </nav>
          </ScrollArea>

          {/* Sidebar Footer */}
          <div className="p-4 border-t">
            {isSidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {vendor?.name || 'Loading...'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.role === 'VENDOR_ADMIN' ? 'Vendor Admin' : user?.role === 'VENDOR_STAFF' ? 'Vendor Staff' : 'Vendor Account'}
                  </p>
                </div>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  vendor?.isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}>
                  {vendor?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ) : (
              <div className="flex justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div className="text-sm">
                      <div className="font-medium">{vendor?.name || 'Loading...'}</div>
                      <div className="text-muted-foreground">
                        {user?.role === 'VENDOR_ADMIN' ? 'Vendor Admin' : user?.role === 'VENDOR_STAFF' ? 'Vendor Staff' : 'Vendor Account'}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-card border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {!isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                )}
                <div>
                  <h1 className="text-xl font-semibold">{title}</h1>
                  {subtitle && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search bookings..."
                    className="bg-transparent border-none outline-none text-sm w-48"
                  />
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </Button>

                {/* User Menu */}
                <div className="flex items-center gap-2">
                  <div className="hidden md:block text-right">
                    <div className="text-sm font-medium">
                      {user?.name || user?.email || 'Loading...'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user?.role === 'VENDOR_ADMIN' ? 'Vendor Admin' : user?.role === 'VENDOR_STAFF' ? 'Vendor Staff' : user?.role || 'User'}
                    </div>
                  </div>
                  <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full">
                    {user?.avatarUrl ? (
                      <img 
                        src={user.avatarUrl} 
                        alt={user.name || user.email} 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-primary-foreground" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>

        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </TooltipProvider>
  )
}