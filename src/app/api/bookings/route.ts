import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      turfId,
      date,
      startTime,
      duration,
      totalAmount,
      bookingType = 'match',
    } = body
    
    if (!turfId || !date || !startTime || !duration || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const durationHours = parseInt(duration)
    const endTime = calculateEndTime(startTime, durationHours)
    
    // Check availability
    const isAvailable = await checkTurfAvailability(
      turfId,
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
    
    // Create booking
    const booking = await db.booking.create({
      data: {
        turfId,
        date,
        startTime,
        endTime,
        duration: durationHours,
        totalAmount,
        bookingType,
        status: 'confirmed',
      },
      include: {
        turf: true,
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

async function checkTurfAvailability(
  turfId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  // Check for existing bookings
  const bookings = await db.booking.findMany({
    where: {
      turfId,
      date,
      status: 'confirmed',
      OR: [
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } },
          ],
        },
      ],
    },
  })
  
  // Check for conflicts
  const conflicts = await db.conflict.findMany({
    where: {
      turfId,
      date,
      status: 'active',
      OR: [
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } },
          ],
        },
      ],
    },
  })
  
  return bookings.length === 0 && conflicts.length === 0
}