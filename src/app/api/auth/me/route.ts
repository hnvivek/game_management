import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const token = request.cookies.get('auth-token')?.value ||
                 request.headers.get('authorization')?.replace('Bearer ', '');

    console.log('Auth/me endpoint called, token found:', !!token);

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
      console.log('Token decoded, userId:', decoded.userId);
    } catch (jwtError: any) {
      console.error('JWT verification failed:', jwtError.name, jwtError.message);
      if (jwtError.name === 'JsonWebTokenError' || jwtError.name === 'TokenExpiredError' || jwtError.name === 'NotBeforeError') {
        return NextResponse.json(
          { error: 'Invalid or expired authentication token' },
          { status: 401 }
        );
      }
      throw jwtError;
    }

    // Fetch user details with vendor information
    const user = await db.user.findFirst({
      where: { 
        id: decoded.userId,
        deletedAt: null
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
        vendorStaff: {
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
          }
        }
      },
    });

    if (!user) {
      // Check if user exists but is soft-deleted
      const deletedUser = await db.user.findFirst({
        where: { id: decoded.userId },
        select: { id: true, email: true, deletedAt: true }
      });
      
      if (deletedUser) {
        console.error('User found but is soft-deleted:', deletedUser.email, deletedUser.deletedAt);
        return NextResponse.json(
          { error: 'User account has been deleted' },
          { status: 401 }
        );
      }
      
      console.error('User not found in database for userId:', decoded.userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      );
    }

    console.log('User found:', user.email, user.role);

    // Extract vendor info from vendorStaff relation
    const vendorStaff = user.vendorStaff?.[0];
    const vendorId = vendorStaff?.vendorId || null;
    const vendor = vendorStaff?.vendor || null;

    // Remove vendorStaff from response as it's an internal relation
    const { vendorStaff: _, ...userWithoutVendorStaff } = user;

    const response = NextResponse.json({
      user: {
        ...userWithoutVendorStaff,
        vendorId,
        vendor
      },
    });
    console.log('Returning successful response');
    return response;
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
}