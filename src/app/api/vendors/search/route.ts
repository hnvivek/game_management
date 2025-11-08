import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema for vendor search parameters
const vendorSearchSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val) || 1),
  limit: z.string().optional().transform(val => Math.min(parseInt(val) || 20, 100)),
  search: z.string().optional(),
  city: z.string().optional(),
  sport: z.string().optional(),
  sortBy: z.enum(['featured', 'rating', 'price-low', 'price-high', 'reviews', 'newest']).optional(),
  featured: z.string().optional().transform(val => val === 'true'),
  minRating: z.string().optional().transform(val => parseFloat(val)),
  maxPrice: z.string().optional().transform(val => parseFloat(val)),
  hasAvailability: z.string().optional().transform(val => val === 'true'),
});

// GET: Search and discover vendors with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validatedParams = vendorSearchSchema.parse(Object.fromEntries(searchParams));

    const {
      page,
      limit,
      search,
      city,
      sport,
      sortBy = 'featured',
      featured,
      minRating,
      maxPrice,
      hasAvailability,
    } = validatedParams;

    const skip = (page - 1) * limit;

    // Build where clause for venues
    const where: any = {
      vendor: {
        isActive: true,
      },
      isActive: true,
    };

    // Search term (venue name, description, address)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        {
          vendor: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    // City filter
    if (city && city !== 'all') {
      where.city = { contains: city, mode: 'insensitive' };
    }

    // Sport filter (via courts)
    if (sport && sport !== 'all') {
      where.courts = {
        some: {
          sport: {
            name: { contains: sport, mode: 'insensitive' },
          },
          isActive: true,
        },
      };
    }

    // Featured filter (vendors with multiple venues)
    if (featured) {
      where.vendor = {
        ...where.vendor,
        venues: {
          some: {},
          _count: {
            gt: 2, // More than 2 venues
          },
        },
      };
    }

    // Availability filter
    if (hasAvailability) {
      where.courts = {
        some: {
          isActive: true,
        },
      };
    }

    // Build sort clause
    let orderBy: any = [{ vendor: { name: 'asc' } }];
    switch (sortBy) {
      case 'rating':
        // Sort by vendor rating (will be calculated from reviews later)
        orderBy = [{ vendor: { name: 'asc' } }];
        break;
      case 'price-low':
        orderBy = [{ courts: { _avg: 'pricePerHour' } }];
        break;
      case 'price-high':
        orderBy = [{ courts: { _avg: 'pricePerHour' } }];
        break;
      case 'reviews':
        // Sort by review count (will be calculated from reviews later)
        orderBy = [{ vendor: { name: 'asc' } }];
        break;
      case 'newest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'featured':
      default:
        // Sort by venue count and then by name
        orderBy = [
          { vendor: { venues: { _count: 'desc' } } },
          { vendor: { name: 'asc' } },
        ];
        break;
    }

    // Execute main query
    const [venues, total] = await Promise.all([
      db.venue.findMany({
        where: {
          ...where,
          deletedAt: null // Exclude soft-deleted venues
        },
        orderBy,
        skip,
        take: limit,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              description: true,
              website: true,
              email: true,
              phoneCountryCode: true,
              phoneNumber: true,
              primaryColor: true,
              secondaryColor: true,
              isActive: true,
              _count: {
                select: {
                  venues: true,
                },
              },
            },
          },
          courts: {
            where: {
              isActive: true,
            },
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
      }),
      db.venue.count({ where }),
    ]);

    // Get unique vendors and transform the data
    const vendorMap = new Map();

    venues.forEach(venue => {
      const vendorId = venue.vendor.id;

      if (!vendorMap.has(vendorId)) {
        // Calculate average price from courts
        const avgPrice = venue.courts.length > 0
          ? Math.round(venue.courts.reduce((sum, court) => sum + court.pricePerHour, 0) / venue.courts.length)
          : 0;

        // Get unique sports from courts
        const sports = [...new Set(venue.courts.map(court => court.sport.displayName))];

        // Get operating hours
        const operatingHours = venue.operatingHours.length > 0
          ? `${Math.min(...venue.operatingHours.map(h => parseInt(h.openingTime.split(':')[0])))}:00 - ${Math.max(...venue.operatingHours.map(h => parseInt(h.closingTime.split(':')[0])))}:00`
          : 'Not specified';

        vendorMap.set(vendorId, {
          id: venue.vendor.id,
          name: venue.vendor.name,
          slug: venue.vendor.slug,
          logoUrl: venue.vendor.logoUrl,
          description: venue.vendor.description,
          location: `${venue.city}, ${venue.vendor.countryCode}`,
          city: venue.city,
          phone: venue.vendor.phoneCountryCode && venue.vendor.phoneNumber
            ? `${venue.vendor.phoneCountryCode} ${venue.vendor.phoneNumber}`
            : null,
          phoneCountryCode: venue.vendor.phoneCountryCode,
          phoneNumber: venue.vendor.phoneNumber,
          rating: 0, // Will be calculated from reviews later
          reviewCount: 0, // Will be calculated from reviews later
          totalVenues: venue.vendor._count.venues,
          activeVenues: venue.vendor._count.venues,
          sports,
          featured: venue.vendor._count.venues > 2,
          priceRange: avgPrice > 0 ? `$${Math.max(20, avgPrice - 20)}-$${avgPrice + 20}/hour` : 'Contact for pricing',
          openingHours: operatingHours,
          featuredImage: null,
          amenities: [],
          verified: true,
          responseTime: 'Within 2 hours',
          venues: [],
        });
      }

      // Add venue to vendor's venues list
      vendorMap.get(vendorId)!.venues.push({
        id: venue.id,
        name: venue.name,
        courtCount: venue._count.courts,
        sports: venue.courts.map(court => court.sport.displayName),
        priceRange: venue.courts.length > 0
          ? `$${Math.min(...venue.courts.map(c => c.pricePerHour))}-$${Math.max(...venue.courts.map(c => c.pricePerHour))}/hour`
          : 'Contact for pricing',
      });
    });

    const vendors = Array.from(vendorMap.values());

    // Apply additional filters that need post-processing
    let filteredVendors = vendors;

    // Filter by minimum rating
    if (minRating) {
      filteredVendors = filteredVendors.filter(vendor => vendor.rating >= minRating);
    }

    // Filter by maximum price
    if (maxPrice) {
      filteredVendors = filteredVendors.filter(vendor => {
        const priceMatch = vendor.priceRange.match(/\$(\d+)/);
        return priceMatch ? parseInt(priceMatch[1]) <= maxPrice : true;
      });
    }

    // Get available cities for filter dropdown
    const cities = await db.venue.findMany({
      where: {
        vendor: { isActive: true },
        isActive: true,
      },
      select: {
        city: true,
      },
      distinct: ['city'],
      orderBy: {
        city: 'asc',
      },
    });

    // Get available sports for filter dropdown
    const sports = await db.sportType.findMany({
      where: {
        isActive: true,
        courts: {
          some: {
            venue: {
              vendor: { isActive: true },
              isActive: true,
            },
          },
        },
      },
      select: {
        name: true,
        displayName: true,
      },
      orderBy: {
        displayName: 'asc',
      },
    });

    return NextResponse.json({
      vendors: filteredVendors,
      pagination: {
        page,
        limit,
        total: filteredVendors.length,
        totalPages: Math.ceil(filteredVendors.length / limit),
      },
      filters: {
        cities: [
          { value: 'all', label: 'All Cities' },
          ...cities.map(city => ({
            value: city.city,
            label: city.city,
          })),
        ],
        sports: [
          { value: 'all', label: 'All Sports' },
          ...sports.map(sport => ({
            value: sport.name,
            label: sport.displayName,
          })),
        ],
      },
    });
  } catch (error) {
        return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}