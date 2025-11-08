import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/authorize';
import { z } from 'zod';

// Schema for vendor updates
const updateVendorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  phoneCountryCode: z.string().optional(), // Country calling code (e.g., "+1", "+91")
  phoneNumber: z.string().optional(),     // Local phone number without country code
  address: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  isActive: z.boolean().optional(),
  autoApprove: z.boolean().optional(),
  countryCode: z.string().length(2).optional(),
  currencyCode: z.string().length(3).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
});

// GET /api/admin/vendors/[id] - Get vendor details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Ensure user is admin
    const { user } = await requireAdmin(request);

    const { id: vendorId } = await params;

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const vendor = await db.vendor.findFirst({
      where: { 
        id: vendorId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneCountryCode: true,
        phoneNumber: true,
        description: true,
        website: true,
        address: true,
        postalCode: true,
        country: true,
        state: true,
        city: true,
        countryCode: true,
        isActive: true,
        autoApprove: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Get vendor statistics - using safe queries that won't fail if tables don't exist
    let totalVenues = 0;
    let activeVenues = 0;
    let totalStaff = 0;
    let totalBookings = 0;

    try {
      totalVenues = await db.venue.count({
        where: { vendorId: vendorId }
      });
    } catch (error) {
      console.warn('Error counting venues:', error);
    }

    try {
      activeVenues = await db.venue.count({
        where: { vendorId: vendorId, isActive: true }
      });
    } catch (error) {
      console.warn('Error counting active venues:', error);
    }

    try {
      totalStaff = await db.vendorStaff.count({
        where: { vendorId: vendorId, isActive: true }
      });
    } catch (error) {
      console.warn('Error counting staff:', error);
    }

    try {
      // Check if booking table exists before querying
      totalBookings = await db.booking.count({
        where: {
          court: {
            venue: { vendorId: vendorId }
          }
        }
      });
    } catch (error) {
      console.warn('Error counting bookings (table might not exist):', error);
      // Try alternative query if booking table doesn't exist
      try {
        totalBookings = 0; // Default to 0 if booking table doesn't exist
      } catch (fallbackError) {
        console.warn('Fallback booking count also failed:', fallbackError);
      }
    }

    // Compile vendor statistics
    const stats = {
      venues: {
        total: totalVenues,
        active: activeVenues
      },
      staff: totalStaff,
      bookings: totalBookings
    };

    // Return vendor data with statistics
    const simplifiedVendor = {
      id: vendor.id,
      name: vendor.name,
      email: vendor.email,
      phoneCountryCode: vendor.phoneCountryCode,
      phoneNumber: vendor.phoneNumber,
      description: vendor.description,
      website: vendor.website,
      address: vendor.address || '',
      postalCode: vendor.postalCode || '',
      country: vendor.country || '',
      state: vendor.state || '',
      city: vendor.city || '',
      countryCode: vendor.countryCode,
      isActive: vendor.isActive,
      autoApprove: vendor.autoApprove || false,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
      stats
    };

    return NextResponse.json({
      success: true,
      data: simplifiedVendor
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch vendor details' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/vendors/[id] - Update vendor
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Ensure user is admin
    const { user } = await requireAdmin(request);

    const { id: vendorId } = await params;
    const body = await request.json();
    const updates = updateVendorSchema.parse(body);

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Check if vendor exists
    const existingVendor = await db.vendor.findFirst({
      where: { 
        id: vendorId,
        deletedAt: null
      },
      select: { id: true, name: true }
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Update vendor
    const updatedVendor = await db.vendor.update({
      where: { id: vendorId },
      data: updates,
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        email: true,
        phoneCountryCode: true,
        phoneNumber: true,
        isActive: true,
        autoApprove: true,
        countryCode: true,
        address: true,
        postalCode: true,
        country: true,
        state: true,
        city: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedVendor
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid update data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/vendors/[id] - Soft delete vendor
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Ensure user is admin
    const { user } = await requireAdmin(request);

    const { id: vendorId } = await params;

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Check if vendor exists
    const existingVendor = await db.vendor.findFirst({
      where: { 
        id: vendorId,
        deletedAt: null
      },
      select: { id: true, name: true }
    });

    if (!existingVendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting deletedAt timestamp
    const deletedVendor = await db.vendor.update({
      where: { id: vendorId },
      data: { 
        deletedAt: new Date(),
        isActive: false // Also deactivate for backward compatibility
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Vendor deleted successfully',
      data: deletedVendor
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete vendor' },
      { status: 500 }
    );
  }
}

