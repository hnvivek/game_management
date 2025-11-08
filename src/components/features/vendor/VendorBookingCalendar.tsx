'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Filter, Settings, RefreshCw, ChevronLeft, ChevronRight, Clock, X, Search, Plus } from 'lucide-react'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useVendor } from '@/hooks/use-vendor'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'
import { theme } from '@/styles/theme/tokens'
import { fetchVendorBookings, VendorBookingFilters } from '@/lib/api/vendor/bookings'
import { useBookingsCache } from '@/hooks/use-bookings-cache'
import { getSportColor, hexToRgba } from '@/styles/theme/sport-colors'
import { toast } from 'sonner'
import { BookingDetailsModal } from './BookingDetailsModal'

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
}

interface VendorBookingCalendarProps {
  onError?: (error: string) => void
}

type ViewMode = 'day' | 'week' | 'month'

export function VendorBookingCalendar({ onError }: VendorBookingCalendarProps) {
  const { vendorId } = useVendor()
  const [bookings, setBookings] = useState<CalendarBooking[]>([])
  const [resources, setResources] = useState<CalendarResource[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Shared bookings cache
  const { getCached, setCached, findOverlappingRange, clearCache } = useBookingsCache()

  // Filter states with persistence
  const FILTER_STORAGE_KEY = `vendor-calendar-filters-${vendorId || 'default'}`
  
  const loadFiltersFromStorage = () => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = localStorage.getItem(FILTER_STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  const saveFiltersToStorage = (filters: Record<string, string>) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters))
    } catch {
      // Ignore storage errors
    }
  }

  const savedFilters = loadFiltersFromStorage()
  const [selectedVenue, setSelectedVenue] = useState<string>(savedFilters.venue || 'all')
  const [selectedCourt, setSelectedCourt] = useState<string>(savedFilters.court || 'all')
  const [selectedSport, setSelectedSport] = useState<string>(savedFilters.sport || 'all')
  const [selectedStatus, setSelectedStatus] = useState<string>(savedFilters.status || 'all')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>(savedFilters.paymentStatus || 'all')
  const [searchQuery, setSearchQuery] = useState<string>(savedFilters.search || '')

  // Save filters to localStorage whenever they change
  useEffect(() => {
    saveFiltersToStorage({
      venue: selectedVenue,
      court: selectedCourt,
      sport: selectedSport,
      status: selectedStatus,
      paymentStatus: selectedPaymentStatus,
      search: searchQuery,
    })
  }, [selectedVenue, selectedCourt, selectedSport, selectedStatus, selectedPaymentStatus, searchQuery, FILTER_STORAGE_KEY])
  
  // Filter options data
  const [allSports, setAllSports] = useState<Array<{ id: string; name: string; displayName: string }>>([])
  
  // Resizable column widths
  const [sportColumnWidth, setSportColumnWidth] = useState(100)
  const [courtColumnWidth, setCourtColumnWidth] = useState(150)
  const [timeSlotWidth, setTimeSlotWidth] = useState(60)
  
  // Resize state
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const resizeStartX = useRef<number>(0)
  const resizeStartWidth = useRef<number>(0)
  
  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Booking details modal state
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [draggedBooking, setDraggedBooking] = useState<CalendarBooking | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<{ courtId: string; date: Date; slot: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

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
    switch (action) {
      case 'view':
        handleEventClick(booking)
        break
      case 'edit':
        handleEditBooking(booking)
        break
      case 'sms':
        sendSMS(booking)
        break
      case 'cancel':
        cancelBooking(booking.id)
        break
      case 'complete':
        markComplete(booking.id)
        break
      case 'customer':
        handleViewCustomer(booking.customerEmail)
        break
    }
    setContextMenu({ visible: false, x: 0, y: 0, booking: null })
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
        loadBookings(true)
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
        loadBookings(true)
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

    const [hours, minutes] = targetSlot.split(':').map(Number)
    const newStart = new Date(targetDate)
    newStart.setHours(hours, minutes, 0, 0)
    
    const oldStart = new Date(draggedBooking.start)
    const oldEnd = new Date(draggedBooking.end)
    const duration = oldEnd.getTime() - oldStart.getTime()
    
    const newEnd = new Date(newStart.getTime() + duration)

    // Check for conflicts
    const conflicts = bookings.filter(b => 
      b.id !== draggedBooking.id &&
      b.resourceId === targetCourtId &&
      new Date(b.start).toISOString().split('T')[0] === targetDate.toISOString().split('T')[0] &&
      ((new Date(b.start) < newEnd && new Date(b.end) > newStart))
    )

    if (conflicts.length > 0) {
      toast.error('Cannot move booking: Time slot conflicts with existing booking')
      handleDragEnd()
      return
    }

    try {
      // Update booking via API
      const response = await fetch(`/api/bookings/${draggedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
          courtId: targetCourtId,
        })
      })

      if (response.ok) {
        clearCache()
        loadBookings(true)
        toast.success('Booking rescheduled successfully!')
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to reschedule booking' }))
        toast.error(error.error || 'Failed to reschedule booking')
      }
    } catch (error) {
      console.error('Failed to reschedule booking:', error)
      toast.error('Failed to reschedule booking. Please try again.')
    }

    handleDragEnd()
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

  // Resize handlers
  const handleResizeStart = (column: 'sport' | 'court' | 'timeSlot', e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(column)
    resizeStartX.current = e.clientX
    if (column === 'sport') {
      resizeStartWidth.current = sportColumnWidth
    } else if (column === 'court') {
      resizeStartWidth.current = courtColumnWidth
    } else {
      resizeStartWidth.current = timeSlotWidth
    }
  }

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing) return

      const diff = e.clientX - resizeStartX.current
      const newWidth = Math.max(50, resizeStartWidth.current + diff) // Minimum 50px

      if (isResizing === 'sport') {
        setSportColumnWidth(newWidth)
      } else if (isResizing === 'court') {
        setCourtColumnWidth(newWidth)
      } else if (isResizing === 'timeSlot') {
        setTimeSlotWidth(Math.max(40, newWidth)) // Minimum 40px for time slots
      }
    }

    const handleResizeEnd = () => {
      setIsResizing(null)
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
  }, [isResizing, sportColumnWidth, courtColumnWidth, timeSlotWidth])

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
          
          // Update sports state
          setAllSports(Array.from(distinctSports.values()))
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
      
      // For day view: fetch 1 month before and 2 months after current date
      // For week view: fetch 1 month before and 2 months after current week
      // For month view: fetch 1 month before and 2 months after current month
      let startDate: Date
      let endDate: Date
      
      if (viewMode === 'day') {
        startDate = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, baseDate.getDate())
        endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 2, baseDate.getDate())
      } else if (viewMode === 'week') {
        // Start from beginning of week, go back 1 month, forward 2 months
        const weekStart = new Date(baseDate)
        weekStart.setDate(baseDate.getDate() - baseDate.getDay())
        startDate = new Date(weekStart.getFullYear(), weekStart.getMonth() - 1, weekStart.getDate())
        endDate = new Date(weekStart.getFullYear(), weekStart.getMonth() + 2, weekStart.getDate() + 6)
      } else {
        // Month view: start from beginning of month
        startDate = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1)
        endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 2, 0)
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
      if (selectedVenue !== 'all') {
        baseFilters.venueId = selectedVenue
      }
      if (selectedCourt !== 'all') {
        baseFilters.courtId = selectedCourt
      }
      if (selectedSport !== 'all') {
        baseFilters.sportId = selectedSport
      }
      if (selectedStatus !== 'all' && statusMap[selectedStatus]) {
        baseFilters.status = statusMap[selectedStatus]
      }
      if (selectedPaymentStatus !== 'all' && paymentMap[selectedPaymentStatus]) {
        baseFilters.paymentStatus = paymentMap[selectedPaymentStatus]
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
              resourceId: booking.court.id,
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
              paymentStatus: paymentStatusMap[booking.paymentInfo?.status] || booking.paymentInfo?.status || 'Pending'
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
              resourceId: booking.court.id,
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
              paymentStatus: paymentStatusMap[booking.paymentInfo?.status] || booking.paymentInfo?.status || 'Pending'
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

        // Safety limit: don't fetch more than 50 pages (5000 bookings)
        if (currentPage >= 50) {
          console.warn('Calendar: Reached maximum page limit (50 pages). Some bookings may not be displayed.')
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
            resourceId: booking.court.id,
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
            paymentStatus: paymentStatusMap[booking.paymentInfo?.status] || booking.paymentInfo?.status || 'Pending'
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
  }, [vendorId, currentDate, viewMode, debouncedSearch, selectedVenue, selectedCourt, selectedSport, selectedStatus, selectedPaymentStatus, onError, getCached, setCached, findOverlappingRange])

  // Load venues and courts once on mount or when vendorId changes
  const loadResources = useCallback(async () => {
    if (!vendorId) return

    try {
      setLoading(true)
      const resourcesData = await fetchVenuesAndCourts()
      setResources(resourcesData)
    } catch (err) {
      console.error('Error loading resources:', err)
      if (onError) {
        onError(err instanceof Error ? err.message : 'Failed to load venues and courts')
      }
    } finally {
      setLoading(false)
    }
  }, [vendorId, onError])

  // Load bookings when filters, currentDate, or viewMode change
  const loadBookings = useCallback(async (showRefreshing = false) => {
    if (!vendorId) return

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
    }
  }, [vendorId, onError, fetchBookings])

  // Load resources once on mount
  useEffect(() => {
    loadResources()
  }, [loadResources])

  // Load bookings when filters change
  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  // Debug logging - must be before any conditional returns
  useEffect(() => {
    console.log('Calendar State:', {
      resourcesCount: resources.length,
      bookingsCount: bookings.length,
      currentDate: currentDate.toISOString(),
      viewMode
    })
  }, [resources.length, bookings.length, currentDate, viewMode])

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
    // Reload bookings to ensure consistency
    await loadBookings(true)
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
  const getEventStyle = (booking: CalendarBooking) => {
    const color = getEventColor(booking)
    const isConfirmed = booking.status === 'CONFIRMED'
    
    if (isConfirmed && booking.sportId) {
      // Use sport color for confirmed bookings
      return {
        backgroundColor: color,
        borderColor: color,
        color: 'white',
      }
    }
    
    // Use status-based colors for other statuses
    const statusStyles: Record<string, { bg: string; border: string; text: string }> = {
      PENDING: { bg: '#fef3c7', border: '#eab308', text: '#92400e' },
      CANCELLED: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
      COMPLETED: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
      NO_SHOW: { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' },
    }
    
    const style = statusStyles[booking.status] || { bg: '#f3f4f6', border: '#6b7280', text: '#374151' }
    
    return {
      backgroundColor: style.bg,
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
    if (selectedVenue !== 'all') {
      const venue = resources.find(r => r.venueName === selectedVenue)
      return venue?.venueTimezone
    }
    // If no venue selected, use first venue's timezone
    return resources.length > 0 ? resources[0]?.venueTimezone : undefined
  }, [resources, selectedVenue])

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

    if (selectedVenue !== 'all') {
      filtered = filtered.filter(r => r.venueName === selectedVenue)
    }

    if (selectedCourt !== 'all') {
      filtered = filtered.filter(r => r.id === selectedCourt)
    }
    
    if (selectedSport !== 'all') {
      filtered = filtered.filter(r => r.sportId === selectedSport)
    }

    return filtered
  }, [resources, selectedVenue, selectedCourt, selectedSport])

  // Get unique venues for filter
  const uniqueVenues = useMemo(() => {
    const venues = new Set(resources.map(r => r.venueName))
    return Array.from(venues).sort()
  }, [resources])

  // Get filtered courts based on selected venue
  const filteredCourts = useMemo(() => {
    if (selectedVenue === 'all') {
      return resources
    }
    return resources.filter(r => r.venueName === selectedVenue)
  }, [resources, selectedVenue])

  // Group resources by sport - depends on filteredResources
  const resourcesBySport = useMemo(() => {
    const grouped = new Map<string, CalendarResource[]>()
    
    filteredResources.forEach(resource => {
      const sportId = resource.sportId || 'unknown'
      if (!grouped.has(sportId)) {
        grouped.set(sportId, [])
      }
      grouped.get(sportId)!.push(resource)
    })
    
    // Convert to array and sort by sport name
    return Array.from(grouped.entries()).map(([sportId, courts]) => {
      const sport = allSports.find(s => s.id === sportId)
      return {
        sportId,
        sportName: sport?.displayName || sport?.name || 'Unknown',
        courts: courts.sort((a, b) => a.title.localeCompare(b.title))
      }
    }).sort((a, b) => a.sportName.localeCompare(b.sportName))
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

  // Generate time slots for the day - all 24 hours (00:00 to 23:00)
  const generateTimeSlots = useMemo((): string[] => {
    const slots: string[] = []
    for (let hour = 0; hour <= 23; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
    }
    return slots
  }, [])

  // Reset court filter when venue changes
  const handleVenueChange = (venue: string) => {
    setSelectedVenue(venue)
    setSelectedCourt('all')
  }
  
  const handleSportChange = (sportId: string) => {
    setSelectedSport(sportId)
    // Reset court if it doesn't match the sport
    if (sportId !== 'all') {
      const currentCourt = resources.find(r => r.id === selectedCourt)
      if (currentCourt && currentCourt.sportId !== sportId) {
        setSelectedCourt('all')
      }
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedVenue('all')
    setSelectedCourt('all')
    setSelectedSport('all')
    setSelectedStatus('all')
    setSelectedPaymentStatus('all')
    setSearchQuery('')
  }

  // Check if any filters are active
  const hasActiveFilters = selectedVenue !== 'all' || 
    selectedCourt !== 'all' || 
    selectedSport !== 'all' || 
    selectedStatus !== 'all' || 
    selectedPaymentStatus !== 'all' || 
    searchQuery !== ''

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
    <div className="space-y-4">
      {/* Filters Section - Always visible, no grouping */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Filters in a single row, matching table view */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] sm:max-w-[220px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Venue */}
          <Select value={selectedVenue === 'all' ? undefined : selectedVenue} onValueChange={handleVenueChange}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Venue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Venues</SelectItem>
              {uniqueVenues.map((venue) => (
                <SelectItem key={venue} value={venue}>
                  {venue}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Court */}
          <Select
            value={selectedCourt === 'all' ? undefined : selectedCourt}
            onValueChange={setSelectedCourt}
            disabled={filteredCourts.length === 0}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Court" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courts</SelectItem>
              {filteredCourts.map((court) => (
                <SelectItem key={court.id} value={court.id}>
                  {court.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sport */}
          <Select value={selectedSport === 'all' ? undefined : selectedSport} onValueChange={handleSportChange}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {allSports.map((sport) => (
                <SelectItem key={sport.id} value={sport.id}>
                  {sport.displayName || sport.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={selectedStatus === 'all' ? undefined : selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[140px] text-foreground">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
              <SelectItem value="No-Show">No Show</SelectItem>
            </SelectContent>
          </Select>

          {/* Payment Status */}
          <Select value={selectedPaymentStatus === 'all' ? undefined : selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
            <SelectTrigger className="w-full sm:w-[140px] text-foreground">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Partially Paid">Partially Paid</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-800">Active Filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Search: {searchQuery}
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedVenue !== 'all' && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Venue: {selectedVenue}
                <button
                  onClick={() => handleVenueChange('all')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedCourt !== 'all' && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Court: {resources.find(r => r.id === selectedCourt)?.title || selectedCourt}
                <button
                  onClick={() => setSelectedCourt('all')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedSport !== 'all' && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Sport: {allSports.find(s => s.id === selectedSport)?.displayName || selectedSport}
                <button
                  onClick={() => setSelectedSport('all')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedStatus !== 'all' && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Status: {selectedStatus}
                <button
                  onClick={() => setSelectedStatus('all')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedPaymentStatus !== 'all' && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Payment: {selectedPaymentStatus}
                <button
                  onClick={() => setSelectedPaymentStatus('all')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-sm">Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span className="text-sm">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-sm">Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-sm">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded"></div>
          <span className="text-sm">No Show</span>
        </div>
      </div>

      {/* Calendar Header and View - Grouped together */}
      <div>
        {/* Compact Unified Header - Theme Colors */}
        <div 
          className="bg-white border border-gray-200 shadow-sm p-3"
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
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5 rounded-lg bg-muted">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-1.5 rounded-md transition-all duration-200 text-muted-foreground hover:text-foreground"
                  title="Previous"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
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
              
              <button
                onClick={() => loadBookings(true)}
                disabled={refreshing}
                className="p-1.5 rounded-md transition-all duration-200 text-muted-foreground hover:text-foreground disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar View - Attached to header */}
        <Card className="rounded-t-none border-t-0 py-0">
        <CardContent className="px-4 py-0 overflow-x-auto">
          {/* Date-based horizontal timeline */}
          <div className="space-y-4 py-4">
            {/* Date rows for week/month view */}
            {dateRange.map((date) => {
              return (
              <div key={date.toISOString()} className="border rounded-lg overflow-hidden">
                {/* Date header */}
                <div className="sticky top-0 z-10 bg-muted/50 border-b p-3">
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
                    </div>
                  </div>
                </div>

                {/* Horizontal timeline for this date */}
                <div className="overflow-x-auto">
                  <div style={{ minWidth: `${sportColumnWidth + courtColumnWidth + (timeSlots.length * timeSlotWidth)}px` }}>
                  {/* Time header */}
                  <div className="flex border-b">
                    {/* Sport column header */}
                    <div className="sticky left-0 z-5 bg-card border-r p-2 text-center font-medium text-xs relative group" style={{ width: `${sportColumnWidth}px`, minWidth: `${sportColumnWidth}px` }}>
                      Sport
                      {/* Resize handle */}
                      <div
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onMouseDown={(e) => handleResizeStart('sport', e)}
                      />
                    </div>
                    {/* Court column header */}
                    <div className="sticky bg-card border-r p-2 text-center font-medium text-xs relative group" style={{ left: `${sportColumnWidth}px`, width: `${courtColumnWidth}px`, minWidth: `${courtColumnWidth}px` }}>
                      Court
                      {/* Resize handle */}
                      <div
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onMouseDown={(e) => handleResizeStart('court', e)}
                      />
                    </div>
                    
                    {/* Time slots as columns */}
                    {timeSlots.map((slot, index) => (
                      <div
                        key={slot}
                        className="border-r p-1 text-center text-xs font-medium relative group"
                        style={{ width: `${timeSlotWidth}px`, minWidth: `${timeSlotWidth}px` }}
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

                  {/* Sport groups with courts for this date */}
                  {resourcesBySport.map((sportGroup, sportGroupIndex) => {
                    const sportColor = getSportColor(sportGroup.sportId, sportGroup.sportName)
                    const sportBgColor = hexToRgba(sportColor, 0.25)
                    
                    return (
                      <div key={`${sportGroup.sportId}-${date.toISOString()}`}>
                        {sportGroup.courts.map((resource, courtIndex) => {
                          const isLastCourt = courtIndex === sportGroup.courts.length - 1
                          const isLastSport = sportGroupIndex === resourcesBySport.length - 1
                          const isFirstCourt = courtIndex === 0
                          const isFirstSport = sportGroupIndex === 0
                          
                          return (
                          <div 
                            key={`${resource.id}-${date.toISOString()}`} 
                            className={cn(
                              "flex",
                              // Add top border for first court of each sport (except first sport)
                              isFirstCourt && !isFirstSport && "border-t-2 border-t-gray-300",
                              // Add bottom border - thicker for sport separation, thinner for court separation
                              isLastCourt && !isLastSport 
                                ? "border-b-2 border-b-gray-300" 
                                : "border-b border-b-gray-200"
                            )}
                            style={{ backgroundColor: sportBgColor }}
                          >
                            {/* Sport name (only show on first court of each sport) */}
                            <div
                              className="sticky left-0 z-5 border-r p-2 flex items-center justify-start font-medium text-xs"
                              style={{ 
                                width: `${sportColumnWidth}px`, 
                                minWidth: `${sportColumnWidth}px`,
                                backgroundColor: sportBgColor
                              }}
                            >
                              {courtIndex === 0 && (
                                <div 
                                  className="truncate font-semibold" 
                                  title={sportGroup.sportName}
                                  style={{ color: sportColor }}
                                >
                                  {sportGroup.sportName}
                                </div>
                              )}
                            </div>
                            
                            {/* Court name */}
                            <div
                              className="sticky z-5 border-r p-2 flex items-center justify-start font-medium text-xs"
                              style={{ 
                                left: `${sportColumnWidth}px`,
                                width: `${courtColumnWidth}px`, 
                                minWidth: `${courtColumnWidth}px`,
                                backgroundColor: sportBgColor
                              }}
                            >
                              <div className="truncate" title={resource.title}>
                                {resource.title}
                              </div>
                            </div>

                      {/* Time slots for this court on this date */}
                      {timeSlots.map((slot) => {
                        const [hours, minutes] = slot.split(':').map(Number)
                        const venueTimezone = resource.venueTimezone || getActiveVenueTimezone
                        
                        // Find bookings for this specific court and time slot
                        const slotBookings = bookings.filter(booking => {
                          if (booking.resourceId !== resource.id) return false
                          
                          const bookingStart = new Date(booking.start)
                          const bookingEnd = new Date(booking.end)
                          
                          // Check if booking is on the same day in venue timezone
                          if (!isSameDayInVenueTimezone(bookingStart, date, venueTimezone)) return false
                          
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
                            onDragOver={(e) => handleDragOver(e, resource.id, date, slot)}
                            onDrop={(e) => handleDrop(e, resource.id, date, slot)}
                            className={cn(
                              "relative border-r hover:bg-muted/20 transition-colors",
                              isDragOver && "bg-blue-100 border-blue-400 border-2"
                            )}
                            style={{ 
                              width: `${timeSlotWidth}px`,
                              minWidth: `${timeSlotWidth}px`,
                              height: '40px',
                              backgroundColor: isDragOver ? '#dbeafe' : sportBgColor
                            }}
                          >
                            {/* Booking blocks */}
                            {slotBookings.map((booking) => {
                              const bookingStart = new Date(booking.start)
                              const bookingEnd = new Date(booking.end)
                              const venueTimezone = booking.venueTimezone || resource.venueTimezone || getActiveVenueTimezone
                              
                              // Get booking time components in venue timezone
                              const bookingStartComponents = getDateComponentsInVenueTimezone(bookingStart, venueTimezone)
                              const bookingEndComponents = getDateComponentsInVenueTimezone(bookingEnd, venueTimezone)
                              
                              // Calculate position within the hour slot (in venue timezone)
                              const bookingStartMinutes = bookingStartComponents.hour * 60 + bookingStartComponents.minutes
                              const bookingEndMinutes = bookingEndComponents.hour * 60 + bookingEndComponents.minutes
                              const slotStartMinutes = hours * 60 + minutes
                              const slotEndMinutes = (hours + 1) * 60 + minutes
                              
                              const offsetMinutes = Math.max(0, bookingStartMinutes - slotStartMinutes)
                              const durationMinutes = Math.min(slotEndMinutes - slotStartMinutes - offsetMinutes, bookingEndMinutes - bookingStartMinutes)
                              
                              const leftOffset = (offsetMinutes / 60) * 100
                              const width = (durationMinutes / 60) * 100
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
                                    left: `${leftOffset}%`,
                                    width: `${width}%`,
                                    top: '2px',
                                    bottom: '2px',
                                    minWidth: '20px',
                                    borderRadius: '6px',
                                    ...eventStyle,
                                    borderWidth: '1px',
                                  }}
                                  onDoubleClick={() => handleEventClick(booking)}
                                  onContextMenu={(e) => handleContextMenu(e, booking)}
                                  title={`${booking.customerName} - ${booking.status} - $${Number(booking.totalAmount || 0).toFixed(2)}${booking.sportName ? ` - ${booking.sportName}` : ''}`}
                                >
                                  <div className="font-semibold truncate text-[11px] px-1 leading-tight">
                                    {booking.customerName.split(' ')[0]}
                                  </div>
                                  <div className="text-[9px] opacity-90 px-1 leading-tight">
                                    {formatTimeInVenueTimezone(booking.start, booking.venueTimezone)}
                                  </div>
                                </div>
                              )
                            })}

                            {/* Empty slot - create booking */}
                            {slotBookings.length === 0 && (
                              <button
                                onClick={() => handleCreateBooking(resource.id, date, slot)}
                                onDragOver={(e) => handleDragOver(e, resource.id, date, slot)}
                                onDrop={(e) => handleDrop(e, resource.id, date, slot)}
                                className={cn(
                                  'absolute inset-0 w-full h-full opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center group',
                                  dragOverSlot?.courtId === resource.id && dragOverSlot?.slot === slot && 'opacity-100 bg-blue-100 border-2 border-blue-400 border-dashed'
                                )}
                                title="Click to create new booking"
                              >
                                {dragOverSlot?.courtId === resource.id && dragOverSlot?.slot === slot ? (
                                  <div className="text-xs text-blue-600 font-medium">Drop here</div>
                                ) : (
                                  <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                )}
                              </button>
                            )}

                            {/* Current time indicator for today */}
                            {isTodayInVenueTimezone(date, getActiveVenueTimezone) &&
                             (() => {
                              const { hour: currentHour, minutes: currentMinutes } = getCurrentTimeInVenueTimezone(getActiveVenueTimezone)
                              
                              if (currentHour === hours) {
                                return (
                                  <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                                    style={{ left: `${(currentMinutes / 60) * 100}%` }}
                                  >
                                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
                                  </div>
                                )
                              }
                              return null
                            })()}
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
    </div>
  )
}

