/**
 * Central Theme System
 * Unified export for all theme-related functionality
 */

// Design tokens and base theme
export { theme, getCSSVar, components } from './tokens'

// Vendor-specific theming
export {
  defaultVendorSettings,
  getVendorTheme,
  validateVendorSettings,
  vendorHelpers,
  type VendorSettings
} from './vendor'

// Component-specific theme helpers
export {
  useThemeColors,
  useResponsiveBreakpoints,
  getStatusColors,
  getButtonVariants,
  getBadgeVariants,
  getCardClasses
} from './components'

// Sport color utilities
export {
  sportColorPalette,
  getSportColor,
  hexToRgba
} from './sport-colors'

// Re-export main theme as default
export { theme as default } from './tokens'