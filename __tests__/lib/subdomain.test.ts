import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { extractSubdomain, getVendorBySubdomain, getVendorContext, addVendorFiltering } from '@/lib/subdomain'
import { db } from '@/lib/db'

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    vendor: {
      findUnique: jest.fn()
    }
  }
}))

describe('Subdomain Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('extractSubdomain', () => {
    it('should extract subdomain from vendor subdomain URL', () => {
      const request = new NextRequest('http://3lok.gamehub.com/api/venues')
      const subdomain = extractSubdomain(request)
      expect(subdomain).toBe('3lok')
    })

    it('should extract subdomain from vendor subdomain URL with port', () => {
      const request = new NextRequest('http://3lok.gamehub.com:3000/api/venues')
      const subdomain = extractSubdomain(request)
      expect(subdomain).toBe('3lok')
    })

    it('should return null for localhost', () => {
      const request = new NextRequest('http://localhost:3000/api/venues')
      const subdomain = extractSubdomain(request)
      expect(subdomain).toBeNull()
    })

    it('should return null for IP address', () => {
      const request = new NextRequest('http://127.0.0.1:3000/api/venues')
      const subdomain = extractSubdomain(request)
      expect(subdomain).toBeNull()
    })

    it('should return null for root domain', () => {
      const request = new NextRequest('https://gamehub.com/api/venues')
      const subdomain = extractSubdomain(request)
      expect(subdomain).toBeNull()
    })

    it('should ignore common subdomains', () => {
      const commonSubdomains = ['www', 'api', 'app', 'admin', 'test', 'staging', 'dev']

      commonSubdomains.forEach(subdomain => {
        const request = new NextRequest(`https://${subdomain}.gamehub.com/api/venues`)
        const result = extractSubdomain(request)
        expect(result).toBeNull()
      })
    })

    it('should ignore the main domain name', () => {
      const request = new NextRequest('https://gamehub.gamehub.com/api/venues')
      const subdomain = extractSubdomain(request)
      expect(subdomain).toBeNull()
    })

    it('should return lowercase subdomain', () => {
      const request = new NextRequest('https://3LOK.gamehub.com/api/venues')
      const subdomain = extractSubdomain(request)
      expect(subdomain).toBe('3lok')
    })
  })

  describe('getVendorBySubdomain', () => {
    it('should call database with correct slug', async () => {
      const mockVendor = { id: 'vendor-1', name: '3Lok Sports Hub', slug: '3lok' }
      ;(db.vendor.findUnique as jest.Mock).mockResolvedValue(mockVendor)

      const result = await getVendorBySubdomain('3lok')

      expect(db.vendor.findUnique).toHaveBeenCalledWith({
        where: { slug: '3lok', isActive: true },
        select: { id: true, name: true, slug: true }
      })
      expect(result).toEqual(mockVendor)
    })

    it('should return null for non-existent vendor', async () => {
      ;(db.vendor.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await getVendorBySubdomain('nonexistent')

      expect(result).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      ;(db.vendor.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const result = await getVendorBySubdomain('3lok')

      expect(result).toBeNull()
    })

    it('should return null for empty subdomain', async () => {
      const result = await getVendorBySubdomain('')

      expect(result).toBeNull()
      expect(db.vendor.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('getVendorContext', () => {
    it('should return vendor for valid subdomain request', async () => {
      const mockVendor = { id: 'vendor-1', name: '3Lok Sports Hub', slug: '3lok' }
      ;(db.vendor.findUnique as jest.Mock).mockResolvedValue(mockVendor)

      const request = new NextRequest('https://3lok.gamehub.com/api/venues')
      const result = await getVendorContext(request)

      expect(result).toEqual(mockVendor)
    })

    it('should return null for non-subdomain request', async () => {
      const request = new NextRequest('https://localhost:3000/api/venues')
      const result = await getVendorContext(request)

      expect(result).toBeNull()
      expect(db.vendor.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('addVendorFiltering', () => {
    it('should add vendorId filter when on vendor subdomain', async () => {
      const mockVendor = { id: 'vendor-1', name: '3Lok Sports Hub', slug: '3lok' }
      ;(db.vendor.findUnique as jest.Mock).mockResolvedValue(mockVendor)

      const request = new NextRequest('https://3lok.gamehub.com/api/venues')
      const conditions = {}

      await addVendorFiltering(request, conditions, 'vendorId')

      expect(conditions).toEqual({ vendorId: 'vendor-1' })
    })

    it('should use custom field name for vendor filtering', async () => {
      const mockVendor = { id: 'vendor-1', name: '3Lok Sports Hub', slug: '3lok' }
      ;(db.vendor.findUnique as jest.Mock).mockResolvedValue(mockVendor)

      const request = new NextRequest('https://3lok.gamehub.com/api/venues')
      const conditions = {}

      await addVendorFiltering(request, conditions, 'booking.venue.vendorId')

      expect(conditions).toEqual({ 'booking.venue.vendorId': 'vendor-1' })
    })

    it('should not modify conditions when not on vendor subdomain', async () => {
      const request = new NextRequest('https://localhost:3000/api/venues')
      const conditions = { sport: 'soccer' }

      await addVendorFiltering(request, conditions, 'vendorId')

      expect(conditions).toEqual({ sport: 'soccer' })
      expect(db.vendor.findUnique).not.toHaveBeenCalled()
    })

    it('should preserve existing conditions when adding vendor filter', async () => {
      const mockVendor = { id: 'vendor-1', name: '3Lok Sports Hub', slug: '3lok' }
      ;(db.vendor.findUnique as jest.Mock).mockResolvedValue(mockVendor)

      const request = new NextRequest('https://3lok.gamehub.com/api/venues')
      const conditions = { sport: 'soccer', isActive: true }

      await addVendorFiltering(request, conditions, 'vendorId')

      expect(conditions).toEqual({
        sport: 'soccer',
        isActive: true,
        vendorId: 'vendor-1'
      })
    })
  })
})