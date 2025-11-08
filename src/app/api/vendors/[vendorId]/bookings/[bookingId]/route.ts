import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withVendorOwnershipAuth, ApiResponse } from '@/lib/auth/api-auth';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema for updating booking status
const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
  notes: z.string().optional(),
  cancellationReason: z.string().optional(),
  refundAmount: z.number().optional(),
  refundReason: z.string().optional()
});

// GET /api/vendors/[vendorId]/bookings/[bookingId] - Get booking details
export const GET = withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  try {
    const { vendorId, bookingId } = params;

    if (!bookingId) {
      return ApiResponse.error('Booking ID is required', 'MISSING_BOOKING_ID', 400);
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        venue: { 
          vendorId,
          deletedAt: null // Exclude soft-deleted venues
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            countryCode: true,
            timezone: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
            description: true,
            address: true,
            city: true,
            postalCode: true,
            phone: true,
            email: true,
            website: true,
            latitude: true,
            longitude: true,
            timezone: true,
            countryCode: true,
            currencyCode: true
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
                description: true,
                duration: true,
                teamSize: true
              }
            }
          }
        },
        payments: {
          include: {
            _count: {
              select: {
                refunds: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            payments: true
          }
        }
      }
    });

    if (!booking) {
      return ApiResponse.notFound('Booking');
    }

    // Get additional related data
    const [customerHistory, venueBookings, similarBookings] = await Promise.all([
      // Customer's booking history with this vendor
      prisma.booking.findMany({
        where: {
          userId: booking.userId,
          venue: { vendorId },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        select: {
          id: true,
          startTime: true,
          status: true,
          totalAmount: true,
          venue: {
            select: {
              name: true
            }
          }
        },
        orderBy: { startTime: 'desc' },
        take: 5
      }),

      // Other bookings at the same venue around the same time
      prisma.booking.findMany({
        where: {
          venueId: booking.venueId,
          id: { not: bookingId },
          startTime: {
            gte: new Date(booking.startTime.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
            lte: new Date(booking.startTime.getTime() + 2 * 60 * 60 * 1000)  // 2 hours after
          }
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          status: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { startTime: 'asc' },
        take: 10
      }),

      // Similar bookings (same sport, similar time)
      prisma.booking.findMany({
        where: {
          court: {
            sportId: booking.court.sport.id
          },
          id: { not: bookingId },
          startTime: {
            gte: new Date(booking.startTime.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week before
            lte: new Date(booking.startTime.getTime() + 7 * 24 * 60 * 60 * 1000)  // 1 week after
          },
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        select: {
          id: true,
          startTime: true,
          status: true,
          totalAmount: true,
          venue: {
            select: {
              name: true
            }
          }
        },
        orderBy: { startTime: 'desc' },
        take: 5
      })
    ]);

    // Calculate payment summary
    const totalPaid = booking.payments
      .filter(payment => payment.status === 'PAID')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    const totalRefunded = booking.payments
      .flatMap(payment => payment.refunds || [])
      .reduce((sum, refund) => sum + Number(refund.amount), 0);

    const paymentSummary = {
      totalAmount: Number(booking.totalAmount),
      totalPaid,
      totalRefunded,
      balanceDue: Number(booking.totalAmount) - totalPaid + totalRefunded,
      paymentStatus: totalPaid >= Number(booking.totalAmount) ? 'PAID' :
                     totalPaid > 0 ? 'PARTIALLY_PAID' : 'PENDING',
      paymentCount: booking._count.payments
    };

    // Transform the response
    const transformedBooking = {
      ...booking,
      paymentSummary,
      customerHistory,
      conflictingBookings: venueBookings.filter(b =>
        (b.startTime < booking.endTime && new Date(b.startTime.getTime() + (booking.endTime.getTime() - booking.startTime.getTime())) > booking.startTime)
      ),
      similarBookings,
      payments: booking.payments.map(payment => ({
        ...payment,
        refunds: undefined // Remove refunds from individual payment objects
      })),
      _count: undefined // Remove _count from final response
    };

    return ApiResponse.success(transformedBooking);

  } catch (error) {
    console.error('Error fetching booking details:', error);
    return ApiResponse.error('Failed to fetch booking details', 'BOOKING_ERROR', 500);
  }
});

// PUT /api/vendors/[vendorId]/bookings/[bookingId] - Update booking
export const PUT = withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  try {
    const { vendorId, bookingId } = params;
    const body = await request.json();
    const updates = updateBookingSchema.parse(body);

    if (!bookingId) {
      return ApiResponse.error('Booking ID is required', 'MISSING_BOOKING_ID', 400);
    }

    // Check if booking exists and belongs to this vendor
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        venue: { 
          vendorId,
          deletedAt: null // Exclude soft-deleted venues
        }
      },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        userId: true,
        startTime: true
      }
    });

    if (!existingBooking) {
      return ApiResponse.notFound('Booking');
    }

    // Validate status transition
    if (!isValidStatusTransition(existingBooking.status, updates.status)) {
      return ApiResponse.error(
        `Invalid status transition from ${existingBooking.status} to ${updates.status}`,
        'INVALID_STATUS_TRANSITION',
        400
      );
    }

    // Handle refunds if cancellation
    if (updates.status === 'CANCELLED' && updates.refundAmount && updates.refundAmount > 0) {
      if (updates.refundAmount > Number(existingBooking.totalAmount)) {
        return ApiResponse.error('Refund amount cannot exceed total booking amount', 'INVALID_REFUND_AMOUNT', 400);
      }

      // Create refund record (simplified - you might want to integrate with payment processor)
      await prisma.$transaction(async (tx) => {
        // Update booking
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: updates.status,
            notes: updates.notes,
            cancellationReason: updates.cancellationReason
          }
        });

        // Create refund through payment record
        const existingPayment = await tx.payment.findFirst({
          where: {
            bookingId,
            status: 'PAID'
          }
        });

        if (existingPayment) {
          await tx.refund.create({
            data: {
              paymentId: existingPayment.id,
              amount: updates.refundAmount,
              reason: updates.refundReason || 'Booking cancellation',
              status: 'PROCESSING',
              processedBy: user.id
            }
          });
        }
      });

      return ApiResponse.success({
        id: bookingId,
        status: updates.status,
        refundAmount: updates.refundAmount,
        message: 'Booking cancelled and refund initiated'
      });
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: updates.status,
        notes: updates.notes,
        cancellationReason: updates.cancellationReason
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true
          }
        },
        court: {
          select: {
            id: true,
            name: true,
            sport: {
              select: {
                name: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    return ApiResponse.success(updatedBooking, {
      message: `Booking status updated to ${updates.status}`
    });

  } catch (error) {
    console.error('Error updating booking:', error);

    if (error instanceof z.ZodError) {
      return ApiResponse.error('Invalid update data', 'INVALID_UPDATE_DATA', 400);
    }

    return ApiResponse.error('Failed to update booking', 'BOOKING_UPDATE_ERROR', 500);
  }
});

// POST /api/vendors/[vendorId]/bookings/[bookingId]/confirm - Confirm booking
export async function POST(request: NextRequest, { user, params }: any) {
  try {
    return withVendorOwnershipAuth(async (req: NextRequest, context: { user: any }) => {
      const { vendorId, bookingId } = params;
      const body = await req.json();
      const { notes } = body;

      if (!bookingId) {
        return ApiResponse.error('Booking ID is required', 'MISSING_BOOKING_ID', 400);
      }

      // Check if booking exists and belongs to this vendor
      const existingBooking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          venue: { vendorId }
        },
        select: { id: true, status: true }
      });

      if (!existingBooking) {
        return ApiResponse.notFound('Booking');
      }

      if (existingBooking.status !== 'PENDING') {
        return ApiResponse.error('Only pending bookings can be confirmed', 'INVALID_BOOKING_STATUS', 400);
      }

      // Confirm booking
      const confirmedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
          notes: notes || undefined
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          venue: {
            select: {
              name: true
            }
          }
        }
      });

      return ApiResponse.success(confirmedBooking, {
        message: 'Booking confirmed successfully'
      });

    })(request, { user });
  } catch (error) {
    console.error('Error confirming booking:', error);
    return ApiResponse.error('Failed to confirm booking', 'BOOKING_CONFIRM_ERROR', 500);
  }
}

// POST /api/vendors/[vendorId]/bookings/[bookingId]/cancel - Cancel booking
export async function CANCEL(request: NextRequest, { user, params }: any) {
  try {
    return withVendorOwnershipAuth(async (req: NextRequest, context: { user: any }) => {
      const { vendorId, bookingId } = params;
      const body = await req.json();
      const { reason, refundAmount, refundReason } = body;

      if (!bookingId) {
        return ApiResponse.error('Booking ID is required', 'MISSING_BOOKING_ID', 400);
      }

      if (!reason) {
        return ApiResponse.error('Cancellation reason is required', 'MISSING_CANCELLATION_REASON', 400);
      }

      // Check if booking exists and belongs to this vendor
      const existingBooking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          venue: { vendorId }
        },
        select: {
          id: true,
          status: true,
          totalAmount: true
        }
      });

      if (!existingBooking) {
        return ApiResponse.notFound('Booking');
      }

      if (!['PENDING', 'CONFIRMED'].includes(existingBooking.status)) {
        return ApiResponse.error('Only pending or confirmed bookings can be cancelled', 'INVALID_BOOKING_STATUS', 400);
      }

      // Cancel booking
      const cancelledBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          venue: {
            select: {
              name: true
            }
          }
        }
      });

      return ApiResponse.success({
        ...cancelledBooking,
        refundInfo: refundAmount ? {
          amount: refundAmount,
          reason: refundReason || 'Booking cancellation'
        } : null
      }, {
        message: 'Booking cancelled successfully'
      });

    })(request, { user });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return ApiResponse.error('Failed to cancel booking', 'BOOKING_CANCEL_ERROR', 500);
  }
}

// Helper function to validate status transitions
function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  const validTransitions: Record<string, string[]> = {
    'PENDING': ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED': ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
    'CANCELLED': ['PENDING'], // Allow re-activation
    'COMPLETED': [], // No changes allowed after completion
    'NO_SHOW': ['CANCELLED']
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}