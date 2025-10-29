import { describe, it, expect, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/turfs/route'

describe('/api/turfs', () => {
  // ✨ Database cleaned automatically before each test!

  describe('GET /api/turfs', () => {
    it('should return all active turfs', async () => {
      const request = new NextRequest('http://localhost:3000/api/turfs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.turfs)).toBe(true)
      expect(data.turfs.length).toBeGreaterThan(0)
      
      const turf = data.turfs[0]
      expect(turf).toHaveProperty('id')
      expect(turf).toHaveProperty('name')
      expect(turf).toHaveProperty('sport')
      expect(turf).toHaveProperty('size')
      expect(turf).toHaveProperty('pricePerHour')
      expect(turf).toHaveProperty('vendor')
      expect(turf.vendor).toHaveProperty('name')
      expect(turf.vendor).toHaveProperty('location')
    })

    it('should filter turfs by sport', async () => {
      const url = new URL('http://localhost:3000/api/turfs')
      url.searchParams.set('sport', 'soccer')
      
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.turfs)).toBe(true)
      
      if (data.turfs.length > 0) {
        data.turfs.forEach((turf: any) => {
          expect(turf.sport).toBe('soccer')
        })
      }
    })

    it('should filter turfs by vendor', async () => {
      const url = new URL('http://localhost:3000/api/turfs')
      url.searchParams.set('vendorId', 'test-vendor')
      
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.turfs)).toBe(true)
      
      if (data.turfs.length > 0) {
        data.turfs.forEach((turf: any) => {
          expect(turf.vendorId).toBe('test-vendor')
        })
      }
    })

    it('should check availability when date and duration provided', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()
      
      const url = new URL('http://localhost:3000/api/turfs')
      url.searchParams.set('sport', 'soccer')
      url.searchParams.set('date', tomorrow)
      url.searchParams.set('duration', '2')
      
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.turfs)).toBe(true)
      
      if (data.turfs.length > 0) {
        const turf = data.turfs[0]
        expect(turf).toHaveProperty('isAvailable')
        expect(turf).toHaveProperty('totalAmount')
        expect(typeof turf.isAvailable).toBe('boolean')
        
        if (turf.isAvailable) {
          expect(turf.totalAmount).toBeGreaterThan(0)
        }
      }
    })

    it('should check specific time slot availability', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()
      
      const url = new URL('http://localhost:3000/api/turfs')
      url.searchParams.set('sport', 'soccer')
      url.searchParams.set('date', tomorrow)
      url.searchParams.set('duration', '2')
      url.searchParams.set('startTime', '14:00')
      
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.turfs)).toBe(true)
      
      if (data.turfs.length > 0) {
        const turf = data.turfs[0]
        expect(turf).toHaveProperty('isAvailable')
        expect(typeof turf.isAvailable).toBe('boolean')
      }
    })

    it('should return empty array for non-existent sport', async () => {
      const url = new URL('http://localhost:3000/api/turfs')
      url.searchParams.set('sport', 'non-existent-sport')
      
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.turfs)).toBe(true)
      expect(data.turfs.length).toBe(0)
    })

    it('should handle invalid date gracefully', async () => {
      const url = new URL('http://localhost:3000/api/turfs')
      url.searchParams.set('date', 'invalid-date')
      url.searchParams.set('duration', '2')
      
      const request = new NextRequest(url)
      const response = await GET(request)

      expect(response.status).toBe(500)
    })

    it('should mark turf as unavailable when conflicting booking exists', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()
      
      // Create a conflicting booking
      await global.testUtils.createTestBooking({
        date: tomorrow,
        startTime: '14:00',
        endTime: '16:00'
      })
      
      const url = new URL('http://localhost:3000/api/turfs')
      url.searchParams.set('date', tomorrow)
      url.searchParams.set('duration', '2')
      url.searchParams.set('startTime', '14:00')
      
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      const conflictingTurf = data.turfs.find((t: any) => t.id === 'test-turf-1')
      if (conflictingTurf) {
        expect(conflictingTurf.isAvailable).toBe(false)
        expect(conflictingTurf.totalAmount).toBeNull()
      }
    })
  })
})
