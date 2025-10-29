import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/matches/[id] - Get match details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const match = await db.match.findUnique({
      where: { id },
      include: {
        homeTeam: {
          include: {
            captain: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
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
              }
            },
            _count: {
              select: { members: true }
            }
          }
        },
        awayTeam: {
          include: {
            captain: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
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
              }
            },
            _count: {
              select: { members: true }
            }
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
        booking: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            totalAmount: true,
            venue: {
              select: {
                id: true,
                name: true,
                courtNumber: true,
                pricePerHour: true,
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
            }
          }
        }
      }
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Add split cost if looking for opponent
    if (match.awayTeamId === null) {
      const totalCost = match.booking?.totalAmount || 0
      return NextResponse.json({
        ...match,
        splitCostPerTeam: totalCost / 2,
        lookingForOpponent: true
      })
    }

    return NextResponse.json({ match })

  } catch (error) {
    console.error('Error fetching match:', error)
    return NextResponse.json(
      { error: 'Failed to fetch match' },
      { status: 500 }
    )
  }
}

// PUT /api/matches/[id]/request - Request to join match as opponent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { awayTeamId } = body

    // Validate required fields
    if (!awayTeamId) {
      return NextResponse.json(
        { error: 'Missing required field: awayTeamId' },
        { status: 400 }
      )
    }

    // Check if match exists and is open
    const match = await db.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        sport: true,
        booking: true
      }
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Match is not accepting requests' },
        { status: 409 }
      )
    }

    if (match.awayTeamId !== null) {
      return NextResponse.json(
        { error: 'Match already has an opponent' },
        { status: 409 }
      )
    }

    // Check if away team exists
    const awayTeam = await db.team.findUnique({
      where: { id: awayTeamId },
      include: {
        _count: { select: { members: true } }
      }
    })

    if (!awayTeam) {
      return NextResponse.json({ error: 'Away team not found' }, { status: 404 })
    }

    // Check for scheduling conflicts
    const conflictingMatch = await db.match.findFirst({
      where: {
        id: { not: id },
        status: 'CONFIRMED',
        bookingId: match.bookingId
      }
    })

    if (conflictingMatch) {
      return NextResponse.json(
        { error: 'This venue is already booked for another confirmed match' },
        { status: 409 }
      )
    }

    // Update match with pending opponent
    const updatedMatch = await db.match.update({
      where: { id },
      data: {
        awayTeamId,
        status: 'PENDING' // Waiting for home team confirmation
      },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            captain: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            captain: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        },
        booking: {
          select: {
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
      }
    })

    return NextResponse.json({
      message: 'Opponent request sent successfully',
      match: updatedMatch,
      nextStep: 'Awaiting home team confirmation'
    })

  } catch (error) {
    console.error('Error requesting to join match:', error)
    return NextResponse.json(
      { error: 'Failed to send request' },
      { status: 500 }
    )
  }
}

// PATCH /api/matches/[id]/confirm - Confirm opponent request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, teamId } = body // 'accept' or 'reject'

    // Validate required fields
    if (!action || !teamId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, teamId' },
        { status: 400 }
      )
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "reject"' },
        { status: 400 }
      )
    }

    // Check if match exists
    const match = await db.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        booking: true
      }
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Match is not pending confirmation' },
        { status: 409 }
      )
    }

    // Verify the team making the request is involved
    if (match.homeTeamId !== teamId) {
      return NextResponse.json(
        { error: 'Only the home team can confirm opponent requests' },
        { status: 403 }
      )
    }

    let updateData: any = {}
    let message = ''

    if (action === 'accept') {
      updateData = {
        status: 'CONFIRMED'
      }
      message = 'Opponent confirmed! Match is now scheduled.'
    } else {
      updateData = {
        awayTeamId: null,
        status: 'OPEN'
      }
      message = 'Opponent request rejected. Match is open for other requests.'
    }

    // Update match
    const updatedMatch = await db.match.update({
      where: { id },
      data: updateData,
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            captain: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        },
        awayTeam: action === 'accept' ? {
          select: {
            id: true,
            name: true,
            captain: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        } : null,
        booking: {
          select: {
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
      }
    })

    return NextResponse.json({
      message,
      match: updatedMatch
    })

  } catch (error) {
    console.error('Error confirming opponent:', error)
    return NextResponse.json(
      { error: 'Failed to process confirmation' },
      { status: 500 }
    )
  }
}