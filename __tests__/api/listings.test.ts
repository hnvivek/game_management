import { describe, it, expect, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/listings/route'

describe('/api/listings', () => {
  // ✨ Database cleaned automatically before each test!

  describe('GET /api/listings', () => {
    it('should return all active listings grouped by sport and format', async () => {
      const request = new NextRequest('http://localhost:3000/api/listings')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.listings).toBeDefined()
      expect(Array.isArray(data.listings)).toBe(true)
      expect(data.summary).toBeDefined()

      // Should have listings created from test venues
      expect(data.listings.length).toBeGreaterThan(0)

      const listing = data.listings[0]
      expect(listing).toHaveProperty('id')
      expect(listing).toHaveProperty('sport')
      expect(listing).toHaveProperty('sportLabel')
      expect(listing).toHaveProperty('format')
      expect(listing).toHaveProperty('formatLabel')
      expect(listing).toHaveProperty('pricePerHour')
      expect(listing).toHaveProperty('maxPlayers')
      expect(listing).toHaveProperty('minPlayers')
      expect(listing).toHaveProperty('courts')
      expect(listing).toHaveProperty('priceCategory')
      expect(listing).toHaveProperty('description')

      // Check that courts array is properly structured
      expect(Array.isArray(listing.courts)).toBe(true)
      if (listing.courts.length > 0) {
        const court = listing.courts[0]
        expect(court).toHaveProperty('venueId')
        expect(court).toHaveProperty('courtNumber')
        expect(court).toHaveProperty('name')
        expect(court).toHaveProperty('vendor')
      }
    })

    it('should filter listings by sport parameter', async () => {
      const url = new URL('http://localhost:3000/api/listings')
      url.searchParams.set('sport', 'football')

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.listings.length).toBeGreaterThan(0)

      // All listings should be for football
      data.listings.forEach((listing: any) => {
        expect(listing.sport).toBe('football')
        expect(listing.sportLabel).toBe('Football')
      })
    })

    it('should return correct summary statistics', async () => {
      const request = new NextRequest('http://localhost:3000/api/listings')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary).toBeDefined()

      const summary = data.summary
      expect(summary).toHaveProperty('totalListings')
      expect(summary).toHaveProperty('sports')
      expect(summary).toHaveProperty('formats')
      expect(summary).toHaveProperty('priceRange')

      expect(Array.isArray(summary.sports)).toBe(true)
      expect(Array.isArray(summary.formats)).toBe(true)
      expect(typeof summary.totalListings).toBe('number')
      expect(typeof summary.priceRange.min).toBe('number')
      expect(typeof summary.priceRange.max).toBe('number')

      // Should include test sports (only football and basketball have venues in test data)
      expect(summary.sports).toContain('Football')
      expect(summary.sports).toContain('Basketball')

      // Price range should be reasonable
      expect(summary.priceRange.min).toBeGreaterThanOrEqual(0)
      expect(summary.priceRange.max).toBeGreaterThanOrEqual(summary.priceRange.min)
    })

    it('should include pricing categories', async () => {
      const request = new NextRequest('http://localhost:3000/api/listings')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.listings.length > 0) {
        const listing = data.listings[0]
        expect(listing.priceCategory).toBeDefined()
        expect(['Budget', 'Standard', 'Premium', 'Luxury']).toContain(listing.priceCategory)
      }
    })

    it('should include helpful descriptions', async () => {
      const request = new NextRequest('http://localhost:3000/api/listings')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.listings.length > 0) {
        const listing = data.listings[0]
        expect(listing.description).toBeDefined()
        expect(typeof listing.description).toBe('string')
        expect(listing.description.length).toBeGreaterThan(0)
      }
    })

    it('should count total courts correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/listings')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.listings.length > 0) {
        data.listings.forEach((listing: any) => {
          expect(listing.totalCount).toBeGreaterThan(0)
          expect(listing.totalCount).toBe(listing.courts.length)
        })
      }
    })

    it('should handle sport filter with non-existent sport', async () => {
      const url = new URL('http://localhost:3000/api/listings')
      url.searchParams.set('sport', 'non-existent-sport')

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.listings).toEqual([])
      expect(data.summary.totalListings).toBe(0)
      expect(data.summary.sports).toEqual([])
      expect(data.summary.formats).toEqual([])
    })

    it('should group venues by sport and format correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/listings')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Should have distinct combinations
      const listingKeys = data.listings.map((l: any) => `${l.sport}-${l.format}`)
      const uniqueKeys = [...new Set(listingKeys)]
      expect(uniqueKeys.length).toBe(listingKeys.length)

      // Each unique combination should have proper structure
      data.listings.forEach((listing: any) => {
        expect(listing.sport).toBeDefined()
        expect(listing.format).toBeDefined()
        expect(listing.sportLabel).toBeDefined()
        expect(listing.formatLabel).toBeDefined()
      })
    })
  })
})