'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Settings, RefreshCw, ChevronLeft, ChevronRight, Clock, X, Plus, ZoomIn, ZoomOut, Maximize2, RotateCcw as ResetIcon, MoreVertical, AlertTriangle } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useVendor } from '@/hooks/use-vendor'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'
import { theme } from '@/styles/theme/tokens'
import { fetchVendorBookings, VendorBookingFilters } from '@/lib/api/vendor/bookings'
import { useBookingsCache } from '@/hooks/use-bookings-cache'
import { getSportColor, hexToRgba } from '@/styles/theme/sport-colors'
import { toast } from 'sonner'
import { BookingDetailsModal } from './BookingDetailsModal'
import { BookingFilters } from './BookingFilters'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useCalendarPreferences } from '@/hooks/use-calendar-preferences'

interface CalendarBooking {
  id: string
  title: string
  start: string
  end: string
  resourceId: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  customerName: string
  customerEmail: string
  courtName: string
  venueName: string
  venueId?: string
  venueTimezone?: string
  totalAmount: number
  sportId?: string
  sportName?: string
  paymentStatus?: string
  formatId?: string | null
  slotNumber?: number | null
  format?: {
    id: string
    name: string
    displayName: string
    playersPerTeam: number
    maxTotalPlayers?: number | null
  } | null
}

interface CalendarResource {
  id: string
  title: string
  venueName: string
  courtType: string
  venueId: string
  sportId: string
  sportName: string
  venueTimezone?: string
  courtId?: string // Original court ID (when format view is enabled)
  formatId?: string // Format ID (when format view is enabled)
  formatName?: string // Format display name (when format view is enabled)
}

interface VendorBookingCalendarProps {
  filters: BookingFilters
  onError?: (error: string) => void
  venues?: Array<{ id: string; name: string; timezone?: string }>
  courts?: Array<{
    id: string
    name: string
    venueId: string
    sportId: string
    supportedFormats?: Array<{
      id: string
      formatId: string
      maxSlots: number
      isActive?: boolean
      format: {
        id: string
        name: string
        displayName: string
        playersPerTeam: number
        maxTotalPlayers: number | null
      }
    }>
  }>
  sports?: Array<{ id: string; name: string; displayName: string }>
}

type ViewMode = 'day' | 'week' | 'month'

export function VendorBookingCalendar({ filters, onError, venues: propVenues, courts: propCourts, sports: propSports }: VendorBookingCalendarProps) {
  const { vendorId } = useVendor()
  const [bookings, setBookings] = useState<CalendarBooking[]>([])
  const [resources, setResources] = useState<CalendarResource[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Shared bookings cache
  const { getCached, setCached, findOverlappingRange, clearCache } = useBookingsCache()

  // Filter options data - use props if provided, otherwise fetch
  const allSports = propSports || []

  // Calendar preferences with localStorage persistence
  const {
    preferences,
    isLoaded: preferencesLoaded,
    updatePreference,
    resetToDefaults,
  } = useCalendarPreferences(viewMode)

  // Column widths from preferences (will be updated when preferences load)
  const [venueColumnWidth, setVenueColumnWidth] = useState(preferences.venueWidth)
  const [sportColumnWidth, setSportColumnWidth] = useState(preferences.sportWidth)
  const [courtColumnWidth, setCourtColumnWidth] = useState(preferences.courtWidth)
  const [formatColumnWidth, setFormatColumnWidth] = useState(preferences.formatWidth || 120)
  const [timeSlotWidth, setTimeSlotWidth] = useState(preferences.timeSlotWidth)
  const [showVenueColumn, setShowVenueColumn] = useState(false) // Will be set in useEffect
  const [showFormatColumn, setShowFormatColumn] = useState(false) // Default to false for faster initial load

  // Container ref for calculating available width
  const containerRef = useRef<HTMLDivElement>(null)

  // Update column widths when preferences load (but not when we're actively resizing)
  // Use a ref to track if we're resizing to avoid dependency issues
  const isResizingRef = useRef<string | null>(null)

  useEffect(() => {
    if (preferencesLoaded && !isResizingRef.current) {
      setVenueColumnWidth(preferences.venueWidth)
      setSportColumnWidth(preferences.sportWidth)
      setCourtColumnWidth(preferences.courtWidth)
      setFormatColumnWidth(preferences.formatWidth || 120)
      setTimeSlotWidth(preferences.timeSlotWidth)
    }
  }, [preferences, preferencesLoaded])

  // Check if user has multiple venues (for column visibility) - must be before useEffect that uses it
  const hasMultipleVenues = useMemo(() => {
    const uniqueVenueIds = new Set(resources.map(r => r.venueId))
    return uniqueVenueIds.size > 1
  }, [resources])

  // Update format column visibility when preferences load
  useEffect(() => {
    if (preferencesLoaded) {
      setShowFormatColumn(preferences.showFormatColumn)
    }
  }, [preferences.showFormatColumn, preferencesLoaded])

  // Update venue column visibility when venues are loaded
  useEffect(() => {
    if (preferencesLoaded && resources.length > 0) {
      // Only show venue column if user has multiple venues and preference is enabled
      setShowVenueColumn(preferences.showVenueColumn && hasMultipleVenues)
    }
  }, [preferences, preferencesLoaded, resources, hasMultipleVenues])

  // Zoom constraints - removed limits to allow unlimited zoom
  const MIN_TIME_SLOT_WIDTH = 10 // Very small minimum to prevent UI breaking
  const MAX_TIME_SLOT_WIDTH = 1000 // Very large maximum to allow unlimited zoom
  const ZOOM_STEP = 5 // Zoom step size

  // OPTIMIZED: Generate time slots based on view mode and operating hours
  // For day view: show all 24 hours (0-23)
  // For week/month view: show only business hours (6 AM to 11 PM) to reduce DOM elements
  const generateTimeSlots = useMemo((): string[] => {
    const slots: string[] = []
    const startHour = viewMode === 'day' ? 0 : 6 // Start at 6 AM for week/month views
    const endHour = Math.min(viewMode === 'day' ? 23 : 23, 23) // End at 11 PM (23:00), never exceed 23

    // Generate slots from startHour to endHour (inclusive)
    // Cap at 23 to ensure we never show times beyond 23:00
    for (let hour = startHour; hour <= endHour; hour++) {
      if (hour > 23) break // Safety check to prevent going beyond 23:00
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
    }
    return slots
  }, [viewMode])

  // Resize state
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const resizeStartX = useRef<number>(0)
  const resizeStartWidth = useRef<number>(0)
  const currentResizeWidth = useRef<number>(0) // Track current width during resize

  // Calendar grid ref
  const calendarGridRef = useRef<HTMLDivElement>(null)

  // Debounced search
  const debouncedSearch = useDebounce(filters.search, 300)

  // Booking details modal state
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [draggedBooking, setDraggedBooking] = useState<CalendarBooking | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<{ courtId: string; date: Date; slot: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Confirmation modal state for drag and drop
  const [pendingChange, setPendingChange] = useState<{
    booking: CalendarBooking
    targetCourtId: string
    targetDate: Date
    targetSlot: string
    newStartTime: Date
    newEndTime: Date
    venueTimezone?: string
  } | null>(null)

  // Create booking state
  const [createBookingSlot, setCreateBookingSlot] = useState<{ courtId: string; date: Date; startTime: string } | null>(null)

  // Add new state for context menu
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    booking: CalendarBooking | null
  }>({ visible: false, x: 0, y: 0, booking: null })

  const contextMenuRef = useRef<HTMLDivElement>(null)
  const isLoadingBookingsRef = useRef(false)
  const lastBookingsRequestRef = useRef<string>('')
  const isInitialMountRef = useRef(true)
  const isLoadingResourcesRef = useRef(false)
  const lastResourcesKeyRef = useRef<string>('')

  // Add context menu actions
  const contextMenuActions = [
    { label: 'View Details', action: 'view', icon: '👁️' },
    { label: 'Edit Booking', action: 'edit', icon: '✏️' },
    { label: 'Send SMS', action: 'sms', icon: '💬' },
    { label: 'Cancel Booking', action: 'cancel', icon: '🚫' },
    { label: 'Mark Complete', action: 'complete', icon: '✅' },
    { label: 'View Customer', action: 'customer', icon: '👤' }
  ]

  // Add context menu handlers
  const handleContextMenu = (e: React.MouseEvent, booking: CalendarBooking) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      booking
    })
  }

  const handleContextMenuAction = (action: string, booking: CalendarBooking) => {
    // Always open the modal first so user can see booking details
    setSelectedBooking(booking)
    setIsModalOpen(true)

    // Close context menu
    setContextMenu({ visible: false, x: 0, y: 0, booking: null })

    // The modal has action buttons for all these actions:
    // - Edit (onEdit prop)
    // - Cancel (onCancel prop)
    // - Complete (onComplete prop)
    // - Send SMS (onSendSMS prop)
    // - View Customer (onViewCustomer prop)
    // So we just open the modal and let the user click the buttons
    // For 'view', we're done - modal is open
  }

  // Add API functions for context menu actions with toast notifications
  const sendSMS = async (booking: CalendarBooking) => {
    try {
      const response = await fetch('/api/notifications/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          to: booking.customerEmail,
          message: `Your booking at ${booking.courtName} is confirmed for ${booking.venueTimezone ? new Date(booking.start).toLocaleString('en-US', { timeZone: booking.venueTimezone }) : new Date(booking.start).toLocaleString()}`
        })
      })
      if (response.ok) {
        toast.success('SMS sent successfully!')
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to send SMS' }))
        toast.error(error.error || 'Failed to send SMS')
      }
    } catch (error) {
      console.error('Failed to send SMS:', error)
      toast.error('Failed to send SMS. Please try again.')
    }
  }

  const cancelBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        credentials: 'include'
      })
      if (response.ok) {
        // Clear cache to force refresh
        clearCache()
        loadBookings(true, true) // Force reload after cancellation
        toast.success('Booking cancelled successfully!')
        setIsModalOpen(false)
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to cancel booking' }))
        toast.error(error.error || 'Failed to cancel booking')
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      toast.error('Failed to cancel booking. Please try again.')
    }
  }

  const markComplete = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/complete`, {
        method: 'POST',
        credentials: 'include'
      })
      if (response.ok) {
        // Clear cache to force refresh
        clearCache()
        loadBookings(true, true) // Force reload after completion
        toast.success('Booking marked as complete!')
        setIsModalOpen(false)
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to mark booking as complete' }))
        toast.error(error.error || 'Failed to mark booking as complete')
      }
    } catch (error) {
      console.error('Failed to mark complete:', error)
      toast.error('Failed to mark booking as complete. Please try again.')
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, booking: CalendarBooking) => {
    setDraggedBooking(booking)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', booking.id)
  }

  const handleDragEnd = () => {
    setDraggedBooking(null)
    setDragOverSlot(null)
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent, courtId: string, date: Date, slot: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverSlot({ courtId, date, slot })
  }

  const handleDrop = async (e: React.DragEvent, targetCourtId: string, targetDate: Date, targetSlot: string) => {
    e.preventDefault()

    if (!draggedBooking) return

    // Get venue timezone for the target court
    const targetCourt = resources.find(r => r.id === targetCourtId)
    const venueTimezone = targetCourt?.venueTimezone || draggedBooking.venueTimezone || getActiveVenueTimezone

    // Parse target slot time (this is in vendor timezone)
    const [hours, minutes] = targetSlot.split(':').map(Number)

    // Get the date string in vendor timezone (not UTC!)
    // We need to format the targetDate in vendor timezone to get the correct date
    let targetDateStr: string
    if (venueTimezone) {
      // Format date in vendor timezone
      const dateParts = targetDate.toLocaleDateString('en-US', {
        timeZone: venueTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      // Convert from MM/DD/YYYY to YYYY-MM-DD
      const [month, day, year] = dateParts.split('/')
      targetDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    } else {
      // Fallback to UTC if no timezone
      targetDateStr = targetDate.toISOString().split('T')[0]
    }

    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`

    // Create a date string that represents the local time in vendor timezone
    // Format: YYYY-MM-DDTHH:mm:ss (this will be interpreted as vendor timezone)
    const localDateTimeStr = `${targetDateStr}T${timeStr}`

    // Convert vendor timezone time to UTC Date object
    // We'll use a helper function to properly convert
    const newStartUTC = convertVendorTimezoneToUTC(localDateTimeStr, venueTimezone)

    const oldStart = new Date(draggedBooking.start)
    const oldEnd = new Date(draggedBooking.end)
    const duration = oldEnd.getTime() - oldStart.getTime()

    const newEndUTC = new Date(newStartUTC.getTime() + duration)

    // Check for conflicts using UTC times
    const conflicts = bookings.filter(b =>
      b.id !== draggedBooking.id &&
      b.resourceId === targetCourtId &&
      new Date(b.start).toISOString().split('T')[0] === newStartUTC.toISOString().split('T')[0] &&
      ((new Date(b.start) < newEndUTC && new Date(b.end) > newStartUTC))
    )

    if (conflicts.length > 0) {
      toast.error('Cannot move booking: Time slot conflicts with existing booking')
      handleDragEnd()
      return
    }

    // Store pending change and show confirmation modal
    setPendingChange({
      booking: draggedBooking,
      targetCourtId,
      targetDate,
      targetSlot,
      newStartTime: newStartUTC,
      newEndTime: newEndUTC,
      venueTimezone
    })

    handleDragEnd()
  }

  // Helper function to convert vendor timezone time to UTC
  // Takes a date/time string in vendor timezone and returns a UTC Date object
  const convertVendorTimezoneToUTC = (localDateTimeStr: string, venueTimezone?: string): Date => {
    if (!venueTimezone) {
      // Fallback: treat as UTC
      return new Date(localDateTimeStr + 'Z')
    }

    // Parse: YYYY-MM-DDTHH:mm:ss
    const [datePart, timePart] = localDateTimeStr.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute, second = 0] = timePart.split(':').map(Number)

    // Create a date string in ISO format (without timezone)
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`

    // Method: Find the UTC time that, when formatted in vendor timezone, equals our target time
    // We'll use an iterative approach that converges quickly

    // Start with a reasonable guess: treat as UTC first
    let candidateUTC = new Date(dateStr + 'Z')

    // Iterate to find the correct UTC time (usually converges in 1-2 iterations)
    for (let i = 0; i < 5; i++) {
      // Format candidate UTC time in vendor timezone
      const vendorFormatted = candidateUTC.toLocaleString('en-US', {
        timeZone: venueTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })

      // Parse formatted string
      const [vDate, vTime] = vendorFormatted.split(', ')
      const [vMonth, vDay, vYear] = vDate.split('/').map(Number)
      const [vHour, vMinute, vSecond] = vTime.split(':').map(Number)

      // Check if we've found the correct time
      if (vYear === year && vMonth === month && vDay === day &&
        vHour === hour && vMinute === minute && Math.abs(vSecond - second) <= 1) {
        break
      }

      // Calculate the difference between target and actual
      // Create date objects for comparison (in local time, not UTC)
      const targetLocal = new Date(year, month - 1, day, hour, minute, second)
      const actualLocal = new Date(vYear, vMonth - 1, vDay, vHour, vMinute, vSecond)

      // Calculate difference in milliseconds
      const diffMs = targetLocal.getTime() - actualLocal.getTime()

      // Adjust candidate UTC time by the difference
      candidateUTC = new Date(candidateUTC.getTime() + diffMs)

      // Safety check: if difference is very small, we're close enough
      if (Math.abs(diffMs) < 1000) {
        break
      }
    }

    return candidateUTC
  }

  // Confirm the booking change
  const confirmBookingChange = async () => {
    if (!pendingChange) return

    try {
      // Update booking via API with UTC times
      const response = await fetch(`/api/bookings/${pendingChange.booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          startTime: pendingChange.newStartTime.toISOString(),
          endTime: pendingChange.newEndTime.toISOString(),
          courtId: pendingChange.targetCourtId,
        })
      })

      if (response.ok) {
        const result = await response.json()

        // Clear cache to force refresh
        clearCache()

        // Close modal first
        setPendingChange(null)

        // Reload bookings to show updated data (force reload)
        await loadBookings(true, true)

        toast.success('Booking rescheduled successfully!')
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to reschedule booking' }))
        toast.error(error.error || 'Failed to reschedule booking')
      }
    } catch (error) {
      console.error('Failed to reschedule booking:', error)
      toast.error('Failed to reschedule booking. Please try again.')
    }
  }

  // Cancel the pending change
  const cancelBookingChange = () => {
    setPendingChange(null)
  }

  // Create booking handler
  const handleCreateBooking = (courtId: string, date: Date, startTime: string) => {
    setCreateBookingSlot({ courtId, date, startTime })
    // Open create booking page or modal
    const court = resources.find(r => r.id === courtId)
    if (court) {
      const dateStr = date.toISOString().split('T')[0]
      window.open(`/vendor/bookings/create?courtId=${courtId}&date=${dateStr}&time=${startTime}`, '_blank')
    }
  }

  // Resize handlers - save to preferences when resizing
  const handleResizeStart = (column: 'venue' | 'sport' | 'court' | 'format' | 'timeSlot', e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(column)
    isResizingRef.current = column // Update ref
    resizeStartX.current = e.clientX
    if (column === 'venue') {
      resizeStartWidth.current = venueColumnWidth
      currentResizeWidth.current = venueColumnWidth
    } else if (column === 'sport') {
      resizeStartWidth.current = sportColumnWidth
      currentResizeWidth.current = sportColumnWidth
    } else if (column === 'court') {
      resizeStartWidth.current = courtColumnWidth
      currentResizeWidth.current = courtColumnWidth
    } else if (column === 'format') {
      resizeStartWidth.current = formatColumnWidth
      currentResizeWidth.current = formatColumnWidth
    } else {
      resizeStartWidth.current = timeSlotWidth
      currentResizeWidth.current = timeSlotWidth
    }
  }

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing) return

      const diff = e.clientX - resizeStartX.current
      const newWidth = Math.max(10, resizeStartWidth.current + diff) // Very small minimum to prevent UI breaking
      currentResizeWidth.current = newWidth // Store current width

      if (isResizing === 'venue') {
        setVenueColumnWidth(newWidth)
      } else if (isResizing === 'sport') {
        setSportColumnWidth(newWidth)
      } else if (isResizing === 'court') {
        setCourtColumnWidth(newWidth)
      } else if (isResizing === 'format') {
        setFormatColumnWidth(newWidth)
      } else if (isResizing === 'timeSlot') {
        setTimeSlotWidth(Math.max(10, newWidth)) // Very small minimum to prevent UI breaking
      }
    }

    const handleResizeEnd = () => {
      if (isResizing) {
        // Use the current width from the ref to ensure we save the latest value
        const finalWidth = currentResizeWidth.current || resizeStartWidth.current

        // Save preferences when resize ends
        const column = isResizing as 'venue' | 'sport' | 'court' | 'format' | 'timeSlot'
        if (column === 'venue') {
          updatePreference('venueWidth', finalWidth)
        } else if (column === 'sport') {
          updatePreference('sportWidth', finalWidth)
        } else if (column === 'court') {
          updatePreference('courtWidth', finalWidth)
        } else if (column === 'format') {
          updatePreference('formatWidth', finalWidth)
        } else if (column === 'timeSlot') {
          updatePreference('timeSlotWidth', finalWidth)
        }
      }
      setIsResizing(null)
      isResizingRef.current = null // Clear ref
      currentResizeWidth.current = 0 // Reset
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, venueColumnWidth, sportColumnWidth, courtColumnWidth, formatColumnWidth, timeSlotWidth, updatePreference])

  // Add click outside handler for context menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu({ visible: false, x: 0, y: 0, booking: null })
      }
    }

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [contextMenu.visible])

  // Removed scroll/wheel event handler - was causing UI issues with vendor layout
  // Zoom functionality is still available via zoom buttons in the header

  // Fetch venues and courts data
  const fetchVenuesAndCourts = async () => {
    if (!vendorId) return []

    try {
      const response = await fetch(`/api/vendors/${vendorId}/venues?limit=100&status=active`, {
        credentials: 'include'
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch venues: ${response.status}`)
      }

      const data = await response.json()
      const venues = data.data || []

      const calendarResources: CalendarResource[] = []
      const distinctSports = new Map<string, { id: string; name: string; displayName: string }>()

      try {
        const courtsResponse = await fetch(`/api/courts?vendorId=${vendorId}&limit=1000`, {
          credentials: 'include'
        })
        if (courtsResponse.ok) {
          const courtsData = await courtsResponse.json()
          const courts = courtsData.courts || []

          for (const court of courts) {
            if (court.venue?.id && court.sport?.id) {
              calendarResources.push({
                id: court.id,
                title: `${court.name} (${court.venue.name})`,
                venueName: court.venue.name,
                courtType: court.sport?.displayName || court.sport?.name || 'Unknown',
                venueId: court.venue.id,
                sportId: court.sport.id,
                sportName: court.sport?.displayName || court.sport?.name || 'Unknown',
                venueTimezone: court.venue?.timezone
              })

              // Extract sports
              if (court.sport) {
                distinctSports.set(court.sport.id, {
                  id: court.sport.id,
                  name: court.sport.name,
                  displayName: court.sport.displayName || court.sport.name
                })
              }
            }
          }
        } else {
          for (const venue of venues) {
            if (venue.courts && Array.isArray(venue.courts)) {
              for (const court of venue.courts) {
                if (court.sport) {
                  calendarResources.push({
                    id: court.id,
                    title: `${court.name} (${venue.name})`,
                    venueName: venue.name,
                    courtType: court.sport?.displayName || court.sport?.name || 'Unknown',
                    venueId: venue.id,
                    sportId: court.sport.id || '',
                    sportName: court.sport?.displayName || court.sport?.name || 'Unknown',
                    venueTimezone: venue.timezone
                  })
                }
              }
            }
          }
        }
      } catch (courtsErr) {
        console.error('Error fetching courts:', courtsErr)
        for (const venue of venues) {
          if (venue.courts && Array.isArray(venue.courts)) {
            for (const court of venue.courts) {
              if (court.sport) {
                calendarResources.push({
                  id: court.id,
                  title: `${court.name} (${venue.name})`,
                  venueName: venue.name,
                  courtType: court.sport?.displayName || court.sport?.name || 'Unknown',
                  venueId: venue.id,
                  sportId: court.sport.id || '',
                  sportName: court.sport?.displayName || court.sport?.name || 'Unknown'
                })
              }
            }
          }
        }
      }

      return calendarResources
    } catch (err) {
      console.error('Error fetching venues:', err)
      if (onError) {
        onError(err instanceof Error ? err.message : 'Failed to fetch venues')
      }
      return []
    }
  }

  // Fetch bookings data - handles pagination to get all bookings
  // Date range is dynamic based on currentDate and viewMode to support future navigation
  // Uses shared cache to avoid duplicate API calls
  const fetchBookings = useCallback(async () => {
    if (!vendorId) return []

    try {
      // Calculate date range based on currentDate and viewMode
      // This ensures we fetch bookings for the dates the user is viewing
      const baseDate = new Date(currentDate)

      // OPTIMIZED: Reduce date range based on view mode to improve performance
      // For day view: fetch 7 days before and 7 days after (2 weeks total)
      // For week view: fetch 1 week before and 2 weeks after (4 weeks total)
      // For month view: fetch 1 week before and 2 weeks after (4 weeks total)
      let startDate: Date
      let endDate: Date

      if (viewMode === 'day') {
        startDate = new Date(baseDate)
        startDate.setDate(baseDate.getDate() - 7)
        endDate = new Date(baseDate)
        endDate.setDate(baseDate.getDate() + 7)
      } else if (viewMode === 'week') {
        // Start from beginning of week, go back 1 week, forward 2 weeks
        const weekStart = new Date(baseDate)
        weekStart.setDate(baseDate.getDate() - baseDate.getDay())
        startDate = new Date(weekStart)
        startDate.setDate(weekStart.getDate() - 7)
        endDate = new Date(weekStart)
        endDate.setDate(weekStart.getDate() + 14)
      } else {
        // Month view: show 2 weeks, fetch 1 week before and 1 week after
        const weekStart = new Date(baseDate)
        weekStart.setDate(baseDate.getDate() - baseDate.getDay())
        startDate = new Date(weekStart)
        startDate.setDate(weekStart.getDate() - 7)
        endDate = new Date(weekStart)
        endDate.setDate(weekStart.getDate() + 14)
      }

      const dateFrom = startDate.toISOString().split('T')[0]
      const dateTo = endDate.toISOString().split('T')[0]

      // Map status filter
      const statusMap: Record<string, 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'> = {
        'Confirmed': 'CONFIRMED',
        'Pending': 'PENDING',
        'Completed': 'COMPLETED',
        'Cancelled': 'CANCELLED',
        'No-Show': 'NO_SHOW'
      }

      // Map payment status filter
      const paymentMap: Record<string, 'PAID' | 'PENDING' | 'REFUNDED' | 'PARTIALLY_REFUNDED'> = {
        'Paid': 'PAID',
        'Pending': 'PENDING',
        'Refunded': 'REFUNDED',
        'Partially Paid': 'PARTIALLY_REFUNDED'
      }

      // Base filters - same for all pages
      const baseFilters: VendorBookingFilters = {
        limit: 100, // Fetch 100 per page for better performance
        dateFrom,
        dateTo,
        sortBy: 'startTime',
        sortOrder: 'asc'
      }

      // Add optional filters
      if (debouncedSearch) {
        baseFilters.search = debouncedSearch
      }
      if (filters.venueId && filters.venueId !== 'all') {
        baseFilters.venueId = filters.venueId
      }
      if (filters.courtId && filters.courtId !== 'all') {
        baseFilters.courtId = filters.courtId
      }
      if (filters.sportId && filters.sportId !== 'all') {
        baseFilters.sportId = filters.sportId
      }
      if (filters.status && filters.status !== 'all' && statusMap[filters.status]) {
        baseFilters.status = statusMap[filters.status]
      }
      if (filters.paymentStatus && filters.paymentStatus !== 'all' && paymentMap[filters.paymentStatus]) {
        baseFilters.paymentStatus = paymentMap[filters.paymentStatus]
      }

      // Step 1: Check cache for exact match
      const cachedData = getCached(baseFilters, vendorId)
      if (cachedData && cachedData.length > 0) {
        // Transform cached data to CalendarBooking format
        const calendarBookings: CalendarBooking[] = cachedData
          .filter((booking: any) => booking.court?.id && booking.user?.name)
          .map((booking: any) => {
            const paymentStatusMap: Record<string, string> = {
              'PAID': 'Paid',
              'PENDING': 'Pending',
              'REFUNDED': 'Refunded',
              'PARTIALLY_REFUNDED': 'Partially Paid'
            }

            return {
              id: booking.id,
              title: `${booking.user?.name || 'Unknown'} - ${booking.court?.sport?.displayName || booking.court?.sport?.name || 'Unknown'}`,
              start: booking.startTime,
              end: booking.endTime,
              resourceId: showFormatColumn && booking.formatId
                ? `${booking.court.id}-${booking.formatId}`
                : booking.court.id,
              status: booking.status,
              customerName: booking.user?.name || 'Unknown',
              customerEmail: booking.user?.email || '',
              courtName: booking.court?.name || 'Unknown',
              venueName: booking.venue?.name || 'Unknown',
              venueId: booking.venue?.id,
              venueTimezone: booking.venue?.timezone,
              totalAmount: Number(booking.totalAmount) || 0,
              sportId: booking.court?.sport?.id,
              sportName: booking.court?.sport?.displayName || booking.court?.sport?.name,
              paymentStatus: paymentStatusMap[booking.paymentInfo?.status] || booking.paymentInfo?.status || 'Pending',
              formatId: booking.formatId || null,
              slotNumber: booking.slotNumber || null,
              format: booking.format || null
            }
          })
        return calendarBookings
      }

      // Step 2: Check for overlapping cached data (e.g., from table view)
      const overlappingData = findOverlappingRange(baseFilters, vendorId)
      if (overlappingData && overlappingData.length > 0) {
        // Transform and return overlapping data
        const calendarBookings: CalendarBooking[] = overlappingData
          .filter((booking: any) => booking.court?.id && booking.user?.name)
          .map((booking: any) => {
            const paymentStatusMap: Record<string, string> = {
              'PAID': 'Paid',
              'PENDING': 'Pending',
              'REFUNDED': 'Refunded',
              'PARTIALLY_REFUNDED': 'Partially Paid'
            }

            return {
              id: booking.id,
              title: `${booking.user?.name || 'Unknown'} - ${booking.court?.sport?.displayName || booking.court?.sport?.name || 'Unknown'}`,
              start: booking.startTime,
              end: booking.endTime,
              resourceId: showFormatColumn && booking.formatId
                ? `${booking.court.id}-${booking.formatId}`
                : booking.court.id,
              status: booking.status,
              customerName: booking.user?.name || 'Unknown',
              customerEmail: booking.user?.email || '',
              courtName: booking.court?.name || 'Unknown',
              venueName: booking.venue?.name || 'Unknown',
              venueId: booking.venue?.id,
              venueTimezone: booking.venue?.timezone,
              totalAmount: Number(booking.totalAmount) || 0,
              sportId: booking.court?.sport?.id,
              sportName: booking.court?.sport?.displayName || booking.court?.sport?.name,
              paymentStatus: paymentStatusMap[booking.paymentInfo?.status] || booking.paymentInfo?.status || 'Pending',
              formatId: booking.formatId || null,
              slotNumber: booking.slotNumber || null,
              format: booking.format || null
            }
          })

        // Store in cache for future use
        setCached(baseFilters, overlappingData, undefined, vendorId)
        return calendarBookings
      }

      // Step 3: Fetch from API (cache miss)
      const allBookings: any[] = []
      let currentPage = 1
      let hasMorePages = true

      while (hasMorePages) {
        const filters: VendorBookingFilters = {
          ...baseFilters,
          page: currentPage
        }

        const result = await fetchVendorBookings(vendorId, filters)

        if (!result.success || !result.data) {
          throw new Error('Failed to fetch bookings')
        }

        allBookings.push(...result.data)

        // Check if there are more pages
        const pagination = result.meta?.pagination || result.pagination
        if (pagination) {
          hasMorePages = pagination.hasNextPage || false
        } else {
          // If no pagination info, assume no more pages if we got less than limit
          hasMorePages = result.data.length >= (baseFilters.limit || 100)
        }
        currentPage++

        // OPTIMIZED: Safety limit reduced - don't fetch more than 20 pages (2000 bookings)
        // This should be enough for most calendar views with the reduced date range
        if (currentPage >= 20) {
          break
        }
      }

      // Store in cache
      setCached(baseFilters, allBookings, undefined, vendorId)

      const calendarBookings: CalendarBooking[] = allBookings
        .filter((booking: any) => booking.court?.id && booking.user?.name)
        .map((booking: any) => {
          const paymentStatusMap: Record<string, string> = {
            'PAID': 'Paid',
            'PENDING': 'Pending',
            'REFUNDED': 'Refunded',
            'PARTIALLY_REFUNDED': 'Partially Paid'
          }

          return {
            id: booking.id,
            title: `${booking.user?.name || 'Unknown'} - ${booking.court?.sport?.displayName || booking.court?.sport?.name || 'Unknown'}`,
            start: booking.startTime,
            end: booking.endTime,
            resourceId: showFormatColumn && booking.formatId
              ? `${booking.court.id}-${booking.formatId}`
              : booking.court.id,
            status: booking.status,
            customerName: booking.user?.name || 'Unknown',
            customerEmail: booking.user?.email || '',
            courtName: booking.court?.name || 'Unknown',
            venueName: booking.venue?.name || 'Unknown',
            venueId: booking.venue?.id,
            venueTimezone: booking.venue?.timezone,
            totalAmount: Number(booking.totalAmount) || 0,
            sportId: booking.court?.sport?.id,
            sportName: booking.court?.sport?.displayName || booking.court?.sport?.name,
            paymentStatus: paymentStatusMap[booking.paymentInfo?.status] || booking.paymentInfo?.status || 'Pending',
            formatId: booking.formatId || null,
            slotNumber: booking.slotNumber || null,
            format: booking.format || null
          }
        })

      return calendarBookings
    } catch (err) {
      console.error('Error fetching bookings:', err)
      if (onError) {
        onError(err instanceof Error ? err.message : 'Failed to fetch bookings')
      }
      return []
    }
  }, [vendorId, currentDate, viewMode, debouncedSearch, filters, onError, getCached, setCached, findOverlappingRange, showFormatColumn])

  // Load venues and courts - use props if provided, otherwise fetch
  const loadResources = useCallback(async (force = false) => {
    if (!vendorId) return

    // Create a unique key for resources based on props
    const resourcesKey = JSON.stringify({
      vendorId,
      showFormatColumn,
      venuesCount: propVenues?.length || 0,
      courtsCount: propCourts?.length || 0
    })

    // Prevent duplicate resource loading
    if (!force && isLoadingResourcesRef.current && lastResourcesKeyRef.current === resourcesKey) {
      return
    }

    isLoadingResourcesRef.current = true
    lastResourcesKeyRef.current = resourcesKey

    try {
      setLoading(true)

      // If props are provided, use them to build resources
      if (propVenues && propCourts) {
        const calendarResources: CalendarResource[] = []

        // OPTIMIZED: If format column is disabled, skip format fetching entirely for faster load
        if (!showFormatColumn) {
          // Fast path: no format fetching needed
          for (const court of propCourts) {
            const venue = propVenues.find(v => v.id === court.venueId)
            const sport = propSports?.find(s => s.id === court.sportId)

            if (venue && sport) {
              calendarResources.push({
                id: court.id,
                title: `${court.name} (${venue.name})`,
                venueName: venue.name,
                courtType: sport.displayName || sport.name || 'Unknown',
                venueId: venue.id,
                sportId: sport.id,
                sportName: sport.displayName || sport.name || 'Unknown',
                venueTimezone: venue.timezone,
                courtId: court.id
              })
            }
          }

          setResources(calendarResources)
          isLoadingResourcesRef.current = false
          return // Early return - no format fetching needed
        }

        // If format column is enabled, create format-based resources
        if (showFormatColumn) {
          // OPTIMIZED: Use formats from props instead of fetching individually - eliminates 11+ API calls!
          // Formats are already included in the initial /api/courts response
          for (const court of propCourts) {
            const venue = propVenues.find(v => v.id === court.venueId)
            const sport = propSports?.find(s => s.id === court.sportId)

            if (!venue || !sport) continue

            // Use formats from props (already fetched in initial courts request)
            const supportedFormats = court.supportedFormats || []

            if (supportedFormats.length > 0) {
              // Create a resource for each format
              for (const courtFormat of supportedFormats) {
                // Check if format exists and is active (isActive is optional, default to true if not present)
                if (courtFormat.format && (courtFormat.isActive !== false)) {
                  const formatName = courtFormat.format.displayName || courtFormat.format.name || 'Unknown Format'
                  calendarResources.push({
                    id: `${court.id}-${courtFormat.format.id}`, // Unique ID: courtId-formatId
                    title: `${court.name} - ${formatName}`,
                    venueName: venue.name,
                    courtType: sport.displayName || sport.name || 'Unknown',
                    venueId: venue.id,
                    sportId: sport.id,
                    sportName: sport.displayName || sport.name || 'Unknown',
                    venueTimezone: venue.timezone,
                    courtId: court.id, // Store original court ID
                    formatId: courtFormat.format.id,
                    formatName: formatName
                  })
                }
              }
            } else {
              // If no formats, create a single resource (fallback)
              calendarResources.push({
                id: court.id,
                title: `${court.name} (${venue.name})`,
                venueName: venue.name,
                courtType: sport.displayName || sport.name || 'Unknown',
                venueId: venue.id,
                sportId: sport.id,
                sportName: sport.displayName || sport.name || 'Unknown',
                venueTimezone: venue.timezone,
                courtId: court.id
              })
            }
          }
        } else {
          // Default: one resource per court
          for (const court of propCourts) {
            const venue = propVenues.find(v => v.id === court.venueId)
            const sport = propSports?.find(s => s.id === court.sportId)

            if (venue && sport) {
              calendarResources.push({
                id: court.id,
                title: `${court.name} (${venue.name})`,
                venueName: venue.name,
                courtType: sport.displayName || sport.name || 'Unknown',
                venueId: venue.id,
                sportId: sport.id,
                sportName: sport.displayName || sport.name || 'Unknown',
                venueTimezone: venue.timezone
              })
            }
          }
        }

        setResources(calendarResources)
      } else {
        // Fallback to fetching if props not provided
        const resourcesData = await fetchVenuesAndCourts()
        setResources(resourcesData)
      }
    } catch (err) {
      console.error('Error loading resources:', err)
      if (onError) {
        onError(err instanceof Error ? err.message : 'Failed to load venues and courts')
      }
    } finally {
      setLoading(false)
    }
  }, [vendorId, onError, propVenues, propCourts, propSports, showFormatColumn])

  // Load bookings when filters, currentDate, or viewMode change
  const loadBookings = useCallback(async (showRefreshing = false, force = false) => {
    if (!vendorId) return

    // Create a unique request key based on filters to prevent duplicate requests
    const requestKey = JSON.stringify({
      vendorId,
      currentDate: currentDate.toISOString(),
      viewMode,
      debouncedSearch,
      filters,
      showFormatColumn
    })

    // Prevent duplicate requests unless forced
    // Check BEFORE setting the ref to prevent race conditions
    if (!force) {
      if (isLoadingBookingsRef.current) {
        // If already loading the same request, skip
        if (lastBookingsRequestRef.current === requestKey) {
          return
        }
        // If loading a different request, wait a bit and check again
        // This handles rapid filter changes
        await new Promise(resolve => setTimeout(resolve, 50))
        if (isLoadingBookingsRef.current && lastBookingsRequestRef.current === requestKey) {
          return
        }
      }
    }

    // Mark as loading and store request key BEFORE starting the request
    isLoadingBookingsRef.current = true
    lastBookingsRequestRef.current = requestKey

    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const bookingsData = await fetchBookings()
      setBookings(bookingsData)
    } catch (err) {
      console.error('Error loading bookings:', err)
      if (onError) {
        onError(err instanceof Error ? err.message : 'Failed to load bookings')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
      isLoadingBookingsRef.current = false
    }
  }, [vendorId, onError, fetchBookings, currentDate, viewMode, debouncedSearch, filters, showFormatColumn])

  // Load resources once on mount or when props change - use stable dependencies
  // OPTIMIZED: Don't block bookings on resources - load them in parallel
  useEffect(() => {
    if (vendorId && propVenues && propCourts && propVenues.length > 0 && propCourts.length > 0) {
      // Load resources in background - don't block bookings
      loadResources(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId, showFormatColumn, propVenues?.length, propCourts?.length])

  // Reload resources when format column visibility changes (force reload)
  useEffect(() => {
    if (preferencesLoaded && vendorId && propVenues && propCourts) {
      loadResources(true) // Force reload when format column changes
      loadBookings(true, true) // Force reload bookings too
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFormatColumn, preferencesLoaded])

  // Load bookings immediately when component mounts - don't wait for resources
  // OPTIMIZED: Load bookings in parallel with resources for faster initial load
  useEffect(() => {
    if (vendorId) {
      // Start fetching bookings immediately, don't wait for resources
      isInitialMountRef.current = false
      loadBookings(false, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId])

  // Load bookings when filters change - use stable dependencies instead of loadBookings
  // Skip on initial mount (handled by vendorId useEffect above)
  useEffect(() => {
    // Only load if vendorId is available and not initial mount
    if (vendorId && !isInitialMountRef.current) {
      loadBookings(false, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, viewMode, debouncedSearch, filters.venueId, filters.courtId, filters.sportId, filters.status, filters.paymentStatus])


  const handleEventClick = (booking: CalendarBooking) => {
    setSelectedBooking(booking)
    setIsModalOpen(true)
  }

  const handleEditBooking = (booking: CalendarBooking) => {
    window.open(`/vendor/bookings/${booking.id}/edit`, '_blank')
  }

  const handleViewCustomer = (email: string) => {
    window.open(`/vendor/customers?email=${email}`, '_blank')
  }

  const handleUpdateBooking = async (updatedBooking: CalendarBooking) => {
    // Clear cache to force refresh
    clearCache()
    // Update local state immediately for better UX
    setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b))
    // Reload bookings to ensure consistency (force reload)
    await loadBookings(true, true)
  }

  // Get event color with sport color integration
  const getEventColor = (booking: CalendarBooking) => {
    const sportColor = booking.sportId ? getSportColor(booking.sportId, booking.sportName) : null

    // Base status colors
    const statusColors = {
      CONFIRMED: sportColor || '#10b981', // green-500
      PENDING: '#eab308', // yellow-500
      CANCELLED: '#ef4444', // red-500
      COMPLETED: '#3b82f6', // blue-500
      NO_SHOW: '#a855f7', // purple-500
    }

    const baseColor = statusColors[booking.status] || '#6b7280'

    // For confirmed bookings, use sport color if available, otherwise use status color
    if (booking.status === 'CONFIRMED' && sportColor) {
      return sportColor
    }

    return baseColor
  }

  // Get event background style with sport colors
  // Helper function to group overlapping bookings and calculate vertical positions
  const calculateBookingPositions = (bookings: CalendarBooking[], venueTimezone: string) => {
    if (bookings.length === 0) return []

    // Sort bookings by start time
    const sortedBookings = [...bookings].sort((a, b) => {
      const aStart = new Date(a.start)
      const bStart = new Date(b.start)
      const aComponents = getDateComponentsInVenueTimezone(aStart, venueTimezone)
      const bComponents = getDateComponentsInVenueTimezone(bStart, venueTimezone)
      const aMinutes = aComponents.hour * 60 + aComponents.minutes
      const bMinutes = bComponents.hour * 60 + bComponents.minutes
      return aMinutes - bMinutes
    })

    // Group overlapping bookings
    const groups: CalendarBooking[][] = []
    const processed = new Set<string>()

    sortedBookings.forEach(booking => {
      if (processed.has(booking.id)) return

      const bookingStart = new Date(booking.start)
      const bookingEnd = new Date(booking.end)
      const startComponents = getDateComponentsInVenueTimezone(bookingStart, venueTimezone)
      const endComponents = getDateComponentsInVenueTimezone(bookingEnd, venueTimezone)
      const startMinutes = startComponents.hour * 60 + startComponents.minutes
      const endMinutes = endComponents.hour * 60 + endComponents.minutes

      const group: CalendarBooking[] = [booking]
      processed.add(booking.id)

      // Find all overlapping bookings
      sortedBookings.forEach(otherBooking => {
        if (processed.has(otherBooking.id)) return

        const otherStart = new Date(otherBooking.start)
        const otherEnd = new Date(otherBooking.end)
        const otherStartComponents = getDateComponentsInVenueTimezone(otherStart, venueTimezone)
        const otherEndComponents = getDateComponentsInVenueTimezone(otherEnd, venueTimezone)
        const otherStartMinutes = otherStartComponents.hour * 60 + otherStartComponents.minutes
        const otherEndMinutes = otherEndComponents.hour * 60 + otherEndComponents.minutes

        // Check if bookings overlap
        if (startMinutes < otherEndMinutes && endMinutes > otherStartMinutes) {
          group.push(otherBooking)
          processed.add(otherBooking.id)
        }
      })

      groups.push(group)
    })

    // Calculate vertical positions for each booking
    const positions = new Map<string, { row: number; totalRows: number }>()

    groups.forEach(group => {
      group.forEach((booking, index) => {
        positions.set(booking.id, {
          row: index,
          totalRows: group.length
        })
      })
    })

    return positions
  }

  const getEventStyle = (booking: CalendarBooking) => {
    const color = getEventColor(booking)
    const isConfirmed = booking.status === 'CONFIRMED'

    if (isConfirmed && booking.sportId) {
      // Use gradient for confirmed bookings with sport color
      const rgbaColor = hexToRgba(color, 0.9)
      const rgbaColorLight = hexToRgba(color, 0.6)

      return {
        background: `linear-gradient(135deg, ${rgbaColor} 0%, ${rgbaColorLight} 100%)`,
        borderColor: color,
        color: 'white',
      }
    }

    // Use status-based colors for other statuses (with gradients)
    const statusStyles: Record<string, { bg: string; bgGradient: string; border: string; text: string }> = {
      PENDING: {
        bg: '#fef3c7',
        bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        border: '#eab308',
        text: '#92400e'
      },
      CANCELLED: {
        bg: '#fee2e2',
        bgGradient: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        border: '#ef4444',
        text: '#991b1b'
      },
      COMPLETED: {
        bg: '#dbeafe',
        bgGradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        border: '#3b82f6',
        text: '#1e40af'
      },
      NO_SHOW: {
        bg: '#f3e8ff',
        bgGradient: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
        border: '#a855f7',
        text: '#6b21a8'
      },
    }

    const style = statusStyles[booking.status] || {
      bg: '#f3f4f6',
      bgGradient: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      border: '#6b7280',
      text: '#374151'
    }

    return {
      background: style.bgGradient,
      borderColor: style.border,
      color: style.text,
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  // Helper function to format time in venue timezone
  const formatTimeInVenueTimezone = (utcTimeString: string, venueTimezone?: string): string => {
    if (!venueTimezone) {
      // Fallback to UTC if no venue timezone
      const date = new Date(utcTimeString)
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
      })
    }

    const date = new Date(utcTimeString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: venueTimezone
    })
  }

  // Get active venue timezone (from selected venue or first venue)
  const getActiveVenueTimezone = useMemo(() => {
    if (filters.venueId && filters.venueId !== 'all') {
      const venue = resources.find(r => r.venueId === filters.venueId)
      return venue?.venueTimezone
    }
    // If no venue selected, use first venue's timezone
    return resources.length > 0 ? resources[0]?.venueTimezone : undefined
  }, [resources, filters.venueId])

  // Helper to get timezone label (e.g., "IST", "EST")
  const getTimezoneLabel = useMemo(() => {
    const tz = getActiveVenueTimezone
    if (!tz) return ''

    // Common timezone abbreviations
    const tzMap: Record<string, string> = {
      'Asia/Kolkata': 'IST',
      'Asia/Calcutta': 'IST',
      'America/New_York': 'EST',
      'America/Chicago': 'CST',
      'America/Denver': 'MST',
      'America/Los_Angeles': 'PST',
      'Europe/London': 'GMT',
      'UTC': 'UTC',
    }

    return tzMap[tz] || tz.split('/').pop()?.toUpperCase() || tz
  }, [getActiveVenueTimezone])

  // Initialize currentDate in venue timezone when resources load
  useEffect(() => {
    if (resources.length > 0 && getActiveVenueTimezone) {
      // Get "today" in venue timezone
      const now = new Date()
      const venueTodayStr = now.toLocaleDateString('en-US', { timeZone: getActiveVenueTimezone })
      const browserTodayStr = now.toLocaleDateString('en-US')

      // If dates differ, adjust currentDate to venue timezone's "today"
      if (venueTodayStr !== browserTodayStr) {
        const [month, day, year] = venueTodayStr.split('/').map(Number)
        const venueToday = new Date(year, month - 1, day)
        setCurrentDate(venueToday)
      }
    }
  }, [resources.length, getActiveVenueTimezone])

  // Helper function to format date in venue timezone
  const formatDateInVenueTimezone = (date: Date, venueTimezone?: string): string => {
    if (!venueTimezone) {
      // Fallback to UTC if no venue timezone
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      })
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: venueTimezone
    })
  }

  // Helper function to format short date in venue timezone
  const formatShortDateInVenueTimezone = (date: Date, venueTimezone?: string): string => {
    if (!venueTimezone) {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      })
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      timeZone: venueTimezone
    })
  }

  // Helper function to format year in venue timezone
  const formatYearInVenueTimezone = (date: Date, venueTimezone?: string): string => {
    if (!venueTimezone) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        timeZone: 'UTC'
      })
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      timeZone: venueTimezone
    })
  }

  // Helper function to check if date is today in venue timezone
  const isTodayInVenueTimezone = (date: Date, venueTimezone?: string): boolean => {
    const now = new Date()

    // Get today's date string in venue timezone
    const todayStr = venueTimezone
      ? now.toLocaleDateString('en-US', { timeZone: venueTimezone })
      : now.toLocaleDateString('en-US', { timeZone: 'UTC' })

    // Get the date's string in venue timezone
    const dateStr = venueTimezone
      ? date.toLocaleDateString('en-US', { timeZone: venueTimezone })
      : date.toLocaleDateString('en-US', { timeZone: 'UTC' })

    return todayStr === dateStr
  }

  // Helper function to get current time in venue timezone
  const getCurrentTimeInVenueTimezone = (venueTimezone?: string): { hour: number; minutes: number } => {
    const now = new Date()

    if (!venueTimezone) {
      return {
        hour: now.getUTCHours(),
        minutes: now.getUTCMinutes()
      }
    }

    // Format time in venue timezone and parse it
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: venueTimezone
    })

    const [hour, minutes] = timeStr.split(':').map(Number)
    return { hour, minutes }
  }

  // Helper function to get date components in venue timezone
  const getDateComponentsInVenueTimezone = (date: Date, venueTimezone?: string): { year: number; month: number; day: number; hour: number; minutes: number } => {
    if (!venueTimezone) {
      return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth(),
        day: date.getUTCDate(),
        hour: date.getUTCHours(),
        minutes: date.getUTCMinutes()
      }
    }

    // Get date string components in venue timezone
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: venueTimezone
    })

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: venueTimezone
    })

    const [month, day, year] = dateStr.split('/').map(Number)
    const [hour, minutes] = timeStr.split(':').map(Number)

    return { year, month: month - 1, day, hour, minutes }
  }

  // Helper function to check if two dates are the same day in venue timezone
  const isSameDayInVenueTimezone = (date1: Date, date2: Date, venueTimezone?: string): boolean => {
    const d1 = getDateComponentsInVenueTimezone(date1, venueTimezone)
    const d2 = getDateComponentsInVenueTimezone(date2, venueTimezone)

    return d1.year === d2.year && d1.month === d2.month && d1.day === d2.day
  }

  // Filter resources based on selected filters - MUST be before early return
  const filteredResources = useMemo(() => {
    let filtered = resources

    if (filters.venueId && filters.venueId !== 'all') {
      filtered = filtered.filter(r => r.venueId === filters.venueId)
    }

    if (filters.courtId && filters.courtId !== 'all') {
      filtered = filtered.filter(r => r.id === filters.courtId)
    }

    if (filters.sportId && filters.sportId !== 'all') {
      filtered = filtered.filter(r => r.sportId === filters.sportId)
    }

    return filtered
  }, [resources, filters.venueId, filters.courtId, filters.sportId])

  // Get unique venues for filter
  const uniqueVenues = useMemo(() => {
    const venues = new Set(resources.map(r => r.venueName))
    return Array.from(venues).sort()
  }, [resources])

  // Get filtered courts based on selected venue
  const filteredCourts = useMemo(() => {
    if (!filters.venueId || filters.venueId === 'all') {
      return resources
    }
    return resources.filter(r => r.venueId === filters.venueId)
  }, [resources, filters.venueId])

  // Group resources by venue, then by sport - depends on filteredResources
  const resourcesByVenueAndSport = useMemo(() => {
    // First group by venue
    const venueGroups = new Map<string, CalendarResource[]>()

    filteredResources.forEach(resource => {
      const venueId = resource.venueId || 'unknown'
      if (!venueGroups.has(venueId)) {
        venueGroups.set(venueId, [])
      }
      venueGroups.get(venueId)!.push(resource)
    })

    // Then group by sport within each venue
    return Array.from(venueGroups.entries()).map(([venueId, resources]) => {
      // Get venue name from first resource
      const venueName = resources[0]?.venueName || 'Unknown Venue'

      // Group resources by sport within this venue
      const sportGroups = new Map<string, CalendarResource[]>()
      resources.forEach(resource => {
        const sportId = resource.sportId || 'unknown'
        if (!sportGroups.has(sportId)) {
          sportGroups.set(sportId, [])
        }
        sportGroups.get(sportId)!.push(resource)
      })

      // Convert sport groups to array
      const sports = Array.from(sportGroups.entries()).map(([sportId, courts]) => {
        const sport = allSports.find(s => s.id === sportId)
        return {
          sportId,
          sportName: sport?.displayName || sport?.name || 'Unknown',
          courts: courts.sort((a, b) => a.title.localeCompare(b.title))
        }
      }).sort((a, b) => a.sportName.localeCompare(b.sportName))

      return {
        venueId,
        venueName,
        sports
      }
    }).sort((a, b) => a.venueName.localeCompare(b.venueName))
  }, [filteredResources, allSports])

  // Generate date range for week/month views
  const dateRange = useMemo((): Date[] => {
    const dates: Date[] = []
    const start = new Date(currentDate)

    if (viewMode === 'day') {
      dates.push(new Date(start))
    } else if (viewMode === 'week') {
      const dayOfWeek = start.getDay()
      const diff = start.getDate() - dayOfWeek
      start.setDate(diff)

      for (let i = 0; i < 7; i++) {
        const date = new Date(start)
        date.setDate(start.getDate() + i)
        dates.push(date)
      }
    } else {
      // For month view, show only 2 weeks at a time to prevent overcrowding
      const dayOfWeek = start.getDay()
      const diff = start.getDate() - dayOfWeek
      start.setDate(diff)

      for (let i = 0; i < 14; i++) {
        const date = new Date(start)
        date.setDate(start.getDate() + i)
        dates.push(date)
      }
    }

    return dates
  }, [currentDate, viewMode])

  // OPTIMIZED: Pre-compute bookings by court/date to avoid repeated filtering in render
  const bookingsByCourtDate = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>()

    bookings.forEach(booking => {
      const bookingStart = new Date(booking.start)
      const venueTimezone = booking.venueTimezone || getActiveVenueTimezone

      // Create a key for each court/date combination
      dateRange.forEach(date => {
        if (isSameDayInVenueTimezone(bookingStart, date, venueTimezone)) {
          const key = `${booking.resourceId}-${date.toISOString()}`
          if (!map.has(key)) {
            map.set(key, [])
          }
          map.get(key)!.push(booking)
        }
      })
    })

    return map
  }, [bookings, dateRange, getActiveVenueTimezone, isSameDayInVenueTimezone])

  // Early return AFTER all hooks
  if (loading && resources.length === 0) {
    return (
      <div className="space-y-6">
        {/* Filters skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-[220px]" />
            <Skeleton className="h-10 w-[150px]" />
            <Skeleton className="h-10 w-[150px]" />
            <Skeleton className="h-10 w-[150px]" />
            <Skeleton className="h-10 w-[140px]" />
            <Skeleton className="h-10 w-[140px]" />
          </div>
        </div>

        {/* Calendar header skeleton */}
        <div className="bg-white border border-gray-200 shadow-sm p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Calendar grid skeleton */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 border-b p-3">
                    <Skeleton className="h-5 w-40" />
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const timeSlots = generateTimeSlots
  const slotHeight = 60 // pixels per hour
  const totalTimelineHeight = timeSlots.length * slotHeight

  const getColumnWidth = () => {
    if (viewMode === 'day') return '350px'
    if (viewMode === 'week') return '250px'
    return '200px' // Month view - slightly narrower to fit more days
  }

  const columnWidth = getColumnWidth()

  return (
    <div className="space-y-4 h-full flex flex-col overflow-hidden">
      {/* Calendar Header and View - Grouped together */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Compact Unified Header - Theme Colors */}
        <div
          className="bg-white border border-gray-200 shadow-sm p-3 flex-shrink-0"
          style={{
            borderBottom: 'none',
            borderTopLeftRadius: '0.5rem',
            borderTopRightRadius: '0.5rem',
            borderBottomLeftRadius: '0',
            borderBottomRightRadius: '0'
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Title & Date */}
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: theme.colors.primary[500] }}
              >
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2
                  className="text-base font-semibold"
                  style={{ color: theme.colors.primary[900] }}
                >
                  Calendar View
                </h2>
                <p className="text-xs" style={{ color: theme.colors.primary[700] }}>
                  {formatDateInVenueTimezone(currentDate, getActiveVenueTimezone)}
                  {getTimezoneLabel && (
                    <span className="ml-1 font-medium">({getTimezoneLabel})</span>
                  )}
                </p>
              </div>
            </div>

            {/* Center: View Mode Controls */}
            <div className="flex items-center gap-1">
              <div className="flex items-center p-0.5 rounded-lg bg-muted">
                <button
                  onClick={() => setViewMode('day')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200',
                    viewMode === 'day'
                      ? 'text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  style={viewMode === 'day'
                    ? { backgroundColor: theme.colors.primary[500], color: 'white' }
                    : {}
                  }
                >
                  Day
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200',
                    viewMode === 'week'
                      ? 'text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  style={viewMode === 'week'
                    ? { backgroundColor: theme.colors.primary[500], color: 'white' }
                    : {}
                  }
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200',
                    viewMode === 'month'
                      ? 'text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  style={viewMode === 'month'
                    ? { backgroundColor: theme.colors.primary[500], color: 'white' }
                    : {}
                  }
                >
                  Month
                </button>
              </div>
            </div>

            {/* Right: Navigation & Actions */}
            <div className="flex items-center gap-2">
              {/* Date Navigation */}
              <div className="flex items-center gap-0.5 rounded-lg bg-muted">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-1.5 rounded-md transition-all duration-200 text-muted-foreground hover:text-foreground"
                  title="Previous"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button
                  onClick={() => {
                    // Set "Today" in venue timezone, not browser timezone
                    if (getActiveVenueTimezone) {
                      const now = new Date()
                      const venueTodayStr = now.toLocaleDateString('en-US', { timeZone: getActiveVenueTimezone })
                      const [month, day, year] = venueTodayStr.split('/').map(Number)
                      const venueToday = new Date(year, month - 1, day)
                      setCurrentDate(venueToday)
                    } else {
                      setCurrentDate(new Date())
                    }
                  }}
                  className="px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 text-muted-foreground hover:text-foreground"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-1.5 rounded-md transition-all duration-200 text-muted-foreground hover:text-foreground"
                  title="Next"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-0.5 rounded-lg bg-muted border border-border/50">
                <button
                  onClick={() => {
                    const newWidth = Math.max(MIN_TIME_SLOT_WIDTH, timeSlotWidth - ZOOM_STEP * 2)
                    setTimeSlotWidth(newWidth)
                    updatePreference('timeSlotWidth', newWidth)
                  }}
                  className="p-1.5 rounded-md transition-all duration-200 text-muted-foreground hover:text-foreground"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3 w-3" />
                </button>
                <div className="px-1.5 text-[10px] font-medium text-muted-foreground min-w-[32px] text-center">
                  {Math.round((timeSlotWidth / 60) * 100)}%
                </div>
                <button
                  onClick={() => {
                    const newWidth = Math.min(MAX_TIME_SLOT_WIDTH, timeSlotWidth + ZOOM_STEP * 2)
                    setTimeSlotWidth(newWidth)
                    updatePreference('timeSlotWidth', newWidth)
                  }}
                  className="p-1.5 rounded-md transition-all duration-200 text-muted-foreground hover:text-foreground"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3 w-3" />
                </button>
              </div>

              {/* Settings Menu - Contains refresh and reset */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1.5 rounded-md transition-all duration-200 text-muted-foreground hover:text-foreground"
                    title="More options"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() => loadBookings(true, true)} // Force manual refresh
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-3 w-3 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
                    Column Visibility
                  </DropdownMenuLabel>
                  {hasMultipleVenues && (
                    <DropdownMenuCheckboxItem
                      checked={showVenueColumn}
                      onCheckedChange={(checked) => {
                        setShowVenueColumn(checked)
                        updatePreference('showVenueColumn', checked)
                      }}
                    >
                      Venue
                    </DropdownMenuCheckboxItem>
                  )}
                  <DropdownMenuCheckboxItem checked={true} disabled>
                    Sport
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={true} disabled>
                    Court
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={showFormatColumn}
                    onCheckedChange={(checked) => {
                      setShowFormatColumn(checked)
                      updatePreference('showFormatColumn', checked)
                    }}
                  >
                    Format
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      resetToDefaults()
                      toast.success('Column preferences reset to defaults')
                    }}
                  >
                    <ResetIcon className="h-3 w-3 mr-2" />
                    Reset Preferences
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Calendar View - Attached to header */}
        <Card className="rounded-t-none border-t-0 py-0 flex-1 min-h-0 overflow-hidden flex flex-col">
          <CardContent className="px-4 py-0 flex-1 overflow-auto min-h-0">
            <div ref={containerRef} className="h-full w-full">
              {/* Date-based horizontal timeline */}
              <div className="space-y-4 py-4" ref={calendarGridRef}>
                {/* Date rows for week/month view */}
                {dateRange.map((date) => {
                  return (
                    <div key={date.toISOString()} className="border rounded-lg overflow-hidden">
                      {/* Date header - Simplified, no sticky positioning */}
                      <div className="bg-muted/50 border-b p-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">
                            {formatShortDateInVenueTimezone(date, getActiveVenueTimezone)}
                            {isTodayInVenueTimezone(date, getActiveVenueTimezone) && (
                              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                                Today
                              </Badge>
                            )}
                          </h4>
                          <div className="text-xs text-muted-foreground">
                            {formatYearInVenueTimezone(date, getActiveVenueTimezone)}
                            {getTimezoneLabel && (
                              <span className="ml-1">({getTimezoneLabel})</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Horizontal timeline for this date */}
                      <div className="overflow-x-auto">
                        <div
                          style={{
                            minWidth: `${(showVenueColumn ? venueColumnWidth : 0) + sportColumnWidth + courtColumnWidth + (showFormatColumn ? formatColumnWidth : 0) + (timeSlots.length * timeSlotWidth)}px`,
                            transition: 'min-width 0.08s cubic-bezier(0.4, 0, 0.2, 1)',
                            willChange: 'min-width'
                          }}
                        >
                          {/* Time header - Simplified sticky positioning */}
                          <div className="flex border-b">
                            {/* Venue column header - only show if multiple venues */}
                            {showVenueColumn && (
                              <div className="bg-white border-r p-2 text-center font-medium text-xs relative group" style={{ width: `${venueColumnWidth}px`, minWidth: `${venueColumnWidth}px` }}>
                                Venue
                                {/* Resize handle */}
                                <div
                                  className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ right: '-2px', width: '6px' }}
                                  onMouseDown={(e) => handleResizeStart('venue', e)}
                                />
                              </div>
                            )}
                            {/* Sport column header */}
                            <div className="bg-white border-r p-2 text-center font-medium text-xs relative group" style={{ width: `${sportColumnWidth}px`, minWidth: `${sportColumnWidth}px` }}>
                              Sport
                              {/* Resize handle */}
                              <div
                                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ right: '-2px', width: '6px' }}
                                onMouseDown={(e) => handleResizeStart('sport', e)}
                              />
                            </div>
                            {/* Court column header */}
                            <div className="bg-white border-r p-2 text-center font-medium text-xs relative group" style={{ width: `${courtColumnWidth}px`, minWidth: `${courtColumnWidth}px` }}>
                              Court
                              {/* Resize handle */}
                              <div
                                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ right: '-2px', width: '6px' }}
                                onMouseDown={(e) => handleResizeStart('court', e)}
                              />
                            </div>
                            {/* Format column header - only show if format column is enabled */}
                            {showFormatColumn && (
                              <div className="bg-white border-r p-2 text-center font-medium text-xs relative group" style={{ width: `${formatColumnWidth}px`, minWidth: `${formatColumnWidth}px` }}>
                                Format
                                {/* Resize handle */}
                                <div
                                  className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ right: '-2px', width: '6px' }}
                                  onMouseDown={(e) => handleResizeStart('format', e)}
                                />
                              </div>
                            )}

                            {/* Time slots as columns */}
                            {timeSlots.map((slot, index) => (
                              <div
                                key={slot}
                                data-time-slot
                                className={cn(
                                  "p-1 text-center text-xs font-medium relative group",
                                  index < timeSlots.length - 1 && "border-r" // Don't add border to last column
                                )}
                                style={{
                                  width: `${timeSlotWidth}px`,
                                  minWidth: `${timeSlotWidth}px`,
                                  transition: 'width 0.08s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.08s cubic-bezier(0.4, 0, 0.2, 1)',
                                  willChange: 'width, min-width',
                                  zIndex: 10
                                }}
                              >
                                {slot}
                                {/* Resize handle - only show on first time slot */}
                                {index === 0 && (
                                  <div
                                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    onMouseDown={(e) => handleResizeStart('timeSlot', e)}
                                  />
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Venue groups with sports and courts for this date */}
                          {resourcesByVenueAndSport.map((venueGroup, venueGroupIndex) => {
                            // Use consistent white background for all venue cells within the same venue group
                            const venueColumnBg = 'bg-white'
                            const isFirstVenue = venueGroupIndex === 0
                            const isLastVenue = venueGroupIndex === resourcesByVenueAndSport.length - 1

                            return (
                              <div
                                key={`${venueGroup.venueId}-${date.toISOString()}`}
                                className={cn(
                                  // Add border, shadow, and rounded corners for card-like appearance
                                  "border border-gray-200 rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]",
                                  // Add spacing between venues for better visual separation
                                  !isLastVenue && "mb-2"
                                )}
                              >
                                {venueGroup.sports.map((sportGroup, sportGroupIndex) => {
                                  const sportColor = getSportColor(sportGroup.sportId, sportGroup.sportName)
                                  const sportBgColor = hexToRgba(sportColor, 0.15) // Light background for time slots
                                  // Use sport color at full opacity for category columns to prevent transparency
                                  const sportColumnBgColor = sportColor // Fully opaque sport color

                                  return (
                                    <div key={`${sportGroup.sportId}-${venueGroup.venueId}-${date.toISOString()}`}>
                                      {sportGroup.courts.map((resource, courtIndex) => {
                                        const isLastCourt = courtIndex === sportGroup.courts.length - 1
                                        const isLastSport = sportGroupIndex === venueGroup.sports.length - 1
                                        const isFirstCourt = courtIndex === 0
                                        const isFirstSport = sportGroupIndex === 0
                                        const isFirstRowOfVenue = courtIndex === 0 && isFirstSport

                                        return (
                                          <div
                                            key={`${resource.id}-${date.toISOString()}`}
                                            className={cn(
                                              "flex",
                                              // Thin border between courts (except last court of last sport)
                                              !isLastCourt && "border-b border-b-white",
                                              // Thick border between sports (last court of each sport, except last sport)
                                              isLastCourt && !isLastSport && "border-b-2 border-b-white"
                                            )}
                                          >
                                            {/* Venue name (only show on first court of first sport of each venue) */}
                                            {showVenueColumn && (
                                              <div
                                                className={cn(
                                                  "border-r p-2 flex items-center justify-start font-medium text-xs",
                                                  venueColumnBg,
                                                  "border-b-0 border-t-0 border-l-0"
                                                )}
                                                style={{
                                                  width: `${venueColumnWidth}px`,
                                                  minWidth: `${venueColumnWidth}px`,
                                                  backgroundColor: 'white'
                                                }}
                                              >
                                                {courtIndex === 0 && isFirstSport && (
                                                  <div
                                                    className="truncate font-semibold"
                                                    title={venueGroup.venueName}
                                                  >
                                                    {venueGroup.venueName}
                                                  </div>
                                                )}
                                              </div>
                                            )}

                                            {/* Sport name (only show on first court of each sport) */}
                                            <div
                                              className="border-r p-2 flex items-center justify-start font-medium text-xs"
                                              style={{
                                                width: `${sportColumnWidth}px`,
                                                minWidth: `${sportColumnWidth}px`,
                                                backgroundColor: sportColumnBgColor,
                                                color: 'white',
                                                opacity: 1
                                              }}
                                            >
                                              {courtIndex === 0 && (
                                                <div
                                                  className="truncate font-semibold"
                                                  title={sportGroup.sportName}
                                                >
                                                  {sportGroup.sportName}
                                                </div>
                                              )}
                                            </div>

                                            {/* Court name */}
                                            <div
                                              className="border-r p-2 flex items-center justify-start font-medium text-xs"
                                              style={{
                                                width: `${courtColumnWidth}px`,
                                                minWidth: `${courtColumnWidth}px`,
                                                backgroundColor: sportColumnBgColor,
                                                color: 'white',
                                                opacity: 1
                                              }}
                                            >
                                              <div className="truncate" title={resource.title}>
                                                {showFormatColumn ? resource.title.split(' - ')[0] : resource.title}
                                              </div>
                                            </div>

                                            {/* Format name - only show if format column is enabled */}
                                            {showFormatColumn && (
                                              <div
                                                className="border-r p-2 flex items-center justify-start font-medium text-xs"
                                                style={{
                                                  width: `${formatColumnWidth}px`,
                                                  minWidth: `${formatColumnWidth}px`,
                                                  backgroundColor: sportColumnBgColor,
                                                  color: 'white',
                                                  opacity: 1
                                                }}
                                              >
                                                <div className="truncate" title={resource.formatName || 'No Format'}>
                                                  {resource.formatName || 'No Format'}
                                                </div>
                                              </div>
                                            )}

                                            {/* Time slots container - wrap in relative container for absolute positioning */}
                                            <div
                                              className="relative flex overflow-hidden"
                                              style={{
                                                position: 'relative',
                                                width: `${timeSlots.length * timeSlotWidth}px`,
                                                minWidth: `${timeSlots.length * timeSlotWidth}px`,
                                                maxWidth: `${timeSlots.length * timeSlotWidth}px`,
                                                zIndex: 1 // Lower than categorical columns (z-30)
                                              }}
                                            >
                                              {/* Time slots for this court on this date */}
                                              {/* OPTIMIZED: Use pre-computed bookings map for better performance */}
                                              {(() => {
                                                // Calculate dynamic row height once for this court/date row
                                                const key = `${resource.id}-${date.toISOString()}`
                                                const courtDateBookings = bookingsByCourtDate.get(key) || []
                                                const uniqueBookings = Array.from(new Map(courtDateBookings.map(b => [b.id, b])).values())
                                                const venueTimezone = resource.venueTimezone || getActiveVenueTimezone || 'UTC'
                                                const bookingPositions = calculateBookingPositions(uniqueBookings, venueTimezone)
                                                const maxRows = bookingPositions instanceof Map
                                                  ? Math.max(...Array.from(bookingPositions.values()).map(p => p.totalRows), 1)
                                                  : 1

                                                // Base row height scales with zoom level
                                                const baseRowHeight = Math.max(40, Math.min(100, 40 + (timeSlotWidth - 60) * 0.2))

                                                // When multiple formats exist (stacked bookings), multiply row height by number of stacks
                                                const dynamicRowHeight = maxRows > 1
                                                  ? baseRowHeight * maxRows
                                                  : baseRowHeight

                                                return timeSlots.map((slot, slotIndex) => {
                                                  const [hours, minutes] = slot.split(':').map(Number)

                                                  // Find bookings that overlap with this time slot
                                                  const slotBookings = courtDateBookings.filter(booking => {
                                                    const bookingStart = new Date(booking.start)
                                                    const bookingEnd = new Date(booking.end)

                                                    // Get booking time components in venue timezone
                                                    const bookingStartComponents = getDateComponentsInVenueTimezone(bookingStart, venueTimezone)
                                                    const bookingEndComponents = getDateComponentsInVenueTimezone(bookingEnd, venueTimezone)

                                                    // Check if booking overlaps with this time slot
                                                    const bookingStartMinutes = bookingStartComponents.hour * 60 + bookingStartComponents.minutes
                                                    const bookingEndMinutes = bookingEndComponents.hour * 60 + bookingEndComponents.minutes
                                                    const slotStartMinutes = hours * 60 + minutes
                                                    const slotEndMinutes = (hours + 1) * 60 + minutes

                                                    // Booking overlaps if: bookingStart < slotEnd && bookingEnd > slotStart
                                                    return bookingStartMinutes < slotEndMinutes && bookingEndMinutes > slotStartMinutes
                                                  })

                                                  const isDragOver = dragOverSlot?.courtId === resource.id &&
                                                    dragOverSlot?.date.toISOString().split('T')[0] === date.toISOString().split('T')[0] &&
                                                    dragOverSlot?.slot === slot

                                                  return (
                                                    <div
                                                      key={`${resource.id}-${date.toISOString()}-${slot}`}
                                                      data-time-slot
                                                      onDragOver={(e) => handleDragOver(e, resource.id, date, slot)}
                                                      onDrop={(e) => handleDrop(e, resource.id, date, slot)}
                                                      className={cn(
                                                        "hover:bg-muted/20 transition-colors",
                                                        slotIndex < timeSlots.length - 1 && "border-r", // Don't add border to last column
                                                        isDragOver && "bg-blue-100 border-blue-400 border-2"
                                                      )}
                                                      style={{
                                                        width: `${timeSlotWidth}px`,
                                                        minWidth: `${timeSlotWidth}px`,
                                                        height: `${dynamicRowHeight}px`,
                                                        backgroundColor: isDragOver ? '#dbeafe' : sportBgColor,
                                                        transition: 'width 0.08s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.08s cubic-bezier(0.4, 0, 0.2, 1), height 0.2s ease-in-out',
                                                        willChange: 'width, min-width, height'
                                                      }}
                                                    />
                                                  )
                                                })
                                              })()}

                                              {/* Render all bookings once, positioned absolutely across slots */}
                                              {(() => {
                                                const key = `${resource.id}-${date.toISOString()}`
                                                const courtDateBookings = bookingsByCourtDate.get(key) || []
                                                const venueTimezone = resource.venueTimezone || getActiveVenueTimezone

                                                // Group bookings by ID to avoid duplicates
                                                const uniqueBookings = Array.from(new Map(courtDateBookings.map(b => [b.id, b])).values())

                                                // Calculate vertical positions for overlapping bookings
                                                const bookingPositions = calculateBookingPositions(uniqueBookings, venueTimezone || getActiveVenueTimezone || 'UTC')

                                                // Calculate row height based on zoom level and number of overlapping bookings
                                                const maxRows = bookingPositions instanceof Map
                                                  ? Math.max(...Array.from(bookingPositions.values()).map(p => p.totalRows), 1)
                                                  : 1

                                                // Base row height scales with zoom level (timeSlotWidth)
                                                // At 60px (100% zoom): 40px base height
                                                // At 120px (200% zoom): 60px base height
                                                // At 300px (500% zoom): 100px base height
                                                const baseRowHeight = Math.max(40, Math.min(100, 40 + (timeSlotWidth - 60) * 0.2))

                                                // When multiple formats exist (stacked bookings), multiply row height by number of stacks
                                                // This ensures each booking has adequate space
                                                const totalRowHeight = maxRows > 1
                                                  ? baseRowHeight * maxRows // Multiply base height by number of stacks
                                                  : baseRowHeight

                                                // Each booking gets equal share of the total height, with small gaps
                                                const rowGap = maxRows > 1 ? 3 : 0 // 3px gap between stacked bookings
                                                const rowHeight = maxRows > 1
                                                  ? (totalRowHeight - (maxRows - 1) * rowGap) / maxRows // Divide height minus gaps
                                                  : baseRowHeight

                                                return uniqueBookings.map((booking) => {
                                                  const bookingStart = new Date(booking.start)
                                                  const bookingEnd = new Date(booking.end)

                                                  // Get booking time components in venue timezone
                                                  const bookingStartComponents = getDateComponentsInVenueTimezone(bookingStart, venueTimezone)
                                                  const bookingEndComponents = getDateComponentsInVenueTimezone(bookingEnd, venueTimezone)

                                                  // Calculate position in minutes from start of day
                                                  const bookingStartMinutes = bookingStartComponents.hour * 60 + bookingStartComponents.minutes
                                                  const bookingEndMinutes = bookingEndComponents.hour * 60 + bookingEndComponents.minutes

                                                  // Find which slot this booking starts in
                                                  const startSlotIndex = timeSlots.findIndex(slot => {
                                                    const [slotHours] = slot.split(':').map(Number)
                                                    const slotStartMinutes = slotHours * 60
                                                    const slotEndMinutes = (slotHours + 1) * 60
                                                    // Booking starts in this slot if: bookingStart >= slotStart && bookingStart < slotEnd
                                                    return bookingStartMinutes >= slotStartMinutes && bookingStartMinutes < slotEndMinutes
                                                  })

                                                  // If booking doesn't start in any visible slot, skip it
                                                  if (startSlotIndex === -1) {
                                                    return null
                                                  }

                                                  // Calculate offset within the starting slot (in minutes)
                                                  const [startSlotHours] = timeSlots[startSlotIndex].split(':').map(Number)
                                                  const slotStartMinutes = startSlotHours * 60
                                                  const offsetMinutes = bookingStartMinutes - slotStartMinutes

                                                  // Calculate total duration
                                                  const totalDurationMinutes = bookingEndMinutes - bookingStartMinutes

                                                  // Calculate the maximum visible end time (end of last slot)
                                                  const lastSlotIndex = timeSlots.length - 1
                                                  const [lastSlotHours] = timeSlots[lastSlotIndex].split(':').map(Number)
                                                  const maxVisibleEndMinutes = (lastSlotHours + 1) * 60 // End of last slot (e.g., 24:00 = 1440 minutes)

                                                  // Cap the booking end time to not extend beyond visible slots
                                                  const cappedEndMinutes = Math.min(bookingEndMinutes, maxVisibleEndMinutes)
                                                  const cappedDurationMinutes = cappedEndMinutes - bookingStartMinutes

                                                  // Calculate left position: slot index * slot width + offset within slot (in pixels)
                                                  // Each slot is timeSlotWidth pixels wide, so position = slotIndex * width + (offsetMinutes / 60) * width
                                                  const leftPx = startSlotIndex * timeSlotWidth + (offsetMinutes / 60) * timeSlotWidth

                                                  // Calculate total width in pixels (capped to not exceed visible area)
                                                  const widthPx = Math.min(
                                                    (cappedDurationMinutes / 60) * timeSlotWidth,
                                                    (timeSlots.length * timeSlotWidth) - leftPx // Don't exceed container width
                                                  )

                                                  // Get vertical position
                                                  const position = bookingPositions instanceof Map
                                                    ? (bookingPositions.get(booking.id) || { row: 0, totalRows: 1 })
                                                    : { row: 0, totalRows: 1 }
                                                  // Center the booking vertically within its row slot with 10% gap for clear boundaries
                                                  const verticalGap = rowHeight * 0.05 // 5% gap on top and bottom (10% total)
                                                  const topPx = 2 + (position.row * (rowHeight + rowGap)) + verticalGap
                                                  const heightPx = rowHeight * 0.9 // 10% less than row height for clear boundaries (applies to all bookings)

                                                  const eventStyle = getEventStyle(booking)
                                                  const isDragging = draggedBooking?.id === booking.id

                                                  return (
                                                    <div
                                                      key={booking.id}
                                                      draggable
                                                      onDragStart={(e) => handleDragStart(e, booking)}
                                                      onDragEnd={handleDragEnd}
                                                      className={cn(
                                                        'absolute rounded-md text-xs cursor-move transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl hover:scale-105 hover:z-20 overflow-hidden border',
                                                        isDragging && 'opacity-50',
                                                        draggedBooking && draggedBooking.id !== booking.id && 'opacity-100'
                                                      )}
                                                      style={{
                                                        left: `${leftPx}px`,
                                                        width: `${widthPx}px`,
                                                        top: `${topPx}px`,
                                                        height: `${heightPx}px`,
                                                        minWidth: '20px',
                                                        borderRadius: '6px',
                                                        ...eventStyle,
                                                        borderWidth: '1px',
                                                      }}
                                                      onClick={() => handleEventClick(booking)}
                                                      onContextMenu={(e) => handleContextMenu(e, booking)}
                                                      title={`${booking.customerName} - ${booking.status} - $${Number(booking.totalAmount || 0).toFixed(2)}${booking.format?.displayName ? ` - ${booking.format.displayName}` : ''}${booking.sportName ? ` - ${booking.sportName}` : ''}`}
                                                    >
                                                      <div className="font-semibold truncate text-[11px] px-1.5 leading-tight flex items-center gap-1">
                                                        <span>{booking.customerName.split(' ')[0]}</span>
                                                        {booking.format?.displayName && (
                                                          <span className="text-[9px] font-bold bg-white/30 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/50">
                                                            {booking.format.displayName}
                                                          </span>
                                                        )}
                                                      </div>
                                                      <div className="text-[9px] opacity-90 px-1.5 leading-tight flex items-center gap-1.5">
                                                        <span>{formatTimeInVenueTimezone(booking.start, booking.venueTimezone)}</span>
                                                        {booking.format?.playersPerTeam && (
                                                          <span className="text-[8px] opacity-75">
                                                            ({booking.format.playersPerTeam}p)
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  )
                                                })
                                              })()}

                                              {/* Calculate dynamic row height for this court/date row */}
                                              {(() => {
                                                const key = `${resource.id}-${date.toISOString()}`
                                                const courtDateBookings = bookingsByCourtDate.get(key) || []
                                                const uniqueBookings = Array.from(new Map(courtDateBookings.map(b => [b.id, b])).values())
                                                const venueTimezone = resource.venueTimezone || getActiveVenueTimezone || 'UTC'
                                                const bookingPositions = calculateBookingPositions(uniqueBookings, venueTimezone)
                                                const maxRows = bookingPositions instanceof Map
                                                  ? Math.max(...Array.from(bookingPositions.values()).map(p => p.totalRows), 1)
                                                  : 1

                                                // Base row height scales with zoom level
                                                const baseRowHeight = Math.max(40, Math.min(100, 40 + (timeSlotWidth - 60) * 0.2))

                                                // When multiple formats exist (stacked bookings), multiply row height by number of stacks
                                                const dynamicRowHeight = maxRows > 1
                                                  ? baseRowHeight * maxRows
                                                  : baseRowHeight

                                                return dynamicRowHeight
                                              })()}

                                              {/* Empty slots - create booking buttons */}
                                              {timeSlots.map((slot, slotIndex) => {
                                                const [hours, minutes] = slot.split(':').map(Number)
                                                const key = `${resource.id}-${date.toISOString()}`
                                                const courtDateBookings = bookingsByCourtDate.get(key) || []
                                                const venueTimezone = resource.venueTimezone || getActiveVenueTimezone

                                                // Calculate dynamic row height for this row
                                                const uniqueBookings = Array.from(new Map(courtDateBookings.map(b => [b.id, b])).values())
                                                const bookingPositions = calculateBookingPositions(uniqueBookings, venueTimezone || getActiveVenueTimezone || 'UTC')
                                                const maxRows = bookingPositions instanceof Map
                                                  ? Math.max(...Array.from(bookingPositions.values()).map(p => p.totalRows), 1)
                                                  : 1
                                                const baseRowHeight = Math.max(40, Math.min(100, 40 + (timeSlotWidth - 60) * 0.2))

                                                // When multiple formats exist (stacked bookings), multiply row height by number of stacks
                                                const dynamicRowHeight = maxRows > 1
                                                  ? baseRowHeight * maxRows
                                                  : baseRowHeight

                                                // Check if this slot has any bookings
                                                const hasBooking = courtDateBookings.some(booking => {
                                                  const bookingStart = new Date(booking.start)
                                                  const bookingEnd = new Date(booking.end)
                                                  const bookingStartComponents = getDateComponentsInVenueTimezone(bookingStart, venueTimezone)
                                                  const bookingEndComponents = getDateComponentsInVenueTimezone(bookingEnd, venueTimezone)
                                                  const bookingStartMinutes = bookingStartComponents.hour * 60 + bookingStartComponents.minutes
                                                  const bookingEndMinutes = bookingEndComponents.hour * 60 + bookingEndComponents.minutes
                                                  const slotStartMinutes = hours * 60 + minutes
                                                  const slotEndMinutes = (hours + 1) * 60 + minutes
                                                  return bookingStartMinutes < slotEndMinutes && bookingEndMinutes > slotStartMinutes
                                                })

                                                const isDragOver = dragOverSlot?.courtId === resource.id &&
                                                  dragOverSlot?.date.toISOString().split('T')[0] === date.toISOString().split('T')[0] &&
                                                  dragOverSlot?.slot === slot

                                                if (hasBooking) return null

                                                return (
                                                  <button
                                                    key={`empty-${resource.id}-${date.toISOString()}-${slot}`}
                                                    onClick={() => handleCreateBooking(resource.id, date, slot)}
                                                    onDragOver={(e) => handleDragOver(e, resource.id, date, slot)}
                                                    onDrop={(e) => handleDrop(e, resource.id, date, slot)}
                                                    className={cn(
                                                      'absolute opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center group',
                                                      isDragOver && 'opacity-100 bg-blue-100 border-2 border-blue-400 border-dashed'
                                                    )}
                                                    style={{
                                                      left: `${slotIndex * timeSlotWidth}px`,
                                                      width: `${timeSlotWidth}px`,
                                                      height: '40px',
                                                      top: 0,
                                                    }}
                                                    title="Click to create new booking"
                                                  >
                                                    {isDragOver ? (
                                                      <div className="text-xs text-blue-600 font-medium">Drop here</div>
                                                    ) : (
                                                      <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                                    )}
                                                  </button>
                                                )
                                              })}

                                              {/* Current time indicator for today */}
                                              {isTodayInVenueTimezone(date, getActiveVenueTimezone) &&
                                                (() => {
                                                  const { hour: currentHour, minutes: currentMinutes } = getCurrentTimeInVenueTimezone(getActiveVenueTimezone)
                                                  const currentSlotIndex = timeSlots.findIndex(slot => {
                                                    const [hours] = slot.split(':').map(Number)
                                                    return hours === currentHour
                                                  })

                                                  if (currentSlotIndex !== -1) {
                                                    const leftPx = currentSlotIndex * timeSlotWidth + (currentMinutes / 60) * timeSlotWidth
                                                    return (
                                                      <div
                                                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                                                        style={{ left: `${leftPx}px` }}
                                                      >
                                                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
                                                      </div>
                                                    )
                                                  }
                                                  return null
                                                })()}
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onEdit={handleEditBooking}
        onCancel={cancelBooking}
        onComplete={markComplete}
        onSendSMS={sendSMS}
        onViewCustomer={handleViewCustomer}
        onUpdate={handleUpdateBooking}
        vendorId={vendorId || undefined}
        courts={resources.map(r => ({
          id: r.id,
          name: r.title.split(' (')[0],
          venueName: r.venueName,
          sportName: r.sportName,
          venueId: r.venueId,
        }))}
      />

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.booking && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}
        >
          {contextMenuActions.map((action) => (
            <button
              key={action.action}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2 transition-colors"
              onClick={() => handleContextMenuAction(action.action, contextMenu.booking!)}
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Drag and Drop Confirmation Modal */}
      <Dialog open={pendingChange !== null} onOpenChange={(open) => !open && cancelBookingChange()}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] sm:w-[90vw] md:w-[512px]">
          <DialogHeader>
            <DialogTitle>Confirm Booking Reschedule</DialogTitle>
            <DialogDescription>
              Please review the changes before confirming the booking reschedule.
            </DialogDescription>
          </DialogHeader>

          {pendingChange && (() => {
            // Check if time actually changed
            const originalStart = new Date(pendingChange.booking.start).getTime()
            const originalEnd = new Date(pendingChange.booking.end).getTime()
            const newStart = pendingChange.newStartTime.getTime()
            const newEnd = pendingChange.newEndTime.getTime()
            const timeChanged = originalStart !== newStart || originalEnd !== newEnd

            // Check if court changed
            const courtChanged = pendingChange.booking.resourceId !== pendingChange.targetCourtId

            // Check if booking is in final state or past
            const bookingStatusUpper = pendingChange.booking.status?.toUpperCase()
            const isFinalState = bookingStatusUpper === 'COMPLETED' || bookingStatusUpper === 'CANCELLED'
            const bookingEndDate = new Date(pendingChange.booking.end)
            const isPastBooking = bookingEndDate < new Date()

            return (
              <div className="space-y-4 py-4">
                {/* Warning for final states or past bookings */}
                {(isFinalState || isPastBooking) && (
                  <Alert variant="destructive" className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800 dark:text-yellow-200">
                      {isFinalState && isPastBooking
                        ? 'Moving Historical Final State Booking'
                        : isFinalState
                          ? 'Moving Final State Booking'
                          : 'Moving Past Booking'}
                    </AlertTitle>
                    <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                      {isFinalState && isPastBooking
                        ? `This booking is in a final state (${pendingChange.booking.status}) and has already ended. Moving it may affect historical records, payments, reporting, and analytics. Please proceed with caution.`
                        : isFinalState
                          ? `This booking is in a final state (${pendingChange.booking.status}). Moving it may affect historical records, payments, or reporting. Please proceed with caution.`
                          : 'This booking has already ended. Moving past bookings may affect historical records, reporting, and analytics. Please proceed with caution.'}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Booking Info */}
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm font-medium mb-2">Booking Details</div>
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">Customer:</span> {pendingChange.booking.customerName}</div>
                    <div><span className="font-medium">Court:</span> {pendingChange.booking.courtName}</div>
                    <div><span className="font-medium">Venue:</span> {pendingChange.booking.venueName}</div>
                    {pendingChange.venueTimezone && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Timezone: {pendingChange.venueTimezone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Time Changes - Only show if time actually changed */}
                {timeChanged && (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Time Changes</div>

                    {/* Old Time */}
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <div className="text-xs text-red-600 font-medium mb-1">Current Time</div>
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatTimeInVenueTimezone(pendingChange.booking.start, pendingChange.venueTimezone)} - {formatTimeInVenueTimezone(pendingChange.booking.end, pendingChange.venueTimezone)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDateInVenueTimezone(new Date(pendingChange.booking.start), pendingChange.venueTimezone)}
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <ChevronRight className="h-5 w-5 text-muted-foreground rotate-90" />
                    </div>

                    {/* New Time */}
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <div className="text-xs text-green-600 font-medium mb-1">New Time</div>
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatTimeInVenueTimezone(pendingChange.newStartTime.toISOString(), pendingChange.venueTimezone)} - {formatTimeInVenueTimezone(pendingChange.newEndTime.toISOString(), pendingChange.venueTimezone)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDateInVenueTimezone(pendingChange.targetDate, pendingChange.venueTimezone)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Court Change Warning */}
                {courtChanged && (() => {
                  const newCourt = resources.find(r => r.id === pendingChange.targetCourtId)
                  const newCourtName = newCourt?.title || 'Unknown Court'
                  // Format the "From" court name to include venue for consistency
                  const fromCourtName = pendingChange.booking.venueName
                    ? `${pendingChange.booking.courtName} (${pendingChange.booking.venueName})`
                    : pendingChange.booking.courtName
                  return (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                      <div className="text-xs text-yellow-800 font-medium mb-1 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>Court Change</span>
                      </div>
                      <div className="text-sm text-yellow-700 space-y-1">
                        <div>This booking will be moved to a different court.</div>
                        <div className="font-medium">
                          <span className="text-yellow-800">From:</span> {fromCourtName}
                        </div>
                        <div className="font-medium">
                          <span className="text-yellow-800">To:</span> {newCourtName}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Show summary if only court changed (no time change) */}
                {!timeChanged && courtChanged && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <div className="text-sm text-blue-700">
                      Time remains the same. Only the court will change.
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          <DialogFooter>
            <Button variant="outline" onClick={cancelBookingChange}>
              Cancel
            </Button>
            <Button onClick={confirmBookingChange}>
              Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

