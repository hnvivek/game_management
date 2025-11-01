import { db } from '@/lib/db'
import { getCountryInfo, getCurrencyInfo, formatCurrency, getLocalizedDateTime } from '@/lib/internationalization'

export interface VendorSettings {
  country: string
  timezone: string
  locale: string
  currency: string
  currencySymbol: string
  taxRate?: number
  taxIncluded: boolean
}

export interface EnhancedVendorSettings extends VendorSettings {
  countryInfo?: any
  currencyInfo?: any
  formatCurrency: (amount: number) => string
  formatDateTime: (date: Date, options?: Intl.DateTimeFormatOptions) => string
  formatTime: (date: Date) => string
}

export async function getVendorSettings(vendorId: string): Promise<EnhancedVendorSettings | null> {
  try {
    const vendor = await db.vendor.findUnique({
      where: { id: vendorId },
      include: {
        vendorSettings: true
      }
    })

    if (!vendor) {
      return null
    }

    // Get settings from vendor model (with fallbacks)
    const country = vendor.country || 'IN'
    const timezone = vendor.timezone || 'Asia/Kolkata'
    const locale = vendor.locale || 'en-IN'
    const currency = vendor.vendorSettings?.currency || 'INR'
    const currencySymbol = vendor.vendorSettings?.currencySymbol || getCurrencyInfo(currency)?.symbol || currency
    const taxRate = vendor.vendorSettings?.taxRate
    const taxIncluded = vendor.vendorSettings?.taxIncluded || false

    // Get country and currency info
    const countryInfo = getCountryInfo(country)
    const currencyInfo = getCurrencyInfo(currency)

    return {
      country,
      timezone,
      locale,
      currency,
      currencySymbol,
      taxRate,
      taxIncluded,
      countryInfo,
      currencyInfo,
      formatCurrency: (amount: number) => formatCurrency(amount, currency, locale),
      formatDateTime: (date: Date, options?: Intl.DateTimeFormatOptions) =>
        getLocalizedDateTime(date, timezone, locale, options),
      formatTime: (date: Date) => {
        return new Intl.DateTimeFormat(locale, {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: timezone
        }).format(date)
      }
    }
  } catch (error) {
    console.error('Error fetching vendor settings:', error)
    return null
  }
}

export async function getVendorSettingsBySlug(slug: string): Promise<EnhancedVendorSettings | null> {
  try {
    const vendor = await db.vendor.findUnique({
      where: { slug },
      include: {
        vendorSettings: true
      }
    })

    if (!vendor) {
      return null
    }

    return await getVendorSettings(vendor.id)
  } catch (error) {
    console.error('Error fetching vendor settings by slug:', error)
    return null
  }
}

export function getDefaultVendorSettings(): EnhancedVendorSettings {
  const currency = 'INR'
  const locale = 'en-IN'
  const timezone = 'Asia/Kolkata'
  const country = 'IN'

  return {
    country,
    timezone,
    locale,
    currency,
    currencySymbol: '₹',
    taxIncluded: false,
    countryInfo: getCountryInfo(country),
    currencyInfo: getCurrencyInfo(currency),
    formatCurrency: (amount: number) => formatCurrency(amount, currency, locale),
    formatDateTime: (date: Date, options?: Intl.DateTimeFormatOptions) =>
      getLocalizedDateTime(date, timezone, locale, options),
    formatTime: (date: Date) => {
      return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
      }).format(date)
    }
  }
}