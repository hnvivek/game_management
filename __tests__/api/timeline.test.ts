import { describe, it, expect, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/timeline/route'

describe('/api/timeline', () => {
  // ✨ Database cleaned automatically before each test!

  describe('GET /api/timeline', () => {
    it('should return timeline slots for default parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/timeline')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.slots).toBeDefined()
      expect(Array.isArray(data.slots)).toBe(true)
      expect(data.count).toBeDefined()
      expect(typeof data.count).toBe('number')
      expect(data.filters).toBeDefined()
      expect(data.summary).toBeDefined()

      // Count should match array length
      expect(data.count).toBe(data.slots.length)

      // Check default filters
      expect(data.filters.sport).toBe('football') // Default sport in API
      expect(data.filters.duration).toBe(2) // Default duration

      if (data.slots.length > 0) {
        const slot = data.slots[0]
        expect(slot).toHaveProperty('id')
        expect(slot).toHaveProperty('startTime')
        expect(slot).toHaveProperty('endTime')
        expect(slot).toHaveProperty('venue')
        expect(slot).toHaveProperty('status')
        expect(slot).toHaveProperty('totalPrice')
        expect(slot).toHaveProperty('actions')

        // Check venue structure
        expect(slot.venue).toHaveProperty('id')
        expect(slot.venue).toHaveProperty('name')
        expect(slot.venue).toHaveProperty('courtNumber')
        expect(slot.venue).toHaveProperty('pricePerHour')
        expect(slot.venue).toHaveProperty('maxPlayers')
        expect(slot.venue).toHaveProperty('sport')
        expect(slot.venue).toHaveProperty('format')
        expect(slot.venue).toHaveProperty('vendor')

        // Check sport structure
        expect(slot.venue.sport).toHaveProperty('id')
        expect(slot.venue.sport).toHaveProperty('name')
        expect(slot.venue.sport).toHaveProperty('displayName')
        expect(slot.venue.sport).toHaveProperty('icon')

        // Check format structure
        expect(slot.venue.format).toHaveProperty('id')
        expect(slot.venue.format).toHaveProperty('name')
        expect(slot.venue.format).toHaveProperty('displayName')
        expect(slot.venue.format).toHaveProperty('minPlayers')
        expect(slot.venue.format).toHaveProperty('maxPlayers')

        // Check vendor structure
        expect(slot.venue.vendor).toHaveProperty('id')
        expect(slot.venue.vendor).toHaveProperty('name')
        expect(slot.venue.vendor).toHaveProperty('slug')
        expect(slot.venue.vendor).toHaveProperty('primaryColor')
      }
    })

    it('should accept sport filter parameter', async () => {
      const url = new URL('http://localhost:3000/api/timeline')
      url.searchParams.set('sport', 'football')

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.sport).toBe('football')

      // All slots should be for football venues (if any slots are generated)
      if (data.slots.length > 0) {
        data.slots.forEach((slot: any) => {
          expect(slot.venue.sport.name).toBe('football')
        })
      }
    })

    it('should accept date filter parameter', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()
      const url = new URL('http://localhost:3000/api/timeline')
      url.searchParams.set('date', tomorrow)

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.date).toBe(tomorrow)
      // Slots may be empty if no venues match the criteria
    })

    it('should accept duration parameter', async () => {
      const url = new URL('http://localhost:3000/api/timeline')
      url.searchParams.set('duration', '3')

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.duration).toBe(3)

      // Total price should be 3 hours * price per hour (if slots exist)
      if (data.slots.length > 0) {
        const slot = data.slots[0]
        expect(slot.totalPrice).toBe(slot.venue.pricePerHour * 3)
      }
    })

    it('should accept vendor filter parameter', async () => {
      const url = new URL('http://localhost:3000/api/timeline')
      url.searchParams.set('vendorId', 'test-vendor-1')

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.vendorId).toBe('test-vendor-1')

      // All slots should be from the specified vendor
      data.slots.forEach((slot: any) => {
        expect(slot.venue.vendor.id).toBe('test-vendor-1')
      })
    })

    it('should accept city and area filter parameters', async () => {
      const url = new URL('http://localhost:3000/api/timeline')
      url.searchParams.set('city', 'Test City')
      url.searchParams.set('area', 'Test Area')

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.filters.city).toBe('Test City')
      expect(data.filters.area).toBe('Test Area')
    })

    it('should mark slots as unavailable when bookings exist', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()

      // Create a booking that should affect timeline slots
      await global.testUtils.createTestBooking()

      const url = new URL('http://localhost:3000/api/timeline')
      url.searchParams.set('date', tomorrow)

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Should have some slots marked as private_match due to the booking
      const privateSlots = data.slots.filter((s: any) => s.status === 'private_match')
      expect(privateSlots.length).toBeGreaterThan(0)

      // Private match slots should have no actions
      privateSlots.forEach((slot: any) => {
        expect(slot.actions).toEqual([])
      })
    })

    it('should return correct summary statistics', async () => {
      const request = new NextRequest('http://localhost:3000/api/timeline')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary).toBeDefined()

      const summary = data.summary
      expect(summary).toHaveProperty('available')
      expect(summary).toHaveProperty('openMatches')
      expect(summary).toHaveProperty('privateMatches')
      expect(summary).toHaveProperty('unavailable')

      // All counts should be numbers and sum to total
      const totalSlots = summary.available + summary.openMatches + summary.privateMatches + summary.unavailable
      expect(totalSlots).toBe(data.slots.length)

      // Should have at least some available slots
      expect(summary.available).toBeGreaterThan(0)
    })

    it('should sort slots by time then venue name', async () => {
      const request = new NextRequest('http://localhost:3000/api/timeline')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.slots.length > 1) {
        for (let i = 0; i < data.slots.length - 1; i++) {
          const current = data.slots[i]
          const next = data.slots[i + 1]

          if (current.startTime !== next.startTime) {
            // Times should be sorted ascending
            expect(current.startTime.localeCompare(next.startTime)).toBeLessThanOrEqual(0)
          } else {
            // If same time, venue names should be sorted ascending
            expect(current.venue.name.localeCompare(next.venue.name)).toBeLessThanOrEqual(0)
          }
        }
      }
    })

    it('should generate slots for appropriate time range (6 AM to 11 PM)', async () => {
      const request = new NextRequest('http://localhost:3000/api/timeline')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.slots.length > 0) {
        const times = data.slots.map((s: any) => s.startTime)
        const earliestTime = Math.min(...times.map((t: string) => parseInt(t.split(':')[0])))
        const latestTime = Math.max(...times.map((t: string) => parseInt(t.split(':')[0])))

        // Should start at 6 AM or later
        expect(earliestTime).toBeGreaterThanOrEqual(6)
        // Should end by 11 PM or earlier (22:00 for 2-hour slots)
        expect(latestTime).toBeLessThanOrEqual(22)
      }
    })

    it('should calculate pricing correctly', async () => {
      const url = new URL('http://localhost:3000/api/timeline')
      url.searchParams.set('duration', '2')

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.slots.length > 0) {
        const slot = data.slots[0]
        expect(slot.totalPrice).toBe(slot.venue.pricePerHour * 2)
        expect(typeof slot.totalPrice).toBe('number')
        expect(slot.totalPrice).toBeGreaterThan(0)
      }
    })

    it('should include location information when available', async () => {
      const request = new NextRequest('http://localhost:3000/api/timeline')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.slots.length > 0) {
        const slot = data.slots[0]
        expect(slot.venue.location).toBeDefined()

        if (slot.venue.location) {
          expect(slot.venue.location).toHaveProperty('id')
          expect(slot.venue.location).toHaveProperty('name')
          expect(slot.venue.location).toHaveProperty('area')
          expect(slot.venue.location).toHaveProperty('city')
        }
      }
    })
  })
})