import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    
    // Get all active turfs with their pricing
    const turfs = await db.turf.findMany({
      where: {
        isActive: true,
        ...(sport && { sport }),
      },
      orderBy: [
        { sport: 'asc' },
        { pricePerHour: 'asc' },
        { size: 'desc' },
      ],
    })
    
    // Group by size and sport to create a clean listings structure
    const listings = turfs.reduce((acc, turf) => {
      const key = `${turf.sport}-${turf.size}`
      
      if (!acc[key]) {
        acc[key] = {
          id: key,
          sport: turf.sport,
          sportLabel: getSportLabel(turf.sport),
          size: turf.size,
          pricePerHour: turf.pricePerHour,
          maxPlayers: turf.maxPlayers,
          availableCount: 0,
          totalCount: 0,
          courts: []
        }
      }
      
      acc[key].totalCount++
      acc[key].courts.push({
        turfId: turf.id,
        courtNumber: turf.courtNumber,
        name: turf.name,
        venue: turf.venue
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
      sports: [...new Set(turfs.map(t => t.sport))],
      priceRange: {
        min: Math.min(...turfs.map(t => t.pricePerHour)),
        max: Math.max(...turfs.map(t => t.pricePerHour))
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
    'soccer': 'Football/Soccer',
    'box-cricket': 'Box Cricket',
    'ultimate-frisbee': 'Ultimate Frisbee',
    'basketball': 'Basketball'
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
    'soccer-11 a side': 'Full-field football match with complete teams',
    'soccer-8 a side': 'Mid-size game, perfect for casual matches',
    'soccer-6 a side': 'Compact game, great for quick matches and training',
    'box-cricket-7 a side': 'Indoor cricket with modified rules for smaller spaces'
  }
  
  const key = `${sport}-${size}`
  return descriptions[key] || `${size} format for ${maxPlayers} total players`
}
