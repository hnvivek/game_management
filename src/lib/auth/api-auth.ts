import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  requireRole,
  requireAdmin,
  requireVendorAccess,
  requireVendorAdmin,
  requireVendorOwnership,
  AuthorizationError,
  createAuthErrorResponse,
  AuthenticatedUser,
  UserRole
} from './authorize';

/**
 * Higher-order function to protect API routes with role-based authorization
 */
export function withAuth<T = any>(
  handler: (request: NextRequest, context: { user: AuthenticatedUser; params?: Promise<any> }) => Promise<NextResponse>,
  options: {
    requiredRoles?: UserRole[];
    requireVendorOwnership?: boolean;
    allowedRoles?: UserRole[];
  } = {}
) {
  return async (request: NextRequest, context?: { params?: Promise<any> }): Promise<NextResponse> => {
    let resolvedParams: any = {};
    try {
      let user: AuthenticatedUser;

      // Await params if they exist (Next.js 15 requirement)
      if (context?.params) {
        try {
          resolvedParams = await context.params;
        } catch (paramsError) {
          console.error('Error resolving params:', paramsError);
          // Try to extract from URL if params resolution fails
          const pathParts = request.nextUrl.pathname.split('/');
          if (pathParts.length >= 4) {
            resolvedParams = { vendorId: pathParts[3] };
            if (pathParts.length >= 6) {
              resolvedParams.venueId = pathParts[5];
            }
          }
        }
      } else {
        // If no params in context, try to extract from URL
        const pathParts = request.nextUrl.pathname.split('/');
        if (pathParts.length >= 4) {
          resolvedParams = { vendorId: pathParts[3] };
          if (pathParts.length >= 6) {
            resolvedParams.venueId = pathParts[5];
          }
        }
      }

      // Check if vendor ownership is required
      if (options.requireVendorOwnership) {
        const vendorId = resolvedParams?.vendorId || request.nextUrl.pathname.split('/')[3];
        if (!vendorId) {
          throw new AuthorizationError('Vendor ID is required', 'VENDOR_ID_REQUIRED', 400);
        }

        const result = await requireVendorOwnership(request, vendorId, options.allowedRoles);
        user = result.user;
      }
      // Check if specific roles are required
      else if (options.requiredRoles) {
        const result = await requireRole(request, options.requiredRoles);
        user = result.user;
      }
      // Default: just get authenticated user
      else {
        const authUser = await getAuthenticatedUser(request);
        if (!authUser) {
          throw new AuthorizationError('Authentication required', 'AUTH_REQUIRED', 401);
        }
        user = authUser;
      }

      // Pass params as Promise so handler can await it (Next.js 15 pattern)
      // But also provide resolvedParams for convenience
      return await handler(request, { 
        user, 
        params: context?.params || Promise.resolve(resolvedParams)
      });
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return createAuthErrorResponse(error);
      }

      console.error('API Auth middleware error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name,
        errorString: String(error),
        pathname: request.nextUrl.pathname,
        context: context ? Object.keys(context) : 'no context'
      });
      return NextResponse.json(
        { 
          error: 'Internal server error', 
          code: 'INTERNAL_ERROR',
          details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Convenience wrapper for admin-only routes
 */
export function withAdminAuth<T = any>(
  handler: (request: NextRequest, context: { user: AuthenticatedUser; params?: Promise<any> }) => Promise<NextResponse>
) {
  return withAuth(handler, { requiredRoles: ['PLATFORM_ADMIN'] });
}

/**
 * Convenience wrapper for vendor access routes (admin and staff)
 */
export function withVendorAuth<T = any>(
  handler: (request: NextRequest, context: { user: AuthenticatedUser; params?: Promise<any> }) => Promise<NextResponse>
) {
  return withAuth(handler, { requiredRoles: ['VENDOR_ADMIN', 'VENDOR_STAFF'] });
}

/**
 * Convenience wrapper for vendor admin-only routes
 */
export function withVendorAdminAuth<T = any>(
  handler: (request: NextRequest, context: { user: AuthenticatedUser; params?: Promise<any> }) => Promise<NextResponse>
) {
  return withAuth(handler, { requiredRoles: ['VENDOR_ADMIN'] });
}

/**
 * Convenience wrapper for vendor ownership routes
 */
export function withVendorOwnershipAuth<T = any>(
  handler: (request: NextRequest, context: { user: AuthenticatedUser; params?: Promise<any> }) => Promise<NextResponse>,
  allowedRoles: UserRole[] = ['VENDOR_ADMIN', 'VENDOR_STAFF']
) {
  return withAuth(handler, {
    requireVendorOwnership: true,
    allowedRoles
  });
}

/**
 * Middleware factory for creating custom role-based protection
 */
export function createRoleMiddleware(roles: UserRole[]) {
  return <T = any>(
    handler: (request: NextRequest, context: { user: AuthenticatedUser; params?: Promise<any> }) => Promise<NextResponse>
  ) => withAuth(handler, { requiredRoles: roles });
}

/**
 * Utility to extract user from request in API routes
 * Throws AuthorizationError if not authenticated
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new AuthorizationError('Authentication required', 'AUTH_REQUIRED', 401);
  }
  return user;
}

/**
 * Utility to check if user has specific permissions
 */
export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  // Define permission mapping based on roles
  const rolePermissions: Record<UserRole, string[]> = {
    'CUSTOMER': [
      'read:own_profile',
      'update:own_profile',
      'read:own_bookings',
      'create:bookings'
    ],
    'VENDOR_STAFF': [
      'read:vendor_profile',
      'read:vendor_venues',
      'read:vendor_bookings',
      'update:booking_status',
      'read:vendor_analytics'
    ],
    'VENDOR_ADMIN': [
      'read:vendor_profile',
      'update:vendor_profile',
      'read:vendor_venues',
      'create:vendor_venues',
      'update:vendor_venues',
      'delete:vendor_venues',
      'read:vendor_bookings',
      'update:booking_status',
      'read:vendor_analytics',
      'manage_vendor_staff',
      'manage_vendor_settings'
    ],
    'PLATFORM_ADMIN': [
      'read:all_users',
      'update:all_users',
      'delete:all_users',
      'read:all_vendors',
      'update:all_vendors',
      'delete:all_vendors',
      'read:all_bookings',
      'update:all_bookings',
      'read:platform_analytics',
      'manage_platform_settings',
      'approve_vendors',
      'suspend_vendors'
    ]
  };

  return rolePermissions[user.role]?.includes(permission) || false;
}

/**
 * API response helpers for consistent responses
 */
export const ApiResponse = {
  success: <T = any>(data: T, meta?: any): NextResponse => {
    return NextResponse.json({
      success: true,
      data,
      meta
    });
  },

  error: (message: string, code: string, status: number = 400): NextResponse => {
    return NextResponse.json({
      success: false,
      error: {
        message,
        code
      }
    }, { status });
  },

  notFound: (resource: string = 'Resource'): NextResponse => {
    return NextResponse.json({
      success: false,
      error: {
        message: `${resource} not found`,
        code: 'NOT_FOUND'
      }
    }, { status: 404 });
  },

  unauthorized: (message: string = 'Unauthorized'): NextResponse => {
    return NextResponse.json({
      success: false,
      error: {
        message,
        code: 'UNAUTHORIZED'
      }
    }, { status: 401 });
  },

  forbidden: (message: string = 'Forbidden'): NextResponse => {
    return NextResponse.json({
      success: false,
      error: {
        message,
        code: 'FORBIDDEN'
      }
    }, { status: 403 });
  }
};