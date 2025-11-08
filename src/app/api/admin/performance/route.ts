import { NextRequest, NextResponse } from 'next/server'
import { getPerformanceStats } from '@/lib/middleware/performance'

/**
 * Performance monitoring endpoint
 * GET /api/admin/performance - Get API performance statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication check here
    // const user = await getCurrentUser(request)
    // if (!user || user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const stats = getPerformanceStats()

    return NextResponse.json({
      success: true,
      data: stats,
      meta: {
        message: 'Performance statistics retrieved successfully',
      },
    })
  } catch (error) {
    console.error('Error fetching performance stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch performance statistics',
      },
      { status: 500 }
    )
  }
}

