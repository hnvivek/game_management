'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: string
  phone?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, name?: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const savedUser = localStorage.getItem('auth_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string, name?: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      // Mock authentication - in real app, this would call an API
      // For demo, we'll accept any email/password and create a mock user
      if (email && password) {
        const mockUser: User = {
          id: 'user-' + Math.random().toString(36).substr(2, 9),
          name: name || email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          email,
          role: 'CUSTOMER',
          phone: '+91 9876543210'
        }

        setUser(mockUser)
        localStorage.setItem('auth_user', JSON.stringify(mockUser))
        setIsLoading(false)
        return true
      }
      setIsLoading(false)
      return false
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}