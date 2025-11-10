'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Calendar, Clock, MapPin, DollarSign, User, Mail, Phone, Edit, XCircle, CheckCircle, MessageSquare, ExternalLink, Save, X, MoreVertical, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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

interface VenueOption {
  id: string
  name: string
}

interface CourtOption {
  id: string
  name: string
  venueName: string
  sportName: string
  venueId: string
}

interface BookingDetailsModalProps {
  booking: CalendarBooking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (booking: CalendarBooking) => void
  onCancel?: (bookingId: string) => Promise<void>
  onComplete?: (bookingId: string) => Promise<void>
  onSendSMS?: (booking: CalendarBooking) => Promise<void>
  onViewCustomer?: (email: string) => void
  onUpdate?: (booking: CalendarBooking) => Promise<void>
  courts?: CourtOption[]
  vendorId?: string
}

const statusColors = {
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
  NO_SHOW: 'bg-purple-100 text-purple-800 border-purple-200',
}

const paymentStatusColors = {
  Paid: 'bg-green-100 text-green-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Refunded: 'bg-gray-100 text-gray-800',
  'Partially Paid': 'bg-orange-100 text-orange-800',
}

export function BookingDetailsModal({
  booking,
  open,
  onOpenChange,
  onEdit,
  onCancel,
  onComplete,
  onSendSMS,
  onViewCustomer,
  onUpdate,
  courts = [],
  vendorId,
}: BookingDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedBooking, setEditedBooking] = useState<Partial<CalendarBooking & { courtId?: string; venueId?: string; notes?: string }> | null>(null)
  const [availableCourts, setAvailableCourts] = useState<CourtOption[]>(courts)
  const [availableVenues, setAvailableVenues] = useState<VenueOption[]>([])
  const [selectedVenueId, setSelectedVenueId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [venueTimezone, setVenueTimezone] = useState<string | null>(null)
  const [venueCurrencyCode, setVenueCurrencyCode] = useState<string>('USD') // Default to USD
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    venue?: string
    court?: string
    sport?: string
    time?: string
    availability?: string
  }>({})
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)

  // Fetch venue timezone and currency from booking or venue
  useEffect(() => {
    const fetchVenueData = async () => {
      if (booking && open) {
        // First try to get from booking
        if (booking.venueTimezone) {
          setVenueTimezone(booking.venueTimezone)
        }
        
        // If not in booking, fetch from venue
        if (booking.venueId) {
          try {
            const response = await fetch(`/api/venues/${booking.venueId}`, {
              credentials: 'include'
            })
            if (response.ok) {
              const data = await response.json()
              const venue = data.venue || data
              
              // Set timezone
              const timezone = venue.timezone || booking.venueTimezone
              if (timezone) {
                setVenueTimezone(timezone)
              }
              
              // Set currency code - check venue first, then vendor from venue response
              let currencyCode = venue.currencyCode || data.currencyCode
              
              // If venue doesn't have currency code, use vendor's currency code
              if (!currencyCode || currencyCode.trim() === '') {
                const vendorCurrencyCode = venue.vendor?.currencyCode || data.vendor?.currencyCode
                if (vendorCurrencyCode) {
                  currencyCode = vendorCurrencyCode
                  console.log('Using vendor currency code from venue response:', currencyCode)
                }
              }
              
              if (currencyCode && currencyCode.trim() !== '') {
                setVenueCurrencyCode(currencyCode)
                console.log('Setting currency code:', currencyCode, 'from venue:', !!venue.currencyCode, 'from vendor:', !!venue.vendor?.currencyCode)
              } else {
                console.warn('No currency code found for venue:', booking.venueId, 'Using default USD')
                setVenueCurrencyCode('USD')
              }
            } else {
              console.error('Failed to fetch venue data:', response.status, response.statusText)
            }
          } catch (error) {
            console.error('Failed to fetch venue data:', error)
            // Keep default USD on error
          }
        } else {
          console.warn('No venueId in booking, cannot fetch currency code')
        }
      } else if (!open) {
        setVenueTimezone(null)
        setVenueCurrencyCode('USD')
      }
    }
    
    if (open && booking) {
      fetchVenueData()
    }
  }, [open, booking])

  // Set initial venue when courts are loaded
  useEffect(() => {
    if (booking && availableCourts.length > 0 && !selectedVenueId) {
      const currentCourt = availableCourts.find(c => c.id === booking.resourceId)
      if (currentCourt) {
        setSelectedVenueId(currentCourt.venueId)
      }
    }
  }, [booking, availableCourts, selectedVenueId])

  // Fetch courts if not provided
  useEffect(() => {
    const fetchCourts = async () => {
      if (vendorId && courts.length === 0) {
        try {
          const response = await fetch(`/api/courts?vendorId=${vendorId}&limit=1000`, {
            credentials: 'include'
          })
          if (response.ok) {
            const data = await response.json()
            const courtsData = (data.courts || []).map((court: any) => ({
              id: court.id,
              name: court.name,
              venueName: court.venue?.name || '',
              sportName: court.sport?.displayName || court.sport?.name || '',
              venueId: court.venueId,
            }))
            setAvailableCourts(courtsData)
          }
        } catch (error) {
          console.error('Failed to fetch courts:', error)
        }
      } else if (courts.length > 0) {
        setAvailableCourts(courts)
      }
    }
    
    if (open && vendorId) {
      fetchCourts()
    }
  }, [open, vendorId, courts])

  // Filter courts by selected venue
  const filteredCourts = selectedVenueId 
    ? availableCourts.filter(court => court.venueId === selectedVenueId)
    : availableCourts

  // Get selected court details
  const selectedCourt = editedBooking?.courtId 
    ? availableCourts.find(c => c.id === editedBooking.courtId)
    : null

  // Get original court details for sport comparison (only if booking exists)
  const originalCourt = booking?.resourceId 
    ? availableCourts.find(c => c.id === booking.resourceId)
    : null

  // Validation function
  const validateBooking = async (): Promise<boolean> => {
    const errors: typeof validationErrors = {}
    
    // Validate venue
    if (!selectedVenueId && !editedBooking?.venueId) {
      errors.venue = 'Please select a venue'
    }
    
    // Validate court
    if (!editedBooking?.courtId) {
      errors.court = 'Please select a court'
    } else {
      const court = availableCourts.find(c => c.id === editedBooking.courtId)
      if (!court) {
        errors.court = 'Selected court not found'
      } else if (selectedVenueId && court.venueId !== selectedVenueId) {
        errors.court = 'Court does not belong to selected venue'
      }
    }
    
    // Validate sport (if court changed, sport should match)
    if (editedBooking?.courtId && booking && editedBooking.courtId !== booking.resourceId) {
      const newCourt = availableCourts.find(c => c.id === editedBooking.courtId)
      if (newCourt && originalCourt && newCourt.sportName !== originalCourt.sportName) {
        errors.sport = `Sport changed from ${originalCourt.sportName} to ${newCourt.sportName}. Please verify this is correct.`
      }
    }
    
    // Validate time
    if (!editedBooking?.start || !editedBooking?.end) {
      errors.time = 'Please provide both start and end times'
    } else {
      const startDate = new Date(editedBooking.start)
      const endDate = new Date(editedBooking.end)
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        errors.time = 'Invalid date format'
      } else if (startDate >= endDate) {
        errors.time = 'End time must be after start time'
      } else {
        const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60)
        if (durationMinutes < 30) {
          errors.time = 'Minimum booking duration is 30 minutes'
        }
        if (durationMinutes > 24 * 60) {
          errors.time = 'Maximum booking duration is 24 hours'
        }
      }
    }
    
    // Check availability if all basic validations pass
    // Note: Full availability check will be done server-side, but we can do a basic check here
    if (!errors.venue && !errors.court && !errors.time && editedBooking?.courtId && editedBooking?.start && editedBooking?.end) {
      setIsCheckingAvailability(true)
      try {
        // Check for conflicts by querying bookings API
        const startDate = new Date(editedBooking.start)
        const endDate = new Date(editedBooking.end)
        
        const response = await fetch(
          `/api/bookings?courtId=${editedBooking.courtId}&startTime=${startDate.toISOString()}&endTime=${endDate.toISOString()}`,
          { credentials: 'include' }
        )
        
        if (response.ok) {
          const data = await response.json()
          // Filter out the current booking
          const conflictingBookings = (data.bookings || []).filter(
            (b: any) => booking && b.id !== booking.id && 
            (b.status === 'CONFIRMED' || b.status === 'PENDING')
          )
          
          if (conflictingBookings.length > 0) {
            errors.availability = `Court may not be available. Found ${conflictingBookings.length} conflicting booking(s).`
          }
        }
      } catch (error) {
        console.error('Error checking availability:', error)
        // Don't block save if availability check fails - server will validate
      } finally {
        setIsCheckingAvailability(false)
      }
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Fetch booking notes
  useEffect(() => {
    const fetchBookingNotes = async () => {
      if (booking?.id && open) {
        try {
          const response = await fetch(`/api/bookings/${booking.id}`, {
            credentials: 'include'
          })
          if (response.ok) {
            const data = await response.json()
            setNotes(data.booking?.notes || '')
          }
        } catch (error) {
          console.error('Failed to fetch booking notes:', error)
        }
      }
    }
    
    if (open && booking?.id) {
      fetchBookingNotes()
    }
  }, [open, booking?.id])

  useEffect(() => {
    if (booking && open) {
      // Find current court to get venue
      const currentCourt = availableCourts.find(c => c.id === booking.resourceId)
      const venueId = currentCourt?.venueId || ''
      
      setEditedBooking({
        start: booking.start,
        end: booking.end,
        status: booking.status,
        totalAmount: booking.totalAmount,
        courtId: booking.resourceId,
        venueId: venueId,
      })
      setSelectedVenueId(venueId)
      setIsEditing(false)
      setValidationErrors({}) // Clear validation errors when opening
    } else if (!open) {
      // Reset when modal closes
      setIsEditing(false)
      setEditedBooking(null)
      setNotes('')
      setSelectedVenueId('')
      setValidationErrors({})
    }
  }, [booking, open, availableCourts])

  // Real-time validation when editing (debounced)
  useEffect(() => {
    if (!isEditing || !editedBooking) {
      return
    }

    // Debounce validation
    const timeoutId = setTimeout(() => {
      // Only validate basic fields, not availability (to avoid too many API calls)
      const errors: typeof validationErrors = {}
      
      if (!selectedVenueId && !editedBooking?.venueId) {
        errors.venue = 'Please select a venue'
      }
      
      if (!editedBooking?.courtId) {
        errors.court = 'Please select a court'
      } else {
        const court = availableCourts.find(c => c.id === editedBooking.courtId)
        if (court && selectedVenueId && court.venueId !== selectedVenueId) {
          errors.court = 'Court does not belong to selected venue'
        }
      }
      
      if (editedBooking?.courtId && booking && editedBooking.courtId !== booking.resourceId) {
        const newCourt = availableCourts.find(c => c.id === editedBooking.courtId)
        if (newCourt && originalCourt && newCourt.sportName !== originalCourt.sportName) {
          errors.sport = `Sport changed from ${originalCourt.sportName} to ${newCourt.sportName}`
        }
      }
      
      if (!editedBooking?.start || !editedBooking?.end) {
        errors.time = 'Please provide both start and end times'
      } else {
        const startDate = new Date(editedBooking.start)
        const endDate = new Date(editedBooking.end)
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          errors.time = 'Invalid date format'
        } else if (startDate >= endDate) {
          errors.time = 'End time must be after start time'
        } else {
          const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60)
          if (durationMinutes < 30) {
            errors.time = 'Minimum booking duration is 30 minutes'
          }
          if (durationMinutes > 24 * 60) {
            errors.time = 'Maximum booking duration is 24 hours'
          }
        }
      }
      
      setValidationErrors(errors)
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [isEditing, editedBooking, selectedVenueId, availableCourts, booking?.resourceId, originalCourt])

  if (!booking) return null

  const startDate = editedBooking?.start ? new Date(editedBooking.start) : new Date(booking.start)
  const endDate = editedBooking?.end ? new Date(editedBooking.end) : new Date(booking.end)
  const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))

  // Check if booking is in the past
  const isPastBooking = endDate < new Date()
  // Check final state - handle both uppercase and title case
  const bookingStatusUpper = booking.status?.toUpperCase()
  const isFinalState = bookingStatusUpper === 'COMPLETED' || bookingStatusUpper === 'CANCELLED'

  // Helper function to format date in venue timezone for display
  const formatDateInVenueTimezone = (date: Date, formatStr: string): string => {
    if (!venueTimezone) {
      // Fallback to UTC if no venue timezone
      return format(date, formatStr)
    }
    
    // Use Intl.DateTimeFormat to format in venue timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: venueTimezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    
    if (formatStr === 'MMM dd, yyyy') {
      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: venueTimezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
      return dateFormatter.format(date)
    }
    
    if (formatStr === 'h:mm a') {
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: venueTimezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      return timeFormatter.format(date)
    }
    
    return format(date, formatStr)
  }

  // Helper function to format currency amount using venue currency code
  const formatCurrency = (amount: number): string => {
    const currency = venueCurrencyCode || 'USD'
    
    // Determine locale based on currency code
    // Common currency-to-locale mappings
    const currencyLocaleMap: Record<string, string> = {
      'USD': 'en-US',
      'INR': 'en-IN',
      'GBP': 'en-GB',
      'EUR': 'en-EU',
      'CAD': 'en-CA',
      'AUD': 'en-AU',
    }
    
    const locale = currencyLocaleMap[currency] || 'en-US'
    
    try {
      const formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
      
      console.log('Formatting currency:', { amount, currency, locale, formatted })
      return formatted
    } catch (error) {
      console.error('Error formatting currency:', error, { currency, locale })
      // Fallback to USD if currency code is invalid
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    }
  }

  // Helper function to convert UTC ISO string to venue timezone datetime-local format
  const toVenueDateTimeString = (isoString: string): string => {
    if (!venueTimezone) {
      // If no venue timezone, use UTC (fallback)
      const date = new Date(isoString)
      const year = date.getUTCFullYear()
      const month = String(date.getUTCMonth() + 1).padStart(2, '0')
      const day = String(date.getUTCDate()).padStart(2, '0')
      const hours = String(date.getUTCHours()).padStart(2, '0')
      const minutes = String(date.getUTCMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }
    
    const utcDate = new Date(isoString)
    
    // Format the date in venue's timezone using Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: venueTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    
    // Get parts in venue timezone
    const parts = formatter.formatToParts(utcDate)
    const year = parts.find(p => p.type === 'year')?.value || ''
    const month = parts.find(p => p.type === 'month')?.value || ''
    const day = parts.find(p => p.type === 'day')?.value || ''
    const hour = parts.find(p => p.type === 'hour')?.value || ''
    const minute = parts.find(p => p.type === 'minute')?.value || ''
    
    return `${year}-${month}-${day}T${hour}:${minute}`
  }

  // Helper function to convert venue timezone datetime-local format to UTC ISO string
  const fromVenueDateTimeString = (venueLocalString: string): string => {
    if (!venueTimezone) {
      // If no venue timezone, treat as UTC
      return new Date(venueLocalString + 'Z').toISOString()
    }
    
    // Parse the datetime string
    const [datePart, timePart] = venueLocalString.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute] = timePart.split(':').map(Number)
    
    // Create a date representing the local time in the venue timezone
    // We'll use a binary search to find the correct UTC time
    // Start with an approximate UTC time
    const localDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
    
    // Start with UTC time assuming same local time
    let testUTC = new Date(`${localDateStr}Z`)
    
    // Check what this displays as in venue timezone
    let displayed = toVenueDateTimeString(testUTC.toISOString())
    
    // If it matches exactly, return it
    if (displayed === venueLocalString) {
      return testUTC.toISOString()
    }
    
    // Calculate the timezone offset for this specific date/time
    // We'll use a more direct approach: calculate offset by comparing
    // what a known UTC time displays as vs what we want
    
    // Get the offset by testing a known UTC time
    const testDate = new Date(Date.UTC(year, month - 1, day, hour, minute))
    const testDisplayed = toVenueDateTimeString(testDate.toISOString())
    
    if (testDisplayed === venueLocalString) {
      return testDate.toISOString()
    }
    
    // Parse both to get the difference
    const [targetDate, targetTime] = venueLocalString.split('T')
    const [displayedDate, displayedTime] = testDisplayed.split('T')
    
    // If dates match, calculate time difference
    if (targetDate === displayedDate) {
      const [targetH, targetM] = targetTime.split(':').map(Number)
      const [displayedH, displayedM] = displayedTime.split(':').map(Number)
      const diffMinutes = (targetH * 60 + targetM) - (displayedH * 60 + displayedM)
      
      // Adjust the UTC time
      const adjustedUTC = new Date(testDate.getTime() - diffMinutes * 60 * 1000)
      return adjustedUTC.toISOString()
    }
    
    // If dates don't match, we need to handle day boundary
    // Use binary search within a reasonable range
    const baseTime = testDate.getTime()
    let low = baseTime - 25 * 60 * 60 * 1000 // 25 hours before
    let high = baseTime + 25 * 60 * 60 * 1000 // 25 hours after
    
    for (let i = 0; i < 100; i++) {
      const mid = Math.floor((low + high) / 2)
      const test = new Date(mid)
      const displayed = toVenueDateTimeString(test.toISOString())
      
      if (displayed === venueLocalString) {
        return test.toISOString()
      }
      
      // Compare strings to determine direction
      if (displayed < venueLocalString) {
        low = mid + 1
      } else {
        high = mid - 1
      }
    }
    
    // Fallback: return the best approximation
    return testDate.toISOString()
  }

  const handleSave = async () => {
    if (!editedBooking || !onUpdate) return

    // Run comprehensive validation
    const isValid = await validateBooking()
    
    // Allow save even with availability warnings (server will do final check)
    // But block save if there are critical errors (venue, court, time)
    const criticalErrors = { ...validationErrors }
    delete criticalErrors.availability // Don't block on availability warnings
    
    const hasCriticalErrors = Object.keys(criticalErrors).length > 0
    
    if (hasCriticalErrors) {
      // Show first error as toast
      const firstError = Object.values(criticalErrors)[0]
      if (firstError) {
        toast.error(firstError)
      }
      return
    }
    
    // Show warning if availability check failed but allow save
    if (validationErrors.availability) {
      toast.warning(validationErrors.availability + ' Proceeding anyway - server will validate.')
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          startTime: editedBooking.start,
          endTime: editedBooking.end,
          status: editedBooking.status,
          totalAmount: editedBooking.totalAmount,
          courtId: editedBooking.courtId,
          notes: notes || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update booking' }))
        throw new Error(error.error || 'Failed to update booking')
      }

      const updated = await response.json()
      toast.success('Booking updated successfully!')
      
      // Clear validation errors on success
      setValidationErrors({})
      
      // Refresh notes if they were updated
      if (notes !== undefined) {
        const notesResponse = await fetch(`/api/bookings/${booking.id}`, {
          credentials: 'include'
        })
        if (notesResponse.ok) {
          const notesData = await notesResponse.json()
          setNotes(notesData.booking?.notes || '')
        }
      }
      
      // Update the booking with new data
      if (onUpdate) {
        await onUpdate({
          ...booking,
          ...editedBooking,
          start: editedBooking.start || booking.start,
          end: editedBooking.end || booking.end,
          status: editedBooking.status || booking.status,
          totalAmount: editedBooking.totalAmount || booking.totalAmount,
          resourceId: editedBooking.courtId || booking.resourceId,
        })
      }
      
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating booking:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update booking')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    const currentCourt = availableCourts.find(c => c.id === booking.resourceId)
    setEditedBooking({
      start: booking.start,
      end: booking.end,
      status: booking.status,
      totalAmount: booking.totalAmount,
      courtId: booking.resourceId,
      venueId: currentCourt?.venueId || '',
    })
    setSelectedVenueId(currentCourt?.venueId || '')
    setIsEditing(false)
    setValidationErrors({}) // Clear validation errors
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[calc(100%-2rem)] sm:w-[90vw] md:w-[576px] max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold">
                Booking Details
              </DialogTitle>
              <DialogDescription className="mt-1 truncate">
                {booking.customerName} • {booking.courtName}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className={`${statusColors[booking.status]}`}>
                {booking.status.replace('_', ' ')}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 rounded-full hover:bg-muted"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0">
          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium">{booking.customerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-sm break-all">{booking.customerEmail}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Booking Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Booking Details
            </h3>
            {isEditing ? (
              <div className="space-y-4">
                {/* Warning for final states or past bookings */}
                {(isFinalState || isPastBooking) && (
                  <Alert variant="destructive" className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800 dark:text-yellow-200">
                      {isFinalState && isPastBooking 
                        ? 'Editing Historical Final State Booking'
                        : isFinalState 
                        ? 'Editing Final State Booking'
                        : 'Editing Past Booking'}
                    </AlertTitle>
                    <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                      {isFinalState && isPastBooking
                        ? `This booking is in a final state (${booking.status}) and has already ended. Changes may affect historical records, payments, reporting, and analytics. Please proceed with caution.`
                        : isFinalState
                        ? `This booking is in a final state (${booking.status}). Changes may affect historical records, payments, or reporting. Please proceed with caution.`
                        : 'This booking has already ended. Editing past bookings may affect historical records, reporting, and analytics. Please proceed with caution.'}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue</Label>
                    <Select
                      value={selectedVenueId || editedBooking?.venueId || ''}
                      onValueChange={(value) => {
                        setSelectedVenueId(value)
                        setEditedBooking({
                          ...editedBooking,
                          venueId: value,
                          courtId: '', // Reset court when venue changes
                        })
                        
                        // Fetch venue timezone for the new venue
                        if (value) {
                          fetch(`/api/venues/${value}`, {
                            credentials: 'include'
                          })
                            .then(response => response.json())
                            .then(data => {
                              const venue = data.venue || data
                              const timezone = venue.timezone
                              if (timezone) {
                                setVenueTimezone(timezone)
                              }
                            })
                            .catch(error => {
                              console.error('Failed to fetch venue timezone:', error)
                            })
                        }
                      }}
                    >
                      <SelectTrigger id="venue" className={cn("w-full", validationErrors.venue && "border-red-500")}>
                        <SelectValue placeholder="Select venue" />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
                        {availableVenues.map((venue) => (
                          <SelectItem key={venue.id} value={venue.id}>
                            {venue.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.venue && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span>⚠</span>
                        {validationErrors.venue}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="court">Court</Label>
                    <Select
                      value={editedBooking?.courtId || booking.resourceId}
                      onValueChange={(value) => {
                        // Find the selected court to get its venue
                        const selectedCourt = availableCourts.find(c => c.id === value)
                        const newVenueId = selectedCourt?.venueId || ''
                        
                        setEditedBooking({
                          ...editedBooking,
                          courtId: value,
                          venueId: newVenueId,
                        })
                        setSelectedVenueId(newVenueId)
                        
                        // Fetch venue timezone for the new court's venue
                        if (newVenueId) {
                          fetch(`/api/venues/${newVenueId}`, {
                            credentials: 'include'
                          })
                            .then(response => response.json())
                            .then(data => {
                              const venue = data.venue || data
                              const timezone = venue.timezone
                              if (timezone) {
                                setVenueTimezone(timezone)
                              }
                            })
                            .catch(error => {
                              console.error('Failed to fetch venue timezone:', error)
                            })
                        }
                      }}
                      disabled={!selectedVenueId}
                    >
                      <SelectTrigger id="court" className={cn("w-full", validationErrors.court && "border-red-500")}>
                        <SelectValue placeholder={selectedVenueId ? "Select court" : "Select venue first"} />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
                        {filteredCourts.length > 0 ? (
                          filteredCourts.map((court) => (
                            <SelectItem key={court.id} value={court.id}>
                              {court.name} - {court.sportName}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No courts available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {validationErrors.court && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span>⚠</span>
                        {validationErrors.court}
                      </p>
                    )}
                    {validationErrors.sport && (
                      <p className="text-sm text-yellow-600 flex items-center gap-1">
                        <span>⚠</span>
                        {validationErrors.sport}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={editedBooking?.status || booking.status}
                      onValueChange={(value) => {
                        setEditedBooking({
                          ...editedBooking,
                          status: value as CalendarBooking['status'],
                        })
                      }}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="NO_SHOW">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="30"
                      step="30"
                      value={duration}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={editedBooking?.start ? toVenueDateTimeString(editedBooking.start) : toVenueDateTimeString(booking.start)}
                      onChange={(e) => {
                        const venueLocalValue = e.target.value
                        const newStart = fromVenueDateTimeString(venueLocalValue)
                        const currentStart = editedBooking?.start ? new Date(editedBooking.start) : startDate
                        const currentEnd = editedBooking?.end ? new Date(editedBooking.end) : endDate
                        const duration = currentEnd.getTime() - currentStart.getTime()
                        const newEndDate = new Date(new Date(newStart).getTime() + duration)
                        const newEnd = newEndDate.toISOString()
                        setEditedBooking({
                          ...editedBooking,
                          start: newStart,
                          end: newEnd,
                        })
                      }}
                      className={cn(validationErrors.time && "border-red-500")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={editedBooking?.end ? toVenueDateTimeString(editedBooking.end) : toVenueDateTimeString(booking.end)}
                      onChange={(e) => {
                        const venueLocalValue = e.target.value
                        const newEnd = fromVenueDateTimeString(venueLocalValue)
                        setEditedBooking({
                          ...editedBooking,
                          end: newEnd,
                        })
                      }}
                      className={cn(validationErrors.time && "border-red-500")}
                    />
                  </div>
                </div>
                {(validationErrors.time || validationErrors.availability) && (
                  <div className="space-y-1">
                    {validationErrors.time && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span>⚠</span>
                        {validationErrors.time}
                      </p>
                    )}
                    {validationErrors.availability && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span>⚠</span>
                        {validationErrors.availability}
                      </p>
                    )}
                    {isCheckingAvailability && (
                      <p className="text-sm text-muted-foreground">Checking availability...</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ({venueCurrencyCode})</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editedBooking?.totalAmount || booking.totalAmount}
                      onChange={(e) => {
                        setEditedBooking({
                          ...editedBooking,
                          totalAmount: parseFloat(e.target.value) || 0,
                        })
                      }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add booking notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Venue</p>
                    <p className="font-medium">{booking.venueName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Court</p>
                    <p className="font-medium">{booking.courtName}</p>
                    {booking.sportName && (
                      <p className="text-xs text-muted-foreground mt-0.5">{booking.sportName}</p>
                    )}
                    {booking.format && (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          {booking.format.displayName}
                          {booking.format.playersPerTeam && (
                            <span className="ml-1">
                              ({booking.format.playersPerTeam} per team
                              {booking.format.maxTotalPlayers && booking.format.maxTotalPlayers > booking.format.playersPerTeam * 2
                                ? `, up to ${booking.format.maxTotalPlayers} total`
                                : `, ${booking.format.playersPerTeam * 2} total`})
                            </span>
                          )}
                        </Badge>
                        {booking.slotNumber && (
                          <span className="text-xs text-muted-foreground ml-1">Slot {booking.slotNumber}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date & Time</p>
                    <p className="font-medium">{formatDateInVenueTimezone(startDate, 'MMM dd, yyyy')}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateInVenueTimezone(startDate, 'h:mm a')} - {formatDateInVenueTimezone(endDate, 'h:mm a')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Duration: {duration} minutes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-medium text-lg">{formatCurrency(Number((editedBooking?.totalAmount ?? booking.totalAmount) || 0))}</p>
                    {booking.paymentStatus && (
                      <Badge 
                        variant="outline" 
                        className={`mt-1 text-xs ${paymentStatusColors[booking.paymentStatus as keyof typeof paymentStatusColors] || ''}`}
                      >
                        {booking.paymentStatus}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes Section */}
          {!isEditing && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Notes
                </h3>
                {notes ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No notes</p>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t flex-shrink-0 bg-muted/30">
          {isEditing ? (
            <div className="flex items-center justify-end gap-3 w-full">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-3">
              {/* Left: Secondary Actions */}
              <div className="flex items-center gap-2">
                {(onViewCustomer || onSendSMS) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <MoreVertical className="h-4 w-4" />
                        <span className="hidden sm:inline">More</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="z-[100]">
                      {onViewCustomer && (
                        <DropdownMenuItem
                          onClick={() => {
                            onViewCustomer(booking.customerEmail)
                            onOpenChange(false)
                          }}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Customer
                        </DropdownMenuItem>
                      )}
                      {onSendSMS && (
                        <DropdownMenuItem
                          onClick={() => onSendSMS(booking)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Send SMS
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Right: Primary Actions */}
              <div className="flex items-center gap-2 ml-auto">
                {onUpdate && (
                  <Button
                    variant="default"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Booking
                  </Button>
                )}
                
                {onComplete && booking.status === 'CONFIRMED' && (
                  <Button
                    variant="default"
                    onClick={() => onComplete(booking.id)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark Complete
                  </Button>
                )}
                
                {onCancel && booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                  <Button
                    variant="destructive"
                    onClick={() => onCancel(booking.id)}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Booking
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

