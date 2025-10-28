import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    const date = searchParams.get('date')
    const startTime = searchParams.get('startTime')
    const duration = searchParams.get('duration')
    
    let turfs = await db.turf.findMany({
      where: {
        isActive: true,
        ...(sport && { sport }),
      },
      orderBy: [
        { sport: 'asc' },
        { size: 'desc' },
        { courtNumber: 'asc' },
      ],
    })
    
    // If date and time are provided, check availability
    if (date && startTime && duration) {
      const durationHours = parseInt(duration)
      const endTime = calculateEndTime(startTime, durationHours)
      
      turfs = await Promise.all(
        turfs.map(async (turf) => {
          const isAvailable = await checkTurfAvailability(
            turf.id,
            date,
            startTime,
            endTime
          )
          
          return {
            ...turf,
            isAvailable,
            totalAmount: isAvailable ? turf.pricePerHour * durationHours : null,
          }
        })
      )
    }
    
    return NextResponse.json({ turfs })
  } catch (error) {
    console.error('Error fetching turfs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch turfs' },
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
  try {
    // Check for existing bookings that overlap with the requested time
    const bookings = await db.booking.findMany({
      where: {
        turfId,
        date,
        status: 'confirmed',
        OR: [
          // Booking starts during requested time
          {
            AND: [
              { startTime: { gte: startTime } },
              { startTime: { lt: endTime } },
            ],
          },
          // Booking ends during requested time
          {
            AND: [
              { endTime: { gt: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
          // Booking completely covers requested time
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gte: endTime } },
            ],
          },
        ],
      },
    })
    
    // Check for conflicts that overlap with the requested time
    const conflicts = await db.conflict.findMany({
      where: {
        turfId,
        date,
        status: 'active',
        OR: [
          // Conflict starts during requested time
          {
            AND: [
              { startTime: { gte: startTime } },
              { startTime: { lt: endTime } },
            ],
          },
          // Conflict ends during requested time
          {
            AND: [
              { endTime: { gt: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
          // Conflict completely covers requested time
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gte: endTime } },
            ],
          },
        ],
      },
    })
    
    // Check if all time slots are marked as available
    const availabilities = await db.turfAvailability.findMany({
      where: {
        turfId,
        date,
        startTime: { gte: startTime },
        endTime: { lte: endTime },
        isAvailable: false,
      },
    })
    
    return bookings.length === 0 && conflicts.length === 0 && availabilities.length === 0
  } catch (error) {
    console.error('Error checking turf availability:', error)
    return false
  }
}