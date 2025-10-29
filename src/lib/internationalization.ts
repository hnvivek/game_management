// Internationalization utilities for multi-currency and country support

export interface CountryInfo {
  code: string
  name: string
  currency: string
  currencySymbol: string
  timezone: string
  locale: string
  phoneCode: string
  dateFormat: string
  numberFormat: string
}

export interface CurrencyInfo {
  code: string
  symbol: string
  name: string
  decimalDigits: number
  symbolPosition: 'before' | 'after'
}

export const COUNTRIES: Record<string, CountryInfo> = {
  // India
  IN: {
    code: 'IN',
    name: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    timezone: 'Asia/Kolkata',
    locale: 'en-IN',
    phoneCode: '+91',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'en-IN'
  },

  // United States
  US: {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'America/New_York',
    locale: 'en-US',
    phoneCode: '+1',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'en-US'
  },

  // United Kingdom
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    timezone: 'Europe/London',
    locale: 'en-GB',
    phoneCode: '+44',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'en-GB'
  },

  // Canada
  CA: {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    currencySymbol: 'C$',
    timezone: 'America/Toronto',
    locale: 'en-CA',
    phoneCode: '+1',
    dateFormat: 'YYYY-MM-DD',
    numberFormat: 'en-CA'
  },

  // Australia
  AU: {
    code: 'AU',
    name: 'Australia',
    currency: 'AUD',
    currencySymbol: 'A$',
    timezone: 'Australia/Sydney',
    locale: 'en-AU',
    phoneCode: '+61',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'en-AU'
  },

  // United Arab Emirates
  AE: {
    code: 'AE',
    name: 'United Arab Emirates',
    currency: 'AED',
    currencySymbol: 'د.إ',
    timezone: 'Asia/Dubai',
    locale: 'en-AE',
    phoneCode: '+971',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'en-AE'
  },

  // Singapore
  SG: {
    code: 'SG',
    name: 'Singapore',
    currency: 'SGD',
    currencySymbol: 'S$',
    timezone: 'Asia/Singapore',
    locale: 'en-SG',
    phoneCode: '+65',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'en-SG'
  },

  // Germany
  DE: {
    code: 'DE',
    name: 'Germany',
    currency: 'EUR',
    currencySymbol: '€',
    timezone: 'Europe/Berlin',
    locale: 'de-DE',
    phoneCode: '+49',
    dateFormat: 'DD.MM.YYYY',
    numberFormat: 'de-DE'
  },

  // France
  FR: {
    code: 'FR',
    name: 'France',
    currency: 'EUR',
    currencySymbol: '€',
    timezone: 'Europe/Paris',
    locale: 'fr-FR',
    phoneCode: '+33',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'fr-FR'
  },

  // Japan
  JP: {
    code: 'JP',
    name: 'Japan',
    currency: 'JPY',
    currencySymbol: '¥',
    timezone: 'Asia/Tokyo',
    locale: 'ja-JP',
    phoneCode: '+81',
    dateFormat: 'YYYY/MM/DD',
    numberFormat: 'ja-JP'
  }
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    decimalDigits: 0,
    symbolPosition: 'before'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimalDigits: 2,
    symbolPosition: 'before'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimalDigits: 2,
    symbolPosition: 'before'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimalDigits: 2,
    symbolPosition: 'after'
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    decimalDigits: 2,
    symbolPosition: 'before'
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    decimalDigits: 2,
    symbolPosition: 'before'
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    decimalDigits: 2,
    symbolPosition: 'before'
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    decimalDigits: 2,
    symbolPosition: 'before'
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimalDigits: 0,
    symbolPosition: 'before'
  }
}

export function getCountryInfo(countryCode: string): CountryInfo | null {
  return COUNTRIES[countryCode.toUpperCase()] || null
}

export function getCurrencyInfo(currencyCode: string): CurrencyInfo | null {
  return CURRENCIES[currencyCode.toUpperCase()] || null
}

export function formatCurrency(
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string {
  const currencyInfo = getCurrencyInfo(currency)
  if (!currencyInfo) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currencyInfo.decimalDigits,
      maximumFractionDigits: currencyInfo.decimalDigits
    }).format(amount)
  } catch (error) {
    // Fallback formatting
    const symbol = currencyInfo.symbol
    const formattedAmount = amount.toLocaleString(locale, {
      minimumFractionDigits: currencyInfo.decimalDigits,
      maximumFractionDigits: currencyInfo.decimalDigits
    })

    return currencyInfo.symbolPosition === 'before'
      ? `${symbol}${formattedAmount}`
      : `${formattedAmount}${symbol}`
  }
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount

  const fromRate = exchangeRates[fromCurrency.toUpperCase()]
  const toRate = exchangeRates[toCurrency.toUpperCase()]

  if (!fromRate || !toRate) {
    console.warn(`Exchange rates not available for ${fromCurrency} or ${toCurrency}`)
    return amount
  }

  // Convert to USD first (as base), then to target currency
  const usdAmount = amount / fromRate
  return usdAmount * toRate
}

export function getLocalizedDateTime(
  date: Date,
  timezone: string = 'Asia/Kolkata',
  locale: string = 'en-IN',
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone
  }

  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(date)
}

export function getLocalizedTime(
  date: Date,
  timezone: string = 'Asia/Kolkata',
  locale: string = 'en-IN'
): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone
  }).format(date)
}

export function validateCountryCode(code: string): boolean {
  return Object.keys(COUNTRIES).includes(code.toUpperCase())
}

export function validateCurrencyCode(code: string): boolean {
  return Object.keys(CURRENCIES).includes(code.toUpperCase())
}

export function getCountryCurrency(countryCode: string): string | null {
  const countryInfo = getCountryInfo(countryCode)
  return countryInfo?.currency || null
}

export function getDefaultCountryTimezone(countryCode: string): string | null {
  const countryInfo = getCountryInfo(countryCode)
  return countryInfo?.timezone || null
}

export function getSupportedCountries(): CountryInfo[] {
  return Object.values(COUNTRIES)
}

export function getSupportedCurrencies(): CurrencyInfo[] {
  return Object.values(CURRENCIES)
}

// Common exchange rates (should be updated periodically from an API)
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1,      // Base currency
  INR: 83.12,  // 1 USD = 83.12 INR
  GBP: 0.79,   // 1 USD = 0.79 GBP
  EUR: 0.92,   // 1 USD = 0.92 EUR
  CAD: 1.36,   // 1 USD = 1.36 CAD
  AUD: 1.53,   // 1 USD = 1.53 AUD
  AED: 3.67,   // 1 USD = 3.67 AED
  SGD: 1.35,   // 1 USD = 1.35 SGD
  JPY: 149.50  // 1 USD = 149.50 JPY
}