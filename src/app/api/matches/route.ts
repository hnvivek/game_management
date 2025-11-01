import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema
const matchCreateSchema = z.object({
  homeTeamId: z.string(),
  awayTeamId: z.string().optional(),
  sportId: z.string(),
  formatId: z.string(),
  courtId: z.string(),
  scheduledDate: z.string().datetime(),
  duration: z.number().positive(),
  totalAmount: z.number().positive(),
  title: z.string().optional(),
  description: z.string().optional(),
  createdBy: z.string(),
});

// GET /api/matches - List all matches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sportId = searchParams.get('sportId');
    const status = searchParams.get('status');
    const homeTeamId = searchParams.get('homeTeamId');
    const awayTeamId = searchParams.get('awayTeamId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { homeTeam: { name: { contains: search, mode: 'insensitive' } } },
        { awayTeam: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (sportId) where.sportId = sportId;
    if (status) where.status = status;
    if (homeTeamId) where.homeTeamId = homeTeamId;
    if (awayTeamId) where.awayTeamId = awayTeamId;

    if (fromDate || toDate) {
      where.scheduledDate = {};
      if (fromDate) where.scheduledDate.gte = new Date(fromDate);
      if (toDate) where.scheduledDate.lte = new Date(toDate);
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledDate: 'desc' },
        include: {
          homeTeam: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              city: true,
            },
          },
          awayTeam: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              city: true,
            },
          },
          sport: {
            select: {
              id: true,
              name: true,
              displayName: true,
              icon: true,
            },
          },
          format: {
            select: {
              id: true,
              name: true,
              displayName: true,
              minPlayers: true,
              maxPlayers: true,
            },
          },
          court: {
            select: {
              id: true,
              courtNumber: true,
              venue: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          matchResults: {
            select: {
              id: true,
              homeScore: true,
              awayScore: true,
              status: true,
              verifiedAt: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              currency: true,
              paymentMethod: true,
              status: true,
              processedAt: true,
            },
          },
        },
      }),
      prisma.match.count({ where }),
    ]);

    return NextResponse.json({
      matches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

// POST /api/matches - Create new match
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = matchCreateSchema.parse(body);

    // Validate related entities exist
    const [homeTeam, sport, format, court] = await Promise.all([
      prisma.team.findUnique({
        where: { id: validatedData.homeTeamId },
      }),
      prisma.sportType.findUnique({
        where: { id: validatedData.sportId },
      }),
      prisma.formatType.findUnique({
        where: { id: validatedData.formatId },
      }),
      prisma.court.findUnique({
        where: { id: validatedData.courtId },
        include: {
          venue: true,
        },
      }),
    ]);

    if (!homeTeam) {
      return NextResponse.json(
        { error: 'Home team not found' },
        { status: 404 }
      );
    }

    if (!sport) {
      return NextResponse.json(
        { error: 'Sport not found' },
        { status: 404 }
      );
    }

    if (!format) {
      return NextResponse.json(
        { error: 'Format not found' },
        { status: 404 }
      );
    }

    if (!court) {
      return NextResponse.json(
        { error: 'Court not found' },
        { status: 404 }
      );
    }

    // Validate sport and format compatibility
    if (format.sportId !== validatedData.sportId) {
      return NextResponse.json(
        { error: 'Format does not belong to the specified sport' },
        { status: 400 }
      );
    }

    // Validate court sport compatibility
    if (court.sportId !== validatedData.sportId) {
      return NextResponse.json(
        { error: 'Court does not support the specified sport' },
        { status: 400 }
      );
    }

    // Check for court availability
    const scheduledStart = new Date(validatedData.scheduledDate);
    const scheduledEnd = new Date(scheduledStart.getTime() + validatedData.duration * 60000);

    const conflictingBookings = await prisma.booking.findMany({
      where: {
        courtId: validatedData.courtId,
        status: { in: ['CONFIRMED'] },
        OR: [
          {
            AND: [
              { startTime: { lte: scheduledStart } },
              { endTime: { gt: scheduledStart } },
            ],
          },
          {
            AND: [
              { startTime: { lt: scheduledEnd } },
              { endTime: { gte: scheduledEnd } },
            ],
          },
          {
            AND: [
              { startTime: { gte: scheduledStart } },
              { endTime: { lte: scheduledEnd } },
            ],
          },
        ],
      },
    });

    const conflictingMatches = await prisma.match.findMany({
      where: {
        courtId: validatedData.courtId,
        status: { in: ['CONFIRMED'] },
        scheduledDate: {
          gte: new Date(scheduledStart.getTime() - 30 * 60000), // 30 min buffer
          lte: new Date(scheduledEnd.getTime() + 30 * 60000), // 30 min buffer
        },
      },
    });

    if (conflictingBookings.length > 0 || conflictingMatches.length > 0) {
      return NextResponse.json(
        { error: 'Court is already booked for this time slot' },
        { status: 409 }
      );
    }

    const match = await prisma.match.create({
      data: validatedData,
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            city: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            city: true,
          },
        },
        sport: {
          select: {
            id: true,
            name: true,
            displayName: true,
            icon: true,
          },
        },
        format: {
          select: {
            id: true,
            name: true,
            displayName: true,
            minPlayers: true,
            maxPlayers: true,
          },
        },
        court: {
          select: {
            id: true,
            courtNumber: true,
            venue: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error('Error creating match:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    );
  }
}