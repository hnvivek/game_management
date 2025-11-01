/**
 * Responsive Design Tokens and Utilities
 *
 * This file contains centralized responsive design tokens and utility functions
 * that can be used throughout the application for consistent responsive behavior.
 */

// Breakpoint definitions
export const breakpoints = {
  xs: '375px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const

// Media query utilities
export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,

  // Max-width queries for mobile-first approach
  'max-xs': `@media (max-width: ${breakpoints.xs})`,
  'max-sm': `@media (max-width: ${breakpoints.sm})`,
  'max-md': `@media (max-width: ${breakpoints.md})`,
  'max-lg': `@media (max-width: ${breakpoints.lg})`,
  'max-xl': `@media (max-width: ${breakpoints.xl})`,
  'max-2xl': `@media (max-width: ${breakpoints['2xl']})`,

  // Range queries
  'sm-only': `@media (min-width: ${breakpoints.sm}) and (max-width: ${breakpoints.md})`,
  'md-only': `@media (min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`,
  'lg-only': `@media (min-width: ${breakpoints.lg}) and (max-width: ${breakpoints.xl})`,
  'xl-only': `@media (min-width: ${breakpoints.xl}) and (max-width: ${breakpoints['2xl']})`,
} as const

// Responsive grid configurations
export const gridConfigs = {
  mobile: {
    columns: 1,
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm)'
  },
  tablet: {
    columns: 2,
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-md)'
  },
  desktop: {
    columns: 3,
    gap: 'var(--spacing-lg)',
    padding: 'var(--spacing-lg)'
  },
  large: {
    columns: 4,
    gap: 'var(--spacing-xl)',
    padding: 'var(--spacing-xl)'
  }
} as const

// Responsive typography scales
export const typographyScales = {
  mobile: {
    h1: 'var(--font-size-3xl)',
    h2: 'var(--font-size-2xl)',
    h3: 'var(--font-size-xl)',
    h4: 'var(--font-size-lg)',
    h5: 'var(--font-size-base)',
    h6: 'var(--font-size-sm)',
    body: 'var(--font-size-base)',
    small: 'var(--font-size-sm)',
    xs: 'var(--font-size-xs)'
  },
  tablet: {
    h1: 'var(--font-size-4xl)',
    h2: 'var(--font-size-3xl)',
    h3: 'var(--font-size-2xl)',
    h4: 'var(--font-size-xl)',
    h5: 'var(--font-size-lg)',
    h6: 'var(--font-size-base)',
    body: 'var(--font-size-base)',
    small: 'var(--font-size-sm)',
    xs: 'var(--font-size-xs)'
  },
  desktop: {
    h1: 'var(--font-size-5xl)',
    h2: 'var(--font-size-4xl)',
    h3: 'var(--font-size-3xl)',
    h4: 'var(--font-size-2xl)',
    h5: 'var(--font-size-xl)',
    h6: 'var(--font-size-lg)',
    body: 'var(--font-size-base)',
    small: 'var(--font-size-sm)',
    xs: 'var(--font-size-xs)'
  }
} as const

// Container configurations
export const containerConfigs = {
  fluid: 'max-width: 100%; padding: 0 var(--spacing-md)',
  centered: 'max-width: var(--container-xl); margin: 0 auto; padding: 0 var(--spacing-md)',
  narrow: 'max-width: var(--container-md); margin: 0 auto; padding: 0 var(--spacing-md)',
  wide: 'max-width: var(--container-2xl); margin: 0 auto; padding: 0 var(--spacing-md)',
  responsive: `
    max-width: 100%;
    margin: 0 auto;
    padding: 0 var(--spacing-sm);

    ${mediaQueries.sm} {
      padding: 0 var(--spacing-md);
    }

    ${mediaQueries.lg} {
      padding: 0 var(--spacing-lg);
    }
  `
} as const

// Animation configurations for different devices
export const animationConfigs = {
  mobile: {
    duration: '0.2s',
    easing: 'ease-out',
    reduced: true
  },
  desktop: {
    duration: '0.3s',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    reduced: false
  }
} as const

// Utility functions for responsive behavior
export const getResponsiveValue = <T>(
  values: { mobile?: T; tablet?: T; desktop?: T; large?: T },
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'large' = 'mobile'
): T => {
  return values[breakpoint] || values.mobile || (values.desktop as T)
}

export const getResponsiveClass = (
  baseClasses: string,
  responsiveClasses?: {
    sm?: string
    md?: string
    lg?: string
    xl?: string
    '2xl'?: string
  }
): string => {
  let classes = baseClasses

  if (responsiveClasses?.sm) classes += ` ${responsiveClasses.sm}`
  if (responsiveClasses?.md) classes += ` ${responsiveClasses.md}`
  if (responsiveClasses?.lg) classes += ` ${responsiveClasses.lg}`
  if (responsiveClasses?.xl) classes += ` ${responsiveClasses.xl}`
  if (responsiveClasses?.['2xl']) classes += ` ${responsiveClasses['2xl']}`

  return classes
}

// Responsive spacing generator
export const getResponsiveSpacing = (scale: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl') => {
  const spacingMap = {
    xs: { padding: 'var(--spacing-xs)', margin: 'var(--spacing-xs)' },
    sm: { padding: 'var(--spacing-sm)', margin: 'var(--spacing-sm)' },
    md: { padding: 'var(--spacing-md)', margin: 'var(--spacing-md)' },
    lg: { padding: 'var(--spacing-lg)', margin: 'var(--spacing-lg)' },
    xl: { padding: 'var(--spacing-xl)', margin: 'var(--spacing-xl)' },
    '2xl': { padding: 'var(--spacing-2xl)', margin: 'var(--spacing-2xl)' },
    '3xl': { padding: 'var(--spacing-3xl)', margin: 'var(--spacing-3xl)' }
  }

  return spacingMap[scale]
}

// Device detection utilities
export const deviceDetection = {
  isMobile: () => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < parseInt(breakpoints.md)
  },

  isTablet: () => {
    if (typeof window === 'undefined') return false
    const width = window.innerWidth
    return width >= parseInt(breakpoints.md) && width < parseInt(breakpoints.lg)
  },

  isDesktop: () => {
    if (typeof window === 'undefined') return false
    return window.innerWidth >= parseInt(breakpoints.lg)
  },

  getBreakpoint: () => {
    if (typeof window === 'undefined') return 'mobile'
    const width = window.innerWidth

    if (width < parseInt(breakpoints.sm)) return 'mobile'
    if (width < parseInt(breakpoints.md)) return 'mobile'
    if (width < parseInt(breakpoints.lg)) return 'tablet'
    if (width < parseInt(breakpoints.xl)) return 'desktop'
    return 'large'
  }
}

// Performance optimization utilities
export const performanceOptimizations = {
  // Content visibility for large components
  contentVisibility: {
    auto: 'content-visibility: auto; contain-intrinsic-size: 0 500px;',
    hidden: 'content-visibility: hidden; contain-intrinsic-size: 0 500px;',
    visible: 'content-visibility: visible;'
  },

  // CSS containment
  containment: {
    layout: 'contain: layout;',
    paint: 'contain: paint;',
    size: 'contain: size;',
    layoutPaint: 'contain: layout paint;',
    layoutPaintSize: 'contain: layout paint size;'
  },

  // Will-change for animations
  willChange: {
    transform: 'will-change: transform;',
    opacity: 'will-change: opacity;',
    scroll: 'will-change: scroll-position;'
  }
}

// Touch target utilities
export const touchTargets = {
  minimum: 'min-width: 44px; min-height: 44px;',
  comfortable: 'min-width: 48px; min-height: 48px;',
  large: 'min-width: 52px; min-height: 52px;'
}

// Color scheme utilities
export const colorSchemes = {
  light: {
    background: 'var(--background)',
    foreground: 'var(--foreground)',
    primary: 'var(--primary)',
    text: 'var(--foreground)'
  },
  dark: {
    background: 'var(--background)',
    foreground: 'var(--foreground)',
    primary: 'var(--primary)',
    text: 'var(--foreground)'
  }
}

// Export all responsive design tokens
export const responsiveDesignTokens = {
  breakpoints,
  mediaQueries,
  gridConfigs,
  typographyScales,
  containerConfigs,
  animationConfigs,
  performanceOptimizations,
  touchTargets,
  colorSchemes
}

export default responsiveDesignTokens