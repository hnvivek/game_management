import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/vendor-settings - Get vendor settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')

    if (!vendorId) {
      return NextResponse.json({ error: 'vendorId is required' }, { status: 400 })
    }

    // Check if vendor exists
    const vendor = await db.vendor.findUnique({
      where: { id: vendorId }
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Get vendor settings
    let settings = await db.vendorSettings.findUnique({
      where: { vendorId }
    })

    // If no settings exist, create default settings
    if (!settings) {
      settings = await db.vendorSettings.create({
        data: {
          vendorId,
          advanceBookingDays: 30,
          cancellationPolicy: 'Full refund if cancelled 24 hours before booking',
          paymentMethods: JSON.stringify(['cash', 'card', 'upi']),
          bookingTimeSlots: 60,
          maxConcurrentBookings: 1,
          basePrice: 1000,
          peakHourPrice: 1500,
          weekendPrice: 1200,
          currency: 'INR',
          showBookingCalendar: true,
          showPricingPublicly: true,
          allowOnlinePayments: true,
          showContactInfo: true,
          emailNotifications: true,
          smsNotifications: false,
          bookingReminders: true,
          newBookingAlerts: true,
          cancellationAlerts: true,
          paymentAlerts: true,
          autoApproval: true,
          requiresDeposit: false,
          depositPercentage: 25,
          availableAmenities: JSON.stringify(['parking', 'changing_rooms', 'floodlights']),
          venueImages: JSON.stringify([]),
          sportTypes: JSON.stringify([])
        }
      })
    }

    // Parse JSON fields for response
    const responseSettings = {
      ...settings,
      paymentMethods: JSON.parse(settings.paymentMethods || '[]'),
      availableAmenities: JSON.parse(settings.availableAmenities || '[]'),
      venueImages: JSON.parse(settings.venueImages || '[]'),
      sportTypes: JSON.parse(settings.sportTypes || '[]')
    }

    return NextResponse.json({ settings: responseSettings })
  } catch (error) {
    console.error('Error fetching vendor settings:', error)
    return NextResponse.json({ error: 'Failed to fetch vendor settings' }, { status: 500 })
  }
}

// PUT /api/vendor-settings - Update vendor settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      vendorId,
      advanceBookingDays,
      cancellationPolicy,
      paymentMethods,
      bookingTimeSlots,
      maxConcurrentBookings,
      basePrice,
      peakHourPrice,
      weekendPrice,
      currency,
      showBookingCalendar,
      showPricingPublicly,
      allowOnlinePayments,
      showContactInfo,
      emailNotifications,
      smsNotifications,
      bookingReminders,
      newBookingAlerts,
      cancellationAlerts,
      paymentAlerts,
      autoApproval,
      requiresDeposit,
      depositPercentage,
      availableAmenities,
      venueImages,
      sportTypes
    } = body

    // Validate required fields
    if (!vendorId) {
      return NextResponse.json({ error: 'vendorId is required' }, { status: 400 })
    }

    // For updates, require at least one field to update
    const hasValidFields = [
      advanceBookingDays, cancellationPolicy, paymentMethods, bookingTimeSlots,
      maxConcurrentBookings, basePrice, peakHourPrice, weekendPrice, currency,
      showBookingCalendar, showPricingPublicly, allowOnlinePayments, showContactInfo,
      emailNotifications, smsNotifications, bookingReminders, newBookingAlerts,
      cancellationAlerts, paymentAlerts, autoApproval, requiresDeposit, depositPercentage,
      availableAmenities, venueImages, sportTypes
    ].some(field => field !== undefined)

    if (!hasValidFields) {
      return NextResponse.json({ error: 'At least one field to update is required' }, { status: 400 })
    }

    // Check if vendor exists
    const vendor = await db.vendor.findUnique({
      where: { id: vendorId }
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Validate numeric fields
    if (advanceBookingDays !== undefined && (advanceBookingDays < 1 || advanceBookingDays > 365)) {
      return NextResponse.json({ error: 'advanceBookingDays must be between 1 and 365' }, { status: 400 })
    }

    if (bookingTimeSlots !== undefined && (bookingTimeSlots < 15 || bookingTimeSlots > 480)) {
      return NextResponse.json({ error: 'bookingTimeSlots must be between 15 and 480 minutes' }, { status: 400 })
    }

    if (maxConcurrentBookings !== undefined && maxConcurrentBookings < 1) {
      return NextResponse.json({ error: 'maxConcurrentBookings must be at least 1' }, { status: 400 })
    }

    if (basePrice !== undefined && basePrice < 0) {
      return NextResponse.json({ error: 'basePrice cannot be negative' }, { status: 400 })
    }

    if (peakHourPrice !== undefined && peakHourPrice < 0) {
      return NextResponse.json({ error: 'peakHourPrice cannot be negative' }, { status: 400 })
    }

    if (weekendPrice !== undefined && weekendPrice < 0) {
      return NextResponse.json({ error: 'weekendPrice cannot be negative' }, { status: 400 })
    }

    if (depositPercentage !== undefined && (depositPercentage < 0 || depositPercentage > 100)) {
      return NextResponse.json({ error: 'depositPercentage must be between 0 and 100' }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = { vendorId }

    if (advanceBookingDays !== undefined) updateData.advanceBookingDays = advanceBookingDays
    if (cancellationPolicy !== undefined) updateData.cancellationPolicy = cancellationPolicy
    if (paymentMethods !== undefined) updateData.paymentMethods = JSON.stringify(paymentMethods)
    if (bookingTimeSlots !== undefined) updateData.bookingTimeSlots = bookingTimeSlots
    if (maxConcurrentBookings !== undefined) updateData.maxConcurrentBookings = maxConcurrentBookings
    if (basePrice !== undefined) updateData.basePrice = basePrice
    if (peakHourPrice !== undefined) updateData.peakHourPrice = peakHourPrice
    if (weekendPrice !== undefined) updateData.weekendPrice = weekendPrice
    if (currency !== undefined) updateData.currency = currency
    if (showBookingCalendar !== undefined) updateData.showBookingCalendar = showBookingCalendar
    if (showPricingPublicly !== undefined) updateData.showPricingPublicly = showPricingPublicly
    if (allowOnlinePayments !== undefined) updateData.allowOnlinePayments = allowOnlinePayments
    if (showContactInfo !== undefined) updateData.showContactInfo = showContactInfo
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications
    if (smsNotifications !== undefined) updateData.smsNotifications = smsNotifications
    if (bookingReminders !== undefined) updateData.bookingReminders = bookingReminders
    if (newBookingAlerts !== undefined) updateData.newBookingAlerts = newBookingAlerts
    if (cancellationAlerts !== undefined) updateData.cancellationAlerts = cancellationAlerts
    if (paymentAlerts !== undefined) updateData.paymentAlerts = paymentAlerts
    if (autoApproval !== undefined) updateData.autoApproval = autoApproval
    if (requiresDeposit !== undefined) updateData.requiresDeposit = requiresDeposit
    if (depositPercentage !== undefined) updateData.depositPercentage = depositPercentage
    if (availableAmenities !== undefined) updateData.availableAmenities = JSON.stringify(availableAmenities)
    if (venueImages !== undefined) updateData.venueImages = JSON.stringify(venueImages)
    if (sportTypes !== undefined) updateData.sportTypes = JSON.stringify(sportTypes)

    // Update or create settings
    const settings = await db.vendorSettings.upsert({
      where: { vendorId },
      update: updateData,
      create: updateData
    })

    // Parse JSON fields for response
    const responseSettings = {
      ...settings,
      paymentMethods: JSON.parse(settings.paymentMethods || '[]'),
      availableAmenities: JSON.parse(settings.availableAmenities || '[]'),
      venueImages: JSON.parse(settings.venueImages || '[]'),
      sportTypes: JSON.parse(settings.sportTypes || '[]')
    }

    return NextResponse.json({ settings: responseSettings })
  } catch (error) {
    console.error('Error updating vendor settings:', error)
    return NextResponse.json({ error: 'Failed to update vendor settings' }, { status: 500 })
  }
}