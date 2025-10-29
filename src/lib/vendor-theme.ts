/**
 * Vendor-specific theme and settings system
 * Allows each vendor to customize their experience while maintaining brand consistency
 */

import { theme } from './theme'

// Base vendor interface
export interface VendorSettings {
  // Vendor Profile
  profile: {
    id: string
    businessName: string
    logo?: string
    primaryColor: string
    secondaryColor: string
    description?: string
    address?: string
    phone?: string
    email?: string
    website?: string
  }

  // Business Hours
  businessHours: {
    monday: { open: string; close: string; closed: boolean }
    tuesday: { open: string; close: string; closed: boolean }
    wednesday: { open: string; close: string; closed: boolean }
    thursday: { open: string; close: string; closed: boolean }
    friday: { open: string; close: string; closed: boolean }
    saturday: { open: string; close: string; closed: boolean }
    sunday: { open: string; close: string; closed: boolean }
  }

  // Venue Settings
  venue: {
    sportTypes: string[] // Available sports
    maxConcurrentBookings: number
    bookingTimeSlots: number // minutes per slot
    advanceBookingDays: number
    cancellationPolicy: string
    amenities: string[]
    images: string[]
    pricing: {
      basePrice: number
      peakHourPrice?: number
      weekendPrice?: number
    }
  }

  // Display Preferences
  display: {
    theme: 'light' | 'dark' | 'auto'
    accentColor: string
    showBookingCalendar: boolean
    showPricingPublicly: boolean
    allowOnlinePayments: boolean
    showContactInfo: boolean
    customCSS?: string
  }

  // Notification Settings
  notifications: {
    emailNotifications: boolean
    smsNotifications: boolean
    bookingReminders: boolean
    newBookingAlerts: boolean
    cancellationAlerts: boolean
    paymentAlerts: boolean
  }

  // Integration Settings
  integrations: {
    paymentProvider?: 'stripe' | 'razorpay' | 'paypal'
    calendarSync?: boolean
    websiteEmbed?: boolean
    socialMedia?: {
      facebook?: string
      instagram?: string
      twitter?: string
      linkedin?: string
    }
  }
}

// Default vendor settings template
export const defaultVendorSettings: VendorSettings = {
  profile: {
    id: '',
    businessName: '',
    primaryColor: theme.colors.primary[500],
    secondaryColor: theme.colors.secondary[500],
  },

  businessHours: {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '18:00', closed: false },
    sunday: { open: '09:00', close: '18:00', closed: true },
  },

  venue: {
    sportTypes: ['Football', 'Cricket', 'Basketball'],
    maxConcurrentBookings: 1,
    bookingTimeSlots: 60,
    advanceBookingDays: 30,
    cancellationPolicy: 'Full refund if cancelled 24 hours before booking',
    amenities: ['Parking', 'Changing Rooms', 'Floodlights'],
    images: [],
    pricing: {
      basePrice: 1000,
      peakHourPrice: 1500,
      weekendPrice: 1200,
    },
  },

  display: {
    theme: 'light',
    accentColor: theme.colors.primary[500],
    showBookingCalendar: true,
    showPricingPublicly: true,
    allowOnlinePayments: true,
    showContactInfo: true,
  },

  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    bookingReminders: true,
    newBookingAlerts: true,
    cancellationAlerts: true,
    paymentAlerts: true,
  },

  integrations: {
    paymentProvider: 'razorpay',
    calendarSync: false,
    websiteEmbed: false,
    socialMedia: {},
  },
}

// Generate vendor-specific theme
export const getVendorTheme = (vendorSettings: VendorSettings) => {
  return {
    ...theme,
    colors: {
      ...theme.colors,
      primary: {
        ...theme.colors.primary,
        500: vendorSettings.profile.primaryColor,
        // Generate color variations based on primary color
        50: vendorSettings.profile.primaryColor + '0f', // Very light
        100: vendorSettings.profile.primaryColor + '1f', // Light
        200: vendorSettings.profile.primaryColor + '2f', // Light-medium
        300: vendorSettings.profile.primaryColor + '3f', // Medium
        400: vendorSettings.profile.primaryColor + '4f', // Medium-dark
        600: vendorSettings.profile.primaryColor + '6f', // Dark
        700: vendorSettings.profile.primaryColor + '7f', // Dark
        800: vendorSettings.profile.primaryColor + '8f', // Very dark
        900: vendorSettings.profile.primaryColor + '9f', // Darkest
      },
      secondary: {
        ...theme.colors.secondary,
        500: vendorSettings.profile.secondaryColor,
      },
    },
    vendor: {
      businessName: vendorSettings.profile.businessName,
      logo: vendorSettings.profile.logo,
      theme: vendorSettings.display.theme,
      accentColor: vendorSettings.display.accentColor,
    },
  }
}

// Vendor theme validation
export const validateVendorSettings = (settings: Partial<VendorSettings>): string[] => {
  const errors: string[] = []

  // Validate business name
  if (!settings.profile?.businessName || settings.profile.businessName.trim().length < 2) {
    errors.push('Business name must be at least 2 characters long')
  }

  // Validate colors
  if (settings.profile?.primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(settings.profile.primaryColor)) {
    errors.push('Primary color must be a valid hex color')
  }

  if (settings.profile?.secondaryColor && !/^#[0-9A-Fa-f]{6}$/.test(settings.profile.secondaryColor)) {
    errors.push('Secondary color must be a valid hex color')
  }

  // Validate business hours
  if (settings.businessHours) {
    Object.entries(settings.businessHours).forEach(([day, hours]) => {
      if (!hours.closed && (!hours.open || !hours.close)) {
        errors.push(`${day} must have both opening and closing times when not closed`)
      }
    })
  }

  // Validate pricing
  if (settings.venue?.pricing) {
    if (settings.venue.pricing.basePrice <= 0) {
      errors.push('Base price must be greater than 0')
    }
  }

  return errors
}

// Helper functions for vendor customization
export const vendorHelpers = {
  // Format business hours for display
  formatBusinessHours: (hours: VendorSettings['businessHours']) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    return days.map(day => ({
      day: day.charAt(0).toUpperCase() + day.slice(1),
      ...hours[day as keyof typeof hours],
    }))
  },

  // Generate CSS custom properties for vendor theme
  generateCSSVariables: (vendorSettings: VendorSettings) => {
    return `
      :root {
        --vendor-primary-color: ${vendorSettings.profile.primaryColor};
        --vendor-secondary-color: ${vendorSettings.profile.secondaryColor};
        --vendor-accent-color: ${vendorSettings.display.accentColor};
        --vendor-business-name: '${vendorSettings.profile.businessName}';
      }
    `
  },

  // Check if vendor is open at specific time
  isOpenAt: (hours: VendorSettings['businessHours'], date: Date = new Date()) => {
    const day = date.toLocaleDateString('en-US', { weekday: 'lowercase' }) as keyof typeof hours
    const todayHours = hours[day]

    if (todayHours.closed) return false

    const currentTime = date.getHours() * 60 + date.getMinutes()
    const openTime = parseInt(todayHours.open.split(':')[0]) * 60 + parseInt(todayHours.open.split(':')[1])
    const closeTime = parseInt(todayHours.close.split(':')[0]) * 60 + parseInt(todayHours.close.split(':')[1])

    return currentTime >= openTime && currentTime <= closeTime
  },

  // Calculate booking price based on vendor settings
  calculateBookingPrice: (
    basePrice: number,
    duration: number,
    date: Date,
    vendorSettings: VendorSettings
  ) => {
    let price = basePrice

    // Weekend pricing
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    if (isWeekend && vendorSettings.venue.pricing.weekendPrice) {
      price = vendorSettings.venue.pricing.weekendPrice
    }

    // Peak hour pricing (example: 6 PM - 9 PM)
    const hour = date.getHours()
    const isPeakHour = hour >= 18 && hour <= 21
    if (isPeakHour && vendorSettings.venue.pricing.peakHourPrice) {
      price = vendorSettings.venue.pricing.peakHourPrice
    }

    // Calculate based on duration (in hours)
    const durationInHours = duration / 60
    return price * durationInHours
  },
}

const vendorTheme = {
  defaultVendorSettings,
  getVendorTheme,
  validateVendorSettings,
  vendorHelpers,
}

export default vendorTheme