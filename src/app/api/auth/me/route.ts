import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { withPerformanceTracking } from '@/lib/middleware/performance';

export const GET = withPerformanceTracking(async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Get token from cookie or Authorization header
    const token = request.cookies.get('auth-token')?.value ||
                 request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token provided' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    } catch (jwtError: any) {
      if (jwtError.name === 'JsonWebTokenError' || jwtError.name === 'TokenExpiredError' || jwtError.name === 'NotBeforeError') {
        return NextResponse.json(
          { error: 'Invalid or expired authentication token' },
          { status: 401 }
        );
      }
      throw jwtError;
    }

    // Optimized: Fetch user first with minimal fields to check role
    // Then conditionally fetch vendorStaff only if needed
    const user = await db.user.findUnique({
      where: { 
        id: decoded.userId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check soft delete
    if (user.deletedAt) {
      return NextResponse.json(
        { error: 'User account has been deleted' },
        { status: 401 }
      );
    }

    // Check if active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // Only fetch vendorStaff if user is vendor-related (optimization)
    let vendorId: string | null = null;
    let vendor: { id: string; name: string; slug: string; isActive: boolean } | null = null;

    if (user.role === 'VENDOR_ADMIN' || user.role === 'VENDOR_STAFF') {
      const vendorStaff = await db.vendorStaff.findFirst({
        where: {
          userId: user.id,
          isActive: true,
        },
        select: {
          vendorId: true,
          vendor: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true
            }
          }
        },
      });

      vendorId = vendorStaff?.vendorId || null;
      vendor = vendorStaff?.vendor || null;
    }

    const queryTime = Date.now() - startTime;
    if (queryTime > 100) {
      console.warn(`⚠️  Slow auth/me query: ${queryTime}ms`);
    }

    // Remove deletedAt from response
    const { deletedAt: _, ...userWithoutInternalFields } = user;

    return NextResponse.json({
      user: {
        ...userWithoutInternalFields,
        vendorId,
        vendor
      },
    });
  } catch (error: any) {
    console.error('Error fetching current user:', error);

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' || error.name === 'NotBeforeError') {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token' },
        { status: 401 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}, 'GET /api/auth/me');