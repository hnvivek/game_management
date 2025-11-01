/**
 * Location detection and country utilities
 * Implements multiple strategies for detecting user location
 */

// Country codes and their currencies
export const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', flag: '🇦🇪' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦' },
] as const

// Get timezone to country mapping
export const getTimezoneCountry = (timezone: string): string => {
  const timezoneMap: { [key: string]: string } = {
    'Asia/Kolkata': 'IN',
    'America/New_York': 'US',
    'America/Chicago': 'US',
    'America/Denver': 'US',
    'America/Los_Angeles': 'US',
    'America/Miami': 'US',
    'America/Phoenix': 'US',
    'America/Toronto': 'CA',
    'Europe/London': 'GB',
    'Asia/Dubai': 'AE',
  }
  return timezoneMap[timezone] || 'US'
}

// Detect user location using multiple methods
export const detectUserLocation = async (): Promise<{
  country: string
  method: 'geolocation' | 'timezone' | 'ip' | 'manual'
  confidence: 'high' | 'medium' | 'low'
}> => {
  try {
    // Method 1: Browser Geolocation API (most accurate)
    if ('geolocation' in navigator) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              // Reverse geocoding using coordinates (would need a geocoding API)
              // For now, we'll use timezone as fallback
              const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
              const country = getTimezoneCountry(timezone)
              resolve({ country, method: 'geolocation', confidence: 'high' })
            } catch (error) {
              // Fallback to timezone
              const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
              const country = getTimezoneCountry(timezone)
              resolve({ country, method: 'timezone', confidence: 'medium' })
            }
          },
          (error) => {
            // Permission denied or error, fallback to timezone
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
            const country = getTimezoneCountry(timezone)
            resolve({ country, method: 'timezone', confidence: 'medium' })
          },
          { timeout: 5000, enableHighAccuracy: false }
        )
      })
    }
  } catch (error) {
    console.warn('Geolocation failed:', error)
  }

  // Method 2: Timezone detection (always available)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const country = getTimezoneCountry(timezone)
  return { country, method: 'timezone', confidence: 'medium' }
}

// Get available countries based on venues in database
export const getAvailableCountries = async (): Promise<Array<{code: string, name: string, venueCount: number}>> => {
  try {
    const response = await fetch('/api/countries?withVenuesOnly=true')
    if (!response.ok) throw new Error('Failed to fetch countries')

    const data = await response.json()
    return data.countries || COUNTRIES.slice(0, 3).map(c => ({...c, venueCount: 0}))
  } catch (error) {
    console.warn('Failed to fetch available countries:', error)
    return COUNTRIES.slice(0, 3).map(c => ({...c, venueCount: 0}))
  }
}

// Format currency display
export const formatCurrency = (amount: number, currency: string): string => {
  const locale = currency === 'INR' ? 'en-IN' :
                currency === 'GBP' ? 'en-GB' :
                currency === 'EUR' ? 'en-IE' :
                currency === 'AED' ? 'en-AE' :
                currency === 'CAD' ? 'en-CA' : 'en-US'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Get country info
export const getCountryInfo = (code: string) => {
  return COUNTRIES.find(country => country.code === code) || COUNTRIES[0]
}