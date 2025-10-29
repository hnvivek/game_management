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
      expect(data.booking.turfId).toBe(bookingData.turfId)
      expect(data.booking.date).toBe(bookingData.date)
      expect(data.booking.startTime).toBe(bookingData.startTime)
      expect(data.booking.endTime).toBe('11:00') // 09:00 + 2 hours
      expect(data.booking.duration).toBe(2)
      expect(data.booking.totalAmount).toBe(bookingData.totalAmount)
      expect(data.booking.status).toBe('confirmed')
      expect(data.booking).toHaveProperty('turf')
      expect(data.booking.turf).toHaveProperty('vendor')
    })

    it('should reject booking with missing required fields', async () => {
      const invalidData = {
        turfId: 'test-turf-1',
        date: '2025-12-01'
        // Missing startTime, duration, totalAmount
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })

    it('should reject booking for non-existent turf', async () => {
      const invalidData = {
        ...getValidBookingData(),
        turfId: 'non-existent-turf'
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Turf not found')
    })

    it('should reject conflicting bookings', async () => {
      // Create first booking
      const firstBooking = getValidBookingData(3) // Test 3: 2025-12-03, 15:00
      
      const request1 = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firstBooking)
      })
      
      const response1 = await POST(request1)
      expect(response1.status).toBe(200)

      // Try to create conflicting booking (same date, same turf, overlapping time)
      const conflictingData = {
        ...firstBooking, // Same date and turf
        startTime: '16:00', // Overlaps with 15:00-17:00
        duration: '2' // Would be 16:00-18:00, overlaps with existing 15:00-17:00
      }

      const request2 = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conflictingData)
      })

      const response2 = await POST(request2)
      const data2 = await response2.json()

      expect(response2.status).toBe(409)
      expect(data2.error).toBe('Turf is not available for the selected time slot')
    })

    it('should allow non-overlapping bookings', async () => {
      // These use completely different dates, so no conflicts possible!
      const booking1 = getValidBookingData(4) // Test 4: 2025-12-04, 18:00
      const booking2 = getValidBookingData(5) // Test 5: 2025-12-05, 09:00
      
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
      expect(data2.booking.startTime).toBe(booking2.startTime)
      expect(data2.booking.date).toBe(booking2.date)
    })

    it('should handle different booking types', async () => {
      const practiceBooking = {
        ...getValidBookingData(),
        bookingType: 'practice',
        startTime: '18:00'
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(practiceBooking)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.booking.bookingType).toBe('practice')
    })

    it('should calculate correct end time for various durations', async () => {
      const testCases = [
        { startTime: '09:00', duration: 1, expectedEndTime: '10:00' },
        { startTime: '14:30', duration: 2, expectedEndTime: '16:30' },
        { startTime: '20:00', duration: 3, expectedEndTime: '23:00' }
      ]

      for (const testCase of testCases) {
        const bookingData = {
          ...getValidBookingData(),
          startTime: testCase.startTime,
          duration: testCase.duration.toString(),
          date: `2025-12-0${testCases.indexOf(testCase) + 2}` // Different dates to avoid conflicts
        }

        const request = new NextRequest('http://localhost:3000/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData)
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.booking.endTime).toBe(testCase.expectedEndTime)
      }
    })

    it('should reject invalid time formats', async () => {
      const invalidTimeData = {
        ...getValidBookingData(),
        startTime: 'invalid-time'
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidTimeData)
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('should reject negative duration', async () => {
      const negativeDurationData = {
        ...getValidBookingData(),
        duration: '-1'
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(negativeDurationData)
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
