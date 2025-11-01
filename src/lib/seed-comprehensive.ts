import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Real-world sports facility data based on research
const comprehensiveSportsData = [
  // Football/Soccer
  { name: 'football', displayName: 'Football', icon: '⚽', description: 'Association football/soccer', teamSize: 11, duration: 90 },
  { name: 'futsal', displayName: 'Futsal', icon: '🏐', description: '5-a-side indoor football', teamSize: 5, duration: 40 },
  { name: 'beach-soccer', displayName: 'Beach Soccer', icon: '🏖️', description: 'Beach football', teamSize: 5, duration: 36 },

  // Cricket
  { name: 'cricket-t20', displayName: 'Cricket T20', icon: '🏏', description: 'Twenty20 cricket format', teamSize: 11, duration: 120 },
  { name: 'cricket-odi', displayName: 'Cricket ODI', icon: '🏏', description: 'One Day International cricket', teamSize: 11, duration: 300 },
  { name: 'cricket-test', displayName: 'Test Cricket', icon: '🏏', description: 'Test match cricket', teamSize: 11, duration: 420 },
  { name: 'tennis-cricket', displayName: 'Tennis Cricket', icon: '🏏', description: 'Short format cricket', teamSize: 8, duration: 60 },

  // Basketball
  { name: 'basketball', displayName: 'Basketball', icon: '🏀', description: 'Basketball 5v5', teamSize: 5, duration: 40 },
  { name: 'basketball-3x3', displayName: '3x3 Basketball', icon: '🏀', description: '3x3 basketball format', teamSize: 3, duration: 10 },

  // Tennis & Racquet Sports
  { name: 'tennis', displayName: 'Tennis', icon: '🎾', description: 'Lawn tennis', teamSize: 2, duration: 90 },
  { name: 'badminton', displayName: 'Badminton', icon: '🏸', description: 'Badminton singles/doubles', teamSize: 2, duration: 45 },
  { name: 'squash', displayName: 'Squash', icon: '🎾', description: 'Squash racquet sport', teamSize: 2, duration: 40 },
  { name: 'table-tennis', displayName: 'Table Tennis', icon: '🏓', description: 'Table tennis/Ping pong', teamSize: 2, duration: 30 },
  { name: 'pickleball', displayName: 'Pickleball', icon: '🏓', description: 'Pickleball sport', teamSize: 2, duration: 45 },

  // Volleyball
  { name: 'volleyball', displayName: 'Volleyball', icon: '🏐', description: 'Indoor volleyball 6v6', teamSize: 6, duration: 60 },
  { name: 'beach-volleyball', displayName: 'Beach Volleyball', icon: '🏖️', description: 'Beach volleyball 2v2', teamSize: 2, duration: 45 },

  // Baseball/Softball
  { name: 'baseball', displayName: 'Baseball', icon: '⚾', description: 'Baseball', teamSize: 9, duration: 150 },
  { name: 'softball', displayName: 'Softball', icon: '⚾', description: 'Softball', teamSize: 10, duration: 120 },

  // Hockey
  { name: 'field-hockey', displayName: 'Field Hockey', icon: '🏑', description: 'Field hockey', teamSize: 11, duration: 70 },
  { name: 'ice-hockey', displayName: 'Ice Hockey', icon: '🏒', description: 'Ice hockey', teamSize: 6, duration: 60 },
  { name: 'roller-hockey', displayName: 'Roller Hockey', icon: '🛼', description: 'Roller hockey', teamSize: 5, duration: 45 },
  { name: 'street-hockey', displayName: 'Street Hockey', icon: '🏒', description: 'Street hockey', teamSize: 6, duration: 60 },

  // Swimming & Water Sports
  { name: 'swimming', displayName: 'Swimming', icon: '🏊', description: 'Competitive swimming', teamSize: 4, duration: 60 },
  { name: 'water-polo', displayName: 'Water Polo', icon: '🤽', description: 'Water polo', teamSize: 7, duration: 32 },

  // Combat Sports
  { name: 'boxing', displayName: 'Boxing', icon: '🥊', description: 'Boxing', teamSize: 2, duration: 36 },
  { name: 'wrestling', displayName: 'Wrestling', icon: '🤼', description: 'Wrestling', teamSize: 2, duration: 36 },
  { name: 'martial-arts', displayName: 'Martial Arts', icon: '🥋', description: 'Mixed martial arts', teamSize: 2, duration: 30 },
  { name: 'taekwondo', displayName: 'Taekwondo', icon: '🥋', description: 'Taekwondo', teamSize: 2, duration: 30 },
  { name: 'karate', displayName: 'Karate', icon: '🥋', description: 'Karate', teamSize: 2, duration: 30 },
  { name: 'judo', displayName: 'Judo', icon: '🥋', description: 'Judo', teamSize: 2, duration: 30 },

  // Fitness & Other Sports
  { name: 'gymnastics', displayName: 'Gymnastics', icon: '🤸', description: 'Gymnastics', teamSize: 6, duration: 120 },
  { name: 'athletics', displayName: 'Athletics', icon: '🏃', description: 'Track and field', teamSize: 20, duration: 120 },
  { name: 'crossfit', displayName: 'CrossFit', icon: '💪', description: 'CrossFit training', teamSize: 12, duration: 60 },
  { name: 'yoga', displayName: 'Yoga', icon: '🧘', description: 'Yoga classes', teamSize: 20, duration: 60 },
  { name: 'pilates', displayName: 'Pilates', icon: '🧘', description: 'Pilates classes', teamSize: 15, duration: 50 },

  // Emerging Sports
  { name: 'e-sports', displayName: 'E-Sports', icon: '🎮', description: 'Competitive gaming', teamSize: 5, duration: 45 },
  { name: 'ultimate-frisbee', displayName: 'Ultimate Frisbee', icon: '🥏', description: 'Ultimate frisbee', teamSize: 7, duration: 70 },
  { name: 'laser-tag', displayName: 'Laser Tag', icon: '🔫', description: 'Laser tag arena', teamSize: 10, duration: 45 },
  { name: 'paintball', displayName: 'Paintball', icon: '🎨', description: 'Paintball', teamSize: 10, duration: 60 },
  { name: 'rock-climbing', displayName: 'Rock Climbing', icon: '🧗', description: 'Indoor rock climbing', teamSize: 8, duration: 90 },
  { name: 'skateboarding', displayName: 'Skateboarding', icon: '🛹', description: 'Skateboarding', teamSize: 10, duration: 60 },
  { name: 'bouldering', displayName: 'Bouldering', icon: '🧗', description: 'Bouldering', teamSize: 8, duration: 90 },

  // Traditional Sports
  { name: 'archery', displayName: 'Archery', icon: '🏹', description: 'Archery', teamSize: 8, duration: 90 },
  { name: 'golf', displayName: 'Golf', icon: '⛳', description: 'Golf', teamSize: 4, duration: 240 },
  { name: 'bowling', displayName: 'Bowling', icon: '🎳', description: 'Bowling', teamSize: 6, duration: 90 },
  { name: 'darts', displayName: 'Darts', icon: '🎯', description: 'Darts', teamSize: 8, duration: 60 },
  { name: 'billiards', displayName: 'Billiards', icon: '🎱', description: 'Pool/Billiards', teamSize: 4, duration: 90 },
  { name: 'shuffleboard', displayName: 'Shuffleboard', icon: '🎯', description: 'Shuffleboard', teamSize: 4, duration: 45 }
]

const vendorsData = [
  // Multi-sport complexes
  {
    name: 'SportsArena Complex',
    slug: 'sportsarena',
    description: 'Premium multi-sport facility with world-class amenities',
    email: 'info@sportsarena.com',
    phone: '+1-555-0123',
    website: 'https://sportsarena.com',
    logoUrl: 'https://example.com/logos/sportsarena.png',
    countryCode: 'US',
    currencyCode: 'USD',
    timezone: 'America/New_York',
    locale: 'en-US',
    primaryColor: '#1e40af',
    secondaryColor: '#3b82f6',
    accentColor: '#f59e0b',
    address: '1234 Sports Boulevard, New York, NY 10001',
    city: 'New York',
    area: 'Manhattan'
  },
  {
    name: 'Elite Sports Club',
    slug: 'elitesports',
    description: 'Luxury sports and fitness club',
    email: 'contact@elitesports.com',
    phone: '+1-555-0456',
    website: 'https://elitesports.com',
    logoUrl: 'https://example.com/logos/elitesports.png',
    countryCode: 'US',
    currencyCode: 'USD',
    timezone: 'America/Los_Angeles',
    locale: 'en-US',
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    accentColor: '#f59e0b',
    address: '5678 Fitness Lane, Los Angeles, CA 90001',
    city: 'Los Angeles',
    area: 'Beverly Hills'
  },
  {
    name: 'Community Recreation Center',
    slug: 'communityrec',
    description: 'Affordable community sports facility',
    email: 'recreation@communityrec.gov',
    phone: '+1-555-0789',
    website: 'https://communityrec.gov',
    logoUrl: 'https://example.com/logos/communityrec.png',
    countryCode: 'US',
    currencyCode: 'USD',
    timezone: 'America/Chicago',
    locale: 'en-US',
    primaryColor: '#dc2626',
    secondaryColor: '#ef4444',
    accentColor: '#fbbf24',
    address: '9012 Park Avenue, Chicago, IL 60601',
    city: 'Chicago',
    area: 'Lincoln Park'
  },
  {
    name: 'Urban Athletic Hub',
    slug: 'urbanathletic',
    description: 'Modern urban sports facility for millennials',
    email: 'hello@urbanathletic.com',
    phone: '+1-555-0234',
    website: 'https://urbanathletic.com',
    logoUrl: 'https://example.com/logos/urbanathletic.png',
    countryCode: 'US',
    currencyCode: 'USD',
    timezone: 'America/Denver',
    locale: 'en-US',
    primaryColor: '#7c3aed',
    secondaryColor: '#8b5cf6',
    accentColor: '#ec4899',
    address: '3456 Downtown Street, Denver, CO 80201',
    city: 'Denver',
    area: 'LoDo'
  },
  {
    name: 'Tropical Sports Paradise',
    slug: 'tropicalsports',
    description: 'Beachfront sports facility in Miami',
    email: 'info@tropicalsports.com',
    phone: '+1-555-0345',
    website: 'https://tropicalsports.com',
    logoUrl: 'https://example.com/logos/tropicalsports.png',
    countryCode: 'US',
    currencyCode: 'USD',
    timezone: 'America/New_York',
    locale: 'en-US',
    primaryColor: '#0891b2',
    secondaryColor: '#06b6d4',
    accentColor: '#fbbf24',
    address: '7890 Ocean Drive, Miami Beach, FL 33139',
    city: 'Miami',
    area: 'South Beach'
  },
  {
    name: 'Mountain Peak Sports',
    slug: 'mountainpeak',
    description: 'High-altitude sports training center',
    email: 'info@mountainpeak.com',
    phone: '+1-555-0567',
    website: 'https://mountainpeak.com',
    logoUrl: 'https://example.com/logos/mountainpeak.png',
    countryCode: 'US',
    currencyCode: 'USD',
    timezone: 'America/Denver',
    locale: 'en-US',
    primaryColor: '#16a34a',
    secondaryColor: '#22c55e',
    accentColor: '#f59e0b',
    address: '2468 Mountain View Road, Boulder, CO 80301',
    city: 'Boulder',
    area: 'Flatirons'
  },
  {
    name: 'Desert Sports Complex',
    slug: 'desertsports',
    description: 'State-of-the-art desert sports facility',
    email: 'contact@desertsports.com',
    phone: '+1-555-0678',
    website: 'https://desertsports.com',
    logoUrl: 'https://example.com/logos/desertsports.png',
    countryCode: 'US',
    currencyCode: 'USD',
    timezone: 'America/Phoenix',
    locale: 'en-US',
    primaryColor: '#ea580c',
    secondaryColor: '#f97316',
    accentColor: '#dc2626',
    address: '8901 Cactus Way, Phoenix, AZ 85001',
    city: 'Phoenix',
    area: 'Scottsdale'
  },
  {
    name: 'Pacific Rim Sports',
    slug: 'pacificrim',
    description: 'Asian-inspired sports and wellness center',
    email: 'hello@pacificrim.com',
    phone: '+1-555-0890',
    website: 'https://pacificrim.com',
    logoUrl: 'https://example.com/logos/pacificrim.png',
    countryCode: 'US',
    currencyCode: 'USD',
    timezone: 'America/Los_Angeles',
    locale: 'en-US',
    primaryColor: '#b91c1c',
    secondaryColor: '#ef4444',
    accentColor: '#f59e0b',
    address: '1234 Pacific Coast Highway, San Francisco, CA 94102',
    city: 'San Francisco',
    area: 'Marina District'
  }
]

// Format types for each sport
const formatTypesData = [
  // Football formats
  { sportName: 'football', formats: [
    { name: '11v11', displayName: 'Full Pitch 11v11', minPlayers: 11, maxPlayers: 22 },
    { name: '7v7', displayName: 'Small Pitch 7v7', minPlayers: 7, maxPlayers: 14 },
    { name: '5v5', displayName: 'Mini Pitch 5v5', minPlayers: 5, maxPlayers: 10 }
  ]},
  { sportName: 'futsal', formats: [
    { name: '5v5', displayName: 'Futsal 5v5', minPlayers: 5, maxPlayers: 10 },
    { name: '4v4', displayName: 'Futsal 4v4', minPlayers: 4, maxPlayers: 8 }
  ]},

  // Cricket formats
  { sportName: 'cricket-t20', formats: [
    { name: 'T20', displayName: 'T20 Cricket', minPlayers: 11, maxPlayers: 22 },
    { name: 'Super-Over', displayName: 'Super Over', minPlayers: 2, maxPlayers: 4 }
  ]},
  { sportName: 'cricket-odi', formats: [
    { name: 'ODI', displayName: 'One Day Cricket', minPlayers: 11, maxPlayers: 22 }
  ]},
  { sportName: 'tennis-cricket', formats: [
    { name: '8-a-side', displayName: 'Tennis Cricket 8v8', minPlayers: 8, maxPlayers: 16 },
    { name: '6-a-side', displayName: 'Tennis Cricket 6v6', minPlayers: 6, maxPlayers: 12 }
  ]},

  // Basketball formats
  { sportName: 'basketball', formats: [
    { name: '5v5', displayName: 'Full Court 5v5', minPlayers: 5, maxPlayers: 10 },
    { name: '4v4', displayName: 'Half Court 4v4', minPlayers: 4, maxPlayers: 8 },
    { name: '3v3', displayName: '3x3 Basketball', minPlayers: 3, maxPlayers: 6 }
  ]},
  { sportName: 'basketball-3x3', formats: [
    { name: '3x3', displayName: '3x3 Basketball', minPlayers: 3, maxPlayers: 6 },
    { name: '2v2', displayName: '2v2 Basketball', minPlayers: 2, maxPlayers: 4 }
  ]},

  // Tennis formats
  { sportName: 'tennis', formats: [
    { name: 'singles', displayName: 'Singles', minPlayers: 1, maxPlayers: 2 },
    { name: 'doubles', displayName: 'Doubles', minPlayers: 2, maxPlayers: 4 },
    { name: 'mixed-doubles', displayName: 'Mixed Doubles', minPlayers: 2, maxPlayers: 4 }
  ]},

  // Badminton formats
  { sportName: 'badminton', formats: [
    { name: 'singles', displayName: 'Singles', minPlayers: 1, maxPlayers: 2 },
    { name: 'doubles', displayName: 'Doubles', minPlayers: 2, maxPlayers: 4 },
    { name: 'mixed-doubles', displayName: 'Mixed Doubles', minPlayers: 2, maxPlayers: 4 }
  ]},

  // Volleyball formats
  { sportName: 'volleyball', formats: [
    { name: '6v6', displayName: 'Indoor 6v6', minPlayers: 6, maxPlayers: 12 },
    { name: '4v4', displayName: 'Small Court 4v4', minPlayers: 4, maxPlayers: 8 }
  ]},
  { sportName: 'beach-volleyball', formats: [
    { name: '2v2', displayName: 'Beach 2v2', minPlayers: 2, maxPlayers: 4 },
    { name: '4v4', displayName: 'Beach 4v4', minPlayers: 4, maxPlayers: 8 }
  ]},

  // Swimming formats
  { sportName: 'swimming', formats: [
    { name: '50m', displayName: '50m Lane', minPlayers: 4, maxPlayers: 8 },
    { name: '25m', displayName: '25m Lane', minPlayers: 6, maxPlayers: 12 },
    { name: 'sprint', displayName: 'Sprint Events', minPlayers: 8, maxPlayers: 16 }
  ]}
]

async function seedComprehensiveData() {
  console.log('🚀 Starting comprehensive sports facility data seeding...')

  try {
    // Clear existing data in correct order (respecting foreign keys)
    console.log('🗑️  Clearing existing data...')

    // Clear in dependency order
    await db.playerContribution.deleteMany()
    await db.playerSkill.deleteMany()
    await db.teamInvite.deleteMany()
    await db.tournamentParticipant.deleteMany()
    await db.matchResult.deleteMany()
    await db.payment.deleteMany()
    await db.booking.deleteMany()
    await db.match.deleteMany()
    await db.tournament.deleteMany()
    await db.team.deleteMany()
    await db.court.deleteMany()
    await db.vendorSettings.deleteMany()
    await db.vendorStaff.deleteMany()
    await db.domain.deleteMany()
    await db.venue.deleteMany()
    await db.vendor.deleteMany()
    await db.formatType.deleteMany()
    await db.sportType.deleteMany()
    await db.user.deleteMany()

    console.log('✅ Existing data cleared')

    // Seed sports
    console.log('⚽ Seeding sports types...')
    const createdSports = {}
    for (const sport of comprehensiveSportsData) {
      const createdSport = await db.sportType.create({
        data: sport
      })
      createdSports[sport.name] = createdSport
      console.log(`  ✓ Created ${sport.displayName} (${sport.icon})`)
    }

    // Seed format types
    console.log('📋 Seeding format types...')
    const createdFormats = {}
    for (const sportFormat of formatTypesData) {
      if (createdSports[sportFormat.sportName]) {
        let firstFormatId = null
        for (const format of sportFormat.formats) {
          const createdFormat = await db.formatType.create({
            data: {
              ...format,
              sportId: createdSports[sportFormat.sportName].id
            }
          })
          if (!firstFormatId) {
            firstFormatId = createdFormat.id
          }
        }
        createdFormats[sportFormat.sportName] = firstFormatId
        console.log(`  ✓ Created formats for ${createdSports[sportFormat.sportName].displayName}`)
      }
    }

    // Seed vendors
    console.log('🏢 Seeding vendors...')
    const createdVendors = {}
    for (const vendor of vendorsData) {
      const createdVendor = await db.vendor.create({
        data: {
          name: vendor.name,
          slug: vendor.slug,
          description: vendor.description,
          email: vendor.email,
          phone: vendor.phone,
          logoUrl: vendor.logoUrl,
          website: vendor.website,
          countryCode: vendor.countryCode,
          currencyCode: vendor.currencyCode,
          timezone: vendor.timezone,
          locale: vendor.locale,
          primaryColor: vendor.primaryColor,
          secondaryColor: vendor.secondaryColor,
          accentColor: vendor.accentColor,
          isActive: true
        }
      })
      createdVendors[vendor.slug] = createdVendor

      // Create vendor settings
      await db.vendorSettings.create({
        data: {
          vendorId: createdVendor.id,
          advanceBookingDays: 30,
          maxConcurrentBookings: 15,
          requiresDeposit: false,
          taxRate: 0.08,
          taxIncluded: true,
          showBookingCalendar: true,
          showPricingPublicly: true,
          allowOnlinePayments: true,
          emailNotifications: true,
          bookingReminders: true,
          newBookingAlerts: true,
          autoApproval: false
        }
      })

      console.log(`  ✓ Created ${vendor.name} (${vendor.slug})`)
    }

    // Create venues for each vendor
    console.log('🏟️ Seeding venues...')
    const venuesData = [
      // SportsArena Complex venues
      { vendorSlug: 'sportsarena', venues: [
        { name: 'Main Arena', courtCount: 12, sportFocus: ['football', 'basketball', 'volleyball'] },
        { name: 'Aquatic Center', courtCount: 8, sportFocus: ['swimming', 'water-polo'] },
        { name: 'Tennis Complex', courtCount: 16, sportFocus: ['tennis', 'badminton', 'squash'] },
        { name: 'Combat Sports Hall', courtCount: 6, sportFocus: ['boxing', 'martial-arts', 'wrestling'] }
      ]},

      // Elite Sports Club venues
      { vendorSlug: 'elitesports', venues: [
        { name: 'Premium Fitness Center', courtCount: 10, sportFocus: ['crossfit', 'yoga', 'pilates', 'gymnastics'] },
        { name: 'Racquet Club', courtCount: 14, sportFocus: ['tennis', 'badminton', 'squash', 'table-tennis'] },
        { name: 'Athletic Field', courtCount: 4, sportFocus: ['football', 'soccer', 'field-hockey'] }
      ]},

      // Community Recreation Center venues
      { vendorSlug: 'communityrec', venues: [
        { name: 'Main Gymnasium', courtCount: 6, sportFocus: ['basketball', 'volleyball', 'badminton'] },
        { name: 'Recreation Field', courtCount: 3, sportFocus: ['baseball', 'softball', 'football'] },
        { name: 'Senior Center', courtCount: 4, sportFocus: ['pickleball', 'table-tennis', 'bowling'] }
      ]},

      // Urban Athletic Hub venues
      { vendorSlug: 'urbanathletic', venues: [
        { name: 'Downtown Sports Complex', courtCount: 8, sportFocus: ['basketball-3x3', 'ultimate-frisbee', 'laser-tag'] },
        { name: 'Climbing Gym', courtCount: 12, sportFocus: ['rock-climbing', 'bouldering'] },
        { name: 'Esports Arena', courtCount: 20, sportFocus: ['e-sports'] }
      ]},

      // Tropical Sports Paradise venues
      { vendorSlug: 'tropicalsports', venues: [
        { name: 'Beach Sports Complex', courtCount: 10, sportFocus: ['beach-volleyball', 'beach-soccer'] },
        { name: 'Water Sports Center', courtCount: 8, sportFocus: ['swimming', 'water-polo'] },
        { name: 'Surf & Skate Park', courtCount: 6, sportFocus: ['skateboarding', 'surfing'] }
      ]},

      // Mountain Peak Sports venues
      { vendorSlug: 'mountainpeak', venues: [
        { name: 'High Altitude Training Center', courtCount: 6, sportFocus: ['athletics', 'crossfit', 'rock-climbing'] },
        { name: 'Mountain Sports Facility', courtCount: 4, sportFocus: ['skiing', 'snowboarding'] }
      ]},

      // Desert Sports Complex venues
      { vendorSlug: 'desertsports', venues: [
        { name: 'Indoor Sports Complex', courtCount: 15, sportFocus: ['basketball', 'volleyball', 'badminton'] },
        { name: 'Golf Club', courtCount: 2, sportFocus: ['golf', 'mini-golf'] },
        { name: 'Desert Racing Track', courtCount: 3, sportFocus: ['go-karting', 'racing'] }
      ]},

      // Pacific Rim Sports venues
      { vendorSlug: 'pacificrim', venues: [
        { name: 'Wellness Center', courtCount: 8, sportFocus: ['yoga', 'pilates', 'martial-arts'] },
        { name: 'Traditional Sports Hall', courtCount: 6, sportFocus: ['archery', 'fencing', 'martial-arts'] },
        { name: 'Modern Sports Facility', courtCount: 10, sportFocus: ['e-sports', 'laser-tag', 'paintball'] }
      ]}
    ]

    const createdVenues = {}
    for (const vendorVenue of venuesData) {
      if (createdVendors[vendorVenue.vendorSlug]) {
        for (const venue of vendorVenue.venues) {
          const createdVenue = await db.venue.create({
            data: {
              name: venue.name,
              description: `Part of ${createdVendors[vendorVenue.vendorSlug].name}`,
              address: vendorsData.find(v => v.slug === vendorVenue.vendorSlug)?.address || '',
              city: vendorsData.find(v => v.slug === vendorVenue.vendorSlug)?.city || '',
              postalCode: '10001',
              countryCode: 'US',
              currencyCode: 'USD',
              featuredImage: `https://example.com/venues/${venue.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
              vendorId: createdVendors[vendorVenue.vendorSlug].id,
              isActive: true
            }
          })
          createdVenues[`${vendorVenue.vendorSlug}-${venue.name}`] = createdVenue
          console.log(`  ✓ Created ${venue.name} for ${createdVendors[vendorVenue.vendorSlug].name}`)
        }
      }
    }

    // Create courts based on venue sport focus
    console.log('🏟️ Seeding courts...')
    let courtNumber = 1

    for (const vendorVenue of venuesData) {
      if (createdVendors[vendorVenue.vendorSlug]) {
        const vendor = vendorsData.find(v => v.slug === vendorVenue.vendorSlug)

        for (const venue of vendorVenue.venues) {
          const venueKey = `${vendorVenue.vendorSlug}-${venue.name}`
          if (createdVenues[venueKey]) {

            for (const sportName of venue.sportFocus) {
              if (createdSports[sportName]) {
                const sport = createdSports[sportName]
                const dbVenue = createdVenues[venueKey]

                // Skip if we don't have a format for this sport
                if (!createdFormats[sportName]) {
                  console.log(`  ⚠️  No format found for ${sport.displayName}, skipping court creation`)
                  continue
                }

                // Create multiple courts for each sport at this venue
                const courtsPerSport = Math.floor(venue.courtCount / venue.sportFocus.length)

                for (let i = 0; i < courtsPerSport; i++) {
                  const currentCourtNumber = courtNumber++
                  await db.court.create({
                    data: {
                      venueId: dbVenue.id,
                      sportId: sport.id,
                      formatId: createdFormats[sportName],
                      courtNumber: currentCourtNumber.toString(),
                      name: `${sport.displayName} Court ${currentCourtNumber}`,
                      description: `${sport.displayName} court at ${venue.name}`,
                      pricePerHour: Math.floor(Math.random() * 200) + 50, // $50-$250 per hour
                      maxPlayers: sport.teamSize * 2, // Home and away teams
                      features: JSON.stringify([
                        'professional',
                        'climate-controlled',
                        'changing-rooms',
                        'parking',
                        'equipment-rental',
                        'coaching-available'
                      ]),
                      isActive: true
                    }
                  })
                }
              }
            }
          }
        }
      }
    }

    console.log('✅ Seeding completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`  - Sports: ${comprehensiveSportsData.length}`)
    console.log(`  - Vendors: ${vendorsData.length}`)
    console.log(`  - Total Courts: ${courtNumber - 1}`)

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

// Run the seeding function
if (require.main === module) {
  seedComprehensiveData()
    .then(() => {
      console.log('🎉 Comprehensive seeding completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
}

export default seedComprehensiveData