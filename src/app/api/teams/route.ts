import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema
const teamCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  sportId: z.string(),
  formatId: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  level: z.string().optional(),
  maxPlayers: z.number().positive(),
  minPlayers: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/teams - List all teams
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sportId = searchParams.get('sportId');
    const city = searchParams.get('city');
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (sportId) where.sportId = sportId;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (isActive !== null) where.isActive = isActive === 'true';

    const [teams, total] = await Promise.all([
      db.team.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
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
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      }),
      db.team.count({ where }),
    ]);

    return NextResponse.json({
      teams,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create new team
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = teamCreateSchema.parse(body);

    // Validate sport and format exist
    const [sport, format] = await Promise.all([
      db.sportType.findUnique({
        where: { id: validatedData.sportId },
      }),
      validatedData.formatId ? db.formatType.findUnique({
        where: { id: validatedData.formatId },
      }) : Promise.resolve(null),
    ]);

    if (!sport) {
      return NextResponse.json(
        { error: 'Sport not found' },
        { status: 400 }
      );
    }

    if (validatedData.formatId && !format) {
      return NextResponse.json(
        { error: 'Format not found' },
        { status: 400 }
      );
    }

    // Validate format belongs to sport
    if (validatedData.formatId && format && format.sportId !== validatedData.sportId) {
      return NextResponse.json(
        { error: 'Format does not belong to the specified sport' },
        { status: 400 }
      );
    }

    const team = await db.team.create({
      data: {
        ...validatedData,
        minPlayers: validatedData.minPlayers || validatedData.maxPlayers,
      },
      include: {
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
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}