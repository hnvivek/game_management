import { NextRequest, NextResponse } from 'next/server'
import { seedVendorsAndTurfs } from '@/lib/seed-vendors'

export async function POST(request: NextRequest) {
  try {
    const result = await seedVendorsAndTurfs()
    
    return NextResponse.json({
      success: true,
      message: 'Vendors and turfs seeded successfully!',
      data: result
    })
  } catch (error) {
    console.error('Error seeding vendors:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed vendors and turfs',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to seed vendors and turfs',
    methods: ['POST'],
    endpoints: {
      'POST /api/seed-vendors': 'Seed 3Lok Sports Hub vendor and all venues',
      'GET /api/vendors': 'List all vendors',
      'POST /api/vendors': 'Create new vendor (onboarding)'
    }
  })
}
