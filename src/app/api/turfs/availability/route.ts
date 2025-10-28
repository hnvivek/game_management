import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const turfId = searchParams.get('turfId')
    const date = searchParams.get('date')
    
    if (!turfId || !date) {
      return NextResponse.json(
        { error: 'turfId and date are required' },
        { status: 400 }
      )
    }
    
    // Get all available slots for the turf on the given date
    const availabilities = await db.turfAvailability.findMany({
      where: {
        turfId,
        date,
        isAvailable: true,
      },
      orderBy: { startTime: 'asc' },
      include: {
        turf: true,
      },
    })
    
    // Get existing bookings to mark unavailable slots
    const bookings = await db.booking.findMany({
      where: {
        turfId,
        date,
        status: 'confirmed',
      },
      orderBy: { startTime: 'asc' },
    })
    
    // Get conflicts
    const conflicts = await db.conflict.findMany({
      where: {
        turfId,
        date,
        status: 'active',
      },
      orderBy: { startTime: 'asc' },
    })
    
    // Generate time slots from 6:00 AM to 11:00 PM
    const timeSlots = []
    for (let hour = 6; hour <= 22; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`
      
      // Check if slot is marked as available in the system
      const isAvailableInSystem = availabilities.some(
        (avail) => avail.startTime === startTime
      )
      
      // Check if slot has overlapping booking
      const hasBooking = bookings.some(
        (booking) => {
          // Booking starts during this slot
          return (booking.startTime >= startTime && booking.startTime < endTime) ||
                 // Booking ends during this slot  
                 (booking.endTime > startTime && booking.endTime <= endTime) ||
                 // Booking covers the entire slot
                 (booking.startTime <= startTime && booking.endTime >= endTime)
        }
      )
      
      // Check if slot has overlapping conflict
      const hasConflict = conflicts.some(
        (conflict) => {
          // Conflict starts during this slot
          return (conflict.startTime >= startTime && conflict.startTime < endTime) ||
                 // Conflict ends during this slot
                 (conflict.endTime > startTime && conflict.endTime <= endTime) ||
                 // Conflict covers the entire slot
                 (conflict.startTime <= startTime && conflict.endTime >= endTime)
        }
      )
      
      const isAvailable = isAvailableInSystem && !hasBooking && !hasConflict
      
      timeSlots.push({
        startTime,
        endTime,
        isAvailable,
        hasBooking,
        hasConflict,
        booking: hasBooking 
          ? bookings.find((b) => 
              (b.startTime >= startTime && b.startTime < endTime) ||
              (b.endTime > startTime && b.endTime <= endTime) ||
              (b.startTime <= startTime && b.endTime >= endTime)
            )
          : null,
        conflict: hasConflict
          ? conflicts.find((c) => 
              (c.startTime >= startTime && c.startTime < endTime) ||
              (c.endTime > startTime && c.endTime <= endTime) ||
              (c.startTime <= startTime && c.endTime >= endTime)
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