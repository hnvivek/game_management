/**
 * Component-specific theme helpers and hooks
 * Provides reusable styling functions for common UI patterns
 */

import { theme, components } from './tokens'

// Hook for getting theme colors with fallbacks
export const useThemeColors = () => {
  return {
    getPrimary: (shade: keyof typeof theme.colors.primary = 500) =>
      theme.colors.primary[shade],
    getSecondary: (shade: keyof typeof theme.colors.secondary = 500) =>
      theme.colors.secondary[shade],
    getGray: (shade: keyof typeof theme.colors.gray = 500) =>
      theme.colors.gray[shade],
    getSuccess: (shade: keyof typeof theme.colors.success = 500) =>
      theme.colors.success[shade],
    getWarning: (shade: keyof typeof theme.colors.warning = 500) =>
      theme.colors.warning[shade],
    getError: (shade: keyof typeof theme.colors.error = 500) =>
      theme.colors.error[shade],
  }
}

// Hook for responsive breakpoint utilities
export const useResponsiveBreakpoints = () => {
  return {
    getSpacing: (size: keyof typeof theme.spacing) => theme.spacing[size],
    getFontSize: (size: keyof typeof theme.typography.fontSize) => theme.typography.fontSize[size],
    getBorderRadius: (size: keyof typeof theme.borderRadius) => theme.borderRadius[size],
    getShadow: (size: keyof typeof theme.shadows) => theme.shadows[size],
  }
}

// Get status color classes based on status
export const getStatusColors = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'open':
    case 'confirmed':
    case 'success':
    case 'completed':
      return 'bg-success/10 text-success border-success/20'

    case 'pending':
    case 'waiting':
    case 'scheduled':
      return 'bg-warning/10 text-warning border-warning/20'

    case 'cancelled':
    case 'rejected':
    case 'failed':
    case 'error':
      return 'bg-error/10 text-error border-error/20'

    case 'closed':
    case 'inactive':
      return 'bg-gray/10 text-gray border-gray/20'

    default:
      return 'bg-primary/10 text-primary border-primary/20'
  }
}

// Get button variant classes
export const getButtonVariants = (variant: keyof typeof components.button.variants = 'primary') => {
  return components.button.variants[variant]
}

// Get badge variant classes
export const getBadgeVariants = (variant: keyof typeof components.badge.variants = 'default') => {
  return components.badge.variants[variant]
}

// Get card classes with optional modifiers
export const getCardClasses = (padding: keyof typeof components.card.padding = 'base', hover: boolean = false) => {
  return [
    components.card.base,
    components.card.padding[padding],
    hover ? components.card.hover : ''
  ].filter(Boolean).join(' ')
}

// Utility function for conditional styling
export const getConditionalClasses = (condition: boolean, trueClass: string, falseClass: string = '') => {
  return condition ? trueClass : falseClass
}

// Responsive class utilities
export const getResponsiveClasses = (base: string, sm?: string, md?: string, lg?: string, xl?: string) => {
  const classes = [base]
  if (sm) classes.push(`sm:${sm}`)
  if (md) classes.push(`md:${md}`)
  if (lg) classes.push(`lg:${lg}`)
  if (xl) classes.push(`xl:${xl}`)
  return classes.join(' ')
}

// Animation utilities
export const getAnimationClasses = (duration: keyof typeof theme.animation.duration = 'normal', easing: keyof typeof theme.animation.easing = 'easeInOut') => {
  return `transition-all duration-${duration} ease-${easing}`
}

// Focus ring utilities
export const getFocusRingClasses = (color: 'primary' | 'secondary' | 'error' = 'primary') => {
  return `focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:ring-offset-2`
}

// Layout utilities for consistent spacing
export const getLayoutClasses = {
  section: 'py-16 px-4 sm:px-6 lg:px-8',
  container: 'max-w-7xl mx-auto',
  card: 'rounded-lg border border-gray-200 shadow-sm',
  button: 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors',
  input: 'flex h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
}

// Color scheme utilities for charts and data visualization
export const getColorScheme = () => ({
  primary: theme.colors.primary,
  secondary: theme.colors.secondary,
  success: theme.colors.success,
  warning: theme.colors.warning,
  error: theme.colors.error,
  gray: theme.colors.gray,
  // Additional colors for charts
  chart: ['#f39c12', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
})