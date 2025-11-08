import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export type UserRole = 'CUSTOMER' | 'VENDOR_ADMIN' | 'VENDOR_STAFF' | 'PLATFORM_ADMIN';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  vendorId?: string | null;
  isActive: boolean;
}

/**
 * Extracts and validates JWT token from request
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Get token from cookie or Authorization header
    const token = request.cookies.get('auth-token')?.value ||
                 request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    // Fetch user details with role and vendor information
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        vendorStaff: {
          select: {
            vendorId: true
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      vendorId: user.vendorStaff?.[0]?.vendorId || null,
      isActive: user.isActive
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Checks if user has required role(s)
 */
export function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Authorization middleware to require specific roles
 */
export async function requireRole(
  request: NextRequest,
  requiredRoles: UserRole[]
): Promise<{ user: AuthenticatedUser } | never> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    throw new AuthorizationError('Authentication required', 'AUTH_REQUIRED');
  }

  if (!hasRequiredRole(user.role, requiredRoles)) {
    throw new AuthorizationError(
      `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      'INSUFFICIENT_PERMISSIONS'
    );
  }

  return { user };
}

/**
 * Authorization middleware for platform admin only
 */
export async function requireAdmin(request: NextRequest): Promise<{ user: AuthenticatedUser } | never> {
  return requireRole(request, ['PLATFORM_ADMIN']);
}

/**
 * Authorization middleware for vendor admin and staff
 */
export async function requireVendorAccess(request: NextRequest): Promise<{ user: AuthenticatedUser } | never> {
  return requireRole(request, ['VENDOR_ADMIN', 'VENDOR_STAFF']);
}

/**
 * Authorization middleware for vendor admin only
 */
export async function requireVendorAdmin(request: NextRequest): Promise<{ user: AuthenticatedUser } | never> {
  return requireRole(request, ['VENDOR_ADMIN']);
}

/**
 * Authorization middleware to ensure user can access specific vendor's resources
 */
export async function requireVendorOwnership(
  request: NextRequest,
  vendorId: string,
  allowedRoles: UserRole[] = ['VENDOR_ADMIN', 'VENDOR_STAFF']
): Promise<{ user: AuthenticatedUser } | never> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    throw new AuthorizationError('Authentication required', 'AUTH_REQUIRED');
  }

  // Platform admins can access any vendor
  if (user.role === 'PLATFORM_ADMIN') {
    return { user };
  }

  // Check if user has one of the allowed roles
  if (!hasRequiredRole(user.role, allowedRoles)) {
    throw new AuthorizationError(
      `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      'INSUFFICIENT_PERMISSIONS'
    );
  }

  // Vendor users can only access their own vendor
  if (!user.vendorId || user.vendorId !== vendorId) {
    throw new AuthorizationError(
      'Access denied. You can only access your own vendor resources.',
      'VENDOR_OWNERSHIP_REQUIRED'
    );
  }

  return { user };
}

/**
 * Custom authorization error class
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Helper function to create NextResponse from AuthorizationError
 */
export function createAuthErrorResponse(error: AuthorizationError): Response {
  return new Response(
    JSON.stringify({
      error: error.message,
      code: error.code
    }),
    {
      status: error.statusCode,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}