import { db } from './db'

export async function seedVendors() {
  try {
    console.log('🌱 Seeding vendors...')

    // First, create the vendor (without location info - that goes to VendorLocation)
    const vendor = await db.vendor.upsert({
      where: { slug: '3lok-whitefield' },
      update: {},
      create: {
        name: '3Lok Sports Hub',
        slug: '3lok-whitefield',
        phone: '+91 98765 43210',
        email: 'info@3loksports.com',
        website: 'https://www.3loksports.com',
        description: 'Premier sports facility in Whitefield with multiple courts and fields for various sports. Clean changing rooms, ample parking, and floodlights for night games.',
        primaryColor: '#10B981',
        secondaryColor: '#059669',
      }
    })

    // Create vendor location (new in improved architecture)
    const vendorLocation = await db.vendorLocation.upsert({
      where: { id: 'whitefield-location' }, // We'll use a predictable ID
      update: {},
      create: {
        id: 'whitefield-location',
        vendorId: vendor.id,
        name: '3Lok Whitefield',
        address: 'ITPL Main Rd, Whitefield, Bengaluru, Karnataka 560066',
        city: 'Bengaluru',
        area: 'Whitefield',
        pincode: '560066',
        phone: '+91 98765 43210',
        latitude: 12.9698,
        longitude: 77.7500,
        operatingHours: {
          monday: { open: '06:00', close: '23:00', closed: false },
          tuesday: { open: '06:00', close: '23:00', closed: false },
          wednesday: { open: '06:00', close: '23:00', closed: false },
          thursday: { open: '06:00', close: '23:00', closed: false },
          friday: { open: '06:00', close: '23:00', closed: false },
          saturday: { open: '06:00', close: '23:30', closed: false },
          sunday: { open: '06:00', close: '23:30', closed: false }
        }
      }
    })

    console.log(`✅ Created/Updated vendor: ${vendor.name}`)
    console.log(`✅ Created/Updated vendor location: ${vendorLocation.name}`)

    // Create admin user for the vendor
    const adminUser = await db.user.upsert({
      where: { email: 'admin@3loksports.com' },
      update: {},
      create: {
        name: 'Admin 3Lok',
        email: 'admin@3loksports.com',
        phone: '+91 98765 43210',
        role: 'VENDOR_ADMIN',
        vendorId: vendor.id,
        password: 'admin123', // In production, this should be hashed
        isActive: true,
      }
    })

    console.log(`✅ Created admin user: ${adminUser.email}`)

    // Create vendor settings
    await db.vendorSettings.upsert({
      where: { vendorId: vendor.id },
      update: {},
      create: {
        vendorId: vendor.id,
        advanceBookingDays: 30,
        cancellationPolicy: 'Cancellations allowed up to 2 hours before booking time. Full refund for cancellations made 24 hours in advance.',
        paymentMethods: ['cash', 'card', 'upi', 'wallet'],
        autoApproval: true,
        requiresDeposit: false,
        depositPercentage: 25
      }
    })

    console.log(`✅ Created vendor settings`)

    return {
      vendor,
      vendorLocation,
      adminUser
    }

  } catch (error) {
    console.error('❌ Error seeding vendors:', error)
    throw error
  }
}