'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, Menu, X, Calendar, Users, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const navigation = [
    { name: 'Home', href: '/', icon: Trophy },
    { name: 'Find Venues', href: '/book-venue', icon: Calendar },
    { name: 'Teams', href: '/teams', icon: Users },
    { name: 'Leaderboard', href: '/leaderboard', icon: BarChart3 },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header className="bg-card border-b border shadow-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-14 md:h-12">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <Trophy className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold text-foreground">GameHub</span>
              <span className="text-xs sm:text-sm text-muted-foreground ml-1.5">Enterprise</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 h-7 text-xs px-3">
              Sign In
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary-600 text-primary-foreground h-7 text-xs px-3">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 space-y-1 border-t border">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
            <div className="pt-2 mt-2 border-t border space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                Sign In
              </Button>
              <Button size="sm" className="w-full bg-primary hover:bg-primary-600 text-primary-foreground">
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
