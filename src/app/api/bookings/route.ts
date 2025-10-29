import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { addVendorFiltering } from '@/lib/subdomain'

// GET /api/bookings - List bookings with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const venueId = searchParams.get('venueId')
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    const bookingType = searchParams.get('bookingType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build filter conditions with automatic subdomain filtering
    const whereConditions: any = {}

    if (venueId) whereConditions.venueId = venueId
    if (customerId) whereConditions.customerId = customerId
    if (status) whereConditions.status = status.toUpperCase()
    if (bookingType) whereConditions.bookingType = bookingType.toUpperCase()

    // Date range filtering
    if (startDate || endDate) {
      whereConditions.startTime = {}
      if (startDate) whereConditions.startTime.gte = new Date(startDate)
      if (endDate) whereConditions.startTime.lte = new Date(endDate)
    }

    // Add automatic vendor filtering based on subdomain
    // Filter bookings by venue vendor when on vendor subdomain
    await addVendorFiltering(request, whereConditions, 'venue.vendorId')

    const bookings = await db.booking.findMany({
      where: whereConditions,
      include: {
        venue: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                slug: true,
                primaryColor: true,
                secondaryColor: true
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
                maxPlayers: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        match: {
          select: {
            id: true,
            homeTeam: {
              select: {
                id: true,
                name: true
              }
            },
            awayTeam: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            method: true,
            status: true,
            paidAt: true
          }
        }
      },
      orderBy: [
        { startTime: 'desc' }
      ],
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await db.booking.count({
      where: whereConditions
    })

    return NextResponse.json({
      bookings,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      filters: { venueId, customerId, status, bookingType, startDate, endDate }
    })

  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

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