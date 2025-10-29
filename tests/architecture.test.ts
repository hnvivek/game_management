import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { db } from '@/lib/db'

// Test data setup
let testVendorId1: string
let testVendorId2: string
let testTeamId: string
let testCaptainId: string
let testSportId: string
let testFormatId: string

describe('Multi-vendor Architecture Tests', () => {
  beforeAll(async () => {
    // Setup test data
    const sport = await db.sportType.findFirst({ where: { name: 'soccer' } })
    const format = await db.formatType.findFirst({ where: { name: '5-a-side' } })
    const vendors = await db.vendor.findMany({ take: 2 })

    if (!sport || !format || vendors.length < 2) {
      throw new Error('Required test data not found. Please seed database first.')
    }

    testSportId = sport.id
    testFormatId = format.id
    testVendorId1 = vendors[0].id
    testVendorId2 = vendors[1].id

    // Create test captain
    const captain = await db.user.create({
      data: {
        email: 'arch-test-captain@example.com',
        name: 'Architecture Test Captain',
        phone: '+919876543220',
        role: 'CUSTOMER'
      }
    })
    testCaptainId = captain.id

    // Create test team
    const team = await db.team.create({
      data: {
        name: 'Multi-Vendor Test Team',
        description: 'Test team for multi-vendor architecture',
        captainId: testCaptainId,
        sportId: testSportId,
        formatId: testFormatId,
        maxPlayers: 10,
        city: 'Bengaluru',
        area: 'Test Area'
      }
    })
    testTeamId = team.id

    // Add captain as team member
    await db.teamMember.create({
      data: {
        teamId: testTeamId,
        userId: testCaptainId,
        role: 'captain'
      }
    })
  })

  afterAll(async () => {
    // Cleanup test data
    try {
      await db.teamVendor.deleteMany({ where: { teamId: testTeamId } })
      await db.teamMember.deleteMany({ where: { userId: testCaptainId } })
      await db.team.delete({ where: { id: testTeamId } })
      await db.user.delete({ where: { id: testCaptainId } })
    } catch (error) {
      console.log('Cleanup error:', error)
    }
  })

  describe('Team-Vendor Relationships', () => {
    it('should allow team to be associated with multiple vendors', async () => {
      // Associate team with both vendors
      await db.teamVendor.createMany({
        data: [
          {
            teamId: testTeamId,
            vendorId: testVendorId1,
            isPrimary: true,
            matchesPlayed: 5,
            venueRating: 4
          },
          {
            teamId: testTeamId,
            vendorId: testVendorId2,
            isPrimary: false,
            matchesPlayed: 2,
            venueRating: 5
          }
        ]
      })

      // Verify associations
      const teamVendors = await db.teamVendor.findMany({
        where: { teamId: testTeamId },
        include: { vendor: true }
      })

      expect(teamVendors.length).toBe(2)
      expect(teamVendors.some(tv => tv.vendorId === testVendorId1)).toBe(true)
      expect(teamVendors.some(tv => tv.vendorId === testVendorId2)).toBe(true)
    })

    it('should enforce only one primary vendor per team', async () => {
      const primaryVendors = await db.teamVendor.findMany({
        where: {
          teamId: testTeamId,
          isPrimary: true
        }
      })

      expect(primaryVendors.length).toBe(1)
      expect(primaryVendors[0].vendorId).toBe(testVendorId1)
    })

    it('should track team performance at each vendor', async () => {
      const teamVendors = await db.teamVendor.findMany({
        where: { teamId: testTeamId },
        include: { vendor: true }
      })

      teamVendors.forEach(tv => {
        expect(tv.matchesPlayed).toBeDefined()
        expect(tv.matchesPlayed).toBeGreaterThanOrEqual(0)
        expect(tv.venueRating).toBeDefined()
        expect(tv.venueRating).toBeGreaterThanOrEqual(1)
        expect(tv.venueRating).toBeLessThanOrEqual(5)
      })
    })
  })

  describe('Global Team Visibility', () => {
    it('should show team across all vendor contexts', async () => {
      // Test that team appears in global search
      const globalTeams = await db.team.findMany({
        where: {
          id: testTeamId,
          isPublic: true
        },
        include: {
          homeVenues: {
            include: { vendor: true }
          }
        }
      })

      expect(globalTeams.length).toBe(1)
      expect(globalTeams[0].homeVenues.length).toBe(2)
    })

    it('should filter teams by vendor subdomain correctly', async () => {
      // Simulate vendor 1 subdomain context
      const vendor1Teams = await db.team.findMany({
        where: {
          isPublic: true,
          homeVenues: {
            some: {
              vendorId: testVendorId1
            }
          }
        }
      })

      expect(vendor1Teams.some(team => team.id === testTeamId)).toBe(true)

      // Simulate vendor 2 subdomain context
      const vendor2Teams = await db.team.findMany({
        where: {
          isPublic: true,
          homeVenues: {
            some: {
              vendorId: testVendorId2
            }
          }
        }
      })

      expect(vendor2Teams.some(team => team.id === testTeamId)).toBe(true)
    })

    it('should show vendor-specific team stats', async () => {
      const teamVendorStats = await db.teamVendor.findMany({
        where: { teamId: testTeamId },
        include: { vendor: true }
      })

      expect(teamVendorStats.length).toBe(2)

      teamVendorStats.forEach(stat => {
        expect(stat.vendor).toBeDefined()
        expect(stat.matchesPlayed).toBeDefined()
        expect(stat.firstPlayedAt).toBeDefined()
        expect(stat.lastPlayedAt).toBeDefined()
      })
    })
  })

  describe('Match-Vendor Filtering', () => {
    it('should filter matches by vendor through booking relationship', async () => {
      // Create venues for both vendors
      const venue1 = await db.venue.findFirst({ where: { vendorId: testVendorId1 } })
      const venue2 = await db.venue.findFirst({ where: { vendorId: testVendorId2 } })

      if (!venue1 || !venue2) {
        throw new Error('Test venues not found')
      }

      // Create bookings for both venues
      const startTime = new Date()
      startTime.setHours(startTime.getHours() + 168) // 1 week from now
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000)

      const booking1 = await db.booking.create({
        data: {
          venueId: venue1.id,
          vendorId: testVendorId1,
          startTime,
          endTime,
          duration: 2,
          totalAmount: 1000,
          status: 'CONFIRMED'
        }
      })

      const booking2 = await db.booking.create({
        data: {
          venueId: venue2.id,
          vendorId: testVendorId2,
          startTime: new Date(startTime.getTime() + 3 * 60 * 60 * 1000),
          endTime: new Date(startTime.getTime() + 5 * 60 * 60 * 1000),
          duration: 2,
          totalAmount: 1000,
          status: 'CONFIRMED'
        }
      })

      // Create matches for both bookings
      await db.match.createMany({
        data: [
          {
            bookingId: booking1.id,
            homeTeamId: testTeamId,
            sportId: testSportId,
            formatId: testFormatId,
            maxPlayers: 10,
            status: 'OPEN'
          },
          {
            bookingId: booking2.id,
            homeTeamId: testTeamId,
            sportId: testSportId,
            formatId: testFormatId,
            maxPlayers: 10,
            status: 'OPEN'
          }
        ]
      })

      // Test filtering by vendor 1
      const vendor1Matches = await db.match.findMany({
        where: {
          booking: {
            venue: {
              vendorId: testVendorId1
            }
          }
        },
        include: {
          booking: {
            include: {
              venue: true
            }
          }
        }
      })

      expect(vendor1Matches.length).toBeGreaterThanOrEqual(1)
      expect(vendor1Matches.every(match => match.booking?.venue?.vendorId === testVendorId1)).toBe(true)

      // Test filtering by vendor 2
      const vendor2Matches = await db.match.findMany({
        where: {
          booking: {
            venue: {
              vendorId: testVendorId2
            }
          }
        },
        include: {
          booking: {
            include: {
              venue: true
            }
          }
        }
      })

      expect(vendor2Matches.length).toBeGreaterThanOrEqual(1)
      expect(vendor2Matches.every(match => match.booking?.venue?.vendorId === testVendorId2)).toBe(true)

      // Cleanup
      await db.match.deleteMany({ where: { homeTeamId: testTeamId } })
      await db.booking.deleteMany({ where: { id: { in: [booking1.id, booking2.id] } } })
    })
  })

  describe('Team Performance Tracking', () => {
    it('should track team performance across different vendors', async () => {
      const teamVendors = await db.teamVendor.findMany({
        where: { teamId: testTeamId },
        include: {
          vendor: true,
          matchPerformances: true
        }
      })

      expect(teamVendors.length).toBe(2)

      // Initially should have no performances
      expect(teamVendors.every(tv => tv.matchPerformances.length === 0)).toBe(true)
    })

    it('should maintain team identity across vendors', async () => {
      const team = await db.team.findUnique({
        where: { id: testTeamId },
        include: {
          captain: true,
          sport: true,
          format: true,
          homeVenues: {
            include: { vendor: true }
          }
        }
      })

      expect(team).toBeDefined()
      expect(team?.name).toBe('Multi-Vendor Test Team')
      expect(team?.captainId).toBe(testCaptainId)
      expect(team?.homeVenues.length).toBe(2)
      expect(team?.sportId).toBe(testSportId)
      expect(team?.formatId).toBe(testFormatId)
    })
  })

  describe('Data Consistency', () => {
    it('should prevent duplicate team-vendor relationships', async () => {
      // Try to create duplicate relationship
      await expect(
        db.teamVendor.create({
          data: {
            teamId: testTeamId,
            vendorId: testVendorId1,
            isPrimary: false
          }
        })
      ).rejects.toThrow()
    })

    it('should maintain unique constraint on team-vendor pairs', async () => {
      const existingRelations = await db.teamVendor.findMany({
        where: { teamId: testTeamId }
      })

      expect(existingRelations.length).toBe(2)
      expect(
        existingRelations.filter(tv => tv.vendorId === testVendorId1).length
      ).toBe(1)
      expect(
        existingRelations.filter(tv => tv.vendorId === testVendorId2).length
      ).toBe(1)
    })
  })
})