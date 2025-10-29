import { NextRequest, NextResponse } from 'next/server'
import { getSupportedCountries, getCountryInfo, validateCountryCode } from '@/lib/internationalization'

// GET /api/internationalization/countries - Get supported countries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const countryCode = searchParams.get('country')

    if (countryCode) {
      // Get specific country information
      if (!validateCountryCode(countryCode)) {
        return NextResponse.json(
          { error: 'Invalid country code' },
          { status: 400 }
        )
      }

      const countryInfo = getCountryInfo(countryCode)
      if (!countryInfo) {
        return NextResponse.json(
          { error: 'Country not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ country: countryInfo })
    }

    // Get all supported countries
    const countries = getSupportedCountries()

    return NextResponse.json({
      countries,
      count: countries.length
    })

  } catch (error) {
    console.error('Error fetching countries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    )
  }
}