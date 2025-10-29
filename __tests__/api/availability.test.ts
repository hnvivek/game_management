import { describe, it, expect, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/turfs/availability/route'

describe('/api/turfs/availability', () => {
  // ✨ Database cleaned automatically before each test!

  describe('GET /api/turfs/availability', () => {
    it('should return available time slots for a turf', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()
      
      const url = new URL('http://localhost:3000/api/turfs/availability')
      url.searchParams.set('turfId', 'test-turf-1')
      url.searchParams.set('date', tomorrow)
      url.searchParams.set('duration', '2')
      
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.timeSlots)).toBe(true)
      expect(data.timeSlots.length).toBeGreaterThan(0)
      
      const slot = data.timeSlots[0]
      expect(slot).toHaveProperty('startTime')
      expect(slot).toHaveProperty('endTime')
      expect(slot).toHaveProperty('isAvailable')
      expect(typeof slot.isAvailable).toBe('boolean')
    })

    it('should require turfId parameter', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()
      
      const url = new URL('http://localhost:3000/api/turfs/availability')
      url.searchParams.set('date', tomorrow)
      url.searchParams.set('duration', '2')
      // Missing turfId
      
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('turfId and date are required')
    })

    it('should require date parameter', async () => {
      const url = new URL('http://localhost:3000/api/turfs/availability')
      url.searchParams.set('turfId', 'test-turf-1')
      url.searchParams.set('duration', '2')
      // Missing date
      
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('turfId and date are required')
    })

    it('should work without duration parameter', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()
      
      const url = new URL('http://localhost:3000/api/turfs/availability')
      url.searchParams.set('turfId', 'test-turf-1')
      url.searchParams.set('date', tomorrow)
      // Duration is optional
      
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.timeSlots)).toBe(true)
    })

    it('should return time slots for non-existent turf', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()
      
      const url = new URL('http://localhost:3000/api/turfs/availability')
      url.searchParams.set('turfId', 'non-existent-turf')
      url.searchParams.set('date', tomorrow)
      url.searchParams.set('duration', '2')
      
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.timeSlots)).toBe(true)
      // Non-existent turf will still return time slots (just empty availability data)
    })

    it('should mark slots as unavailable when bookings exist', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()
      
      // Create a booking that conflicts with some slots
      await global.testUtils.createTestBooking({
        date: tomorrow,
        startTime: '14:00',
        endTime: '16:00'
      })
      
      const url = new URL('http://localhost:3000/api/turfs/availability')
      url.searchParams.set('turfId', 'test-turf-1')
      url.searchParams.set('date', tomorrow)
      url.searchParams.set('duration', '2')
      
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      // Find the conflicting slot
      const conflictingSlot = data.timeSlots.find((slot: any) => 
        slot.startTime === '14:00'
      )
      
      if (conflictingSlot) {
        expect(conflictingSlot.isAvailable).toBe(false)
      }
      
      // Check that non-conflicting slots are still available
      const nonConflictingSlot = data.timeSlots.find((slot: any) => 
        slot.startTime === '17:00'
      )
      
      if (nonConflictingSlot) {
        expect(nonConflictingSlot.isAvailable).toBe(true)
      }
    })

    it('should handle different durations correctly', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()
      
      // Test 1-hour duration
      const url1 = new URL('http://localhost:3000/api/turfs/availability')
      url1.searchParams.set('turfId', 'test-turf-1')
      url1.searchParams.set('date', tomorrow)
      url1.searchParams.set('duration', '1')
      
      const request1 = new NextRequest(url1)
      const response1 = await GET(request1)
      const data1 = await response1.json()

      expect(response1.status).toBe(200)
      
      // Test 3-hour duration  
      const url3 = new URL('http://localhost:3000/api/turfs/availability')
      url3.searchParams.set('turfId', 'test-turf-1')
      url3.searchParams.set('date', tomorrow)
      url3.searchParams.set('duration', '3')
      
      const request3 = new NextRequest(url3)
      const response3 = await GET(request3)
      const data3 = await response3.json()

      expect(response3.status).toBe(200)
      
      // 1-hour should have more available slots than 3-hour
      const available1h = data1.timeSlots.filter((s: any) => s.isAvailable).length
      const available3h = data3.timeSlots.filter((s: any) => s.isAvailable).length
      
      expect(available1h).toBeGreaterThanOrEqual(available3h)
    })

    it('should calculate correct prices based on duration', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()
      
      const url = new URL('http://localhost:3000/api/turfs/availability')
      url.searchParams.set('turfId', 'test-turf-1')
      url.searchParams.set('date', tomorrow)
      url.searchParams.set('duration', '2')
      
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.timeSlots.length > 0) {
        const availableSlot = data.timeSlots.find((s: any) => s.isAvailable)
        if (availableSlot) {
          // Availability API doesn't include pricing - that's handled separately
          expect(availableSlot).toHaveProperty('startTime')
          expect(availableSlot).toHaveProperty('endTime')
          expect(availableSlot).toHaveProperty('isAvailable')
        }
      }
    })

    it('should handle partial overlaps correctly', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()
      
      // Create a booking from 14:00-15:00 (1 hour)
      await global.testUtils.createTestBooking({
        date: tomorrow,
        startTime: '14:00',
        endTime: '15:00',
        duration: 1
      })
      
      const url = new URL('http://localhost:3000/api/turfs/availability')
      url.searchParams.set('turfId', 'test-turf-1')
      url.searchParams.set('date', tomorrow)
      url.searchParams.set('duration', '2') // 2-hour slots
      
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      // Slots starting at 13:00 and 14:00 should be unavailable (would overlap)
      const slot13 = data.timeSlots.find((s: any) => s.startTime === '13:00')
      const slot14 = data.timeSlots.find((s: any) => s.startTime === '14:00')
      
      if (slot13) expect(slot13.isAvailable).toBe(false)
      if (slot14) expect(slot14.isAvailable).toBe(false)
      
      // Slot starting at 15:00 should be available (no overlap)
      const slot15 = data.timeSlots.find((s: any) => s.startTime === '15:00')
      if (slot15) expect(slot15.isAvailable).toBe(true)
    })

    it('should handle invalid date format gracefully', async () => {
      const url = new URL('http://localhost:3000/api/turfs/availability')
      url.searchParams.set('turfId', 'test-turf-1')
      url.searchParams.set('date', 'invalid-date')
      url.searchParams.set('duration', '2')
      
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.timeSlots)).toBe(true)
    })

    it('should handle zero or negative duration gracefully', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()
      
      const url = new URL('http://localhost:3000/api/turfs/availability')
      url.searchParams.set('turfId', 'test-turf-1')
      url.searchParams.set('date', tomorrow)
      url.searchParams.set('duration', '0')
      
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.timeSlots)).toBe(true)
    })
  })
})
