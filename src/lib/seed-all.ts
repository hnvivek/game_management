import { seedUtils, SEED_CONSTANTS, prisma } from './seed-utils';

/**
 * Comprehensive seed data script for the sports venue booking platform
 * This creates all the necessary data for development and testing
 */

async function seedCountries() {
  console.log('🌍 Seeding countries...');

  const countries = [
    { code: 'US', name: 'United States', currencyCode: 'USD' },
    { code: 'GB', name: 'United Kingdom', currencyCode: 'GBP' },
    { code: 'AE', name: 'United Arab Emirates', currencyCode: 'AED' },
    { code: 'IN', name: 'India', currencyCode: 'INR' },
    { code: 'CA', name: 'Canada', currencyCode: 'CAD' },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: country,
    });
  }

  console.log(`✅ Created ${countries.length} countries`);
}

async function seedCurrencies() {
  console.log('💰 Seeding currencies...');

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
    { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2 },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2 },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2 },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2 },
  ];

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: {},
      create: currency,
    });
  }

  console.log(`✅ Created ${currencies.length} currencies`);
}

async function seedSports() {
  console.log('⚽ Seeding sports...');

  const sports = [
    { name: 'Football', teamSize: 11, durationMinutes: 90 },
    { name: 'Basketball', teamSize: 5, durationMinutes: 48 },
    { name: 'Cricket', teamSize: 11, durationMinutes: 360 },
    { name: 'Tennis', teamSize: 2, durationMinutes: 90 },
    { name: 'Badminton', teamSize: 2, durationMinutes: 45 },
    { name: 'Volleyball', teamSize: 6, durationMinutes: 60 },
    { name: 'Table Tennis', teamSize: 2, durationMinutes: 30 },
    { name: 'Squash', teamSize: 2, durationMinutes: 40 },
    { name: 'Swimming', teamSize: 1, durationMinutes: 60 },
    { name: 'Golf', teamSize: 1, durationMinutes: 240 },
  ];

  for (const sport of sports) {
    await prisma.sport.upsert({
      where: { name: sport.name },
      update: {},
      create: sport,
    });
  }

  console.log(`✅ Created ${sports.length} sports`);
}

async function seedUsers() {
  console.log('👥 Seeding users...');

  // Create admin user
  const adminPassword = await seedUtils.hashPassword(SEED_CONSTANTS.ADMIN_PASSWORD);

  const adminUser = await prisma.user.upsert({
    where: { email: SEED_CONSTANTS.ADMIN_EMAIL },
    update: {},
    create: {
      id: seedUtils.generateId(),
      email: SEED_CONSTANTS.ADMIN_EMAIL,
      name: 'System Administrator',
      password: adminPassword,
      phone: seedUtils.randomPhoneNumber(),
      isEmailVerified: true,
      isActive: true,
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create regular users
  const regularUsers = [];
  for (let i = 0; i < 20; i++) { // Reduced for demo
    const password = await seedUtils.hashPassword('password123');
    const user = await prisma.user.create({
      data: {
        id: seedUtils.generateId(),
        email: `user${i + 1}@example.com`,
        name: `Test User ${i + 1}`,
        password,
        phone: seedUtils.randomPhoneNumber(),
        dateOfBirth: seedUtils.randomPastDate(365 * 30), // 30 years ago
        isEmailVerified: true,
        isActive: true,
        role: 'USER',
        createdAt: seedUtils.randomPastDate(365),
        updatedAt: new Date(),
      },
    });
    regularUsers.push(user);
  }

  console.log(`✅ Created ${regularUsers.length + 1} users`);
  return { adminUser, regularUsers };
}

async function seedVendors() {
  console.log('🏪 Seeding vendors...');

  const vendors = [];
  for (let i = 0; i < 5; i++) { // Reduced for demo
    const vendor = await prisma.vendor.create({
      data: {
        id: seedUtils.generateId(),
        name: `Vendor ${i + 1}`,
        email: `vendor${i + 1}@example.com`,
        phone: seedUtils.randomPhoneNumber(),
        address: `${i + 1} Main Street`,
        city: seedUtils.randomChoice(['New York', 'London', 'Dubai']),
        countryCode: seedUtils.randomChoice(['US', 'GB', 'AE']),
        postalCode: `1000${i}`,
        taxId: `TAX${i + 1}`,
        registrationNumber: `REG${i + 1}`,
        contactPerson: `Contact Person ${i + 1}`,
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    vendors.push(vendor);
  }

  console.log(`✅ Created ${vendors.length} vendors`);
  return vendors;
}

async function seedVenues(vendors: any[]) {
  console.log('🏟️ Seeding venues...');

  const venues = [];
  for (let i = 0; i < 10; i++) { // Reduced for demo
    const vendor = seedUtils.randomChoice(vendors);
    const city = vendor.city;

    // Map of city to timezone
    const cityTimezones: { [key: string]: string } = {
      'New York': 'America/New_York',
      'London': 'Europe/London',
      'Dubai': 'Asia/Dubai',
      'Toronto': 'America/Toronto',
      'Mumbai': 'Asia/Kolkata'
    };

    // Map of city to currency
    const cityCurrencies: { [key: string]: string } = {
      'New York': 'USD',
      'London': 'GBP',
      'Dubai': 'AED',
      'Toronto': 'CAD',
      'Mumbai': 'INR'
    };

    const venue = await prisma.venue.create({
      data: {
        id: seedUtils.generateId(),
        vendorId: vendor.id,
        name: `Venue ${i + 1}`,
        description: `Description for venue ${i + 1}`,
        address: `${i + 1} Venue Street`,
        city,
        countryCode: vendor.countryCode,
        currencyCode: cityCurrencies[city] || 'USD',
        timezone: cityTimezones[city] || 'UTC',
        postalCode: `2000${i}`,
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
        phone: seedUtils.randomPhoneNumber(),
        email: `venue${i + 1}@example.com`,
        features: ['Parking', 'Showers', 'Lockers'],
        averageRating: 4.0 + Math.random(),
        totalReviews: Math.floor(Math.random() * 100),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    venues.push(venue);
  }

  console.log(`✅ Created ${venues.length} venues`);
  return venues;
}

async function seedCourts(venues: any[]) {
  console.log('🎾 Seeding courts...');

  const sports = await prisma.sport.findMany();
  const courts = [];

  for (const venue of venues) {
    const courtCount = Math.floor(Math.random() * 3) + 1; // 1-3 courts per venue

    for (let i = 0; i < courtCount; i++) {
      const sport = seedUtils.randomChoice(sports);
      const court = await prisma.court.create({
        data: {
          id: seedUtils.generateId(),
          venueId: venue.id,
          sportId: sport.id,
          name: `Court ${i + 1}`,
          description: `Description for court ${i + 1}`,
          surface: 'Hard Court',
          pricePerHour: 50 + Math.random() * 100,
          maxPlayers: sport.teamSize * 2,
          features: ['LED Lighting', 'Scoreboard'],
          images: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      courts.push(court);
    }
  }

  console.log(`✅ Created ${courts.length} courts`);
  return courts;
}

async function seedTeams(users: any[]) {
  console.log('👯 Seeding teams...');

  const sports = await prisma.sport.findMany();
  const teams = [];

  for (let i = 0; i < 8; i++) {
    const sport = seedUtils.randomChoice(sports);
    const captain = seedUtils.randomChoice(users);

    const team = await prisma.team.create({
      data: {
        id: seedUtils.generateId(),
        name: `Team ${i + 1}`,
        description: `Description for team ${i + 1}`,
        sportId: sport.id,
        captainId: captain.id,
        homeCity: seedUtils.randomChoice(['New York', 'London', 'Dubai']),
        foundedYear: 2020 + Math.floor(Math.random() * 4),
        teamColor: 'Blue',
        logoUrl: '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    teams.push(team);

    // Add team members
    const memberCount = Math.min(sport.teamSize, users.length);
    const selectedUsers = users.slice(0, memberCount);

    for (const user of selectedUsers) {
      await prisma.teamMembership.create({
        data: {
          id: seedUtils.generateId(),
          teamId: team.id,
          userId: user.id,
          role: user.id === captain.id ? 'CAPTAIN' : 'PLAYER',
          joinedAt: new Date(),
          isActive: true,
        },
      });
    }
  }

  console.log(`✅ Created ${teams.length} teams with memberships`);
  return teams;
}

async function seedMatches(courts: any[], teams: any[], users: any[]) {
  console.log('🏆 Seeding matches...');

  const matches = [];
  for (let i = 0; i < 10; i++) {
    const court = seedUtils.randomChoice(courts);
    const startTime = seedUtils.randomFutureDate(7);
    const { startTime: startHour, endTime: endHour } = seedUtils.randomTimeSlot();

    const matchDate = new Date(startTime);
    matchDate.setHours(parseInt(startHour.split(':')[0]), 0, 0, 0);

    const endTime = new Date(matchDate);
    endTime.setHours(parseInt(endHour.split(':')[0]), 0, 0, 0);

    const homeTeam = seedUtils.randomChoice(teams);
    let awayTeam = seedUtils.randomChoice(teams.filter(t => t.id !== homeTeam.id));

    const match = await prisma.match.create({
      data: {
        id: seedUtils.generateId(),
        courtId: court.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        scheduledStartTime: matchDate,
        scheduledEndTime: endTime,
        status: 'OPEN',
        matchType: 'FRIENDLY',
        notes: `Match ${i + 1} notes`,
        createdBy: seedUtils.randomChoice(users).id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    matches.push(match);
  }

  console.log(`✅ Created ${matches.length} matches`);
  return matches;
}

// Main seeding function
export async function seedAll() {
  console.log('🚀 Starting comprehensive database seeding...\n');

  try {
    // Get initial stats
    const initialStats = await seedUtils.getStats();
    console.log('📊 Initial database stats:', initialStats);
    console.log('');

    // Seed data in correct order (respecting foreign key constraints)
    await seedCountries();
    await seedCurrencies();
    await seedSports();

    const { adminUser, regularUsers } = await seedUsers();
    const vendors = await seedVendors();
    const venues = await seedVenues(vendors);
    const courts = await seedCourts(venues);
    const teams = await seedTeams(regularUsers);
    const matches = await seedMatches(courts, teams, regularUsers);

    // Get final stats
    const finalStats = await seedUtils.getStats();
    console.log('\n📊 Final database stats:', finalStats);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n🔑 Admin credentials:');
    console.log(`   Email: ${SEED_CONSTANTS.ADMIN_EMAIL}`);
    console.log(`   Password: ${SEED_CONSTANTS.ADMIN_PASSWORD}`);

  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    throw error;
  } finally {
    await seedUtils.disconnect();
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedAll().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}