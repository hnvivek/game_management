import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// DELETE /api/teams/[id]/members/[userId] - Remove team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    // Check if team exists
    const team = await db.team.findUnique({
      where: { id: params.id },
      include: {
        captain: {
          select: { id: true, name: true }
        }
      }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if team member exists
    const teamMember = await db.teamMember.findUnique({
      where: {
        teamId: params.id,
        userId: params.userId
      }
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'User is not a team member' },
        { status: 404 }
      )
    }

    // Cannot remove the captain
    if (teamMember.role === 'captain') {
      return NextResponse.json(
        { error: 'Cannot remove team captain. Transfer captainship first.' },
        { status: 409 }
      )
    }

    // Check if team has upcoming matches where this member is critical
    const upcomingMatches = await db.match.findMany({
      where: {
        OR: [
          { homeTeamId: params.id },
          { awayTeamId: params.id }
        ],
        status: { in: ['OPEN', 'CONFIRMED'] }
      },
      include: {
        homeTeam: {
          select: { id: true, name: true }
        },
        awayTeam: {
          select: { id: true, name: true }
        }
      }
    })

    if (upcomingMatches.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot remove member with upcoming matches',
          upcomingMatches: upcomingMatches.length
        },
        { status: 409 }
      )
    }

    // Remove team member
    await db.teamMember.delete({
      where: {
        teamId: params.id,
        userId: params.userId
      }
    })

    return NextResponse.json({
      message: 'Team member removed successfully',
      teamId: params.id,
      removedUserId: params.userId
    })

  } catch (error) {
    console.error('Error removing team member:', error)
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    )
  }
}