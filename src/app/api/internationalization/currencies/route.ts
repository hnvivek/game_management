import { NextRequest, NextResponse } from 'next/server'
import {
  getSupportedCurrencies,
  getCurrencyInfo,
  validateCurrencyCode,
  convertCurrency,
  DEFAULT_EXCHANGE_RATES
} from '@/lib/internationalization'
import { getVendorSettings } from '@/lib/vendor-settings'

// GET /api/internationalization/currencies - Get supported currencies and conversion rates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const currencyCode = searchParams.get('currency')
    const amount = searchParams.get('amount')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (currencyCode) {
      // Get specific currency information
      if (!validateCurrencyCode(currencyCode)) {
        return NextResponse.json(
          { error: 'Invalid currency code' },
          { status: 400 }
        )
      }

      const currencyInfo = getCurrencyInfo(currencyCode)
      if (!currencyInfo) {
        return NextResponse.json(
          { error: 'Currency not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ currency: currencyInfo })
    }

    // Handle currency conversion
    if (amount && from && to) {
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json(
          { error: 'Invalid amount. Must be a positive number.' },
          { status: 400 }
        )
      }

      if (!validateCurrencyCode(from) || !validateCurrencyCode(to)) {
        return NextResponse.json(
          { error: 'Invalid currency codes' },
          { status: 400 }
        )
      }

      const convertedAmount = convertCurrency(
        parsedAmount,
        from.toUpperCase(),
        to.toUpperCase(),
        DEFAULT_EXCHANGE_RATES
      )

      const fromCurrencyInfo = getCurrencyInfo(from)
      const toCurrencyInfo = getCurrencyInfo(to)

      return NextResponse.json({
        conversion: {
          amount: parsedAmount,
          from: from.toUpperCase(),
          to: to.toUpperCase(),
          convertedAmount,
          rate: DEFAULT_EXCHANGE_RATES[to.toUpperCase()] / DEFAULT_EXCHANGE_RATES[from.toUpperCase()],
          fromSymbol: fromCurrencyInfo?.symbol || from,
          toSymbol: toCurrencyInfo?.symbol || to
        }
      })
    }

    // Get all supported currencies
    const currencies = getSupportedCurrencies()

    return NextResponse.json({
      currencies,
      exchangeRates: DEFAULT_EXCHANGE_RATES,
      count: currencies.length
    })

  } catch (error) {
    console.error('Error fetching currencies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch currencies' },
      { status: 500 }
    )
  }
}