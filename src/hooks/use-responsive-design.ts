'use client'

import { useEffect, useState, useCallback } from 'react'
import { useResponsive } from '@/styles/providers/theme-provider'
import responsiveDesignTokens, {
  deviceDetection,
  getResponsiveValue,
  getResponsiveClass
} from '@/lib/utils/responsive-tokens'

/**
 * Enhanced responsive hook that combines theme provider context
 * with responsive design tokens for comprehensive responsive behavior
 */
export function useResponsiveDesign() {
  const { isMobile, isTablet, isDesktop, viewport, breakpoint } = useResponsive()
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on client side for viewport calculations
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Get current device type
  const getDeviceType = useCallback(() => {
    if (!isClient) return 'mobile'
    if (isMobile) return 'mobile'
    if (isTablet) return 'tablet'
    if (isDesktop) return 'desktop'
    return 'large'
  }, [isMobile, isTablet, isDesktop, isClient])

  const deviceType = getDeviceType()

  // Get responsive typography classes
  const getTypographyClasses = useCallback((element: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'small' | 'xs') => {
    const scale = responsiveDesignTokens.typographyScales[deviceType]
    return `text-fluid-${scale[element].replace('var(--font-size-', '').replace(')', '')}`
  }, [deviceType])

  // Get responsive grid configuration
  const getGridConfig = useCallback(() => {
    return responsiveDesignTokens.gridConfigs[deviceType]
  }, [deviceType])

  // Get responsive container classes
  const getContainerClasses = useCallback((type: 'fluid' | 'centered' | 'narrow' | 'wide' | 'responsive' = 'responsive') => {
    const baseClasses = 'w-full'
    const configs = responsiveDesignTokens.containerConfigs

    switch (type) {
      case 'fluid':
        return `${baseClasses} max-w-full px-fluid-md`
      case 'centered':
        return `${baseClasses} max-w-xl mx-auto px-fluid-md lg:px-fluid-lg`
      case 'narrow':
        return `${baseClasses} max-w-md mx-auto px-fluid-md`
      case 'wide':
        return `${baseClasses} max-w-2xl mx-auto px-fluid-md lg:px-fluid-xl`
      case 'responsive':
      default:
        return `${baseClasses} max-w-full mx-auto px-fluid-sm sm:px-fluid-md lg:px-fluid-lg xl:px-fluid-xl`
    }
  }, [])

  // Get responsive spacing classes
  const getSpacingClasses = useCallback((scale: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl', type: 'padding' | 'margin' | 'gap' = 'padding') => {
    const prefix = type === 'padding' ? 'p' : type === 'margin' ? 'm' : 'gap'
    return `${prefix}-fluid-${scale}`
  }, [])

  // Get responsive touch target classes
  const getTouchTargetClasses = useCallback((size: 'minimum' | 'comfortable' | 'large' = 'minimum') => {
    const touchClasses = {
      minimum: 'min-w-11 min-h-11',
      comfortable: 'min-w-12 min-h-12',
      large: 'min-w-13 min-h-13'
    }
    return touchClasses[size]
  }, [])

  // Get responsive animation classes
  const getAnimationClasses = useCallback(() => {
    const duration = isMobile ? 'duration-200' : 'duration-300'
    const easing = isMobile ? 'ease-out' : 'ease-in-out'
    return `${duration} ${easing}`
  }, [isMobile])

  // Performance optimization classes
  const getPerformanceClasses = useCallback((optimization: 'content-visibility' | 'containment' | 'will-change') => {
    const performanceClasses = {
      'content-visibility': {
        auto: 'content-visibility-auto',
        hidden: 'content-visibility-hidden'
      },
      'containment': {
        layout: 'contain-layout',
        paint: 'contain-paint',
        size: 'contain-size',
        layoutPaint: 'contain-layout-paint'
      },
      'will-change': {
        transform: 'will-change-transform',
        opacity: 'will-change-opacity'
      }
    }

    return performanceClasses[optimization]
  }, [])

  // Generate responsive className string
  const generateResponsiveClasses = useCallback((
    baseClasses: string,
    responsiveConfig?: {
      sm?: string
      md?: string
      lg?: string
      xl?: string
      '2xl'?: string
    }
  ) => {
    return getResponsiveClass(baseClasses, responsiveConfig)
  }, [])

  // Check if viewport matches certain conditions
  const viewportMatches = useCallback((conditions: {
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
  }) => {
    if (!isClient) return false

    const { width, height } = viewport
    const { minWidth, maxWidth, minHeight, maxHeight } = conditions

    let matches = true

    if (minWidth !== undefined) matches = matches && width >= minWidth
    if (maxWidth !== undefined) matches = matches && width <= maxWidth
    if (minHeight !== undefined) matches = matches && height >= minHeight
    if (maxHeight !== undefined) matches = matches && height <= maxHeight

    return matches
  }, [viewport, isClient])

  // Get responsive image dimensions
  const getImageDimensions = useCallback((
    baseWidth: number,
    aspectRatio: number = 16 / 9
  ) => {
    const maxWidth = Math.min(baseWidth, viewport.width - 32) // Account for padding
    const height = Math.round(maxWidth / aspectRatio)

    return {
      width: maxWidth,
      height,
      srcSet: [
        `${Math.round(maxWidth * 0.5)}w`,
        `${Math.round(maxWidth * 0.75)}w`,
        `${maxWidth}w`
      ].join(', ')
    }
  }, [viewport])

  // Responsive navigation logic
  const getNavigationConfig = useCallback(() => {
    return {
      showMobileMenu: isMobile,
      maxVisibleItems: isMobile ? 3 : isTablet ? 5 : 7,
      useDropdown: isMobile,
      collapsed: isMobile
    }
  }, [isMobile, isTablet])

  // Responsive form configuration
  const getFormConfig = useCallback(() => {
    return {
      layout: isMobile ? 'single-column' : isTablet ? 'two-column' : 'multi-column',
      inputSize: isMobile ? 'lg' : 'md',
      labelPosition: isMobile ? 'top' : 'side',
      showValidationInline: isMobile
    }
  }, [isMobile, isTablet])

  // Responsive card grid configuration
  const getCardGridConfig = useCallback(() => {
    return {
      columns: isMobile ? 1 : isTablet ? 2 : isDesktop ? 3 : 4,
      gap: isMobile ? 'gap-fluid-sm' : isTablet ? 'gap-fluid-md' : 'gap-fluid-lg',
      padding: isMobile ? 'px-fluid-sm' : isTablet ? 'px-fluid-md' : 'px-fluid-lg'
    }
  }, [isMobile, isTablet, isDesktop])

  return {
    // Basic responsive info
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    viewport,
    breakpoint,
    isClient,

    // Typography utilities
    getTypographyClasses,

    // Layout utilities
    getGridConfig,
    getContainerClasses,
    getSpacingClasses,
    getCardGridConfig,

    // Interaction utilities
    getTouchTargetClasses,
    getAnimationClasses,
    getNavigationConfig,
    getFormConfig,

    // Performance utilities
    getPerformanceClasses,

    // Responsive helpers
    generateResponsiveClasses,
    viewportMatches,
    getImageDimensions,

    // Design tokens
    designTokens: responsiveDesignTokens
  }
}

export default useResponsiveDesign