import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
          turfs: {
            where: { isActive: true },
            orderBy: { courtNumber: 'asc' }
          },
          settings: true,
          _count: {
            select: {
              turfs: true,
              bookings: true,
              users: true
            }
          }
        }
      })
      
      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
      }
      
      return NextResponse.json({ vendor })
    }
    
    // List all vendors (for platform admin)
    const vendors = await db.vendor.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            turfs: true,
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
      location,
      address,
      phone,
      email,
      website,
      description,
      adminName,
      adminEmail,
      adminPhone
    } = body
    
    // Validate required fields
    if (!name || !location || !adminEmail) {
      return NextResponse.json(
        { error: 'Name, location, and admin email are required' },
        { status: 400 }
      )
    }
    
    // Create vendor slug
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
    
    // Check if slug already exists
    const existingVendor = await db.vendor.findUnique({
      where: { slug }
    })
    
    if (existingVendor) {
      return NextResponse.json(
        { error: 'A vendor with similar name already exists' },
        { status: 409 }
      )
    }
    
    // Create vendor
    const vendor = await db.vendor.create({
      data: {
        name,
        slug,
        location,
        address,
        phone,
        email,
        website,
        description
      }
    })
    
    // Create vendor admin user
    const adminUser = await db.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        role: 'vendor_admin',
        vendorId: vendor.id,
        // TODO: Hash password properly
        password: 'temporary123' // Should be generated and sent via email
      }
    })
    
    // Create default vendor settings
    await db.vendorSettings.create({
      data: {
        vendorId: vendor.id,
        operatingHours: JSON.stringify({
          monday: { open: '06:00', close: '23:00', closed: false },
          tuesday: { open: '06:00', close: '23:00', closed: false },
          wednesday: { open: '06:00', close: '23:00', closed: false },
          thursday: { open: '06:00', close: '23:00', closed: false },
          friday: { open: '06:00', close: '23:00', closed: false },
          saturday: { open: '06:00', close: '23:00', closed: false },
          sunday: { open: '06:00', close: '23:00', closed: false }
        }),
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
