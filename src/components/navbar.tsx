'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, Menu, X, Calendar, Users, BarChart3, Target, Bot, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/AuthProvider'
import UserMenu from '@/components/auth/UserMenu'
import { ThemeToggle } from '@/components/theme-toggle'
import { useResponsive } from '@/components/theme-provider'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()
  const { isMobile, isTablet } = useResponsive()

  // Hide mobile menu button when bottom navigation is active
  const showMobileMenu = !isMobile

  const navigation = [
    { name: 'Home', href: '/', icon: Trophy },
    { name: 'Book Venues', href: '/book-venue', icon: Calendar },
    { name: 'Teams', href: '/teams', icon: Users },
    { name: 'Matches', href: '/matches', icon: Target },
    { name: 'API Docs', href: '/api-docs', icon: FileText },
    ...(user ? [{ name: 'AI Suggestions', href: '/ai-suggestions', icon: Bot }] : []),
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header className="bg-card border-b border shadow-nav sticky top-0 z-40 relative">
      <div className="w-full px-3 sm:px-4 lg:px-6 max-w-full overflow-hidden">
        <div className="flex justify-between items-center h-14 md:h-12 min-h-0">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2 group flex-shrink-0 z-10 relative">
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <span className="text-sm sm:text-base font-bold text-foreground">GameHub</span>
              <span className="text-xs text-muted-foreground ml-1 hidden lg:inline">Enterprise</span>
            </div>
            <div className="sm:hidden">
              <span className="text-sm font-bold text-foreground">GH</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 flex-1 justify-center px-4">
            {navigation.slice(0, 5).map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm font-medium transition-colors relative z-10 ${
                    active
                      ? 'bg-primary/10 text-primary dark:bg-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="hidden xl:inline">{item.name}</span>
                  <span className="xl:hidden">{item.name.split(' ')[0]}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-2 flex-shrink-0 relative z-10">
            <ThemeToggle />
            {user ? (
              <UserMenu />
            ) : (
              <Link href="/signin">
                <Button size="sm" className="bg-primary hover:bg-primary-600 text-primary-foreground h-8 text-xs px-3">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button - Only show on tablet and up when bottom nav is not active */}
          {showMobileMenu && (
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent flex-shrink-0 relative z-10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className="sr-only">Toggle menu</span>
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && showMobileMenu && (
          <div className="md:hidden py-3 space-y-1 border-t border relative z-30 bg-card">
            <div className="max-h-96 overflow-y-auto">
              {navigation.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors relative z-10 ${
                      active
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                )
              })}
              <div className="pt-2 mt-2 border-t border px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                {user ? (
                  <div className="mt-3 pt-3 border-t border">
                    <div className="text-sm text-muted-foreground truncate">
                      {user.name}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <Link href="/signin" onClick={() => setMobileMenuOpen(false)}>
                      <Button size="sm" className="w-full bg-primary hover:bg-primary-600 text-primary-foreground">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
