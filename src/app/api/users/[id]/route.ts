import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

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
    const user = await db.user.findFirst({
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

    const user = await db.user.findFirst({
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
      const currentUser = await db.user.findFirst({
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

      // Hash new password (using 10 rounds instead of 12 for better performance while maintaining security)
      // 10 rounds is still very secure and reduces hash time from ~500ms to ~100ms
      const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);

      const updatedUser = await db.user.update({
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
      let validatedData;
      try {
        validatedData = profileUpdateSchema.parse(data);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          console.error('Profile update validation error:', validationError.errors);
          return NextResponse.json(
            { error: 'Validation failed', details: validationError.errors },
            { status: 400 }
          );
        }
        throw validationError;
      }

      // Filter out undefined values and map fields correctly
      // Map field names: language -> locale, profilePicture -> avatarUrl
      // Stringify JSON fields: socialLinks, notificationPreferences, privacySettings
      const updateData: any = {};
      
      Object.keys(validatedData).forEach(key => {
        const value = validatedData[key as keyof typeof validatedData];
        if (value !== undefined) {
          // Map field names
          if (key === 'language') {
            updateData['locale'] = value;
          } else if (key === 'profilePicture') {
            updateData['avatarUrl'] = value;
          } else if (key === 'socialLinks' || key === 'notificationPreferences' || key === 'privacySettings') {
            // Stringify JSON fields for SQLite storage
            updateData[key] = JSON.stringify(value);
          } else {
            // All other fields map directly
            updateData[key] = value;
          }
        }
      });

      // Update user profile - select all profile fields
      const updatedUser = await db.user.update({
        where: { id: resolvedParams.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          bio: true,
          area: true,
          city: true,
          state: true,
          country: true,
          countryCode: true,
          timezone: true,
          currencyCode: true,
          locale: true,
          dateFormat: true,
          timeFormat: true,
          avatarUrl: true,
          socialLinks: true,
          notificationPreferences: true,
          privacySettings: true,
          updatedAt: true,
        },
      });

      // Helper to safely parse JSON fields
      const parseJsonField = (field: string | null | undefined): any => {
        if (!field || field.trim() === '') return null;
        try {
          return JSON.parse(field);
        } catch {
          return null;
        }
      };

      // Parse JSON fields for response
      const userResponse = {
        ...updatedUser,
        socialLinks: parseJsonField(updatedUser.socialLinks),
        notificationPreferences: parseJsonField(updatedUser.notificationPreferences),
        privacySettings: parseJsonField(updatedUser.privacySettings),
        // Map back to API field names for consistency
        language: updatedUser.locale,
        profilePicture: updatedUser.avatarUrl,
      };

      return NextResponse.json({
        message: 'Profile updated successfully',
        user: userResponse
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

    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json({ 
      error: 'Failed to update profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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
    const updatedUser = await db.user.update({
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