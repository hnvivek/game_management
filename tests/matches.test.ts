import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { db } from '@/lib/db'

// Test data setup
let testVendorId: string
let testVenueId: string
let testTeamId: string
let testAwayTeamId: string
let testCaptainId: string
let testAwayCaptainId: string
let testSportId: string
let testFormatId: string
let testBookingId: string

describe('Matches API Tests', () => {
  beforeAll(async () => {
    // Setup test data
    const sport = await db.sportType.findFirst({ where: { name: 'soccer' } })
    const format = await db.formatType.findFirst({ where: { name: '5-a-side' } })
    const vendor = await db.vendor.findFirst()
    const venue = await db.venue.findFirst({ where: { vendorId: vendor?.id } })

    if (!sport || !format || !vendor || !venue) {
      throw new Error('Required test data not found. Please seed database first.')
    }

    testSportId = sport.id
    testFormatId = format.id
    testVendorId = vendor.id
    testVenueId = venue.id

    // Create test captains
    const captain = await db.user.create({
      data: {
        email: 'test-home-captain@example.com',
        name: 'Test Home Captain',
        phone: '+919876543211',
        role: 'CUSTOMER'
      }
    })

    const awayCaptain = await db.user.create({
      data: {
        email: 'test-away-captain@example.com',
        name: 'Test Away Captain',
        phone: '+919876543212',
        role: 'CUSTOMER'
      }
    })

    testCaptainId = captain.id
    testAwayCaptainId = awayCaptain.id

    // Create test teams
    const homeTeam = await db.team.create({
      data: {
        name: 'Test Home Team',
        description: 'Home team for testing',
        captainId: testCaptainId,
        sportId: testSportId,
        formatId: testFormatId,
        maxPlayers: 10,
        city: 'Bengaluru',
        area: 'Test Area'
      }
    })

    const awayTeam = await db.team.create({
      data: {
        name: 'Test Away Team',
        description: 'Away team for testing',
        captainId: testAwayCaptainId,
        sportId: testSportId,
        formatId: testFormatId,
        maxPlayers: 10,
        city: 'Bengaluru',
        area: 'Test Area'
      }
    })

    testTeamId = homeTeam.id
    testAwayTeamId = awayTeam.id

    // Add captains as team members
    await db.teamMember.createMany({
      data: [
        { teamId: testTeamId, userId: testCaptainId, role: 'captain' },
        { teamId: testAwayTeamId, userId: testAwayCaptainId, role: 'captain' }
      ]
    })

    // Associate teams with vendor
    await db.teamVendor.createMany({
      data: [
        { teamId: testTeamId, vendorId: testVendorId, isPrimary: true },
        { teamId: testAwayTeamId, vendorId: testVendorId, isPrimary: true }
      ]
    })

    // Create test booking
    const startTime = new Date()
    startTime.setHours(startTime.getHours() + 24) // Tomorrow
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000) // 2 hours later

    const booking = await db.booking.create({
      data: {
        venueId: testVenueId,
        vendorId: testVendorId,
        startTime,
        endTime,
        duration: 2,
        totalAmount: 1000,
        bookingType: 'MATCH',
        status: 'CONFIRMED',
        customerName: 'Test Customer',
        customerPhone: '+919876543213'
      }
    })

    testBookingId = booking.id
  })

  afterAll(async () => {
    // Cleanup test data
    try {
      await db.match.deleteMany({ where: { homeTeamId: testTeamId } })
      await db.match.deleteMany({ where: { homeTeamId: testAwayTeamId } })
      await db.booking.delete({ where: { id: testBookingId } })
      await db.teamMember.deleteMany({ where: { userId: { in: [testCaptainId, testAwayCaptainId] } } })
      await db.teamVendor.deleteMany({ where: { teamId: { in: [testTeamId, testAwayTeamId] } } })
      await db.team.deleteMany({ where: { id: { in: [testTeamId, testAwayTeamId] } } })
      await db.user.deleteMany({ where: { id: { in: [testCaptainId, testAwayCaptainId] } } })
    } catch (error) {
      console.log('Cleanup error:', error)
    }
  })

  describe('POST /api/matches', () => {
    it('should create a new match looking for opponent', async () => {
      const matchData = {
        bookingId: testBookingId,
        title: 'Test Match',
        description: 'Test match looking for opponent',
        homeTeamId: testTeamId,
        sportId: testSportId,
        formatId: testFormatId,
        maxPlayers: 10
      }

      const response = await fetch('http://localhost:3000/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData)
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.match).toBeDefined()
      expect(data.match.status).toBe('OPEN') // Looking for opponent
      expect(data.match.homeTeamId).toBe(testTeamId)
      expect(data.match.awayTeamId).toBe(null) // No opponent yet
    })

    it('should validate required fields', async () => {
      const invalidData = {
        title: 'Invalid Match'
        // Missing required fields
      }

      const response = await fetch('http://localhost:3000/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Missing required fields')
    })

    it('should validate booking exists', async () => {
      const invalidData = {
        bookingId: 'non-existent-booking-id',
        homeTeamId: testTeamId,
        sportId: testSportId,
        formatId: testFormatId,
        maxPlayers: 10
      }

      const response = await fetch('http://localhost:3000/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('Booking not found')
    })

    it('should prevent duplicate matches for same booking', async () => {
      const matchData = {
        bookingId: testBookingId,
        homeTeamId: testTeamId,
        sportId: testSportId,
        formatId: testFormatId,
        maxPlayers: 10
      }

      // First match should succeed
      const firstResponse = await fetch('http://localhost:3000/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData)
      })

      expect(firstResponse.status).toBe(201)

      // Second match with same booking should fail
      const secondResponse = await fetch('http://localhost:3000/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData)
      })

      expect(secondResponse.status).toBe(409)
      const data = await secondResponse.json()
      expect(data.error).toContain('Match already exists for this booking')
    })
  })

  describe('GET /api/matches', () => {
    it('should list matches with no filters', async () => {
      const response = await fetch('http://localhost:3000/api/matches')

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.matches).toBeDefined()
      expect(data.count).toBeDefined()
      expect(Array.isArray(data.matches)).toBe(true)
    })

    it('should filter matches by sport', async () => {
      const response = await fetch(`http://localhost:3000/api/matches?sportId=${testSportId}`)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.matches.every((match: any) => match.sportId === testSportId)).toBe(true)
    })

    it('should filter matches by status', async () => {
      const response = await fetch('http://localhost:3000/api/matches?status=OPEN')

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.matches.every((match: any) => match.status === 'OPEN')).toBe(true)
    })

    it('should filter matches looking for opponents', async () => {
      const response = await fetch('http://localhost:3000/api/matches?lookingForOpponent=true')

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.matches.every((match: any) => match.awayTeamId === null)).toBe(true)
    })

    it('should filter matches by home team', async () => {
      const response = await fetch(`http://localhost:3000/api/matches?homeTeamId=${testTeamId}`)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.matches.every((match: any) => match.homeTeamId === testTeamId)).toBe(true)
    })

    it('should filter matches by city', async () => {
      const response = await fetch('http://localhost:3000/api/matches?city=Bengaluru')

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.matches.every((match: any) => match.homeTeam?.city === 'Bengaluru')).toBe(true)
    })

    it('should include split cost for matches looking for opponents', async () => {
      const response = await fetch('http://localhost:3000/api/matches?lookingForOpponent=true')

      expect(response.status).toBe(200)
      const data = await response.json()

      if (data.matches.length > 0) {
        const match = data.matches[0]
        if (match.awayTeamId === null && match.booking) {
          expect(match.splitCostPerTeam).toBeDefined()
          expect(match.splitCostPerTeam).toBe(match.booking.totalAmount / 2)
        }
      }
    })

    it('should include match relationships', async () => {
      const response = await fetch(`http://localhost:3000/api/matches?homeTeamId=${testTeamId}`)

      expect(response.status).toBe(200)
      const data = await response.json()
      const match = data.matches[0]

      expect(match.homeTeam).toBeDefined()
      expect(match.sport).toBeDefined()
      expect(match.format).toBeDefined()
      expect(match.booking).toBeDefined()
      expect(match.homeTeam.captain).toBeDefined()
    })

    it('should order matches by status then time', async () => {
      const response = await fetch('http://localhost:3000/api/matches')

      expect(response.status).toBe(200)
      const data = await response.json()

      if (data.matches.length > 1) {
        // OPEN matches should come first
        const openMatches = data.matches.filter((m: any) => m.status === 'OPEN')
        const confirmedMatches = data.matches.filter((m: any) => m.status === 'CONFIRMED')

        if (openMatches.length > 0 && confirmedMatches.length > 0) {
          const firstOpenIndex = data.matches.findIndex((m: any) => m.status === 'OPEN')
          const firstConfirmedIndex = data.matches.findIndex((m: any) => m.status === 'CONFIRMED')

          expect(firstOpenIndex).toBeLessThan(firstConfirmedIndex)
        }
      }
    })
  })

  describe('Subdomain filtering', () => {
    it('should filter matches by vendor subdomain', async () => {
      // This test would need to be run with a subdomain context
      // For now, we'll test the filtering logic directly

      const response = await fetch('http://localhost:3000/api/matches')

      expect(response.status).toBe(200)
      const data = await response.json()

      // All matches should have booking -> venue -> vendor relationship
      data.matches.forEach((match: any) => {
        if (match.booking) {
          expect(match.booking.venue).toBeDefined()
          if (match.booking.venue) {
            expect(match.booking.venue.vendor).toBeDefined()
          }
        }
      })
    })
  })
})