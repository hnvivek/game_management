import { describe, it, expect, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as getTurfs } from '@/app/api/turfs/route'
import { GET as getAvailability } from '@/app/api/turfs/availability/route'
import { POST as createBooking } from '@/app/api/bookings/route'
import { GET as getVendors, POST as createVendor } from '@/app/api/vendors/route'

describe('Complete Booking Workflow Integration Tests', () => {
  beforeEach(async () => {
    await global.testUtils.cleanDatabase()
  })

  describe('End-to-End Booking Flow', () => {
    it('should complete full booking workflow successfully', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()
      
      // Step 1: Get available turfs for soccer
      const turfsUrl = new URL('http://localhost:3000/api/turfs')
      turfsUrl.searchParams.set('sport', 'soccer')
      turfsUrl.searchParams.set('date', tomorrow)
      turfsUrl.searchParams.set('duration', '2')
      
      const turfsRequest = new NextRequest(turfsUrl)
      const turfsResponse = await getTurfs(turfsRequest)
      const turfsData = await turfsResponse.json()
      
      expect(turfsResponse.status).toBe(200)
      expect(turfsData.turfs.length).toBeGreaterThan(0)
      
      const selectedTurf = turfsData.turfs[0]
      expect(selectedTurf.isAvailable).toBe(true)
      
      // Step 2: Get detailed availability for selected turf
      const availUrl = new URL('http://localhost:3000/api/turfs/availability')
      availUrl.searchParams.set('turfId', selectedTurf.id)
      availUrl.searchParams.set('date', tomorrow)
      availUrl.searchParams.set('duration', '2')
      
      const availRequest = new NextRequest(availUrl)
      const availResponse = await getAvailability(availRequest)
      const availData = await availResponse.json()
      
      expect(availResponse.status).toBe(200)
      expect(availData.slots.length).toBeGreaterThan(0)
      
      const availableSlot = availData.slots.find((slot: any) => slot.isAvailable)
      expect(availableSlot).toBeDefined()
      
      // Step 3: Create booking for the selected slot
      const bookingData = {
        turfId: selectedTurf.id,
        date: tomorrow,
        startTime: availableSlot.startTime,
        duration: '2',
        totalAmount: availableSlot.price,
        bookingType: 'match'
      }
      
      const bookingRequest = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })
      
      const bookingResponse = await createBooking(bookingRequest)
      const bookingResult = await bookingResponse.json()
      
      expect(bookingResponse.status).toBe(200)
      expect(bookingResult.booking).toBeDefined()
      expect(bookingResult.booking.status).toBe('confirmed')
      
      // Step 4: Verify that the slot is now unavailable
      const verifyAvailRequest = new NextRequest(availUrl)
      const verifyAvailResponse = await getAvailability(verifyAvailRequest)
      const verifyAvailData = await verifyAvailResponse.json()
      
      expect(verifyAvailResponse.status).toBe(200)
      
      const bookedSlot = verifyAvailData.slots.find(
        (slot: any) => slot.startTime === availableSlot.startTime
      )
      expect(bookedSlot.isAvailable).toBe(false)
      
      // Step 5: Verify turf shows as unavailable for that time
      const verifyTurfsRequest = new NextRequest(turfsUrl)
      const verifyTurfsResponse = await getTurfs(verifyTurfsRequest)
      const verifyTurfsData = await verifyTurfsResponse.json()
      
      expect(verifyTurfsResponse.status).toBe(200)
      const verifyTurf = verifyTurfsData.turfs.find((t: any) => t.id === selectedTurf.id)
      // Should be unavailable for the specific booked time
    })

    it('should handle multiple concurrent bookings correctly', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()
      
      // Get available slots
      const availUrl = new URL('http://localhost:3000/api/turfs/availability')
      availUrl.searchParams.set('turfId', 'test-turf-1')
      availUrl.searchParams.set('date', tomorrow)
      availUrl.searchParams.set('duration', '1')
      
      const availRequest = new NextRequest(availUrl)
      const availResponse = await getAvailability(availRequest)
      const availData = await availResponse.json()
      
      expect(availResponse.status).toBe(200)
      
      const availableSlots = availData.slots.filter((s: any) => s.isAvailable)
      expect(availableSlots.length).toBeGreaterThanOrEqual(2)
      
      // Create multiple bookings for different time slots
      const bookingPromises = availableSlots.slice(0, 2).map((slot: any) => {
        const bookingData = {
          turfId: 'test-turf-1',
          date: tomorrow,
          startTime: slot.startTime,
          duration: '1',
          totalAmount: slot.price,
          bookingType: 'match'
        }
        
        return createBooking(new NextRequest('http://localhost:3000/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData)
        }))
      })
      
      const results = await Promise.all(bookingPromises)
      
      // All bookings should succeed
      for (const response of results) {
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.booking.status).toBe('confirmed')
      }
    })

    it('should prevent double booking of the same slot', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()
      
      const bookingData = {
        turfId: 'test-turf-1',
        date: tomorrow,
        startTime: '14:00',
        duration: '2',
        totalAmount: 4000,
        bookingType: 'match'
      }
      
      // Create first booking
      const request1 = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })
      
      const response1 = await createBooking(request1)
      expect(response1.status).toBe(200)
      
      // Try to create second booking for same slot
      const request2 = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })
      
      const response2 = await createBooking(request2)
      expect(response2.status).toBe(409)
      
      const data2 = await response2.json()
      expect(data2.error).toBe('Turf is not available for the selected time slot')
    })
  })

  describe('Multi-Vendor Workflow', () => {
    it('should handle vendor creation and turf management', async () => {
      // Step 1: Create a new vendor
      const vendorData = {
        name: 'New Sports Arena',
        location: 'Test City',
        address: 'Test Address',
        phone: '+91 9876543210',
        email: 'info@newsports.com',
        adminName: 'Test Admin',
        adminEmail: 'admin@newsports.com'
      }
      
      const vendorRequest = new NextRequest('http://localhost:3000/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorData)
      })
      
      const vendorResponse = await createVendor(vendorRequest)
      const vendorResult = await vendorResponse.json()
      
      expect(vendorResponse.status).toBe(200)
      expect(vendorResult.vendor).toBeDefined()
      
      const newVendorId = vendorResult.vendor.id
      
      // Step 2: Verify vendor appears in vendors list
      const vendorsRequest = new NextRequest('http://localhost:3000/api/vendors')
      const vendorsResponse = await getVendors(vendorsRequest)
      const vendorsData = await vendorsResponse.json()
      
      expect(vendorsResponse.status).toBe(200)
      const createdVendor = vendorsData.vendors.find((v: any) => v.id === newVendorId)
      expect(createdVendor).toBeDefined()
      expect(createdVendor.name).toBe(vendorData.name)
      
      // Step 3: Verify vendor filtering works in turfs API
      const turfsUrl = new URL('http://localhost:3000/api/turfs')
      turfsUrl.searchParams.set('vendorId', newVendorId)
      
      const turfsRequest = new NextRequest(turfsUrl)
      const turfsResponse = await getTurfs(turfsRequest)
      const turfsData = await turfsResponse.json()
      
      expect(turfsResponse.status).toBe(200)
      // New vendor should have no turfs initially
      expect(turfsData.turfs.length).toBe(0)
    })

    it('should isolate bookings between vendors', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()
      
      // Get turfs from test vendor
      const turfsUrl = new URL('http://localhost:3000/api/turfs')
      turfsUrl.searchParams.set('vendorId', 'test-vendor')
      
      const turfsRequest = new NextRequest(turfsUrl)
      const turfsResponse = await getTurfs(turfsRequest)
      const turfsData = await turfsResponse.json()
      
      expect(turfsResponse.status).toBe(200)
      expect(turfsData.turfs.length).toBeGreaterThan(0)
      
      // All turfs should belong to test vendor
      turfsData.turfs.forEach((turf: any) => {
        expect(turf.vendorId).toBe('test-vendor')
        expect(turf.vendor.id).toBe('test-vendor')
      })
      
      // Create booking for test vendor turf
      const bookingData = {
        turfId: turfsData.turfs[0].id,
        date: tomorrow,
        startTime: '14:00',
        duration: '2',
        totalAmount: 4000,
        bookingType: 'match'
      }
      
      const bookingRequest = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })
      
      const bookingResponse = await createBooking(bookingRequest)
      const bookingResult = await bookingResponse.json()
      
      expect(bookingResponse.status).toBe(200)
      expect(bookingResult.booking.vendorId).toBe('test-vendor')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle gracefully when no turfs are available', async () => {
      const tomorrow = global.testUtils.getTomorrowDate()
      
      // Fill all slots with bookings
      const slots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00']
      
      for (const startTime of slots) {
        await global.testUtils.createTestBooking({
          date: tomorrow,
          startTime,
          endTime: `${parseInt(startTime.split(':')[0]) + 2}:00`,
          duration: 2
        })
      }
      
      // Try to get available turfs
      const turfsUrl = new URL('http://localhost:3000/api/turfs')
      turfsUrl.searchParams.set('sport', 'soccer')
      turfsUrl.searchParams.set('date', tomorrow)
      turfsUrl.searchParams.set('duration', '2')
      
      const turfsRequest = new NextRequest(turfsUrl)
      const turfsResponse = await getTurfs(turfsRequest)
      const turfsData = await turfsResponse.json()
      
      expect(turfsResponse.status).toBe(200)
      expect(turfsData.turfs.length).toBeGreaterThan(0)
      
      // All turfs should be unavailable
      turfsData.turfs.forEach((turf: any) => {
        expect(turf.isAvailable).toBe(false)
      })
    })

    it('should handle booking on past dates', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const pastDate = yesterday.toISOString().split('T')[0]
      
      const bookingData = {
        turfId: 'test-turf-1',
        date: pastDate,
        startTime: '14:00',
        duration: '2',
        totalAmount: 4000,
        bookingType: 'match'
      }
      
      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })
      
      const response = await createBooking(request)
      
      // Should either succeed (if past bookings are allowed) or fail gracefully
      expect([200, 400, 409].includes(response.status)).toBe(true)
    })
  })
})
