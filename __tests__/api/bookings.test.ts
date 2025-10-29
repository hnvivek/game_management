import { describe, it, expect, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/bookings/route'

describe('/api/bookings', () => {
  // ✨ Each test gets FRESH data - perfect isolation!

  describe('POST /api/bookings', () => {
    // Helper function using the new clean utilities
    const getValidBookingData = (overrides = {}) =>
      global.testUtils.getBookingData(overrides)

    it('should create a booking successfully', async () => {
      const bookingData = getValidBookingData() // Fresh data for this test

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.booking).toBeDefined()
      expect(data.booking.venueId).toBe(bookingData.venueId)
      expect(typeof data.booking.startTime).toBe('string')
      expect(typeof data.booking.endTime).toBe('string')
      expect(data.booking.duration).toBe(2)
      expect(data.booking.totalAmount).toBe(bookingData.totalAmount)
      expect(data.booking.status).toBe('CONFIRMED')
      expect(data.booking).toHaveProperty('venue')
      expect(data.booking.venue).toHaveProperty('vendor')
    })

    it('should reject booking with missing required fields', async () => {
      const invalidData = {
        venueId: 'test-venue-1',
        startTime: '2025-12-01T09:00:00.000Z',
        endTime: '2025-12-01T11:00:00.000Z'
        // Missing duration
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields: venueId, startTime, duration, totalAmount')
    })

    it('should reject booking for non-existent venue', async () => {
      const invalidData = {
        ...getValidBookingData(),
        venueId: 'non-existent-venue'
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Venue not found')
    })

    it('should reject conflicting bookings', async () => {
      // Create first booking at 15:00-17:00 on 2025-12-03
      const firstBooking = getValidBookingData({
        testNumber: 3,
        startTime: new Date('2025-12-03T15:00:00.000Z'),
        endTime: new Date('2025-12-03T17:00:00.000Z')
      })

      const request1 = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firstBooking)
      })

      const response1 = await POST(request1)
      expect(response1.status).toBe(200)

      // Try to create conflicting booking (same date, same venue, overlapping time)
      const conflictingData = {
        ...firstBooking, // Same date and venue
        startTime: new Date('2025-12-03T16:00:00.000Z'), // Overlaps with 15:00-17:00
        endTime: new Date('2025-12-03T18:00:00.000Z') // Would be 16:00-18:00, overlaps with existing 15:00-17:00
      }

      const request2 = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conflictingData)
      })

      const response2 = await POST(request2)
      const data2 = await response2.json()

      expect(response2.status).toBe(409)
      expect(data2.error).toBe('Venue is not available for the selected time slot')
    })

    it('should allow non-overlapping bookings', async () => {
      // These use completely different dates, so no conflicts possible!
      const booking1 = getValidBookingData({
        testNumber: 4,
        startTime: new Date('2025-12-04T18:00:00.000Z'),
        endTime: new Date('2025-12-04T20:00:00.000Z')
      }) // Test 4: 2025-12-04, 18:00-20:00

      const booking2 = getValidBookingData({
        testNumber: 5,
        startTime: new Date('2025-12-05T09:00:00.000Z'),
        endTime: new Date('2025-12-05T11:00:00.000Z')
      }) // Test 5: 2025-12-05, 09:00-11:00

      // Create first booking
      const request1 = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking1)
      })

      const response1 = await POST(request1)
      expect(response1.status).toBe(200)

      // Create second booking (different date = no conflict)
      const request2 = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking2)
      })

      const response2 = await POST(request2)
      const data2 = await response2.json()

      expect(response2.status).toBe(200)
      expect(data2.booking).toBeDefined()
      expect(typeof data2.booking.startTime).toBe('string')
      expect(new Date(data2.booking.startTime)).toEqual(new Date(booking2.startTime))
    })

    it('should handle different booking types', async () => {
      const practiceBooking = {
        ...getValidBookingData(),
        bookingType: 'PRACTICE',
        startTime: '2025-12-01T18:00:00.000Z',
        endTime: '2025-12-01T20:00:00.000Z'
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(practiceBooking)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.booking.bookingType).toBe('PRACTICE')
    })

    it('should handle bookings with customer information', async () => {
      const customerBooking = {
        ...getValidBookingData(),
        customerName: 'John Doe',
        customerPhone: '+91 9876543210',
        customerEmail: 'john@example.com',
        notes: 'Special request for equipment'
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerBooking)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.booking.customerName).toBe('John Doe')
      expect(data.booking.customerPhone).toBe('+91 9876543210')
      expect(data.booking.customerEmail).toBe('john@example.com')
      expect(data.booking.notes).toBe('Special request for equipment')
    })

    it('should reject invalid datetime formats', async () => {
      const invalidDateTimeData = {
        ...getValidBookingData(),
        startTime: 'invalid-datetime'
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidDateTimeData)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should reject negative duration', async () => {
      const negativeDurationData = {
        ...getValidBookingData(),
        duration: -1
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(negativeDurationData)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should handle booking status transitions', async () => {
      const bookingData = {
        ...getValidBookingData(),
        status: 'PENDING_PAYMENT'
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.booking.status).toBe('PENDING_PAYMENT')
    })
  })
})
