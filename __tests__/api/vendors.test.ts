import { describe, it, expect, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/vendors/route'

describe('/api/vendors', () => {
  // ✨ Database cleaned automatically before each test!

  describe('GET /api/vendors', () => {
    it('should return all active vendors', async () => {
      const request = new NextRequest('http://localhost:3000/api/vendors')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.vendors)).toBe(true)
      expect(data.vendors.length).toBeGreaterThan(0)
      expect(data.vendors[0]).toHaveProperty('name')
      expect(data.vendors[0]).toHaveProperty('location')
      expect(data.vendors[0]).toHaveProperty('isActive', true)
    })

    it('should return specific vendor by ID', async () => {
      const url = new URL('http://localhost:3000/api/vendors')
      url.searchParams.set('vendorId', 'test-vendor-1')
      
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.vendor).toBeDefined()
      expect(data.vendor.name).toBe('Test Sports Hub')
      expect(data.vendor).toHaveProperty('turfs')
      expect(data.vendor).toHaveProperty('settings')
      expect(data.vendor).toHaveProperty('_count')
    })

    it('should return 404 for non-existent vendor', async () => {
      const url = new URL('http://localhost:3000/api/vendors')
      url.searchParams.set('vendorId', 'non-existent')
      
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Vendor not found')
    })
  })

  describe('POST /api/vendors', () => {
    // Generate unique vendor data to avoid conflicts
    const getUniqueVendorData = () => {
      const timestamp = Date.now()
      return {
        name: `Sports Complex ${timestamp}`,
        location: 'Bangalore',
        address: 'Test Address 123',
        phone: '+91 9876543210',
        email: `info${timestamp}@newsports.com`,
        website: 'https://newsports.com',
        description: 'A great sports facility',
        adminName: 'Admin User',
        adminEmail: `admin${timestamp}@newsports.com`,
        adminPhone: '+91 9876543210'
      }
    }

    it('should create a new vendor successfully', async () => {
      const validVendorData = getUniqueVendorData()
      
      const request = new NextRequest('http://localhost:3000/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validVendorData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.vendor).toBeDefined()
      expect(data.vendor.name).toBe(validVendorData.name)
      expect(data.vendor.location).toBe(validVendorData.location)
      expect(data.admin).toBeDefined()
      expect(data.admin.email).toBe(validVendorData.adminEmail)
      expect(data.message).toBe('Vendor onboarded successfully')
    })

    it('should reject vendor with missing required fields', async () => {
      const invalidData = {
        name: 'Test Vendor',
        // Missing location and adminEmail
        adminName: 'Admin User'
      }

      const request = new NextRequest('http://localhost:3000/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Name, location, and admin email are required')
    })

    it('should reject duplicate vendor names', async () => {
      const validVendorData = getUniqueVendorData()
      
      // Create first vendor
      const request1 = new NextRequest('http://localhost:3000/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validVendorData)
      })
      await POST(request1)

      // Try to create duplicate
      const duplicateData = {
        ...validVendorData,
        adminEmail: 'different@email.com' // Different email to avoid email conflict
      }

      const request2 = new NextRequest('http://localhost:3000/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData)
      })

      const response = await POST(request2)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('A vendor with similar name already exists')
    })
  })
})
