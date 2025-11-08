/**
 * Design System Theme for Bengaluru Sports League
 * Standardized colors, typography, spacing, and component styles
 */

export const theme = {
  // Brand Colors
  colors: {
    // Primary brand colors
    primary: {
      50: '#fef3e2',
      100: '#fde8c7',
      200: '#fad4a3',
      300: '#f6bb73',
      400: '#f39c31',
      500: '#f39c12', // Primary brand color
      600: '#d68910',
      700: '#b17a04',
      800: '#8a6603',
      900: '#6b5400',
    },

    // Secondary colors
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Secondary blue
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },

    // Neutral colors
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },

    // Status colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },

    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },

    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },

    // Chart color palette (optimized for data visualization)
    // Using harmonious, earthy palette: Eggshell, Burnt Sienna, Delft Blue, Cambridge Blue, Sunset
    // Based on ColorBrewer principles: accessible, harmonious, colorblind-safe
    charts: {
      // Primary chart colors (brand identity)
      primary: '#e07a5f',        // Burnt Sienna - warm, distinctive for main metrics
      primaryLight: '#e79680',   // Lighter Burnt Sienna for accents
      
      // Secondary chart colors
      secondary: '#3d405b',      // Delft Blue - professional dark blue for supporting data
      secondaryLight: '#5a5e87', // Lighter Delft Blue
      
      // Status colors (semantic meaning - colorblind-friendly)
      confirmed: '#81b29a',      // Cambridge Blue - greenish, positive action
      pending: '#f2cc8f',        // Sunset - warm yellow, attention needed
      completed: '#3d405b',      // Delft Blue - neutral completion
      cancelled: '#d7502b',      // Darker Burnt Sienna - negative action (darker variant)
      
      // Metric-specific colors
      bookings: '#e07a5f',       // Burnt Sienna - brand color for booking trends
      revenue: '#81b29a',        // Cambridge Blue - success-like for revenue
      
      // Categorical palette for multi-series charts
      // Using the full palette plus variations for colorblind-safe, harmonious sequence
      categorical: [
        '#e07a5f',  // Burnt Sienna - primary brand
        '#3d405b',  // Delft Blue - secondary
        '#81b29a',  // Cambridge Blue - success
        '#f2cc8f',  // Sunset - warning
        '#d7502b',  // Darker Burnt Sienna
        '#5a5e87',  // Lighter Delft Blue
        '#9ac1ae',  // Lighter Cambridge Blue
        '#f4d5a4',  // Lighter Sunset
      ],
      
      // Activity status colors
      activity: {
        success: '#81b29a',      // Cambridge Blue
        warning: '#f2cc8f',      // Sunset
        error: '#d7502b',        // Darker Burnt Sienna
        info: '#3d405b'          // Delft Blue
      },
      
      // Muted sport colors - carefully curated palette for sports
      // Balanced saturation for good visibility while maintaining sophisticated muted aesthetic
      // Colorblind-friendly and visually harmonious
      // Each color is unique and distinguishable
      sports: {
        muted: [
          '#8b9dc3',  // Muted periwinkle blue
          '#7fb3a8',  // Muted teal green
          '#c49a6a',  // Muted warm tan
          '#a68db8',  // Muted lavender
          '#6ba8a5',  // Muted aqua
          '#b89a7a',  // Muted camel
          '#7ba5c4',  // Muted sky blue
          '#8db38a',  // Muted sage
          '#c48a8a',  // Muted dusty rose
          '#6b8db3',  // Muted steel blue
          '#b38a9a',  // Muted mauve
          '#7fb38a',  // Muted mint
          '#b3a68a',  // Muted khaki
          '#9a8db3',  // Muted purple-gray
          '#a68a7a',  // Muted terracotta
          '#6ba58a',  // Muted forest
          '#b38a7a',  // Muted coral
          '#7a8db3',  // Muted slate blue
          '#a6b38a',  // Muted olive
          '#8db3a6',  // Muted seafoam
          '#b38a8a',  // Muted rose
          '#6b9db3',  // Muted cyan
          '#9a7ab3',  // Muted violet
          '#a68a9a',  // Muted plum
        ]
      }
    }
  },

  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
    },

    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },

    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },

    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    }
  },

  // Spacing
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',  // 2px
    base: '0.25rem', // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Animation
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    }
  }
}

// Component-specific theme helpers
export const components = {
  // Card styles
  card: {
    base: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    hover: 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-300',
    padding: {
      sm: 'p-3',
      base: 'p-4',
      lg: 'p-6',
    }
  },

  // Badge styles
  badge: {
    base: 'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
    variants: {
      default: 'bg-gray-100 text-gray-800',
      primary: 'bg-primary-100 text-primary-800 border border-primary-200',
      secondary: 'bg-secondary-100 text-secondary-800 border border-secondary-200',
      success: 'bg-success-100 text-success-800 border border-success-200',
      warning: 'bg-warning-100 text-warning-800 border border-warning-200',
      error: 'bg-error-100 text-error-800 border border-error-200',
    }
  },

  // Button styles
  button: {
    base: 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    variants: {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
      secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
    },
    sizes: {
      sm: 'px-3 py-1.5 text-xs',
      base: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    }
  },

  // Input styles
  input: {
    base: 'flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
    error: 'border-error-500 focus:ring-error-500 focus:border-error-500',
  }
}

// Helper function to get CSS variable values
export const getCSSVar = (path: string) => {
  const keys = path.split('.')
  let value: any = theme
  for (const key of keys) {
    value = value[key]
  }
  return value
}

// Export default theme
export default theme