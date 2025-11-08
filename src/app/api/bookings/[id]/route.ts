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
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
          }
        },
        court: {
          select: {
            id: true,
            name: true,
            sport: {
              select: {
                id: true,
                name: true,
                displayName: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
        court: booking.court,
        venue: booking.venue,
        user: booking.user,
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
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id
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

    // If changing time or court, check for conflicts
    if (validatedData.startTime || validatedData.endTime || validatedData.courtId) {
      const startTime = validatedData.startTime ? new Date(validatedData.startTime) : existingBooking.startTime
      const endTime = validatedData.endTime ? new Date(validatedData.endTime) : existingBooking.endTime
      const courtId = validatedData.courtId || existingBooking.courtId

      // Check for conflicting bookings
      const conflicts = await prisma.booking.findFirst({
        where: {
          id: { not: bookingId },
          courtId,
          status: {
            in: ['PENDING', 'CONFIRMED']
          },
          OR: [
            {
              startTime: { lt: endTime },
              endTime: { gt: startTime },
            }
          ]
        }
      })

      if (conflicts) {
        return NextResponse.json(
          { error: 'Time slot conflicts with existing booking' },
          { status: 409 }
        )
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

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
          }
        },
        court: {
          select: {
            id: true,
            name: true,
            sport: {
              select: {
                id: true,
                name: true,
                displayName: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
        court: updatedBooking.court,
        venue: updatedBooking.venue,
        user: updatedBooking.user,
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

