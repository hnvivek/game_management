import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/teams/[id] - Get team details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const team = await db.team.findUnique({
      where: { id: params.id },
      include: {
        captain: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        sport: {
          select: {
            id: true,
            name: true,
            displayName: true,
            icon: true
          }
        },
        format: {
          select: {
            id: true,
            name: true,
            displayName: true,
            minPlayers: true,
            maxPlayers: true
          }
        },
        members: {
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
        },
        homeMatches: {
          where: {
            status: { in: ['OPEN', 'CONFIRMED'] }
          },
          include: {
            awayTeam: {
              select: {
                id: true,
                name: true
              }
            },
            booking: {
              select: {
                id: true,
                startTime: true,
                endTime: true,
                venue: {
                  select: {
                    id: true,
                    name: true,
                    courtNumber: true
                  }
                }
              }
            }
          },
          orderBy: { booking: { startTime: 'asc' } }
        },
        awayMatches: {
          where: {
            status: { in: ['OPEN', 'CONFIRMED'] }
          },
          include: {
            homeTeam: {
              select: {
                id: true,
                name: true
              }
            },
            booking: {
              select: {
                id: true,
                startTime: true,
                endTime: true,
                venue: {
                  select: {
                    id: true,
                    name: true,
                    courtNumber: true
                  }
                }
              }
            }
          },
          orderBy: { booking: { startTime: 'asc' } }
        },
        _count: {
          select: {
            members: true,
            homeMatches: true,
            awayMatches: true
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    return NextResponse.json({ team })

  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    )
  }
}

// PUT /api/teams/[id] - Update team
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      logoUrl,
      maxPlayers,
      city,
      area,
      isActive,
      isPublic
    } = body

    // Check if team exists
    const existingTeam = await db.team.findUnique({
      where: { id: params.id }
    })

    if (!existingTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Update team
    const team = await db.team.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(maxPlayers && { maxPlayers }),
        ...(city !== undefined && { city }),
        ...(area !== undefined && { area }),
        ...(isActive !== undefined && { isActive }),
        ...(isPublic !== undefined && { isPublic })
      },
      include: {
        captain: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        sport: {
          select: {
            id: true,
            name: true,
            displayName: true,
            icon: true
          }
        },
        format: {
          select: {
            id: true,
            name: true,
            displayName: true,
            minPlayers: true,
            maxPlayers: true
          }
        },
        _count: {
          select: {
            members: true,
            homeMatches: true,
            awayMatches: true
          }
        }
      }
    })

    return NextResponse.json({ team })

  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    )
  }
}

// DELETE /api/teams/[id] - Delete team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if team exists
    const existingTeam = await db.team.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            homeMatches: true,
            awayMatches: true
          }
        }
      }
    })

    if (!existingTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if team has upcoming matches
    const totalMatches = existingTeam._count.homeMatches + existingTeam._count.awayMatches
    if (totalMatches > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete team with upcoming matches',
          upcomingMatches: totalMatches
        },
        { status: 409 }
      )
    }

    // Delete team members first
    await db.teamMember.deleteMany({
      where: { teamId: params.id }
    })

    // Delete team
    await db.team.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Team deleted successfully',
      teamId: params.id
    })

  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    )
  }
}