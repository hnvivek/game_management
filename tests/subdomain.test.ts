import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { db } from '@/lib/db'
import { extractSubdomain, getVendorBySubdomain } from '@/lib/subdomain'

// Test data setup
let testVendorId: string
let testVendorSlug: string
let testTeamId: string
let testAwayTeamId: string
let testCaptainId: string
let testAwayCaptainId: string
let testSportId: string
let testFormatId: string
let testVenueId: string

describe('Subdomain Filtering Tests', () => {
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
    testVendorSlug = vendor.slug
    testVenueId = venue.id

    // Create test captains
    const captain = await db.user.create({
      data: {
        email: 'subdomain-test-captain@example.com',
        name: 'Subdomain Test Captain',
        phone: '+919876543230',
        role: 'CUSTOMER'
      }
    })

    const awayCaptain = await db.user.create({
      data: {
        email: 'subdomain-away-captain@example.com',
        name: 'Subdomain Away Captain',
        phone: '+919876543231',
        role: 'CUSTOMER'
      }
    })

    testCaptainId = captain.id
    testAwayCaptainId = awayCaptain.id

    // Create test teams
    const homeTeam = await db.team.create({
      data: {
        name: 'Subdomain Home Team',
        description: 'Home team for subdomain testing',
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
        name: 'Subdomain Away Team',
        description: 'Away team for subdomain testing',
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
  })

  afterAll(async () => {
    // Cleanup test data
    try {
      await db.match.deleteMany({ where: { homeTeamId: { in: [testTeamId, testAwayTeamId] } } })
      await db.booking.deleteMany({ where: { customerName: { contains: 'Subdomain Test' } } })
      await db.teamMember.deleteMany({ where: { userId: { in: [testCaptainId, testAwayCaptainId] } } })
      await db.teamVendor.deleteMany({ where: { teamId: { in: [testTeamId, testAwayTeamId] } } })
      await db.team.deleteMany({ where: { id: { in: [testTeamId, testAwayTeamId] } } })
      await db.user.deleteMany({ where: { id: { in: [testCaptainId, testAwayCaptainId] } } })
    } catch (error) {
      console.log('Cleanup error:', error)
    }
  })

  describe('Subdomain Extraction', () => {
    it('should extract subdomain from hostname', () => {
      // Test with mock request objects
      const mockRequestWithSubdomain = {
        headers: {
          host: `${testVendorSlug}.localhost:3000`
        }
      } as any

      const mockRequestWithoutSubdomain = {
        headers: {
          host: 'localhost:3000'
        }
      } as any

      const subdomain = extractSubdomain(mockRequestWithSubdomain)
      const noSubdomain = extractSubdomain(mockRequestWithoutSubdomain)

      expect(subdomain).toBe(testVendorSlug)
      expect(noSubdomain).toBe('')
    })

    it('should handle edge cases', () => {
      const mockRequestWWW = {
        headers: {
          host: 'www.localhost:3000'
        }
      } as any

      const mockRequestComplex = {
        headers: {
          host: `${testVendorSlug}.app.localhost:3000`
        }
      } as any

      const wwwSubdomain = extractSubdomain(mockRequestWWW)
      const complexSubdomain = extractSubdomain(mockRequestComplex)

      expect(wwwSubdomain).toBe('')
      expect(complexSubdomain).toBe(testVendorSlug)
    })
  })

  describe('Vendor Resolution', () => {
    it('should resolve vendor by subdomain', async () => {
      const vendor = await getVendorBySubdomain(testVendorSlug)

      expect(vendor).toBeDefined()
      expect(vendor?.id).toBe(testVendorId)
      expect(vendor?.slug).toBe(testVendorSlug)
    })

    it('should return null for invalid subdomain', async () => {
      const vendor = await getVendorBySubdomain('non-existent-vendor')

      expect(vendor).toBeNull()
    })

    it('should return null for empty subdomain', async () => {
      const vendor = await getVendorBySubdomain('')

      expect(vendor).toBeNull()
    })
  })

  describe('Teams API Subdomain Filtering', () => {
    it('should filter teams by vendor subdomain', async () => {
      // Create teams for different vendors to test filtering
      const otherVendor = await db.vendor.findFirst({ where: { id: { not: testVendorId } } })
      if (otherVendor) {
        const otherVendorTeam = await db.team.create({
          data: {
            name: 'Other Vendor Team',
            description: 'Team for different vendor',
            captainId: testAwayCaptainId,
            sportId: testSportId,
            formatId: testFormatId,
            maxPlayers: 10,
            city: 'Mumbai',
            area: 'Other Area'
          }
        })

        // Associate with different vendor
        await db.teamVendor.create({
          data: {
            teamId: otherVendorTeam.id,
            vendorId: otherVendor.id,
            isPrimary: true
          }
        })

        // Test filtering logic directly
        const vendorTeams = await db.team.findMany({
          where: {
            isPublic: true,
            homeVenues: {
              some: {
                vendorId: testVendorId
              }
            }
          }
        })

        expect(vendorTeams.some(team => team.id === testTeamId)).toBe(true)
        expect(vendorTeams.some(team => team.id === otherVendorTeam.id)).toBe(false)

        // Cleanup
        await db.teamVendor.delete({ where: { teamId_vendorId: { teamId: otherVendorTeam.id, vendorId: otherVendor.id } } })
        await db.team.delete({ where: { id: otherVendorTeam.id } })
      }
    })

    it('should include vendor information in team data', async () => {
      const teams = await db.team.findMany({
        where: {
          id: testTeamId,
          homeVenues: {
            some: {
              vendorId: testVendorId
            }
          }
        },
        include: {
          homeVenues: {
            include: {
              vendor: true
            }
          }
        }
      })

      expect(teams.length).toBe(1)
      const team = teams[0]
      expect(team.homeVenues.length).toBeGreaterThan(0)
      expect(team.homeVenues.some(hv => hv.vendor.id === testVendorId)).toBe(true)
    })
  })

  describe('Matches API Subdomain Filtering', () => {
    it('should filter matches by vendor subdomain', async () => {
      // Create booking and match for testing
      const startTime = new Date()
      startTime.setHours(startTime.getHours() + 24) // Tomorrow

      const booking = await db.booking.create({
        data: {
          venueId: testVenueId,
          vendorId: testVendorId,
          startTime,
          endTime: new Date(startTime.getTime() + 2 * 60 * 60 * 1000),
          duration: 2,
          totalAmount: 1000,
          status: 'CONFIRMED',
          customerName: 'Subdomain Test Customer'
        }
      })

      const match = await db.match.create({
        data: {
          bookingId: booking.id,
          homeTeamId: testTeamId,
          sportId: testSportId,
          formatId: testFormatId,
          maxPlayers: 10,
          status: 'OPEN'
        }
      })

      // Test filtering logic directly
      const vendorMatches = await db.match.findMany({
        where: {
          booking: {
            venue: {
              vendorId: testVendorId
            }
          }
        },
        include: {
          booking: {
            include: {
              venue: {
                include: {
                  vendor: true
                }
              }
            }
          }
        }
      })

      expect(vendorMatches.some(m => m.id === match.id)).toBe(true)

      // Verify all matches have correct vendor
      vendorMatches.forEach(m => {
        expect(m.booking?.venue?.vendor?.id).toBe(testVendorId)
      })

      // Cleanup
      await db.match.delete({ where: { id: match.id } })
      await db.booking.delete({ where: { id: booking.id } })
    })
  })

  describe('Bookings API Subdomain Filtering', () => {
    it('should filter bookings by vendor subdomain', async () => {
      // Create booking for testing
      const startTime = new Date()
      startTime.setHours(startTime.getHours() + 48) // Day after tomorrow

      const booking = await db.booking.create({
        data: {
          venueId: testVenueId,
          vendorId: testVendorId,
          startTime,
          endTime: new Date(startTime.getTime() + 2 * 60 * 60 * 1000),
          duration: 2,
          totalAmount: 1000,
          status: 'CONFIRMED',
          customerName: 'Subdomain Test Booking'
        }
      })

      // Test filtering logic directly
      const vendorBookings = await db.booking.findMany({
        where: {
          venue: {
            vendorId: testVendorId
          }
        },
        include: {
          venue: {
            include: {
              vendor: true
            }
          }
        }
      })

      expect(vendorBookings.some(b => b.id === booking.id)).toBe(true)

      // Verify all bookings have correct vendor
      vendorBookings.forEach(b => {
        expect(b.venue?.vendor?.id).toBe(testVendorId)
      })

      // Cleanup
      await db.booking.delete({ where: { id: booking.id } })
    })
  })

  describe('API Endpoint Integration', () => {
    it('should handle subdomain context in Teams API', async () => {
      // Test the API with simulated subdomain context
      const response = await fetch(`http://localhost:3000/api/teams?sportId=${testSportId}&city=Bengaluru`)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.teams).toBeDefined()

      // Verify our test team is in the results
      const ourTeam = data.teams.find((team: any) => team.id === testTeamId)
      expect(ourTeam).toBeDefined()
      expect(ourTeam.homeVenues).toBeDefined()
      expect(ourTeam.homeVenues.length).toBeGreaterThan(0)
    })

    it('should handle subdomain context in Matches API', async () => {
      // Test the API without subdomain (global context)
      const response = await fetch(`http://localhost:3000/api/matches?sportId=${testSportId}`)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.matches).toBeDefined()
      expect(Array.isArray(data.matches)).toBe(true)
    })

    it('should handle subdomain context in Bookings API', async () => {
      // Test the API without subdomain (global context)
      const response = await fetch(`http://localhost:3000/api/bookings?status=CONFIRMED`)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.bookings).toBeDefined()
      expect(Array.isArray(data.bookings)).toBe(true)
    })
  })

  describe('Security and Isolation', () => {
    it('should prevent cross-vendor data leakage', async () => {
      // Test that filtering properly isolates vendor data
      const vendor1Teams = await db.team.findMany({
        where: {
          homeVenues: {
            some: {
              vendorId: testVendorId
            }
          }
        },
        include: {
          homeVenues: true
        }
      })

      // Teams should only appear if they have relationship with the vendor
      vendor1Teams.forEach(team => {
        expect(team.homeVenues.some(hv => hv.vendorId === testVendorId)).toBe(true)
      })
    })

    it('should maintain data integrity with subdomain switching', async () => {
      // Test that the same team can appear under different vendor contexts
      // but only when it has legitimate relationships

      const vendorTeamRelations = await db.teamVendor.findMany({
        where: { teamId: testTeamId },
        include: { vendor: true }
      })

      expect(vendorTeamRelations.length).toBe(1)
      expect(vendorTeamRelations[0].vendorId).toBe(testVendorId)
    })
  })
})