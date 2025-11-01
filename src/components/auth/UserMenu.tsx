'use client'

import { useAuth } from './AuthProvider'
import { useState } from 'react'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm rounded-lg hover:bg-accent p-2"
      >
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium">{user.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border z-50">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="p-2">
            <button
              onClick={logout}
              className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-accent text-foreground"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}