import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withVendorOwnershipAuth, ApiResponse } from '@/lib/auth/api-auth';
import { z } from 'zod';

// Schema for operating hours
// Note: Times are stored in the venue's local timezone as HH:mm format
const operatingHourSchema = z.object({
  dayOfWeek: z.number(),
  dayName: z.string(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  isOpen: z.boolean()
});

// Schema for updating venues
const updateVenueSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  countryCode: z.string().optional(),
  currencyCode: z.string().optional(),
  timezone: z.string().optional(),
  featuredImage: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  operatingHours: z.array(operatingHourSchema).optional()
});

// GET /api/vendors/[vendorId]/venues/[venueId] - Get venue details
export const GET = withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  let resolvedParams: any = {};
  try {
    // Params may be a Promise (Next.js 15) or already resolved by wrapper
    resolvedParams = params instanceof Promise ? await params : (params || {});
    const { vendorId, venueId } = resolvedParams;

    if (!venueId) {
      return ApiResponse.error('Venue ID is required', 'MISSING_VENUE_ID', 400);
    }

    const venue = await db.venue.findFirst({
      where: {
        id: venueId,
        vendorId, // Ensure venue belongs to this vendor
        deletedAt: null // Exclude soft-deleted venues
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        courts: {
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
            },
            _count: {
              select: {
                bookings: {
                  where: {
                    status: { in: ['CONFIRMED', 'COMPLETED'] }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        operatingHours: {
          orderBy: { dayOfWeek: 'asc' }
        }
      }
    });

    if (!venue) {
      return ApiResponse.notFound('Venue');
    }

    // Transform the response for our simplified schema
    const transformedVenue = {
      ...venue,
      courts: venue.courts.map(court => ({
        ...court,
        pricePerHour: typeof court.pricePerHour === 'string' ? parseFloat(court.pricePerHour) : court.pricePerHour
      })),
      stats: {
        bookings: 0, // TODO: Calculate from bookings table when available
        revenue: 0, // TODO: Calculate from bookings table when available
        courts: venue.courts.length,
        activeCourts: venue.courts.filter(c => c.isActive).length,
        operatingHours: venue.operatingHours.length,
        sports: [...new Map(venue.courts.map(court => [court.sport.id, court.sport])).values()], // Get unique sports by ID
      },
      operatingHours: venue.operatingHours.map(hours => ({
        ...hours,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][hours.dayOfWeek],
        // Include timezone context for frontend display
        timezone: venue.timezone
      })),
      _count: undefined // Remove _count from final response
    };

    return ApiResponse.success(transformedVenue);

  } catch (error) {
    console.error('Error fetching venue details:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      vendorId: resolvedParams?.vendorId || 'unknown',
      venueId: resolvedParams?.venueId || 'unknown',
      errorType: error?.constructor?.name,
      errorString: String(error)
    });
    
    // Return detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Failed to fetch venue details: ${error instanceof Error ? error.message : String(error)}`
      : 'Failed to fetch venue details';
    
    return ApiResponse.error(errorMessage, 'VENUE_ERROR', 500);
  }
});

// PUT /api/vendors/[vendorId]/venues/[venueId] - Update venue
export const PUT = withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  try {
    // Params may be a Promise (Next.js 15) or already resolved by wrapper
    const resolvedParams = params instanceof Promise ? await params : (params || {});
    const { vendorId, venueId } = resolvedParams;
    const body = await request.json();

    // Clean up empty strings before validation
    const cleanedData = {
      ...body,
      email: body.email || undefined,
      website: body.website || undefined,
      featuredImage: body.featuredImage || undefined,
    };

      const updates = updateVenueSchema.parse(cleanedData);

    if (!venueId) {
      return ApiResponse.error('Venue ID is required', 'MISSING_VENUE_ID', 400);
    }

    // Check if venue exists and belongs to this vendor
    const existingVenue = await db.venue.findFirst({
      where: {
        id: venueId,
        vendorId,
        deletedAt: null // Exclude soft-deleted venues
      },
      select: { id: true, name: true, timezone: true }
    });

    if (!existingVenue) {
      return ApiResponse.notFound('Venue');
    }

    // Handle operating hours separately if provided
    let finalUpdates = updates;
    if (updates.operatingHours) {
      // Ensure venue has a timezone set, default to UTC if not
      const venueTimezone = existingVenue.timezone || 'UTC';

      // Delete existing operating hours and create new ones
      await db.venueOperatingHours.deleteMany({
        where: { venueId }
      });

      // Create new operating hours in venue's local timezone
      await db.venueOperatingHours.createMany({
        data: updates.operatingHours.map(hours => ({
          venueId,
          dayOfWeek: hours.dayOfWeek,
          openingTime: hours.isOpen ? hours.openingTime : '00:00',
          closingTime: hours.isOpen ? hours.closingTime : '00:00',
          isOpen: hours.isOpen
        }))
      });

      // Remove operatingHours from updates since we handle it separately
      const { operatingHours: _, ...venueUpdates } = updates;
      finalUpdates = venueUpdates;
    }

    // Update venue
    const updatedVenue = await db.venue.update({
      where: { id: venueId },
      data: finalUpdates,
      include: {
        vendor: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            courts: true,
            operatingHours: true
          }
        }
      }
    });

    return ApiResponse.success(updatedVenue);

  } catch (error) {
    console.error('Error updating venue:', error);

    if (error instanceof z.ZodError) {
      console.error('Zod validation error details:', error.errors);
      return ApiResponse.error(`Invalid update data: ${error.errors.map(e => e.message).join(', ')}`, 'INVALID_UPDATE_DATA', 400);
    }

    // Return detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Failed to update venue: ${error instanceof Error ? error.message : String(error)}`
      : 'Failed to update venue';
    
    return ApiResponse.error(errorMessage, 'VENUE_UPDATE_ERROR', 500);
  }
});

// DELETE /api/vendors/[vendorId]/venues/[venueId] - Delete venue
export const DELETE = withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
  try {
    // Params may be a Promise (Next.js 15) or already resolved by wrapper
    const resolvedParams = params instanceof Promise ? await params : (params || {});
    const { vendorId, venueId } = resolvedParams;

    if (!venueId) {
      return ApiResponse.error('Venue ID is required', 'MISSING_VENUE_ID', 400);
    }

    // Check if venue exists and belongs to this vendor (exclude already deleted)
    const existingVenue = await db.venue.findFirst({
      where: {
        id: venueId,
        vendorId,
        deletedAt: null // Only find non-deleted venues
      },
      select: { id: true, name: true }
    });

    if (!existingVenue) {
      return ApiResponse.notFound('Venue');
    }

    // Check if venue has active bookings through courts
    const activeBookings = await db.booking.count({
      where: {
        court: {
          venueId
        },
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    });

    if (activeBookings > 0) {
      return ApiResponse.error(
        'Cannot delete venue with active bookings. Please cancel or complete existing bookings first.',
        'ACTIVE_BOOKINGS_EXIST',
        400
      );
    }

    // Soft delete venue - set deletedAt timestamp
    await db.venue.update({
      where: { id: venueId },
      data: { deletedAt: new Date() }
    });

    return ApiResponse.success({
      id: venueId,
      name: existingVenue.name,
      message: 'Venue deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting venue:', error);
    
    // Return detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Failed to delete venue: ${error instanceof Error ? error.message : String(error)}`
      : 'Failed to delete venue';
    
    return ApiResponse.error(errorMessage, 'VENUE_DELETE_ERROR', 500);
  }
});