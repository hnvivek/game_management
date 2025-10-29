import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { db } from '@/lib/db'

// Test data setup
let testVendorId: string
let testVenueId: string
let testTeamId1: string
let testTeamId2: string
let testTeamId3: string
let testCaptainId1: string
let testCaptainId2: string
let testCaptainId3: string
let testSportId: string
let testFormatId: string
let testBookingId: string

describe('Venue Conflict Resolution Tests', () => {
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
    const captains = await Promise.all([
      db.user.create({
        data: {
          email: 'conflict-captain1@example.com',
          name: 'Conflict Test Captain 1',
          phone: '+919876543250',
          role: 'CUSTOMER'
        }
      }),
      db.user.create({
        data: {
          email: 'conflict-captain2@example.com',
          name: 'Conflict Test Captain 2',
          phone: '+919876543251',
          role: 'CUSTOMER'
        }
      }),
      db.user.create({
        data: {
          email: 'conflict-captain3@example.com',
          name: 'Conflict Test Captain 3',
          phone: '+919876543252',
          role: 'CUSTOMER'
        }
      })
    ])

    testCaptainId1 = captains[0].id
    testCaptainId2 = captains[1].id
    testCaptainId3 = captains[2].id

    // Create test teams
    const teams = await Promise.all([
      db.team.create({
        data: {
          name: 'Conflict Test Team 1',
          description: 'Test team 1 for conflict resolution',
          captainId: testCaptainId1,
          sportId: testSportId,
          formatId: testFormatId,
          maxPlayers: 10,
          city: 'Bengaluru',
          area: 'Test Area 1'
        }
      }),
      db.team.create({
        data: {
          name: 'Conflict Test Team 2',
          description: 'Test team 2 for conflict resolution',
          captainId: testCaptainId2,
          sportId: testSportId,
          formatId: testFormatId,
          maxPlayers: 10,
          city: 'Bengaluru',
          area: 'Test Area 2'
        }
      }),
      db.team.create({
        data: {
          name: 'Conflict Test Team 3',
          description: 'Test team 3 for conflict resolution',
          captainId: testCaptainId3,
          sportId: testSportId,
          formatId: testFormatId,
          maxPlayers: 10,
          city: 'Bengaluru',
          area: 'Test Area 3'
        }
      })
    ])

    testTeamId1 = teams[0].id
    testTeamId2 = teams[1].id
    testTeamId3 = teams[2].id

    // Add captains as team members
    await db.teamMember.createMany({
      data: [
        { teamId: testTeamId1, userId: testCaptainId1, role: 'captain' },
        { teamId: testTeamId2, userId: testCaptainId2, role: 'captain' },
        { teamId: testTeamId3, userId: testCaptainId3, role: 'captain' }
      ]
    })

    // Associate teams with vendor
    await db.teamVendor.createMany({
      data: [
        { teamId: testTeamId1, vendorId: testVendorId, isPrimary: true },
        { teamId: testTeamId2, vendorId: testVendorId, isPrimary: true },
        { teamId: testTeamId3, vendorId: testVendorId, isPrimary: true }
      ]
    })
  })

  afterAll(async () => {
    // Cleanup test data
    try {
      await db.matchSchedule.deleteMany({
        where: {
          or: [
            { homeTeamId: testTeamId1 }, { awayTeamId: testTeamId1 },
            { homeTeamId: testTeamId2 }, { awayTeamId: testTeamId2 },
            { homeTeamId: testTeamId3 }, { awayTeamId: testTeamId3 }
          ]
        }
      })
      await db.match.deleteMany({
        where: {
          or: [
            { homeTeamId: testTeamId1 }, { awayTeamId: testTeamId1 },
            { homeTeamId: testTeamId2 }, { awayTeamId: testTeamId2 },
            { homeTeamId: testTeamId3 }, { awayTeamId: testTeamId3 }
          ]
        }
      })
      await db.booking.deleteMany({ where: { customerName: { contains: 'Conflict Test' } } })
      await db.teamVendor.deleteMany({
        where: { teamId: { in: [testTeamId1, testTeamId2, testTeamId3] } }
      })
      await db.teamMember.deleteMany({
        where: { userId: { in: [testCaptainId1, testCaptainId2, testCaptainId3] } }
      })
      await db.team.deleteMany({
        where: { id: { in: [testTeamId1, testTeamId2, testTeamId3] } }
      })
      await db.user.deleteMany({
        where: { id: { in: [testCaptainId1, testCaptainId2, testCaptainId3] } }
      })
    } catch (error) {
      console.log('Cleanup error:', error)
    }
  })

  describe('Booking Conflict Detection', () => {
    it('should detect exact time overlap conflicts', async () => {
      const startTime = new Date()
      startTime.setHours(startTime.getHours() + 168) // 1 week from now
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000) // 2 hours

      // Create first booking
      const firstBooking = await db.booking.create({
        data: {
          venueId: testVenueId,
          vendorId: testVendorId,
          startTime,
          endTime,
          duration: 2,
          totalAmount: 1000,
          status: 'CONFIRMED',
          customerName: 'Conflict Test Booking 1'
        }
      })

      // Try to create overlapping booking with exact same time
      const overlappingBooking = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: testVenueId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: '2',
          totalAmount: 1000,
          customerName: 'Conflict Test Booking 2'
        })
      })

      expect(overlappingBooking.status).toBe(409)
      const data = await overlappingBooking.json()
      expect(data.error).toContain('Venue is not available')

      // Cleanup
      await db.booking.delete({ where: { id: firstBooking.id } })
    })

    it('should detect partial time overlap conflicts', async () => {
      const baseStartTime = new Date()
      baseStartTime.setHours(baseStartTime.getHours() + 170) // 1 week + 2 hours from now
      const baseEndTime = new Date(baseStartTime.getTime() + 2 * 60 * 60 * 1000)

      // Create first booking
      const firstBooking = await db.booking.create({
        data: {
          venueId: testVenueId,
          vendorId: testVendorId,
          startTime: baseStartTime,
          endTime: baseEndTime,
          duration: 2,
          totalAmount: 1000,
          status: 'CONFIRMED',
          customerName: 'Conflict Test Base Booking'
        }
      })

      // Test overlapping from the start
      const overlapFromStart = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: testVenueId,
          startTime: baseStartTime.toISOString(),
          endTime: new Date(baseStartTime.getTime() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour overlap
          duration: '1',
          totalAmount: 500,
          customerName: 'Overlap From Start'
        })
      })

      expect(overlapFromStart.status).toBe(409)

      // Test overlapping from the end
      const overlapFromEnd = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: testVenueId,
          startTime: new Date(baseEndTime.getTime() - 30 * 60 * 1000).toISOString(), // 30 mins before end
          endTime: new Date(baseEndTime.getTime() + 30 * 60 * 1000).toISOString(), // 30 mins after end
          duration: '1',
          totalAmount: 500,
          customerName: 'Overlap From End'
        })
      })

      expect(overlapFromEnd.status).toBe(409)

      // Test completely contained within
      const containedWithin = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: testVenueId,
          startTime: new Date(baseStartTime.getTime() + 30 * 60 * 1000).toISOString(), // 30 mins after start
          endTime: new Date(baseEndTime.getTime() - 30 * 60 * 1000).toISOString(), // 30 mins before end
          duration: '1',
          totalAmount: 500,
          customerName: 'Contained Within'
        })
      })

      expect(containedWithin.status).toBe(409)

      // Cleanup
      await db.booking.delete({ where: { id: firstBooking.id } })
    })

    it('should allow non-overlapping bookings', async () => {
      const firstStartTime = new Date()
      firstStartTime.setHours(firstStartTime.getHours() + 172) // 1 week + 4 hours
      const firstEndTime = new Date(firstStartTime.getTime() + 2 * 60 * 60 * 1000)

      // Create first booking
      const firstBooking = await db.booking.create({
        data: {
          venueId: testVenueId,
          vendorId: testVendorId,
          startTime: firstStartTime,
          endTime: firstEndTime,
          duration: 2,
          totalAmount: 1000,
          status: 'CONFIRMED',
          customerName: 'First Booking'
        }
      })

      // Test booking that ends exactly when first starts
      const endsExactlyAtStart = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: testVenueId,
          startTime: new Date(firstStartTime.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours before
          endTime: firstStartTime.toISOString(), // Ends exactly when first starts
          duration: '2',
          totalAmount: 1000,
          customerName: 'Ends At Start'
        })
      })

      expect(endsExactlyAtStart.status).toBe(200)

      // Test booking that starts exactly when first ends
      const startsExactlyAtEnd = await fetch('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: testVenueId,
          startTime: firstEndTime.toISOString(), // Starts exactly when first ends
          endTime: new Date(firstEndTime.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours after
          duration: '2',
          totalAmount: 1000,
          customerName: 'Starts At End'
        })
      })

      expect(startsExactlyAtEnd.status).toBe(200)

      // Cleanup
      await db.booking.deleteMany({
        where: { customerName: { contains: 'First Booking' } }
      })
      await db.booking.deleteMany({
        where: { customerName: { contains: 'Ends At Start' } }
      })
      await db.booking.deleteMany({
        where: { customerName: { contains: 'Starts At End' } }
      })
    })
  })

  describe('AI Suggestion Conflict Management', () => {
    it('should allow multiple AI suggestions for same time slot', async () => {
      const suggestedTime = new Date()
      suggestedTime.setHours(suggestedTime.getHours() + 176) // 1 week + 6 hours

      // Create multiple AI suggestions for the same time slot
      const suggestions = await Promise.all([
        db.matchSchedule.create({
          data: {
            homeTeamId: testTeamId1,
            awayTeamId: testTeamId2,
            venueId: testVenueId,
            vendorId: testVendorId,
            scheduledTime: suggestedTime,
            status: 'PENDING',
            aiScore: 0.85
          }
        }),
        db.matchSchedule.create({
          data: {
            homeTeamId: testTeamId1,
            awayTeamId: testTeamId3,
            venueId: testVenueId,
            vendorId: testVendorId,
            scheduledTime: suggestedTime,
            status: 'PENDING',
            aiScore: 0.82
          }
        })
      ])

      expect(suggestions.length).toBe(2)
      expect(suggestions.every(s => s.status === 'PENDING')).toBe(true)

      // Verify both can coexist (non-blocking)
      const allSuggestions = await db.matchSchedule.findMany({
        where: {
          venueId: testVenueId,
          scheduledTime: suggestedTime
        }
      })

      expect(allSuggestions.length).toBe(2)

      // Cleanup
      await db.matchSchedule.deleteMany({
        where: { id: { in: suggestions.map(s => s.id) } }
      })
    })

    it('should handle first-come-first-served acceptance', async () => {
      const suggestedTime = new Date()
      suggestedTime.setHours(suggestedTime.getHours() + 180) // 1 week + 10 hours

      // Create two conflicting AI suggestions
      const suggestion1 = await db.matchSchedule.create({
        data: {
          homeTeamId: testTeamId1,
          awayTeamId: testTeamId2,
          venueId: testVenueId,
          vendorId: testVendorId,
          scheduledTime: suggestedTime,
          status: 'PENDING',
          aiScore: 0.88
        }
      })

      const suggestion2 = await db.matchSchedule.create({
        data: {
          homeTeamId: testTeamId1,
          awayTeamId: testTeamId3,
          venueId: testVenueId,
          vendorId: testVendorId,
          scheduledTime: suggestedTime,
          status: 'PENDING',
          aiScore: 0.85
        }
      })

      // Simulate first suggestion being accepted by both teams
      const actualBooking = await db.booking.create({
        data: {
          venueId: testVenueId,
          vendorId: testVendorId,
          startTime: suggestedTime,
          endTime: new Date(suggestedTime.getTime() + 2 * 60 * 60 * 1000),
          duration: 2,
          totalAmount: 1000,
          status: 'CONFIRMED',
          customerName: 'Accepted AI Suggestion'
        }
      })

      // Update first suggestion to SCHEDULED
      await db.matchSchedule.update({
        where: { id: suggestion1.id },
        data: {
          status: 'SCHEDULED',
          homeTeamAccepted: true,
          awayTeamAccepted: true,
          acceptedAt: new Date()
        }
      })

      // Second suggestion should be marked as unavailable or cancelled
      await db.matchSchedule.update({
        where: { id: suggestion2.id },
        data: {
          status: 'CANCELLED',
          cancellationReason: 'Venue no longer available'
        }
      })

      // Verify final state
      const finalSuggestion1 = await db.matchSchedule.findUnique({
        where: { id: suggestion1.id }
      })

      const finalSuggestion2 = await db.matchSchedule.findUnique({
        where: { id: suggestion2.id }
      })

      expect(finalSuggestion1?.status).toBe('SCHEDULED')
      expect(finalSuggestion2?.status).toBe('CANCELLED')

      // Cleanup
      await db.booking.delete({ where: { id: actualBooking.id } })
      await db.matchSchedule.deleteMany({
        where: { id: { in: [suggestion1.id, suggestion2.id] } }
      })
    })
  })

  describe('Conflict Resolution Strategies', () => {
    it('should provide alternative time slots when conflicts occur', async () => {
      const baseTime = new Date()
      baseTime.setHours(baseTime.getHours() + 184) // 1 week + 14 hours

      // Create a confirmed booking
      const confirmedBooking = await db.booking.create({
        data: {
          venueId: testVenueId,
          vendorId: testVendorId,
          startTime: baseTime,
          endTime: new Date(baseTime.getTime() + 2 * 60 * 60 * 1000),
          duration: 2,
          totalAmount: 1000,
          status: 'CONFIRMED',
          customerName: 'Confirmed Booking'
        }
      })

      // Test finding alternative slots
      const alternativeSlots = [
        new Date(baseTime.getTime() - 3 * 60 * 60 * 1000), // 3 hours before
        new Date(baseTime.getTime() + 3 * 60 * 60 * 1000), // 3 hours after
        new Date(baseTime.getTime() + 24 * 60 * 60 * 1000) // Next day same time
      ]

      // Verify alternatives don't conflict
      for (const alternativeTime of alternativeSlots) {
        const conflictCheck = await db.booking.findMany({
          where: {
            venueId: testVenueId,
            status: 'CONFIRMED',
            AND: [
              { startTime: { lt: new Date(alternativeTime.getTime() + 2 * 60 * 60 * 1000) } },
              { endTime: { gt: alternativeTime } }
            ]
          }
        })

        expect(conflictCheck.length).toBe(0)
      }

      // Cleanup
      await db.booking.delete({ where: { id: confirmedBooking.id } })
    })

    it('should handle cascade cancellation of dependent suggestions', async () => {
      const cascadeTime = new Date()
      cascadeTime.setHours(cascadeTime.getHours() + 188) // 1 week + 18 hours

      // Create multiple dependent suggestions
      const mainSuggestion = await db.matchSchedule.create({
        data: {
          homeTeamId: testTeamId1,
          awayTeamId: testTeamId2,
          venueId: testVenueId,
          vendorId: testVendorId,
          scheduledTime: cascadeTime,
          status: 'PENDING',
          aiScore: 0.9
        }
      })

      const dependentSuggestion1 = await db.matchSchedule.create({
        data: {
          homeTeamId: testTeamId1,
          awayTeamId: testTeamId3,
          venueId: testVenueId,
          vendorId: testVendorId,
          scheduledTime: new Date(cascadeTime.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
          status: 'PENDING',
          aiScore: 0.85
        }
      })

      const dependentSuggestion2 = await db.matchSchedule.create({
        data: {
          homeTeamId: testTeamId2,
          awayTeamId: testTeamId3,
          venueId: testVenueId,
          vendorId: testVendorId,
          scheduledTime: cascadeTime,
          status: 'PENDING',
          aiScore: 0.8
        }
      })

      // Simulate venue becoming unavailable (maintenance, etc.)
      await db.booking.create({
        data: {
          venueId: testVenueId,
          vendorId: testVendorId,
          startTime: cascadeTime,
          endTime: new Date(cascadeTime.getTime() + 4 * 60 * 60 * 1000), // Blocks 4 hours
          duration: 4,
          totalAmount: 2000,
          status: 'CONFIRMED',
          customerName: 'Venue Maintenance Booking'
        }
      })

      // Cancel all conflicting suggestions
      await db.matchSchedule.updateMany({
        where: {
          id: { in: [mainSuggestion.id, dependentSuggestion2.id] } // Same time conflicts
        },
        data: {
          status: 'CANCELLED',
          cancellationReason: 'Venue unavailable due to maintenance'
        }
      })

      // Verify cascade effect
      const finalMain = await db.matchSchedule.findUnique({
        where: { id: mainSuggestion.id }
      })

      const finalDep1 = await db.matchSchedule.findUnique({
        where: { id: dependentSuggestion1.id }
      })

      const finalDep2 = await db.matchSchedule.findUnique({
        where: { id: dependentSuggestion2.id }
      })

      expect(finalMain?.status).toBe('CANCELLED')
      expect(finalDep2?.status).toBe('CANCELLED')
      expect(finalDep1?.status).toBe('PENDING') // Not affected (different time)

      // Cleanup
      await db.booking.deleteMany({
        where: { customerName: 'Venue Maintenance Booking' }
      })
      await db.matchSchedule.deleteMany({
        where: { id: { in: [mainSuggestion.id, dependentSuggestion1.id, dependentSuggestion2.id] } }
      })
    })
  })

  describe('Concurrent Access and Race Conditions', () => {
    it('should handle simultaneous booking attempts gracefully', async () => {
      const concurrentTime = new Date()
      concurrentTime.setHours(concurrentTime.getHours() + 192) // 1 week + 22 hours

      // Create multiple booking attempts simultaneously
      const bookingPromises = Array.from({ length: 5 }, (_, i) =>
        fetch('http://localhost:3000/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            venueId: testVenueId,
            startTime: concurrentTime.toISOString(),
            endTime: new Date(concurrentTime.getTime() + 2 * 60 * 60 * 1000).toISOString(),
            duration: '2',
            totalAmount: 1000,
            customerName: `Concurrent Booking ${i + 1}`
          })
        })
      )

      const results = await Promise.all(bookingPromises)

      // Only one should succeed
      const successCount = results.filter(r => r.status === 200).length
      const conflictCount = results.filter(r => r.status === 409).length

      expect(successCount).toBe(1)
      expect(conflictCount).toBe(4)

      // Cleanup successful booking
      const successResult = results.find(r => r.status === 200)
      if (successResult) {
        const data = await successResult.json()
        await db.booking.delete({ where: { id: data.booking.id } })
      }
    })
  })
})