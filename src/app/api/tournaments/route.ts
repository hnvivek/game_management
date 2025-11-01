import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { addVendorFiltering } from '@/lib/subdomain'
import { z } from 'zod'

// Validation schemas
const tournamentCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  sportId: z.string(),
  venueId: z.string().optional(),
  format: z.enum(['KNOCKOUT', 'LEAGUE', 'ROUND_ROBIN']).default('KNOCKOUT'),
  preferredFormatId: z.string().optional(),
  actualFormatId: z.string().optional(),
  maxTeams: z.number().positive().optional(),
  targetPlayersPerTeam: z.number().positive().optional(),
  entryFee: z.number().min(0).optional(),
  prizePool: z.number().min(0).optional(),
  startDate: z.string(),
  endDate: z.string(),
  registrationDeadline: z.string().optional(),
  status: z.enum(['UPCOMING', 'REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('UPCOMING'),
  rules: z.string().optional(),
  autoFormTeams: z.boolean().optional(),
})

/**
 * @swagger
 * /api/tournaments:
 *   get:
 *     summary: Get list of tournaments
 *     description: Retrieve a list of tournaments with optional filtering by sport, venue, status, and dates
 *     tags:
 *       - Tournaments
 *     parameters:
 *       - in: query
 *         name: sportId
 *         schema:
 *           type: string
 *         description: Filter by sport ID
 *       - in: query
 *         name: venueId
 *         schema:
 *           type: string
 *         description: Filter by venue ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, REGISTRATION, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *         description: Filter by tournament status
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
 *         name: upcoming
 *         schema:
 *           type: boolean
 *         description: Only return upcoming tournaments
 *       - in: query
 *         name: registrationOpen
 *         schema:
 *           type: boolean
 *         description: Only return tournaments with open registration
 *     responses:
 *       200:
 *         description: List of tournaments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tournaments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tournament'
 *       500:
 *         description: Failed to fetch tournaments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// GET /api/tournaments - List tournaments with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sportId = searchParams.get('sportId')
    const venueId = searchParams.get('venueId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const upcoming = searchParams.get('upcoming') === 'true'
    const registrationOpen = searchParams.get('registrationOpen') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build filter conditions with automatic subdomain filtering
    const whereConditions: any = {}

    if (sportId) whereConditions.sportId = sportId
    if (venueId) whereConditions.venueId = venueId
    if (status) whereConditions.status = status

    // Date filtering
    if (startDate || endDate) {
      whereConditions.startDate = {}
      if (startDate) whereConditions.startDate.gte = new Date(startDate)
      if (endDate) whereConditions.startDate.lte = new Date(endDate)
    }

    // Special filters
    if (upcoming) {
      whereConditions.startDate = {
        ...whereConditions.startDate,
        gte: new Date()
      }
      whereConditions.status = {
        in: ['UPCOMING', 'REGISTRATION_OPEN']
      }
    }

    if (registrationOpen) {
      whereConditions.registrationDeadline = {
        gte: new Date()
      }
      whereConditions.status = {
        in: ['REGISTRATION_OPEN']
      }
    }

    // Add automatic vendor filtering based on subdomain
    await addVendorFiltering(request, whereConditions, 'venue.vendorId')

    const tournaments = await db.tournament.findMany({
      where: whereConditions,
      include: {
        sport: {
          select: {
            id: true,
            name: true,
            displayName: true,
            icon: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
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
        preferredFormat: {
          select: {
            id: true,
            name: true,
            displayName: true,
            minPlayers: true,
            maxPlayers: true
          }
        },
        actualFormat: {
          select: {
            id: true,
            name: true,
            displayName: true,
            minPlayers: true,
            maxPlayers: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        participants: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                logoUrl: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        },
        _count: {
          select: {
            participants: true,
            courts: true
          }
        }
      },
      orderBy: [
        { startDate: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await db.tournament.count({
      where: whereConditions
    })

    // Add computed fields
    const tournamentsWithStats = tournaments.map(tournament => {
      const registeredTeams = tournament.participants.filter(p => p.team).length
      const registeredIndividuals = tournament.participants.filter(p => p.user).length
      const isRegistrationOpen = tournament.status === 'REGISTRATION' &&
        tournament.registrationDeadline &&
        new Date(tournament.registrationDeadline) > new Date()

      return {
        ...tournament,
        stats: {
          registeredTeams,
          registeredIndividuals,
          totalParticipants: tournament._count.participants,
          availableSpots: tournament.maxTeams ? tournament.maxTeams - registeredTeams : null,
          isRegistrationOpen,
          registrationDeadlinePassed: tournament.registrationDeadline &&
            new Date(tournament.registrationDeadline) <= new Date()
        }
      }
    })

    return NextResponse.json({
      tournaments: tournamentsWithStats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      filters: { sportId, venueId, status, startDate, endDate, upcoming, registrationOpen }
    })

  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/tournaments:
 *   post:
 *     summary: Create new tournament
 *     description: Create a new sports tournament with smart scheduling and team formation options
 *     tags:
 *       - Tournaments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - sportId
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 200
 *                 description: Tournament name
 *               description:
 *                 type: string
 *                 description: Tournament description
 *               sportId:
 *                 type: string
 *                 description: Sport ID for the tournament
 *               venueId:
 *                 type: string
 *                 description: Venue ID (optional)
 *               preferredFormatId:
 *                 type: string
 *                 description: Preferred format ID
 *               maxTeams:
 *                 type: integer
 *                 minimum: 1
 *                 description: Maximum number of teams
 *               maxPlayersPerTeam:
 *                 type: integer
 *                 minimum: 1
 *                 description: Maximum players per team
 *               entryFee:
 *                 type: integer
 *                 minimum: 0
 *                 description: Entry fee amount (in cents)
 *               prizePool:
 *                 type: integer
 *                 minimum: 0
 *                 description: Prize pool amount (in cents)
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Tournament start date
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Tournament end date
 *               registrationDeadline:
 *                 type: string
 *                 format: date-time
 *                 description: Registration deadline
 *               status:
 *                 type: string
 *                 enum: [DRAFT, REGISTRATION, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *                 default: DRAFT
 *               rules:
 *                 type: string
 *                 description: Tournament rules
 *               isAutoSchedule:
 *                 type: boolean
 *                 description: Enable automatic scheduling
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *                 description: Make tournament publicly visible
 *     responses:
 *       201:
 *         description: Tournament created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tournament:
 *                   $ref: '#/components/schemas/Tournament'
 *       400:
 *         description: Bad request - validation errors
 *       500:
 *         description: Failed to create tournament
 */
// POST /api/tournaments - Create new tournament
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = tournamentCreateSchema.parse(body)

    // Validate sport exists
    const sport = await db.sportType.findUnique({
      where: { id: validatedData.sportId }
    })

    if (!sport) {
      return NextResponse.json(
        { error: 'Sport not found' },
        { status: 400 }
      )
    }

    // Validate venue if provided
    if (validatedData.venueId) {
      const venue = await db.venue.findUnique({
        where: { id: validatedData.venueId }
      })

      if (!venue) {
        return NextResponse.json(
          { error: 'Venue not found' },
          { status: 400 }
        )
      }
    }

    // Validate format if provided
    if (validatedData.preferredFormatId) {
      const format = await db.formatType.findUnique({
        where: { id: validatedData.preferredFormatId }
      })

      if (!format || format.sportId !== validatedData.sportId) {
        return NextResponse.json(
          { error: 'Invalid format for this sport' },
          { status: 400 }
        )
      }
    }

    // Validate dates
    const startDate = new Date(validatedData.startDate)
    const endDate = new Date(validatedData.endDate)
    const registrationDeadline = validatedData.registrationDeadline
      ? new Date(validatedData.registrationDeadline)
      : null

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    if (registrationDeadline && registrationDeadline >= startDate) {
      return NextResponse.json(
        { error: 'Registration deadline must be before start date' },
        { status: 400 }
      )
    }

    // Get creator ID from authentication (placeholder - should come from auth middleware)
    const creatorId = body.creatorId || 'demo-user-id'

    // Create tournament
    const tournament = await db.tournament.create({
      data: {
        ...validatedData,
        createdBy: creatorId,
        startDate,
        endDate,
        registrationDeadline,
        status: validatedData.status || 'UPCOMING'
      },
      include: {
        sport: {
          select: {
            id: true,
            name: true,
            displayName: true,
            icon: true
          }
        },
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true
          }
        },
        preferredFormat: {
          select: {
            id: true,
            name: true,
            displayName: true,
            minPlayers: true,
            maxPlayers: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            participants: true,
            courts: true
          }
        }
      }
    })

    // Initialize tournament if auto-scheduling is enabled
    if (validatedData.autoFormTeams && tournament.status === 'UPCOMING') {
      // This would trigger the smart scheduling logic
      // For now, just mark as SCHEDULED
      await db.tournament.update({
        where: { id: tournament.id },
        data: { status: 'SCHEDULED' }
      })
    }

    return NextResponse.json({ tournament }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating tournament:', error)
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    )
  }
}