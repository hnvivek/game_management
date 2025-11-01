import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * @swagger
 * /api/sports/options:
 *   get:
 *     summary: Get sports options for dropdown
 *     description: Returns a simplified list of sports with IDs and names for UI dropdowns
 *     tags:
 *       - Sports
 *     responses:
 *       200:
 *         description: List of sports options
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Sport ID
 *                     example: "cmhct91st0000tzwgks7lp3y6"
 *                   name:
 *                     type: string
 *                     description: Sport name
 *                     example: "Soccer"
 *                   displayName:
 *                     type: string
 *                     description: Display name with icon
 *                     example: "⚽ Soccer"
 *                   value:
 *                     type: string
 *                     description: Sport ID (for dropdown value)
 *                     example: "cmhct91st0000tzwgks7lp3y6"
 *                   label:
 *                     type: string
 *                     description: Sport name with icon (for dropdown display)
 *                     example: "⚽ Soccer"
 *       500:
 *         description: Failed to fetch sports options
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET() {
  try {
    // Get all active sports
    const sports = await db.sportType.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        icon: true
      },
      orderBy: {
        displayName: 'asc'
      }
    })

    // Transform into dropdown-friendly format
    const sportsOptions = sports.map(sport => ({
      id: sport.id,
      name: sport.name,
      displayName: sport.displayName,
      value: sport.id,
      label: `${sport.icon} ${sport.displayName}`
    }))

    return NextResponse.json(sportsOptions)
  } catch (error) {
    console.error('Error fetching sports options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sports options' },
      { status: 500 }
    )
  }
}