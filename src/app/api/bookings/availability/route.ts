import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/bookings/availability - Check available time slots for booking
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const venueId = searchParams.get('venueId')
    const courtId = searchParams.get('courtId')
    const date = searchParams.get('date')

    if (!venueId || !courtId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: venueId, courtId, date' },
        { status: 400 }
      )
    }

    // Validate date format
    const bookingDate = new Date(date)
    if (isNaN(bookingDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Get venue operating hours
    const venue = await prisma.venue.findFirst({
      where: { 
        id: venueId,
        deletedAt: null // Exclude soft-deleted venues
      },
      include: {
        operatingHours: {
          where: { isOpen: true },
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    })

    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    }

    // Get court details
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      select: {
        id: true,
        pricePerHour: true,
        maxPlayers: true,
      },
    })

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    // Get existing bookings for the date
    const existingBookings = await prisma.booking.findMany({
      where: {
        courtId,
        date: bookingDate,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        duration: true,
      },
    })

    // Generate time slots based on operating hours
    const dayOfWeek = bookingDate.getDay()
    const operatingHours = venue.operatingHours.find(h => h.dayOfWeek === dayOfWeek)

    if (!operatingHours) {
      return NextResponse.json({
        slots: [],
        message: 'Venue is closed on this day',
      })
    }

    const openHour = parseInt(operatingHours.openingTime.split(':')[0])
    const closeHour = parseInt(operatingHours.closingTime.split(':')[0])

    const slots = []

    for (let hour = openHour; hour < closeHour; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`

      // Check if this slot conflicts with existing bookings
      const isBooked = existingBookings.some(booking => {
        const bookingStart = parseInt(booking.startTime.split(':')[0])
        const bookingEnd = parseInt(booking.endTime.split(':')[0])

        // Check if the current slot overlaps with the booking time
        return (hour >= bookingStart && hour < bookingEnd)
      })

      slots.push({
        time: timeSlot,
        endTime,
        available: !isBooked,
        courtId,
        price: court.pricePerHour,
        maxPlayers: court.maxPlayers,
      })
    }

    return NextResponse.json({
      slots,
      venueInfo: {
        name: venue.name,
        operatingHours: `${operatingHours.openingTime} - ${operatingHours.closingTime}`,
      },
      courtInfo: {
        pricePerHour: court.pricePerHour,
        maxPlayers: court.maxPlayers,
      },
      existingBookings: existingBookings.map(booking => ({
        startTime: booking.startTime,
        endTime: booking.endTime,
      })),
    })
  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}