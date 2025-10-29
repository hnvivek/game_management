import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    
    // Get all active venues with their pricing
    const venues = await db.venue.findMany({
      where: {
        isActive: true,
        ...(sport && { sport: { name: sport } }),
      },
      include: {
        sport: true,
        vendor: true,
        format: true
      },
      orderBy: [
        { sport: { displayName: 'asc' } },
        { pricePerHour: 'asc' },
        { format: { maxPlayers: 'desc' } },
      ],
    })

    // Group by sport and format to create a clean listings structure
    const listings = venues.reduce((acc, venue) => {
      const key = `${venue.sport.name}-${venue.format.name}`

      if (!acc[key]) {
        acc[key] = {
          id: key,
          sport: venue.sport.name,
          sportLabel: venue.sport.displayName,
          format: venue.format.name,
          formatLabel: venue.format.displayName,
          pricePerHour: venue.pricePerHour,
          maxPlayers: venue.format.maxPlayers,
          minPlayers: venue.format.minPlayers,
          availableCount: 0,
          totalCount: 0,
          courts: []
        }
      }

      acc[key].totalCount++
      acc[key].courts.push({
        venueId: venue.id,
        courtNumber: venue.courtNumber,
        name: `${venue.vendor.name} ${venue.courtNumber}`,
        vendor: venue.vendor.name,
        description: venue.description
      })

      return acc
    }, {} as Record<string, any>)
    
    // Convert to array and add pricing tiers info
    const listingsArray = Object.values(listings).map((listing: any) => ({
      ...listing,
      // Add pricing comparison
      priceCategory: getPriceCategory(listing.pricePerHour),
      // Add helpful descriptions
      description: getDescriptionForSize(listing.sport, listing.size, listing.maxPlayers),
    }))
    
    // Add summary stats
    const summary = {
      totalListings: listingsArray.length,
      sports: [...new Set(venues.map(v => v.sport.displayName))],
      formats: [...new Set(venues.map(v => v.format.displayName))],
      priceRange: {
        min: Math.min(...venues.map(v => v.pricePerHour)),
        max: Math.max(...venues.map(v => v.pricePerHour))
      }
    }
    
    return NextResponse.json({ 
      listings: listingsArray,
      summary 
    })
  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch turf listings' },
      { status: 500 }
    )
  }
}

function getSportLabel(sport: string): string {
  const labels: Record<string, string> = {
    'football': 'Football',
    'basketball': 'Basketball',
    'cricket': 'Cricket'
  }
  return labels[sport] || sport.charAt(0).toUpperCase() + sport.slice(1)
}

function getPriceCategory(pricePerHour: number): string {
  if (pricePerHour <= 1500) return 'Budget'
  if (pricePerHour <= 2500) return 'Standard'
  if (pricePerHour <= 3500) return 'Premium'
  return 'Luxury'
}

function getDescriptionForSize(sport: string, size: string, maxPlayers: number): string {
  const descriptions: Record<string, string> = {
    'football-11-a-side': 'Full-field football match with complete teams',
    'football-7-a-side': 'Mid-size game, perfect for casual matches',
    'football-5-a-side': 'Compact game, great for quick matches and training',
    'basketball-full-court': 'Full basketball court game',
    'basketball-half-court': 'Half basketball court game',
    'cricket-t20': 'Fast-paced T20 cricket match'
  }

  const key = `${sport}-${size}`
  return descriptions[key] || `${size} format for ${maxPlayers} total players`
}
