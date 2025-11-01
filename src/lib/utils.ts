import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currencyCode: string) {
  // Map currency codes to locales
  const currencyConfig: { [key: string]: { locale: string } } = {
    'USD': { locale: 'en-US' },
    'INR': { locale: 'en-IN' },
    'GBP': { locale: 'en-GB' },
    'EUR': { locale: 'en-IE' },
    'AED': { locale: 'en-AE' },
    'CAD': { locale: 'en-CA' },
  }

  const config = currencyConfig[currencyCode] || { locale: 'en-US' }

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}
