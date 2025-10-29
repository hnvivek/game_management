import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/players/profile - Get player profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      )
    }

    // Get user with their teams and matches
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        teamMemberships: {
          include: {
            team: {
              include: {
                captain: {
                  select: {
                    id: true,
                    name: true
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
                    displayName: true
                  }
                },
                _count: {
                  select: { members: true }
                }
              }
            }
          }
        },
        // Teams where user is captain
        captainedTeams: {
          include: {
            _count: {
              select: { members: true }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's matches (both home and away)
    const userTeams = await db.teamMember.findMany({
      where: { userId },
      select: { teamId: true }
    })

    const teamIds = userTeams.map(tm => tm.teamId)

    const matches = await db.match.findMany({
      where: {
        OR: [
          { homeTeamId: { in: teamIds } },
          { awayTeamId: { in: teamIds } }
        ]
      },
      include: {
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
        sport: {
          select: {
            id: true,
            name: true,
            displayName: true,
            icon: true
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
      orderBy: { booking: { startTime: 'desc' } }
    })

    // Calculate player statistics
    const stats = calculatePlayerStats(matches, userId)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive,
        role: user.role
      },
      teams: user.teamMemberships.map(tm => ({
        id: tm.team.id,
        name: tm.team.name,
        role: tm.role,
        sport: tm.team.sport,
        format: tm.team.format,
        captain: tm.team.captain,
        isCaptain: tm.team.captainId === userId,
        memberCount: tm.team._count.members
      })),
      stats,
      recentMatches: matches.slice(0, 10) // Last 10 matches
    })

  } catch (error) {
    console.error('Error fetching player profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch player profile' },
      { status: 500 }
    )
  }
}

// PUT /api/players/profile - Update player profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, phone, skillLevel, preferredSports } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        // Note: skillLevel and preferredSports would need to be added to the User model
        // For now, we'll focus on existing fields
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        role: true
      }
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating player profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

// Helper function to calculate player statistics
function calculatePlayerStats(matches: any[], userId: string) {
  const totalMatches = matches.length
  const completedMatches = matches.filter(m => m.status === 'COMPLETED')

  const upcomingMatches = matches.filter(m =>
    ['OPEN', 'CONFIRMED'].includes(m.status)
  )

  // Calculate matches by sport
  const matchesBySport: Record<string, number> = {}
  matches.forEach(match => {
    if (match.sport) {
      matchesBySport[match.sport.name] = (matchesBySport[match.sport.name] || 0) + 1
    }
  })

  // Calculate total playing time (simplified)
  let totalPlayingTime = 0
  completedMatches.forEach(match => {
    if (match.booking?.startTime && match.booking?.endTime) {
      const start = new Date(match.booking.startTime)
      const end = new Date(match.booking.endTime)
      totalPlayingTime += (end.getTime() - start.getTime()) / (1000 * 60) // minutes
    }
  })

  return {
    totalMatches,
    completedMatches,
    upcomingMatches,
    totalPlayingTime, // in minutes
    matchesBySport,
    winRate: completedMatches.length > 0 ? 0 : 0, // TODO: Calculate actual win rate
    averageRating: 0 // TODO: Calculate from ratings when implemented
  }
}