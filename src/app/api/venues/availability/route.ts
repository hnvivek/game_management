import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const venueId = searchParams.get('venueId') // Updated from turfId
    const date = searchParams.get('date')
    
    if (!venueId || !date) {
      return NextResponse.json(
        { error: 'venueId and date are required' },
        { status: 400 }
      )
    }

    // Convert date string to Date object
    const requestDate = new Date(date + 'T00:00:00.000Z')
    
    // Get all available slots for the venue on the given date
    const availabilities = await db.venueAvailability.findMany({
      where: {
        venueId,
        date: requestDate,
        isAvailable: true,
      },
      orderBy: { startTime: 'asc' },
      include: {
        venue: {
          include: {
            sport: true,
            format: true,
            vendor: true
          }
        },
      },
    })
    
    // Get existing bookings to mark unavailable slots (using enum)
    const bookings = await db.booking.findMany({
      where: {
        venueId,
        status: 'CONFIRMED', // Use BookingStatus enum
        startTime: {
          gte: requestDate,
          lt: new Date(requestDate.getTime() + 24 * 60 * 60 * 1000) // Next day
        }
      },
      orderBy: { startTime: 'asc' },
    })
    
    // Get conflicts
    const conflicts = await db.conflict.findMany({
      where: {
        venueId,
        status: 'active',
        startTime: {
          gte: requestDate,
          lt: new Date(requestDate.getTime() + 24 * 60 * 60 * 1000) // Next day
        }
      },
      orderBy: { startTime: 'asc' },
    })
    
    // Generate time slots from 6:00 AM to 11:00 PM
    const timeSlots = []
    for (let hour = 6; hour <= 22; hour++) {
      const startTimeStr = `${hour.toString().padStart(2, '0')}:00`
      const endTimeStr = `${(hour + 1).toString().padStart(2, '0')}:00`
      
      // Create DateTime objects for this slot
      const slotStart = new Date(date + 'T' + startTimeStr + ':00.000Z')
      const slotEnd = new Date(date + 'T' + endTimeStr + ':00.000Z')
      
      // Check if slot is explicitly marked as available in system
      let isAvailableInSystem = true
      if (availabilities.length > 0) {
        isAvailableInSystem = availabilities.some(
          (avail) => {
            const availStart = new Date(avail.startTime)
            return availStart.getHours() === hour && avail.isAvailable
          }
        )
      }
      
      // Check if slot has overlapping booking using DateTime comparison
      const hasBooking = bookings.some(
        (booking) => {
          // Two time ranges overlap if: start1 < end2 AND start2 < end1
          return booking.startTime < slotEnd && booking.endTime > slotStart
        }
      )
      
      // Check if slot has overlapping conflict using DateTime comparison
      const hasConflict = conflicts.some(
        (conflict) => {
          // Two time ranges overlap if: start1 < end2 AND start2 < end1
          return conflict.startTime < slotEnd && conflict.endTime > slotStart
        }
      )
      
      const isAvailable = isAvailableInSystem && !hasBooking && !hasConflict
      
      timeSlots.push({
        startTime: startTimeStr,
        endTime: endTimeStr,
        isAvailable,
        hasBooking,
        hasConflict,
        booking: hasBooking 
          ? bookings.find((b) => 
              b.startTime < slotEnd && b.endTime > slotStart
            )
          : null,
        conflict: hasConflict
          ? conflicts.find((c) => 
              c.startTime < slotEnd && c.endTime > slotStart
            )
          : null,
      })
    }
    
    return NextResponse.json({ timeSlots })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}