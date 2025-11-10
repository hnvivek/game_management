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
  { sportName: 'football', name: '11-a-side', displayName: '11-a-Side', playersPerTeam: 11, maxTotalPlayers: 22 },
  { sportName: 'football', name: '7-a-side', displayName: '7-a-Side', playersPerTeam: 7, maxTotalPlayers: 14 },
  { sportName: 'football', name: '5-a-side', displayName: '5-a-Side', playersPerTeam: 5, maxTotalPlayers: 10 },

  // Basketball formats
  { sportName: 'basketball', name: '5v5', displayName: '5v5 Full Court', playersPerTeam: 5, maxTotalPlayers: 10 },
  { sportName: 'basketball', name: '3x3', displayName: '3x3 Half Court', playersPerTeam: 3, maxTotalPlayers: 6 },

  // Cricket formats
  { sportName: 'cricket', name: 'tape-ball', displayName: 'Tape Ball', playersPerTeam: 11, maxTotalPlayers: 12 },
  { sportName: 'cricket', name: 'tennis-ball', displayName: 'Tennis Ball', playersPerTeam: 6, maxTotalPlayers: 12 },
  { sportName: 'boxcricket', name: '6v6', displayName: '6v6 Box Cricket', playersPerTeam: 6, maxTotalPlayers: 12 },
  { sportName: 'boxcricket', name: '8v8', displayName: '8v8 Box Cricket', playersPerTeam: 8, maxTotalPlayers: 16 },

  // Badminton formats
  { sportName: 'badminton', name: 'singles', displayName: 'Singles', playersPerTeam: 1, maxTotalPlayers: 2 },
  { sportName: 'badminton', name: 'doubles', displayName: 'Doubles', playersPerTeam: 2, maxTotalPlayers: 4 },

  // Other sports
  { sportName: 'tennis', name: 'singles', displayName: 'Singles', playersPerTeam: 1, maxTotalPlayers: 2 },
  { sportName: 'tennis', name: 'doubles', displayName: 'Doubles', playersPerTeam: 2, maxTotalPlayers: 4 }
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

  const vendors = await prisma.vendor.findMany();
  const vendorMap = new Map(vendors.map(v => [v.slug, v.id]));

  // Create formats for each vendor
  for (const vendor of vendors) {
    for (const format of formatTypesData) {
      const sportId = sportMap.get(format.sportName);
      if (sportId) {
        await prisma.formatType.upsert({
          where: { 
            vendorId_sportId_name: { 
              vendorId: vendor.id, 
              sportId, 
              name: format.name 
            } 
          },
          update: {
            displayName: format.displayName,
            playersPerTeam: format.playersPerTeam,
            maxTotalPlayers: format.maxTotalPlayers,
          },
          create: {
            vendorId: vendor.id,
            sportId,
            name: format.name,
            displayName: format.displayName,
            playersPerTeam: format.playersPerTeam,
            maxTotalPlayers: format.maxTotalPlayers,
          },
        });
      }
    }
  }

  console.log(`✅ Created format types for ${vendors.length} vendors`);
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

  // Updated courts data with multi-format support and maxSlots
  const courtsData = [
    { 
      venueName: '3Lok Sports Hub - Whitefield', 
      sportName: 'football', 
      formats: [
        { formatName: '11-a-side', maxSlots: 1 },
        { formatName: '7-a-side', maxSlots: 2 },
        { formatName: '5-a-side', maxSlots: 4 }
      ],
      courtNumber: 'Turf A', 
      pricePerHour: 1500, 
      maxPlayers: 22, 
      surface: 'Premium Artificial Turf', 
      description: 'Premium football turf with floodlights and modern facilities'
    },
    { 
      venueName: '3Lok Sports Hub - Whitefield', 
      sportName: 'football', 
      formats: [
        { formatName: '7-a-side', maxSlots: 2 },
        { formatName: '5-a-side', maxSlots: 4 }
      ],
      courtNumber: 'Turf B', 
      pricePerHour: 2600, 
      maxPlayers: 14, 
      surface: 'Premium Artificial Turf', 
      description: 'Professional 7-a-side football turf with floodlights and seating area'
    },
    { 
      venueName: '3Lok Sports Hub - Whitefield', 
      sportName: 'football', 
      formats: [
        { formatName: '5-a-side', maxSlots: 1 }
      ],
      courtNumber: 'Turf C', 
      pricePerHour: 1400, 
      maxPlayers: 10, 
      surface: 'Artificial Turf', 
      description: 'Standard 5-a-side football turf with basic facilities'
    },
    { 
      venueName: 'Venue 1', 
      sportName: 'football', 
      formats: [
        { formatName: '5-a-side', maxSlots: 1 }
      ],
      courtNumber: 'Court 1', 
      pricePerHour: 1200, 
      maxPlayers: 10, 
      surface: 'Artificial Turf', 
      description: 'Standard football court'
    },
    { 
      venueName: 'Venue 1', 
      sportName: 'cricket', 
      formats: [
        { formatName: 'tennis-ball', maxSlots: 1 }
      ],
      courtNumber: 'Court 2', 
      pricePerHour: 1800, 
      maxPlayers: 12, 
      surface: 'Grass', 
      description: 'Tennis ball cricket court'
    },
    { 
      venueName: 'Venue 2', 
      sportName: 'basketball', 
      formats: [
        { formatName: '5v5', maxSlots: 1 },
        { formatName: '3x3', maxSlots: 2 }
      ],
      courtNumber: 'Court 1', 
      pricePerHour: 2000, 
      maxPlayers: 10, 
      surface: 'Wood Flooring', 
      description: 'Indoor basketball court'
    },
    { 
      venueName: 'Venue 2', 
      sportName: 'badminton', 
      formats: [
        { formatName: 'singles', maxSlots: 1 },
        { formatName: 'doubles', maxSlots: 1 }
      ],
      courtNumber: 'Court 2', 
      pricePerHour: 700, 
      maxPlayers: 4, 
      surface: 'Synthetic', 
      description: 'Badminton court'
    },
    { 
      venueName: 'Venue 3', 
      sportName: 'football', 
      formats: [
        { formatName: '7-a-side', maxSlots: 1 }
      ],
      courtNumber: 'Court 1', 
      pricePerHour: 2200, 
      maxPlayers: 14, 
      surface: 'Artificial Turf', 
      description: '7-a-side football court'
    },
    { 
      venueName: 'Venue 3', 
      sportName: 'cricket', 
      formats: [
        { formatName: 'tennis-ball', maxSlots: 1 }
      ],
      courtNumber: 'Court 2', 
      pricePerHour: 1600, 
      maxPlayers: 12, 
      surface: 'Grass', 
      description: 'Cricket court'
    },
    { 
      venueName: '3Lok Sports Hub - Whitefield', 
      sportName: 'boxcricket', 
      formats: [
        { formatName: '6v6', maxSlots: 1 }
      ],
      courtNumber: 'Box Court 1', 
      pricePerHour: 2000, 
      maxPlayers: 12, 
      surface: 'Synthetic Mat', 
      description: 'Indoor box cricket court with nets and floodlights'
    },
    { 
      venueName: 'Venue 1', 
      sportName: 'boxcricket', 
      formats: [
        { formatName: '8v8', maxSlots: 1 }
      ],
      courtNumber: 'Box Court 1', 
      pricePerHour: 2200, 
      maxPlayers: 16, 
      surface: 'Synthetic Mat', 
      description: 'Large box cricket court for 8v8 matches'
    },
    { 
      venueName: 'GameHub Pro Sports - Indiranagar', 
      sportName: 'basketball', 
      formats: [
        { formatName: '5v5', maxSlots: 1 }
      ],
      courtNumber: 'Court 1', 
      pricePerHour: 2500, 
      maxPlayers: 10, 
      surface: 'Premium Wood Flooring', 
      description: 'Professional indoor basketball court with AC, scoreboard, and spectator seating'
    },
    { 
      venueName: 'GameHub Pro Sports - Indiranagar', 
      sportName: 'badminton', 
      formats: [
        { formatName: 'singles', maxSlots: 1 }
      ],
      courtNumber: 'Court 1', 
      pricePerHour: 800, 
      maxPlayers: 2, 
      surface: 'Premium Synthetic', 
      description: 'Air-conditioned badminton court with professional lighting'
    },
    { 
      venueName: 'GameHub Pro Sports - Indiranagar', 
      sportName: 'badminton', 
      formats: [
        { formatName: 'doubles', maxSlots: 1 }
      ],
      courtNumber: 'Court 2', 
      pricePerHour: 1200, 
      maxPlayers: 4, 
      surface: 'Premium Synthetic', 
      description: 'Air-conditioned doubles badminton court with professional lighting'
    }
  ];

  const venues = await prisma.venue.findMany({ include: { vendor: true } });
  const venueMap = new Map(venues.map(v => [v.name, v]));

  const sports = await prisma.sportType.findMany();
  const sportMap = new Map(sports.map(s => [s.name, s.id]));

  for (const court of courtsData) {
    const venue = venueMap.get(court.venueName);
    const sportId = sportMap.get(court.sportName);

    if (venue && sportId) {
      // Get formats for this vendor and sport
      const formats = await prisma.formatType.findMany({
        where: {
          vendorId: venue.vendorId,
          sportId: sportId
        }
      });
      const formatMap = new Map(formats.map(f => [f.name, f.id]));

      // Create or update court
      const createdCourt = await prisma.court.upsert({
        where: {
          venueId_courtNumber: {
            venueId: venue.id,
            courtNumber: court.courtNumber
          }
        },
        update: {
          sportId,
          name: `${court.sportName === 'football' ? 'Football' : court.sportName === 'basketball' ? 'Basketball' : court.sportName === 'boxcricket' ? 'Box Cricket' : court.sportName === 'cricket' ? 'Cricket' : 'Badminton'} ${court.courtNumber}`,
          description: court.description,
          surface: court.surface,
          pricePerHour: court.pricePerHour,
          maxPlayers: court.maxPlayers,
          isActive: true,
        },
        create: {
          venueId: venue.id,
          sportId,
          name: `${court.sportName === 'football' ? 'Football' : court.sportName === 'basketball' ? 'Basketball' : court.sportName === 'boxcricket' ? 'Box Cricket' : court.sportName === 'cricket' ? 'Cricket' : 'Badminton'} ${court.courtNumber}`,
          courtNumber: court.courtNumber,
          description: court.description,
          surface: court.surface,
          pricePerHour: court.pricePerHour,
          maxPlayers: court.maxPlayers,
          isActive: true,
        },
      });

      // Create CourtFormat records for each format
      for (const formatConfig of court.formats) {
        const formatId = formatMap.get(formatConfig.formatName);
        if (formatId) {
          await prisma.courtFormat.upsert({
            where: {
              courtId_formatId: {
                courtId: createdCourt.id,
                formatId: formatId
              }
            },
            update: {
              maxSlots: formatConfig.maxSlots,
              isActive: true,
            },
            create: {
              courtId: createdCourt.id,
              formatId: formatId,
              maxSlots: formatConfig.maxSlots,
              isActive: true,
            },
          });
        }
      }
    }
  }

  console.log(`✅ Created ${courtsData.length} courts with multi-format support`);
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

  // Get formats - need vendor context, use first vendor for teams
  const vendors = await prisma.vendor.findMany();
  const firstVendorId = vendors[0]?.id;
  
  const formats = firstVendorId 
    ? await prisma.formatType.findMany({ 
        where: { vendorId: firstVendorId },
        include: { sport: true } 
      })
    : [];
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
  console.log('📅 Seeding comprehensive bookings for calendar testing...');

  // Get all vendors
  const vendors = await prisma.vendor.findMany({ where: { deletedAt: null } });
  if (vendors.length === 0) {
    console.log('⚠️  No vendors found, skipping bookings');
    return;
  }

  // Get all venues with courts and their formats for all vendors
  const allVenues = await prisma.venue.findMany({
    where: { deletedAt: null },
    include: { 
      vendor: true,
      courts: {
        where: { isActive: true },
        include: { 
          sport: true,
          supportedFormats: {
            where: { isActive: true },
            include: {
              format: true
            }
          }
        }
      }
    }
  });

  const venuesWithCourts = allVenues.filter(v => v.courts.length > 0);
  if (venuesWithCourts.length === 0) {
    console.log('⚠️  No venues with courts found, skipping bookings');
    return;
  }

  console.log(`✅ Found ${venuesWithCourts.length} venue(s) with ${venuesWithCourts.reduce((sum, v) => sum + v.courts.length, 0)} total court(s)`);
  
  // Build a map of court ID to its supported formats for quick lookup
  const courtFormatMap = new Map<string, Array<{ formatId: string; formatName: string; maxSlots: number }>>();
  for (const venue of venuesWithCourts) {
    for (const court of venue.courts) {
      const formats = court.supportedFormats.map(cf => ({
        formatId: cf.formatId,
        formatName: cf.format.name,
        maxSlots: cf.maxSlots
      }));
      courtFormatMap.set(court.id, formats);
    }
  }

  // Get all customer users
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER', isActive: true },
    take: 10
  });

  if (customers.length === 0) {
    console.log('⚠️  No customer users found, skipping bookings');
    return;
  }

  console.log(`✅ Found ${customers.length} customer(s)`);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Helper function to create date with time
  const createDate = (daysOffset: number, hour: number = 18, minute: number = 0) => {
    const date = new Date(today);
    date.setDate(date.getDate() + daysOffset);
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  // Get all sports for reference
  const sports = await prisma.sportType.findMany();
  const sportMap = new Map(sports.map(s => [s.name, s.id]));

  // Generate comprehensive bookings for calendar testing
  const bookingsData: Array<{
    venue: typeof venuesWithCourts[0];
    court: typeof venuesWithCourts[0]['courts'][0];
    customer: typeof customers[0];
    date: Date;
    duration: number;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
    notes?: string | null;
    formatId?: string;
    slotNumber?: number;
  }> = [];

  // Distribute courts across venues
  let courtIndex = 0;
  let customerIndex = 0;

  // Helper to get next court (round-robin across venues)
  const getNextCourt = () => {
    const venue = venuesWithCourts[courtIndex % venuesWithCourts.length];
    const courts = venue.courts;
    const court = courts[Math.floor(courtIndex / venuesWithCourts.length) % courts.length];
    courtIndex++;
    return { venue, court };
  };

  // Helper to get next customer (round-robin)
  const getNextCustomer = () => {
    const customer = customers[customerIndex % customers.length];
    customerIndex++;
    return customer;
  };

  // Helper to assign format to booking based on court's supported formats
  const assignFormatToBooking = (courtId: string, existingBookingsAtTime: number = 0) => {
    const formats = courtFormatMap.get(courtId) || [];
    if (formats.length === 0) return { formatId: undefined, slotNumber: undefined };
    
    // Prefer smaller formats (5-a-side) for multiple bookings, larger formats (11-a-side) for single bookings
    const sortedFormats = [...formats].sort((a, b) => {
      // Sort by maxSlots descending (larger formats first)
      return b.maxSlots - a.maxSlots;
    });
    
    // Use first available format
    const selectedFormat = sortedFormats[0];
    // Assign slot number based on existing bookings (simple round-robin)
    const slotNumber = (existingBookingsAtTime % selectedFormat.maxSlots) + 1;
    
    return {
      formatId: selectedFormat.formatId,
      slotNumber: slotNumber
    };
  };

  // TODAY - Multiple bookings throughout the day for testing day view
  for (let hour = 8; hour <= 22; hour += 2) {
    const { venue, court } = getNextCourt();
    const formatInfo = assignFormatToBooking(court.id);
    bookingsData.push({
      venue,
      court,
      customer: getNextCustomer(),
      date: createDate(0, hour, 0),
      duration: 60,
      status: hour < 12 ? 'COMPLETED' : hour < 18 ? 'CONFIRMED' : 'CONFIRMED',
      notes: `Today ${hour}:00 booking`,
      formatId: formatInfo.formatId,
      slotNumber: formatInfo.slotNumber
    });
  }

  // TOMORROW - Spread bookings across different times
  const tomorrowHours = [9, 11, 14, 16, 18, 19, 20, 21];
  tomorrowHours.forEach((hour, idx) => {
    const { venue, court } = getNextCourt();
    const formatInfo = assignFormatToBooking(court.id, idx);
    bookingsData.push({
      venue,
      court,
      customer: getNextCustomer(),
      date: createDate(1, hour, idx % 2 === 0 ? 0 : 30),
      duration: idx % 3 === 0 ? 90 : idx % 3 === 1 ? 120 : 60,
      status: idx < 3 ? 'CONFIRMED' : 'PENDING',
      notes: `Tomorrow ${hour}:${idx % 2 === 0 ? '00' : '30'} booking`,
      formatId: formatInfo.formatId,
      slotNumber: formatInfo.slotNumber
    });
  });

  // NEXT 7 DAYS - Create bookings for each day of the week
  for (let dayOffset = 2; dayOffset <= 7; dayOffset++) {
    const hours = [10, 14, 17, 19, 20];
    hours.forEach((hour, idx) => {
      const { venue, court } = getNextCourt();
      const statuses: Array<'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'> = 
        ['CONFIRMED', 'CONFIRMED', 'PENDING', 'CONFIRMED', 'CONFIRMED'];
      const formatInfo = assignFormatToBooking(court.id, idx);
      bookingsData.push({
        venue,
        court,
        customer: getNextCustomer(),
        date: createDate(dayOffset, hour, idx % 2 === 0 ? 0 : 30),
        duration: [60, 90, 120, 90, 60][idx],
        status: statuses[idx],
        notes: `Day ${dayOffset} ${hour}:${idx % 2 === 0 ? '00' : '30'}`,
        formatId: formatInfo.formatId,
        slotNumber: formatInfo.slotNumber
      });
    });
  }

  // NEXT 2 WEEKS - More bookings for week/month view testing
  let futureBookingIndex = 0;
  for (let dayOffset = 8; dayOffset <= 14; dayOffset++) {
    const hours = [9, 12, 15, 18, 20];
    hours.forEach((hour) => {
      const { venue, court } = getNextCourt();
      const formatInfo = assignFormatToBooking(court.id, futureBookingIndex++);
      bookingsData.push({
        venue,
        court,
        customer: getNextCustomer(),
        date: createDate(dayOffset, hour, 0),
        duration: hour < 15 ? 60 : 90,
        status: 'CONFIRMED',
        notes: `Future booking day ${dayOffset}`,
        formatId: formatInfo.formatId,
        slotNumber: formatInfo.slotNumber
      });
    });
  }

  // PAST WEEK - Historical bookings for testing past dates
  let pastBookingIndex = 0;
  for (let dayOffset = -7; dayOffset <= -1; dayOffset++) {
    const hours = [10, 14, 18, 20];
    hours.forEach((hour, idx) => {
      const { venue, court } = getNextCourt();
      const statuses: Array<'COMPLETED' | 'CANCELLED' | 'NO_SHOW'> = 
        ['COMPLETED', 'COMPLETED', 'COMPLETED', idx === 3 ? 'NO_SHOW' : 'COMPLETED'];
      const formatInfo = assignFormatToBooking(court.id, pastBookingIndex++);
      bookingsData.push({
        venue,
        court,
        customer: getNextCustomer(),
        date: createDate(dayOffset, hour, 0),
        duration: 60,
        status: statuses[idx],
        notes: `Past booking ${Math.abs(dayOffset)} days ago`,
        formatId: formatInfo.formatId,
        slotNumber: formatInfo.slotNumber
      });
    });
  }

  // PAST MONTH - More historical data
  let historicalBookingIndex = 0;
  for (let dayOffset = -30; dayOffset <= -8; dayOffset += 2) {
    const { venue, court } = getNextCourt();
    const formatInfo = assignFormatToBooking(court.id, historicalBookingIndex++);
    bookingsData.push({
      venue,
      court,
      customer: getNextCustomer(),
      date: createDate(dayOffset, 18, 0),
      duration: 60,
      status: 'COMPLETED',
      notes: `Historical booking ${Math.abs(dayOffset)} days ago`,
      formatId: formatInfo.formatId,
      slotNumber: formatInfo.slotNumber
    });
  }

  // Add some cancelled bookings
  let cancelledBookingIndex = 0;
  for (let i = 0; i < 5; i++) {
    const { venue, court } = getNextCourt();
    const formatInfo = assignFormatToBooking(court.id, cancelledBookingIndex++);
    bookingsData.push({
      venue,
      court,
      customer: getNextCustomer(),
      date: createDate(-3 + i, 19, 0),
      duration: 60,
      status: 'CANCELLED',
      notes: 'Cancelled booking',
      formatId: formatInfo.formatId,
      slotNumber: formatInfo.slotNumber
    });
  }

  // Add overlapping bookings for testing conflict detection (same court, overlapping times)
  if (venuesWithCourts.length > 0 && venuesWithCourts[0].courts.length > 0) {
    const testVenue = venuesWithCourts[0];
    const testCourt = testVenue.courts[0];
    const formatInfo1 = assignFormatToBooking(testCourt.id, 0);
    const formatInfo2 = assignFormatToBooking(testCourt.id, 1);
    
    // Create bookings that are close but don't overlap (for testing)
    bookingsData.push({
      venue: testVenue,
      court: testCourt,
      customer: getNextCustomer(),
      date: createDate(2, 18, 0),
      duration: 60,
      status: 'CONFIRMED',
      notes: 'Test booking 1',
      formatId: formatInfo1.formatId,
      slotNumber: formatInfo1.slotNumber
    });
    bookingsData.push({
      venue: testVenue,
      court: testCourt,
      customer: getNextCustomer(),
      date: createDate(2, 19, 0),
      duration: 60,
      status: 'CONFIRMED',
      notes: 'Test booking 2 - adjacent',
      formatId: formatInfo2.formatId,
      slotNumber: formatInfo2.slotNumber
    });
  }

  // Add specific bookings for Football Turf A to demonstrate format conflict logic
  // Court supports: 11-a-side (1 slot), 7-a-side (2 slots), 5-a-side (4 slots)
  // Total slots = 4
  // IMPORTANT: Bookings must respect conflict logic - no conflicting bookings!
  const whitefieldVenue = venuesWithCourts.find(v => v.name === '3Lok Sports Hub - Whitefield');
  if (whitefieldVenue) {
    const footballTurfA = whitefieldVenue.courts.find(c => c.courtNumber === 'Turf A');
    
    if (footballTurfA) {
      // Get formats for this court
      const courtFormats = await prisma.courtFormat.findMany({
        where: {
          courtId: footballTurfA.id,
          isActive: true
        },
        include: {
          format: true
        }
      });

      const formatMap = new Map(courtFormats.map(cf => [cf.format.name, cf.formatId]));

      // Scenario 1: Today at 16:00 - 2x 7-a-side (valid - uses 4 slots total, no conflicts)
      if (formatMap.has('7-a-side')) {
        bookingsData.push({
          venue: whitefieldVenue,
          court: footballTurfA,
          customer: getNextCustomer(),
          date: createDate(0, 16, 0),
          duration: 60,
          status: 'CONFIRMED',
          notes: '7-a-side match - Slot 1',
          formatId: formatMap.get('7-a-side'),
          slotNumber: 1
        });
        bookingsData.push({
          venue: whitefieldVenue,
          court: footballTurfA,
          customer: getNextCustomer(),
          date: createDate(0, 16, 0),
          duration: 60,
          status: 'CONFIRMED',
          notes: '7-a-side match - Slot 2',
          formatId: formatMap.get('7-a-side'),
          slotNumber: 2
        });
      }

      // Scenario 2: Today at 17:00 - 4x 5-a-side (valid - uses all 4 slots, no conflicts)
      if (formatMap.has('5-a-side')) {
        bookingsData.push({
          venue: whitefieldVenue,
          court: footballTurfA,
          customer: getNextCustomer(),
          date: createDate(0, 17, 0),
          duration: 60,
          status: 'CONFIRMED',
          notes: '5-a-side match - Slot 1',
          formatId: formatMap.get('5-a-side'),
          slotNumber: 1
        });
        bookingsData.push({
          venue: whitefieldVenue,
          court: footballTurfA,
          customer: getNextCustomer(),
          date: createDate(0, 17, 0),
          duration: 60,
          status: 'CONFIRMED',
          notes: '5-a-side match - Slot 2',
          formatId: formatMap.get('5-a-side'),
          slotNumber: 2
        });
        bookingsData.push({
          venue: whitefieldVenue,
          court: footballTurfA,
          customer: getNextCustomer(),
          date: createDate(0, 17, 0),
          duration: 60,
          status: 'CONFIRMED',
          notes: '5-a-side match - Slot 3',
          formatId: formatMap.get('5-a-side'),
          slotNumber: 3
        });
        bookingsData.push({
          venue: whitefieldVenue,
          court: footballTurfA,
          customer: getNextCustomer(),
          date: createDate(0, 17, 0),
          duration: 60,
          status: 'CONFIRMED',
          notes: '5-a-side match - Slot 4',
          formatId: formatMap.get('5-a-side'),
          slotNumber: 4
        });
      }

      // Scenario 3: Today at 18:00 - 1x 11-a-side (valid - uses all 4 slots, no conflicts)
      if (formatMap.has('11-a-side')) {
        bookingsData.push({
          venue: whitefieldVenue,
          court: footballTurfA,
          customer: getNextCustomer(),
          date: createDate(0, 18, 0),
          duration: 60,
          status: 'CONFIRMED',
          notes: '11-a-side match - Full court',
          formatId: formatMap.get('11-a-side'),
          slotNumber: 1
        });
      }

      // Scenario 4: Today at 19:00 - 1x 7-a-side + 2x 5-a-side (valid - 2+2=4 slots, same size formats can coexist)
      // Note: This demonstrates that 7-a-side and 5-a-side can coexist when slots allow
      if (formatMap.has('7-a-side') && formatMap.has('5-a-side')) {
        bookingsData.push({
          venue: whitefieldVenue,
          court: footballTurfA,
          customer: getNextCustomer(),
          date: createDate(0, 19, 0),
          duration: 60,
          status: 'CONFIRMED',
          notes: '7-a-side match - Mixed formats',
          formatId: formatMap.get('7-a-side'),
          slotNumber: 1
        });
        bookingsData.push({
          venue: whitefieldVenue,
          court: footballTurfA,
          customer: getNextCustomer(),
          date: createDate(0, 19, 0),
          duration: 60,
          status: 'CONFIRMED',
          notes: '5-a-side match - Slot 1',
          formatId: formatMap.get('5-a-side'),
          slotNumber: 1
        });
        bookingsData.push({
          venue: whitefieldVenue,
          court: footballTurfA,
          customer: getNextCustomer(),
          date: createDate(0, 19, 0),
          duration: 60,
          status: 'CONFIRMED',
          notes: '5-a-side match - Slot 2',
          formatId: formatMap.get('5-a-side'),
          slotNumber: 2
        });
      }

      // Scenario 5: Tomorrow at 16:00 - Sequential bookings (no overlap) - all formats work
      if (formatMap.has('11-a-side')) {
        bookingsData.push({
          venue: whitefieldVenue,
          court: footballTurfA,
          customer: getNextCustomer(),
          date: createDate(1, 16, 0),
          duration: 60,
          status: 'CONFIRMED',
          notes: '11-a-side match - Sequential',
          formatId: formatMap.get('11-a-side'),
          slotNumber: 1
        });
      }
      if (formatMap.has('7-a-side')) {
        bookingsData.push({
          venue: whitefieldVenue,
          court: footballTurfA,
          customer: getNextCustomer(),
          date: createDate(1, 17, 0),
          duration: 60,
          status: 'CONFIRMED',
          notes: '7-a-side match - Sequential',
          formatId: formatMap.get('7-a-side'),
          slotNumber: 1
        });
      }
      if (formatMap.has('5-a-side')) {
        bookingsData.push({
          venue: whitefieldVenue,
          court: footballTurfA,
          customer: getNextCustomer(),
          date: createDate(1, 18, 0),
          duration: 60,
          status: 'CONFIRMED',
          notes: '5-a-side match - Sequential',
          formatId: formatMap.get('5-a-side'),
          slotNumber: 1
        });
      }

      // Scenario 6: Tomorrow at 19:00 - 1x 7-a-side only (valid - 2 slots used, 2 remaining but no other bookings)
      if (formatMap.has('7-a-side')) {
        bookingsData.push({
          venue: whitefieldVenue,
          court: footballTurfA,
          customer: getNextCustomer(),
          date: createDate(1, 19, 0),
          duration: 60,
          status: 'CONFIRMED',
          notes: '7-a-side match - Single booking',
          formatId: formatMap.get('7-a-side'),
          slotNumber: 1
        });
      }

      // Scenario 7: Day after tomorrow at 16:00 - 2x 5-a-side (valid - 2 slots used, 2 remaining)
      if (formatMap.has('5-a-side')) {
        bookingsData.push({
          venue: whitefieldVenue,
          court: footballTurfA,
          customer: getNextCustomer(),
          date: createDate(2, 16, 0),
          duration: 60,
          status: 'CONFIRMED',
          notes: '5-a-side match - Slot 1',
          formatId: formatMap.get('5-a-side'),
          slotNumber: 1
        });
        bookingsData.push({
          venue: whitefieldVenue,
          court: footballTurfA,
          customer: getNextCustomer(),
          date: createDate(2, 16, 0),
          duration: 60,
          status: 'CONFIRMED',
          notes: '5-a-side match - Slot 2',
          formatId: formatMap.get('5-a-side'),
          slotNumber: 2
        });
      }
    }
  }

  console.log(`📝 Generated ${bookingsData.length} booking entries`);

  // Create bookings in batches for better performance
  let createdCount = 0;
  let errorCount = 0;
  const batchSize = 50;

  for (let i = 0; i < bookingsData.length; i += batchSize) {
    const batch = bookingsData.slice(i, i + batchSize);
    const bookingPromises = batch.map(async (bookingData) => {
      try {
        // Verify court and customer exist
        if (!bookingData.court?.id || !bookingData.customer?.id) {
          throw new Error('Missing court or customer ID');
        }

        const startTime = new Date(bookingData.date);
        const endTime = new Date(startTime.getTime() + bookingData.duration * 60 * 1000);
        
        // Calculate total amount based on court price and duration
        const hours = bookingData.duration / 60;
        const totalAmount = Number(bookingData.court.pricePerHour) * hours;

        // Check if booking already exists (avoid duplicates)
        const existingBooking = await prisma.booking.findFirst({
          where: {
            courtId: bookingData.court.id,
            startTime: startTime,
            userId: bookingData.customer.id
          }
        });

        if (existingBooking) {
          return null; // Skip duplicate
        }

        return await prisma.booking.create({
          data: {
            userId: bookingData.customer.id,
            courtId: bookingData.court.id,
            date: startTime,
            startTime: startTime,
            endTime: endTime,
            totalAmount: totalAmount,
            status: bookingData.status,
            notes: bookingData.notes,
            formatId: bookingData.formatId || null,
            slotNumber: bookingData.slotNumber || null,
          },
        });
      } catch (error: any) {
        errorCount++;
        if (errorCount <= 5) { // Only log first 5 errors to avoid spam
          console.error(`   Error creating booking: ${error?.message || error}`);
        }
        return null;
      }
    });

    const results = await Promise.all(bookingPromises);
    const successful = results.filter(r => r !== null).length;
    createdCount += successful;
    
    if (i % (batchSize * 5) === 0) {
      console.log(`   Progress: ${Math.min(i + batchSize, bookingsData.length)}/${bookingsData.length} bookings processed...`);
    }
  }

  console.log(`✅ Created ${createdCount} bookings across ${venuesWithCourts.length} venue(s)`);
  
  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} bookings failed to create (duplicates or errors)`);
  }

  // Display summary by status
  const statusCounts = await prisma.booking.groupBy({
    by: ['status'],
    _count: { id: true }
  });
  
  console.log('\n📊 Bookings by status:');
  statusCounts.forEach(({ status, _count }) => {
    console.log(`   ${status}: ${_count.id}`);
  });

  // Display summary by date range
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  
  const todayBookings = await prisma.booking.count({
    where: {
      startTime: {
        gte: todayDate,
        lt: tomorrowDate
      }
    }
  });
  
  const thisWeekBookings = await prisma.booking.count({
    where: {
      startTime: {
        gte: todayDate,
        lt: new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      }
    }
  });
  
  console.log('\n📅 Bookings by date range:');
  console.log(`   Today: ${todayBookings} bookings`);
  console.log(`   This week: ${thisWeekBookings} bookings`);
  
  // Get vendor-specific counts
  const allVendors = await prisma.vendor.findMany({ where: { deletedAt: null } });
  console.log('\n🏪 Bookings per vendor:');
  for (const vendor of allVendors) {
    const vendorBookingCount = await prisma.booking.count({
      where: {
        court: {
          venue: {
            vendorId: vendor.id,
            deletedAt: null
          }
        }
      }
    });
    console.log(`   ${vendor.name}: ${vendorBookingCount} bookings`);
  }
}

// CLEAR ALL DATA FUNCTION
async function clearAllData() {
  console.log('🧹 Clearing existing data...\n');

  try {
    // Delete in reverse order of dependencies
    await prisma.booking.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.teamMember.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.courtFormat.deleteMany({});
    await prisma.court.deleteMany({});
    await prisma.venueOperatingHours.deleteMany({});
    await prisma.venue.deleteMany({});
    await prisma.formatType.deleteMany({});
    await prisma.vendorSettings.deleteMany({});
    await prisma.vendorStaff.deleteMany({});
    await prisma.vendor.deleteMany({});
    await prisma.sportType.deleteMany({});
    // Note: We keep users as they might be referenced elsewhere
    // Uncomment if you want to clear users too:
    // await prisma.user.deleteMany({});
    
    console.log('✅ All data cleared successfully\n');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

// MAIN SEEDING FUNCTION
async function seedAll() {
  console.log('🚀 Starting clean database seeding...\n');

  try {
    // Clear existing data first
    await clearAllData();
    
    // Seed data in correct order
    await seedSports();
    await seedUsers();
    await seedVendors(); // Must be before seedFormatTypes
    await seedFormatTypes(); // Now vendors exist
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