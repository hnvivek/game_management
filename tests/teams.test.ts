import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { db } from '@/lib/db'

// Test data setup
let testVendorId: string
let testTeamId: string
let testCaptainId: string
let testSportId: string
let testFormatId: string

describe('Teams API Tests', () => {
  beforeAll(async () => {
    // Setup test data
    const sport = await db.sportType.findFirst({ where: { name: 'soccer' } })
    const format = await db.formatType.findFirst({ where: { name: '5-a-side' } })
    const vendor = await db.vendor.findFirst()

    if (!sport || !format || !vendor) {
      throw new Error('Required test data not found. Please seed database first.')
    }

    testSportId = sport.id
    testFormatId = format.id
    testVendorId = vendor.id

    // Create test captain
    const captain = await db.user.create({
      data: {
        email: 'test-captain@example.com',
        name: 'Test Captain',
        phone: '+919876543210',
        role: 'CUSTOMER'
      }
    })
    testCaptainId = captain.id
  })

  afterAll(async () => {
    // Cleanup test data
    try {
      await db.teamMember.deleteMany({ where: { userId: testCaptainId } })
      await db.teamVendor.deleteMany({ where: { teamId: testTeamId } })
      await db.team.deleteMany({ where: { captainId: testCaptainId } })
      await db.user.delete({ where: { id: testCaptainId } })
    } catch (error) {
      console.log('Cleanup error:', error)
    }
  })

  describe('POST /api/teams', () => {
    it('should create a new global team', async () => {
      const teamData = {
        name: 'Test Team Global',
        description: 'Test team for global architecture',
        captainId: testCaptainId,
        sportId: testSportId,
        formatId: testFormatId,
        maxPlayers: 10,
        city: 'Bengaluru',
        area: 'Test Area',
        isPublic: true
      }

      const response = await fetch('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.team).toBeDefined()
      expect(data.team.name).toBe(teamData.name)
      expect(data.team.captainId).toBe(testCaptainId)
      expect(data.team.sportId).toBe(testSportId)

      testTeamId = data.team.id
    })

    it('should validate required fields', async () => {
      const invalidData = {
        name: 'Invalid Team'
        // Missing required fields
      }

      const response = await fetch('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Missing required fields')
    })

    it('should validate captain exists', async () => {
      const invalidData = {
        name: 'Invalid Team',
        captainId: 'non-existent-id',
        sportId: testSportId,
        formatId: testFormatId,
        maxPlayers: 10
      }

      const response = await fetch('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('Captain not found')
    })
  })

  describe('GET /api/teams', () => {
    it('should list teams with no filters', async () => {
      const response = await fetch('http://localhost:3000/api/teams')

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.teams).toBeDefined()
      expect(data.count).toBeDefined()
      expect(Array.isArray(data.teams)).toBe(true)
    })

    it('should filter teams by sport', async () => {
      const response = await fetch(`http://localhost:3000/api/teams?sportId=${testSportId}`)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.teams.every((team: any) => team.sportId === testSportId)).toBe(true)
    })

    it('should filter teams by city', async () => {
      const response = await fetch('http://localhost:3000/api/teams?city=Bengaluru')

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.teams.every((team: any) => team.city === 'Bengaluru')).toBe(true)
    })

    it('should filter teams by captain', async () => {
      const response = await fetch(`http://localhost:3000/api/teams?captainId=${testCaptainId}`)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.teams.every((team: any) => team.captainId === testCaptainId)).toBe(true)
    })

    it('should show only public teams by default', async () => {
      const response = await fetch('http://localhost:3000/api/teams')

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.teams.every((team: any) => team.isPublic === true)).toBe(true)
    })

    it('should include team relationships', async () => {
      const response = await fetch(`http://localhost:3000/api/teams?captainId=${testCaptainId}`)

      expect(response.status).toBe(200)
      const data = await response.json()
      const team = data.teams[0]

      expect(team.captain).toBeDefined()
      expect(team.sport).toBeDefined()
      expect(team.format).toBeDefined()
      expect(team.homeVenues).toBeDefined()
      expect(team._count).toBeDefined()
    })
  })

  describe('Multi-vendor team architecture', () => {
    it('should allow team to be associated with multiple vendors', async () => {
      // Get another vendor
      const vendors = await db.vendor.findMany({ take: 2 })

      if (vendors.length >= 2) {
        // Associate team with multiple vendors
        await db.teamVendor.createMany({
          data: [
            {
              teamId: testTeamId,
              vendorId: vendors[0].id,
              isPrimary: true,
              matchesPlayed: 5
            },
            {
              teamId: testTeamId,
              vendorId: vendors[1].id,
              isPrimary: false,
              matchesPlayed: 2
            }
          ]
        })

        // Verify team appears under both vendors
        const teamVendors = await db.teamVendor.findMany({
          where: { teamId: testTeamId },
          include: { vendor: true }
        })

        expect(teamVendors.length).toBeGreaterThanOrEqual(2)
        expect(teamVendors.some(tv => tv.vendorId === vendors[0].id)).toBe(true)
        expect(teamVendors.some(tv => tv.vendorId === vendors[1].id)).toBe(true)
      }
    })

    it('should have one primary vendor per team', async () => {
      const primaryVendors = await db.teamVendor.findMany({
        where: {
          teamId: testTeamId,
          isPrimary: true
        }
      })

      expect(primaryVendors.length).toBe(1)
    })
  })

  describe('Captain auto-assignment', () => {
    it('should automatically add captain as team member', async () => {
      const teamMembers = await db.teamMember.findMany({
        where: { teamId: testTeamId }
      })

      const captainMember = teamMembers.find(
        member => member.userId === testCaptainId && member.role === 'captain'
      )

      expect(captainMember).toBeDefined()
      expect(captainMember?.role).toBe('captain')
    })
  })
})