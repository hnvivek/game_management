import { describe, it, expect, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/venues/route'

describe('/api/venues', () => {
  // ✨ Database cleaned automatically before each test!

  describe('GET /api/venues', () => {
    it('should return all active venues', async () => {
      const request = new NextRequest('http://localhost:3000/api/venues')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.venues)).toBe(true)
      expect(data.venues.length).toBeGreaterThan(0)

      const venue = data.venues[0]
      expect(venue).toHaveProperty('id')
      expect(venue).toHaveProperty('courtNumber')
      expect(venue).toHaveProperty('sport')
      expect(venue).toHaveProperty('format')
      expect(venue).toHaveProperty('pricePerHour')
      expect(venue).toHaveProperty('maxPlayers')
      expect(venue).toHaveProperty('vendor')
      expect(venue.vendor).toHaveProperty('name')
      expect(venue.vendor).toHaveProperty('slug')
    })

    it('should filter venues by sport', async () => {
      const url = new URL('http://localhost:3000/api/venues')
      url.searchParams.set('sport', 'football')

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.venues)).toBe(true)

      if (data.venues.length > 0) {
        data.venues.forEach((venue: any) => {
          expect(venue.sport.displayName).toBe('Football')
        })
      }
    })

    it('should filter venues by vendor', async () => {
      const url = new URL('http://localhost:3000/api/venues')
      url.searchParams.set('vendorId', 'test-vendor')

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.venues)).toBe(true)

      if (data.venues.length > 0) {
        data.venues.forEach((venue: any) => {
          expect(venue.vendorId).toBe('test-vendor')
        })
      }
    })

    it('should check availability when date and duration provided', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()

      const url = new URL('http://localhost:3000/api/venues')
      url.searchParams.set('sport', 'football')
      url.searchParams.set('date', tomorrow)
      url.searchParams.set('duration', '2')

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.venues)).toBe(true)

      if (data.venues.length > 0) {
        const venue = data.venues[0]
        expect(venue).toHaveProperty('isAvailable')
        expect(venue).toHaveProperty('totalAmount')
        expect(typeof venue.isAvailable).toBe('boolean')

        if (venue.isAvailable) {
          expect(venue.totalAmount).toBeGreaterThan(0)
        }
      }
    })

    it('should check specific time slot availability', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()

      const url = new URL('http://localhost:3000/api/venues')
      url.searchParams.set('sport', 'football')
      url.searchParams.set('date', tomorrow)
      url.searchParams.set('duration', '2')
      url.searchParams.set('startTime', '14:00')

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.venues)).toBe(true)

      if (data.venues.length > 0) {
        const venue = data.venues[0]
        expect(venue).toHaveProperty('isAvailable')
        expect(typeof venue.isAvailable).toBe('boolean')
      }
    })

    it('should return empty array for non-existent sport', async () => {
      const url = new URL('http://localhost:3000/api/venues')
      url.searchParams.set('sport', 'non-existent-sport')

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.venues)).toBe(true)
      expect(data.venues.length).toBe(0)
    })

    it('should handle invalid date gracefully', async () => {
      const url = new URL('http://localhost:3000/api/venues')
      url.searchParams.set('date', 'invalid-date')
      url.searchParams.set('duration', '2')

      const request = new NextRequest(url)
      const response = await GET(request)

      expect(response.status).toBe(500)
    })

    it('should mark venue as unavailable when conflicting booking exists', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()

      // Create a conflicting booking
      await global.testUtils.createTestBooking({
        date: tomorrow,
        startTime: '14:00',
        endTime: '16:00'
      })

      const url = new URL('http://localhost:3000/api/venues')
      url.searchParams.set('date', tomorrow)
      url.searchParams.set('duration', '2')
      url.searchParams.set('startTime', '14:00')

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      const conflictingVenue = data.venues.find((v: any) => v.id === 'test-venue-1')
      if (conflictingVenue) {
        expect(conflictingVenue.isAvailable).toBe(false)
        expect(conflictingVenue.totalAmount).toBeNull()
      }
    })

    it('should include amenities and images when available', async () => {
      const request = new NextRequest('http://localhost:3000/api/venues')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.venues)).toBe(true)

      if (data.venues.length > 0) {
        const venue = data.venues[0]
        // Check if amenities exist (may be null)
        if (venue.amenities) {
          expect(Array.isArray(venue.amenities)).toBe(true)
        }
        // Check if images exist (may be null)
        if (venue.images) {
          expect(Array.isArray(venue.images)).toBe(true)
        }
      }
    })

    it('should include format information', async () => {
      const request = new NextRequest('http://localhost:3000/api/venues')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.venues)).toBe(true)

      if (data.venues.length > 0) {
        const venue = data.venues[0]
        expect(venue.format).toBeDefined()
        expect(venue.format).toHaveProperty('displayName')
        expect(venue.format).toHaveProperty('minPlayers')
        expect(venue.format).toHaveProperty('maxPlayers')
      }
    })
  })
})
