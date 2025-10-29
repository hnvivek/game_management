import { db } from '@/lib/db'

const VENUE_DATA = [
  // Soccer Venues
  {
    sportName: 'soccer',
    formatName: '11-a-side',
    courtNumber: 'Field A',
    pricePerHour: 4000,
    maxPlayers: 22,
    amenities: ['parking', 'changing_rooms', 'lights', 'washrooms'],
    description: 'Full size FIFA standard football field'
  },
  {
    sportName: 'soccer',
    formatName: '7-a-side',
    courtNumber: 'Turf 1',
    pricePerHour: 2600,
    maxPlayers: 14,
    amenities: ['parking', 'changing_rooms', 'lights'],
    description: 'Medium size artificial turf'
  },
  {
    sportName: 'soccer',
    formatName: '7-a-side',
    courtNumber: 'Turf 2',
    pricePerHour: 2600,
    maxPlayers: 14,
    amenities: ['parking', 'changing_rooms', 'lights'],
    description: 'Medium size artificial turf'
  },
  {
    sportName: 'soccer',
    formatName: '5-a-side',
    courtNumber: 'Turf 3',
    pricePerHour: 1500,
    maxPlayers: 10,
    amenities: ['parking', 'lights'],
    description: 'Small sided football turf'
  },
  {
    sportName: 'soccer',
    formatName: '5-a-side',
    courtNumber: 'Turf 4',
    pricePerHour: 1500,
    maxPlayers: 10,
    amenities: ['parking', 'lights'],
    description: 'Small sided football turf'
  },

  // Basketball Courts
  {
    sportName: 'basketball',
    formatName: '5v5',
    courtNumber: 'Court 1',
    pricePerHour: 2500,
    maxPlayers: 10,
    amenities: ['parking', 'changing_rooms', 'lights', 'ac'],
    description: 'Indoor full basketball court with AC'
  },
  {
    sportName: 'basketball',
    formatName: '3x3',
    courtNumber: 'Court 2',
    pricePerHour: 1800,
    maxPlayers: 6,
    amenities: ['parking', 'lights'],
    description: 'Outdoor half basketball court'
  },
  {
    sportName: 'basketball',
    formatName: '3x3',
    courtNumber: 'Court 3',
    pricePerHour: 1800,
    maxPlayers: 6,
    amenities: ['parking', 'lights'],
    description: 'Outdoor half basketball court'
  },

  // Cricket Grounds
  {
    sportName: 'cricket',
    formatName: 'tape-ball',
    courtNumber: 'Ground 1',
    pricePerHour: 5000,
    maxPlayers: 12,
    amenities: ['parking', 'changing_rooms', 'lights', 'pavilion'],
    description: 'Full size cricket ground with pavilion'
  },
  {
    sportName: 'cricket',
    formatName: 'tennis-ball',
    courtNumber: 'Practice Net 1',
    pricePerHour: 2000,
    maxPlayers: 12,
    amenities: ['parking', 'lights'],
    description: 'Cricket practice nets'
  },
  {
    sportName: 'cricket',
    formatName: 'tennis-ball',
    courtNumber: 'Practice Net 2',
    pricePerHour: 2000,
    maxPlayers: 12,
    amenities: ['parking', 'lights'],
    description: 'Cricket practice nets'
  },

  // Badminton Courts
  {
    sportName: 'badminton',
    formatName: 'singles',
    courtNumber: 'Court 1',
    pricePerHour: 800,
    maxPlayers: 2,
    amenities: ['parking', 'ac', 'lights'],
    description: 'Indoor badminton court with AC'
  },
  {
    sportName: 'badminton',
    formatName: 'doubles',
    courtNumber: 'Court 2',
    pricePerHour: 1200,
    maxPlayers: 4,
    amenities: ['parking', 'ac', 'lights'],
    description: 'Indoor badminton court with AC'
  },
  {
    sportName: 'badminton',
    formatName: 'singles',
    courtNumber: 'Court 3',
    pricePerHour: 800,
    maxPlayers: 2,
    amenities: ['parking', 'ac', 'lights'],
    description: 'Indoor badminton court with AC'
  }
]


export async function seedVenues() {
  try {
    console.log('🏟️ Seeding venues...')

    // Get all vendors and their locations
    const vendors = await db.vendor.findMany({
      include: {
        locations: true
      }
    })

    if (vendors.length === 0) {
      throw new Error('No vendors found. Please run vendor seeding first.')
    }

    // Get sports and formats maps
    const sports = await db.sportType.findMany()
    const formats = await db.formatType.findMany({ include: { sport: true } })
    
    const sportsMap = new Map(sports.map(s => [s.name, s.id]))
    const formatsMap = new Map(formats.map(f => [`${f.sport.name}-${f.name}`, f.id]))

    // Note: Not clearing existing venues to avoid foreign key constraints
    console.log('ℹ️  Adding venues to existing database (not clearing to preserve references)')
    
    // Insert new venues distributed across multiple vendors
    let venueIndex = 0
    for (const venueData of VENUE_DATA) {
      const sportId = sportsMap.get(venueData.sportName)
      const formatId = formatsMap.get(`${venueData.sportName}-${venueData.formatName}`)

      if (!sportId || !formatId) {
        console.error(`❌ Sport or format not found: ${venueData.sportName}-${venueData.formatName}`)
        continue
      }

      // Distribute venues round-robin across vendors
      const vendor = vendors[venueIndex % vendors.length]
      const location = vendor.locations[0] // Use first location of each vendor

      await db.venue.create({
        data: {
          vendorId: vendor.id,
          locationId: location.id,
          sportId,
          formatId,
          courtNumber: venueData.courtNumber,
          pricePerHour: venueData.pricePerHour,
          maxPlayers: venueData.maxPlayers,
          amenities: venueData.amenities,
          description: venueData.description
        }
      })
      console.log(`✅ Created venue: ${venueData.courtNumber} (${venueData.sportName}) for ${vendor.name}`)
      venueIndex++
    }
    
    console.log('🎉 Venues seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding venues:', error)
    throw error
  }
}

// Generate availability for next 30 days
export async function generateAvailability() {
  try {
    console.log('📅 Generating availability slots...')
    
    // Clear existing availability
    await db.venueAvailability.deleteMany()
    
    const venues = await db.venue.findMany()
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      for (const venue of venues) {
        // Generate slots from 6:00 AM to 11:00 PM
        for (let hour = 6; hour <= 22; hour++) {
          // Create proper DateTime objects
          const startDateTime = new Date(date)
          startDateTime.setHours(hour, 0, 0, 0)
          
          const endDateTime = new Date(date)
          endDateTime.setHours(hour + 1, 0, 0, 0)
          
          // Randomly make some slots unavailable for demo
          const isAvailable = Math.random() > 0.1 // 90% availability
          
          await db.venueAvailability.create({
            data: {
              venueId: venue.id,
              date: date,
              startTime: startDateTime,
              endTime: endDateTime,
              isAvailable,
            },
          })
        }
      }
    }
    
    console.log('📅 Availability generated successfully!')
  } catch (error) {
    console.error('❌ Error generating availability:', error)
    throw error
  }
}
