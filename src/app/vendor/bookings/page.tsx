'use client'

import { VendorBookingDataTable } from '@/components/features/vendor/VendorBookingDataTable'
import { VendorBookingCalendar } from '@/components/features/vendor/VendorBookingCalendar'
import { VendorLayout } from '@/components/features/vendor/VendorLayout'
import { Button } from '@/components/ui/button'
import { Calendar, List, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useVendor } from '@/hooks/use-vendor'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

export default function VendorBookingsPage() {
  const { vendorId } = useVendor()
  const [calendarError, setCalendarError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('calendar')

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
      <div className="p-6 space-y-6">
      {/* Booking Management Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Booking Management</h2>
            <p className="text-sm text-muted-foreground">
              {viewMode === 'table'
                ? 'View and manage all your venue bookings in detail'
                : 'Manage your venue bookings with drag and drop calendar interface'
              }
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              Table View
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Calendar View
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
        {viewMode === 'table' ? (
          <VendorBookingDataTable />
        ) : (
          <VendorBookingCalendar onError={setCalendarError} />
        )}
      </div>
    </div>
    </VendorLayout>
  )
}
