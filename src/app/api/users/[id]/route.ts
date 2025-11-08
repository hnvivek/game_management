import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  countryCode: z.string().length(2).optional(),
  timezone: z.string().optional(),
  currencyCode: z.string().length(3).optional(),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
  language: z.string().optional(),
  profilePicture: z.string().url().optional(),
  socialLinks: z.object({
    website: z.string().url().optional().nullable(),
    linkedin: z.string().url().optional().nullable(),
    twitter: z.string().url().optional().nullable(),
    instagram: z.string().url().optional().nullable(),
    github: z.string().url().optional().nullable(),
  }).optional(),
  notificationPreferences: z.object({
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
    bookingReminders: z.boolean().optional(),
    teamInvites: z.boolean().optional(),
    matchInvites: z.boolean().optional(),
  }).optional(),
  privacySettings: z.object({
    profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
    showEmail: z.boolean().optional(),
    showPhone: z.boolean().optional(),
    allowTeamInvites: z.boolean().optional(),
    allowMatchInvites: z.boolean().optional(),
  }).optional(),
});

// Validation schema for password change
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Helper function to verify user authentication
async function verifyUser(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value ||
               request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return { error: 'No authentication token provided', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const user = await prisma.user.findFirst({
      where: { 
        id: decoded.userId,
        deletedAt: null
      },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      return { error: 'User not found', status: 401 };
    }

    if (!user.isActive) {
      return { error: 'User account is inactive', status: 401 };
    }

    return { user };
  } catch (error) {
    console.error('JWT verification error:', error);
    return { error: 'Invalid authentication token', status: 401 };
  }
}

// GET /api/users/[id] - Get user profile (with proper authorization)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const auth = await verifyUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Resolve params (Next.js 15 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;

    // Users can only view their own profile or admins can view any profile
    if (auth.user.id !== resolvedParams.id && auth.user.role !== 'ADMIN' && auth.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const user = await prisma.user.findFirst({
      where: { 
        id: resolvedParams.id,
        deletedAt: null
      },
      include: {
        country: { select: { code: true, name: true } },
        currency: { select: { code: true, name: true, symbol: true } },
        teamMemberships: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                sport: { select: { name: true, displayName: true } },
              },
            },
          },
        },
        playerSkills: {
          include: {
            sport: { select: { name: true, displayName: true } },
          },
        },
        vendorStaff: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
            createdMatches: true,
            createdTournaments: true,
            teamInvites: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user profile
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const auth = await verifyUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Resolve params (Next.js 15 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;

    // Users can only update their own profile
    if (auth.user.id !== resolvedParams.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { type, ...data } = body;

    // Handle different types of updates
    if (type === 'password') {
      const validatedData = passwordChangeSchema.parse(data);

      // Get current user with password
      const currentUser = await prisma.user.findFirst({
        where: { 
          id: resolvedParams.id,
          deletedAt: null
        },
        select: { password: true }
      });

      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(validatedData.currentPassword, currentUser.password);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(validatedData.newPassword, 12);

      const updatedUser = await prisma.user.update({
        where: { id: resolvedParams.id },
        data: { password: hashedPassword },
        select: { id: true, name: true, email: true, updatedAt: true }
      });

      return NextResponse.json({
        message: 'Password updated successfully',
        user: updatedUser
      });
    } else {
      // Profile information update
      const validatedData = profileUpdateSchema.parse(data);

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: resolvedParams.id },
        data: validatedData,
        include: {
          country: { select: { code: true, name: true } },
          currency: { select: { code: true, name: true, symbol: true } },
        },
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;

      return NextResponse.json({
        message: 'Profile updated successfully',
        user: userWithoutPassword
      });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Soft delete user account
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const auth = await verifyUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Resolve params (Next.js 15 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;

    // Users can only delete their own account, or admins can delete any account
    if (auth.user.id !== resolvedParams.id && auth.user.role !== 'ADMIN' && auth.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Soft delete by setting deletedAt timestamp
    const updatedUser = await prisma.user.update({
      where: { id: resolvedParams.id },
      data: { 
        deletedAt: new Date(),
        isActive: false // Also deactivate for backward compatibility
      },
      select: { id: true, name: true, email: true }
    });

    return NextResponse.json({
      message: 'Account deleted successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}