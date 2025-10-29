import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { db } from '@/lib/db'

// Test data setup
let testVendorId: string
let testVenueId: string
let testCustomerId: string
let testBookingId: string

describe('Bookings API Tests', () => {
  beforeAll(async () => {
    // Setup test data
    const vendor = await db.vendor.findFirst()
    const venue = await db.venue.findFirst({ where: { vendorId: vendor?.id } })

    if (!vendor || !venue) {
      throw new Error('Required test data not found. Please seed database first.')
    }

    testVendorId = vendor.id
    testVenueId = venue.id

    // Create test customer
    const customer = await db.user.create({
      data: {
        email: 'test-customer@example.com',
        name: 'Test Customer',
        phone: '+919876543214',
        role: 'CUSTOMER'
      }
    })

    testCustomerId = customer.id
  })

  afterAll(async () => {
    // Cleanup test data
    try {
      await db.booking.deleteMany({ where: { customerId: testCustomerId } })
      await db.user.delete({ where: { id: testCustomerId } })
    } catch (error) {
      console.log('Cleanup error:', error)
    }
  })

  describe('POST /api/bookings', () => {
    it('should create a new booking', async () => {
      const startTime = new Date()
      startTime.setHours(startTime.getHours() + 48) // Day after tomorrow
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000) // 2 hours later

      const bookingData = {
        venueId: testVenueId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: '2',
        totalAmount: 1000,
        bookingType: 'MATCH',
        customerName: 'Test Customer',
        customerPhone: '+919876543215',
        customerEmail: 'test@example.com',
        notes: 'Test booking'
      }

      const response = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.booking).toBeDefined()
      expect(data.booking.venueId).toBe(testVenueId)
      expect(data.booking.status).toBe('CONFIRMED')
      expect(data.booking.totalAmount).toBe(1000)

      testBookingId = data.booking.id
    })

    it('should validate required fields', async () => {
      const invalidData = {
        venueId: testVenueId
        // Missing required fields
      }

      const response = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Missing required fields')
    })

    it('should validate DateTime format', async () => {
      const invalidData = {
        venueId: testVenueId,
        startTime: 'invalid-date',
        duration: '2',
        totalAmount: 1000
      }

      const response = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid startTime format')
    })

    it('should validate venue exists', async () => {
      const startTime = new Date()
      startTime.setHours(startTime.getHours() + 72) // 3 days from now

      const invalidData = {
        venueId: 'non-existent-venue-id',
        startTime: startTime.toISOString(),
        duration: '2',
        totalAmount: 1000
      }

      const response = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('Venue not found')
    })

    it('should check venue availability', async () => {
      // First booking should succeed
      const startTime = new Date()
      startTime.setHours(startTime.getHours() + 96) // 4 days from now
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000)

      const firstBooking = {
        venueId: testVenueId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: '2',
        totalAmount: 1000
      }

      const firstResponse = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firstBooking)
      })

      expect(firstResponse.status).toBe(200)

      // Second booking with overlapping time should fail
      const overlapStartTime = new Date(startTime.getTime() + 30 * 60 * 1000) // 30 mins later
      const overlapEndTime = new Date(overlapStartTime.getTime() + 2 * 60 * 60 * 1000)

      const secondBooking = {
        venueId: testVenueId,
        startTime: overlapStartTime.toISOString(),
        endTime: overlapEndTime.toISOString(),
        duration: '2',
        totalAmount: 1000
      }

      const secondResponse = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(secondBooking)
      })

      expect(secondResponse.status).toBe(409)
      const data = await secondResponse.json()
      expect(data.error).toContain('Venue is not available')
    })

    it('should calculate endTime if not provided', async () => {
      const startTime = new Date()
      startTime.setHours(startTime.getHours() + 120) // 5 days from now

      const bookingData = {
        venueId: testVenueId,
        startTime: startTime.toISOString(),
        duration: '3', // 3 hours
        totalAmount: 1500
      }

      const response = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      const expectedEndTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000)

      expect(new Date(data.booking.endTime)).toEqual(expectedEndTime)
    })
  })

  describe('GET /api/bookings', () => {
    it('should list bookings with no filters', async () => {
      const response = await fetch('http://localhost:3000/api/bookings')

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.bookings).toBeDefined()
      expect(data.pagination).toBeDefined()
      expect(Array.isArray(data.bookings)).toBe(true)
    })

    it('should filter bookings by venue', async () => {
      const response = await fetch(`http://localhost:3000/api/bookings?venueId=${testVenueId}`)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.bookings.every((booking: any) => booking.venueId === testVenueId)).toBe(true)
    })

    it('should filter bookings by status', async () => {
      const response = await fetch('http://localhost:3000/api/bookings?status=CONFIRMED')

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.bookings.every((booking: any) => booking.status === 'CONFIRMED')).toBe(true)
    })

    it('should filter bookings by type', async () => {
      const response = await fetch('http://localhost:3000/api/bookings?bookingType=MATCH')

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.bookings.every((booking: any) => booking.bookingType === 'MATCH')).toBe(true)
    })

    it('should filter bookings by date range', async () => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 1) // Yesterday
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 7) // Next week

      const response = await fetch(
        `http://localhost:3000/api/bookings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()

      data.bookings.forEach((booking: any) => {
        const bookingTime = new Date(booking.startTime)
        expect(bookingTime >= startDate && bookingTime <= endDate).toBe(true)
      })
    })

    it('should support pagination', async () => {
      const response = await fetch('http://localhost:3000/api/bookings?limit=5&offset=0')

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.bookings.length).toBeLessThanOrEqual(5)
      expect(data.pagination.limit).toBe(5)
      expect(data.pagination.offset).toBe(0)
      expect(data.pagination.total).toBeDefined()
      expect(data.pagination.hasMore).toBeDefined()
    })

    it('should include booking relationships', async () => {
      const response = await fetch(`http://localhost:3000/api/bookings?venueId=${testVenueId}`)

      expect(response.status).toBe(200)
      const data = await response.json()

      if (data.bookings.length > 0) {
        const booking = data.bookings[0]

        expect(booking.venue).toBeDefined()
        expect(booking.venue.vendor).toBeDefined()
        expect(booking.venue.sport).toBeDefined()
        expect(booking.payments).toBeDefined()
      }
    })

    it('should order bookings by start time descending', async () => {
      const response = await fetch('http://localhost:3000/api/bookings?limit=10')

      expect(response.status).toBe(200)
      const data = await response.json()

      if (data.bookings.length > 1) {
        for (let i = 0; i < data.bookings.length - 1; i++) {
          const currentTime = new Date(data.bookings[i].startTime)
          const nextTime = new Date(data.bookings[i + 1].startTime)
          expect(currentTime >= nextTime).toBe(true)
        }
      }
    })
  })

  describe('Venue availability checking', () => {
    it('should detect conflicts with existing bookings', async () => {
      const startTime = new Date()
      startTime.setHours(startTime.getHours() + 144) // 6 days from now
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000)

      // Create first booking
      const firstBooking = await db.booking.create({
        data: {
          venueId: testVenueId,
          vendorId: testVendorId,
          startTime,
          endTime,
          duration: 2,
          totalAmount: 1000,
          status: 'CONFIRMED'
        }
      })

      // Test overlap detection with exact same time
      const exactOverlap = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: testVenueId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: '2',
          totalAmount: 1000
        })
      })

      expect(exactOverlap.status).toBe(409)

      // Test overlap detection with partial time
      const partialStart = new Date(startTime.getTime() + 30 * 60 * 1000) // 30 mins after start
      const partialEnd = new Date(endTime.getTime() + 30 * 60 * 1000) // 30 mins after end

      const partialOverlap = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: testVenueId,
          startTime: partialStart.toISOString(),
          endTime: partialEnd.toISOString(),
          duration: '2',
          totalAmount: 1000
        })
      })

      expect(partialOverlap.status).toBe(409)

      // Test no overlap with different time
      const noOverlapStart = new Date(startTime.getTime() + 3 * 60 * 60 * 1000) // 3 hours after start
      const noOverlapEnd = new Date(noOverlapStart.getTime() + 2 * 60 * 60 * 1000)

      const noOverlap = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: testVenueId,
          startTime: noOverlapStart.toISOString(),
          endTime: noOverlapEnd.toISOString(),
          duration: '2',
          totalAmount: 1000
        })
      })

      expect(noOverlap.status).toBe(200)

      // Cleanup
      await db.booking.delete({ where: { id: firstBooking.id } })
    })
  })
})