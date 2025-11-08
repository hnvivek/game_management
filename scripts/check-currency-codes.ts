/**
 * Script to check currency codes for vendors and venues in the database
 * Run with: npx tsx scripts/check-currency-codes.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCurrencyCodes() {
  try {
    console.log('Checking currency codes in database...\n')

    // Check vendors
    console.log('=== VENDORS ===')
    const vendors = await prisma.vendor.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        currencyCode: true,
        countryCode: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    if (vendors.length === 0) {
      console.log('No vendors found')
    } else {
      vendors.forEach((vendor) => {
        console.log(`- ${vendor.name} (${vendor.id})`)
        console.log(`  Currency: ${vendor.currencyCode || 'NOT SET'}`)
        console.log(`  Country: ${vendor.countryCode || 'NOT SET'}`)
        console.log('')
      })
    }

    // Check venues
    console.log('\n=== VENUES ===')
    const venues = await prisma.venue.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            currencyCode: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    if (venues.length === 0) {
      console.log('No venues found')
    } else {
      venues.forEach((venue) => {
        console.log(`- ${venue.name} (${venue.id})`)
        console.log(`  Venue Currency: ${venue.currencyCode || 'NOT SET'}`)
        console.log(`  Vendor: ${venue.vendor.name} (${venue.vendor.id})`)
        console.log(`  Vendor Currency: ${venue.vendor.currencyCode || 'NOT SET'}`)
        console.log(`  → Will use: ${venue.currencyCode || venue.vendor.currencyCode || 'USD (default)'}`)
        console.log('')
      })
    }

    // Summary
    console.log('\n=== SUMMARY ===')
    const venuesWithoutCurrency = venues.filter(
      (v) => !v.currencyCode && !v.vendor.currencyCode
    )
    const venuesWithVenueCurrency = venues.filter((v) => v.currencyCode)
    const venuesUsingVendorCurrency = venues.filter(
      (v) => !v.currencyCode && v.vendor.currencyCode
    )

    console.log(`Total vendors: ${vendors.length}`)
    console.log(`Total venues: ${venues.length}`)
    console.log(`Venues with own currency: ${venuesWithVenueCurrency.length}`)
    console.log(`Venues using vendor currency: ${venuesUsingVendorCurrency.length}`)
    console.log(`Venues without currency (will use USD): ${venuesWithoutCurrency.length}`)

    if (venuesWithoutCurrency.length > 0) {
      console.log('\n⚠️  Venues without currency code:')
      venuesWithoutCurrency.forEach((v) => {
        console.log(`  - ${v.name} (Venue: ${v.vendor.name})`)
      })
    }
  } catch (error) {
    console.error('Error checking currency codes:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCurrencyCodes()

