'use client'

import { AuthProvider } from '@/components/features/auth/AuthProvider'
import { ThemeProvider } from '@/styles/providers/theme-provider'
import { BottomNavigation, TabletBottomNavigation } from '@/components/navigation/bottom-navigation'
import Footer from '@/components/footer'
import { Toaster } from '@/components/ui/toaster'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          {children}
          <Footer />
        </div>
        <BottomNavigation />
        <TabletBottomNavigation />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}

