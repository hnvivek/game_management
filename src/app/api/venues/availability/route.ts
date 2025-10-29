import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getVendorSettings } from '@/lib/vendor-settings'

interface OperatingHours {
  open: string
  close: string
  closed: boolean
  periods?: Array<{ open: string; close: string }> // For multiple operating periods per day
}

interface VendorOperatingHours {
  [day: string]: OperatingHours
}

interface SpecialDateOverride {
  date: string // "2024-12-25"
  open?: string
  close?: string
  closed?: boolean
  reason?: string // "Christmas Holiday", "Maintenance", "Private Event"
}

interface SeasonalHours {
  season: string // "summer", "winter", "monsoon", "holidays"
  startDate: string // "2024-05-01"
  endDate: string // "2024-07-31"
  hours: VendorOperatingHours
}

interface EnhancedOperatingHours {
  regular: VendorOperatingHours
  seasonal?: SeasonalHours[]
  specialDates?: SpecialDateOverride[]
  timezone?: string // "Asia/Kolkata", "UTC"
  bookingRules?: {
    minBookingDuration?: number // Minimum hours
    maxBookingDuration?: number // Maximum hours
    bufferTime?: number // Minutes between bookings
    advanceBookingLimit?: number // Days in advance
  }
}

function getVendorOperatingHours(location: any, targetDate: Date): { openHour: number; closeHour: number; periods?: Array<{ openHour: number; closeHour: number }>; isSpecial?: boolean; reason?: string } | null {
  if (!location?.operatingHours) {
    return null
  }

  const operatingHours = location.operatingHours
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dateStr = targetDate.toISOString().split('T')[0] // "2024-12-25"
  const dayName = daysOfWeek[targetDate.getDay()]

  // Handle simple format (current test data): {"monday": {"open": "09:00", "close": "21:00", "closed": false}}
  if (!operatingHours.regular && !operatingHours.specialDates && !operatingHours.seasonal) {
    const simpleHours = operatingHours[dayName]
    if (!simpleHours || simpleHours.closed) {
      return null
    }
    const openHour = parseInt(simpleHours.open.split(':')[0])
    const closeHour = parseInt(simpleHours.close.split(':')[0])

    // Handle multiple operating periods per day for simple format
    if (simpleHours.periods && simpleHours.periods.length > 0) {
      const periods = simpleHours.periods.map(period => ({
        openHour: parseInt(period.open.split(':')[0]),
        closeHour: parseInt(period.close.split(':')[0])
      }))
      return { openHour, closeHour, periods }
    }

    return { openHour, closeHour }
  }

  // Handle enhanced format
  // Check for special date overrides first
  if (operatingHours.specialDates) {
    const specialOverride = operatingHours.specialDates.find(special => special.date === dateStr)
    if (specialOverride) {
      if (specialOverride.closed) {
        return { openHour: 0, closeHour: 0, isSpecial: true, reason: specialOverride.reason || 'Special closure' }
      }
      if (specialOverride.open && specialOverride.close) {
        const openHour = parseInt(specialOverride.open.split(':')[0])
        const closeHour = parseInt(specialOverride.close.split(':')[0])
        return { openHour, closeHour, isSpecial: true, reason: specialOverride.reason || 'Special hours' }
      }
    }
  }

  // Check for seasonal hours
  if (operatingHours.seasonal) {
    const activeSeason = operatingHours.seasonal.find(season =>
      dateStr >= season.startDate && dateStr <= season.endDate
    )
    if (activeSeason) {
      const seasonHours = activeSeason.hours[dayName]
      if (!seasonHours || seasonHours.closed) {
        return null
      }
      const openHour = parseInt(seasonHours.open.split(':')[0])
      const closeHour = parseInt(seasonHours.close.split(':')[0])

      // Handle multiple operating periods per day
      if (seasonHours.periods && seasonHours.periods.length > 0) {
        const periods = seasonHours.periods.map(period => ({
          openHour: parseInt(period.open.split(':')[0]),
          closeHour: parseInt(period.close.split(':')[0])
        }))
        return { openHour, closeHour, periods, isSpecial: true, reason: `${activeSeason.season} hours` }
      }

      return { openHour, closeHour, isSpecial: true, reason: `${activeSeason.season} hours` }
    }
  }

  // Use regular hours
  const regularHours = operatingHours.regular ? operatingHours.regular[dayName] : operatingHours[dayName]
  if (!regularHours || regularHours.closed) {
    return null
  }

  const openHour = parseInt(regularHours.open.split(':')[0])
  const closeHour = parseInt(regularHours.close.split(':')[0])

  // Handle multiple operating periods per day
  if (regularHours.periods && regularHours.periods.length > 0) {
    const periods = regularHours.periods.map(period => ({
      openHour: parseInt(period.open.split(':')[0]),
      closeHour: parseInt(period.close.split(':')[0])
    }))
    return { openHour, closeHour, periods }
  }

  return { openHour, closeHour }
}

function getBookingRules(location: any): { minDuration?: number; maxDuration?: number; bufferTime?: number; advanceLimit?: number } | null {
  if (!location?.operatingHours || !location.operatingHours.bookingRules) {
    return null
  }

  return location.operatingHours.bookingRules || null
}

function isWithinOperatingHours(hour: number, vendorHours: { openHour: number; closeHour: number } | null): boolean {
  if (!vendorHours) {
    // Default to 6 AM - 11 PM if no vendor hours specified
    return hour >= 6 && hour < 23
  }
  return hour >= vendorHours.openHour && hour < vendorHours.closeHour
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const venueId = searchParams.get('venueId') // Updated from turfId
    const date = searchParams.get('date')
    const duration = parseInt(searchParams.get('duration') || '1') // Default to 1 hour

    if (!venueId || !date) {
      return NextResponse.json(
        { error: 'venueId and date are required' },
        { status: 400 }
      )
    }

    // Convert date string to Date object first
    const targetDate = new Date(date + 'T00:00:00.000Z')

    // Validate date
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Get venue information for vendor operating hours
    const venue = await db.venue.findUnique({
      where: { id: venueId },
      include: {
        vendor: {
          include: {
            settings: true
          }
        },
        location: true
      }
    })

    // If venue doesn't exist, return empty slots gracefully
    if (!venue) {
      return NextResponse.json({
        timeSlots: [],
        operatingHours: {
          open: '06:00',
          close: '23:00',
          isCustom: false
        }
      })
    }

    // Get vendor settings
    const vendorSettings = await getVendorSettings(venue.vendorId)

    // Get vendor operating hours for the specific date
    const vendorHours = getVendorOperatingHours(venue.location, targetDate)

    // Get booking rules for this venue
    const bookingRules = getBookingRules(venue.location)

    // Handle zero or negative duration gracefully - return empty slots
    if (duration <= 0) {
      return NextResponse.json({
        timeSlots: [],
        operatingHours: vendorHours ? {
          open: `${vendorHours.openHour}:00`,
          close: `${vendorHours.closeHour}:00`,
          isCustom: true,
          isSpecial: vendorHours.isSpecial,
          reason: vendorHours.reason
        } : {
          open: '06:00',
          close: '23:00',
          isCustom: false
        },
        bookingRules
      })
    }

    // Validate duration against booking rules
    if (bookingRules) {
      if (bookingRules.minDuration && duration < bookingRules.minDuration) {
        return NextResponse.json(
          { error: `Minimum booking duration is ${bookingRules.minDuration} hours` },
          { status: 400 }
        )
      }
      if (bookingRules.maxDuration && duration > bookingRules.maxDuration) {
        return NextResponse.json(
          { error: `Maximum booking duration is ${bookingRules.maxDuration} hours` },
          { status: 400 }
        )
      }
    }

    // Validate duration against vendor operating hours
    if (vendorHours && vendorHours.openHour !== vendorHours.closeHour && duration > (vendorHours.closeHour - vendorHours.openHour)) {
      return NextResponse.json(
        { error: `Duration exceeds vendor operating hours (${vendorHours.openHour}:00 - ${vendorHours.closeHour}:00)` },
        { status: 400 }
      )
    }

    // General duration validation (fallback for vendors without specific hours)
    if (!vendorHours && duration > 8) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 8 hours' },
        { status: 400 }
      )
    }

        
    // Get all available slots for the venue on the given date
    const availabilities = await db.venueAvailability.findMany({
      where: {
        venueId,
        date: targetDate,
        isAvailable: true,
      },
      orderBy: { startTime: 'asc' },
      include: {
        venue: {
          include: {
            sport: true,
            format: true,
            vendor: {
              include: {
                settings: true
              }
            },
            location: true
          }
        },
      },
    })
    
    // Get existing bookings to mark unavailable slots (using enum)
    const bookings = await db.booking.findMany({
      where: {
        venueId,
        status: 'CONFIRMED', // Use BookingStatus enum
        startTime: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) // Next day
        }
      },
      orderBy: { startTime: 'asc' },
    })
    
    // Get conflicts
    const conflicts = await db.conflict.findMany({
      where: {
        venueId,
        status: 'active',
        startTime: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) // Next day
        }
      },
      orderBy: { startTime: 'asc' },
    })
    
    // Generate time slots based on vendor operating hours
    const timeSlots = []

    // Handle special closures (like holidays)
    if (vendorHours && vendorHours.openHour === vendorHours.closeHour && vendorHours.isSpecial) {
      // Venue is closed for special reason
      return NextResponse.json({
        timeSlots: [],
        operatingHours: {
          open: '00:00',
          close: '00:00',
          isCustom: true,
          isSpecial: true,
          reason: vendorHours.reason || 'Closed'
        },
        bookingRules
      })
    }

    // Determine operating hours for slot generation
    let operatingPeriods: Array<{ startHour: number; endHour: number }>

    if (vendorHours?.periods && vendorHours.periods.length > 0) {
      // Multiple operating periods in a day (e.g., morning and evening)
      operatingPeriods = vendorHours.periods.map(period => ({
        startHour: period.openHour,
        endHour: period.closeHour
      }))
    } else if (vendorHours) {
      // Single operating period
      operatingPeriods = [{
        startHour: vendorHours.openHour,
        endHour: vendorHours.closeHour
      }]
    } else {
      // Default hours
      operatingPeriods = [{
        startHour: 6,
        endHour: 23
      }]
    }

    // Generate slots for each operating period
    for (const period of operatingPeriods) {
      for (let hour = period.startHour; hour <= period.endHour - duration; hour++) {
      const startTimeStr = `${hour.toString().padStart(2, '0')}:00`
      const endHourSlot = hour + duration
      const endTimeStr = `${endHourSlot.toString().padStart(2, '0')}:00`

      // Create DateTime objects for this slot
      const slotStart = new Date(date + 'T' + startTimeStr + ':00.000Z')
      const slotEnd = new Date(date + 'T' + endTimeStr + ':00.000Z')
      
      // Check if slot is explicitly marked as available in system
      let isAvailableInSystem = true
      if (availabilities.length > 0) {
        isAvailableInSystem = availabilities.some(
          (avail) => {
            const availStart = new Date(avail.startTime)
            return availStart.getHours() === hour && avail.isAvailable
          }
        )
      }
      
      // Check if slot has overlapping booking using DateTime comparison
      const hasBooking = bookings.some(
        (booking) => {
          // Two time ranges overlap if: start1 < end2 AND start2 < end1
          return booking.startTime < slotEnd && booking.endTime > slotStart
        }
      )
      
      // Check if slot has overlapping conflict using DateTime comparison
      const hasConflict = conflicts.some(
        (conflict) => {
          // Two time ranges overlap if: start1 < end2 AND start2 < end1
          return conflict.startTime < slotEnd && conflict.endTime > slotStart
        }
      )
      
      const isAvailable = isAvailableInSystem && !hasBooking && !hasConflict
      
      timeSlots.push({
        startTime: startTimeStr,
        endTime: endTimeStr,
        isAvailable,
        hasBooking,
        hasConflict,
        booking: hasBooking 
          ? bookings.find((b) => 
              b.startTime < slotEnd && b.endTime > slotStart
            )
          : null,
        conflict: hasConflict
          ? conflicts.find((c) => 
              c.startTime < slotEnd && c.endTime > slotStart
            )
          : null,
          })
      }
    }

    // Sort slots by time
    timeSlots.sort((a, b) => a.startTime.localeCompare(b.startTime))

    return NextResponse.json({
      timeSlots,
      operatingHours: vendorHours ? {
        open: `${vendorHours.openHour}:00`,
        close: `${vendorHours.closeHour}:00`,
        isCustom: true,
        isSpecial: vendorHours.isSpecial,
        reason: vendorHours.reason,
        periods: vendorHours.periods?.map(p => ({
          open: `${p.openHour}:00`,
          close: `${p.closeHour}:00`
        }))
      } : {
        open: '06:00',
        close: '23:00',
        isCustom: false
      },
      bookingRules,
      pricing: vendorSettings ? {
        currency: vendorSettings.currency,
        currencySymbol: vendorSettings.currencySymbol,
        locale: vendorSettings.locale,
        pricePerHour: venue.pricePerHour,
        formattedPricePerHour: vendorSettings.formatCurrency(venue.pricePerHour)
      } : null
    })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}