import { seedVendors } from './seed-vendors'
import { seedVenues } from './seed-venues'
import { seedTeams } from './seed-teams'
import { seedMatches } from './seed-matches'
import { db } from './db'

// Basic seed data for sports and formats if they don't exist
const basicSports = [
  { name: 'soccer', displayName: 'Soccer', icon: '⚽' },
  { name: 'cricket', displayName: 'Cricket', icon: '🏏' },
  { name: 'basketball', displayName: 'Basketball', icon: '🏀' },
  { name: 'badminton', displayName: 'Badminton', icon: '🏸' },
  { name: 'tennis', displayName: 'Tennis', icon: '🎾' },
  { name: 'volleyball', displayName: 'Volleyball', icon: '🏐' }
]

const basicFormats = [
  { name: '5-a-side', displayName: '5-a-side', minPlayers: 5, maxPlayers: 10 },
  { name: '7-a-side', displayName: '7-a-side', minPlayers: 7, maxPlayers: 14 },
  { name: '11-a-side', displayName: '11-a-side', minPlayers: 11, maxPlayers: 22 },
  { name: 'tape-ball', displayName: 'Tape Ball', minPlayers: 6, maxPlayers: 12 },
  { name: 'tennis-ball', displayName: 'Tennis Ball', minPlayers: 6, maxPlayers: 12 },
  { name: 'doubles', displayName: 'Doubles', minPlayers: 2, maxPlayers: 4 },
  { name: 'singles', displayName: 'Singles', minPlayers: 1, maxPlayers: 2 },
  { name: '5v5', displayName: '5v5', minPlayers: 5, maxPlayers: 10 },
  { name: '3x3', displayName: '3x3', minPlayers: 3, maxPlayers: 6 }
]

async function seedBasicData() {
  console.log('🌱 Seeding basic sports and formats...')

  // Seed sports
  const createdSports = []
  for (const sportData of basicSports) {
    const sport = await db.sportType.upsert({
      where: { name: sportData.name },
      update: {},
      create: sportData
    })
    createdSports.push(sport)
  }

  // Seed formats (need to associate with sports)
  for (const sport of createdSports) {
    let formatsForSport = []

    // Assign appropriate formats based on sport
    switch (sport.name) {
      case 'soccer':
        formatsForSport = basicFormats.filter(f =>
          ['5-a-side', '7-a-side', '11-a-side'].includes(f.name)
        )
        break
      case 'cricket':
        formatsForSport = basicFormats.filter(f =>
          ['tape-ball', 'tennis-ball'].includes(f.name)
        )
        break
      case 'basketball':
        formatsForSport = basicFormats.filter(f =>
          ['5v5', '3x3'].includes(f.name)
        )
        break
      case 'badminton':
        formatsForSport = basicFormats.filter(f =>
          ['singles', 'doubles'].includes(f.name)
        )
        break
      case 'tennis':
        formatsForSport = basicFormats.filter(f =>
          ['singles', 'doubles'].includes(f.name)
        )
        break
      default:
        formatsForSport = basicFormats.slice(0, 2) // Default to first 2 formats
    }

    for (const formatData of formatsForSport) {
      await db.formatType.upsert({
        where: {
          sportId_name: {
            sportId: sport.id,
            name: formatData.name
          }
        },
        update: {},
        create: {
          sportId: sport.id,
          ...formatData
        }
      })
    }
  }

  console.log('✅ Basic data seeded successfully!')
}

export async function seedAll() {
  console.log('🚀 Starting complete database seeding...')
  console.log('=====================================')

  try {
    // Step 1: Seed basic data (sports and formats)
    await seedBasicData()

    // Step 2: Seed vendors
    const vendors = await seedVendors()

    // Step 3: Seed venues (depends on vendors)
    await seedVenues()

    // Step 4: Seed teams (depends on sports and formats)
    await seedTeams()

    // Step 5: Seed matches (depends on teams, venues, and bookings)
    await seedMatches()

    console.log('=====================================')
    console.log('🎉 Complete database seeding finished successfully!')
    console.log('')
    console.log('📊 Summary:')
    console.log(`   ✅ ${vendors.length} vendors with multiple locations`)
    console.log('   ✅ Multiple venues across different vendors')
    console.log('   ✅ 8 teams with realistic stats and members')
    console.log('   ✅ 10 matches (open and confirmed)')
    console.log('')
    console.log('🌐 Available subdomains for testing:')
    vendors.forEach(({ vendor }) => {
      console.log(`   - ${vendor.slug}.localhost:3000`)
    })
    console.log('')
    console.log('👤 Admin login credentials:')
    vendors.forEach(({ vendor }) => {
      console.log(`   - ${vendor.slug}: admin@${vendor.slug}.com / admin123`)
    })
    console.log('')

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  seedAll()
    .then(() => {
      console.log('🎊 All done! Your database is now populated with realistic data.')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}