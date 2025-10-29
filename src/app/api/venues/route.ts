import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') // Sport name (e.g., "soccer")
    const date = searchParams.get('date')
    const startTime = searchParams.get('startTime')
    const duration = searchParams.get('duration')
    const vendorId = searchParams.get('vendorId') // Filter by specific vendor
    const city = searchParams.get('city') // Filter by location
    const area = searchParams.get('area') // Filter by specific area
    
    // Build venue filter conditions
    const whereConditions: any = {
      isActive: true,
      vendor: { isActive: true }, // Only include active vendors
    }

    // Add vendor filter
    if (vendorId) {
      whereConditions.vendorId = vendorId
    }

    // Add sport filter (convert sport name to sportId)
    if (sport) {
      whereConditions.sport = {
        name: sport,
        isActive: true
      }
    }

    // Add location filters
    if (city || area) {
      whereConditions.location = {
        ...(city && { city }),
        ...(area && { area }),
        isActive: true
      }
    }
    
    let venues = await db.venue.findMany({
      where: whereConditions,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            primaryColor: true,
            secondaryColor: true
          }
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            area: true,
            latitude: true,
            longitude: true
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
    
    // If date and duration are provided, check availability
    if (date && duration) {
      const durationHours = parseInt(duration)
      
      venues = await Promise.all(
        venues.map(async (venue) => {
          let isAvailable = true
          
          // If specific start time is provided, check availability for that slot
          if (startTime) {
            const endTime = calculateEndTime(startTime, durationHours)
            isAvailable = await checkVenueAvailability(
              venue.id,
              date,
              startTime,
              endTime
            )
          } else {
            // If no specific time, check if there's at least one available slot for duration
            // This is a simplified check - we'll check availability during business hours
            const businessHours = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
            
            isAvailable = false // Default to false, only set to true if we find an available slot
            
            for (const checkTime of businessHours) {
              const endTime = calculateEndTime(checkTime, durationHours)
              const slotAvailable = await checkVenueAvailability(
                venue.id,
                date,
                checkTime,
                endTime
              )
              if (slotAvailable) {
                isAvailable = true
                break
              }
            }
          }
          
          return {
            ...venue,
            isAvailable,
            totalAmount: isAvailable ? venue.pricePerHour * durationHours : null,
          }
        })
      )
    }
    
    return NextResponse.json({ 
      venues,
      count: venues.length,
      filters: { sport, date, startTime, duration, vendorId, city, area }
    })
  } catch (error) {
    console.error('Error fetching venues:', error)
    return NextResponse.json(
      { error: 'Failed to fetch venues' },
      { status: 500 }
    )
  }
}

function calculateEndTime(startTime: string, durationHours: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const endHours = hours + durationHours
  return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

async function checkVenueAvailability(
  venueId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  try {
    // Convert date and times to DateTime objects for proper comparison
    const requestDate = new Date(date + 'T00:00:00.000Z')
    const requestStart = new Date(date + 'T' + startTime + ':00.000Z')
    const requestEnd = new Date(date + 'T' + endTime + ':00.000Z')
    
    // Check for existing bookings that overlap (using BookingStatus enum)
    const overlappingBookings = await db.booking.findMany({
      where: {
        venueId,
        status: 'CONFIRMED', // Use enum value
        AND: [
          { startTime: { lt: requestEnd } },
          { endTime: { gt: requestStart } },
        ],
      },
    })
    
    // Check for conflicts that overlap
    const overlappingConflicts = await db.conflict.findMany({
      where: {
        venueId,
        status: 'active',
        AND: [
          { startTime: { lt: requestEnd } },
          { endTime: { gt: requestStart } },
        ],
      },
    })
    
    // Check for unavailable time slots within the requested period
    const unavailableSlots = await db.venueAvailability.findMany({
      where: {
        venueId,
        date: requestDate,
        isAvailable: false,
        AND: [
          { startTime: { lt: requestEnd } },
          { endTime: { gt: requestStart } },
        ],
      },
    })
    
    return overlappingBookings.length === 0 && 
           overlappingConflicts.length === 0 && 
           unavailableSlots.length === 0
  } catch (error) {
    console.error('Error checking venue availability:', error)
    return false
  }
}