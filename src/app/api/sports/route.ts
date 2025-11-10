import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * @swagger
 * /api/sports:
 *   post:
 *     summary: Create a new sport
 *     description: Create a new sport with configuration
 *     tags:
 *       - Sports
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - displayName
 *             properties:
 *               name:
 *                 type: string
 *                 description: Unique sport identifier
 *                 example: "american-football"
 *               displayName:
 *                 type: string
 *                 description: Display name for the sport
 *                 example: "American Football"
 *               icon:
 *                 type: string
 *                 description: Emoji or icon for the sport
 *                 example: "🏈"
 *               description:
 *                 type: string
 *                 description: Sport description
 *                 example: "Full contact American football"
 *               teamSize:
 *                 type: integer
 *                 description: Default team size
 *                 example: 11
 *               duration:
 *                 type: integer
 *                 description: Default duration in minutes
 *                 example: 90
 *               isActive:
 *                 type: boolean
 *                 description: Whether the sport is active
 *                 example: true
 *     responses:
 *       201:
 *         description: Sport created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sport'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to create sport
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    const { name, displayName, icon, description, teamSize, duration, isActive } = body

    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'Name and displayName are required' },
        { status: 400 }
      )
    }

    // Check if sport name already exists
    const existingSport = await db.sportType.findUnique({
      where: { name }
    })

    if (existingSport) {
      return NextResponse.json(
        { error: 'Sport with this name already exists' },
        { status: 400 }
      )
    }

    // Create the sport
    const sport = await db.sportType.create({
      data: {
        name,
        displayName,
        icon: icon || null,
        description: description || null,
        teamSize: teamSize || 11,
        duration: duration || 90,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json(sport, { status: 201 })
  } catch (error) {
    console.error('Error creating sport:', error)
    return NextResponse.json(
      { error: 'Failed to create sport' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/sports:
 *   get:
 *     summary: Get list of sports
 *     description: Retrieve a list of all active sports with their formats
 *     tags:
 *       - Sports
 *     responses:
 *       200:
 *         description: List of sports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sports:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sport'
 *                 count:
 *                   type: integer
 *                   description: Number of sports returned
 *                   example: 6
 *       500:
 *         description: Failed to fetch sports
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   parameters: []
 */
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
            { playersPerTeam: 'desc' }, // Larger formats first (11-a-side before 6-a-side)
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
