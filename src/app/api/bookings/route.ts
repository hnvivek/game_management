import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

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
// GET /api/bookings - Get user bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const where: any = { userId }
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    const skip = (page - 1) * limit

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              vendor: {
                select: {
                  name: true,
                  slug: true,
                  logoUrl: true,
                },
              },
            },
          },
          court: {
            select: {
              id: true,
              name: true,
              sport: {
                select: {
                  displayName: true,
                  icon: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ])

    const transformedBookings = bookings.map(booking => ({
      id: booking.id,
      venue: booking.venue,
      court: booking.court,
      date: booking.date.toISOString().split('T')[0],
      startTime: booking.startTime,
      endTime: booking.endTime,
      duration: booking.duration,
      totalPrice: booking.totalPrice,
      status: booking.status,
      playerCount: booking.playerCount,
      notes: booking.notes,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }))

    return NextResponse.json({
      bookings: transformedBookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

// Validation schema for booking creation
const bookingSchema = z.object({
  venueId: z.string(),
  courtId: z.string(),
  date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Invalid time format. Use HH:MM",
  }),
  duration: z.number().int().min(30).max(480).multipleOf(30),
  playerCount: z.number().int().min(1).max(50).optional(),
  notes: z.string().max(500).optional(),
  formatId: z.string().nullable().optional(),
  slotNumber: z.number().int().min(1).nullable().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = bookingSchema.parse(body)

    const {
      venueId,
      courtId,
      date,
      time,
      duration,
      playerCount,
      notes,
      formatId,
      slotNumber,
    } = validatedData

    // Parse date and time
    const bookingDate = new Date(date)
    const [hours, minutes] = time.split(':').map(Number)

    // Calculate start and end times
    const startTime = time
    const endHours = hours + Math.floor(duration / 60)
    const endMinutes = minutes + (duration % 60)
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`

    // Check if court exists and get supported formats
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            vendorId: true,
          },
        },
        sport: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        supportedFormats: {
          where: {
            isActive: true,
          },
          include: {
            format: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    })

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    if (court.venueId !== venueId) {
      return NextResponse.json({ error: 'Court does not belong to this venue' }, { status: 400 })
    }

    // If formatId is provided, validate it's supported by the court
    if (formatId) {
      const formatSupported = court.supportedFormats.some(
        (cf) => cf.formatId === formatId && cf.isActive
      )
      if (!formatSupported) {
        return NextResponse.json(
          { error: 'The requested format is not supported by this court' },
          { status: 400 }
        )
      }
    }

    // Calculate start and end DateTime objects for proper comparison
    const startDateTime = new Date(`${date}T${startTime}:00.000Z`)
    const endDateTime = new Date(`${date}T${endTime}:00.000Z`)

    // Check availability based on format
    if (formatId) {
      // Get the court format configuration and format details
      const courtFormat = court.supportedFormats.find((cf) => cf.formatId === formatId)
      if (!courtFormat) {
        return NextResponse.json(
          { error: 'Format configuration not found for this court' },
          { status: 400 }
        )
      }

      // Get format details to determine size (for conflict checking)
      const formatDetails = await prisma.formatType.findUnique({
        where: { id: formatId },
        select: {
          id: true,
          playersPerTeam: true,
          maxTotalPlayers: true,
        },
      })

      if (!formatDetails) {
        return NextResponse.json(
          { error: 'Format not found' },
          { status: 404 }
        )
      }

      // Get all overlapping bookings (regardless of format) to check conflicts
      const allOverlappingBookings = await prisma.booking.findMany({
        where: {
          courtId,
          date: bookingDate,
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
          AND: [
            { startTime: { lt: endDateTime } },
            { endTime: { gt: startDateTime } },
          ],
        },
        include: {
          format: {
            select: {
              id: true,
              playersPerTeam: true,
              maxTotalPlayers: true,
            },
          },
        },
      })

      // Get all supported formats for this court to calculate slot allocation
      const allCourtFormats = await prisma.courtFormat.findMany({
        where: {
          courtId,
          isActive: true,
        },
        include: {
          format: {
            select: {
              id: true,
              playersPerTeam: true,
              maxTotalPlayers: true,
            },
          },
        },
      })

      // Calculate total slots = max(maxSlots) of all formats (or use the largest maxSlots)
      const totalSlots = Math.max(...allCourtFormats.map(cf => cf.maxSlots), 1)

      // Calculate slots per instance for each format: slotsPerInstance = totalSlots / maxSlots(format)
      const getSlotsPerInstance = (formatMaxSlots: number) => {
        return totalSlots / formatMaxSlots
      }

      const requestedSlotsPerInstance = getSlotsPerInstance(courtFormat.maxSlots)

      // Calculate slots used by existing bookings
      let slotsUsed = 0
      let hasSmallerFormat = false
      let hasLargerFormat = false
      const requestedFormatSize = formatDetails.maxTotalPlayers || formatDetails.playersPerTeam * 2

      for (const existingBooking of allOverlappingBookings) {
        if (!existingBooking.format) continue

        // Find the court format for this booking's format
        const existingCourtFormat = allCourtFormats.find(cf => cf.formatId === existingBooking.formatId)
        if (!existingCourtFormat) continue

        const existingSlotsPerInstance = getSlotsPerInstance(existingCourtFormat.maxSlots)
        slotsUsed += existingSlotsPerInstance

        // Check for mutual exclusion based on format size
        const existingFormatSize = existingBooking.format.maxTotalPlayers || 
          existingBooking.format.playersPerTeam * 2

        if (existingFormatSize < requestedFormatSize) {
          // Smaller format exists - will block larger format
          hasSmallerFormat = true
        }
        if (existingFormatSize > requestedFormatSize) {
          // Larger format exists - will block smaller format
          hasLargerFormat = true
        }
      }

      // Mutual exclusion checks
      if (hasSmallerFormat) {
        return NextResponse.json(
          { 
            error: `This time slot is blocked by a smaller format booking. Smaller formats block larger formats when court is divided.`,
          },
          { status: 409 }
        )
      }

      if (hasLargerFormat) {
        return NextResponse.json(
          { 
            error: `This time slot is blocked by a larger format booking. Larger formats block smaller formats when full court is used.`,
          },
          { status: 409 }
        )
      }

      // Check if enough slots are available
      const remainingSlots = totalSlots - slotsUsed
      if (remainingSlots < requestedSlotsPerInstance) {
        return NextResponse.json(
          { 
            error: `Not enough slots available. Required: ${requestedSlotsPerInstance}, Available: ${remainingSlots}`,
            requiredSlots: requestedSlotsPerInstance,
            availableSlots: remainingSlots,
            totalSlots,
          },
          { status: 409 }
        )
      }
    } else {
      // If no format specified, check for any overlapping bookings (backward compatibility)
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          courtId,
          date: bookingDate,
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
          AND: [
            { startTime: { lt: endDateTime } },
            { endTime: { gt: startDateTime } },
          ],
        },
      })

      if (conflictingBooking) {
        return NextResponse.json(
          { error: 'This time slot is already booked' },
          { status: 409 }
        )
      }
    }

    // Get current user ID (in a real app, this would come from authentication)
    // For now, we'll use a placeholder user ID or create a test user
    let userId = 'test-user-id'

    // Create a test user if it doesn't exist
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: userId,
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890',
          role: 'CUSTOMER',
          isActive: true,
        }
      })
    }

    // Calculate total price
    const totalPrice = (court.pricePerHour / 60) * duration

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        venueId,
        courtId,
        date: bookingDate,
        startTime,
        endTime,
        duration,
        totalPrice,
        status: 'PENDING',
        playerCount: playerCount || 1,
        notes: notes || null,
        formatId: formatId || null,
        slotNumber: slotNumber || null,
        paymentStatus: 'PENDING',
        paymentMethod: 'ONLINE',
        // Auto-confirm for now (in real app, this might require vendor approval)
        confirmedAt: new Date(),
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        court: {
          select: {
            id: true,
            name: true,
            sport: {
              select: {
                displayName: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json({
      booking: {
        id: booking.id,
        venue: booking.venue,
        court: booking.court,
        date: booking.date.toISOString().split('T')[0],
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: booking.duration,
        totalPrice: booking.totalPrice,
        status: booking.status,
        playerCount: booking.playerCount,
        notes: booking.notes,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
      },
      message: 'Booking created successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}


