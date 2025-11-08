'use client'

import { useState } from 'react'
import { Bell, Search, Menu, User, Settings, LogOut, HelpCircle, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTheme } from 'next-themes'
import { useAuth } from '@/components/features/auth/AuthProvider'
import { cn } from '@/lib/utils'

interface AdminHeaderProps {
  onToggleSidebar?: () => void
  sidebarOpen?: boolean
  title?: string
  subtitle?: string
}

export function AdminHeader({
  onToggleSidebar,
  sidebarOpen = true,
  title = 'Dashboard',
  subtitle
}: AdminHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { theme, setTheme } = useTheme()
  const { logout, user, isLoading } = useAuth()

  // Debug logging
  console.log('AdminHeader user:', user?.name, user?.email)

  const notifications = [
    { id: 1, title: 'New vendor registration', description: '5 vendors pending approval', time: '2m ago', unread: true },
    { id: 2, title: 'System update', description: 'Platform update scheduled for tonight', time: '1h ago', unread: true },
    { id: 3, title: 'Revenue milestone', description: 'Monthly revenue target achieved', time: '3h ago', unread: false },
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Left Section - Sidebar Toggle & Breadcrumb */}
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 lg:hidden"
            onClick={onToggleSidebar}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users, vendors, bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {unreadCount} new
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {notifications.slice(0, 3).map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4">
                  <div className="flex w-full items-start gap-3">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {notification.description}
                      </p>
                    </div>
                    {notification.unread && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-1"></div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.time}
                  </p>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Help */}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <HelpCircle className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatarUrl || "/avatars/admin.png"} alt={user?.name || "Admin"} />
                  <AvatarFallback>{user?.name?.charAt(0).toUpperCase() || "AD"}</AvatarFallback>
                </Avatar>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium">{user?.name || "Admin User"}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.role?.replace('_', ' ') || "Platform Admin"}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || "Admin User"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || "admin@venuesystem.com"}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}