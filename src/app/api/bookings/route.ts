import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      venueId,
      date,
      startTime,
      duration,
      totalAmount,
      bookingType = 'match',
    } = body
    
    if (!venueId || !date || !startTime || !duration || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const durationHours = parseInt(duration)
    const endTime = calculateEndTime(startTime, durationHours)
    
    // Check availability
    const isAvailable = await checkVenueAvailability(
      venueId,
      date,
      startTime,
      endTime
    )
    
    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Turf is not available for the selected time slot' },
        { status: 409 }
      )
    }
    
    // Get venue details to include vendor information
    const venue = await db.venue.findUnique({
      where: { id: venueId },
      select: { vendorId: true }
    })

    if (!venue) {
      return NextResponse.json({ error: 'Turf not found' }, { status: 404 })
    }

    // Create booking
    const booking = await db.booking.create({
      data: {
        venueId,
        vendorId: venue.vendorId,
        date,
        startTime,
        endTime,
        duration: durationHours,
        totalAmount,
        bookingType,
        status: 'confirmed',
      },
      include: {
        venue: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                location: true,
                slug: true
              }
            }
          }
        }
      },
    })
    
    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
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
    // Check for existing bookings using simplified overlap detection
    const overlappingBookings = await db.booking.findMany({
      where: {
        venueId,
        date,
        status: 'confirmed',
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    })
    
    // Check for conflicts using simplified overlap detection
    const overlappingConflicts = await db.conflict.findMany({
      where: {
        venueId,
        date,
        status: 'active',
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    })
    
    // Check for unavailable time slots
    const unavailableSlots = await db.venueAvailability.findMany({
      where: {
        venueId,
        date,
        isAvailable: false,
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    })
    
    return overlappingBookings.length === 0 && 
           overlappingConflicts.length === 0 && 
           unavailableSlots.length === 0
  } catch (error) {
    console.error('Error checking availability in booking:', error)
    return false
  }
}