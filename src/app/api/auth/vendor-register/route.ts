import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import slugify from 'slugify';

const prisma = new PrismaClient();

// Validation schema for vendor registration
const vendorRegistrationSchema = z.object({
  // User Information
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().optional(),

  // Business Information
  businessName: z.string().min(2),
  businessDescription: z.string().min(10),
  businessEmail: z.string().email(),
  businessPhone: z.string().optional(),
  website: z.string().url().optional(),

  // Address Information
  address: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().min(3),
  countryCode: z.string().length(2),

  // Business Settings
  currencyCode: z.string().length(3).default('USD'),
  timezone: z.string().default('America/New_York'),
  locale: z.string().default('en-US'),

  // Branding
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = vendorRegistrationSchema.parse(body);

    const {
      email,
      password,
      name,
      phone,
      businessName,
      businessDescription,
      businessEmail,
      businessPhone,
      website,
      address,
      city,
      postalCode,
      countryCode,
      currencyCode,
      timezone,
      locale,
      primaryColor,
      secondaryColor,
    } = validatedData;

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if business email already exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { email: businessEmail },
    });

    if (existingVendor) {
      return NextResponse.json(
        { error: 'Business email already registered' },
        { status: 400 }
      );
    }

    // Check if business name already exists
    const existingBusinessName = await prisma.vendor.findUnique({
      where: { name: businessName },
    });

    if (existingBusinessName) {
      return NextResponse.json(
        { error: 'Business name already registered' },
        { status: 400 }
      );
    }

    // Generate slug for vendor
    const baseSlug = slugify(businessName, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.vendor.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user account
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          role: 'VENDOR_ADMIN',
          isActive: true,
          isEmailVerified: false,
          countryCode,
          currencyCode,
          timezone,
          locale,
        },
        include: {
          country: { select: { code: true, name: true } },
          currency: { select: { code: true, name: true, symbol: true } },
        },
      });

      // Create vendor record
      const vendor = await tx.vendor.create({
        data: {
          name: businessName,
          slug,
          description: businessDescription,
          email: businessEmail,
          phone: businessPhone,
          website,
          isActive: false, // Requires approval
          countryCode,
          currencyCode,
          timezone,
          locale,
          primaryColor: primaryColor || '#3B82F6',
          secondaryColor: secondaryColor || '#10B981',
        },
      });

      // Create vendor staff relationship
      await tx.vendorStaff.create({
        data: {
          vendorId: vendor.id,
          userId: user.id,
          role: 'VENDOR_ADMIN',
          permissions: JSON.stringify({
            can_manage_venues: true,
            can_manage_bookings: true,
            can_manage_pricing: true,
            can_manage_staff: true,
            can_view_analytics: true,
            can_manage_settings: true,
          }),
        },
      });

      // Create default vendor settings
      await tx.vendorSettings.create({
        data: {
          vendorId: vendor.id,
          advanceBookingDays: 30,
          maxConcurrentBookings: 10,
          requiresDeposit: false,
          taxIncluded: true,
          showBookingCalendar: true,
          showPricingPublicly: true,
          allowOnlinePayments: true,
          emailNotifications: true,
          bookingReminders: true,
          newBookingAlerts: true,
          autoApproval: false,
        },
      });

      return { user, vendor };
    });

    // Create JWT token
    const token = jwt.sign(
      {
        userId: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = result.user;

    // Set HTTP-only cookie
    const response = NextResponse.json({
      user: userWithoutPassword,
      vendor: result.vendor,
      token,
      message: 'Vendor registration successful! Your account is pending approval.',
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error during vendor registration:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email or business name already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get vendor registration status
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    // Get user with vendor info
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        vendorStaff: {
          include: {
            vendor: {
              include: {
                settings: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role !== 'VENDOR_ADMIN' && user.role !== 'VENDOR_STAFF') {
      return NextResponse.json(
        { error: 'Not a vendor account' },
        { status: 403 }
      );
    }

    const vendorStaff = user.vendorStaff[0];
    if (!vendorStaff) {
      return NextResponse.json(
        { error: 'No vendor associated with account' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      vendor: vendorStaff.vendor,
      role: vendorStaff.role,
      permissions: JSON.parse(vendorStaff.permissions || '{}'),
    });
  } catch (error) {
    console.error('Error getting vendor registration status:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}