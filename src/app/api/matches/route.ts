import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { addVendorFiltering, extractSubdomain, getVendorBySubdomain } from '@/lib/subdomain'

// GET /api/matches - List matches with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sportId = searchParams.get('sportId')
    const status = searchParams.get('status') // OPEN, CONFIRMED, COMPLETED
    const homeTeamId = searchParams.get('homeTeamId')
    const city = searchParams.get('city')
    const lookingForOpponent = searchParams.get('lookingForOpponent') === 'true'

    // Build filter conditions with automatic subdomain filtering
    const whereConditions: any = {}

    if (sportId) whereConditions.sportId = sportId
    if (status) whereConditions.status = status.toUpperCase() as any
    if (homeTeamId) whereConditions.homeTeamId = homeTeamId

    // Filter for teams looking for opponents
    if (lookingForOpponent) {
      whereConditions.awayTeamId = null
    }

    // Add automatic vendor filtering based on subdomain
    // Filter matches by venue vendor when on vendor subdomain
    const vendor = await getVendorBySubdomain(extractSubdomain(request))
    if (vendor) {
      whereConditions.booking = {
        venue: {
          vendorId: vendor.id
        }
      }
    }

    // Filter by city through home team
    if (city) {
      whereConditions.homeTeam = {
        city
      }
    }

    const matches = await db.match.findMany({
      where: whereConditions,
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
            },
            city: true,
            area: true,
            _count: {
              select: { members: true }
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
            },
            city: true,
            area: true,
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
                courtNumber: true,
                pricePerHour: true,
                vendor: {
                  select: {
                    id: true,
                    name: true,
                    slug: true
                  }
                },
                sport: {
                  select: {
                    displayName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // OPEN first
        { booking: { startTime: 'asc' } }
      ]
    })

    // Add split cost for matches looking for opponents
    const matchesWithCostSplit = matches.map(match => {
      if (match.awayTeamId === null && match.booking) {
        const totalCost = match.booking.totalAmount || 0
        return {
          ...match,
          splitCostPerTeam: totalCost / 2
        }
      }
      return match
    })

    return NextResponse.json({
      matches: matchesWithCostSplit,
      count: matches.length,
      filters: { sportId, status, homeTeamId, city, lookingForOpponent }
    })

  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}

// POST /api/matches - Create new match
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      bookingId,
      title,
      description,
      homeTeamId,
      sportId,
      formatId,
      maxPlayers
    } = body

    // Validate required fields
    if (!bookingId || !homeTeamId || !sportId || !formatId || !maxPlayers) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, homeTeamId, sportId, formatId, maxPlayers' },
        { status: 400 }
      )
    }

    // Check if booking exists
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        venue: true
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if match already exists for this booking
    const existingMatch = await db.match.findUnique({
      where: { bookingId }
    })

    if (existingMatch) {
      return NextResponse.json(
        { error: 'Match already exists for this booking' },
        { status: 409 }
      )
    }

    // Validate home team
    const homeTeam = await db.team.findUnique({
      where: { id: homeTeamId }
    })

    if (!homeTeam) {
      return NextResponse.json({ error: 'Home team not found' }, { status: 404 })
    }

    // Validate sport and format
    const [sport, format] = await Promise.all([
      db.sportType.findUnique({ where: { id: sportId } }),
      db.formatType.findUnique({ where: { id: formatId } })
    ])

    if (!sport) {
      return NextResponse.json({ error: 'Sport not found' }, { status: 404 })
    }

    if (!format) {
      return NextResponse.json({ error: 'Format not found' }, { status: 404 })
    }

    // Create match (looking for opponent by default)
    const match = await db.match.create({
      data: {
        bookingId,
        title,
        description,
        sportId,
        formatId,
        maxPlayers,
        homeTeamId,
        status: 'OPEN' // Open for opponents to join
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
                pricePerHour: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ match }, { status: 201 })

  } catch (error) {
    console.error('Error creating match:', error)
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    )
  }
}