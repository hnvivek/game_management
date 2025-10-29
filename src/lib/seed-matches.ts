import { db } from '@/lib/db'

// Match data with realistic scenarios
const matches = [
  {
    title: 'Weekend Soccer Showdown',
    description: 'Looking for a competitive 5-a-side match. We have a solid defense and creative midfielders.',
    sportId: 'soccer',
    formatId: '5-a-side',
    homeTeamId: 'bengaluru-strikers', // Will be replaced with actual ID
    maxPlayers: 10,
    status: 'OPEN',
    venue: 'Sports Arena - Court 1',
    startTime: new Date(Date.now() + 86400000), // Tomorrow
    endTime: new Date(Date.now() + 86400000 + 3600000), // Tomorrow + 1 hour
    totalAmount: 2000,
    splitCostPerTeam: 1000
  },
  {
    title: 'Cricket Clash - Tape Ball Tournament',
    description: 'Competitive tape ball cricket match. We have good bowlers and aggressive batsmen.',
    sportId: 'cricket',
    formatId: 'tape-ball',
    homeTeamId: 'urban-warriors',
    maxPlayers: 12,
    status: 'OPEN',
    venue: 'Turf Pro - Ground A',
    startTime: new Date(Date.now() + 172800000), // Day after tomorrow
    endTime: new Date(Date.now() + 172800000 + 7200000), // Day after tomorrow + 2 hours
    totalAmount: 2400,
    splitCostPerTeam: 1200
  },
  {
    title: 'Badminton Friendly Match',
    description: 'Looking for a doubles match. Intermediate level players preferred.',
    sportId: 'badminton',
    formatId: 'doubles',
    homeTeamId: 'tech-titans',
    maxPlayers: 4,
    status: 'OPEN',
    venue: 'Smash Zone - Court 3',
    startTime: new Date(Date.now() + 259200000), // 3 days from now
    endTime: new Date(Date.now() + 259200000 + 5400000), // 3 days + 1.5 hours
    totalAmount: 1200,
    splitCostPerTeam: 600
  },
  {
    title: 'Basketball 5v5 Game',
    description: 'Full court basketball game. All skill levels welcome. Bring your A-game!',
    sportId: 'basketball',
    formatId: '5v5',
    homeTeamId: 'court-kings',
    maxPlayers: 10,
    status: 'OPEN',
    venue: 'Hoops Arena - Court 2',
    startTime: new Date(Date.now() + 345600000), // 4 days from now
    endTime: new Date(Date.now() + 345600000 + 7200000), // 4 days + 2 hours
    totalAmount: 3000,
    splitCostPerTeam: 1500
  },
  {
    title: '7-a-side Football Match',
    description: 'Friendly football match focusing on fitness and fun. All levels welcome.',
    sportId: 'soccer',
    formatId: '7-a-side',
    homeTeamId: 'fc-indiranagar',
    maxPlayers: 14,
    status: 'OPEN',
    venue: 'Football Park - Field 1',
    startTime: new Date(Date.now() + 432000000), // 5 days from now
    endTime: new Date(Date.now() + 432000000 + 9000000), // 5 days + 2.5 hours
    totalAmount: 3500,
    splitCostPerTeam: 1750
  },
  {
    title: 'Badminton Singles Tournament',
    description: 'Competitive singles badminton match. Professional level players preferred.',
    sportId: 'badminton',
    formatId: 'singles',
    homeTeamId: 'smash-masters',
    maxPlayers: 2,
    status: 'OPEN',
    venue: 'Elite Sports - Court 1',
    startTime: new Date(Date.now() + 518400000), // 6 days from now
    endTime: new Date(Date.now() + 518400000 + 3600000), // 6 days + 1 hour
    totalAmount: 800,
    splitCostPerTeam: 400
  },
  {
    title: 'Tennis Ball Cricket',
    description: 'Casual tennis ball cricket match. Perfect for weekend relaxation.',
    sportId: 'cricket',
    formatId: 'tennis-ball',
    homeTeamId: 'turf-warriors',
    maxPlayers: 14,
    status: 'OPEN',
    venue: 'Cricket Ground - Pitch 2',
    startTime: new Date(Date.now() + 604800000), // 7 days from now
    endTime: new Date(Date.now() + 604800000 + 7200000), // 7 days + 2 hours
    totalAmount: 1600,
    splitCostPerTeam: 800
  },
  {
    title: '3x3 Basketball Tournament',
    description: 'Fast-paced 3x3 basketball. Street rules apply. High energy game!',
    sportId: 'basketball',
    formatId: '3x3',
    homeTeamId: 'hoops-nation',
    maxPlayers: 6,
    status: 'OPEN',
    venue: 'Street Ball Court - Court A',
    startTime: new Date(Date.now() + 691200000), // 8 days from now
    endTime: new Date(Date.now() + 691200000 + 3600000), // 8 days + 1 hour
    totalAmount: 1000,
    splitCostPerTeam: 500
  }
]

// Some matches that are already confirmed (for demonstration)
const confirmedMatches = [
  {
    title: 'Corporate Badminton Challenge',
    description: 'Inter-company badminton tournament',
    sportId: 'badminton',
    formatId: 'doubles',
    homeTeamId: 'tech-titans',
    awayTeamId: 'smash-masters', // Will be replaced with actual ID
    maxPlayers: 4,
    status: 'CONFIRMED',
    venue: 'Elite Sports - Court 2',
    startTime: new Date(Date.now() - 86400000), // Yesterday
    endTime: new Date(Date.now() - 86400000 + 5400000), // Yesterday + 1.5 hours
    totalAmount: 1200,
    splitCostPerTeam: 600,
    homeScore: 21,
    awayScore: 18
  },
  {
    title: 'Soccer Practice Match',
    description: 'Friendly practice session',
    sportId: 'soccer',
    formatId: '5-a-side',
    homeTeamId: 'bengaluru-strikers',
    awayTeamId: 'fc-indiranagar',
    maxPlayers: 10,
    status: 'COMPLETED',
    venue: 'Sports Arena - Court 1',
    startTime: new Date(Date.now() - 172800000), // 2 days ago
    endTime: new Date(Date.now() - 172800000 + 3600000), // 2 days ago + 1 hour
    totalAmount: 2000,
    splitCostPerTeam: 1000,
    homeScore: 3,
    awayScore: 2
  }
]

export async function seedMatches() {
  console.log('🌱 Seeding matches...')

  try {
    // Get existing teams, venues, sports, and formats
    const teams = await db.team.findMany({
      select: {
        id: true,
        name: true,
        sportId: true,
        formatId: true,
        maxPlayers: true,
        city: true,
        area: true
      }
    })

    const venues = await db.venue.findMany({
      select: {
        id: true,
        courtNumber: true,
        sportId: true,
        pricePerHour: true,
        vendorId: true
      }
    })

    const sports = await db.sportType.findMany()
    const formats = await db.formatType.findMany()

    if (teams.length === 0) {
      throw new Error('No teams found. Please seed teams first.')
    }

    if (venues.length === 0) {
      throw new Error('No venues found. Please seed venues first.')
    }

    // Helper function to find team by name
    const findTeamByName = (name: string) => {
      const teamName = name.toLowerCase().replace(/[^a-z0-9]/g, '-')
      return teams.find(t => t.name.toLowerCase().includes(teamName)) || teams[0]
    }

    // Helper function to find venue by name and sport
    const findVenueForMatch = (sportId: string, venueName: string) => {
      const sport = sports.find(s => s.name === sportId)
      if (!sport) return venues[0]

      // Try to find any venue for the sport (since venues don't have names in our selection)
      let venue = venues.find(v => v.sportId === sport.id)

      return venue || venues[0]
    }

    // Create bookings and matches
    const allMatches = [...matches, ...confirmedMatches]

    for (const matchData of allMatches) {
      // Find sport and format
      const sport = sports.find(s => s.name === matchData.sportId) || sports[0]
      const format = formats.find(f => f.name === matchData.formatId) || formats[0]

      // Find teams
      const homeTeam = findTeamByName(matchData.homeTeamId)
      let awayTeam = null

      if (matchData.awayTeamId) {
        awayTeam = findTeamByName(matchData.awayTeamId)
      }

      // Find venue
      const venue = findVenueForMatch(matchData.sportId, matchData.venue)

      // Create booking first
      const booking = await db.booking.create({
        data: {
          vendorId: venue.vendorId,
          venueId: venue.id,
          startTime: matchData.startTime,
          endTime: matchData.endTime,
          duration: Math.round((matchData.endTime.getTime() - matchData.startTime.getTime()) / (1000 * 60 * 60)),
          totalAmount: matchData.totalAmount,
          status: matchData.status === 'COMPLETED' ? 'COMPLETED' : 'CONFIRMED',
          bookingType: 'MATCH',
          notes: `Match booking: ${matchData.title}`,
          customerName: `${homeTeam.name} (Team)`,
          customerPhone: '+91 00000 00000'
        }
      })

      // Create match
      const match = await db.match.create({
        data: {
          bookingId: booking.id,
          sportId: sport.id,
          formatId: format.id,
          maxPlayers: matchData.maxPlayers,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam?.id,
          status: matchData.status,
          title: matchData.title,
          description: matchData.description,
          homeScore: matchData.homeScore,
          awayScore: matchData.awayScore
        }
      })

      console.log(`✅ Created match: ${match.title} (${match.status})`)
    }

    console.log('✅ Matches seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding matches:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  seedMatches()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}