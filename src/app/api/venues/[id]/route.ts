import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/venues/[id] - Get venue details by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const venue = await prisma.venue.findFirst({
      where: { 
        id,
        deletedAt: null // Exclude soft-deleted venues
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            verified: true,
            currencyCode: true, // Include vendor currency code as fallback
          },
        },
        courts: {
          where: { isActive: true },
          include: {
            sport: {
              select: {
                id: true,
                name: true,
                displayName: true,
                icon: true,
              },
            },
            format: {
              select: {
                id: true,
                name: true,
                displayName: true,
                minPlayers: true,
                maxPlayers: true,
              },
            },
          },
        },
        operatingHours: {
          where: {
            isOpen: true,
          },
          orderBy: {
            dayOfWeek: 'asc',
          },
        },
        _count: {
          select: {
            courts: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    })

    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }

    // Transform the data to match the expected format
    const transformedVenue = {
      id: venue.id,
      name: venue.name,
      description: venue.description,
      address: venue.address,
      city: venue.city,
      postalCode: venue.postalCode,
      latitude: venue.latitude,
      longitude: venue.longitude,
      phone: venue.phone,
      email: venue.email,
      website: venue.website,
      featuredImage: venue.featuredImage,
      isActive: venue.isActive,
      countryCode: venue.countryCode,
      currencyCode: venue.currencyCode,
      timezone: venue.timezone,
      courts: venue.courts.map(court => ({
        id: court.id,
        name: court.name,
        courtNumber: court.courtNumber,
        description: court.description,
        surface: court.surface,
        pricePerHour: court.pricePerHour,
        maxPlayers: court.maxPlayers,
        features: court.features ? JSON.parse(court.features) : [],
        images: court.images ? JSON.parse(court.images) : [],
        sport: court.sport,
        format: court.format,
      })),
      operatingHours: venue.operatingHours,
      openingHours: venue.operatingHours.length > 0
        ? `${Math.min(...venue.operatingHours.map(h => parseInt(h.openingTime.split(':')[0])))}:00 - ${Math.max(...venue.operatingHours.map(h => parseInt(h.closingTime.split(':')[0])))}:00`
        : 'Not specified',
      vendor: venue.vendor,
      totalCourts: venue._count.courts,
      createdAt: venue.createdAt,
      updatedAt: venue.updatedAt,
    }

    return NextResponse.json({ venue: transformedVenue })
  } catch (error) {
    console.error('Error fetching venue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch venue' },
      { status: 500 }
    )
  }
}