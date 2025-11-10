import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { sportId: string } }
) {
  try {
    const { sportId } = await params

    // First find the sport by name or ID
    const sport = await db.sportType.findFirst({
      where: {
        OR: [
          { name: sportId },
          { id: sportId }
        ],
        isActive: true
      }
    })

    if (!sport) {
      return NextResponse.json(
        { error: 'Sport not found' },
        { status: 404 }
      )
    }

    // Get formats for this sport
    const formats = await db.formatType.findMany({
      where: {
        sportId: sport.id,
        isActive: true
      },
      orderBy: [
        { playersPerTeam: 'desc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      sport: {
        id: sport.id,
        name: sport.name,
        displayName: sport.displayName,
        icon: sport.icon
      },
      formats: formats.map(format => ({
        id: format.id,
        name: format.name,
        displayName: format.displayName,
        description: format.description,
        playersPerTeam: format.playersPerTeam,
        maxTotalPlayers: format.maxTotalPlayers,
        isActive: format.isActive
      }))
    })

  } catch (error) {
    console.error('Error fetching sport formats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sport formats' },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}