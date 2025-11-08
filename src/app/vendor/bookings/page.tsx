'use client'

import { VendorBookingDataTable } from '@/components/features/vendor/VendorBookingDataTable'
import { VendorBookingCalendar } from '@/components/features/vendor/VendorBookingCalendar'
import { VendorLayout } from '@/components/features/vendor/VendorLayout'
import { BookingFiltersComponent, BookingFilters } from '@/components/features/vendor/BookingFilters'
import { BookingStatusLegend } from '@/components/features/vendor/BookingStatusLegend'
import { Button } from '@/components/ui/button'
import { Calendar, List, XCircle } from 'lucide-react'
import { useState, useCallback } from 'react'
import { useVendor } from '@/hooks/use-vendor'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export default function VendorBookingsPage() {
  const { vendorId } = useVendor()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [calendarError, setCalendarError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('calendar')

  // Get filters from URL or use defaults
  const getFilterFromUrl = (key: string, defaultValue: string = 'all') => {
    return searchParams.get(key) || defaultValue
  }

  const updateUrlFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  // Shared filter state - initialized from URL
  const [filters, setFilters] = useState<BookingFilters>({
    search: getFilterFromUrl('search', ''),
    venueId: getFilterFromUrl('venueId', 'all'),
    courtId: getFilterFromUrl('courtId', 'all'),
    sportId: getFilterFromUrl('sportId', 'all'),
    status: getFilterFromUrl('status', 'all'),
    paymentStatus: getFilterFromUrl('paymentStatus', 'all')
  })

  // Sync filters with URL
  const handleFiltersChange = useCallback((newFilters: BookingFilters) => {
    setFilters(newFilters)
    updateUrlFilters({
      search: newFilters.search || null,
      venueId: newFilters.venueId !== 'all' ? newFilters.venueId : null,
      courtId: newFilters.courtId !== 'all' ? newFilters.courtId : null,
      sportId: newFilters.sportId !== 'all' ? newFilters.sportId : null,
      status: newFilters.status !== 'all' ? newFilters.status : null,
      paymentStatus: newFilters.paymentStatus !== 'all' ? newFilters.paymentStatus : null
    })
  }, [updateUrlFilters])

  const handleClearFilters = useCallback(() => {
    const defaultFilters: BookingFilters = {
      search: '',
      venueId: 'all',
      courtId: 'all',
      sportId: 'all',
      status: 'all',
      paymentStatus: 'all'
    }
    setFilters(defaultFilters)
    updateUrlFilters({
      search: null,
      venueId: null,
      courtId: null,
      sportId: null,
      status: null,
      paymentStatus: null
    })
  }, [updateUrlFilters])

  if (!vendorId) {
    return (
      <VendorLayout title="Bookings" subtitle="Manage your venue bookings">
        <div className="p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout
      title="Bookings"
      subtitle="Manage your venue bookings and their status"
    >
      <div className="p-4 space-y-4">
        {/* Shared Filters */}
        <BookingFiltersComponent 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {/* View Toggle and Legend - Same line */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <BookingStatusLegend />
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Calendar View
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              Table View
            </Button>
          </div>
        </div>

        {/* Calendar Error Alert */}
        {calendarError && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Calendar Error: {calendarError}
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => setCalendarError(null)}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Render based on view mode */}
        <div>
          {viewMode === 'table' ? (
            <VendorBookingDataTable filters={filters} />
          ) : (
            <VendorBookingCalendar filters={filters} onError={setCalendarError} />
          )}
        </div>
      </div>
    </VendorLayout>
  )
}
