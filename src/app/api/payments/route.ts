import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { addVendorFiltering } from '@/lib/subdomain'
import { z } from 'zod'

// Validation schemas
const paymentCreateSchema = z.object({
  userId: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  method: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'STRIPE', 'CASH', 'BANK_TRANSFER']),
  type: z.enum(['BOOKING_PAYMENT', 'TOURNAMENT_ENTRY', 'TEAM_FEE', 'VENUE_FEE', 'REFUND']),
  bookingId: z.string().optional(),
  tournamentId: z.string().optional(),
  teamId: z.string().optional(),
  description: z.string().optional(),
  metadata: z.string().optional(), // JSON string for additional data
})

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get list of payments
 *     description: Retrieve a list of payments with optional filtering by user, status, type, and date range
 *     tags:
 *       - Payments
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, CANCELLED]
 *         description: Filter by payment status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [BOOKING_PAYMENT, TOURNAMENT_ENTRY, TEAM_FEE, VENUE_FEE, REFUND]
 *         description: Filter by payment type
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [CREDIT_CARD, DEBIT_CARD, PAYPAL, STRIPE, CASH, BANK_TRANSFER]
 *         description: Filter by payment method
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
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Failed to fetch payments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// GET /api/payments - List payments with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const method = searchParams.get('method')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build filter conditions with automatic subdomain filtering
    const whereConditions: any = {}

    if (userId) whereConditions.userId = userId
    if (status) whereConditions.status = status.toUpperCase()
    if (type) whereConditions.type = type.toUpperCase()
    if (method) whereConditions.method = method.toUpperCase()

    // Date range filtering
    if (startDate || endDate) {
      whereConditions.createdAt = {}
      if (startDate) whereConditions.createdAt.gte = new Date(startDate)
      if (endDate) whereConditions.createdAt.lte = new Date(endDate)
    }

    // Add automatic vendor filtering for booking payments
    await addVendorFiltering(request, whereConditions, 'booking.court.venue.vendorId')

    const payments = await db.payment.findMany({
      where: whereConditions,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        booking: {
          select: {
            id: true,
            type: true,
            startTime: true,
            endTime: true,
            totalAmount: true,
            status: true,
            court: {
              select: {
                id: true,
                name: true,
                venue: {
                  select: {
                    id: true,
                    name: true,
                    vendor: {
                      select: {
                        id: true,
                        name: true,
                        slug: true
                      }
                    }
                  }
                }
              }
            }
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
            },
            court: {
              select: {
                id: true,
                name: true,
                venue: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await db.payment.count({
      where: whereConditions
    })

    // Add computed fields
    const paymentsWithDetails = payments.map(payment => {
      const metadata = payment.metadata ? JSON.parse(payment.metadata) : {}

      return {
        ...payment,
        metadata,
        formattedAmount: `${payment.currency} ${(payment.amount / 100).toFixed(2)}`,
        relatedEntity: payment.booking || payment.match,
        vendorInfo: payment.booking?.court?.venue?.vendor ||
                   payment.match?.court?.venue?.vendor ||
                   null
      }
    })

    // Calculate summary statistics
    const totalAmount = paymentsWithDetails.reduce((sum, payment) => sum + payment.amount, 0)
    const completedPayments = paymentsWithDetails.filter(p => p.status === 'COMPLETED')
    const totalCompletedAmount = completedPayments.reduce((sum, payment) => sum + payment.amount, 0)

    const summary = {
      totalPayments: paymentsWithDetails.length,
      totalAmount,
      completedPayments: completedPayments.length,
      totalCompletedAmount,
      successRate: paymentsWithDetails.length > 0
        ? (completedPayments.length / paymentsWithDetails.length * 100).toFixed(2)
        : '0.00'
    }

    return NextResponse.json({
      payments: paymentsWithDetails,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      summary,
      filters: { userId, status, type, method, startDate, endDate }
    })

  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create new payment
 *     description: Create a new payment transaction for bookings, tournaments, or other services
 *     tags:
 *       - Payments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *               - method
 *               - type
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID making the payment
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 description: Payment amount in cents
 *               currency:
 *                 type: string
 *                 length: 3
 *                 default: USD
 *                 description: Currency code
 *               method:
 *                 type: string
 *                 enum: [CREDIT_CARD, DEBIT_CARD, PAYPAL, STRIPE, CASH, BANK_TRANSFER]
 *                 description: Payment method
 *               type:
 *                 type: string
 *                 enum: [BOOKING_PAYMENT, TOURNAMENT_ENTRY, TEAM_FEE, VENUE_FEE, REFUND]
 *                 description: Payment type
 *               bookingId:
 *                 type: string
 *                 description: Associated booking ID (for booking payments)
 *               tournamentId:
 *                 type: string
 *                 description: Associated tournament ID (for tournament entries)
 *               teamId:
 *                 type: string
 *                 description: Associated team ID (for team fees)
 *               description:
 *                 type: string
 *                 description: Payment description
 *               metadata:
 *                 type: string
 *                 description: Additional metadata as JSON string
 *     responses:
 *       201:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payment:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Bad request - validation errors
 *       500:
 *         description: Failed to create payment
 */
// POST /api/payments - Create new payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = paymentCreateSchema.parse(body)

    // Validate user exists
    const user = await db.user.findUnique({
      where: { id: validatedData.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      )
    }

    // Validate related entity exists
    let relatedEntity = null
    if (validatedData.bookingId) {
      relatedEntity = await db.booking.findUnique({
        where: { id: validatedData.bookingId }
      })
      if (!relatedEntity) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 400 }
        )
      }
    }

    if (validatedData.tournamentId) {
      relatedEntity = await db.tournament.findUnique({
        where: { id: validatedData.tournamentId }
      })
      if (!relatedEntity) {
        return NextResponse.json(
          { error: 'Tournament not found' },
          { status: 400 }
        )
      }
    }

    if (validatedData.teamId) {
      relatedEntity = await db.team.findUnique({
        where: { id: validatedData.teamId }
      })
      if (!relatedEntity) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 400 }
        )
      }
    }

    // Validate payment amount against related entity if applicable
    if (relatedEntity && 'totalAmount' in relatedEntity) {
      if (validatedData.amount !== relatedEntity.totalAmount) {
        return NextResponse.json(
          { error: 'Payment amount does not match booking total' },
          { status: 400 }
        )
      }
    }

    // Create payment
    const payment = await db.payment.create({
      data: {
        ...validatedData,
        status: 'PENDING', // Initial status
        metadata: validatedData.metadata || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        booking: {
          select: {
            id: true,
            type: true,
            startTime: true,
            endTime: true,
            totalAmount: true,
            court: {
              select: {
                id: true,
                name: true,
                venue: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Process payment based on method
    // In a real implementation, this would integrate with payment gateways
    const processedPayment = await processPayment(payment.id, validatedData.method)

    return NextResponse.json({
      payment: processedPayment,
      message: 'Payment created and processing initiated'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}

// Helper function to process payment
async function processPayment(paymentId: string, method: string) {
  try {
    // In a real implementation, this would integrate with:
    // - Stripe for credit/debit cards
    // - PayPal API
    // - Bank transfer APIs
    // - Cash handling workflows

    // For demo purposes, simulate payment processing
    const processingTime = method === 'CASH' ? 0 : 2000 // 2 seconds for digital payments

    await new Promise(resolve => setTimeout(resolve, processingTime))

    // Simulate different outcomes based on method
    let status = 'COMPLETED'
    if (Math.random() < 0.1) { // 10% chance of failure for demo
      status = 'FAILED'
    }

    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status,
        paidAt: status === 'COMPLETED' ? new Date() : null,
        processedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return updatedPayment
  } catch (error) {
    console.error('Error processing payment:', error)

    // Mark payment as failed
    await db.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        processedAt: new Date()
      }
    })

    throw error
  }
}