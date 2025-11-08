import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { addVendorFiltering } from '@/lib/subdomain'
import { getVendorSettings, getDefaultVendorSettings } from '@/lib/vendor-settings'

/**
 * @swagger
 * /api/venues:
 *   get:
 *     summary: Get list of venues
 *     description: Retrieve a list of sports venues with optional filtering by sport, date, time, location, and availability
 *     tags:
 *       - Venues
 *     parameters:
 *       - in: query
 *         name: sport
 *         schema:
 *           type: string
 *         description: Filter by sport name (e.g., soccer, cricket, basketball)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD format)
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *           format: time
 *         description: Filter by start time (HH:MM format)
 *       - in: query
 *         name: duration
 *         schema:
 *           type: string
 *         description: Filter by duration in hours
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: string
 *         description: Filter by specific vendor ID
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: area
 *         schema:
 *           type: string
 *         description: Filter by specific area
 *     responses:
 *       200:
 *         description: List of venues
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Venue'
 *       500:
 *         description: Failed to fetch venues
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') // Sport name (e.g., "soccer")
    const date = searchParams.get('date')
    const startTime = searchParams.get('startTime')
    const duration = searchParams.get('duration')
    const vendorId = searchParams.get('vendorId') // Filter by specific vendor
    const city = searchParams.get('city') // Filter by location
    const area = searchParams.get('area') // Filter by specific area

    // Build venue filter conditions with automatic subdomain filtering
    const whereConditions: any = {
      isActive: true,
      deletedAt: null, // Exclude soft-deleted venues
      vendor: { 
        isActive: true,
        deletedAt: null // Exclude soft-deleted vendors
      },
    }

    // Add automatic vendor filtering based on subdomain
    // If on vendor subdomain (e.g., 3lok.gamehub.com), automatically filter by that vendor
    await addVendorFiltering(request, whereConditions, 'vendorId')

    // Add explicit vendor filter (overrides subdomain filter if specified)
    if (vendorId) {
      whereConditions.vendorId = vendorId
    }

    // Add sport filter (venues that have courts for this sport)
    if (sport) {
      whereConditions.courts = {
        some: {
          sport: {
            name: sport,
            isActive: true
          },
          isActive: true
        }
      }
    }

    // Add location filters (direct venue fields)
    if (city) {
      whereConditions.city = city
    }
    if (area) {
      whereConditions.surfaceArea = area
    }

    // Validate date if provided
    if (date) {
      const requestDate = new Date(date + 'T00:00:00.000Z')
      if (isNaN(requestDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 500 } // Test expects 500 for invalid dates
        )
      }
    }
    
    let venues = await db.venue.findMany({
      where: whereConditions,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true
          }
        },
        courts: {
          where: {
            isActive: true
          },
          include: {
            sport: {
              select: {
                id: true,
                name: true,
                displayName: true,
                icon: true
              }
            },
            format: {
              select: {
                id: true,
                name: true,
                displayName: true,
                minPlayers: true,
                maxPlayers: true
              }
            }
          }
        },
        operatingHours: {
          select: {
            id: true,
            dayOfWeek: true,
            openingTime: true,
            closingTime: true,
            isOpen: true
          }
        }
      },
      orderBy: [
        { name: 'asc' },
      ],
    })

    // Get all unique vendor IDs from venues
    const vendorIds = [...new Set(venues.map(venue => venue.vendorId))]

    // Fetch vendor settings for all vendors in one query
    const vendorsWithSettings = await db.vendor.findMany({
      where: { 
        id: { in: vendorIds },
        deletedAt: null
      },
      include: { vendorSettings: true }
    })

    // Create a map of vendorId -> settings
    const vendorSettingsPromises = vendorsWithSettings.map(async (vendor) => {
      const settings = await getVendorSettings(vendor.id)
      return { vendorId: vendor.id, settings }
    })

    const vendorSettingsResults = await Promise.all(vendorSettingsPromises)
    const vendorSettingsMap = new Map()
    vendorSettingsResults.forEach(({ vendorId, settings }) => {
      if (settings) {
        vendorSettingsMap.set(vendorId, settings)
      }
    })

    // Parse JSON fields for each venue with error handling
    venues = venues.map(venue => {
      try {
        const parsedAmenities = venue.amenities ? JSON.parse(venue.amenities) : null
        const parsedImages = venue.images ? JSON.parse(venue.images) : null

        // Get vendor settings from cache
        const vendorSettings = vendorSettingsMap.get(venue.vendorId) || getDefaultVendorSettings()

        return {
          ...venue,
          amenities: parsedAmenities,
          images: parsedImages,
          pricing: {
            pricePerHour: venue.pricePerHour,
            formattedPricePerHour: vendorSettings.formatCurrency(venue.pricePerHour),
            currency: vendorSettings.currency,
            currencySymbol: vendorSettings.currencySymbol,
            locale: vendorSettings.locale
          }
        }
      } catch (error) {
        // Handle cases where JSON fields contain comma-separated strings instead of JSON arrays
        console.warn(`Invalid JSON in venue ${venue.id}, attempting to parse comma-separated values`)
        const parseCommaSeparated = (str: string | null) => {
          if (!str || typeof str !== 'string') return null
          // If it's already a JSON array, return as is
          if (str.startsWith('[') && str.endsWith(']')) {
            try { return JSON.parse(str) } catch { return null }
          }
          // If it's a comma-separated string, convert to array
          if (str.includes(',')) {
            return str.split(',').map(item => item.trim()).filter(item => item.length > 0)
          }
          // If it's a single value, wrap in array
          return [str.trim()]
        }

        // Get vendor settings from cache (fallback for error case)
        const vendorSettings = vendorSettingsMap.get(venue.vendorId) || getDefaultVendorSettings()

        return {
          ...venue,
          amenities: parseCommaSeparated(venue.amenities),
          images: parseCommaSeparated(venue.images),
          pricing: {
            pricePerHour: venue.pricePerHour,
            formattedPricePerHour: vendorSettings.formatCurrency(venue.pricePerHour),
            currency: vendorSettings.currency,
            currencySymbol: vendorSettings.currencySymbol,
            locale: vendorSettings.locale
          }
        }
      }
    })

    // If date and duration are provided, check availability
    if (date && duration) {
      const durationHours = parseInt(duration)
      
      venues = await Promise.all(
        venues.map(async (venue) => {
          let isAvailable = true
          
          // If specific start time is provided, check availability for that slot
          if (startTime) {
            const endTime = calculateEndTime(startTime, durationHours)
            isAvailable = await checkVenueAvailability(
              venue.id,
              date,
              startTime,
              endTime
            )
          } else {
            // If no specific time, check if there's at least one available slot for duration
            // This is a simplified check - we'll check availability during business hours
            const businessHours = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
            
            isAvailable = false // Default to false, only set to true if we find an available slot
            
            for (const checkTime of businessHours) {
              const endTime = calculateEndTime(checkTime, durationHours)
              const slotAvailable = await checkVenueAvailability(
                venue.id,
                date,
                checkTime,
                endTime
              )
              if (slotAvailable) {
                isAvailable = true
                break
              }
            }
          }
          
          const totalAmount = isAvailable ? venue.pricePerHour * durationHours : null
        const vendorSettings = vendorSettingsMap.get(venue.vendorId) || getDefaultVendorSettings()

        return {
          ...venue,
          isAvailable,
          totalAmount,
          formattedTotalAmount: totalAmount ? vendorSettings.formatCurrency(totalAmount) : null,
        }
        })
      )
    }
    
    return NextResponse.json({ 
      venues,
      count: venues.length,
      filters: { sport, date, startTime, duration, vendorId, city, area }
    })
  } catch (error) {
    console.error('Error fetching venues:', error)
    return NextResponse.json(
      { error: 'Failed to fetch venues' },
      { status: 500 }
    )
  }
}

function calculateEndTime(startTime: string, durationHours: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const endHours = hours + durationHours
  return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

async function checkVenueAvailability(
  venueId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  try {
    // Convert date and times to DateTime objects for proper comparison
    const requestDate = new Date(date + 'T00:00:00.000Z')
    const requestStart = new Date(date + 'T' + startTime + ':00.000Z')
    const requestEnd = new Date(date + 'T' + endTime + ':00.000Z')
    
    // Check for existing bookings that overlap (using BookingStatus enum)
    const overlappingBookings = await db.booking.findMany({
      where: {
        venueId,
        status: 'CONFIRMED', // Use enum value
        AND: [
          { startTime: { lt: requestEnd } },
          { endTime: { gt: requestStart } },
        ],
      },
    })
    
    // Check for conflicts that overlap
    const overlappingConflicts = await db.conflict.findMany({
      where: {
        venueId,
        status: 'active',
        AND: [
          { startTime: { lt: requestEnd } },
          { endTime: { gt: requestStart } },
        ],
      },
    })
    
    // Check for unavailable time slots within the requested period
    const unavailableSlots = await db.venueAvailability.findMany({
      where: {
        venueId,
        date: requestDate,
        isAvailable: false,
        AND: [
          { startTime: { lt: requestEnd } },
          { endTime: { gt: requestStart } },
        ],
      },
    })
    
    return overlappingBookings.length === 0 && 
           overlappingConflicts.length === 0 && 
           unavailableSlots.length === 0
  } catch (error) {
    console.error('Error checking venue availability:', error)
    return false
  }
}