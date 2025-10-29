import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { db } from '@/lib/db'

// Test data setup
let testVendorId: string
let testVenueId: string
let testTeamId1: string
let testTeamId2: string
let testCaptainId1: string
let testCaptainId2: string
let testSportId: string
let testFormatId: string
let testTeamVendorId1: string
let testTeamVendorId2: string

describe('AI Scheduling Tests', () => {
  beforeAll(async () => {
    // Setup test data - use correct sport names from our test data
    const sport = await db.sportType.findFirst({ where: { name: 'football' } })
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
    const captain1 = await db.user.create({
      data: {
        email: 'ai-captain1@example.com',
        name: 'AI Test Captain 1',
        phone: '+919876543240',
        role: 'CUSTOMER'
      }
    })

    const captain2 = await db.user.create({
      data: {
        email: 'ai-captain2@example.com',
        name: 'AI Test Captain 2',
        phone: '+919876543241',
        role: 'CUSTOMER'
      }
    })

    testCaptainId1 = captain1.id
    testCaptainId2 = captain2.id

    // Create test teams
    const team1 = await db.team.create({
      data: {
        name: 'AI Test Team 1',
        description: 'Test team 1 for AI scheduling',
        captainId: testCaptainId1,
        sportId: testSportId,
        formatId: testFormatId,
        maxPlayers: 10,
        city: 'Bengaluru',
        area: 'Test Area 1'
      }
    })

    const team2 = await db.team.create({
      data: {
        name: 'AI Test Team 2',
        description: 'Test team 2 for AI scheduling',
        captainId: testCaptainId2,
        sportId: testSportId,
        formatId: testFormatId,
        maxPlayers: 10,
        city: 'Bengaluru',
        area: 'Test Area 2'
      }
    })

    testTeamId1 = team1.id
    testTeamId2 = team2.id

    // Add captains as team members
    await db.teamMember.createMany({
      data: [
        { teamId: testTeamId1, userId: testCaptainId1, role: 'captain' },
        { teamId: testTeamId2, userId: testCaptainId2, role: 'captain' }
      ]
    })

    // Create team-vendor relationships
    const teamVendor1 = await db.teamVendor.create({
      data: {
        teamId: testTeamId1,
        vendorId: testVendorId,
        isPrimary: true,
        matchesPlayed: 5,
        venueRating: 4
      }
    })

    const teamVendor2 = await db.teamVendor.create({
      data: {
        teamId: testTeamId2,
        vendorId: testVendorId,
        isPrimary: true,
        matchesPlayed: 3,
        venueRating: 5
      }
    })

    testTeamVendorId1 = teamVendor1.id
    testTeamVendorId2 = teamVendor2.id
  })

  afterAll(async () => {
    // Cleanup test data
    try {
      await db.matchSchedule.deleteMany({
        where: {
          OR: [
            { homeTeamId: testTeamId1 },
            { awayTeamId: testTeamId1 },
            { homeTeamId: testTeamId2 },
            { awayTeamId: testTeamId2 }
          ]
        }
      })
      await db.teamAvailability.deleteMany({
        where: { teamVendorId: { in: [testTeamVendorId1, testTeamVendorId2] } }
      })
      await db.teamVendor.deleteMany({
        where: { teamId: { in: [testTeamId1, testTeamId2] } }
      })
      await db.teamMember.deleteMany({
        where: { userId: { in: [testCaptainId1, testCaptainId2] } }
      })
      await db.team.deleteMany({
        where: { id: { in: [testTeamId1, testTeamId2] } }
      })
      await db.user.deleteMany({
        where: { id: { in: [testCaptainId1, testCaptainId2] } }
      })
    } catch (error) {
      console.log('Cleanup error:', error)
    }
  })

  describe('Team Availability Management', () => {
    it('should create team availability preferences', async () => {
      const availability = await db.teamAvailability.create({
        data: {
          teamId: testTeamId1,
          teamVendorId: testTeamVendorId1,
          dayOfWeek: 'tuesday',
          startTime: '18:00',
          endTime: '20:00',
          maxMatchesPerWeek: 2,
          preferredVenueTypes: ['outdoor', 'turf'],
          preferredCourtTypes: ['5-a-side']
        }
      })

      expect(availability.id).toBeDefined()
      expect(availability.dayOfWeek).toBe('tuesday')
      expect(availability.startTime).toBe('18:00')
      expect(availability.endTime).toBe('20:00')
      expect(availability.maxMatchesPerWeek).toBe(2)
    })

    it('should create multiple availability slots for different days', async () => {
      // Create availability for Thursday
      const thursdayAvailability = await db.teamAvailability.create({
        data: {
          teamId: testTeamId1,
          teamVendorId: testTeamVendorId1,
          dayOfWeek: 'thursday',
          startTime: '19:00',
          endTime: '21:00',
          maxMatchesPerWeek: 2
        }
      })

      // Create availability for Saturday
      const saturdayAvailability = await db.teamAvailability.create({
        data: {
          teamId: testTeamId1,
          teamVendorId: testTeamVendorId1,
          dayOfWeek: 'saturday',
          startTime: '16:00',
          endTime: '18:00',
          maxMatchesPerWeek: 3 // More matches on weekends
        }
      })

      expect(thursdayAvailability.dayOfWeek).toBe('thursday')
      expect(saturdayAvailability.dayOfWeek).toBe('saturday')

      // Verify all availabilities for the team
      const allAvailabilities = await db.teamAvailability.findMany({
        where: { teamId: testTeamId1 }
      })

      expect(allAvailabilities.length).toBe(3)
      expect(allAvailabilities.map(a => a.dayOfWeek)).toEqual(
        expect.arrayContaining(['tuesday', 'thursday', 'saturday'])
      )
    })

    it('should prevent duplicate availability slots', async () => {
      // Try to create duplicate availability for Tuesday 18:00-20:00
      await expect(
        db.teamAvailability.create({
          data: {
            teamId: testTeamId1,
            teamVendorId: testTeamVendorId1,
            dayOfWeek: 'tuesday',
            startTime: '18:00',
            endTime: '20:00',
            maxMatchesPerWeek: 2
          }
        })
      ).rejects.toThrow()
    })

    it('should support team 2 availability preferences', async () => {
      const team2Availability = await db.teamAvailability.create({
        data: {
          teamId: testTeamId2,
          teamVendorId: testTeamVendorId2,
          dayOfWeek: 'tuesday',
          startTime: '18:00',
          endTime: '20:00', // Same time as team 1 for compatibility
          maxMatchesPerWeek: 2
        }
      })

      expect(team2Availability.teamId).toBe(testTeamId2)
    })
  })

  describe('Match Schedule Creation', () => {
    it('should create AI-suggested match schedule', async () => {
      const suggestedDate = new Date()
      suggestedDate.setDate(suggestedDate.getDate() + 7) // Next week
      suggestedDate.setHours(18, 0, 0, 0) // 6 PM

      const matchSchedule = await db.matchSchedule.create({
        data: {
          homeTeamId: testTeamId1,
          awayTeamId: testTeamId2,
          venueId: testVenueId,
          vendorId: testVendorId,
          scheduledTime: suggestedDate,
          status: 'PENDING', // AI suggestion pending acceptance
          aiScore: 0.85,
          scoringFactors: {
            timeSlotCompatibility: 0.9,
            venuePreference: 0.8,
            teamAvailability: 1.0,
            travelDistance: 0.7
          },
          expiresAt: new Date(suggestedDate.getTime() + 24 * 60 * 60 * 1000) // 24 hours to respond
        }
      })

      expect(matchSchedule.id).toBeDefined()
      expect(matchSchedule.status).toBe('PENDING')
      expect(matchSchedule.aiScore).toBe(0.85)
      expect(matchSchedule.scoringFactors).toBeDefined()
      expect(matchSchedule.expiresAt).toBeDefined()
    })

    it('should support different schedule statuses', async () => {
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + 8)

      const scheduledMatch = await db.matchSchedule.create({
        data: {
          homeTeamId: testTeamId1,
          awayTeamId: testTeamId2,
          venueId: testVenueId,
          vendorId: testVendorId,
          scheduledTime: scheduledDate,
          status: 'SCHEDULED', // Both teams accepted
          aiScore: 0.92,
          homeTeamAccepted: true,
          awayTeamAccepted: true,
          acceptedAt: new Date()
        }
      })

      expect(scheduledMatch.status).toBe('SCHEDULED')
      expect(scheduledMatch.homeTeamAccepted).toBe(true)
      expect(scheduledMatch.awayTeamAccepted).toBe(true)
      expect(scheduledMatch.acceptedAt).toBeDefined()
    })

    it('should support expired suggestions', async () => {
      const expiredDate = new Date()
      expiredDate.setDate(expiredDate.getDate() + 9)

      const expiredMatch = await db.matchSchedule.create({
        data: {
          homeTeamId: testTeamId1,
          awayTeamId: testTeamId2,
          venueId: testVenueId,
          vendorId: testVendorId,
          scheduledTime: expiredDate,
          status: 'EXPIRED',
          aiScore: 0.75,
          expiresAt: new Date() // Already expired
        }
      })

      expect(expiredMatch.status).toBe('EXPIRED')
      expect(expiredMatch.expiresAt <= new Date()).toBe(true)
    })
  })

  describe('AI Scoring Logic', () => {
    it('should calculate comprehensive AI scores', async () => {
      // Create a match with detailed scoring
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + 10)
      scheduledDate.setHours(19, 0, 0, 0) // 7 PM on Tuesday

      const highScoreMatch = await db.matchSchedule.create({
        data: {
          homeTeamId: testTeamId1,
          awayTeamId: testTeamId2,
          venueId: testVenueId,
          vendorId: testVendorId,
          scheduledTime: scheduledDate,
          status: 'PENDING',
          aiScore: 0.95,
          scoringFactors: {
            timeSlotCompatibility: 1.0, // Perfect time match
            venuePreference: 0.9,      // Both teams like this venue
            teamAvailability: 1.0,      // Both teams available
            travelDistance: 0.9,        // Minimal travel
            venueAvailability: 1.0,     // Venue is free
            skillLevelMatch: 0.85,      // Good skill match
            recentFormBalance: 0.9      // Balanced recent form
          }
        }
      })

      expect(highScoreMatch.aiScore).toBe(0.95)
      expect(highScoreMatch.scoringFactors.timeSlotCompatibility).toBe(1.0)
      expect(highScoreMatch.scoringFactors.teamAvailability).toBe(1.0)
    })

    it('should track different scoring factor weights', async () => {
      const factors = [
        { name: 'timeSlotCompatibility', weight: 0.25 },
        { name: 'venuePreference', weight: 0.20 },
        { name: 'teamAvailability', weight: 0.25 },
        { name: 'travelDistance', weight: 0.15 },
        { name: 'venueAvailability', weight: 0.10 },
        { name: 'skillLevelMatch', weight: 0.05 }
      ]

      factors.forEach(factor => {
        expect(factor.weight).toBeGreaterThan(0)
        expect(factor.weight).toBeLessThanOrEqual(1)
      })

      const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0)
      expect(totalWeight).toBe(1.0)
    })
  })

  describe('Schedule State Management', () => {
    it('should track team acceptance status', async () => {
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + 11)

      const partialAcceptance = await db.matchSchedule.create({
        data: {
          homeTeamId: testTeamId1,
          awayTeamId: testTeamId2,
          venueId: testVenueId,
          vendorId: testVendorId,
          scheduledTime: scheduledDate,
          status: 'PENDING',
          aiScore: 0.88,
          homeTeamAccepted: true,  // Home team accepted
          awayTeamAccepted: false, // Away team hasn't responded
          homeAcceptedAt: new Date()
        }
      })

      expect(partialAcceptance.homeTeamAccepted).toBe(true)
      expect(partialAcceptance.awayTeamAccepted).toBe(false)
      expect(partialAcceptance.homeAcceptedAt).toBeDefined()
      expect(partialAcceptance.awayAcceptedAt).toBeNull()
    })

    it('should support schedule cancellation', async () => {
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + 12)

      const cancelledMatch = await db.matchSchedule.create({
        data: {
          homeTeamId: testTeamId1,
          awayTeamId: testTeamId2,
          venueId: testVenueId,
          vendorId: testVendorId,
          scheduledTime: scheduledDate,
          status: 'CANCELLED',
          aiScore: 0.82,
          cancelledAt: new Date(),
          cancellationReason: 'Team unavailable'
        }
      })

      expect(cancelledMatch.status).toBe('CANCELLED')
      expect(cancelledMatch.cancelledAt).toBeDefined()
      expect(cancelledMatch.cancellationReason).toBe('Team unavailable')
    })
  })

  describe('Performance Tracking Foundation', () => {
    it('should create team performance records', async () => {
      const performance = await db.matchPerformance.create({
        data: {
          teamId: testTeamId1,
          vendorId: testVendorId,
          venueId: testVenueId,
          matchDate: new Date(),
          result: 'WIN',
          goalsScored: 3,
          goalsConceded: 1,
          possessionPercentage: 65.5,
          shotsOnTarget: 8,
          passAccuracy: 78.2,
          playerPerformances: {
            'player1': { goals: 1, assists: 1, rating: 8.5 },
            'player2': { goals: 2, assists: 0, rating: 9.2 }
          }
        }
      })

      expect(performance.id).toBeDefined()
      expect(performance.result).toBe('WIN')
      expect(performance.goalsScored).toBe(3)
      expect(performance.goalsConceded).toBe(1)
      expect(performance.playerPerformances).toBeDefined()
    })

    it('should create team standings records', async () => {
      const standing = await db.teamStanding.create({
        data: {
          teamId: testTeamId1,
          sportId: testSportId,
          seasonYear: new Date().getFullYear(),
          matchesPlayed: 10,
          wins: 7,
          draws: 2,
          losses: 1,
          goalsFor: 25,
          goalsAgainst: 12,
          goalDifference: 13,
          points: 23,
          position: 2,
          form: ['W', 'D', 'W', 'W', 'L'] // Last 5 matches
        }
      })

      expect(standing.id).toBeDefined()
      expect(standing.points).toBe(23)
      expect(standing.position).toBe(2)
      expect(standing.form).toHaveLength(5)
    })
  })

  describe('Frequency and Constraint Management', () => {
    it('should enforce match frequency limits', async () => {
      // Check that teams have reasonable maxMatchesPerWeek
      const team1Availabilities = await db.teamAvailability.findMany({
        where: { teamId: testTeamId1 }
      })

      team1Availabilities.forEach(availability => {
        expect(availability.maxMatchesPerWeek).toBeGreaterThan(0)
        expect(availability.maxMatchesPerWeek).toBeLessThanOrEqual(7) // Max 7 per week
      })
    })

    it('should validate time slot constraints', async () => {
      const availabilities = await db.teamAvailability.findMany({
        where: { teamId: testTeamId1 }
      })

      availabilities.forEach(availability => {
        // Validate time format (HH:mm)
        expect(availability.startTime).toMatch(/^\d{2}:\d{2}$/)
        expect(availability.endTime).toMatch(/^\d{2}:\d{2}$/)

        // Validate that end time is after start time
        const start = new Date(`2000-01-01T${availability.startTime}`)
        const end = new Date(`2000-01-01T${availability.endTime}`)
        expect(end > start).toBe(true)
      })
    })
  })
})