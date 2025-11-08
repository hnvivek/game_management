import { useRef, useCallback } from 'react'
import { VendorBookingFilters } from '@/lib/api/vendor/bookings'

interface Booking {
  id: string
  [key: string]: any
}

interface CacheEntry {
  filters: VendorBookingFilters
  data: Booking[]
  fetchedAt: Date
  expiresAt: Date
  totalCount?: number
}

interface DateRange {
  dateFrom?: string
  dateTo?: string
}

/**
 * Shared cache hook for bookings data
 * Allows table and calendar views to share cached booking data
 */
export function useBookingsCache() {
  const cache = useRef<Map<string, CacheEntry>>(new Map())
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Generate cache key from filters (excluding pagination for calendar compatibility)
   * Note: vendorId should be passed separately and included in the key
   */
  const getCacheKey = useCallback((filters: VendorBookingFilters, vendorId?: string): string => {
    // Create a normalized filter object (exclude page/limit for cache key)
    const normalizedFilters = {
      vendorId: vendorId || filters.vendorId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      search: filters.search,
      status: filters.status,
      venueId: filters.venueId,
      courtId: filters.courtId,
      sportId: filters.sportId,
      paymentStatus: filters.paymentStatus,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }
    return JSON.stringify(normalizedFilters)
  }, [])

  /**
   * Check if date ranges overlap
   */
  const dateRangesOverlap = useCallback(
    (range1: DateRange, range2: DateRange): boolean => {
      if (!range1.dateFrom || !range1.dateTo || !range2.dateFrom || !range2.dateTo) {
        return false
      }
      return range1.dateFrom <= range2.dateTo && range1.dateTo >= range2.dateFrom
    },
    []
  )

  /**
   * Filter bookings by date range
   */
  const filterByDateRange = useCallback(
    (bookings: Booking[], dateFrom?: string, dateTo?: string): Booking[] => {
      if (!dateFrom && !dateTo) return bookings

      return bookings.filter((booking) => {
        const bookingDate = booking.startTime
          ? new Date(booking.startTime).toISOString().split('T')[0]
          : null

        if (!bookingDate) return false

        if (dateFrom && bookingDate < dateFrom) return false
        if (dateTo && bookingDate > dateTo) return false

        return true
      })
    },
    []
  )

  /**
   * Get cached data for exact filter match
   */
  const getCached = useCallback(
    (filters: VendorBookingFilters, vendorId?: string): Booking[] | null => {
      const key = getCacheKey(filters, vendorId)
      const entry = cache.current.get(key)

      if (entry && entry.expiresAt > new Date()) {
        // If cache has date range, filter to match requested range
        if (filters.dateFrom || filters.dateTo) {
          return filterByDateRange(entry.data, filters.dateFrom, filters.dateTo)
        }
        return entry.data
      }

      return null
    },
    [getCacheKey, filterByDateRange]
  )

  /**
   * Find overlapping cached data for date range
   * Useful when calendar needs data but table has cached a broader range
   */
  const findOverlappingRange = useCallback(
    (filters: VendorBookingFilters, vendorId?: string): Booking[] | null => {
      if (!filters.dateFrom || !filters.dateTo) return null

      // Check all cache entries for overlapping date ranges
      for (const [key, entry] of cache.current.entries()) {
        // Skip if expired
        if (entry.expiresAt <= new Date()) continue

        // Check if date ranges overlap
        const entryRange: DateRange = {
          dateFrom: entry.filters.dateFrom,
          dateTo: entry.filters.dateTo,
        }
        const requestedRange: DateRange = {
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        }

        if (dateRangesOverlap(entryRange, requestedRange)) {
          // Check if other filters match (except date range)
          const entryFilters = { ...entry.filters }
          const requestedFilters = { ...filters }
          delete entryFilters.dateFrom
          delete entryFilters.dateTo
          delete requestedFilters.dateFrom
          delete requestedFilters.dateTo

          const entryKey = JSON.stringify(entryFilters)
          const requestedKey = JSON.stringify(requestedFilters)

          if (entryKey === requestedKey) {
            // Filters match, filter to requested date range
            return filterByDateRange(entry.data, filters.dateFrom, filters.dateTo)
          }
        }
      }

      return null
    },
    [dateRangesOverlap, filterByDateRange]
  )

  /**
   * Store data in cache
   */
  const setCached = useCallback(
    (filters: VendorBookingFilters, data: Booking[], totalCount?: number, vendorId?: string) => {
      const key = getCacheKey(filters, vendorId)
      const now = new Date()

      cache.current.set(key, {
        filters: { ...filters },
        data: [...data], // Store copy
        fetchedAt: now,
        expiresAt: new Date(now.getTime() + CACHE_DURATION),
        totalCount,
      })
    },
    [getCacheKey]
  )

  /**
   * Clear cache entries matching filters (for invalidation)
   */
  const clearCache = useCallback(
    (filters?: Partial<VendorBookingFilters>) => {
      if (!filters) {
        // Clear all cache
        cache.current.clear()
        return
      }

      // Clear entries matching the filter pattern
      const filterKey = JSON.stringify(filters)
      for (const [key, entry] of cache.current.entries()) {
        const entryKey = JSON.stringify(entry.filters)
        // If any filter matches, clear it
        if (entryKey.includes(filterKey) || filterKey.includes(entryKey)) {
          cache.current.delete(key)
        }
      }
    },
    []
  )

  /**
   * Clear expired entries
   */
  const clearExpired = useCallback(() => {
    const now = new Date()
    for (const [key, entry] of cache.current.entries()) {
      if (entry.expiresAt <= now) {
        cache.current.delete(key)
      }
    }
  }, [])

  /**
   * Get cache statistics (for debugging)
   */
  const getCacheStats = useCallback(() => {
    clearExpired()
    return {
      size: cache.current.size,
      entries: Array.from(cache.current.entries()).map(([key, entry]) => ({
        key,
        dataCount: entry.data.length,
        fetchedAt: entry.fetchedAt,
        expiresAt: entry.expiresAt,
        isExpired: entry.expiresAt <= new Date(),
      })),
    }
  }, [clearExpired])

  return {
    getCached,
    setCached,
    findOverlappingRange,
    clearCache,
    clearExpired,
    getCacheStats,
  }
}

