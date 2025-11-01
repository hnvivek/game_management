import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { addVendorFiltering } from '@/lib/subdomain'

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get list of bookings
 *     description: Retrieve a list of venue bookings with optional filtering by venue, customer, status, date range, and booking type
 *     tags:
 *       - Bookings
 *     parameters:
 *       - in: query
 *         name: venueId
 *         schema:
 *           type: string
 *         description: Filter by venue ID
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by booking status
 *       - in: query
 *         name: bookingType
 *         schema:
 *           type: string
 *         description: Filter by booking type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD format)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of results to return
 *     responses:
 *       200:
 *         description: List of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       500:
 *         description: Failed to fetch bookings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

    if (venueId) whereConditions.court = { venueId }
    if (customerId) whereConditions.userId = customerId
    if (status) whereConditions.status = status.toUpperCase()
    if (bookingType) whereConditions.type = bookingType.toUpperCase()

    // Date range filtering
    if (startDate || endDate) {
      whereConditions.startTime = {}
      if (startDate) whereConditions.startTime.gte = new Date(startDate)
      if (endDate) whereConditions.startTime.lte = new Date(endDate)
    }

    // Add automatic vendor filtering based on subdomain
    // Filter bookings by court vendor when on vendor subdomain
    await addVendorFiltering(request, whereConditions, 'court.venue.vendorId')

    const bookings = await db.booking.findMany({
      where: whereConditions,
      include: {
        court: {
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
                maxPlayers: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            paymentMethod: true,
            status: true,
            processedAt: true
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
      courtId,
      userId,
      sportId,
      startTime,
      endTime,
      duration,
      totalAmount,
      type = 'DIRECT',
      title,
      description,
      maxPlayers,
      notes,
      status = 'PENDING_PAYMENT',
    } = body

    // Validate required fields
    if (!courtId || !userId || !sportId || !startTime || !duration || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: courtId, userId, sportId, startTime, duration, totalAmount' },
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
    const isAvailable = await checkCourtAvailability(
      courtId,
      startDateTime,
      endDateTime
    )
    
    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Court is not available for the selected time slot' },
        { status: 409 }
      )
    }

    // Get or create user if it doesn't exist
    let user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    })

    if (!user) {
      // Create a default user for testing if the user doesn't exist
      try {
        user = await db.user.create({
          data: {
            id: userId,
            name: 'Test User',
            email: `user-${userId}@example.com`,
            phone: '+1234567890',
            role: 'CUSTOMER',
            isActive: true
          },
          select: { id: true, name: true, email: true }
        })
        console.log('Created default test user:', user.id)
      } catch (createError) {
        console.error('Failed to create user:', createError)
        return NextResponse.json(
          { error: 'Invalid user ID and failed to create default user' },
          { status: 400 }
        )
      }
    }

    // Get court details to validate
    const court = await db.court.findUnique({
      where: { id: courtId },
      select: { id: true, venueId: true }
    })

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    // Create booking with proper ISO DateTime strings
    const booking = await db.booking.create({
      data: {
        courtId,
        userId,
        sportId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        duration: durationHours,
        totalAmount,
        type: type?.toUpperCase(),
        status: status?.toUpperCase(),
        title,
        description,
        maxPlayers,
        notes,
      },
      include: {
        court: {
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
            },
            sport: true,
            format: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
    })
    
    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Error creating booking:', error)
    // Log the actual error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Booking error details:', errorMessage)

    return NextResponse.json(
      { error: 'Failed to create booking', details: errorMessage },
      { status: 500 }
    )
  }
}


async function checkCourtAvailability(
  courtId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    // Validate DateTime inputs
    if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error('Invalid DateTime objects provided to checkCourtAvailability')
    }

    // Check for existing bookings using DateTime overlap detection
    const overlappingBookings = await db.booking.findMany({
      where: {
        courtId,
        status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    })

    // Check for existing matches using DateTime overlap detection
    const overlappingMatches = await db.match.findMany({
      where: {
        courtId,
        status: 'CONFIRMED',
        AND: [
          { scheduledDate: { lt: endTime } },
          { scheduledDate: { gt: startTime } },
        ],
      },
    })

    return overlappingBookings.length === 0 &&
           overlappingMatches.length === 0
  } catch (error) {
    console.error('Error checking court availability:', error)
    return false
  }
}