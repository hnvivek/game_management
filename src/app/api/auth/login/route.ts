import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { withPerformanceTracking } from '@/lib/middleware/performance';

// Validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const POST = withPerformanceTracking(async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Optimized: Single query with all filters at database level
    // Only select fields we need (exclude password initially, then fetch separately if needed)
    const user = await db.user.findFirst({
      where: { 
        email,
        deletedAt: null,
        isActive: true // Filter at DB level instead of application level
      },
      select: {
        id: true,
        email: true,
        name: true,
        password: true, // Need password for verification
        role: true,
        isActive: true,
        isEmailVerified: true,
        avatarUrl: true,
        lastLoginAt: true,
        city: true,
        state: true,
        country: true,
        countryCode: true,
        currencyCode: true,
        timezone: true,
        locale: true,
        createdAt: true,
        updatedAt: true,
        phone: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT token (can be done in parallel with DB update)
    const tokenPromise = Promise.resolve(
      jwt.sign(
        {
          userId: user.id,
          email: user.email,
          name: user.name,
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      )
    );

    // Update last login timestamp asynchronously (don't block response)
    // This is a fire-and-forget operation for better performance
    db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }).catch(err => {
      console.error('Failed to update lastLoginAt (non-critical):', err);
    });

    // Wait for token generation
    const token = await tokenPromise;

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Set HTTP-only cookie
    const response = NextResponse.json({
      user: userWithoutPassword,
      token,
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
    console.error('Error during login:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, 'POST /api/auth/login');