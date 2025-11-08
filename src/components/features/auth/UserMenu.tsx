'use client'

import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { User, Settings, LogOut, List, ChevronDown } from 'lucide-react'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const router = useRouter()

  if (!user) return null

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center space-x-2 text-sm rounded-lg hover:bg-accent p-2 transition-colors focus:outline-none"
          aria-label="User menu"
        >
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium hidden md:block">{user.name}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="w-64 bg-card text-card-foreground rounded-lg shadow-dropdown border-border z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          style={{ margin: 0, transform: 'translateY(-4px)' }}
          sideOffset={-4}
          align="end"
        >
          {/* User Info Header */}
          <div className="p-4 border-b border-border bg-muted">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-card-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <DropdownMenu.Item asChild>
              <button
                onClick={() => handleNavigation('/my-bookings')}
                className="flex items-center gap-3 w-full text-left text-sm px-3 py-3 rounded-md hover:bg-accent text-accent-foreground transition-colors focus:outline-none"
              >
                <List className="h-4 w-4" />
                My Bookings
              </button>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <button
                onClick={() => handleNavigation('/profile')}
                className="flex items-center gap-3 w-full text-left text-sm px-3 py-3 rounded-md hover:bg-accent text-accent-foreground transition-colors focus:outline-none"
              >
                <User className="h-4 w-4" />
                Profile
              </button>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <button
                onClick={() => handleNavigation('/settings')}
                className="flex items-center gap-3 w-full text-left text-sm px-3 py-3 rounded-md hover:bg-accent text-accent-foreground transition-colors focus:outline-none"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="h-px bg-border my-2" />

            <DropdownMenu.Item asChild>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full text-left text-sm px-3 py-3 rounded-md hover:bg-accent text-accent-foreground transition-colors focus:outline-none"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </DropdownMenu.Item>
          </div>

          <DropdownMenu.Arrow className="fill-card" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}