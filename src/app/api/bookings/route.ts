import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      venueId,
      startTime,
      endTime,
      duration,
      totalAmount,
      bookingType = 'MATCH',
      customerName,
      customerPhone,
      customerEmail,
      notes,
      status = 'CONFIRMED',
    } = body

    // Validate required fields
    if (!venueId || !startTime || !duration || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: venueId, startTime, duration, totalAmount' },
        { status: 400 }
      )
    }

    // Validate and parse DateTime fields
    const startDateTime = new Date(startTime)
    if (isNaN(startDateTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid startTime format. Use ISO DateTime string (e.g., 2025-01-01T10:00:00.000Z)' },
        { status: 400 }
      )
    }

    const durationHours = parseInt(duration)
    if (durationHours <= 0) {
      return NextResponse.json(
        { error: 'Duration must be positive' },
        { status: 400 }
      )
    }

    // Calculate end time if not provided
    let endDateTime
    if (endTime) {
      endDateTime = new Date(endTime)
      if (isNaN(endDateTime.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endTime format. Use ISO DateTime string (e.g., 2025-01-01T12:00:00.000Z)' },
          { status: 400 }
        )
      }
    } else {
      endDateTime = new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000)
    }
    
    // Check availability
    const isAvailable = await checkVenueAvailability(
      venueId,
      startDateTime,
      endDateTime
    )
    
    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Venue is not available for the selected time slot' },
        { status: 409 }
      )
    }
    
    // Get venue details to include vendor information
    const venue = await db.venue.findUnique({
      where: { id: venueId },
      select: { vendorId: true }
    })

    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }

    // Create booking with proper DateTime objects
    const booking = await db.booking.create({
      data: {
        venueId,
        vendorId: venue.vendorId,
        startTime: startDateTime,
        endTime: endDateTime,
        duration: durationHours,
        totalAmount,
        bookingType: bookingType?.toUpperCase(),
        status: status?.toUpperCase(),
        customerName,
        customerPhone,
        customerEmail,
        notes,
      },
      include: {
        venue: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
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


async function checkVenueAvailability(
  venueId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    // Validate DateTime inputs
    if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error('Invalid DateTime objects provided to checkVenueAvailability')
    }

    // Check for existing bookings using DateTime overlap detection
    const overlappingBookings = await db.booking.findMany({
      where: {
        venueId,
        status: 'CONFIRMED',
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
        status: 'active',
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    })

    return overlappingBookings.length === 0 &&
           overlappingConflicts.length === 0
  } catch (error) {
    console.error('Error checking availability in booking:', error)
    return false
  }
}