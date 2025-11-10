import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for booking update
const bookingUpdateSchema = z.object({
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  totalAmount: z.number().min(0).optional(),
  courtId: z.string().optional(),
  notes: z.string().max(500).optional(),
  formatId: z.string().nullable().optional(),
  slotNumber: z.number().int().min(1).nullable().optional(),
}).refine((data) => {
  // If both startTime and endTime are provided, ensure endTime is after startTime
  if (data.startTime && data.endTime) {
    return new Date(data.endTime) > new Date(data.startTime)
  }
  return true
}, {
  message: "End time must be after start time",
  path: ["endTime"],
})

// GET /api/bookings/[id] - Get booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        totalAmount: true,
        notes: true,
        formatId: true,
        slotNumber: true,
        court: {
          select: {
            id: true,
            name: true,
            venue: {
              select: {
                id: true,
                name: true,
              }
            },
            sport: {
              select: {
                id: true,
                name: true,
                displayName: true,
              }
            }
          }
        },
        format: {
          select: {
            id: true,
            name: true,
            displayName: true,
            playersPerTeam: true,
            maxTotalPlayers: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
            createdAt: true,
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        status: booking.status,
        totalAmount: Number(booking.totalAmount),
        notes: booking.notes,
        formatId: booking.formatId,
        slotNumber: booking.slotNumber,
        format: booking.format,
        court: booking.court,
        venue: booking.court.venue, // Venue comes through court relation
        user: booking.user,
        payments: booking.payments,
      }
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}

// PATCH /api/bookings/[id] - Update booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params
    const body = await request.json()
    
    // Validate input
    const validatedData = bookingUpdateSchema.parse(body)

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        court: {
          select: {
            id: true,
            venueId: true,
          }
        }
      }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // If changing time, court, or format, check for conflicts
    if (validatedData.startTime || validatedData.endTime || validatedData.courtId || validatedData.formatId) {
      const startTime = validatedData.startTime ? new Date(validatedData.startTime) : existingBooking.startTime
      const endTime = validatedData.endTime ? new Date(validatedData.endTime) : existingBooking.endTime
      const courtId = validatedData.courtId || existingBooking.courtId
      const formatId = validatedData.formatId !== undefined ? validatedData.formatId : existingBooking.formatId

      // If formatId is provided/changed, check format-specific availability
      if (formatId) {
        // Get court with supported formats
        const court = await prisma.court.findUnique({
          where: { id: courtId },
          include: {
            supportedFormats: {
              where: {
                formatId,
                isActive: true,
              },
            },
          },
        })

        if (!court || court.supportedFormats.length === 0) {
          return NextResponse.json(
            { error: 'The requested format is not supported by this court' },
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
            id: { not: bookingId },
            courtId,
            status: {
              in: ['PENDING', 'CONFIRMED'],
            },
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gt: startTime } },
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

        // Count bookings for the same format
        const sameFormatBookings = allOverlappingBookings.filter(
          (b) => b.formatId === formatId
        )

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

        // Find the court format for the requested format
        const courtFormat = allCourtFormats.find(cf => cf.formatId === formatId)
        if (!courtFormat) {
          return NextResponse.json(
            { error: 'Format configuration not found for this court' },
            { status: 400 }
          )
        }

        // Calculate total slots = max(maxSlots) of all formats
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
        const conflicts = await prisma.booking.findFirst({
          where: {
            id: { not: bookingId },
            courtId,
            status: {
              in: ['PENDING', 'CONFIRMED'],
            },
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gt: startTime } },
            ],
          },
        })

        if (conflicts) {
          return NextResponse.json(
            { error: 'Time slot conflicts with existing booking' },
            { status: 409 }
          )
        }
      }
    }

    // Update booking
    const updateData: any = {}
    
    if (validatedData.startTime) {
      updateData.startTime = new Date(validatedData.startTime)
    }
    if (validatedData.endTime) {
      updateData.endTime = new Date(validatedData.endTime)
    }
    if (validatedData.status) {
      updateData.status = validatedData.status
    }
    if (validatedData.totalAmount !== undefined) {
      updateData.totalAmount = validatedData.totalAmount
    }
    if (validatedData.courtId) {
      updateData.courtId = validatedData.courtId
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes || null
    }
    if (validatedData.formatId !== undefined) {
      updateData.formatId = validatedData.formatId
    }
    if (validatedData.slotNumber !== undefined) {
      updateData.slotNumber = validatedData.slotNumber
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        totalAmount: true,
        notes: true,
        formatId: true,
        slotNumber: true,
        court: {
          select: {
            id: true,
            name: true,
            venue: {
              select: {
                id: true,
                name: true,
              }
            },
            sport: {
              select: {
                id: true,
                name: true,
                displayName: true,
              }
            }
          }
        },
        format: {
          select: {
            id: true,
            name: true,
            displayName: true,
            playersPerTeam: true,
            maxTotalPlayers: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
            createdAt: true,
          }
        }
      }
    })

    return NextResponse.json({
      booking: {
        id: updatedBooking.id,
        startTime: updatedBooking.startTime.toISOString(),
        endTime: updatedBooking.endTime.toISOString(),
        status: updatedBooking.status,
        totalAmount: Number(updatedBooking.totalAmount),
        notes: updatedBooking.notes,
        formatId: updatedBooking.formatId,
        slotNumber: updatedBooking.slotNumber,
        format: updatedBooking.format,
        court: updatedBooking.court,
        venue: updatedBooking.court.venue, // Venue comes through court relation
        user: updatedBooking.user,
        payments: updatedBooking.payments,
      },
      message: 'Booking updated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}

