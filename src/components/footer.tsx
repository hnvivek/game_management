'use client'

import Link from 'next/link'
import { Trophy, Heart } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useResponsive } from '@/styles/providers/theme-provider'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { isMobile, isTablet } = useResponsive()

  // Hide footer on mobile where bottom navigation is active
  if (isMobile) {
    return null
  }

  return (
    <footer className="border-t bg-muted/30 py-4">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-muted-foreground">
            {/* Left side - Company info */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Trophy className="h-4 w-4 text-primary-foreground" />
              </div>
              <span>&copy; {currentYear} GameHub Sports. All rights reserved.</span>
            </div>

            {/* Center - Links */}
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Separator orientation="vertical" className="h-4" />
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Separator orientation="vertical" className="h-4" />
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>

            {/* Right side - Made with love */}
            <div className="flex items-center gap-1">
              <span>Made with</span>
              <Heart className="h-3 w-3 text-red-500 fill-current" />
              <span>in Bengaluru</span>
            </div>
          </div>
      </div>
    </footer>
  )
}