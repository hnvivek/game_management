// Modern API Test Setup - Clean slate for every test! 
const { PrismaClient } = require('@prisma/client')

// Global database setup (runs once)
let prisma

beforeAll(async () => {
  // Initialize test database connection
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./test.db'
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
    await prisma.turfAvailability.deleteMany() 
    await prisma.turf.deleteMany()
    await prisma.vendorSettings.deleteMany()
    await prisma.user.deleteMany()
    await prisma.vendor.deleteMany()
    await prisma.sportType.deleteMany()
    
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
      location: 'Test City, Test State',
      address: '123 Test Street, Test City',
      phone: '+91 9999999999',
      email: 'contact@testsports.com',
      isActive: true
    }
  })

  // Create admin user
  await prisma.user.create({
    data: {
      id: 'test-admin-1',
      name: 'Test Admin',
      email: 'admin@testsports.com',
      role: 'vendor_admin',
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
      role: 'customer',
      password: 'test123',
      isActive: true
    }
  })

  // Create vendor settings
  await prisma.vendorSettings.create({
    data: {
      vendorId: vendor.id,
      operatingHours: JSON.stringify({
        monday: { open: '09:00', close: '21:00', closed: false },
        tuesday: { open: '09:00', close: '21:00', closed: false },
        wednesday: { open: '09:00', close: '21:00', closed: false },
        thursday: { open: '09:00', close: '21:00', closed: false },
        friday: { open: '09:00', close: '21:00', closed: false },
        saturday: { open: '08:00', close: '22:00', closed: false },
        sunday: { open: '08:00', close: '22:00', closed: false }
      }),
      paymentMethods: JSON.stringify(['cash', 'card', 'upi']),
      autoApproval: true,
      advanceBookingDays: 30
    }
  })

  // Create test turfs/venues  
  await prisma.turf.create({
    data: {
      id: 'test-turf-1',
      vendorId: vendor.id,
      name: vendor.name,
      venue: vendor.location,
      sport: 'soccer', 
      size: '8 a side',
      courtNumber: 'Field 1',
      pricePerHour: 2000,
      maxPlayers: 16,
      isActive: true,
      amenities: JSON.stringify(['parking', 'changing_rooms', 'floodlights'])
    }
  })

  await prisma.turf.create({
    data: {
      id: 'test-turf-2',
      vendorId: vendor.id,
      name: vendor.name,
      venue: vendor.location,
      sport: 'basketball',
      size: 'Full Court', 
      courtNumber: 'Court 1',
      pricePerHour: 1500,
      maxPlayers: 10,
      isActive: true,
      amenities: JSON.stringify(['parking', 'changing_rooms'])
    }
  })

  // Create sport types catalog
  const sports = [
    { name: 'soccer', displayName: 'Football/Soccer', isActive: true },
    { name: 'basketball', displayName: 'Basketball', isActive: true },
    { name: 'cricket', displayName: 'Cricket', isActive: true }
  ]

  for (const sport of sports) {
    await prisma.sportType.create({
      data: sport
    })
  }
}

// 🛠️ Test utilities for generating fresh data
global.testUtils = {
  // Helper to create unique booking data
  getBookingData(overrides = {}) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return {
      turfId: 'test-turf-1',
      vendorId: 'test-vendor-1', 
      date: tomorrow.toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '12:00',
      duration: 2,
      totalAmount: 4000,
      status: 'confirmed',
      bookingType: 'match',
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
    
    const defaultData = {
      turfId: 'test-turf-1',
      vendorId: 'test-vendor-1',
      date: this.getFutureDate(1),
      startTime: '09:00',
      endTime: '11:00',
      duration: 2,
      totalAmount: 4000,
      status: 'confirmed',
      bookingType: 'match',
      customerName: 'Test Customer',
      customerPhone: '+91 9876543210',
      customerEmail: 'customer@example.com'
    }

    return await db.booking.create({
      data: { ...defaultData, ...data }
    })
  }
}