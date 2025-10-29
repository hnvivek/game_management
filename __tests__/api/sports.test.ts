import { describe, it, expect, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/sports/route'

describe('/api/sports', () => {
  // ✨ Database cleaned automatically before each test!

  describe('GET /api/sports', () => {
    it('should return all active sports with their formats', async () => {
      const request = new NextRequest('http://localhost:3000/api/sports')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sports).toBeDefined()
      expect(Array.isArray(data.sports)).toBe(true)
      expect(data.count).toBeDefined()
      expect(typeof data.count).toBe('number')

      // Should have the sports created in test setup
      expect(data.sports.length).toBeGreaterThan(0)

      const sport = data.sports[0]
      expect(sport).toHaveProperty('id')
      expect(sport).toHaveProperty('name')
      expect(sport).toHaveProperty('displayName')
      expect(sport).toHaveProperty('icon')
      expect(sport).toHaveProperty('isActive')
      expect(sport.formats).toBeDefined()
      expect(Array.isArray(sport.formats)).toBe(true)

      // Check that sports are ordered by displayName
      const sportNames = data.sports.map((s: any) => s.displayName)
      const sortedNames = [...sportNames].sort()
      expect(sportNames).toEqual(sortedNames)
    })

    it('should include format information for each sport', async () => {
      const request = new NextRequest('http://localhost:3000/api/sports')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.sports.length > 0) {
        const sport = data.sports[0]
        expect(sport.formats.length).toBeGreaterThan(0)

        const format = sport.formats[0]
        expect(format).toHaveProperty('id')
        expect(format).toHaveProperty('name')
        expect(format).toHaveProperty('displayName')
        expect(format).toHaveProperty('minPlayers')
        expect(format).toHaveProperty('maxPlayers')
        expect(format).toHaveProperty('isActive')
        expect(typeof format.minPlayers).toBe('number')
        expect(typeof format.maxPlayers).toBe('number')
      }
    })

    it('should order formats by maxPlayers descending, then name ascending', async () => {
      const request = new NextRequest('http://localhost:3000/api/sports')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      if (data.sports.length > 0) {
        const sport = data.sports.find((s: any) => s.formats.length > 1)
        if (sport) {
          const formats = sport.formats
          // Check that formats are ordered by maxPlayers descending
          for (let i = 0; i < formats.length - 1; i++) {
            const current = formats[i]
            const next = formats[i + 1]

            if (current.maxPlayers === next.maxPlayers) {
              // If same maxPlayers, check name ordering
              expect(current.name.localeCompare(next.name)).toBeLessThanOrEqual(0)
            } else {
              // Otherwise, maxPlayers should be descending
              expect(current.maxPlayers).toBeGreaterThanOrEqual(next.maxPlayers)
            }
          }
        }
      }
    })

    it('should only return active sports and formats', async () => {
      const request = new NextRequest('http://localhost:3000/api/sports')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // All sports should be active
      data.sports.forEach((sport: any) => {
        expect(sport.isActive).toBe(true)

        // All formats should be active
        sport.formats.forEach((format: any) => {
          expect(format.isActive).toBe(true)
        })
      })
    })

    it('should return correct count matching array length', async () => {
      const request = new NextRequest('http://localhost:3000/api/sports')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.count).toBe(data.sports.length)
    })

    it('should include expected test sports', async () => {
      const request = new NextRequest('http://localhost:3000/api/sports')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      const sportNames = data.sports.map((s: any) => s.name)

      // Should include the sports created in test setup
      expect(sportNames).toContain('football')
      expect(sportNames).toContain('basketball')
      expect(sportNames).toContain('cricket')
    })

    it('should include expected formats for each sport', async () => {
      const request = new NextRequest('http://localhost:3000/api/sports')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      const footballSport = data.sports.find((s: any) => s.name === 'football')
      if (footballSport) {
        const formatNames = footballSport.formats.map((f: any) => f.name)
        expect(formatNames).toContain('11-a-side')
        expect(formatNames).toContain('7-a-side')
        expect(formatNames).toContain('5-a-side')
      }

      const basketballSport = data.sports.find((s: any) => s.name === 'basketball')
      if (basketballSport) {
        const formatNames = basketballSport.formats.map((f: any) => f.name)
        expect(formatNames).toContain('full-court')
        expect(formatNames).toContain('half-court')
      }

      const cricketSport = data.sports.find((s: any) => s.name === 'cricket')
      if (cricketSport) {
        const formatNames = cricketSport.formats.map((f: any) => f.name)
        expect(formatNames).toContain('t20')
      }
    })
  })
})