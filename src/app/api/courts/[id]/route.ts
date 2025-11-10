import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for updating courts
const updateCourtSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  courtNumber: z.string().optional(),
  surface: z.string().optional(),
  pricePerHour: z.preprocess((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? val : parsed;
    }
    return val;
  }, z.number().positive()).optional(),
  maxPlayers: z.preprocess((val) => {
    if (typeof val === 'string') {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? val : parsed;
    }
    return val;
  }, z.number().int().positive()).optional(),
  isActive: z.boolean().optional(),
  sportId: z.string().optional(),
  formatConfigs: z.array(z.object({
    formatId: z.string(),
    maxSlots: z.number().int().positive()
  })).optional(),
  features: z.array(z.string()).optional(),
  });

// GET /api/courts/[id] - Get court details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courtId } = await params;

    if (!courtId) {
      return NextResponse.json(
        { error: 'Court ID is required' },
        { status: 400 }
      );
    }

    const court = await db.court.findUnique({
      where: { id: courtId },
      select: {
        id: true,
        name: true,
        description: true,
        courtNumber: true,
        surface: true,
        pricePerHour: true,
        maxPlayers: true,
        isActive: true,
        features: true,
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            postalCode: true,
            countryCode: true,
            currencyCode: true,
            timezone: true,
            vendor: {
              select: {
                id: true,
                name: true,
                slug: true
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
            isActive: true,
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
      }
    });

    if (!court) {
      return NextResponse.json(
        { error: 'Court not found' },
        { status: 404 }
      );
    }

    // Transform the response for our schema
    const transformedCourt = {
      ...court,
      pricePerHour: typeof court.pricePerHour === 'string' ? parseFloat(court.pricePerHour) : court.pricePerHour,
      features: court.features ? JSON.parse(court.features) : [],
      stats: {
        bookings: court._count.bookings,
        revenue: 0, // TODO: Calculate from bookings table when available
        avgBookingDuration: 0, // TODO: Calculate from bookings table when available
        utilizationRate: 0 // TODO: Calculate from bookings table when available
      },
      _count: undefined // Remove _count from final response
    };

    return NextResponse.json({
      success: true,
      data: transformedCourt
    });

  } catch (error) {
    console.error('Error fetching court details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch court details' },
      { status: 500 }
    );
  }
}

// PUT /api/courts/[id] - Update court
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courtId } = await params;
    const body = await request.json();
    const updates = updateCourtSchema.parse(body);

    if (!courtId) {
      return NextResponse.json(
        { error: 'Court ID is required' },
        { status: 400 }
      );
    }

    // Check if court exists
    const existingCourt = await db.court.findUnique({
      where: { id: courtId },
      select: { id: true, name: true, venueId: true }
    });

    if (!existingCourt) {
      return NextResponse.json(
        { error: 'Court not found' },
        { status: 404 }
      );
    }

    // If updating court number, check for conflicts
    if (updates.courtNumber) {
      const conflictingCourt = await db.court.findFirst({
        where: {
          venueId: existingCourt.venueId,
          courtNumber: updates.courtNumber,
          id: { not: courtId }
        }
      });

      if (conflictingCourt) {
        return NextResponse.json(
          { error: 'Court number already exists for this venue' },
          { status: 400 }
        );
      }
    }

    // Convert to proper Prisma update format
    const updateData: any = {
      ...(updates.name && { name: updates.name }),
      ...(updates.description && { description: updates.description }),
      ...(updates.courtNumber && { courtNumber: updates.courtNumber }),
      ...(updates.surface && { surface: updates.surface }),
      ...(updates.pricePerHour && { pricePerHour: updates.pricePerHour }),
      ...(updates.maxPlayers && { maxPlayers: updates.maxPlayers }),
      ...(updates.isActive !== undefined && { isActive: updates.isActive }),
      ...(updates.sportId && { sport: { connect: { id: updates.sportId } } }),
      ...(updates.features && { features: JSON.stringify(updates.features) })
    };

    // Handle formatConfigs separately if provided
    if (updates.formatConfigs) {
      // Delete existing court formats
      await db.courtFormat.deleteMany({
        where: { courtId }
      });

      // Create new court formats
      if (updates.formatConfigs.length > 0) {
        await db.courtFormat.createMany({
          data: updates.formatConfigs.map((config: { formatId: string; maxSlots: number }) => ({
            courtId,
            formatId: config.formatId,
            maxSlots: config.maxSlots || 1,
            isActive: true
          }))
        });
      }
    }

    // Update court
    const updatedCourt = await db.court.update({
      where: { id: courtId },
      data: updateData,
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
                slug: true
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
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedCourt,
        pricePerHour: typeof updatedCourt.pricePerHour === 'string' ? parseFloat(updatedCourt.pricePerHour) : updatedCourt.pricePerHour,
        features: updatedCourt.features ? JSON.parse(updatedCourt.features) : []
      },
      message: 'Court updated successfully'
    });

  } catch (error) {
    console.error('Error updating court:', error);

    if (error instanceof z.ZodError) {
      console.error('Zod validation error details:', error.errors);
      return NextResponse.json(
        { error: `Invalid update data: ${error.issues.map(e => e.message).join(', ')}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update court' },
      { status: 500 }
    );
  }
}

// DELETE /api/courts/[id] - Delete court
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courtId } = await params;

    if (!courtId) {
      return NextResponse.json(
        { error: 'Court ID is required' },
        { status: 400 }
      );
    }

    // Check if court exists
    const existingCourt = await db.court.findUnique({
      where: { id: courtId },
      select: { id: true, name: true, _count: { select: { bookings: true } } }
    });

    if (!existingCourt) {
      return NextResponse.json(
        { error: 'Court not found' },
        { status: 404 }
      );
    }

    // Check if court has bookings (prevent deletion if has active bookings)
    const activeBookings = await db.booking.count({
      where: {
        courtId,
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    });

    if (activeBookings > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete court with active bookings. Please cancel or complete existing bookings first.',
          code: 'ACTIVE_BOOKINGS_EXIST'
        },
        { status: 400 }
      );
    }

    // Delete court (cascade will handle related records)
    await db.court.delete({
      where: { id: courtId }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: courtId,
        name: existingCourt.name,
        message: 'Court deleted successfully'
      }
    });

  } catch (error) {
    console.error('Error deleting court:', error);
    return NextResponse.json(
      { error: 'Failed to delete court' },
      { status: 500 }
    );
  }
}