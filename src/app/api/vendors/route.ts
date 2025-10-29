import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getVendorSettings, getSupportedCountries, getSupportedCurrencies } from '@/lib/vendor-settings'

// GET /api/vendors - List all vendors (platform admin) or get vendor profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    
    if (vendorId) {
      // Get specific vendor profile
      const vendor = await db.vendor.findUnique({
        where: { id: vendorId },
        include: {
          venues: {
            where: { isActive: true },
            orderBy: { courtNumber: 'asc' }
          },
          locations: {
            where: { isActive: true }
          },
          settings: true,
          _count: {
            select: {
              venues: true,
              bookings: true,
              users: true
            }
          }
        }
      })
      
      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
      }

      // Get vendor settings (includes all international information)
      const vendorSettings = await getVendorSettings(vendor.id)

      const enhancedVendor = {
        ...vendor,
        settings: vendorSettings ? {
          ...vendor.settings,
          ...vendorSettings
        } : vendor.settings
      }

      return NextResponse.json({ vendor: enhancedVendor })
    }
    
    // List all vendors (for platform admin)
    const vendors = await db.vendor.findMany({
      where: { isActive: true },
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
    console.error('Error fetching vendors:', error)
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
      email,
      website,
      description,
      primaryColor,
      secondaryColor,
      adminName,
      adminEmail,
      adminPhone
    } = body

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
    
    // Check if slug already exists
    const existingVendorBySlug = await db.vendor.findUnique({
      where: { slug }
    })

    if (existingVendorBySlug) {
      return NextResponse.json(
        { error: 'Vendor slug already exists' },
        { status: 409 }
      )
    }

    // Check if name already exists
    const existingVendorByName = await db.vendor.findFirst({
      where: { name }
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
        phone,
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
    console.error('Error creating vendor:', error)
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 })
  }
}
