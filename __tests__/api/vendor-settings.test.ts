import { describe, it, expect, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, PUT } from '@/app/api/vendor-settings/route'

describe('/api/vendor-settings', () => {
  // ✨ Database cleaned automatically before each test!

  describe('GET /api/vendor-settings', () => {
    it('should return vendor settings by vendor ID', async () => {
      const url = new URL('http://localhost:3000/api/vendor-settings')
      url.searchParams.set('vendorId', 'test-vendor-1')

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.settings).toBeDefined()
      expect(data.settings).toHaveProperty('advanceBookingDays')
      expect(data.settings).toHaveProperty('bookingTimeSlots')
      expect(data.settings).toHaveProperty('showBookingCalendar')
      expect(data.settings).toHaveProperty('showPricingPublicly')
      expect(data.settings).toHaveProperty('allowOnlinePayments')
      expect(data.settings).toHaveProperty('showContactInfo')
      expect(data.settings).toHaveProperty('autoApproval')
      expect(data.settings).toHaveProperty('emailNotifications')
    })

    it('should return 404 for non-existent vendor', async () => {
      const url = new URL('http://localhost:3000/api/vendor-settings')
      url.searchParams.set('vendorId', 'non-existent-vendor')

      const request = new Request(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Vendor not found')
    })

    it('should create default settings if none exist', async () => {
      // First, delete any existing settings for this vendor
      const db = global.testPrisma
      await db.vendorSettings.deleteMany({
        where: { vendorId: 'test-vendor-1' }
      })

      const url = new URL('http://localhost:3000/api/vendor-settings')
      url.searchParams.set('vendorId', 'test-vendor-1')

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.settings).toBeDefined()
      expect(data.settings).toHaveProperty('advanceBookingDays')
      expect(data.settings).toHaveProperty('bookingTimeSlots')
      expect(data.settings.advanceBookingDays).toBe(30) // Default value
    })
  })

  describe('PUT /api/vendor-settings', () => {
    const getValidSettingsData = (overrides = {}) => ({
      vendorId: 'test-vendor-1',
      advanceBookingDays: 30,
      cancellationPolicy: 'Full refund if cancelled 24 hours before',
      paymentMethods: ['cash', 'card', 'upi'],
      bookingTimeSlots: 60,
      maxConcurrentBookings: 1,
      basePrice: 1000,
      peakHourPrice: 1500,
      weekendPrice: 1200,
      currency: 'INR',
      showBookingCalendar: true,
      showPricingPublicly: true,
      allowOnlinePayments: true,
      showContactInfo: true,
      emailNotifications: true,
      smsNotifications: false,
      bookingReminders: true,
      newBookingAlerts: true,
      cancellationAlerts: true,
      paymentAlerts: true,
      autoApproval: true,
      requiresDeposit: false,
      depositPercentage: 25,
      availableAmenities: ['parking', 'changing_rooms', 'floodlights'],
      venueImages: ['https://example.com/image1.jpg'],
      sportTypes: ['football', 'basketball'],
      ...overrides
    })

    it('should update vendor settings successfully', async () => {
      const settingsData = getValidSettingsData({
        advanceBookingDays: 45,
        showBookingCalendar: false
      })

      const request = new NextRequest('http://localhost:3000/api/vendor-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.settings).toBeDefined()
      expect(data.settings.advanceBookingDays).toBe(45)
      expect(data.settings.showBookingCalendar).toBe(false)
    })

    it('should validate required fields', async () => {
      const invalidData = {
        vendorId: 'test-vendor-1',
        // Missing all other required fields
      }

      const request = new NextRequest('http://localhost:3000/api/vendor-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('At least one field to update is required')
    })

    it('should reject invalid vendor ID', async () => {
      const settingsData = getValidSettingsData()

      const request = new NextRequest('http://localhost:3000/api/vendor-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settingsData, vendorId: 'invalid-vendor-id' })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Vendor not found')
    })

    it('should update pricing settings', async () => {
      const settingsData = getValidSettingsData({
        basePrice: 2000,
        peakHourPrice: 2500,
        weekendPrice: 2200
      })

      const request = new NextRequest('http://localhost:3000/api/vendor-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.settings.basePrice).toBe(2000)
      expect(data.settings.peakHourPrice).toBe(2500)
      expect(data.settings.weekendPrice).toBe(2200)
    })

    it('should update notification preferences', async () => {
      const settingsData = getValidSettingsData({
        emailNotifications: false,
        smsNotifications: true,
        bookingReminders: false,
        newBookingAlerts: false,
        cancellationAlerts: false,
        paymentAlerts: false
      })

      const request = new NextRequest('http://localhost:3000/api/vendor-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.settings.emailNotifications).toBe(false)
      expect(data.settings.smsNotifications).toBe(true)
      expect(data.settings.bookingReminders).toBe(false)
    })

    it('should update display preferences', async () => {
      const settingsData = getValidSettingsData({
        showBookingCalendar: false,
        showPricingPublicly: false,
        allowOnlinePayments: false,
        showContactInfo: false
      })

      const request = new NextRequest('http://localhost:3000/api/vendor-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.settings.showBookingCalendar).toBe(false)
      expect(data.settings.showPricingPublicly).toBe(false)
      expect(data.settings.allowOnlinePayments).toBe(false)
      expect(data.settings.showContactInfo).toBe(false)
    })

    it('should handle JSON fields properly', async () => {
      const settingsData = getValidSettingsData({
        paymentMethods: ['digital', 'cash'],
        availableAmenities: ['parking', 'wifi', 'shower'],
        sportTypes: ['cricket', 'tennis', 'badminton']
      })

      const request = new NextRequest('http://localhost:3000/api/vendor-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.settings.paymentMethods).toEqual(['digital', 'cash'])
      expect(data.settings.availableAmenities).toEqual(['parking', 'wifi', 'shower'])
      expect(data.settings.sportTypes).toEqual(['cricket', 'tennis', 'badminton'])
    })
  })
})