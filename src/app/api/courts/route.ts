import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { addVendorFiltering } from '@/lib/subdomain'
import { withPerformanceTracking } from '@/lib/middleware/performance'

/**
 * @swagger
 * /api/courts:
 *   get:
 *     summary: Get list of courts
 *     description: Retrieve a list of sports courts with optional filtering by venue, sport, date, time, and availability
 *     tags:
 *       - Courts
 *     parameters:
 *       - in: query
 *         name: venueId
 *         schema:
 *           type: string
 *         description: Filter by venue ID
 *       - in: query
 *         name: sportId
 *         schema:
 *           type: string
 *         description: Filter by sport ID
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
 *         name: endTime
 *         schema:
 *           type: string
 *           format: time
 *         description: Filter by end time (HH:MM format) - used with time range selection
 *       - in: query
 *         name: duration
 *         schema:
 *           type: string
 *         description: Filter by duration in hours
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country code (e.g., US, IN, GB)
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: Only return courts available for the specified date/time
 *     responses:
 *       200:
 *         description: List of courts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 courts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Court'
 *       500:
 *         description: Failed to fetch courts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// GET /api/courts - List courts with filtering
export const GET = withPerformanceTracking(async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const venueId = searchParams.get('venueId')
    const vendorId = searchParams.get('vendorId')
    const sportId = searchParams.get('sportId')
    const sport = searchParams.get('sport') // Sport name (e.g., "soccer")
    const format = searchParams.get('format') // Format ID
    const date = searchParams.get('date')
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')
    const duration = searchParams.get('duration')
    const city = searchParams.get('city')
    const area = searchParams.get('area')
    const country = searchParams.get('country')
    const available = searchParams.get('available') === 'true'
    
    // Add pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    // Build court filter conditions with automatic subdomain filtering
    const whereConditions: any = {
      isActive: true,
      venue: { isActive: true }, // Only include active venues
    }

    // Add automatic vendor filtering based on subdomain
    await addVendorFiltering(request, whereConditions, 'venue.vendorId')

    // Add vendor filter (explicit vendorId parameter)
    if (vendorId) {
      whereConditions.venue = {
        ...whereConditions.venue,
        vendorId: vendorId
      }
    }

    // Add venue filter
    if (venueId) {
      whereConditions.venueId = venueId
    }

    // Add sport filter (by ID or name)
    if (sportId) {
      whereConditions.sportId = sportId
    } else if (sport) {
      whereConditions.sport = {
        name: sport,
        isActive: true
      }
    }

    // Add format filter - filter by supportedFormats
    if (format) {
      whereConditions.supportedFormats = {
        some: {
          formatId: format,
          isActive: true
        }
      }
    }

    // Add city filter (through venue)
    if (city) {
      whereConditions.venue = {
        ...whereConditions.venue,
        city
      }
    }

    // Add area filter - we'll use venue address for area filtering
    if (area) {
      whereConditions.venue = {
        ...whereConditions.venue,
        address: {
          contains: area
        }
      }
    }

    // Add country filter (through venue)
    if (country) {
      whereConditions.venue = {
        ...whereConditions.venue,
        countryCode: country
      }
    }

    // Validate date if provided
    let requestDate: Date | null = null
    if (date) {
      requestDate = new Date(date + 'T00:00:00.000Z')
      if (isNaN(requestDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        )
      }
    }

    // Optimized: Use select instead of include, add pagination
    const [courts, totalCount] = await Promise.all([
      db.court.findMany({
        where: whereConditions,
        select: {
          id: true,
          venueId: true,
          sportId: true,
          courtNumber: true,
          name: true,
          description: true,
          surface: true,
          pricePerHour: true,
          features: true,
          maxPlayers: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          venue: {
            select: {
              id: true,
              name: true,
              description: true,
              address: true,
              city: true,
              postalCode: true,
              featuredImage: true,
              countryCode: true,
              currencyCode: true,
              timezone: true,
              vendor: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logoUrl: true,
                  primaryColor: true,
                  secondaryColor: true,
                  timezone: true
                }
              }
            }
          },
          sport: {
            select: {
              id: true,
              name: true,
              displayName: true,
              icon: true
            }
          },
          supportedFormats: {
            where: {
              isActive: true
            },
            select: {
              id: true,
              formatId: true,
              maxSlots: true,
              format: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                  playersPerTeam: true,
                  maxTotalPlayers: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: [
          { venue: { name: 'asc' } },
          { courtNumber: 'asc' },
        ],
      }),
      db.court.count({ where: whereConditions })
    ])

    // Parse JSON fields for each court
    const parsedCourts = courts.map(court => {
      try {
        return {
          ...court,
          features: court.features ? JSON.parse(court.features) : []
        }
      } catch (error) {
        console.warn(`Invalid JSON in court ${court.id} features field`)
        return {
          ...court,
          features: []
        }
      }
    })

    
    // If date and duration are provided, check availability
    let courtsWithAvailability: typeof parsedCourts | undefined
    if (date && duration && available) {
      const durationHours = parseInt(duration)

      courtsWithAvailability = await Promise.all(
        parsedCourts.map(async (court) => {
          // If specific start time is provided (with or without end time)
          if (startTime) {
            const availableSlots = []

            // If end time is provided, generate slots within the time range
            if (endTime) {
              const [startHour] = startTime.split(':').map(Number)
              const [endHour] = endTime.split(':').map(Number)

              // Generate individual slots within the time range
              for (let hour = startHour; hour < endHour; hour++) {
                const slotStartTime = `${hour.toString().padStart(2, '0')}:00`
                const slotEndTime = calculateEndTime(slotStartTime, durationHours)

                // Only include slots that end before or at the specified end time
                if (parseInt(slotEndTime.split(':')[0]) <= endHour ||
                    (parseInt(slotEndTime.split(':')[0]) === endHour && slotEndTime.split(':')[1] === '00')) {
                  const slotAvailable = await checkCourtAvailability(
                    court.id,
                    date,
                    slotStartTime,
                    slotEndTime
                  )
                  if (slotAvailable) {
                    availableSlots.push({
                      startTime: slotStartTime,
                      endTime: slotEndTime
                    })
                  }
                }
              }
            } else {
              // Optimized: Use vendor timezone from already-loaded court data
              const vendorTimezone = court.venue?.vendor?.timezone || court.venue?.timezone
              const businessHours = generateBusinessHoursSlots(durationHours, requestDate, vendorTimezone)

              // Filter slots to only include those from start time onwards
              const eligibleSlots = businessHours.filter(slot => slot >= startTime)

              for (const startSlot of eligibleSlots) {
                const endSlot = calculateEndTime(startSlot, durationHours)
                const slotAvailable = await checkCourtAvailability(
                  court.id,
                  date,
                  startSlot,
                  endSlot
                )
                if (slotAvailable) {
                  availableSlots.push({
                    startTime: startSlot,
                    endTime: endSlot
                  })
                }
              }
            }

            return {
              ...court,
              isAvailable: availableSlots.length > 0,
              availableSlots
            }
          } else {
            // Optimized: Use vendor timezone from already-loaded court data
            const vendorTimezone = court.venue?.vendor?.timezone || court.venue?.timezone
            const businessHours = generateBusinessHoursSlots(durationHours, requestDate, vendorTimezone)

            const availableSlots = []

            for (const startSlot of businessHours) {
              const endSlot = calculateEndTime(startSlot, durationHours)
              const slotAvailable = await checkCourtAvailability(
                court.id,
                date,
                startSlot,
                endSlot
              )
              if (slotAvailable) {
                availableSlots.push({
                  startTime: startSlot,
                  endTime: endSlot
                })
              }
            }

            return {
              ...court,
              isAvailable: availableSlots.length > 0,
              availableSlots
            }
          }
        })
      )
    }

    // Determine which courts data to return
    const finalCourts = courtsWithAvailability || parsedCourts

    return NextResponse.json({
      courts: finalCourts,
      filters: { venueId, sportId, sport, date, startTime, duration, city, country, available },
      count: finalCourts.length,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPreviousPage: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching courts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courts' },
      { status: 500 }
    )
  }
}, 'GET /api/courts')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      venueId,
      sportId,
      formatConfigs, // Array of { formatId, maxSlots }
      courtNumber,
      name,
      description,
      pricePerHour,
      features,
      length,
      width,
      maxPlayers,
      isActive = true,
    } = body

    // Validate required fields
    if (!venueId || !sportId || !pricePerHour) {
      return NextResponse.json(
        { error: 'Missing required fields: venueId, sportId, pricePerHour' },
        { status: 400 }
      )
    }

    // Validate formatConfigs
    if (!formatConfigs || !Array.isArray(formatConfigs) || formatConfigs.length === 0) {
      return NextResponse.json(
        { error: 'At least one format must be selected' },
        { status: 400 }
      )
    }

    if (formatConfigs.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 formats allowed per court' },
        { status: 400 }
      )
    }

    // Get the next court number if not provided
    const nextCourtNumber = courtNumber || await getNextCourtNumber(venueId, sportId)

    // Check if court number already exists for this venue
    const existingCourt = await db.court.findFirst({
      where: {
        venueId,
        courtNumber: nextCourtNumber
      }
    })

    if (existingCourt) {
      return NextResponse.json(
        { error: 'Court number already exists for this venue' },
        { status: 409 }
      )
    }

    // Create court
    const court = await db.court.create({
      data: {
        venueId,
        sportId,
        courtNumber: nextCourtNumber,
        name: name || `Court ${nextCourtNumber}`,
        description,
        pricePerHour,
        features: features ? JSON.stringify(features) : null,
        length: length ? parseFloat(length) : null,
        width: width ? parseFloat(width) : null,
        maxPlayers: maxPlayers || 10,
        isActive,
        supportedFormats: {
          create: formatConfigs.map((config: { formatId: string; maxSlots: number }) => ({
            formatId: config.formatId,
            maxSlots: config.maxSlots || 1,
            isActive: true
          }))
        }
      },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            currencyCode: true,
            timezone: true,
            vendor: {
              select: {
                id: true,
                name: true,
                slug: true,
                timezone: true
              }
            }
          }
        },
        sport: {
          select: {
            id: true,
            name: true,
            displayName: true,
            icon: true
          }
        },
        supportedFormats: {
          include: {
            format: {
              select: {
                id: true,
                name: true,
                displayName: true,
                playersPerTeam: true,
                maxTotalPlayers: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: court })
  } catch (error) {
    console.error('Error creating court:', error)
    return NextResponse.json(
      { error: 'Failed to create court' },
      { status: 500 }
    )
  }
}

// Helper functions
function calculateEndTime(startTime: string, durationHours: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + (durationHours * 60)
  const endHours = Math.floor(totalMinutes / 60)
  const endMinutes = totalMinutes % 60
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
}

async function checkCourtAvailability(
  courtId: string,
  date: string,
  startTime: string,
  endTime: string,
  formatId?: string
): Promise<boolean> {
  try {
    // Convert to DateTime objects
    const startDateTime = new Date(`${date}T${startTime}:00.000Z`)
    const endDateTime = new Date(`${date}T${endTime}:00.000Z`)

    // If formatId is provided, check format-specific availability
    if (formatId) {
      // Get court with supported formats
      const court = await db.court.findUnique({
        where: { id: courtId },
        include: {
          supportedFormats: {
            where: {
              formatId,
              isActive: true,
            },
          },
        },
      })

      if (!court || court.supportedFormats.length === 0) {
        return false // Format not supported
      }

      const courtFormat = court.supportedFormats[0]
      
      // Count existing bookings for this format at the overlapping time
      const overlappingBookings = await db.booking.findMany({
        where: {
          courtId,
          formatId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          AND: [
            { startTime: { lt: endDateTime } },
            { endTime: { gt: startDateTime } },
          ],
        },
      })

      // Check if we've reached the max slots for this format
      return overlappingBookings.length < courtFormat.maxSlots
    }

    // If no format specified, check for any overlapping bookings (backward compatibility)
    const overlappingBookings = await db.booking.findMany({
      where: {
        courtId,
        status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
        AND: [
          { startTime: { lt: endDateTime } },
          { endTime: { gt: startDateTime } },
        ],
      },
    })

    // Check for existing matches
    const overlappingMatches = await db.match.findMany({
      where: {
        courtId,
        status: { in: ['OPEN', 'CONFIRMED'] },
        scheduledDate: {
          lt: endDateTime,
          gte: startDateTime
        }
      },
    })

    return overlappingBookings.length === 0 && overlappingMatches.length === 0
  } catch (error) {
    console.error('Error checking court availability:', error)
    return false
  }
}

async function getNextCourtNumber(venueId: string, sportId?: string): Promise<string> {
  // Get sport info for naming
  let sportName = 'Court'
  if (sportId) {
    const sport = await db.sport.findUnique({
      where: { id: sportId },
      select: { name: true }
    })
    sportName = sport?.name || 'Court'
  }

  // Find all courts for this venue (or just this sport if sportId provided)
  const whereClause: any = { venueId }
  if (sportId) {
    whereClause.sportId = sportId
  }

  const existingCourts = await db.court.findMany({
    where: whereClause,
    select: { courtNumber: true },
    orderBy: { courtNumber: 'asc' }
  })

  // Extract numbers from existing court numbers
  const courtNumbers = existingCourts
    .map(court => {
      // Extract the last number from strings like "Court 1", "Football Turf 2", etc.
      const match = court.courtNumber.match(/(\d+)$/)
      return match ? parseInt(match[1]) : 0
    })
    .filter(num => num > 0)

  // Find the next available number
  let nextNumber = 1
  if (courtNumbers.length > 0) {
    const maxNumber = Math.max(...courtNumbers)
    nextNumber = maxNumber + 1
  }

  // Generate sport-specific court number
  let courtNumber: string
  switch (sportName.toLowerCase()) {
    case 'football':
    case 'soccer':
      courtNumber = `Football Turf ${nextNumber}`
      break
    case 'basketball':
      courtNumber = `Basketball Court ${nextNumber}`
      break
    case 'tennis':
      courtNumber = `Tennis Court ${nextNumber}`
      break
    case 'badminton':
      courtNumber = `Badminton Court ${nextNumber}`
      break
    case 'cricket':
      courtNumber = `Cricket Pitch ${nextNumber}`
      break
    case 'swimming':
      courtNumber = `Swimming Lane ${nextNumber}`
      break
    case 'volleyball':
      courtNumber = `Volleyball Court ${nextNumber}`
      break
    default:
      courtNumber = `${sportName} Court ${nextNumber}`
  }

  return courtNumber
}

function generateBusinessHoursSlots(durationHours: number, requestDate?: Date, vendorTimezone?: string): string[] {
  // Sports facilities typical business hours: 6:00 AM - 10:00 PM
  const businessStartHour = 6
  const businessEndHour = 22
  const slots: string[] = []

  // Get current time in vendor timezone or local timezone
  let currentHour: number
  let currentMinute: number
  let isToday: boolean

  if (vendorTimezone) {
    try {
      const now = new Date()

      // Get current time components in vendor timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: vendorTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })

      const parts = formatter.formatToParts(now)
      const values: any = {}
      parts.forEach(part => {
        values[part.type] = part.value
      })

      currentHour = parseInt(values.hour, 10)
      currentMinute = parseInt(values.minute, 10)

      // Check if request date is today in vendor timezone
      const vendorDateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: vendorTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })

      const vendorDateString = vendorDateFormatter.format(now)
      const requestDateString = requestDate ? vendorDateFormatter.format(requestDate) : vendorDateString
      isToday = vendorDateString === requestDateString

      console.log('API: Using vendor timezone', vendorTimezone, 'current time:', currentHour + ':' + currentMinute.toString().padStart(2, '0'))
    } catch (error) {
      console.warn('API: Failed to use vendor timezone, falling back to local time:', error)
      // Fallback to local time
      const now = new Date()
      currentHour = now.getHours()
      currentMinute = now.getMinutes()
      isToday = requestDate && now.toDateString() === requestDate.toDateString()
    }
  } else {
    // Use local time if no vendor timezone provided
    const now = new Date()
    currentHour = now.getHours()
    currentMinute = now.getMinutes()
    isToday = requestDate && now.toDateString() === requestDate.toDateString()
  }

  // For any duration, generate hourly slots (06:00, 07:00, 08:00, etc.)
  // The duration affects how long each slot is, not when it starts
  for (let hour = businessStartHour; hour <= businessEndHour; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`

    const endDateTime = new Date()
    endDateTime.setHours(hour + durationHours, 0, 0, 0)

    // Only include slots that end before business closing time
    // For example: 3-hour booking must end by 22:00, so latest start is 19:00
    if (hour + durationHours <= businessEndHour) {
      // If it's today and the time has passed, skip this slot
      if (isToday) {
        // Skip slots that are in the past or very close to current time
        if (hour < currentHour ||
            (hour === currentHour && currentMinute >= 30)) {
          continue // Skip past slots
        }
      }

      slots.push(startTime)
    }
  }

  return slots
}