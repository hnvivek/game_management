import { db } from '@/lib/db'

const TURF_DATA = [
  // Soccer Turfs
  {
    name: '3Lok Football Fitness Hub',
    venue: 'Whitefield, Bengaluru',
    sport: 'soccer',
    size: '11 a side',
    courtNumber: 'Turf 1',
    pricePerHour: 4000,
    maxPlayers: 22,
  },
  {
    name: '3Lok Football Fitness Hub',
    venue: 'Whitefield, Bengaluru',
    sport: 'soccer',
    size: '8 a side',
    courtNumber: 'Turf 1',
    pricePerHour: 2600,
    maxPlayers: 16,
  },
  {
    name: '3Lok Football Fitness Hub',
    venue: 'Whitefield, Bengaluru',
    sport: 'soccer',
    size: '8 a side',
    courtNumber: 'Turf 2',
    pricePerHour: 2600,
    maxPlayers: 16,
  },
  {
    name: '3Lok Football Fitness Hub',
    venue: 'Whitefield, Bengaluru',
    sport: 'soccer',
    size: '6 a side',
    courtNumber: 'Turf 1',
    pricePerHour: 1500,
    maxPlayers: 12,
  },
  {
    name: '3Lok Football Fitness Hub',
    venue: 'Whitefield, Bengaluru',
    sport: 'soccer',
    size: '6 a side',
    courtNumber: 'Turf 2',
    pricePerHour: 1500,
    maxPlayers: 12,
  },
  {
    name: '3Lok Football Fitness Hub',
    venue: 'Whitefield, Bengaluru',
    sport: 'soccer',
    size: '6 a side',
    courtNumber: 'Turf 3',
    pricePerHour: 1500,
    maxPlayers: 12,
  },
  {
    name: '3Lok Football Fitness Hub',
    venue: 'Whitefield, Bengaluru',
    sport: 'soccer',
    size: '6 a side',
    courtNumber: 'Turf 4',
    pricePerHour: 1500,
    maxPlayers: 12,
  },
  // Ultimate Frisbee Courts
  {
    name: '3Lok Football Fitness Hub',
    venue: 'Whitefield, Bengaluru',
    sport: 'ultimate-frisbee',
    size: 'Full Court',
    courtNumber: 'Court 1',
    pricePerHour: 3000,
    maxPlayers: 14,
  },
  {
    name: '3Lok Football Fitness Hub',
    venue: 'Whitefield, Bengaluru',
    sport: 'ultimate-frisbee',
    size: 'Half Court',
    courtNumber: 'Court 1',
    pricePerHour: 2000,
    maxPlayers: 7,
  },
  {
    name: '3Lok Football Fitness Hub',
    venue: 'Whitefield, Bengaluru',
    sport: 'ultimate-frisbee',
    size: 'Half Court',
    courtNumber: 'Court 2',
    pricePerHour: 2000,
    maxPlayers: 7,
  },
  // Box Cricket
  {
    name: '3Lok Football Fitness Hub',
    venue: 'Whitefield, Bengaluru',
    sport: 'box-cricket',
    size: '11 a side',
    courtNumber: 'Turf 1',
    pricePerHour: 4000,
    maxPlayers: 22,
  },
  {
    name: '3Lok Football Fitness Hub',
    venue: 'Whitefield, Bengaluru',
    sport: 'box-cricket',
    size: '7 a side',
    courtNumber: 'Half Ground 1',
    pricePerHour: 2000,
    maxPlayers: 14,
  },
  {
    name: '3Lok Football Fitness Hub',
    venue: 'Whitefield, Bengaluru',
    sport: 'box-cricket',
    size: '7 a side',
    courtNumber: 'Half Ground 2',
    pricePerHour: 2000,
    maxPlayers: 14,
  },
]

export async function seedTurfs() {
  try {
    // Clear existing turfs
    await db.turf.deleteMany()
    
    // Insert new turfs
    for (const turfData of TURF_DATA) {
      await db.turf.create({
        data: turfData,
      })
    }
    
    console.log('Turfs seeded successfully!')
  } catch (error) {
    console.error('Error seeding turfs:', error)
  }
}

// Generate availability for next 30 days
export async function generateAvailability() {
  try {
    // Clear existing availability
    await db.turfAvailability.deleteMany()
    
    const turfs = await db.turf.findMany()
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      
      for (const turf of turfs) {
        // Generate slots from 6:00 AM to 11:00 PM
        for (let hour = 6; hour <= 22; hour++) {
          const startTime = `${hour.toString().padStart(2, '0')}:00`
          const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`
          
          // Randomly make some slots unavailable for demo
          const isAvailable = Math.random() > 0.1 // 90% availability
          
          await db.turfAvailability.create({
            data: {
              turfId: turf.id,
              date: dateStr,
              startTime,
              endTime,
              isAvailable,
            },
          })
        }
      }
    }
    
    console.log('Availability generated successfully!')
  } catch (error) {
    console.error('Error generating availability:', error)
  }
}