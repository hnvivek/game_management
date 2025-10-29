import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { addVendorFiltering } from '@/lib/subdomain'

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
  status: 'available' | 'open_match' | 'private_match' | 'vendor_match' | 'unavailable'
  totalPrice: number
  pricePerTeam?: number
  pricePerPlayer?: number
  match?: {
    id: string
    title?: string
    description?: string
    homeTeam?: {
      id: string
      name: string
      captainName: string
      captainPhone: string
      memberCount: number
    }
    awayTeam?: {
      id: string
      name: string
      captainName: string
      captainPhone: string
      memberCount: number
    }
    lookingForOpponent: boolean
    status: string
    skillLevel?: string
    maxPlayers: number
    playersConfirmed: number
    playersNeeded: number
    contact?: string
    isVendorHosted: boolean
  }
  actions: string[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'football'
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const duration = parseInt(searchParams.get('duration') || '2')
    const vendorId = searchParams.get('vendorId')
    const city = searchParams.get('city')
    const area = searchParams.get('area')
    
    console.log('Timeline API called with:', { sport, date, duration, vendorId, city, area })

    // Build venue filter conditions with automatic subdomain filtering
    const whereConditions: any = {
      isActive: true,
      vendor: { isActive: true },
    }

    // Add automatic vendor filtering based on subdomain
    // If on vendor subdomain (e.g., 3lok.gamehub.com), automatically filter by that vendor
    await addVendorFiltering(request, whereConditions, 'vendorId')

    // Add explicit vendor filter (overrides subdomain filter if specified)
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

    // Get all matches for the date (including those looking for opponents)
    const matches = await db.match.findMany({
      where: {
        booking: {
          venueId: { in: venues.map(v => v.id) },
          startTime: {
            gte: requestDate,
            lt: nextDay
          }
        }
      },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            captain: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            },
            _count: {
              select: { members: true }
            }
          }
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            captain: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            },
            _count: {
              select: { members: true }
            }
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
        },
        booking: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            totalAmount: true,
            venue: {
              select: {
                id: true,
                courtNumber: true,
                pricePerHour: true,
                maxPlayers: true,
                vendorId: true
              }
            }
          }
        }
      },
      orderBy: { booking: { startTime: 'asc' } }
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

    // Generate timeline slots - First add matches, then add available slots
    const timelineSlots: TimelineSlot[] = []

    // Add all matches to timeline
    matches.forEach(match => {
      if (match.booking) {
        const startTime = new Date(match.booking.startTime)
        const endTime = new Date(match.booking.endTime)

        let status: TimelineSlot['status'] = 'private_match'
        let actions: string[] = []
        let pricePerTeam: number | undefined
        let pricePerPlayer: number | undefined

        // Determine match type and status
        if (match.awayTeamId === null && match.status === 'OPEN') {
          status = 'open_match'
          actions = ['join_as_opponent', 'contact_organizer']
          pricePerTeam = Math.ceil(match.booking.totalAmount / 2)
        } else if (match.status === 'CONFIRMED') {
          if (match.homeTeam && match.awayTeam) {
            status = 'private_match'
            actions = ['view_match_details']
          }
        } else if (match.status === 'PENDING') {
          status = 'private_match'
          actions = ['view_match_details'] // Only viewable during pending
        }

        // Check if this is a vendor-hosted match (individual players can join)
        const isVendorHosted = match.title?.toLowerCase().includes('vendor') ||
                              match.description?.toLowerCase().includes('individual')

        if (isVendorHosted) {
          status = 'vendor_match'
          actions = ['join_as_player', 'view_match_details']
          pricePerPlayer = Math.ceil(match.booking.totalAmount / match.maxPlayers)
        }

        const timelineMatch: TimelineSlot = {
          id: `match-${match.id}`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          venue: {
            id: match.booking.venue.id,
            name: `${venues.find(v => v.id === match.booking.venue.id)?.vendor.name || 'Unknown'} ${match.booking.venue.courtNumber}`,
            courtNumber: match.booking.venue.courtNumber,
            pricePerHour: match.booking.venue.pricePerHour,
            maxPlayers: match.booking.venue.maxPlayers,
            sport: match.sport,
            format: match.format,
            vendor: venues.find(v => v.id === match.booking.venue.id)?.vendor || {
              id: '',
              name: '',
              slug: '',
              primaryColor: ''
            },
            location: venues.find(v => v.id === match.booking.venue.id)?.location || null
          },
          status,
          totalPrice: match.booking.totalAmount,
          pricePerTeam,
          pricePerPlayer,
          match: {
            id: match.id,
            title: match.title,
            description: match.description,
            homeTeam: match.homeTeam ? {
              id: match.homeTeam.id,
              name: match.homeTeam.name,
              captainName: match.homeTeam.captain.name,
              captainPhone: match.homeTeam.captain.phone,
              memberCount: match.homeTeam._count.members
            } : undefined,
            awayTeam: match.awayTeam ? {
              id: match.awayTeam.id,
              name: match.awayTeam.name,
              captainName: match.awayTeam.captain.name,
              captainPhone: match.awayTeam.captain.phone,
              memberCount: match.awayTeam._count.members
            } : undefined,
            lookingForOpponent: match.awayTeamId === null && match.status === 'OPEN',
            status: match.status,
            maxPlayers: match.maxPlayers,
            playersConfirmed: match.homeTeam?._count.members || 0,
            playersNeeded: match.awayTeamId === null ? match.maxPlayers : match.maxPlayers - (match.homeTeam?._count.members || 0),
            contact: match.homeTeam?.captain.phone,
            isVendorHosted
          },
          actions
        }

        timelineSlots.push(timelineMatch)
      }
    })

    // Add available slots (only for times without matches or conflicts)
    for (const venue of venues) {
      // Get vendor operating hours for this venue
      let startHour = 6  // Default start
      let endHour = 23   // Default end (11 PM)

      // Check if venue has location with operating hours
      if (venue.location && (venue.location as any).operatingHours) {
        const operatingHours = (venue.location as any).operatingHours
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const dayName = daysOfWeek[new Date(date).getDay()]
        const todayHours = operatingHours[dayName]

        if (todayHours && !todayHours.closed) {
          startHour = parseInt(todayHours.open.split(':')[0])
          endHour = parseInt(todayHours.close.split(':')[0])
        }
      }

      for (let hour = startHour; hour <= endHour - duration; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`
        const endHourSlot = hour + duration
        const endTime = `${endHourSlot.toString().padStart(2, '0')}:00`

        // Create DateTime objects for this slot
        const slotStart = new Date(date + 'T' + startTime + ':00.000Z')
        const slotEnd = new Date(date + 'T' + endTime + ':00.000Z')

        // Check if slot has overlapping match
        const overlappingMatch = matches.find(match =>
          match.booking &&
          match.booking.venueId === venue.id &&
          new Date(match.booking.startTime) < slotEnd &&
          new Date(match.booking.endTime) > slotStart
        )

        // Check if slot has overlapping conflict
        const overlappingConflict = conflicts.find(conflict =>
          conflict.venueId === venue.id &&
          conflict.startTime < slotEnd &&
          conflict.endTime > slotStart
        )

        // Only create slot if no overlap with matches or conflicts
        if (!overlappingMatch && !overlappingConflict) {
          const totalPrice = venue.pricePerHour * duration

          const slot: TimelineSlot = {
            id: `${venue.id}-${date}-${startTime}`,
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            venue: {
              id: venue.id,
              name: `${venue.vendor.name} ${venue.courtNumber}`,
              courtNumber: venue.courtNumber,
              pricePerHour: venue.pricePerHour,
              maxPlayers: venue.maxPlayers,
              sport: venue.sport,
              format: venue.format,
              vendor: venue.vendor,
              location: venue.location
            },
            status: 'available',
            totalPrice,
            actions: ['book_venue', 'create_match']
          }

          timelineSlots.push(slot)
        }
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
        vendorMatches: timelineSlots.filter(s => s.status === 'vendor_match').length,
        unavailable: timelineSlots.filter(s => s.status === 'unavailable').length,
        totalMatches: timelineSlots.filter(s => ['open_match', 'private_match', 'vendor_match'].includes(s.status)).length
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
