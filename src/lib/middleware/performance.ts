import { NextRequest, NextResponse } from 'next/server'

interface PerformanceMetrics {
  endpoint: string
  method: string
  duration: number
  timestamp: Date
}

// In-memory store for performance metrics (use Redis in production)
const performanceMetrics: PerformanceMetrics[] = []

// Keep only last 1000 entries
const MAX_METRICS = 1000

export function withPerformanceTracking(
  handler: (req: NextRequest) => Promise<NextResponse>,
  endpointName?: string
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const start = Date.now()
    const url = new URL(req.url)
    const endpoint = endpointName || url.pathname
    const method = req.method

    try {
      const response = await handler(req)
      const duration = Date.now() - start

      // Track metrics
      performanceMetrics.push({
        endpoint,
        method,
        duration,
        timestamp: new Date(),
      })

      // Keep only recent metrics
      if (performanceMetrics.length > MAX_METRICS) {
        performanceMetrics.shift()
      }

      // Log slow requests
      if (duration > 1000) {
        console.warn(`⚠️  Slow API: ${method} ${endpoint} took ${duration}ms`)
      } else if (duration > 500) {
        console.info(`ℹ️  Moderate API: ${method} ${endpoint} took ${duration}ms`)
      }

      // Add performance headers
      response.headers.set('X-Response-Time', `${duration}ms`)
      response.headers.set('X-Endpoint', endpoint)

      return response
    } catch (error) {
      const duration = Date.now() - start
      console.error(`❌ Error in ${method} ${endpoint} after ${duration}ms:`, error)
      throw error
    }
  }
}

// Get performance statistics
export function getPerformanceStats() {
  if (performanceMetrics.length === 0) {
    return {
      totalRequests: 0,
      averageDuration: 0,
      slowestEndpoints: [],
      fastestEndpoints: [],
    }
  }

  const totalDuration = performanceMetrics.reduce((sum, m) => sum + m.duration, 0)
  const averageDuration = totalDuration / performanceMetrics.length

  // Group by endpoint
  const endpointStats = performanceMetrics.reduce((acc, metric) => {
    const key = `${metric.method} ${metric.endpoint}`
    if (!acc[key]) {
      acc[key] = {
        endpoint: key,
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
      }
    }
    acc[key].count++
    acc[key].totalDuration += metric.duration
    acc[key].minDuration = Math.min(acc[key].minDuration, metric.duration)
    acc[key].maxDuration = Math.max(acc[key].maxDuration, metric.duration)
    return acc
  }, {} as Record<string, any>)

  const endpointArray = Object.values(endpointStats).map((stat: any) => ({
    ...stat,
    averageDuration: stat.totalDuration / stat.count,
  }))

  const slowestEndpoints = [...endpointArray]
    .sort((a, b) => b.averageDuration - a.averageDuration)
    .slice(0, 10)

  const fastestEndpoints = [...endpointArray]
    .sort((a, b) => a.averageDuration - b.averageDuration)
    .slice(0, 10)

  return {
    totalRequests: performanceMetrics.length,
    averageDuration: Math.round(averageDuration),
    slowestEndpoints,
    fastestEndpoints,
    recentMetrics: performanceMetrics.slice(-20), // Last 20 requests
  }
}

// Clear metrics (useful for testing)
export function clearPerformanceMetrics() {
  performanceMetrics.length = 0
}

