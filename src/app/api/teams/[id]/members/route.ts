import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/teams/[id]/members - Get team members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if team exists
    const team = await db.team.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, maxPlayers: true }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const members = await db.teamMember.findMany({
      where: { teamId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: [
        { role: 'desc' }, // captain first
        { joinedAt: 'asc' }
      ]
    })

    return NextResponse.json({
      teamId: params.id,
      teamName: team.name,
      maxPlayers: team.maxPlayers,
      members,
      currentCount: members.length
    })

  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}

// POST /api/teams/[id]/members - Add team member
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { userId, role = 'member' } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    // Check if team exists
    const team = await db.team.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { members: true }
        }
      }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if team is full
    if (team._count.members >= team.maxPlayers) {
      return NextResponse.json(
        {
          error: 'Team is full',
          currentCount: team._count.members,
          maxPlayers: team.maxPlayers
        },
        { status: 409 }
      )
    }

    // Check if user is already a member
    const existingMember = await db.teamMember.findUnique({
      where: {
        teamId: params.id,
        userId
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a team member' },
        { status: 409 }
      )
    }

    // Add team member
    const teamMember = await db.teamMember.create({
      data: {
        teamId: params.id,
        userId,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    // Get updated team member count
    const updatedTeam = await db.team.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { members: true }
        }
      }
    })

    return NextResponse.json({
      message: 'Team member added successfully',
      member: teamMember,
      teamStats: {
        currentCount: updatedTeam?._count.members || 0,
        maxPlayers: team.maxPlayers
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding team member:', error)
    return NextResponse.json(
      { error: 'Failed to add team member' },
      { status: 500 }
    )
  }
}