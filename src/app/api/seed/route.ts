import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { seedSports, seedVenues, generateAvailability } from '@/lib/seed-venues'
import { seedVendors } from '@/lib/seed-vendors'

export async function POST() {
  try {
    console.log('🚀 Starting improved seeding process...')
    
    // Clear existing data in correct order (due to foreign key constraints)
    console.log('🧹 Clearing existing data...')
    await db.venueAvailability.deleteMany()
    await db.booking.deleteMany()
    await db.conflict.deleteMany()
    await db.venue.deleteMany()
    await db.formatType.deleteMany()
    await db.sportType.deleteMany()
    await db.vendorSettings.deleteMany()
    await db.vendorLocation.deleteMany() 
    await db.vendor.deleteMany()
    await db.user.deleteMany()
    
    // 1. Seed vendors first
    console.log('🏢 Seeding vendors...')
    await seedVendors()
    
    // 2. Seed sports and formats
    console.log('🏃 Seeding sports and formats...')
    await seedSports()
    
    // 3. Seed venues with proper relationships
    console.log('🏟️ Seeding venues...')
    await seedVenues()
    
    // 4. Generate availability slots
    console.log('📅 Generating availability...')
    await generateAvailability()

    // Get summary data
    const summary = {
      sports: await db.sportType.count(),
      formats: await db.formatType.count(),
      venues: await db.venue.count(),
      availability: await db.venueAvailability.count(),
      vendors: await db.vendor.count(),
    }
    
    console.log('🎉 Improved seeding completed successfully!')
    console.log('📊 Summary:', summary)
    
    return NextResponse.json({ 
      message: 'Database seeded successfully with improved architecture!',
      summary,
      improvements: [
        '✅ Normalized SportType and FormatType models',
        '✅ Proper DateTime types instead of strings', 
        '✅ Performance indexes on critical queries',
        '✅ JSON arrays for amenities',
        '✅ Multi-sport support (Soccer, Basketball, Cricket, Badminton)',
        '✅ Vendor relationships with proper foreign keys'
      ]
    })
    
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    return NextResponse.json(
      { 
        error: 'Failed to seed database', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}