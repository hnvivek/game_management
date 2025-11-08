import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withVendorOwnershipAuth, ApiResponse } from '@/lib/auth/api-auth';
import { withPerformanceTracking } from '@/lib/middleware/performance';

// POST /api/vendors/[vendorId]/venues/[venueId]/toggle-status - Toggle venue active status
export const POST = withPerformanceTracking(
  withVendorOwnershipAuth(async (request: NextRequest, { user, params }) => {
    try {
      // Params may be a Promise (Next.js 15) or already resolved by wrapper
      const resolvedParams = params instanceof Promise ? await params : (params || {});
      const { vendorId, venueId } = resolvedParams;

      if (!venueId) {
        return ApiResponse.error('Venue ID is required', 'MISSING_VENUE_ID', 400);
      }

      // Optimized: Use a single transaction to check and update
      // This reduces round trips and ensures atomicity
      const updatedVenue = await db.$transaction(async (tx) => {
        // First, verify venue exists and belongs to vendor
        const existingVenue = await tx.venue.findFirst({
          where: {
            id: venueId,
            vendorId,
            deletedAt: null
          },
          select: { id: true, name: true, isActive: true }
        });

        if (!existingVenue) {
          throw new Error('Venue not found');
        }

        // Update in the same transaction
        return await tx.venue.update({
          where: { id: venueId },
          data: { isActive: !existingVenue.isActive },
          select: {
            id: true,
            name: true,
            isActive: true,
            updatedAt: true
          }
        });
      });

      return ApiResponse.success(updatedVenue, {
        message: `Venue ${updatedVenue.isActive ? 'activated' : 'deactivated'} successfully`
      });

    } catch (error) {
      console.error('Error toggling venue status:', error);
      
      if (error instanceof Error && error.message === 'Venue not found') {
        return ApiResponse.notFound('Venue');
      }
      
      return ApiResponse.error('Failed to toggle venue status', 'VENUE_STATUS_ERROR', 500);
    }
  }),
  'POST /api/vendors/[vendorId]/venues/[venueId]/toggle-status'
);

