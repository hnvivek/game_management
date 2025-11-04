'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Search,
  Plus,
  Users,
  User,
  Calendar,
  Trophy
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useResponsive } from '@/styles/providers/theme-provider'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  icon: any
  label: string
  isPrimary?: boolean
  activePaths?: string[]
}

export function BottomNavigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { isMobile, isTablet } = useResponsive()

  // Only show on mobile and tablet
  if (!isMobile && !isTablet) {
    return null
  }

  const navigation: NavItem[] = [
    {
      href: '/',
      icon: Home,
      label: 'Home',
      activePaths: ['/']
    },
    {
      href: '/book-venue',
      icon: Calendar,
      label: 'Book',
      activePaths: ['/book-venue']
    },
    {
      href: '/teams',
      icon: Users,
      label: 'Teams',
      activePaths: ['/teams']
    },
      {
      href: '/profile',
      icon: User,
      label: 'Profile',
      activePaths: ['/profile']
    }
  ]

  const isActive = (item: NavItem) => {
    if (item.href === '/') return pathname === '/'
    return pathname.startsWith(item.href)
  }

  return (
    <>
      {/* Add padding to bottom of main content to avoid overlap with bottom nav */}
      <div className="h-16 md:hidden" />

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border z-50 md:hidden">
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 transition-colors relative',
                  'hover:bg-accent/50',
                  active
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground/60 hover:text-foreground'
                )}
              >
                {/* Active indicator dot */}
                {active && (
                  <div className="absolute top-2 w-1 h-1 bg-primary rounded-full" />
                )}

                <div className={cn(
                  'rounded-full p-1.5 transition-colors',
                  active
                    ? 'bg-foreground dark:bg-background'
                    : 'bg-transparent'
                )}>
                <Icon
                  className={cn(
                    'transition-transform',
                    active ? 'scale-110' : 'scale-100',
                    'h-4.5 w-4.5',
                    active
                      ? 'text-background dark:text-foreground'
                      : 'text-current'
                  )}
                />
              </div>

                <span
                  className={cn(
                    'text-xs font-medium transition-all',
                    active
                      ? 'text-primary'
                      : 'text-foreground/70'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Home indicator line for iPhone-style design */}
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-black/20 dark:bg-white/20 rounded-full" />
      </nav>
    </>
  )
}

export function TabletBottomNavigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { isTablet } = useResponsive()

  // Only show on tablet
  if (!isTablet) {
    return null
  }

  const navigation: NavItem[] = [
    {
      href: '/',
      icon: Home,
      label: 'Home',
      activePaths: ['/']
    },
    {
      href: '/book-venue',
      icon: Calendar,
      label: 'Book Venues',
      activePaths: ['/book-venue']
    },
    {
      href: '/teams',
      icon: Users,
      label: 'Teams',
      activePaths: ['/teams']
    },
    {
      href: '/profile',
      icon: User,
      label: 'Profile',
      activePaths: ['/profile']
    }
  ]

  const isActive = (item: NavItem) => {
    if (item.href === '/') return pathname === '/'
    return pathname.startsWith(item.href)
  }

  return (
    <>
      {/* Add padding to bottom of main content to avoid overlap */}
      <div className="h-14 max-md:hidden lg:hidden" />

      {/* Tablet Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border z-40 max-md:hidden lg:hidden">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-md transition-colors flex-1',
                  active
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

export default BottomNavigation