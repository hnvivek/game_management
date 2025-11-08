"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "./LoadingSpinner";
import { UserRole } from "@/lib/auth/authorize";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: 'include', // Important for cookies
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push(redirectTo);
          } else {
            setError("Failed to verify authentication");
          }
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        const currentUser: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role as UserRole,
          vendorId: data.user.vendorStaff?.[0]?.vendorId || null,
          isActive: data.user.isActive
        };

        setUser(currentUser);

        // Check if user has required role
        if (!requiredRoles.includes(currentUser.role)) {
          setError(`Access denied. Required roles: ${requiredRoles.join(", ")}`);
          setIsLoading(false);
          return;
        }

        // Check ownership requirements if specified
        if (requireOwnership) {
          if (requireOwnership.vendorId && currentUser.role !== 'PLATFORM_ADMIN') {
            if (!currentUser.vendorId || currentUser.vendorId !== requireOwnership.vendorId) {
              setError("Access denied. You can only access your own vendor resources.");
              setIsLoading(false);
              return;
            }
          }

          if (requireOwnership.userId && currentUser.id !== requireOwnership.userId) {
            setError("Access denied. You can only access your own resources.");
            setIsLoading(false);
            return;
          }
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        setError("Failed to verify authentication");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, redirectTo, requiredRoles, requireOwnership]);

  if (isLoading) {
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
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: 'include', // Important for cookies
        });
        if (response.ok) {
          const data = await response.json();
          setUser({
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role as UserRole,
            vendorId: data.user.vendorStaff?.[0]?.vendorId || null,
            isActive: data.user.isActive
          });
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

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