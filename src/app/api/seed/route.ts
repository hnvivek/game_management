import { NextResponse } from 'next/server'
import { seedTurfs, generateAvailability } from '@/lib/seed-turfs'

export async function POST() {
  try {
    await seedTurfs()
    await generateAvailability()
    
    return NextResponse.json({ 
      message: 'Turfs and availability seeded successfully!' 
    })
  } catch (error) {
    console.error('Error seeding data:', error)
    return NextResponse.json(
      { error: 'Failed to seed data' },
      { status: 500 }
    )
  }
}