import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// SPORTS DATA
const sportsData = [
  {
    name: 'football',
    displayName: 'Football',
    icon: '⚽',
    description: 'Association football, soccer',
    teamSize: 11,
    duration: 90,
    isActive: true
  },
  {
    name: 'basketball',
    displayName: 'Basketball',
    icon: '🏀',
    description: 'Basketball game',
    teamSize: 5,
    duration: 48,
    isActive: true
  },
  {
    name: 'cricket',
    displayName: 'Cricket',
    icon: '🏏',
    description: 'Cricket match',
    teamSize: 11,
    duration: 360,
    isActive: true
  },
  {
    name: 'tennis',
    displayName: 'Tennis',
    icon: '🎾',
    description: 'Tennis match',
    teamSize: 2,
    duration: 90,
    isActive: true
  },
  {
    name: 'badminton',
    displayName: 'Badminton',
    icon: '🏸',
    description: 'Badminton game',
    teamSize: 2,
    duration: 45,
    isActive: true
  },
  {
    name: 'boxcricket',
    displayName: 'Box Cricket',
    icon: '🏏',
    description: 'Indoor box cricket',
    teamSize: 6,
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
  { sportName: 'boxcricket', name: '6v6', displayName: '6v6 Box Cricket', minPlayers: 6, maxPlayers: 12 },
  { sportName: 'boxcricket', name: '8v8', displayName: '8v8 Box Cricket', minPlayers: 8, maxPlayers: 16 },

  // Badminton formats
  { sportName: 'badminton', name: 'singles', displayName: 'Singles', minPlayers: 1, maxPlayers: 2 },
  { sportName: 'badminton', name: 'doubles', displayName: 'Doubles', minPlayers: 2, maxPlayers: 4 },

  // Other sports
  { sportName: 'tennis', name: 'singles', displayName: 'Singles', minPlayers: 1, maxPlayers: 2 },
  { sportName: 'tennis', name: 'doubles', displayName: 'Doubles', minPlayers: 2, maxPlayers: 4 }
];

// VENDORS DATA
const vendorsData = [
  {
    name: '3Lok Sports Hub',
    slug: '3lok',
    email: 'info@3loksports.com',
    phoneCountryCode: '+91',
    phoneNumber: '9876543210',
    website: 'https://www.3loksports.com',
    description: 'Premier sports facility in Whitefield with multiple courts and fields for various sports.',
    address: 'Whitefield Main Road, EPIP Zone',
    postalCode: '560066',
    country: 'India',
    state: 'Karnataka',
    city: 'Bengaluru',
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    accentColor: '#34D399',
    countryCode: 'IN',
    currencyCode: 'INR',
    timezone: 'Asia/Kolkata',
    locale: 'en-IN',
    autoApprove: true
  },
  {
    name: 'GameHub Pro Sports',
    slug: 'gamehub',
    email: 'hello@gamehubpro.com',
    phoneCountryCode: '+91',
    phoneNumber: '9876554321',
    website: 'https://gamehubpro.com',
    description: 'Professional sports complex with world-class facilities.',
    address: 'HSR Layout, Sector 2',
    postalCode: '560102',
    country: 'India',
    state: 'Karnataka',
    city: 'Bengaluru',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#60A5FA',
    countryCode: 'IN',
    currencyCode: 'INR',
    timezone: 'Asia/Kolkata',
    locale: 'en-IN',
    autoApprove: false
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

  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

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
      lastLoginAt: new Date(),
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      countryCode: 'IN',
      currencyCode: 'INR',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
    },
  });

  // Create sample customers
  const customersData = [
    {
      email: 'john.doe@example.com',
      name: 'John Doe',
      phone: '+919876543210',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      countryCode: 'IN',
      currencyCode: 'INR',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      phone: '+918765432109',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      countryCode: 'IN',
      currencyCode: 'INR',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      email: 'mike.johnson@example.com',
      name: 'Mike Johnson',
      phone: '+917654321098',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      countryCode: 'IN',
      currencyCode: 'INR',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      lastLoginAt: new Date(), // Today
    },
    {
      email: 'sarah.wilson@example.com',
      name: 'Sarah Wilson',
      phone: '+916543210987',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      countryCode: 'IN',
      currencyCode: 'INR',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      lastLoginAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      isActive: false,
    },
    {
      email: 'tom.brown@example.com',
      name: 'Tom Brown',
      phone: '+915432109876',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      countryCode: 'IN',
      currencyCode: 'INR',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      lastLoginAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      email: 'emily.davis@example.com',
      name: 'Emily Davis',
      phone: '+914321098765',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      countryCode: 'IN',
      currencyCode: 'INR',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      lastLoginAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    },
    {
      email: 'chris.wilson@example.com',
      name: 'Chris Wilson',
      phone: '+913210987654',
      city: 'Kolkata',
      state: 'West Bengal',
      country: 'India',
      countryCode: 'IN',
      currencyCode: 'INR',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      lastLoginAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    },
    {
      email: 'lisa.anderson@example.com',
      name: 'Lisa Anderson',
      phone: '+912109876543',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      countryCode: 'IN',
      currencyCode: 'INR',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      lastLoginAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      email: 'david.martinez@example.com',
      name: 'David Martinez',
      phone: '+911098765432',
      city: 'Ahmedabad',
      state: 'Gujarat',
      country: 'India',
      countryCode: 'IN',
      currencyCode: 'INR',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      lastLoginAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    },
    {
      email: 'anna.taylor@example.com',
      name: 'Anna Taylor',
      phone: '+910987654321',
      city: 'Jaipur',
      state: 'Rajasthan',
      country: 'India',
      countryCode: 'IN',
      currencyCode: 'INR',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      lastLoginAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      isEmailVerified: false,
    }
  ];

  for (const customer of customersData) {
    await prisma.user.upsert({
      where: { email: customer.email },
      update: {
        lastLoginAt: customer.lastLoginAt,
        isActive: customer.isActive !== undefined ? customer.isActive : true,
        isEmailVerified: customer.isEmailVerified !== undefined ? customer.isEmailVerified : true,
        city: customer.city,
        state: customer.state,
        country: customer.country,
        countryCode: customer.countryCode,
        currencyCode: customer.currencyCode,
        timezone: customer.timezone,
        locale: customer.locale,
      },
      create: {
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        password: userPassword,
        role: 'CUSTOMER',
        isActive: customer.isActive !== undefined ? customer.isActive : true,
        isEmailVerified: customer.isEmailVerified !== undefined ? customer.isEmailVerified : true,
        lastLoginAt: customer.lastLoginAt,
        city: customer.city,
        state: customer.state,
        country: customer.country,
        countryCode: customer.countryCode,
        currencyCode: customer.currencyCode,
        timezone: customer.timezone,
        locale: customer.locale,
      },
    });
  }

  console.log(`✅ Created 1 admin user and ${customersData.length} customers`);
}

async function seedVendors() {
  console.log('🏪 Seeding vendors...');

  const vendorPassword = await bcrypt.hash('vendor123', 10);

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

      // Create vendor admin user
      const vendorAdminEmail = `admin@${vendor.slug}.com`;
      await prisma.user.upsert({
        where: { email: vendorAdminEmail },
        update: {},
        create: {
          email: vendorAdminEmail,
          name: `${vendor.name} Admin`,
          phone: vendor.phoneCountryCode + vendor.phoneNumber,
          password: vendorPassword,
          role: 'VENDOR_ADMIN',
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random within last week
          city: vendor.city,
          state: vendor.state,
          country: vendor.country,
          countryCode: vendor.countryCode,
          currencyCode: vendor.currencyCode,
          timezone: vendor.timezone,
          locale: vendor.locale,
        },
      });

      // Create vendor staff record linking user to vendor
      const vendorAdminUser = await prisma.user.findUnique({ where: { email: vendorAdminEmail } });
      if (vendorAdminUser) {
        await prisma.vendorStaff.upsert({
          where: {
            vendorId_userId: {
              vendorId: createdVendor.id,
              userId: vendorAdminUser.id,
            },
          },
          update: {},
          create: {
            vendorId: createdVendor.id,
            userId: vendorAdminUser.id,
            role: 'VENDOR_ADMIN',
            isActive: true,
            permissions: JSON.stringify(['bookings', 'venues', 'staff', 'analytics']),
          },
        });
      }

      // Create vendor staff users
      const staffMembers = vendor.slug === '3lok'
        ? [
            { name: 'Raj Kumar', email: 'raj@3lok.com', role: 'STAFF' },
            { name: 'Priya Sharma', email: 'priya@3lok.com', role: 'STAFF' },
          ]
        : [
            { name: 'Alex Johnson', email: 'alex@gamehub.com', role: 'STAFF' },
          ];

      for (const staff of staffMembers) {
        await prisma.user.upsert({
          where: { email: staff.email },
          update: {},
          create: {
            email: staff.email,
            name: staff.name,
            phone: '+919999999999',
            password: vendorPassword,
            role: 'VENDOR_STAFF',
            isActive: true,
            isEmailVerified: true,
            lastLoginAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000), // Random within last 2 weeks
            city: vendor.city,
            state: vendor.state,
            country: vendor.country,
            countryCode: vendor.countryCode,
            currencyCode: vendor.currencyCode,
            timezone: vendor.timezone,
            locale: vendor.locale,
          },
        });

        // Create vendor staff record
        const staffUser = await prisma.user.findUnique({ where: { email: staff.email } });
        if (staffUser) {
          await prisma.vendorStaff.upsert({
            where: {
              vendorId_userId: {
                vendorId: createdVendor.id,
                userId: staffUser.id,
              },
            },
            update: {},
            create: {
              vendorId: createdVendor.id,
              userId: staffUser.id,
              role: 'VENDOR_STAFF',
              isActive: true,
              permissions: JSON.stringify(['bookings']),
            },
          });
        }
      }
    }
  }

  console.log(`✅ Created ${vendorsData.length} vendors with admin and staff users`);
}

async function seedVenues() {
  console.log('🏟️ Seeding venues...');

  const vendors = await prisma.vendor.findMany();
  const vendorMap = new Map(vendors.map(v => [v.name.split(' ')[0].toLowerCase(), v.id]));

  const venuesData = [
    {
      name: '3Lok Sports Hub - Whitefield',
      description: 'Premier multi-sport facility in Whitefield featuring premium football turfs and modern amenities',
      address: 'Threelok Football Fitness Hub, Inside Sai Green Layout, Road next to HP Petrol Bunk, Belathur-Seegahalli Main Road, Whitefield, Bengaluru - 560066',
      city: 'Bengaluru',
      postalCode: '560066',
      latitude: 12.9698,
      longitude: 77.7500,
      phone: '+91 98765 43210',
      email: 'whitefield@3loksports.com',
      timezone: 'Asia/Kolkata',
      vendorPrefix: '3lok'
    },
    {
      name: 'Venue 1',
      description: 'Multi-purpose sports venue with modern facilities',
      address: '123 Sports Avenue, Whitefield, Bengaluru - 560066',
      city: 'Bengaluru',
      postalCode: '560066',
      latitude: 12.9700,
      longitude: 77.7510,
      phone: '+91 98765 43211',
      email: 'venue1@3loksports.com',
      timezone: 'Asia/Kolkata',
      vendorPrefix: '3lok'
    },
    {
      name: 'Venue 2',
      description: 'Premium sports facility with top-notch amenities',
      address: '456 Athletic Street, Whitefield, Bengaluru - 560066',
      city: 'Bengaluru',
      postalCode: '560066',
      latitude: 12.9710,
      longitude: 77.7520,
      phone: '+91 98765 43212',
      email: 'venue2@3loksports.com',
      timezone: 'Asia/Kolkata',
      vendorPrefix: '3lok'
    },
    {
      name: 'Venue 3',
      description: 'State-of-the-art sports complex with multiple courts',
      address: '789 Fitness Road, Whitefield, Bengaluru - 560066',
      city: 'Bengaluru',
      postalCode: '560066',
      latitude: 12.9720,
      longitude: 77.7530,
      phone: '+91 98765 43213',
      email: 'venue3@3loksports.com',
      timezone: 'Asia/Kolkata',
      vendorPrefix: '3lok'
    },
    {
      name: 'GameHub Pro Sports - Indiranagar',
      description: 'State-of-the-art indoor sports complex featuring basketball and badminton courts with climate control',
      address: '100 Feet Road, Indiranagar, Bengaluru, Karnataka - 560038',
      city: 'Bengaluru',
      postalCode: '560038',
      latitude: 12.9716,
      longitude: 77.6407,
      phone: '+91 98765 54321',
      email: 'indiranagar@gamehubpro.com',
      timezone: 'Asia/Kolkata',
      vendorPrefix: 'gamehub'
    }
  ];

  let createdCount = 0;
  for (const venue of venuesData) {
    const vendorId = vendorMap.get(venue.vendorPrefix);

    if (vendorId) {
      // Get vendor details for defaults
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { currencyCode: true, countryCode: true, timezone: true }
      });

      // Create venue without vendorPrefix field
      const { vendorPrefix, ...venueData } = venue;
      try {
        // Check if venue already exists
        const existingVenue = await prisma.venue.findFirst({
          where: {
            vendorId,
            name: venue.name,
            deletedAt: null
          }
        });

        if (!existingVenue) {
          await prisma.venue.create({
            data: {
              ...venueData,
              vendorId,
              // Default to vendor's currency/country/timezone if not set
              currencyCode: venueData.currencyCode || vendor?.currencyCode || 'INR',
              countryCode: venueData.countryCode || vendor?.countryCode || 'IN',
              timezone: venueData.timezone || vendor?.timezone || 'Asia/Kolkata',
            },
          });
          createdCount++;
          console.log(`   Created venue: "${venue.name}"`);
        } else {
          console.log(`   Venue "${venue.name}" already exists, skipping`);
        }
      } catch (error: any) {
        console.error(`   Error creating venue "${venue.name}":`, error.message);
      }
    }
  }

  console.log(`✅ Created/verified ${createdCount} new venues`);
}

async function seedOperatingHours() {
  console.log('🕐 Seeding venue operating hours...');

  const venues = await prisma.venue.findMany();

  for (const venue of venues) {
    for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      await prisma.venueOperatingHours.upsert({
        where: {
          venueId_dayOfWeek: {
            venueId: venue.id,
            dayOfWeek
          }
        },
        update: {
          openingTime: '06:00',
          closingTime: isWeekend ? '23:30' : '23:00',
          isOpen: true,
        },
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

async function seedCourts() {
  console.log('🎾 Seeding courts...');

  const courtsData = [
    { venueName: '3Lok Sports Hub - Whitefield', sportName: 'football', formatName: '5-a-side', courtNumber: 'Turf A', pricePerHour: 1500, maxPlayers: 10, surface: 'Premium Artificial Turf', description: 'Premium 5-a-side football turf with floodlights and modern facilities' },
    { venueName: '3Lok Sports Hub - Whitefield', sportName: 'football', formatName: '7-a-side', courtNumber: 'Turf B', pricePerHour: 2600, maxPlayers: 14, surface: 'Premium Artificial Turf', description: 'Professional 7-a-side football turf with floodlights and seating area' },
    { venueName: '3Lok Sports Hub - Whitefield', sportName: 'football', formatName: '5-a-side', courtNumber: 'Turf C', pricePerHour: 1400, maxPlayers: 10, surface: 'Artificial Turf', description: 'Standard 5-a-side football turf with basic facilities' },
    { venueName: 'Venue 1', sportName: 'football', formatName: '5-a-side', courtNumber: 'Court 1', pricePerHour: 1200, maxPlayers: 10, surface: 'Artificial Turf', description: 'Standard football court' },
    { venueName: 'Venue 1', sportName: 'cricket', formatName: 'tennis-ball', courtNumber: 'Court 2', pricePerHour: 1800, maxPlayers: 12, surface: 'Grass', description: 'Tennis ball cricket court' },
    { venueName: 'Venue 2', sportName: 'basketball', formatName: '5v5', courtNumber: 'Court 1', pricePerHour: 2000, maxPlayers: 10, surface: 'Wood Flooring', description: 'Indoor basketball court' },
    { venueName: 'Venue 2', sportName: 'badminton', formatName: 'singles', courtNumber: 'Court 2', pricePerHour: 700, maxPlayers: 2, surface: 'Synthetic', description: 'Badminton court' },
    { venueName: 'Venue 3', sportName: 'football', formatName: '7-a-side', courtNumber: 'Court 1', pricePerHour: 2200, maxPlayers: 14, surface: 'Artificial Turf', description: '7-a-side football court' },
    { venueName: 'Venue 3', sportName: 'cricket', formatName: 'tennis-ball', courtNumber: 'Court 2', pricePerHour: 1600, maxPlayers: 12, surface: 'Grass', description: 'Cricket court' },
    { venueName: '3Lok Sports Hub - Whitefield', sportName: 'boxcricket', formatName: '6v6', courtNumber: 'Box Court 1', pricePerHour: 2000, maxPlayers: 12, surface: 'Synthetic Mat', description: 'Indoor box cricket court with nets and floodlights' },
    { venueName: 'Venue 1', sportName: 'boxcricket', formatName: '8v8', courtNumber: 'Box Court 1', pricePerHour: 2200, maxPlayers: 16, surface: 'Synthetic Mat', description: 'Large box cricket court for 8v8 matches' },
    { venueName: 'GameHub Pro Sports - Indiranagar', sportName: 'basketball', formatName: '5v5', courtNumber: 'Court 1', pricePerHour: 2500, maxPlayers: 10, surface: 'Premium Wood Flooring', description: 'Professional indoor basketball court with AC, scoreboard, and spectator seating' },
    { venueName: 'GameHub Pro Sports - Indiranagar', sportName: 'badminton', formatName: 'singles', courtNumber: 'Court 1', pricePerHour: 800, maxPlayers: 2, surface: 'Premium Synthetic', description: 'Air-conditioned badminton court with professional lighting' },
    { venueName: 'GameHub Pro Sports - Indiranagar', sportName: 'badminton', formatName: 'doubles', courtNumber: 'Court 2', pricePerHour: 1200, maxPlayers: 4, surface: 'Premium Synthetic', description: 'Air-conditioned doubles badminton court with professional lighting' }
  ];

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
      await prisma.court.upsert({
        where: {
          venueId_courtNumber: {
            venueId,
            courtNumber: court.courtNumber
          }
        },
        update: {
          sportId,
          formatId,
          name: `${court.sportName === 'football' ? 'Football' : court.sportName === 'basketball' ? 'Basketball' : court.sportName === 'boxcricket' ? 'Box Cricket' : court.sportName === 'cricket' ? 'Cricket' : 'Badminton'} ${court.courtNumber}`,
          description: court.description,
          surface: court.surface,
          pricePerHour: court.pricePerHour,
          maxPlayers: court.maxPlayers,
          isActive: true,
        },
        create: {
          venueId,
          sportId,
          formatId,
          name: `${court.sportName === 'football' ? 'Football' : court.sportName === 'basketball' ? 'Basketball' : court.sportName === 'boxcricket' ? 'Box Cricket' : court.sportName === 'cricket' ? 'Cricket' : 'Badminton'} ${court.courtNumber}`,
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

  console.log(`✅ Created ${courtsData.length} courts`);
}

async function seedTeams() {
  console.log('👯 Seeding teams...');

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

  const sports = await prisma.sportType.findMany();
  const sportMap = new Map(sports.map(s => [s.name, s.id]));

  const formats = await prisma.formatType.findMany({ include: { sport: true } });
  const formatMap = new Map(formats.map(f => [`${f.sport.name}-${f.name}`, f.id]));

  for (const team of teamsData) {
    const sportId = sportMap.get(team.sportName);
    const formatId = formatMap.get(`${team.sportName}-${team.formatName}`);

    if (sportId && formatId) {
      const createdTeam = await prisma.team.create({
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

        await prisma.teamMember.create({
          data: {
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

async function seedBookings() {
  console.log('📅 Seeding bookings for 3Lok Sports Hub...');

  // Get 3Lok vendor
  const vendor = await prisma.vendor.findUnique({ where: { slug: '3lok' } });
  if (!vendor) {
    console.log('⚠️  3Lok vendor not found, skipping bookings');
    return;
  }

  console.log(`✅ Found vendor: ${vendor.name} (ID: ${vendor.id})`);

  // Get 3Lok venues and courts
  const venues = await prisma.venue.findMany({
    where: { vendorId: vendor.id },
    include: { courts: true }
  });

  console.log(`✅ Found ${venues.length} venue(s) for 3Lok`);

  if (venues.length === 0) {
    console.log('⚠️  No venues found for 3Lok, skipping bookings');
    return;
  }

  // Check if any venue has courts
  const venuesWithCourts = venues.filter(v => v.courts.length > 0);
  if (venuesWithCourts.length === 0) {
    console.log('⚠️  No courts found for any 3Lok venue, skipping bookings');
    console.log('   Make sure seedCourts() runs before seedBookings()');
    venues.forEach(v => {
      console.log(`   - ${v.name}: 0 courts`);
    });
    return;
  }

  console.log(`✅ Found ${venuesWithCourts.length} venue(s) with courts`);
  venuesWithCourts.forEach(v => {
    console.log(`   - ${v.name}: ${v.courts.length} court(s)`);
  });

  // Get customer users
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER', isActive: true },
    take: 5
  });

  if (customers.length === 0) {
    console.log('⚠️  No customer users found, skipping bookings');
    console.log('   Make sure seedUsers() runs before seedBookings()');
    return;
  }

  console.log(`✅ Found ${customers.length} customer(s)`);

  // Use the venue with the most courts, or first venue
  const venue = venuesWithCourts.reduce((prev, current) => 
    (current.courts.length > prev.courts.length) ? current : prev
  );
  const allCourts = venue.courts;
  
  // Get box cricket courts specifically
  const boxCricketCourts = allCourts.filter(court => {
    // We'll check by sport name after fetching sport info
    return true; // Will filter later
  });
  
  // Get sport info to identify box cricket courts
  const sports = await prisma.sportType.findMany();
  const boxCricketSport = sports.find(s => s.name === 'boxcricket');
  
  // Filter courts by sport
  const boxCricketCourtsFiltered = boxCricketSport 
    ? allCourts.filter(court => court.sportId === boxCricketSport.id)
    : [];
  
  // Use all courts, but prioritize box cricket if available
  const courts = boxCricketCourtsFiltered.length > 0 
    ? [...boxCricketCourtsFiltered, ...allCourts.filter(c => !boxCricketCourtsFiltered.some(bc => bc.id === c.id))]
    : allCourts;
  
  console.log(`✅ Using venue: ${venue.name} with ${courts.length} court(s)`);
  
  if (courts.length < 2) {
    console.log('⚠️  Need at least 2 courts for seeding, found:', courts.length);
    console.log('   Available courts:', courts.map(c => `${c.name} (${c.courtNumber})`).join(', '));
    // Continue anyway if we have at least 1 court
    if (courts.length === 0) {
      return;
    }
  }
  
  const now = new Date();
  
  // Helper function to create date with time
  const createDate = (daysAgo: number, hour: number = 18, minute: number = 0) => {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, minute, 0, 0);
    return date;
  };
  
  // Create bookings with various statuses and dates across multiple time periods
  // This ensures we have data for analytics comparison (last week vs previous week, etc.)
  // CURRENT WEEK (Last 7 days) - MORE bookings and LONGER durations to show growth
  const bookingsData = [
    // Day 0 (Today) - 3 bookings
    {
      court: courts[0],
      customer: customers[0],
      date: createDate(0, 18, 0),
      duration: 90, // Longer duration
      status: 'CONFIRMED' as const,
      notes: 'Regular weekly booking'
    },
    {
      court: courts[0],
      customer: customers[1],
      date: createDate(0, 19, 30),
      duration: 120, // Longer duration
      status: 'CONFIRMED' as const,
      notes: 'Birthday celebration match'
    },
    {
      court: courts[1],
      customer: customers[2],
      date: createDate(0, 20, 0),
      duration: 120,
      status: 'PENDING' as const,
      notes: 'Team practice session'
    },
    // Day 1 (Yesterday) - 3 bookings
    {
      court: courts[0],
      customer: customers[0],
      date: createDate(1, 18, 0),
      duration: 90, // Longer duration
      status: 'COMPLETED' as const,
      notes: 'Weekly match'
    },
    {
      court: courts[1],
      customer: customers[1],
      date: createDate(1, 19, 0),
      duration: 120, // Longer duration
      status: 'COMPLETED' as const,
      notes: 'Friendly match'
    },
    {
      court: courts[1],
      customer: customers[3] || customers[0],
      date: createDate(1, 17, 0),
      duration: 90,
      status: 'COMPLETED' as const,
      notes: 'Additional booking'
    },
    // Day 2 - 2 bookings
    {
      court: courts[0],
      customer: customers[2],
      date: createDate(2, 20, 0),
      duration: 90, // Longer duration
      status: 'COMPLETED' as const,
      notes: null
    },
    {
      court: courts[1],
      customer: customers[3] || customers[0],
      date: createDate(2, 17, 0),
      duration: 120, // Longer duration
      status: 'COMPLETED' as const,
      notes: null
    },
    // Day 3 - 2 bookings
    {
      court: courts[0],
      customer: customers[4] || customers[1],
      date: createDate(3, 18, 0),
      duration: 90, // Longer duration
      status: 'COMPLETED' as const,
      notes: null
    },
    {
      court: courts[1],
      customer: customers[0],
      date: createDate(3, 19, 0),
      duration: 90,
      status: 'COMPLETED' as const,
      notes: null
    },
    // Day 4 - 2 bookings
    {
      court: courts[1],
      customer: customers[0],
      date: createDate(4, 19, 0),
      duration: 120, // Longer duration
      status: 'COMPLETED' as const,
      notes: null
    },
    {
      court: courts[0],
      customer: customers[1],
      date: createDate(4, 18, 0),
      duration: 90,
      status: 'COMPLETED' as const,
      notes: null
    },
    // Day 5 - 2 bookings
    {
      court: courts[0],
      customer: customers[1],
      date: createDate(5, 18, 0),
      duration: 60,
      status: 'CANCELLED' as const,
      notes: 'Cancelled due to rain'
    },
    {
      court: courts[1],
      customer: customers[2],
      date: createDate(5, 20, 0),
      duration: 120,
      status: 'COMPLETED' as const,
      notes: null
    },
    // Day 6 - 2 bookings
    {
      court: courts[0],
      customer: customers[0],
      date: createDate(6, 17, 0),
      duration: 90, // Longer duration
      status: 'COMPLETED' as const,
      notes: null
    },
    {
      court: courts[1],
      customer: customers[3] || customers[0],
      date: createDate(6, 19, 0),
      duration: 90,
      status: 'COMPLETED' as const,
      notes: null
    },
    
    // PREVIOUS WEEK (8-14 days ago) - FEWER bookings and SHORTER durations to show growth
    // This period has fewer bookings with shorter durations to demonstrate growth
    {
      court: courts[0],
      customer: customers[0],
      date: createDate(8, 18, 0), // Oct 29 - clearly in previous period
      duration: 60, // Shorter duration
      status: 'COMPLETED' as const,
      notes: 'Previous week booking'
    },
    {
      court: courts[1],
      customer: customers[1],
      date: createDate(8, 19, 0), // Oct 29
      duration: 60, // Shorter duration
      status: 'COMPLETED' as const,
      notes: null
    },
    {
      court: courts[0],
      customer: customers[2],
      date: createDate(9, 20, 0), // Oct 28
      duration: 60, // Shorter duration
      status: 'COMPLETED' as const,
      notes: null
    },
    {
      court: courts[1],
      customer: customers[3] || customers[0],
      date: createDate(10, 18, 0), // Oct 27
      duration: 60, // Shorter duration
      status: 'COMPLETED' as const,
      notes: null
    },
    {
      court: courts[0],
      customer: customers[4] || customers[1],
      date: createDate(11, 19, 0), // Oct 26
      duration: 60, // Shorter duration
      status: 'COMPLETED' as const,
      notes: null
    },
    {
      court: courts[1],
      customer: customers[0],
      date: createDate(12, 17, 0), // Oct 25
      duration: 60, // Shorter duration
      status: 'COMPLETED' as const,
      notes: null
    },
    
    // LAST MONTH (15-30 days ago) - Some bookings for monthly comparison
    {
      court: courts[0],
      customer: customers[0],
      date: createDate(15, 18, 0),
      duration: 60,
      status: 'COMPLETED' as const,
      notes: null
    },
    {
      court: courts[1],
      customer: customers[1],
      date: createDate(16, 19, 0),
      duration: 90,
      status: 'COMPLETED' as const,
      notes: null
    },
    {
      court: courts[0],
      customer: customers[2],
      date: createDate(18, 20, 0),
      duration: 60,
      status: 'COMPLETED' as const,
      notes: null
    },
    {
      court: courts[1],
      customer: customers[3] || customers[0],
      date: createDate(20, 18, 0),
      duration: 90,
      status: 'COMPLETED' as const,
      notes: null
    },
    {
      court: courts[0],
      customer: customers[4] || customers[1],
      date: createDate(22, 19, 0),
      duration: 60,
      status: 'COMPLETED' as const,
      notes: null
    },
    {
      court: courts[1],
      customer: customers[0],
      date: createDate(25, 17, 0),
      duration: 90,
      status: 'COMPLETED' as const,
      notes: null
    },
    {
      court: courts[0],
      customer: customers[1],
      date: createDate(28, 18, 0),
      duration: 60,
      status: 'COMPLETED' as const,
      notes: null
    },
    
    // PREVIOUS MONTH (31-45 days ago) - Fewer bookings for comparison
    {
      court: courts[0],
      customer: customers[0],
      date: createDate(31, 18, 0),
      duration: 60,
      status: 'COMPLETED' as const,
      notes: null
    },
    {
      court: courts[1],
      customer: customers[1],
      date: createDate(33, 19, 0),
      duration: 90,
      status: 'COMPLETED' as const,
      notes: null
    },
    {
      court: courts[0],
      customer: customers[2],
      date: createDate(35, 20, 0),
      duration: 60,
      status: 'COMPLETED' as const,
      notes: null
    },
    {
      court: courts[1],
      customer: customers[3] || customers[0],
      date: createDate(38, 18, 0),
      duration: 90,
      status: 'COMPLETED' as const,
      notes: null
    },
    {
      court: courts[0],
      customer: customers[4] || customers[1],
      date: createDate(42, 19, 0),
      duration: 60,
      status: 'COMPLETED' as const,
      notes: null
    },
    
    // Future bookings (for testing upcoming bookings)
    {
      court: courts[0],
      customer: customers[0],
      date: createDate(-1, 18, 0), // Tomorrow
      duration: 60,
      status: 'CONFIRMED' as const,
      notes: 'Next week booking'
    },
    {
      court: courts[1],
      customer: customers[1],
      date: createDate(-2, 19, 0), // Day after tomorrow
      duration: 120,
      status: 'CONFIRMED' as const,
      notes: 'Tournament practice'
    },
    {
      court: courts[0],
      customer: customers[2],
      date: createDate(-3, 17, 0),
      duration: 90,
      status: 'PENDING' as const,
      notes: 'Weekend match'
    },
    {
      court: courts[1],
      customer: customers[3] || customers[0],
      date: createDate(-4, 20, 0),
      duration: 60,
      status: 'CONFIRMED' as const,
      notes: null
    }
  ];

  // Add box cricket specific bookings if box cricket courts exist
  if (boxCricketCourtsFiltered.length > 0) {
    const boxCricketCourt = boxCricketCourtsFiltered[0];
    const additionalBoxCricketBookings = [
      // Current week - box cricket bookings
      {
        court: boxCricketCourt,
        customer: customers[0],
        date: createDate(1, 16, 0),
        duration: 60,
        status: 'COMPLETED' as const,
        notes: 'Box cricket match'
      },
      {
        court: boxCricketCourt,
        customer: customers[1],
        date: createDate(2, 19, 0),
        duration: 90,
        status: 'COMPLETED' as const,
        notes: 'Evening box cricket session'
      },
      {
        court: boxCricketCourt,
        customer: customers[2],
        date: createDate(4, 20, 0),
        duration: 60,
        status: 'COMPLETED' as const,
        notes: null
      },
      // Previous week - box cricket bookings
      {
        court: boxCricketCourt,
        customer: customers[0],
        date: createDate(9, 18, 0),
        duration: 60,
        status: 'COMPLETED' as const,
        notes: 'Previous week box cricket'
      },
      {
        court: boxCricketCourt,
        customer: customers[1],
        date: createDate(11, 19, 0),
        duration: 60,
        status: 'COMPLETED' as const,
        notes: null
      },
      // Future bookings
      {
        court: boxCricketCourt,
        customer: customers[2],
        date: createDate(-1, 19, 0),
        duration: 90,
        status: 'CONFIRMED' as const,
        notes: 'Tomorrow box cricket match'
      }
    ];
    bookingsData.push(...additionalBoxCricketBookings);
  }

  let createdCount = 0;
  for (const bookingData of bookingsData) {
    try {
      // Verify court and customer exist
      if (!bookingData.court?.id || !bookingData.customer?.id) {
        console.error(`Skipping booking - missing court or customer ID`);
        continue;
      }

      const startTime = new Date(bookingData.date);
      const endTime = new Date(startTime.getTime() + bookingData.duration * 60 * 1000);
      
      // Calculate total amount based on court price and duration
      const hours = bookingData.duration / 60;
      const totalAmount = Number(bookingData.court.pricePerHour) * hours;

      // Verify court exists in database
      const courtExists = await prisma.court.findUnique({
        where: { id: bookingData.court.id }
      });
      
      if (!courtExists) {
        console.error(`Court ${bookingData.court.id} (${bookingData.court.name}) does not exist in database`);
        continue;
      }

      // Verify user exists in database
      const userExists = await prisma.user.findUnique({
        where: { id: bookingData.customer.id }
      });
      
      if (!userExists) {
        console.error(`User ${bookingData.customer.id} (${bookingData.customer.email}) does not exist in database`);
        continue;
      }

      await prisma.booking.create({
        data: {
          userId: bookingData.customer.id,
          courtId: bookingData.court.id,
          date: startTime,
          startTime: startTime,
          endTime: endTime,
          totalAmount: totalAmount,
          status: bookingData.status,
          notes: bookingData.notes,
        },
      });

      createdCount++;
    } catch (error: any) {
      console.error(`Error creating booking ${createdCount + 1}:`, error?.message || error);
      console.error('   Court ID:', bookingData.court?.id, 'Court Name:', bookingData.court?.name);
      console.error('   Customer ID:', bookingData.customer?.id, 'Customer Email:', bookingData.customer?.email);
      if (error?.meta) {
        console.error('   Prisma Error Details:', JSON.stringify(error.meta, null, 2));
      }
    }
  }

  console.log(`✅ Created ${createdCount} bookings for 3Lok Sports Hub`);
  
  if (createdCount === 0) {
    console.log('⚠️  No bookings were created. Check the errors above.');
  }
}

// MAIN SEEDING FUNCTION
async function seedAll() {
  console.log('🚀 Starting clean database seeding...\n');

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
    await seedBookings();

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
      bookings: await prisma.booking.count(),
    };

    Object.entries(stats).forEach(([key, count]) => {
      console.log(`   ${key}: ${count}`);
    });

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n🔑 Login credentials:');
    console.log('   Platform Admin: admin@venuesystem.com / admin123');
    console.log('   Customer Users: john.doe@example.com / user123');
    console.log('   Vendor Admins: admin@3lok.com / vendor123');
    console.log('                  admin@gamehub.com / vendor123');
    console.log('   Vendor Staff: raj@3lok.com / vendor123');
    console.log('                  priya@3lok.com / vendor123');
    console.log('                  alex@gamehub.com / vendor123');

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