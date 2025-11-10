import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withVendorOwnershipAuth, ApiResponse } from '@/lib/auth/api-auth'
import { z } from 'zod'

// Schema for updating formats
const updateFormatSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  playersPerTeam: z.number().int().positive().optional(),
  maxTotalPlayers: z.number().int().positive().optional().nullable(),
  length: z.number().positive().optional().nullable(),
  width: z.number().positive().optional().nullable(),
  isActive: z.boolean().optional()
}).refine(data => {
  if (data.playersPerTeam !== undefined && data.maxTotalPlayers !== null && data.maxTotalPlayers !== undefined) {
    return data.maxTotalPlayers >= data.playersPerTeam * 2
  }
  return true
}, {
  message: 'Max total players must be at least twice the players per team'
})

// GET /api/vendors/[vendorId]/sports/[sportId]/formats/[formatId] - Get format details
export const GET = withVendorOwnershipAuth(async (
  request: NextRequest,
  { user, params }
) => {
  try {
    let resolvedParams: any = {};
    try {
      resolvedParams = params instanceof Promise ? await params : (params || {});
    } catch (error) {
      const pathParts = request.nextUrl.pathname.split('/');
      const vendorIndex = pathParts.indexOf('vendors');
      const sportIndex = pathParts.indexOf('sports');
      const formatIndex = pathParts.indexOf('formats');
      if (vendorIndex !== -1 && sportIndex !== -1 && formatIndex !== -1) {
        resolvedParams.vendorId = pathParts[vendorIndex + 1];
        resolvedParams.sportId = pathParts[sportIndex + 1];
        resolvedParams.formatId = pathParts[formatIndex + 1];
      }
    }
    
    const { vendorId, sportId, formatId } = resolvedParams;

    if (!vendorId || !sportId || !formatId) {
      return ApiResponse.error('Vendor ID, Sport ID, and Format ID are required', 'MISSING_PARAMS', 400)
    }

    const format = await db.formatType.findUnique({
      where: { id: formatId },
      include: {
        sport: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        _count: {
          select: {
            courtFormats: true,
            bookings: true
          }
        }
      }
    })

    if (!format) {
      return ApiResponse.notFound('Format')
    }

    // Verify format belongs to vendor
    if (format.vendorId !== vendorId) {
      return ApiResponse.error('Format does not belong to this vendor', 'FORBIDDEN', 403)
    }

    return ApiResponse.success({
      format: {
        id: format.id,
        name: format.name,
        displayName: format.displayName,
        description: format.description,
        playersPerTeam: format.playersPerTeam,
        maxTotalPlayers: format.maxTotalPlayers,
        length: format.length,
        width: format.width,
        isActive: format.isActive,
        sport: format.sport,
        usage: {
          courts: format._count.courtFormats,
          bookings: format._count.bookings
        }
      }
    })

  } catch (error) {
    console.error('Error fetching format:', error)
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Failed to fetch format: ${error instanceof Error ? error.message : String(error)}`
      : 'Failed to fetch format'
    return ApiResponse.error(errorMessage, 'FORMAT_FETCH_ERROR', 500)
  }
})

// PUT /api/vendors/[vendorId]/sports/[sportId]/formats/[formatId] - Update format
export const PUT = withVendorOwnershipAuth(async (
  request: NextRequest,
  { user, params }
) => {
  try {
    let resolvedParams: any = {};
    try {
      resolvedParams = params instanceof Promise ? await params : (params || {});
    } catch (error) {
      const pathParts = request.nextUrl.pathname.split('/');
      const vendorIndex = pathParts.indexOf('vendors');
      const sportIndex = pathParts.indexOf('sports');
      const formatIndex = pathParts.indexOf('formats');
      if (vendorIndex !== -1 && sportIndex !== -1 && formatIndex !== -1) {
        resolvedParams.vendorId = pathParts[vendorIndex + 1];
        resolvedParams.sportId = pathParts[sportIndex + 1];
        resolvedParams.formatId = pathParts[formatIndex + 1];
      }
    }
    
    const { vendorId, sportId, formatId } = resolvedParams;

    if (!vendorId || !sportId || !formatId) {
      return ApiResponse.error('Vendor ID, Sport ID, and Format ID are required', 'MISSING_PARAMS', 400)
    }

    const body = await request.json()
    const validatedData = updateFormatSchema.parse(body)

    // Check if format exists and belongs to vendor
    const existingFormat = await db.formatType.findUnique({
      where: { id: formatId },
      include: {
        _count: {
          select: {
            courtFormats: true,
            bookings: true
          }
        }
      }
    })

    if (!existingFormat) {
      return ApiResponse.notFound('Format')
    }

    if (existingFormat.vendorId !== vendorId) {
      return ApiResponse.error('Format does not belong to this vendor', 'FORBIDDEN', 403)
    }

    // If updating name, check for conflicts
    if (validatedData.name && validatedData.name !== existingFormat.name) {
      const nameConflict = await db.formatType.findUnique({
        where: {
          vendorId_sportId_name: {
            vendorId,
            sportId: existingFormat.sportId,
            name: validatedData.name
          }
        }
      })

      if (nameConflict) {
        return ApiResponse.error(
          `Format with name "${validatedData.name}" already exists for this sport`,
          'FORMAT_NAME_EXISTS',
          409
        )
      }
    }

    // Warn if format is in use (but allow editing)
    const isInUse = existingFormat._count.courtFormats > 0 || existingFormat._count.bookings > 0

    // Update the format
    const updatedFormat = await db.formatType.update({
      where: { id: formatId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.displayName && { displayName: validatedData.displayName }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.playersPerTeam !== undefined && { playersPerTeam: validatedData.playersPerTeam }),
        ...(validatedData.maxTotalPlayers !== undefined && { 
          maxTotalPlayers: validatedData.maxTotalPlayers || (validatedData.playersPerTeam || existingFormat.playersPerTeam) * 2 
        }),
        ...(validatedData.length !== undefined && { length: validatedData.length }),
        ...(validatedData.width !== undefined && { width: validatedData.width }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive })
      }
    })

    return ApiResponse.success({
      format: {
        id: updatedFormat.id,
        name: updatedFormat.name,
        displayName: updatedFormat.displayName,
        description: updatedFormat.description,
        playersPerTeam: updatedFormat.playersPerTeam,
        maxTotalPlayers: updatedFormat.maxTotalPlayers,
        length: updatedFormat.length,
        width: updatedFormat.width,
        isActive: updatedFormat.isActive
      },
      warning: isInUse ? 'This format is currently in use by courts or bookings. Changes will affect all related courts.' : undefined
    }, 'Format updated successfully')

  } catch (error) {
    console.error('Error updating format:', error)
    
    if (error instanceof z.ZodError) {
      return ApiResponse.error(
        `Validation failed: ${error.errors.map(e => e.message).join(', ')}`,
        'VALIDATION_ERROR',
        400
      )
    }

    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Failed to update format: ${error instanceof Error ? error.message : String(error)}`
      : 'Failed to update format'
    return ApiResponse.error(errorMessage, 'FORMAT_UPDATE_ERROR', 500)
  }
})

// DELETE /api/vendors/[vendorId]/sports/[sportId]/formats/[formatId] - Delete format
export const DELETE = withVendorOwnershipAuth(async (
  request: NextRequest,
  { user, params }
) => {
  try {
    let resolvedParams: any = {};
    try {
      resolvedParams = params instanceof Promise ? await params : (params || {});
    } catch (error) {
      const pathParts = request.nextUrl.pathname.split('/');
      const vendorIndex = pathParts.indexOf('vendors');
      const sportIndex = pathParts.indexOf('sports');
      const formatIndex = pathParts.indexOf('formats');
      if (vendorIndex !== -1 && sportIndex !== -1 && formatIndex !== -1) {
        resolvedParams.vendorId = pathParts[vendorIndex + 1];
        resolvedParams.sportId = pathParts[sportIndex + 1];
        resolvedParams.formatId = pathParts[formatIndex + 1];
      }
    }
    
    const { vendorId, sportId, formatId } = resolvedParams;

    if (!vendorId || !sportId || !formatId) {
      return ApiResponse.error('Vendor ID, Sport ID, and Format ID are required', 'MISSING_PARAMS', 400)
    }

    // Check if format exists and belongs to vendor
    const existingFormat = await db.formatType.findUnique({
      where: { id: formatId },
      include: {
        _count: {
          select: {
            courtFormats: true,
            bookings: true
          }
        }
      }
    })

    if (!existingFormat) {
      return ApiResponse.notFound('Format')
    }

    if (existingFormat.vendorId !== vendorId) {
      return ApiResponse.error('Format does not belong to this vendor', 'FORBIDDEN', 403)
    }

    // Check if format is in use
    const isInUse = existingFormat._count.courtFormats > 0 || existingFormat._count.bookings > 0

    if (isInUse) {
      return ApiResponse.error(
        'Cannot delete format that is in use by courts or bookings. Please remove it from all courts first.',
        'FORMAT_IN_USE',
        400
      )
    }

    // Delete the format
    await db.formatType.delete({
      where: { id: formatId }
    })

    return ApiResponse.success(
      { id: formatId },
      'Format deleted successfully'
    )

  } catch (error) {
    console.error('Error deleting format:', error)
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Failed to delete format: ${error instanceof Error ? error.message : String(error)}`
      : 'Failed to delete format'
    return ApiResponse.error(errorMessage, 'FORMAT_DELETE_ERROR', 500)
  }
})

