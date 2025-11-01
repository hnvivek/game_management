"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

// Responsive design context
interface ResponsiveContextType {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  viewport: { width: number; height: number }
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const ResponsiveContext = React.createContext<ResponsiveContextType | undefined>(undefined)

export function useResponsive() {
  const context = React.useContext(ResponsiveContext)
  if (!context) {
    throw new Error('useResponsive must be used within a ThemeProvider')
  }
  return context
}

export function ResponsiveProvider({ children }: { children: React.ReactNode }) {
  const [viewport, setViewport] = React.useState({ width: 1920, height: 1080 })
  const [breakpoint, setBreakpoint] = React.useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg')

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      setViewport({ width, height })

      // Determine breakpoint
      if (width < 640) setBreakpoint('xs')
      else if (width < 768) setBreakpoint('sm')
      else if (width < 1024) setBreakpoint('md')
      else if (width < 1280) setBreakpoint('lg')
      else if (width < 1536) setBreakpoint('xl')
      else setBreakpoint('2xl')
    }

    // Set initial viewport
    handleResize()

    // Add resize listener with debouncing
    let timeoutId: NodeJS.Timeout
    const debouncedHandleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 100)
    }

    window.addEventListener('resize', debouncedHandleResize)
    window.addEventListener('orientationchange', debouncedHandleResize)

    return () => {
      window.removeEventListener('resize', debouncedHandleResize)
      window.removeEventListener('orientationchange', debouncedHandleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  const responsiveContextValue: ResponsiveContextType = {
    isMobile: viewport.width < 768,
    isTablet: viewport.width >= 768 && viewport.width < 1024,
    isDesktop: viewport.width >= 1024,
    viewport,
    breakpoint
  }

  return (
    <ResponsiveContext.Provider value={responsiveContextValue}>
      {children}
    </ResponsiveContext.Provider>
  )
}

// Enhanced Theme Provider with responsive settings
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ResponsiveProvider>
        {children}
      </ResponsiveProvider>
    </NextThemesProvider>
  )
}