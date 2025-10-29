// Modern API Test Setup - Clean slate for every test! 
const { PrismaClient } = require('@prisma/client')

// Global database setup (runs once)
let prisma

beforeAll(async () => {
  // Initialize test database connection
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./test-new.db'
      }
    }
  })
  
  global.testPrisma = prisma
  console.log('🔗 Test database connection established')
}, 10000)

// 🧹 CLEAN SLATE BEFORE EACH TEST - Best Practice!
beforeEach(async () => {
  if (!prisma) return

  console.log('🧹 Cleaning test database for fresh start...')

  try {
    // Clear all data in dependency order (foreign keys matter!)
    await prisma.booking.deleteMany()
    await prisma.venue.deleteMany()
    await prisma.vendorSettings.deleteMany()
    await prisma.vendorLocation.deleteMany()
    await prisma.user.deleteMany()
    await prisma.vendor.deleteMany()
    await prisma.formatType.deleteMany()
    await prisma.sportType.deleteMany()
    await prisma.teamMember.deleteMany()
    await prisma.team.deleteMany()
    await prisma.match.deleteMany()
    await prisma.payment.deleteMany()

    // Seed fresh data for THIS test
    await seedFreshTestData()

    console.log('✅ Fresh test data ready!')

  } catch (error) {
    console.error('❌ Failed to prepare test data:', error)
    throw error
  }
}, 15000)

afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect()
    console.log('🔌 Test database disconnected')
  }
})

// 🌱 Seed MINIMAL data needed for tests
async function seedFreshTestData() {
  // Create test vendor
  const vendor = await prisma.vendor.create({
    data: {
      id: 'test-vendor-1',
      name: 'Test Sports Hub',
      slug: 'test-sports-hub',
      description: 'A test sports facility',
      address: '123 Test Street, Test City',
      phone: '+91 9999999999',
      email: 'contact@testsports.com',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      isActive: true
    }
  })

  // Create admin user
  await prisma.user.create({
    data: {
      id: 'test-admin-1',
      name: 'Test Admin',
      email: 'admin@testsports.com',
      role: 'VENDOR_ADMIN',
      vendorId: vendor.id,
      password: 'test123',
      isActive: true
    }
  })

  // Create customer user
  await prisma.user.create({
    data: {
      id: 'test-customer-1',
      name: 'Test Customer',
      email: 'customer@example.com',
      role: 'CUSTOMER',
      password: 'test123',
      isActive: true
    }
  })

  // Create sport types first
  const sports = [
    { name: 'football', displayName: 'Football', icon: '⚽', isActive: true },
    { name: 'basketball', displayName: 'Basketball', icon: '🏀', isActive: true },
    { name: 'cricket', displayName: 'Cricket', icon: '🏏', isActive: true }
  ]

  const createdSports = []
  for (const sport of sports) {
    const created = await prisma.sportType.create({
      data: sport
    })
    createdSports.push(created)
  }

  // Create format types for each sport
  const formats = [
    // Football formats
    { sportId: createdSports[0].id, name: '11-a-side', displayName: '11 a side (Full Field)', minPlayers: 11, maxPlayers: 22 },
    { sportId: createdSports[0].id, name: '7-a-side', displayName: '7 a side (Small Field)', minPlayers: 7, maxPlayers: 14 },
    { sportId: createdSports[0].id, name: '5-a-side', displayName: '5 a side (Mini Field)', minPlayers: 5, maxPlayers: 10 },
    // Basketball formats
    { sportId: createdSports[1].id, name: 'full-court', displayName: 'Full Court', minPlayers: 5, maxPlayers: 10 },
    { sportId: createdSports[1].id, name: 'half-court', displayName: 'Half Court', minPlayers: 3, maxPlayers: 6 },
    // Cricket formats
    { sportId: createdSports[2].id, name: 't20', displayName: 'T20', minPlayers: 11, maxPlayers: 22 }
  ]

  const createdFormats = []
  for (const format of formats) {
    const created = await prisma.formatType.create({
      data: format
    })
    createdFormats.push(created)
  }

  // Create vendor settings
  await prisma.vendorSettings.create({
    data: {
      vendorId: vendor.id,
      advanceBookingDays: 30,
      cancellationPolicy: 'Full refund if cancelled 24 hours before booking',
      paymentMethods: JSON.stringify(['cash', 'card', 'upi']),
      bookingTimeSlots: 60,
      maxConcurrentBookings: 1,
      basePrice: 1000,
      showBookingCalendar: true,
      showPricingPublicly: true,
      allowOnlinePayments: true,
      showContactInfo: true,
      autoApproval: true,
      availableAmenities: JSON.stringify(['parking', 'changing_rooms', 'floodlights']),
      sportTypes: JSON.stringify(['football', 'basketball', 'cricket'])
    }
  })

  // Create vendor location
  const location = await prisma.vendorLocation.create({
    data: {
      id: 'test-location-1',
      vendorId: vendor.id,
      name: 'Test Sports Hub - Main',
      address: '123 Test Street, Test City',
      city: 'Test City',
      area: 'Test Area',
      pincode: '560001',
      phone: '+91 9999999999',
      operatingHours: JSON.stringify({
        monday: { open: '09:00', close: '21:00', closed: false },
        tuesday: { open: '09:00', close: '21:00', closed: false },
        wednesday: { open: '09:00', close: '21:00', closed: false },
        thursday: { open: '09:00', close: '21:00', closed: false },
        friday: { open: '09:00', close: '21:00', closed: false },
        saturday: { open: '08:00', close: '22:00', closed: false },
        sunday: { open: '08:00', close: '22:00', closed: false }
      }),
      isActive: true
    }
  })

  // Create test venues (new schema)
  await prisma.venue.create({
    data: {
      id: 'test-venue-1',
      vendorId: vendor.id,
      locationId: location.id,
      sportId: createdSports[0].id, // Football
      formatId: createdFormats[0].id, // 11-a-side
      courtNumber: 'Field 1',
      pricePerHour: 2000,
      maxPlayers: 22,
      isActive: true,
      amenities: JSON.stringify(['parking', 'changing_rooms', 'floodlights']),
      description: 'Full size football field',
      images: JSON.stringify(['https://example.com/field1.jpg'])
    }
  })

  await prisma.venue.create({
    data: {
      id: 'test-venue-2',
      vendorId: vendor.id,
      locationId: location.id,
      sportId: createdSports[1].id, // Basketball
      formatId: createdFormats[3].id, // Full Court
      courtNumber: 'Court 1',
      pricePerHour: 1500,
      maxPlayers: 10,
      isActive: true,
      amenities: JSON.stringify(['parking', 'changing_rooms']),
      description: 'Full basketball court',
      images: JSON.stringify(['https://example.com/court1.jpg'])
    }
  })
}

// 🛠️ Test utilities for generating fresh data
global.testUtils = {
  // Helper to create unique booking data
  getBookingData(overrides = {}) {
    // If testNumber is provided, use different dates for different tests
    const testNumber = overrides.testNumber || 1
    delete overrides.testNumber // Remove from overrides so it doesn't override other fields

    let baseDateTime
    if (testNumber > 1) {
      // Use the test date range for specific test scenarios
      const targetDate = this.getTestDateRange(testNumber)
      baseDateTime = new Date(targetDate + 'T10:00:00.000Z')
    } else {
      // Default: tomorrow at 10:00 AM
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)
      baseDateTime = tomorrow
    }

    const startTime = overrides.startTime || baseDateTime
    const duration = overrides.duration || 2
    const endTime = overrides.endTime ||
      new Date(startTime.getTime() + duration * 60 * 60 * 1000)

    return {
      venueId: 'test-venue-1',
      vendorId: 'test-vendor-1',
      startTime: startTime.toISOString(), // ISO DateTime string
      endTime: endTime.toISOString(), // ISO DateTime string
      duration,
      totalAmount: overrides.totalAmount || 4000,
      status: 'CONFIRMED',
      bookingType: 'MATCH',
      customerName: 'Test Customer',
      customerPhone: '+91 9876543210',
      customerEmail: 'customer@example.com',
      ...overrides
    }
  },

  // Helper for future dates
  getFutureDate(daysFromNow = 1) {
    const future = new Date()
    future.setDate(future.getDate() + daysFromNow)
    return future.toISOString().split('T')[0]
  },

  // Helper for different time slots
  getTimeSlots() {
    return {
      morning: { start: '09:00', end: '11:00' },
      afternoon: { start: '14:00', end: '16:00' },
      evening: { start: '18:00', end: '20:00' }
    }
  },

  // Helper for tomorrow's date (for availability tests)
  getTomorrowDate() {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  },

  // Helper for test date ranges
  getTestDateRange(testNumber = 1) {
    const baseDate = new Date('2025-12-01')
    baseDate.setDate(baseDate.getDate() + testNumber - 1)
    return baseDate.toISOString().split('T')[0]
  },

  // Helper to create test bookings
  async createTestBooking(data = {}) {
    const db = global.testPrisma
    if (!db) return null

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const startTime = new Date(tomorrow)
    startTime.setHours(14, 0, 0, 0) // 2:00 PM
    const endTime = new Date(startTime)
    endTime.setHours(startTime.getHours() + 2) // 4:00 PM

    const defaultData = {
      venueId: 'test-venue-1',
      vendorId: 'test-vendor-1',
      startTime: startTime,
      endTime: endTime,
      duration: 2,
      totalAmount: 4000,
      status: 'CONFIRMED',
      bookingType: 'MATCH',
      customerName: 'Test Customer',
      customerPhone: '+91 9876543210',
      customerEmail: 'customer@example.com'
    }

    return await db.booking.create({
      data: { ...defaultData, ...data }
    })
  }
}