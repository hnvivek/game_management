import { db } from './db'

// Multiple vendors with different branding for subdomain testing
const vendors = [
  {
    name: '3Lok Sports Hub',
    slug: '3lok',
    phone: '+91 98765 43210',
    email: 'info@3loksports.com',
    website: 'https://www.3loksports.com',
    description: 'Premier sports facility in Whitefield with multiple courts and fields for various sports. Clean changing rooms, ample parking, and floodlights for night games.',
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    accentColor: '#34D399',
    locations: [
      {
        name: '3Lok Whitefield',
        address: 'ITPL Main Rd, Whitefield, Bengaluru, Karnataka 560066',
        city: 'Bengaluru',
        area: 'Whitefield',
        pincode: '560066',
        phone: '+91 98765 43210',
        latitude: 12.9698,
        longitude: 77.7500
      },
      {
        name: '3Lok Koramangala',
        address: '80 Feet Road, Koramangala 4th Block, Bengaluru, Karnataka 560034',
        city: 'Bengaluru',
        area: 'Koramangala',
        pincode: '560034',
        phone: '+91 98765 43211',
        latitude: 12.9279,
        longitude: 77.6271
      }
    ]
  },
  {
    name: 'GameHub Pro Sports',
    slug: 'gamehub',
    phone: '+91 98765 54321',
    email: 'hello@gamehubpro.com',
    website: 'https://gamehubpro.com',
    description: 'Professional sports complex with world-class facilities. Perfect for tournaments, corporate events, and serious athletes.',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#60A5FA',
    locations: [
      {
        name: 'GameHub Indiranagar',
        address: '100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
        city: 'Bengaluru',
        area: 'Indiranagar',
        pincode: '560038',
        phone: '+91 98765 54321',
        latitude: 12.9716,
        longitude: 77.6407
      },
      {
        name: 'GameHub HSR Layout',
        address: '14th Main Road, HSR Layout, Bengaluru, Karnataka 560102',
        city: 'Bengaluru',
        area: 'HSR Layout',
        pincode: '560102',
        phone: '+91 98765 54322',
        latitude: 12.9116,
        longitude: 77.6471
      }
    ]
  },
  {
    name: 'Elite Sports Arena',
    slug: 'elite',
    phone: '+91 88765 43210',
    email: 'contact@elitesportsarena.com',
    website: 'https://elitesportsarena.com',
    description: 'Luxury sports destination with premium facilities, expert coaching, and exclusive membership programs.',
    primaryColor: '#8B5CF6',
    secondaryColor: '#6D28D9',
    accentColor: '#A78BFA',
    locations: [
      {
        name: 'Elite Jayanagar',
        address: 'Jayanagar 4th Block, Bengaluru, Karnataka 560041',
        city: 'Bengaluru',
        area: 'Jayanagar',
        pincode: '560041',
        phone: '+91 88765 43210',
        latitude: 12.9293,
        longitude: 77.5824
      }
    ]
  },
  {
    name: 'Urban Sports Complex',
    slug: 'urban',
    phone: '+91 77765 43210',
    email: 'play@urbansports.in',
    website: 'https://urbansports.in',
    description: 'Affordable sports facility for all ages. Community-focused with regular events and training programs.',
    primaryColor: '#F59E0B',
    secondaryColor: '#D97706',
    accentColor: '#FCD34D',
    locations: [
      {
        name: 'Urban Marathahalli',
        address: 'Outer Ring Road, Marathahalli, Bengaluru, Karnataka 560037',
        city: 'Bengaluru',
        area: 'Marathahalli',
        pincode: '560037',
        phone: '+91 77765 43210',
        latitude: 12.9569,
        longitude: 77.7011
      },
      {
        name: 'Urban Bellandur',
        address: 'Bellandur, Bengaluru, Karnataka 560103',
        city: 'Bengaluru',
        area: 'Bellandur',
        pincode: '560103',
        phone: '+91 77765 43211',
        latitude: 12.9258,
        longitude: 77.6765
      }
    ]
  },
  {
    name: 'PowerPlay Sports',
    slug: 'powerplay',
    phone: '+91 66765 43210',
    email: 'info@powerplaysports.com',
    website: 'https://powerplaysports.com',
    description: 'High-energy sports facility specializing in competitive games and leagues. Regular tournaments and coaching camps.',
    primaryColor: '#EF4444',
    secondaryColor: '#DC2626',
    accentColor: '#F87171',
    locations: [
      {
        name: 'PowerPlay BTM Layout',
        address: 'BTM Layout, Bengaluru, Karnataka 560076',
        city: 'Bengaluru',
        area: 'BTM Layout',
        pincode: '560076',
        phone: '+91 66765 43210',
        latitude: 12.9129,
        longitude: 77.6106
      }
    ]
  }
]

export async function seedVendors() {
  try {
    console.log('🌱 Seeding vendors...')

    const createdVendors = []

    for (const vendorData of vendors) {
      // First, create the vendor
      const vendor = await db.vendor.upsert({
        where: { slug: vendorData.slug },
        update: {},
        create: {
          name: vendorData.name,
          slug: vendorData.slug,
          phone: vendorData.phone,
          email: vendorData.email,
          website: vendorData.website,
          description: vendorData.description,
          primaryColor: vendorData.primaryColor,
          secondaryColor: vendorData.secondaryColor,
          accentColor: vendorData.accentColor
        }
      })

      // Create vendor locations
      const createdLocations = []
      for (const locationData of vendorData.locations) {
        const vendorLocation = await db.vendorLocation.create({
          data: {
            vendorId: vendor.id,
            name: locationData.name,
            address: locationData.address,
            city: locationData.city,
            area: locationData.area,
            pincode: locationData.pincode,
            phone: locationData.phone,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
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
        createdLocations.push(vendorLocation)
      }

      // Create admin user for the vendor
      const adminUser = await db.user.upsert({
        where: { email: `admin@${vendorData.slug}.com` },
        update: {},
        create: {
          name: `Admin ${vendorData.name}`,
          email: `admin@${vendorData.slug}.com`,
          phone: vendorData.phone,
          role: 'VENDOR_ADMIN',
          vendorId: vendor.id,
          password: 'admin123', // In production, this should be hashed
          isActive: true,
        }
      })

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

      createdVendors.push({
        vendor,
        locations: createdLocations,
        adminUser
      })

      console.log(`✅ Created vendor: ${vendor.name} (${vendor.slug})`)
      console.log(`✅ Created ${createdLocations.length} locations for ${vendor.name}`)
      console.log(`✅ Created admin user: ${adminUser.email}`)
    }

    console.log(`✅ Successfully created ${createdVendors.length} vendors with multiple locations`)
    console.log('✅ Subdomain URLs available:')
    createdVendors.forEach(({ vendor }) => {
      console.log(`   - ${vendor.slug}.localhost:3000 (dev)`)
      console.log(`   - ${vendor.slug}.gamehub.com (prod)`)
    })

    return createdVendors

  } catch (error) {
    console.error('❌ Error seeding vendors:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  seedVendors()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}