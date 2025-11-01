import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Helper function to get country name from code
function getCountryName(code: string): string {
  const countryNames: { [key: string]: string } = {
    'US': 'United States',
    'IN': 'India',
    'GB': 'United Kingdom',
    'AE': 'United Arab Emirates',
    'CA': 'Canada',
    'AU': 'Australia',
    'SG': 'Singapore',
    'MY': 'Malaysia',
    'TH': 'Thailand',
    'PH': 'Philippines',
    'JP': 'Japan',
    'KR': 'South Korea',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland'
  }
  return countryNames[code] || code
}

// Validation schema
const countryCreateSchema = z.object({
  code: z.string().length(2).toUpperCase(),
  name: z.string().min(1).max(100),
  timezone: z.string(),
  currencyCode: z.string().length(3).toUpperCase(),
  isActive: z.boolean().optional(),
});

// GET /api/countries - List countries with venues
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const withVenuesOnly = searchParams.get('withVenuesOnly') === 'true';

    // If withVenuesOnly, get countries that have venues
    if (withVenuesOnly) {
      const countriesWithVenues = await prisma.venue.groupBy({
        by: ['countryCode'],
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      })

      // Format the response for location-based filtering
      const countries = countriesWithVenues.map(result => ({
        code: result.countryCode,
        name: getCountryName(result.countryCode),
        venueCount: result._count.id
      }))

      return NextResponse.json({ countries, count: countries.length })
    }

    // Original logic for admin/country management
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (!includeInactive) {
      where.isActive = isActive !== null ? isActive === 'true' : true;
    }

    const countries = await prisma.country.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        currency: {
          select: {
            code: true,
            name: true,
            symbol: true,
            exchangeRate: true,
          },
        },
        _count: {
          select: {
            users: true,
            vendors: true,
            venues: true,
          },
        },
      },
    });

    return NextResponse.json({ countries });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}

// POST /api/countries - Create new country
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = countryCreateSchema.parse(body);

    // Check if country already exists
    const existingCountry = await prisma.country.findUnique({
      where: { code: validatedData.code },
    });

    if (existingCountry) {
      return NextResponse.json(
        { error: 'Country with this code already exists' },
        { status: 409 }
      );
    }

    // Check if currency exists
    const currency = await prisma.currency.findUnique({
      where: { code: validatedData.currencyCode },
    });

    if (!currency) {
      return NextResponse.json(
        { error: 'Currency with this code does not exist' },
        { status: 400 }
      );
    }

    const country = await prisma.country.create({
      data: validatedData,
      include: {
        currency: {
          select: {
            code: true,
            name: true,
            symbol: true,
          },
        },
      },
    });

    return NextResponse.json(country, { status: 201 });
  } catch (error) {
    console.error('Error creating country:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create country' },
      { status: 500 }
    );
  }
}