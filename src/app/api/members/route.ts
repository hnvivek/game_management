import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema
const memberCreateSchema = z.object({
  teamId: z.string(),
  userId: z.string(),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
  jerseyNumber: z.number().int().positive().optional(),
  preferredPosition: z.string().optional(),
  isActive: z.boolean().optional(),
  canBookMatches: z.boolean().optional(),
  canApproveMatches: z.boolean().optional(),
});

// GET /api/members - List team memberships
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const teamId = searchParams.get('teamId');
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (teamId) where.teamId = teamId;
    if (userId) where.userId = userId;
    if (role) where.role = role;
    if (isActive !== null) where.isActive = isActive === 'true';

    const [members, total] = await Promise.all([
      prisma.teamMember.findMany({
        where,
        skip,
        take: limit,
        orderBy: { joinedAt: 'desc' },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              sport: { select: { name: true, displayName: true } },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
              city: true,
            },
          },
        },
      }),
      prisma.teamMember.count({ where }),
    ]);

    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST /api/members - Add member to team
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = memberCreateSchema.parse(body);

    // Check if team and user exist
    const [team, user] = await Promise.all([
      prisma.team.findUnique({
        where: { id: validatedData.teamId },
      }),
      prisma.user.findUnique({
        where: { id: validatedData.userId },
      }),
    ]);

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member of the team
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: validatedData.teamId,
          userId: validatedData.userId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'User is already a member of this team' },
        { status: 409 }
      );
    }

    const member = await prisma.teamMember.create({
      data: validatedData,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            sport: { select: { name: true, displayName: true } },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error adding team member:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add team member' },
      { status: 500 }
    );
  }
}