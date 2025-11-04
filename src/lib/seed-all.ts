import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Utility functions
const generateId = () => crypto.randomUUID();
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

// SPORTS DATA
const sportsData = [
  {
    id: 'sport_football',
    name: 'football',
    displayName: 'Football',
    icon: '⚽',
    description: 'Association football, soccer',
    teamSize: 11,
    duration: 90,
    isActive: true
  },
  {
    id: 'sport_basketball',
    name: 'basketball',
    displayName: 'Basketball',
    icon: '🏀',
    description: 'Basketball game',
    teamSize: 5,
    duration: 48,
    isActive: true
  },
  {
    id: 'sport_cricket',
    name: 'cricket',
    displayName: 'Cricket',
    icon: '🏏',
    description: 'Cricket match',
    teamSize: 11,
    duration: 360,
    isActive: true
  },
  {
    id: 'sport_tennis',
    name: 'tennis',
    displayName: 'Tennis',
    icon: '🎾',
    description: 'Tennis match',
    teamSize: 2,
    duration: 90,
    isActive: true
  },
  {
    id: 'sport_badminton',
    name: 'badminton',
    displayName: 'Badminton',
    icon: '🏸',
    description: 'Badminton game',
    teamSize: 2,
    duration: 45,
    isActive: true
  },
  {
    id: 'sport_volleyball',
    name: 'volleyball',
    displayName: 'Volleyball',
    icon: '🏐',
    description: 'Volleyball game',
    teamSize: 6,
    duration: 60,
    isActive: true
  },
  {
    id: 'sport_table_tennis',
    name: 'table-tennis',
    displayName: 'Table Tennis',
    icon: '🏓',
    description: 'Table tennis game',
    teamSize: 2,
    duration: 30,
    isActive: true
  },
  {
    id: 'sport_swimming',
    name: 'swimming',
    displayName: 'Swimming',
    icon: '🏊',
    description: 'Swimming competition',
    teamSize: 1,
    duration: 60,
    isActive: true
  }
];

// FORMAT TYPES DATA
const formatTypesData = [
  // Football formats
  { sportName: 'football', name: '11-a-side', displayName: '11-a-Side', minPlayers: 11, maxPlayers: 22 },
  { sportName: 'football', name: '7-a-side', displayName: '7-a-Side', minPlayers: 7, maxPlayers: 14 },
  { sportName: 'football', name: '5-a-side', displayName: '5-a-Side', minPlayers: 5, maxPlayers: 10 },

  // Basketball formats
  { sportName: 'basketball', name: '5v5', displayName: '5v5 Full Court', minPlayers: 5, maxPlayers: 10 },
  { sportName: 'basketball', name: '3x3', displayName: '3x3 Half Court', minPlayers: 3, maxPlayers: 6 },

  // Cricket formats
  { sportName: 'cricket', name: 'tape-ball', displayName: 'Tape Ball', minPlayers: 11, maxPlayers: 12 },
  { sportName: 'cricket', name: 'tennis-ball', displayName: 'Tennis Ball', minPlayers: 6, maxPlayers: 12 },

  // Badminton formats
  { sportName: 'badminton', name: 'singles', displayName: 'Singles', minPlayers: 1, maxPlayers: 2 },
  { sportName: 'badminton', name: 'doubles', displayName: 'Doubles', minPlayers: 2, maxPlayers: 4 },

  // Other sports
  { sportName: 'tennis', name: 'singles', displayName: 'Singles', minPlayers: 1, maxPlayers: 2 },
  { sportName: 'tennis', name: 'doubles', displayName: 'Doubles', minPlayers: 2, maxPlayers: 4 },
  { sportName: 'table-tennis', name: 'singles', displayName: 'Singles', minPlayers: 1, maxPlayers: 2 },
  { sportName: 'table-tennis', name: 'doubles', displayName: 'Doubles', minPlayers: 2, maxPlayers: 4 },
  { sportName: 'volleyball', name: '6v6', displayName: '6v6', minPlayers: 6, maxPlayers: 12 },
  { sportName: 'swimming', name: 'individual', displayName: 'Individual', minPlayers: 1, maxPlayers: 1 }
];

// VENDORS DATA
const vendorsData = [
  {
    name: '3Lok Sports Hub',
    slug: '3lok',
    email: 'info@3loksports.com',
    phone: '+91 98765 43210',
    website: 'https://www.3loksports.com',
    description: 'Premier sports facility in Whitefield with multiple courts and fields for various sports.',
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    accentColor: '#34D399',
    countryCode: 'IN',
    currencyCode: 'INR',
    timezone: 'Asia/Kolkata',
    locale: 'en-IN'
  },
  {
    name: 'GameHub Pro Sports',
    slug: 'gamehub',
    email: 'hello@gamehubpro.com',
    phone: '+91 98765 54321',
    website: 'https://gamehubpro.com',
    description: 'Professional sports complex with world-class facilities.',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#60A5FA',
    countryCode: 'IN',
    currencyCode: 'INR',
    timezone: 'Asia/Kolkata',
    locale: 'en-IN'
  }
];

// VENUES DATA
const venuesData = [
  {
    name: '3Lok Whitefield',
    description: 'Main sports facility in Whitefield with premium courts',
    address: 'Threelok Football Fitness Hub, Inside Sai Green layout, road next to hp petrol bunk, Belathur- Seegahalli main road, Whitefield - 560066',
    city: 'Bengaluru',
    postalCode: '560066',
    latitude: 12.9698,
    longitude: 77.7500,
    phone: '+91 98765 43210',
    email: 'whitefield@3loksports.com',
    timezone: 'Asia/Kolkata',
    countryCode: 'IN',
    currencyCode: 'INR'
  },
  {
    name: 'GameHub Indiranagar',
    description: 'Professional sports complex in Indiranagar',
    address: '100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
    city: 'Bengaluru',
    postalCode: '560038',
    latitude: 12.9716,
    longitude: 77.6407,
    phone: '+91 98765 54321',
    email: 'indiranagar@gamehubpro.com',
    timezone: 'Asia/Kolkata',
    countryCode: 'IN',
    currencyCode: 'INR'
  }
];

// COURTS DATA
const courtsData = [
  { venueName: '3Lok Whitefield', sportName: 'football', formatName: '5-a-side', courtNumber: 'Turf 1', pricePerHour: 1500, maxPlayers: 10, surface: 'artificial', description: 'Small sided football turf' },
  { venueName: '3Lok Whitefield', sportName: 'football', formatName: '7-a-side', courtNumber: 'Turf 2', pricePerHour: 2600, maxPlayers: 14, surface: 'artificial', description: 'Medium size artificial turf' },
  { venueName: 'GameHub Indiranagar', sportName: 'basketball', formatName: '5v5', courtNumber: 'Court 1', pricePerHour: 2500, maxPlayers: 10, surface: 'hardwood', description: 'Indoor full basketball court with AC' },
  { venueName: 'GameHub Indiranagar', sportName: 'badminton', formatName: 'singles', courtNumber: 'Court 1', pricePerHour: 800, maxPlayers: 2, surface: 'synthetic', description: 'Indoor badminton court with AC' },
  { venueName: '3Lok Whitefield', sportName: 'cricket', formatName: 'tennis-ball', courtNumber: 'Practice Net 1', pricePerHour: 2000, maxPlayers: 12, surface: 'concrete', description: 'Cricket practice nets' }
];

// TEAMS DATA
const teamsData = [
  {
    name: 'Bengaluru Strikers',
    description: 'Passionate soccer team looking for competitive matches',
    sportName: 'football',
    formatName: '5-a-side',
    city: 'Bengaluru',
    maxPlayers: 10,
    minPlayers: 5,
    isRecruiting: true,
    members: [
      { name: 'Rahul Sharma', email: 'rahul.sharma@example.com', phone: '+919876543210', role: 'ADMIN' },
      { name: 'Amit Kumar', email: 'amit.kumar@example.com', phone: '+918765432109', role: 'MEMBER' }
    ]
  },
  {
    name: 'Urban Warriors',
    description: 'Friendly but competitive cricket team',
    sportName: 'cricket',
    formatName: 'tennis-ball',
    city: 'Bengaluru',
    maxPlayers: 12,
    minPlayers: 8,
    isRecruiting: true,
    members: [
      { name: 'Amit Patel', email: 'amit.patel@example.com', phone: '+918765432109', role: 'ADMIN' },
      { name: 'Sanjay Kumar', email: 'sanjay.kumar@example.com', phone: '+917654321098', role: 'MEMBER' }
    ]
  }
];

// SEEDING FUNCTIONS
async function seedSports() {
  console.log('⚽ Seeding sports...');

  for (const sport of sportsData) {
    await prisma.sportType.upsert({
      where: { name: sport.name },
      update: sport,
      create: sport,
    });
  }

  console.log(`✅ Created ${sportsData.length} sports`);
}

async function seedFormatTypes() {
  console.log('📋 Seeding format types...');

  const sports = await prisma.sportType.findMany();
  const sportMap = new Map(sports.map(s => [s.name, s.id]));

  for (const format of formatTypesData) {
    const sportId = sportMap.get(format.sportName);
    if (sportId) {
      await prisma.formatType.upsert({
        where: { sportId_name: { sportId, name: format.name } },
        update: {
          displayName: format.displayName,
          minPlayers: format.minPlayers,
          maxPlayers: format.maxPlayers,
        },
        create: {
          sportId,
          name: format.name,
          displayName: format.displayName,
          minPlayers: format.minPlayers,
          maxPlayers: format.maxPlayers,
        },
      });
    }
  }

  console.log(`✅ Created format types`);
}

async function seedUsers() {
  console.log('👥 Seeding users...');

  const adminPassword = await hashPassword('admin123');

  // Create admin user
  await prisma.user.upsert({
    where: { email: 'admin@venuesystem.com' },
    update: {},
    create: {
      email: 'admin@venuesystem.com',
      name: 'System Administrator',
      password: adminPassword,
      role: 'PLATFORM_ADMIN',
      isActive: true,
      isEmailVerified: true,
    },
  });

  console.log(`✅ Created admin user`);
}

async function seedVendors() {
  console.log('🏪 Seeding vendors...');

  for (const vendor of vendorsData) {
    await prisma.vendor.upsert({
      where: { slug: vendor.slug },
      update: vendor,
      create: vendor,
    });

    // Create vendor settings
    const createdVendor = await prisma.vendor.findUnique({ where: { slug: vendor.slug } });
    if (createdVendor) {
      await prisma.vendorSettings.upsert({
        where: { vendorId: createdVendor.id },
        update: {},
        create: {
          vendorId: createdVendor.id,
          advanceBookingDays: 30,
          maxConcurrentBookings: 10,
          requiresDeposit: false,
          basePrice: 1000,
          taxRate: 18.0,
          taxIncluded: false,
          showBookingCalendar: true,
          showPricingPublicly: true,
          allowOnlinePayments: true,
          emailNotifications: true,
          bookingReminders: true,
          newBookingAlerts: true,
          autoApproval: false,
        },
      });
    }
  }

  console.log(`✅ Created ${vendorsData.length} vendors`);
}

async function seedVenues() {
  console.log('🏟️ Seeding venues...');

  const vendors = await prisma.vendor.findMany();
  const vendorMap = new Map(vendors.map(v => [v.name.split(' ')[0].toLowerCase(), v.id]));

  for (const venue of venuesData) {
    const vendorPrefix = venue.name.split(' ')[0].toLowerCase();
    const vendorId = vendorMap.get(vendorPrefix);

    if (vendorId) {
      // Check if venue already exists
      const existingVenue = await prisma.venue.findFirst({
        where: {
          vendorId,
          name: venue.name
        }
      });

      if (existingVenue) {
        // Update existing venue
        await prisma.venue.update({
          where: { id: existingVenue.id },
          data: venue,
        });
      } else {
        // Create new venue
        await prisma.venue.create({
          data: {
            ...venue,
            vendorId,
          },
        });
      }
    }
  }

  console.log(`✅ Created ${venuesData.length} venues`);
}

async function seedCourts() {
  console.log('🎾 Seeding courts...');

  const venues = await prisma.venue.findMany();
  const venueMap = new Map(venues.map(v => [v.name, v.id]));

  const sports = await prisma.sportType.findMany();
  const sportMap = new Map(sports.map(s => [s.name, s.id]));

  const formats = await prisma.formatType.findMany({ include: { sport: true } });
  const formatMap = new Map(formats.map(f => [`${f.sport.name}-${f.name}`, f.id]));

  for (const court of courtsData) {
    const venueId = venueMap.get(court.venueName);
    const sportId = sportMap.get(court.sportName);
    const formatId = formatMap.get(`${court.sportName}-${court.formatName}`);

    if (venueId && sportId) {
      // Check if court already exists
      const existingCourt = await prisma.court.findFirst({
        where: {
          venueId,
          courtNumber: court.courtNumber
        }
      });

      if (existingCourt) {
        // Update existing court
        await prisma.court.update({
          where: { id: existingCourt.id },
          data: {
            sportId,
            formatId,
            name: `${court.sportName} ${court.courtNumber}`,
            description: court.description,
            surface: court.surface,
            pricePerHour: court.pricePerHour,
            maxPlayers: court.maxPlayers,
            isActive: true,
          },
        });
      } else {
        // Create new court
        await prisma.court.create({
          data: {
            venueId,
            sportId,
            formatId,
            name: `${court.sportName} ${court.courtNumber}`,
            courtNumber: court.courtNumber,
            description: court.description,
            surface: court.surface,
            pricePerHour: court.pricePerHour,
            maxPlayers: court.maxPlayers,
            isActive: true,
          },
        });
      }
    }
  }

  console.log(`✅ Created ${courtsData.length} courts`);
}

async function seedTeams() {
  console.log('👯 Seeding teams...');

  const sports = await prisma.sportType.findMany();
  const sportMap = new Map(sports.map(s => [s.name, s.id]));

  const formats = await prisma.formatType.findMany({ include: { sport: true } });
  const formatMap = new Map(formats.map(f => [`${f.sport.name}-${f.name}`, f.id]));

  for (const team of teamsData) {
    const sportId = sportMap.get(team.sportName);
    const formatId = formatMap.get(`${team.sportName}-${team.formatName}`);

    if (sportId && formatId) {
      // Check if team already exists
      const existingTeam = await prisma.team.findFirst({
        where: { name: team.name }
      });

      let createdTeam;
      if (existingTeam) {
        // Update existing team
        createdTeam = await prisma.team.update({
          where: { id: existingTeam.id },
          data: {
            description: team.description,
            sportId,
            formatId,
            city: team.city,
            maxPlayers: team.maxPlayers,
            minPlayers: team.minPlayers,
            isRecruiting: team.isRecruiting,
          },
        });
      } else {
        // Create new team
        createdTeam = await prisma.team.create({
          data: {
            name: team.name,
            description: team.description,
            sportId,
            formatId,
            city: team.city,
            maxPlayers: team.maxPlayers,
            minPlayers: team.minPlayers,
            isActive: true,
            isRecruiting: team.isRecruiting,
          },
        });
      }

      // Create team members
      for (const member of team.members) {
        const user = await prisma.user.upsert({
          where: { email: member.email },
          update: {},
          create: {
            email: member.email,
            name: member.name,
            phone: member.phone,
            role: 'CUSTOMER',
            isActive: true,
            isEmailVerified: true,
          },
        });

        await prisma.teamMember.upsert({
          where: { teamId_userId: { teamId: createdTeam.id, userId: user.id } },
          update: {
            role: member.role as 'ADMIN' | 'MEMBER',
            isActive: true,
          },
          create: {
            teamId: createdTeam.id,
            userId: user.id,
            role: member.role as 'ADMIN' | 'MEMBER',
            isActive: true,
          },
        });
      }
    }
  }

  console.log(`✅ Created ${teamsData.length} teams`);
}

async function seedOperatingHours() {
  console.log('🕐 Seeding venue operating hours...');

  const venues = await prisma.venue.findMany();

  for (const venue of venues) {
    for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      await prisma.venueOperatingHours.upsert({
        where: { venueId_dayOfWeek: { venueId: venue.id, dayOfWeek } },
        update: {},
        create: {
          venueId: venue.id,
          dayOfWeek,
          openingTime: '06:00',
          closingTime: isWeekend ? '23:30' : '23:00',
          isOpen: true,
        },
      });
    }
  }

  console.log(`✅ Created operating hours for venues`);
}

// MAIN SEEDING FUNCTION
async function seedAll() {
  console.log('🚀 Starting simple database seeding...\n');

  try {
    // Seed data in correct order
    await seedSports();
    await seedFormatTypes();
    await seedUsers();
    await seedVendors();
    await seedVenues();
    await seedOperatingHours();
    await seedCourts();
    await seedTeams();

    // Display final statistics
    console.log('\n📊 Final database statistics:');
    const stats = {
      users: await prisma.user.count(),
      vendors: await prisma.vendor.count(),
      venues: await prisma.venue.count(),
      courts: await prisma.court.count(),
      sports: await prisma.sportType.count(),
      formats: await prisma.formatType.count(),
      teams: await prisma.team.count(),
      teamMembers: await prisma.teamMember.count(),
      operatingHours: await prisma.venueOperatingHours.count(),
    };

    Object.entries(stats).forEach(([key, count]) => {
      console.log(`   ${key}: ${count}`);
    });

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n🔑 Login credentials:');
    console.log('   Admin: admin@venuesystem.com / admin123');

  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedAll().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seedAll };