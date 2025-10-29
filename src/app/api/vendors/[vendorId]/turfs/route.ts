import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/vendors/[vendorId]/turfs - Get vendor's turfs
export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const vendorId = params.vendorId
    
    const turfs = await db.turf.findMany({
      where: {
        vendorId,
        isActive: true
      },
      orderBy: [
        { sport: 'asc' },
        { courtNumber: 'asc' }
      ]
    })
    
    return NextResponse.json({ turfs })
  } catch (error) {
    console.error('Error fetching vendor turfs:', error)
    return NextResponse.json({ error: 'Failed to fetch turfs' }, { status: 500 })
  }
}

// POST /api/vendors/[vendorId]/turfs - Create new turf/venue
export async function POST(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const vendorId = params.vendorId
    const body = await request.json()
    const {
      sport,
      size,
      courtNumber,
      pricePerHour,
      maxPlayers,
      amenities,
      description,
      images
    } = body
    
    // Validate required fields
    if (!sport || !size || !courtNumber || !pricePerHour || !maxPlayers) {
      return NextResponse.json(
        { error: 'Sport, size, court number, price, and max players are required' },
        { status: 400 }
      )
    }
    
    // Check if vendor exists
    const vendor = await db.vendor.findUnique({
      where: { id: vendorId }
    })
    
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }
    
    // Check for duplicate court number
    const existingTurf = await db.turf.findFirst({
      where: {
        vendorId,
        courtNumber,
        sport,
        isActive: true
      }
    })
    
    if (existingTurf) {
      return NextResponse.json(
        { error: `${courtNumber} for ${sport} already exists` },
        { status: 409 }
      )
    }
    
    // Create turf
    const turf = await db.turf.create({
      data: {
        vendorId,
        name: vendor.name,
        venue: vendor.location,
        sport,
        size,
        courtNumber,
        pricePerHour: parseInt(pricePerHour),
        maxPlayers: parseInt(maxPlayers),
        amenities: amenities ? JSON.stringify(amenities) : null,
        description,
        images: images ? JSON.stringify(images) : null
      }
    })
    
    return NextResponse.json({ turf })
  } catch (error) {
    console.error('Error creating turf:', error)
    return NextResponse.json({ error: 'Failed to create turf' }, { status: 500 })
  }
}
