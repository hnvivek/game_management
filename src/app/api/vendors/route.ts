import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for vendor search parameters
const vendorSearchSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val) || 1),
  limit: z.string().optional().transform(val => Math.min(parseInt(val) || 20, 100)),
  search: z.string().optional(),
  city: z.string().optional(),
  sport: z.string().optional(),
  sortBy: z.enum(['featured', 'rating', 'price-low', 'price-high', 'reviews', 'newest']).optional(),
  featured: z.string().optional().transform(val => val === 'true'),
  minRating: z.string().optional().transform(val => parseFloat(val)),
  maxPrice: z.string().optional().transform(val => parseFloat(val)),
  hasAvailability: z.string().optional().transform(val => val === 'true'),
})

/**
 * @swagger
 * /api/vendors:
 *   get:
 *     summary: Get list of vendors or specific vendor profile
 *     description: Retrieve a list of all vendors (for platform admin) or get a specific vendor's profile with settings
 *     tags:
 *       - Vendors
 *     parameters:
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: string
 *         description: Get specific vendor profile by ID
 *     responses:
 *       200:
 *         description: List of vendors or vendor profile
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vendor'
 *                 - $ref: '#/components/schemas/Vendor'
 *       500:
 *         description: Failed to fetch vendors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// GET /api/vendors - List all vendors (platform admin) or get vendor profile
export async function GET(request: NextRequest) {
  try {
    // List all vendors (for platform admin)
    const vendors = await db.vendor.findMany({
      where: { 
        isActive: true,
        deletedAt: null
      },
      include: {
        _count: {
          select: {
            venues: true,
            bookings: true,
            users: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ vendors })
  } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 })
  }
}

// POST /api/vendors - Create new vendor (onboarding)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      slug,
      address,
      phone,
      phoneCountryCode,
      phoneNumber,
      email,
      website,
      description,
      primaryColor,
      secondaryColor,
      adminName,
      adminEmail,
      adminPhone
    } = body

    // Parse phone if provided as single string, otherwise use separate fields
    let parsedPhoneCountryCode = phoneCountryCode
    let parsedPhoneNumber = phoneNumber
    
    if (phone && !phoneCountryCode && !phoneNumber) {
      // Try to parse phone string (e.g., "+91 9876543210" or "+919876543210")
      const phoneMatch = phone.match(/^(\+?\d{1,4})\s*(.+)$/)
      if (phoneMatch) {
        parsedPhoneCountryCode = phoneMatch[1]
        parsedPhoneNumber = phoneMatch[2].replace(/\D/g, '')
      } else {
        // If no country code found, assume it's just the number
        parsedPhoneNumber = phone.replace(/\D/g, '')
      }
    }

    // Validate required fields - match test expectations
    if (!name || !slug || !adminEmail) {
      return NextResponse.json(
        { error: 'Name, slug, and admin email are required' },
        { status: 400 }
      )
    }

    // Validate slug is subdomain-friendly
    const subdomainRegex = /^[a-z0-9-]+$/
    if (!subdomainRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens for subdomain use' },
        { status: 400 }
      )
    }

    // Validate slug doesn't start or end with hyphen
    if (slug.startsWith('-') || slug.endsWith('-')) {
      return NextResponse.json(
        { error: 'Slug cannot start or end with a hyphen' },
        { status: 400 }
      )
    }

    // Validate slug length for subdomain
    if (slug.length < 3 || slug.length > 50) {
      return NextResponse.json(
        { error: 'Slug must be between 3 and 50 characters for subdomain use' },
        { status: 400 }
      )
    }
    
    // Check if slug already exists (excluding soft-deleted)
    const existingVendorBySlug = await db.vendor.findFirst({
      where: { 
        slug,
        deletedAt: null
      }
    })

    if (existingVendorBySlug) {
      return NextResponse.json(
        { error: 'Vendor slug already exists' },
        { status: 409 }
      )
    }

    // Check if name already exists (excluding soft-deleted)
    const existingVendorByName = await db.vendor.findFirst({
      where: { 
        name,
        deletedAt: null
      }
    })

    if (existingVendorByName) {
      return NextResponse.json(
        { error: 'A vendor with this name already exists' },
        { status: 409 }
      )
    }

    // Create vendor
    const vendor = await db.vendor.create({
      data: {
        name,
        slug,
        address,
        phoneCountryCode: parsedPhoneCountryCode,
        phoneNumber: parsedPhoneNumber,
        email,
        website,
        description,
        ...(primaryColor && { primaryColor }),
        ...(secondaryColor && { secondaryColor })
      }
    })
    
    // Create vendor admin user
    const adminUser = await db.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        role: 'VENDOR_ADMIN',
        vendorId: vendor.id,
        // TODO: Hash password properly
        password: 'temporary123' // Should be generated and sent via email
      }
    })
    
    // Create default vendor settings
    await db.vendorSettings.create({
      data: {
        vendorId: vendor.id,
        paymentMethods: JSON.stringify(['cash', 'card', 'upi'])
      }
    })
    
    return NextResponse.json({ 
      vendor,
      admin: { id: adminUser.id, email: adminUser.email },
      message: 'Vendor onboarded successfully' 
    })
  } catch (error) {
        return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 })
  }
}
