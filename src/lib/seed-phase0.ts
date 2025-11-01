/**
 * Phase 0 seed data - Basic data needed for initial development
 * This creates a minimal set of data for development and testing
 */

import { seedUtils, SEED_CONSTANTS, prisma } from './seed-utils';

async function seedPhase0() {
  console.log('🌱 Seeding Phase 0 basic data...\n');

  try {
    // Clean database first
    console.log('🧹 Cleaning existing data...');
    await seedUtils.cleanDatabase();

    // Seed basic sport types
    console.log('⚽ Seeding sport types...');
    const sportTypes = [
      { name: 'soccer', displayName: 'Soccer', icon: '⚽' },
      { name: 'basketball', displayName: 'Basketball', icon: '🏀' },
      { name: 'badminton', displayName: 'Badminton', icon: '🏸' },
    ];

    for (const sportType of sportTypes) {
      await prisma.sportType.upsert({
        where: { name: sportType.name },
        update: sportType,
        create: sportType,
      });
    }

    // Seed basic format types
    console.log('📋 Seeding format types...');
    const soccerSport = await prisma.sportType.findUnique({ where: { name: 'soccer' } });
    const basketballSport = await prisma.sportType.findUnique({ where: { name: 'basketball' } });
    const badmintonSport = await prisma.sportType.findUnique({ where: { name: 'badminton' } });

    if (soccerSport) {
      const soccerFormats = [
        { sportId: soccerSport.id, name: '5-a-side', displayName: '5-a-side', minPlayers: 5, maxPlayers: 10 },
        { sportId: soccerSport.id, name: '7-a-side', displayName: '7-a-side', minPlayers: 7, maxPlayers: 14 },
      ];

      for (const format of soccerFormats) {
        await prisma.formatType.upsert({
          where: { sportId_name: { sportId: format.sportId, name: format.name } },
          update: format,
          create: format,
        });
      }
    }

    if (basketballSport) {
      const basketballFormats = [
        { sportId: basketballSport.id, name: '3x3', displayName: '3x3', minPlayers: 3, maxPlayers: 6 },
        { sportId: basketballSport.id, name: '5v5', displayName: '5v5', minPlayers: 5, maxPlayers: 10 },
      ];

      for (const format of basketballFormats) {
        await prisma.formatType.upsert({
          where: { sportId_name: { sportId: format.sportId, name: format.name } },
          update: format,
          create: format,
        });
      }
    }

    if (badmintonSport) {
      const badmintonFormats = [
        { sportId: badmintonSport.id, name: 'singles', displayName: 'Singles', minPlayers: 1, maxPlayers: 2 },
        { sportId: badmintonSport.id, name: 'doubles', displayName: 'Doubles', minPlayers: 2, maxPlayers: 4 },
      ];

      for (const format of badmintonFormats) {
        await prisma.formatType.upsert({
          where: { sportId_name: { sportId: format.sportId, name: format.name } },
          update: format,
          create: format,
        });
      }
    }

    // Seed demo vendor
    console.log('🏪 Seeding demo vendor...');
    const vendor = await prisma.vendor.create({
      data: {
        name: 'Demo Sports Complex',
        slug: 'demo-sports',
        description: 'A demo venue for Phase 0 testing',
        phone: '+1234567890',
        email: 'demo@example.com',
        country: 'US',
        timezone: 'America/New_York',
        locale: 'en-US',
      },
    });

    // Seed vendor settings
    console.log('⚙️ Seeding vendor settings...');
    await prisma.vendorSettings.create({
      data: {
        vendorId: vendor.id,
        currency: 'USD',
        currencySymbol: '$',
        showBookingCalendar: true,
        showPricingPublicly: true,
        allowOnlinePayments: true,
        emailNotifications: true,
        bookingReminders: true,
        newBookingAlerts: true,
      },
    });

    // Seed demo venue
    console.log('🏟️ Seeding demo venue...');
    const venue = await prisma.venue.create({
      data: {
        vendorId: vendor.id,
        name: 'Demo Court 1',
        courtNumber: 'Court 1',
        description: 'Demo soccer court for testing',
        address: '123 Demo Street',
        city: 'Demo City',
        country: 'US',
        postalCode: '12345',
        latitude: 40.7128,
        longitude: -74.0060,
        pricePerHour: 50,
        maxPlayers: 10,
        isActive: true,
      },
    });

    // Seed venue availability
    console.log('📅 Seeding venue availability...');
    for (let day = 0; day < 7; day++) {
      await prisma.venueAvailability.upsert({
        where: { venueId_dayOfWeek: { venueId: venue.id, dayOfWeek: day } },
        update: {
          openingTime: '06:00',
          closingTime: '22:00',
          isAvailable: true,
        },
        create: {
          venueId: venue.id,
          dayOfWeek: day,
          openingTime: '06:00',
          closingTime: '22:00',
          isAvailable: true,
        },
      });
    }

    // Seed admin user
    console.log('👤 Seeding admin user...');
    const adminPassword = await seedUtils.hashPassword(SEED_CONSTANTS.ADMIN_PASSWORD);

    await prisma.user.upsert({
      where: { email: SEED_CONSTANTS.ADMIN_EMAIL },
      update: {},
      create: {
        id: seedUtils.generateId(),
        email: SEED_CONSTANTS.ADMIN_EMAIL,
        name: 'System Administrator',
        password: adminPassword,
        phone: '+1234567890',
        role: 'PLATFORM_ADMIN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Seed test users
    console.log('👥 Seeding test users...');
    for (let i = 1; i <= 3; i++) {
      const password = await seedUtils.hashPassword('password123');

      await prisma.user.upsert({
        where: { email: `user${i}@test.com` },
        update: {},
        create: {
          id: seedUtils.generateId(),
          email: `user${i}@test.com`,
          name: `Test User ${i}`,
          password,
          phone: `+123456789${i}`,
          role: 'CUSTOMER',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Get stats
    const stats = await seedUtils.getStats();
    console.log('\n📊 Database stats:', stats);

    console.log('\n🎉 Phase 0 seeding completed successfully!');
    console.log('\n🔑 Login credentials:');
    console.log(`   Admin: ${SEED_CONSTANTS.ADMIN_EMAIL} / ${SEED_CONSTANTS.ADMIN_PASSWORD}`);
    console.log('   Users: user1@test.com / password123');
    console.log('           user2@test.com / password123');
    console.log('           user3@test.com / password123');

  } catch (error) {
    console.error('\n❌ Error during Phase 0 seeding:', error);
    throw error;
  } finally {
    await seedUtils.disconnect();
  }
}

// Export for use in npm scripts
export { seedPhase0 };

// Run if called directly
if (require.main === module) {
  seedPhase0().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}