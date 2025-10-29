import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get all active sports with their formats
    const sports = await db.sportType.findMany({
      where: {
        isActive: true
      },
      include: {
        formats: {
          where: {
            isActive: true
          },
          orderBy: [
            { maxPlayers: 'desc' }, // Larger formats first (11-a-side before 6-a-side)
            { name: 'asc' }
          ]
        }
      },
      orderBy: {
        displayName: 'asc'
      }
    })
    
    return NextResponse.json({ 
      sports,
      count: sports.length
    })
  } catch (error) {
    console.error('Error fetching sports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sports' },
      { status: 500 }
    )
  }
}
