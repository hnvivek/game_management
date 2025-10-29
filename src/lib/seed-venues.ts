import { db } from '@/lib/db'

// Core sports data that will be seeded first
const SPORTS_DATA = [
  {
    name: 'soccer',
    displayName: 'Football/Soccer',
    icon: 'soccer-ball'
  },
  {
    name: 'basketball',
    displayName: 'Basketball', 
    icon: 'basketball'
  },
  {
    name: 'cricket',
    displayName: 'Cricket',
    icon: 'cricket-bat'
  },
  {
    name: 'badminton',
    displayName: 'Badminton',
    icon: 'shuttlecock'
  }
]

// Format types for each sport
const FORMAT_DATA = [
  // Soccer formats
  { sportName: 'soccer', name: '11-a-side', displayName: '11 a side (Full Field)', minPlayers: 22, maxPlayers: 22 },
  { sportName: 'soccer', name: '8-a-side', displayName: '8 a side (Medium Field)', minPlayers: 16, maxPlayers: 16 },
  { sportName: 'soccer', name: '6-a-side', displayName: '6 a side (Small Field)', minPlayers: 12, maxPlayers: 12 },
  
  // Basketball formats  
  { sportName: 'basketball', name: 'Full Court', displayName: 'Full Court (5v5)', minPlayers: 10, maxPlayers: 10 },
  { sportName: 'basketball', name: 'Half Court', displayName: 'Half Court (3v3)', minPlayers: 6, maxPlayers: 6 },
  
  // Cricket formats
  { sportName: 'cricket', name: 'Full Ground', displayName: 'Full Ground (11v11)', minPlayers: 22, maxPlayers: 22 },
  { sportName: 'cricket', name: 'Half Ground', displayName: 'Half Ground (6v6)', minPlayers: 12, maxPlayers: 12 },
  
  // Badminton formats
  { sportName: 'badminton', name: 'Singles', displayName: 'Singles (1v1)', minPlayers: 2, maxPlayers: 2 },
  { sportName: 'badminton', name: 'Doubles', displayName: 'Doubles (2v2)', minPlayers: 4, maxPlayers: 4 }
]

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
    formatName: '8-a-side',
    courtNumber: 'Turf 1',
    pricePerHour: 2600,
    maxPlayers: 16,
    amenities: ['parking', 'changing_rooms', 'lights'],
    description: 'Medium size artificial turf'
  },
  {
    sportName: 'soccer',
    formatName: '8-a-side',
    courtNumber: 'Turf 2',
    pricePerHour: 2600,
    maxPlayers: 16,
    amenities: ['parking', 'changing_rooms', 'lights'],
    description: 'Medium size artificial turf'
  },
  {
    sportName: 'soccer',
    formatName: '6-a-side',
    courtNumber: 'Turf 3',
    pricePerHour: 1500,
    maxPlayers: 12,
    amenities: ['parking', 'lights'],
    description: 'Small sided football turf'
  },
  {
    sportName: 'soccer',
    formatName: '6-a-side',
    courtNumber: 'Turf 4',
    pricePerHour: 1500,
    maxPlayers: 12,
    amenities: ['parking', 'lights'],
    description: 'Small sided football turf'
  },
  
  // Basketball Courts
  {
    sportName: 'basketball',
    formatName: 'Full Court',
    courtNumber: 'Court 1',
    pricePerHour: 2500,
    maxPlayers: 10,
    amenities: ['parking', 'changing_rooms', 'lights', 'ac'],
    description: 'Indoor full basketball court with AC'
  },
  {
    sportName: 'basketball',
    formatName: 'Half Court',
    courtNumber: 'Court 2',
    pricePerHour: 1800,
    maxPlayers: 6,
    amenities: ['parking', 'lights'],
    description: 'Outdoor half basketball court'
  },
  {
    sportName: 'basketball',
    formatName: 'Half Court',
    courtNumber: 'Court 3',
    pricePerHour: 1800,
    maxPlayers: 6,
    amenities: ['parking', 'lights'],
    description: 'Outdoor half basketball court'
  },
  
  // Cricket Grounds
  {
    sportName: 'cricket',
    formatName: 'Full Ground',
    courtNumber: 'Ground 1',
    pricePerHour: 5000,
    maxPlayers: 22,
    amenities: ['parking', 'changing_rooms', 'lights', 'pavilion'],
    description: 'Full size cricket ground with pavilion'
  },
  {
    sportName: 'cricket',
    formatName: 'Half Ground',
    courtNumber: 'Practice Net 1',
    pricePerHour: 2000,
    maxPlayers: 12,
    amenities: ['parking', 'lights'],
    description: 'Cricket practice nets'
  },
  {
    sportName: 'cricket',
    formatName: 'Half Ground',
    courtNumber: 'Practice Net 2',
    pricePerHour: 2000,
    maxPlayers: 12,
    amenities: ['parking', 'lights'],
    description: 'Cricket practice nets'
  },
  
  // Badminton Courts
  {
    sportName: 'badminton',
    formatName: 'Singles',
    courtNumber: 'Court 1',
    pricePerHour: 800,
    maxPlayers: 2,
    amenities: ['parking', 'ac', 'lights'],
    description: 'Indoor badminton court with AC'
  },
  {
    sportName: 'badminton',
    formatName: 'Doubles',
    courtNumber: 'Court 2',
    pricePerHour: 1200,
    maxPlayers: 4,
    amenities: ['parking', 'ac', 'lights'],
    description: 'Indoor badminton court with AC'
  },
  {
    sportName: 'badminton',
    formatName: 'Singles',
    courtNumber: 'Court 3',
    pricePerHour: 800,
    maxPlayers: 2,
    amenities: ['parking', 'ac', 'lights'],
    description: 'Indoor badminton court with AC'
  }
]

// Seed functions
export async function seedSports() {
  try {
    console.log('🏃 Seeding sports...')
    
    // Clear existing sports and formats
    await db.formatType.deleteMany()
    await db.sportType.deleteMany()
    
    // Create sports
    const sportsMap = new Map()
    for (const sportData of SPORTS_DATA) {
      const sport = await db.sportType.create({
        data: sportData
      })
      sportsMap.set(sport.name, sport.id)
      console.log(`✅ Created sport: ${sport.displayName}`)
    }
    
    // Create formats for each sport
    const formatsMap = new Map()
    for (const formatData of FORMAT_DATA) {
      const sportId = sportsMap.get(formatData.sportName)
      if (!sportId) {
        console.error(`❌ Sport not found: ${formatData.sportName}`)
        continue
      }
      
      const format = await db.formatType.create({
        data: {
          sportId,
          name: formatData.name,
          displayName: formatData.displayName,
          minPlayers: formatData.minPlayers,
          maxPlayers: formatData.maxPlayers,
          createdBy: null // System defaults
        }
      })
      formatsMap.set(`${formatData.sportName}-${formatData.name}`, format.id)
      console.log(`✅ Created format: ${formatData.displayName}`)
    }
    
    console.log('🎉 Sports and formats seeded successfully!')
    return { sportsMap, formatsMap }
    
  } catch (error) {
    console.error('❌ Error seeding sports:', error)
    throw error
  }
}

export async function seedVenues() {
  try {
    console.log('🏟️ Seeding venues...')
    
    // Get the vendor and location first (must exist)
    const vendor = await db.vendor.findUnique({
      where: { slug: '3lok-whitefield' }
    })
    
    if (!vendor) {
      throw new Error('Vendor not found. Please run vendor seeding first.')
    }

    // Get the vendor location
    const vendorLocation = await db.vendorLocation.findUnique({
      where: { id: 'whitefield-location' }
    })
    
    if (!vendorLocation) {
      throw new Error('Vendor location not found. Please run vendor seeding first.')
    }

    // Get sports and formats maps
    const sports = await db.sportType.findMany()
    const formats = await db.formatType.findMany({ include: { sport: true } })
    
    const sportsMap = new Map(sports.map(s => [s.name, s.id]))
    const formatsMap = new Map(formats.map(f => [`${f.sport.name}-${f.name}`, f.id]))

    // Clear existing venues
    await db.venue.deleteMany()
    
    // Insert new venues with proper relationships
    for (const venueData of VENUE_DATA) {
      const sportId = sportsMap.get(venueData.sportName)
      const formatId = formatsMap.get(`${venueData.sportName}-${venueData.formatName}`)
      
      if (!sportId || !formatId) {
        console.error(`❌ Sport or format not found: ${venueData.sportName}-${venueData.formatName}`)
        continue
      }
      
      await db.venue.create({
        data: {
          vendorId: vendor.id,
          locationId: vendorLocation.id, // Link to specific location
          sportId,
          formatId,
          courtNumber: venueData.courtNumber,
          pricePerHour: venueData.pricePerHour,
          maxPlayers: venueData.maxPlayers,
          amenities: venueData.amenities,
          description: venueData.description
        }
      })
      console.log(`✅ Created venue: ${venueData.courtNumber} (${venueData.sportName})`)
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
