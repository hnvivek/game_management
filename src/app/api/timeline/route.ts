import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface TimelineSlot {
  id: string
  startTime: string
  endTime: string
  venue: {
    id: string
    name: string
    courtNumber: string
    pricePerHour: number
    maxPlayers: number
    sport: {
      id: string
      name: string
      displayName: string
      icon: string
    }
    format: {
      id: string
      name: string
      displayName: string
      minPlayers: number
      maxPlayers: number
    }
    vendor: {
      id: string
      name: string
      slug: string
      primaryColor: string
    }
    location: {
      id: string
      name: string
      area: string
      city: string
    } | null
  }
  status: 'available' | 'open_match' | 'private_match' | 'unavailable'
  totalPrice: number
  pricePerTeam?: number
  match?: {
    id: string
    homeTeam: string
    lookingForOpponent: boolean
    skillLevel: string
    playersConfirmed: number
    playersNeeded: number
    contact?: string
    description?: string
  }
  actions: string[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'soccer'
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const duration = parseInt(searchParams.get('duration') || '2')
    const vendorId = searchParams.get('vendorId')
    const city = searchParams.get('city')
    const area = searchParams.get('area')
    
    console.log('Timeline API called with:', { sport, date, duration, vendorId, city, area })

    // Build venue filter conditions
    const whereConditions: any = {
      isActive: true,
      vendor: { isActive: true },
    }

    if (vendorId) {
      whereConditions.vendorId = vendorId
    }

    if (sport) {
      whereConditions.sport = {
        name: sport,
        isActive: true
      }
    }

    if (city || area) {
      whereConditions.location = {
        ...(city && { city }),
        ...(area && { area }),
        isActive: true
      }
    }

    // Get all active venues that match criteria
    const venues = await db.venue.findMany({
      where: whereConditions,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
            primaryColor: true
          }
        },
        location: {
          select: {
            id: true,
            name: true,
            area: true,
            city: true
          }
        },
        sport: {
          select: {
            id: true,
            name: true,
            displayName: true,
            icon: true
          }
        },
        format: {
          select: {
            id: true,
            name: true,
            displayName: true,
            minPlayers: true,
            maxPlayers: true
          }
        }
      },
      orderBy: [
        { sport: { displayName: 'asc' } },
        { format: { displayName: 'desc' } },
        { courtNumber: 'asc' },
      ],
    })

    // Convert date string to Date object for queries
    const requestDate = new Date(date + 'T00:00:00.000Z')
    const nextDay = new Date(requestDate.getTime() + 24 * 60 * 60 * 1000)

    // Get all bookings for the date
    const bookings = await db.booking.findMany({
      where: {
        venueId: { in: venues.map(v => v.id) },
        status: 'CONFIRMED',
        startTime: {
          gte: requestDate,
          lt: nextDay
        }
      },
      include: {
        venue: true
      }
    })

    // Get all conflicts for the date
    const conflicts = await db.conflict.findMany({
      where: {
        venueId: { in: venues.map(v => v.id) },
        status: 'active',
        startTime: {
          gte: requestDate,
          lt: nextDay
        }
      }
    })

    // Generate timeline slots (6 AM to 11 PM)
    const timelineSlots: TimelineSlot[] = []
    
    for (const venue of venues) {
      for (let hour = 6; hour <= 22 - duration + 1; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`
        const endHour = hour + duration
        const endTime = `${endHour.toString().padStart(2, '0')}:00`
        
        // Create DateTime objects for this slot
        const slotStart = new Date(date + 'T' + startTime + ':00.000Z')
        const slotEnd = new Date(date + 'T' + endTime + ':00.000Z')
        
        // Check if slot has overlapping booking
        const overlappingBooking = bookings.find(booking => 
          booking.venueId === venue.id &&
          booking.startTime < slotEnd &&
          booking.endTime > slotStart
        )
        
        // Check if slot has overlapping conflict
        const overlappingConflict = conflicts.find(conflict => 
          conflict.venueId === venue.id &&
          conflict.startTime < slotEnd &&
          conflict.endTime > slotStart
        )
        
        // Determine status and create slot
        let status: TimelineSlot['status'] = 'available'
        let actions: string[] = ['book_venue', 'create_match']
        let match: TimelineSlot['match'] | undefined
        let pricePerTeam: number | undefined
        
        if (overlappingConflict) {
          status = 'unavailable'
          actions = []
        } else if (overlappingBooking) {
          // For now, treat all bookings as private matches
          // In the future, we can check if booking.type === 'MATCH' and has open slots
          status = 'private_match'
          actions = []
        }
        
        // Calculate total price for the duration
        const totalPrice = venue.pricePerHour * duration
        
        // For open matches, split the cost
        if (status === 'open_match' && match) {
          pricePerTeam = Math.ceil(totalPrice / 2) // Split between 2 teams
        }

        const slot: TimelineSlot = {
          id: `${venue.id}-${date}-${startTime}`,
          startTime,
          endTime,
          venue: {
            id: venue.id,
            name: `${venue.vendor.name} ${venue.courtNumber}`, // Combine vendor name and court number
            courtNumber: venue.courtNumber,
            pricePerHour: venue.pricePerHour,
            maxPlayers: venue.maxPlayers,
            sport: venue.sport,
            format: venue.format,
            vendor: venue.vendor,
            location: venue.location
          },
          status,
          totalPrice,
          pricePerTeam,
          match,
          actions
        }
        
        timelineSlots.push(slot)
      }
    }

    // Sort slots by time, then by venue
    timelineSlots.sort((a, b) => {
      if (a.startTime !== b.startTime) {
        return a.startTime.localeCompare(b.startTime)
      }
      return a.venue.name.localeCompare(b.venue.name)
    })

    console.log(`Generated ${timelineSlots.length} timeline slots`)

    return NextResponse.json({ 
      slots: timelineSlots,
      count: timelineSlots.length,
      filters: { sport, date, duration, vendorId, city, area },
      summary: {
        available: timelineSlots.filter(s => s.status === 'available').length,
        openMatches: timelineSlots.filter(s => s.status === 'open_match').length,
        privateMatches: timelineSlots.filter(s => s.status === 'private_match').length,
        unavailable: timelineSlots.filter(s => s.status === 'unavailable').length
      }
    })
    
  } catch (error) {
    console.error('Error fetching timeline:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch timeline',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
