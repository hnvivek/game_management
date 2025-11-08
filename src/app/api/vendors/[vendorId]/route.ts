import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/vendors/[vendorId] - Get vendor details by ID or slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> | { vendorId: string } }
) {
  try {
    // Resolve params (Next.js 15 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { vendorId } = resolvedParams;

    // Try to find vendor by slug first, then by ID
    let vendor = await db.vendor.findFirst({
      where: { 
        slug: vendorId,
        deletedAt: null
      },
      include: {
        venues: {
          where: { isActive: true },
          include: {
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
          },
        },
        settings: true,
        _count: {
          select: {
            venues: {
              where: { isActive: true }
            },
          },
        },
      },
    })

    // If not found by slug, try by ID
    if (!vendor) {
      vendor = await db.vendor.findFirst({
        where: { 
          id: vendorId,
          deletedAt: null
        },
        include: {
          venues: {
            where: { isActive: true },
            include: {
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
            },
          },
          settings: true,
          _count: {
            select: {
              venues: {
                where: { isActive: true }
              },
            },
          },
        },
      })
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Transform the data to match the expected format
    const transformedVendor = {
      id: vendor.id,
      name: vendor.name,
      slug: vendor.slug,
      logoUrl: vendor.logoUrl,
      description: vendor.description,
      website: vendor.website,
      email: vendor.email,
      phone: vendor.phoneCountryCode && vendor.phoneNumber 
        ? `${vendor.phoneCountryCode} ${vendor.phoneNumber}` 
        : null,
      primaryColor: vendor.primaryColor,
      secondaryColor: vendor.secondaryColor,
      verified: true,
      responseTime: 'Within 2 hours',
      rating: 0, // TODO: Calculate from reviews
      reviewCount: 0, // TODO: Calculate from reviews
      totalVenues: vendor._count.venues,
      activeVenues: vendor._count.venues,
      locations: vendor.venues.map(venue => ({
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
        featuredImage: venue.featuredImage,
        isActive: venue.isActive,
        courts: venue.courts.map(court => ({
          id: court.id,
          name: court.name,
          courtNumber: court.courtNumber,
          description: court.description,
          surface: court.surface,
          pricePerHour: court.pricePerHour,
          maxPlayers: court.maxPlayers,
          features: court.features,
          images: court.images,
          sport: court.sport,
          format: court.format,
        })),
        operatingHours: venue.operatingHours,
        openingHours: venue.operatingHours.length > 0
          ? `${Math.min(...venue.operatingHours.map(h => parseInt(h.openingTime.split(':')[0])))}:00 - ${Math.max(...venue.operatingHours.map(h => parseInt(h.closingTime.split(':')[0])))}:00`
          : 'Not specified',
      })),
      settings: vendor.settings,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
    }

    return NextResponse.json({ vendor: transformedVendor })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch vendor' },
      { status: 500 }
    )
  }
}