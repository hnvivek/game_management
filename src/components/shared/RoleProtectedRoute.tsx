"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "./LoadingSpinner";
import { UserRole } from "@/lib/auth/authorize";
import { useAuth as useAuthContext } from "@/components/features/auth/AuthProvider";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles: UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireOwnership?: {
    vendorId?: string;
    userId?: string;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  vendorId?: string | null;
  isActive: boolean;
}

export function RoleProtectedRoute({
  children,
  requiredRoles,
  fallback,
  redirectTo = "/auth/signin",
  requireOwnership,
}: RoleProtectedRouteProps) {
  const { user: authUser, isLoading: authLoading } = useAuthContext();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return;
    }

    // If no user, redirect to login
    if (!authUser) {
      router.push(redirectTo);
      return;
    }

    const currentUser: User = {
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
      role: authUser.role as UserRole,
      vendorId: (authUser as any).vendorId || null,
      isActive: authUser.isActive
    };

    // Check if user has required role
    if (!requiredRoles.includes(currentUser.role)) {
      setError(`Access denied. Required roles: ${requiredRoles.join(", ")}`);
      return;
    }

    // Check ownership requirements if specified
    if (requireOwnership) {
      if (requireOwnership.vendorId && currentUser.role !== 'PLATFORM_ADMIN') {
        if (!currentUser.vendorId || currentUser.vendorId !== requireOwnership.vendorId) {
          setError("Access denied. You can only access your own vendor resources.");
          return;
        }
      }

      if (requireOwnership.userId && currentUser.id !== requireOwnership.userId) {
        setError("Access denied. You can only access your own resources.");
        return;
      }
    }

    setIsAuthorized(true);
  }, [authUser, authLoading, router, redirectTo, requiredRoles, requireOwnership]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return fallback || null;
  }

  return <>{children}</>;
}

/**
 * Convenience component for admin-only routes
 */
export function AdminProtectedRoute({
  children,
  ...props
}: Omit<RoleProtectedRouteProps, 'requiredRoles'>) {
  return (
    <RoleProtectedRoute requiredRoles={['PLATFORM_ADMIN']} {...props}>
      {children}
    </RoleProtectedRoute>
  );
}

/**
 * Convenience component for vendor access routes (admin and staff)
 */
export function VendorProtectedRoute({
  children,
  ...props
}: Omit<RoleProtectedRouteProps, 'requiredRoles'>) {
  return (
    <RoleProtectedRoute requiredRoles={['VENDOR_ADMIN', 'VENDOR_STAFF']} {...props}>
      {children}
    </RoleProtectedRoute>
  );
}

/**
 * Convenience component for vendor admin-only routes
 */
export function VendorAdminProtectedRoute({
  children,
  ...props
}: Omit<RoleProtectedRouteProps, 'requiredRoles'>) {
  return (
    <RoleProtectedRoute requiredRoles={['VENDOR_ADMIN']} {...props}>
      {children}
    </RoleProtectedRoute>
  );
}

/**
 * Hook to get current user and check permissions
 * Uses AuthProvider context instead of making separate API calls
 */
export function useRoleAuth() {
  const { user: authUser, isLoading } = useAuthContext();

  const user: User | null = authUser ? {
    id: authUser.id,
    email: authUser.email,
    name: authUser.name,
    role: authUser.role as UserRole,
    vendorId: (authUser as any).vendorId || null,
    isActive: authUser.isActive
  } : null;

  const hasRole = (role: UserRole) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  };

  const canAccessVendor = (vendorId: string) => {
    if (!user) return false;
    if (user.role === 'PLATFORM_ADMIN') return true;
    return user.vendorId === vendorId;
  };

  return {
    user,
    isLoading,
    hasRole,
    hasAnyRole,
    canAccessVendor
  };
}