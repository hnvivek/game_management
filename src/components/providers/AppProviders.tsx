'use client'

import { AuthProvider } from '@/components/features/auth/AuthProvider'
import { ThemeProvider } from '@/styles/providers/theme-provider'
import { BottomNavigation, TabletBottomNavigation } from '@/components/navigation/bottom-navigation'
import Footer from '@/components/footer'
import { Toaster } from '@/components/ui/toaster'
import { usePathname } from 'next/navigation'

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isVendorRoute = pathname?.startsWith('/vendor')
  
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          {children}
          {!isVendorRoute && <Footer />}
        </div>
        <BottomNavigation />
        <TabletBottomNavigation />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}

