import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withVendorOwnershipAuth, ApiResponse } from '@/lib/auth/api-auth';
import { z } from 'zod';

// Schema for updating vendor settings
const updateVendorSettingsSchema = z.object({
  // Profile Settings
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  logoUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  website: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  phoneCountryCode: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().email().optional(),
  currencyCode: z.string().optional(),
  timezone: z.string().optional(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),

  // Business Hours
  businessHours: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    openingTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    closingTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    isOpen: z.boolean(),
    notes: z.string().optional()
  })).optional(),

  // Notification Settings
  emailNotifications: z.object({
    newBookings: z.boolean().optional(),
    bookingCancellations: z.boolean().optional(),
    paymentConfirmations: z.boolean().optional(),
    lowInventoryAlerts: z.boolean().optional(),
    staffUpdates: z.boolean().optional(),
    marketingEmails: z.boolean().optional()
  }).optional(),

  smsNotifications: z.object({
    newBookings: z.boolean().optional(),
    bookingCancellations: z.boolean().optional(),
    paymentConfirmations: z.boolean().optional(),
    urgentAlerts: z.boolean().optional(),
    silentHours: z.boolean().optional()
  }).optional(),

  // Booking Settings
  bookingSettings: z.object({
    advanceBookingDays: z.number().min(1).max(365).optional(),
    minBookingDuration: z.number().min(15).max(480).optional(), // in minutes
    maxBookingDuration: z.number().min(15).max(480).optional(), // in minutes
    allowInstantBookings: z.boolean().optional(),
    requireApproval: z.boolean().optional(),
    cancellationPolicy: z.string().optional(),
    lateCancellationFee: z.number().min(0).optional(),
    noShowPolicy: z.string().optional()
  }).optional(),

  // Payment Settings
  paymentSettings: z.object({
    acceptedPaymentMethods: z.array(z.string()).optional(),
    requirePaymentUpfront: z.boolean().optional(),
    depositPercentage: z.number().min(0).max(100).optional(),
    autoRefundCancellations: z.boolean().optional(),
    refundPolicy: z.string().optional()
  }).optional(),

  // Display Settings
  displaySettings: z.object({
    showPricing: z.boolean().optional(),
    showAvailability: z.boolean().optional(),
    allowReviews: z.boolean().optional(),
    showContactInfo: z.boolean().optional(),
    customCSS: z.string().optional()
  }).optional(),

  // Integration Settings
  integrations: z.object({
    googleCalendar: z.object({
      enabled: z.boolean().optional(),
      calendarId: z.string().optional()
    }).optional(),
    zoom: z.object({
      enabled: z.boolean().optional(),
      apiKey: z.string().optional()
    }).optional(),
    webhookUrl: z.string().url().optional().nullable()
  }).optional(),

  // Tax Information
  taxId: z.string().optional().nullable(),
  taxRate: z.number().min(0).max(100).optional()
});

// GET /api/vendors/[vendorId]/settings - Get vendor settings
export const GET = withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  try {
    // Resolve params (wrapper may pass Promise or resolved object)
    const resolvedParams = params instanceof Promise ? await params : (params || {});
    const vendorId = resolvedParams.vendorId;

    if (!vendorId) {
      return ApiResponse.error('Vendor ID is required', 'MISSING_VENDOR_ID', 400);
    }

    const vendor = await db.vendor.findUnique({
      where: { id: vendorId },
      include: {
        vendorSettings: true,
        venues: {
          select: {
            id: true,
            name: true,
            operatingHours: {
              select: {
                dayOfWeek: true,
                openingTime: true,
                closingTime: true,
                isOpen: true
              },
              orderBy: {
                dayOfWeek: 'asc'
              }
            }
          },
          take: 1 // Get first venue's hours as default
        }
      }
    });

    if (!vendor) {
      return ApiResponse.notFound('Vendor');
    }

    // Default settings
    const defaultSettings = {
      emailNotifications: {
        newBookings: true,
        bookingCancellations: true,
        paymentConfirmations: true,
        lowInventoryAlerts: false,
        staffUpdates: true,
        marketingEmails: false
      },
      smsNotifications: {
        newBookings: false,
        bookingCancellations: false,
        paymentConfirmations: false,
        urgentAlerts: false,
        silentHours: false
      },
      bookingSettings: {
        advanceBookingDays: 30,
        minBookingDuration: 30,
        maxBookingDuration: 240,
        allowInstantBookings: true,
        requireApproval: false,
        cancellationPolicy: 'Full refund if cancelled 24 hours in advance',
        lateCancellationFee: 0,
        noShowPolicy: 'No refund for no-shows'
      },
      paymentSettings: {
        acceptedPaymentMethods: ['credit_card', 'debit_card'],
        requirePaymentUpfront: false,
        depositPercentage: 0,
        autoRefundCancellations: true,
        refundPolicy: 'Refunds processed within 5-7 business days'
      },
      displaySettings: {
        showPricing: true,
        showAvailability: true,
        allowReviews: true,
        showContactInfo: true,
        customCSS: ''
      },
      integrations: {
        googleCalendar: {
          enabled: false,
          calendarId: ''
        },
        zoom: {
          enabled: false,
          apiKey: ''
        },
        webhookUrl: null
      }
    };

    // Parse JSON settings from database
    const emailNotificationSettings = vendor.vendorSettings?.emailNotificationSettings 
      ? JSON.parse(vendor.vendorSettings.emailNotificationSettings)
      : defaultSettings.emailNotifications;
    
    const smsNotificationSettings = vendor.vendorSettings?.smsNotificationSettings
      ? JSON.parse(vendor.vendorSettings.smsNotificationSettings)
      : defaultSettings.smsNotifications;
    
    const paymentSettings = vendor.vendorSettings?.paymentSettings
      ? JSON.parse(vendor.vendorSettings.paymentSettings)
      : defaultSettings.paymentSettings;

    // Merge vendor settings with defaults
    const settings = {
      // Basic vendor info
      profile: {
        name: vendor.name,
        description: vendor.description,
        logoUrl: vendor.logoUrl,
        website: vendor.website,
        phoneCountryCode: vendor.phoneCountryCode,
        phoneNumber: vendor.phoneNumber,
        email: vendor.email,
        currencyCode: vendor.currencyCode,
        timezone: vendor.timezone,
        primaryColor: vendor.primaryColor,
        secondaryColor: vendor.secondaryColor,
        accentColor: vendor.accentColor,
        city: vendor.city,
        state: vendor.state,
        postalCode: vendor.postalCode,
        country: vendor.country,
        address: vendor.address
      },

      // Settings from database or defaults
      ...defaultSettings,
      emailNotifications: emailNotificationSettings,
      smsNotifications: smsNotificationSettings,
      paymentSettings: paymentSettings,
      taxRate: vendor.vendorSettings?.taxRate,
      taxId: vendor.vendorSettings?.taxId,
      ...vendor.vendorSettings,

      // Additional info
      defaultOperatingHours: vendor.venues[0]?.operatingHours || []
    };

    return ApiResponse.success(settings);

  } catch (error) {
    console.error('Error fetching vendor settings:', error);
    return ApiResponse.error('Failed to fetch vendor settings', 'SETTINGS_ERROR', 500);
  }
});

// PUT /api/vendors/[vendorId]/settings - Update vendor settings
export const PUT = withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  try {
    // Resolve params (wrapper may pass Promise or resolved object)
    const resolvedParams = params instanceof Promise ? await params : (params || {});
    const vendorId = resolvedParams.vendorId;

    if (!vendorId) {
      return ApiResponse.error('Vendor ID is required', 'MISSING_VENDOR_ID', 400);
    }

    const body = await request.json();
    const updates = updateVendorSettingsSchema.parse(body);

    // Only vendor admins can update settings
    if (user.role !== 'VENDOR_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
      return ApiResponse.forbidden('Only vendor admins can update settings');
    }

    // Check if vendor exists
    const vendor = await db.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, name: true }
    });

    if (!vendor) {
      return ApiResponse.notFound('Vendor');
    }

    // Separate vendor profile updates from settings updates
    const profileUpdates: any = {};
    const settingsUpdates: any = {};

    // Profile fields that go directly on vendor
    if (updates.name !== undefined) profileUpdates.name = updates.name;
    if (updates.description !== undefined) profileUpdates.description = updates.description;
    if (updates.logoUrl !== undefined) profileUpdates.logoUrl = updates.logoUrl === '' ? null : updates.logoUrl;
    if (updates.website !== undefined) profileUpdates.website = updates.website === '' ? null : updates.website;
    if (updates.phoneCountryCode !== undefined) profileUpdates.phoneCountryCode = updates.phoneCountryCode === '' ? null : updates.phoneCountryCode;
    if (updates.phoneNumber !== undefined) profileUpdates.phoneNumber = updates.phoneNumber === '' ? null : updates.phoneNumber;
    if (updates.email !== undefined) profileUpdates.email = updates.email;
    if (updates.currencyCode !== undefined) profileUpdates.currencyCode = updates.currencyCode;
    if (updates.timezone !== undefined) profileUpdates.timezone = updates.timezone;
    if (updates.address !== undefined) profileUpdates.address = updates.address === '' ? null : updates.address;
    if (updates.city !== undefined) profileUpdates.city = updates.city === '' ? null : updates.city;
    if (updates.state !== undefined) profileUpdates.state = updates.state === '' ? null : updates.state;
    if (updates.postalCode !== undefined) profileUpdates.postalCode = updates.postalCode === '' ? null : updates.postalCode;
    if (updates.country !== undefined) profileUpdates.country = updates.country === '' ? null : updates.country;

    // Handle business hours separately - update first venue's hours
    let businessHoursUpdates: any[] | null = null;
    let venueIdForHours: string | null = null;
    if (updates.businessHours !== undefined) {
      businessHoursUpdates = updates.businessHours;
      // Get first venue ID to update its hours
      const firstVenue = await db.venue.findFirst({
        where: { vendorId },
        select: { id: true }
      });
      venueIdForHours = firstVenue?.id || null;
    }

    // Handle JSON fields for settings
    if (updates.emailNotifications !== undefined) {
      settingsUpdates.emailNotificationSettings = JSON.stringify(updates.emailNotifications);
    }
    if (updates.smsNotifications !== undefined) {
      settingsUpdates.smsNotificationSettings = JSON.stringify(updates.smsNotifications);
    }
    if (updates.paymentSettings !== undefined) {
      settingsUpdates.paymentSettings = JSON.stringify(updates.paymentSettings);
    }
    if (updates.taxId !== undefined) {
      settingsUpdates.taxId = updates.taxId;
    }
    if (updates.taxRate !== undefined) {
      settingsUpdates.taxRate = updates.taxRate;
    }

    // Handle bookingSettings - map to existing VendorSettings fields
    if (updates.bookingSettings !== undefined) {
      const bs = updates.bookingSettings;
      if (bs.advanceBookingDays !== undefined) {
        settingsUpdates.advanceBookingDays = bs.advanceBookingDays;
      }
      if (bs.maxBookingDuration !== undefined) {
        // Store max duration in minutes, convert to hours for maxConcurrentBookings if needed
        // Note: This is a workaround - you may want to add a maxBookingDuration field to schema
      }
      if (bs.allowInstantBookings !== undefined) {
        settingsUpdates.autoApproval = bs.allowInstantBookings;
      }
      if (bs.requireApproval !== undefined) {
        settingsUpdates.autoApproval = !bs.requireApproval;
      }
    }

    // Handle displaySettings - map to existing VendorSettings fields
    if (updates.displaySettings !== undefined) {
      const ds = updates.displaySettings;
      if (ds.showPricing !== undefined) {
        settingsUpdates.showPricingPublicly = ds.showPricing;
      }
      if (ds.showAvailability !== undefined) {
        settingsUpdates.showBookingCalendar = ds.showAvailability;
      }
      if (ds.allowOnlinePayments !== undefined) {
        settingsUpdates.allowOnlinePayments = ds.allowOnlinePayments;
      }
      // Note: customCSS is not in VendorSettings schema - ignoring for now
    }

    // Handle integrations - store as JSON if needed, or ignore for now
    // Note: integrations are not in VendorSettings schema - ignoring for now

    // Use transaction to update vendor, settings, and operating hours
    const result = await db.$transaction(async (tx) => {
      // Update vendor profile if needed
      let updatedVendor = null;
      if (Object.keys(profileUpdates).length > 0) {
        updatedVendor = await tx.vendor.update({
          where: { id: vendorId },
          data: profileUpdates,
          select: {
            id: true,
            name: true,
            description: true,
            logoUrl: true,
            website: true,
            phoneCountryCode: true,
            phoneNumber: true,
            email: true,
            updatedAt: true
          }
        });
      }

      // Update vendor settings
      let updatedSettings = null;
      if (Object.keys(settingsUpdates).length > 0) {
        updatedSettings = await tx.vendorSettings.upsert({
          where: { vendorId },
          update: settingsUpdates,
          create: {
            vendorId,
            ...settingsUpdates
          }
        });
      }

      // Update vendor operating hours if provided
      let updatedOperatingHours = null;
      if (businessHoursUpdates && businessHoursUpdates.length > 0 && venueIdForHours) {
        // Delete existing operating hours for the venue
        await tx.venueOperatingHours.deleteMany({
          where: { venueId: venueIdForHours }
        });

        // Create new operating hours for the venue
        updatedOperatingHours = await tx.venueOperatingHours.createMany({
          data: businessHoursUpdates.map(hour => ({
            venueId: venueIdForHours!,
            dayOfWeek: hour.dayOfWeek,
            openingTime: hour.openingTime,
            closingTime: hour.closingTime,
            isOpen: hour.isOpen
          }))
        });
      }

      return { updatedVendor, updatedSettings, updatedOperatingHours };
    });

    return ApiResponse.success({
      vendor: result.updatedVendor,
      settings: result.updatedSettings,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating vendor settings:', error);
    
    // Log detailed error information for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check for Prisma errors
      if (error.message.includes('Unknown argument') || error.message.includes('does not exist')) {
        console.error('Prisma field error - attempting to update non-existent field');
        return ApiResponse.error('Invalid field in settings update', 'INVALID_FIELD', 400);
      }
    }

    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      return ApiResponse.error('Invalid settings data', 'INVALID_SETTINGS_DATA', 400);
    }

    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      if (error.message.includes('email')) {
        return ApiResponse.error('Email already exists', 'EMAIL_EXISTS', 400);
      }
    }

    return ApiResponse.error('Failed to update vendor settings', 'SETTINGS_UPDATE_ERROR', 500);
  }
});

// POST /api/vendors/[vendorId]/settings/reset - Reset settings to defaults
export async function POST(request: NextRequest, context: { params?: Promise<any> }) {
  try {
    return withVendorOwnershipAuth(async (req: NextRequest, { user, params }: any) => {
      // Resolve params (wrapper may pass Promise or resolved object)
      const resolvedParams = params instanceof Promise ? await params : (params || {});
      const vendorId = resolvedParams.vendorId;

      if (!vendorId) {
        return ApiResponse.error('Vendor ID is required', 'MISSING_VENDOR_ID', 400);
      }

      // Only vendor admins can reset settings
      if (user.role !== 'VENDOR_ADMIN' && user.role !== 'PLATFORM_ADMIN') {
        return ApiResponse.forbidden('Only vendor admins can reset settings');
      }

      // Delete existing settings
      await db.vendorSettings.deleteMany({
        where: { vendorId }
      });

      // Return default settings
      const defaultSettings = {
        emailNotifications: {
          newBookings: true,
          bookingCancellations: true,
          paymentConfirmations: true,
          lowInventoryAlerts: false,
          staffUpdates: true,
          marketingEmails: false
        },
        smsNotifications: {
          newBookings: false,
          bookingCancellations: false,
          paymentConfirmations: false
        },
        bookingSettings: {
          advanceBookingDays: 30,
          minBookingDuration: 30,
          maxBookingDuration: 240,
          allowInstantBookings: true,
          requireApproval: false,
          cancellationPolicy: 'Full refund if cancelled 24 hours in advance',
          lateCancellationFee: 0,
          noShowPolicy: 'No refund for no-shows'
        },
        paymentSettings: {
          acceptedPaymentMethods: ['credit_card', 'debit_card'],
          requirePaymentUpfront: false,
          depositPercentage: 0,
          autoRefundCancellations: true,
          refundPolicy: 'Refunds processed within 5-7 business days'
        },
        displaySettings: {
          showPricing: true,
          showAvailability: true,
          allowReviews: true,
          showContactInfo: true,
          customCSS: ''
        },
        integrations: {
          googleCalendar: {
            enabled: false,
            calendarId: ''
          },
          zoom: {
            enabled: false,
            apiKey: ''
          },
          webhookUrl: null
        }
      };

      return ApiResponse.success(defaultSettings, {
        message: 'Settings reset to defaults successfully'
      });

    })(request, context);
  } catch (error) {
    console.error('Error resetting vendor settings:', error);
    return ApiResponse.error('Failed to reset vendor settings', 'SETTINGS_RESET_ERROR', 500);
  }
}