'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
  UserCog,
  Layers
} from 'lucide-react'
import { useVendor } from '@/hooks/use-vendor'
import { useAuth } from '@/components/features/auth/AuthProvider'
import Footer from '@/components/footer'

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
    title: 'Formats',
    href: '/vendor/formats',
    icon: Layers,
    description: 'Manage court formats and configurations'
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const { vendor, isLoading: vendorLoading } = useVendor()
  const { user: authUser } = useAuth()

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const isActive = (href: string) => {
    return pathname === href || (href !== '/vendor/dashboard' && pathname.startsWith(href))
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar - Fixed position */}
        <div
          className={cn(
            'h-screen flex flex-col bg-card border-r transition-all duration-300 ease-in-out flex-shrink-0',
            isSidebarOpen ? 'w-64' : 'w-16'
          )}
        >
          {/* Sidebar Header */}
          <div className="flex items-center gap-2 px-4 py-2 border-b h-16 flex-shrink-0">
            {isSidebarOpen ? (
              <>
                <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg flex-shrink-0">
                  <Store className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-sm truncate">Vendor Portal</h2>
                  <p className="text-xs text-muted-foreground truncate">Manage your venues</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="hidden md:flex flex-shrink-0"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="flex items-center justify-center w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="hidden md:flex"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-hidden p-2">
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
          </div>
        </div>

        {/* Main Content - Fixed height container */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header - Fixed at top */}
          <header className="bg-card border-b px-4 py-2 h-16 flex-shrink-0">
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center gap-4">
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
                      {authUser?.name || authUser?.email || 'Loading...'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {authUser?.role === 'VENDOR_ADMIN' ? 'Vendor Admin' : authUser?.role === 'VENDOR_STAFF' ? 'Vendor Staff' : authUser?.role || 'User'}
                    </div>
                  </div>
                  <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full">
                    {authUser?.avatarUrl ? (
                      <img 
                        src={authUser.avatarUrl} 
                        alt={authUser.name || authUser.email} 
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

          {/* Page Content - Scrollable area */}
          <main className="flex-1 bg-background overflow-y-auto">
            {children}
          </main>

          {/* Footer - Fixed at bottom */}
          <div className="bg-card border-t flex-shrink-0 z-10">
            <Footer />
          </div>
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