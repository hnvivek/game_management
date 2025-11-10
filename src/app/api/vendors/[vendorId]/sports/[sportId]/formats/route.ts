import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withVendorOwnershipAuth, ApiResponse } from '@/lib/auth/api-auth'
import { z } from 'zod'

// Schema for creating/updating formats
const formatSchema = z.object({
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  playersPerTeam: z.number().int().positive(),
  maxTotalPlayers: z.number().int().positive().optional().nullable(),
  length: z.number().positive().optional().nullable(),
  width: z.number().positive().optional().nullable(),
  isActive: z.boolean().optional().default(true)
}).refine(data => {
  if (data.maxTotalPlayers !== null && data.maxTotalPlayers !== undefined) {
    return data.maxTotalPlayers >= data.playersPerTeam * 2
  }
  return true
}, {
  message: 'Max total players must be at least twice the players per team'
})

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
      if (vendorIndex !== -1 && sportIndex !== -1) {
        resolvedParams.vendorId = pathParts[vendorIndex + 1];
        resolvedParams.sportId = pathParts[sportIndex + 1];
      }
    }
    
    const { vendorId, sportId } = resolvedParams;

    if (!vendorId || !sportId) {
      return ApiResponse.error('Vendor ID and Sport ID are required', 'MISSING_PARAMS', 400)
    }

    // Find the sport by name or ID
    const sport = await db.sportType.findFirst({
      where: {
        OR: [
          { name: sportId },
          { id: sportId }
        ],
        isActive: true
      }
    })

    if (!sport) {
      return ApiResponse.notFound('Sport')
    }

    // Get formats for this vendor and sport (include both active and inactive)
    const formats = await db.formatType.findMany({
      where: {
        vendorId: vendorId,
        sportId: sport.id
      },
      orderBy: [
        { isActive: 'desc' }, // Active formats first
        { playersPerTeam: 'desc' },
        { name: 'asc' }
      ]
    })

    return ApiResponse.success({
      sport: {
        id: sport.id,
        name: sport.name,
        displayName: sport.displayName,
        icon: sport.icon
      },
      formats: formats.map(format => ({
        id: format.id,
        name: format.name,
        displayName: format.displayName,
        description: format.description,
        playersPerTeam: format.playersPerTeam,
        maxTotalPlayers: format.maxTotalPlayers,
        length: format.length,
        width: format.width,
        isActive: format.isActive
      }))
    })

  } catch (error) {
    console.error('Error fetching vendor sport formats:', error)
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Failed to fetch formats: ${error instanceof Error ? error.message : String(error)}`
      : 'Failed to fetch formats'
    return ApiResponse.error(errorMessage, 'FORMAT_FETCH_ERROR', 500)
  }
})

// POST /api/vendors/[vendorId]/sports/[sportId]/formats - Create new format
export const POST = withVendorOwnershipAuth(async (
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
      if (vendorIndex !== -1 && sportIndex !== -1) {
        resolvedParams.vendorId = pathParts[vendorIndex + 1];
        resolvedParams.sportId = pathParts[sportIndex + 1];
      }
    }
    
    const { vendorId, sportId } = resolvedParams;

    if (!vendorId || !sportId) {
      return ApiResponse.error('Vendor ID and Sport ID are required', 'MISSING_PARAMS', 400)
    }

    const body = await request.json()
    const validatedData = formatSchema.parse(body)

    // Find the sport by name or ID
    const sport = await db.sportType.findFirst({
      where: {
        OR: [
          { name: sportId },
          { id: sportId }
        ],
        isActive: true
      }
    })

    if (!sport) {
      return ApiResponse.notFound('Sport')
    }

    // Check if format name already exists for this vendor and sport
    const existingFormat = await db.formatType.findUnique({
      where: {
        vendorId_sportId_name: {
          vendorId,
          sportId: sport.id,
          name: validatedData.name
        }
      }
    })

    if (existingFormat) {
      return ApiResponse.error(
        `Format with name "${validatedData.name}" already exists for this sport`,
        'FORMAT_EXISTS',
        409
      )
    }

    // Create the format
    const format = await db.formatType.create({
      data: {
        vendorId,
        sportId: sport.id,
        name: validatedData.name,
        displayName: validatedData.displayName,
        description: validatedData.description ?? null,
        playersPerTeam: validatedData.playersPerTeam,
        maxTotalPlayers: validatedData.maxTotalPlayers ?? validatedData.playersPerTeam * 2,
        length: validatedData.length ?? null,
        width: validatedData.width ?? null,
        isActive: validatedData.isActive ?? true
      }
    })

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
        isActive: format.isActive
      }
    }, 'Format created successfully', 201)

  } catch (error) {
    console.error('Error creating format:', error)
    
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', JSON.stringify(error.errors, null, 2))
      return ApiResponse.error(
        `Validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        'VALIDATION_ERROR',
        400
      )
    }

    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Failed to create format: ${error instanceof Error ? error.message : String(error)}`
      : 'Failed to create format'
    
    console.error('Full error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      error
    })
    
    return ApiResponse.error(errorMessage, 'FORMAT_CREATE_ERROR', 500)
  }
})

