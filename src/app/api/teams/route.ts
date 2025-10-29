import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/teams - List teams with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sportId = searchParams.get('sportId')
    const city = searchParams.get('city')
    const formatId = searchParams.get('formatId')
    const captainId = searchParams.get('captainId')
    const isActive = searchParams.get('isActive') !== 'false'

    // Build filter conditions
    const whereConditions: any = {
      isActive,
      isPublic: true // Only show public teams by default
    }

    if (sportId) whereConditions.sportId = sportId
    if (city) whereConditions.city = city
    if (formatId) whereConditions.formatId = formatId
    if (captainId) whereConditions.captainId = captainId

    const teams = await db.team.findMany({
      where: whereConditions,
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
      },
      orderBy: [
        { sport: { displayName: 'asc' } },
        { city: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      teams,
      count: teams.length,
      filters: { sportId, city, formatId, captainId, isActive }
    })

  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

// POST /api/teams - Create new team
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      logoUrl,
      captainId,
      sportId,
      formatId,
      maxPlayers,
      city,
      area,
      isPublic = true
    } = body

    // Validate required fields
    if (!name || !captainId || !sportId || !formatId || !maxPlayers) {
      return NextResponse.json(
        { error: 'Missing required fields: name, captainId, sportId, formatId, maxPlayers' },
        { status: 400 }
      )
    }

    // Validate captain exists
    const captain = await db.user.findUnique({
      where: { id: captainId }
    })

    if (!captain) {
      return NextResponse.json(
        { error: 'Captain not found' },
        { status: 404 }
      )
    }

    // Validate sport and format exist
    const [sport, format] = await Promise.all([
      db.sportType.findUnique({ where: { id: sportId } }),
      db.formatType.findUnique({ where: { id: formatId } })
    ])

    if (!sport) {
      return NextResponse.json(
        { error: 'Sport not found' },
        { status: 404 }
      )
    }

    if (!format) {
      return NextResponse.json(
        { error: 'Format not found' },
        { status: 404 }
      )
    }

    // Create team
    const team = await db.team.create({
      data: {
        name,
        description,
        logoUrl,
        captainId,
        sportId,
        formatId,
        maxPlayers,
        city,
        area,
        isPublic
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
        }
      }
    })

    // Add captain as team member automatically
    await db.teamMember.create({
      data: {
        teamId: team.id,
        userId: captainId,
        role: 'captain'
      }
    })

    return NextResponse.json({ team }, { status: 201 })

  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}