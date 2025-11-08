'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MoreHorizontal, ArrowUpDown, Search, Calendar, Clock, MapPin, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { fetchVendorBookings, VendorBookingFilters } from '@/lib/api/vendor/bookings'
import { useBookingsCache } from '@/hooks/use-bookings-cache'
import { useVendor } from '@/hooks/use-vendor'
import { useDebounce } from '@/hooks/use-debounce'
import { BookingFilters } from './BookingFilters'
import { BookingDetailsModal } from './BookingDetailsModal'
import { toast } from 'sonner'

type Booking = {
  id: string
  bookingNumber: string
  customerName: string
  customerEmail: string
  customerAvatar: string
  venueName: string
  courtName: string
  courtId?: string
  sport: string
  startTime: string
  endTime: string
  status: string
  totalAmount: number
  paymentStatus: string
  createdAt: string
  location: string
}

const createColumns = (currencySymbol: string = '₹', onBookingClick?: (booking: Booking) => void): ColumnDef<Booking>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'bookingNumber',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          Booking ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'customerName',
    header: 'Customer',
    cell: ({ row }) => {
      const booking = row.original
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={booking.customerAvatar} alt={booking.customerName} />
            <AvatarFallback>{booking.customerName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{booking.customerName}</div>
            <div className="text-sm text-muted-foreground">{booking.customerEmail}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'venueName',
    header: 'Venue & Court',
    cell: ({ row }) => {
      const booking = row.original
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium">{booking.venueName}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{booking.courtName}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'sport',
    header: 'Sport',
    cell: ({ row }) => {
      const sport = row.getValue('sport') as string
      return (
        <Badge variant="outline" className="capitalize">
          {sport}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'startTime',
    header: 'Schedule',
    cell: ({ row }) => {
      const booking = row.original
      const startDate = new Date(booking.startTime)
      const endDate = new Date(booking.endTime)

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span>{startDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
              {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string

      const statusColors = {
        'Confirmed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        'Completed': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        'No-Show': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      }

      const statusIcons = {
        'Confirmed': <CheckCircle className="h-3 w-3" />,
        'Pending': <Clock className="h-3 w-3" />,
        'Completed': <CheckCircle className="h-3 w-3" />,
        'Cancelled': <XCircle className="h-3 w-3" />,
        'No-Show': <AlertCircle className="h-3 w-3" />
      }

      return (
        <Badge className={cn(statusColors[status as keyof typeof statusColors])}>
          <div className="flex items-center gap-1">
            {statusIcons[status as keyof typeof statusIcons]}
            <span>{status}</span>
          </div>
        </Badge>
      )
    },
  },
  {
    accessorKey: 'totalAmount',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('totalAmount'))
      return (
        <span className="font-medium">{currencySymbol}{amount.toLocaleString()}</span>
      )
    },
  },
  {
    accessorKey: 'paymentStatus',
    header: 'Payment',
    cell: ({ row }) => {
      const paymentStatus = row.getValue('paymentStatus') as string

      const paymentColors = {
        'Paid': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        'Partially Paid': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        'Pending': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        'Refunded': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        'Failed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }

      return (
        <Badge className={cn(paymentColors[paymentStatus as keyof typeof paymentColors])}>
          {paymentStatus}
        </Badge>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const booking = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onBookingClick?.(booking)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(booking.id)}
            >
              Copy booking ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onBookingClick?.(booking)}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Edit Booking
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {booking.status === 'Pending' && (
              <>
                <DropdownMenuItem 
                  className="text-green-600"
                  onClick={() => onBookingClick?.(booking)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm booking
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => onBookingClick?.(booking)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel booking
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => onBookingClick?.(booking)}
            >
              <Users className="mr-2 h-4 w-4" />
              View Customer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function VendorBookingDataTable({ filters }: { filters: BookingFilters }) {
  const { vendorId, vendor } = useVendor()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Shared bookings cache
  const { getCached, setCached, clearCache } = useBookingsCache()
  
  // State management
  const [data, setData] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currencySymbol, setCurrencySymbol] = useState<string>('₹')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [pagination, setPagination] = useState({ 
    page: parseInt(searchParams.get('page') || '1'), 
    totalPages: 1, 
    totalCount: 0, 
    limit: 20 
  })

  // Modal state
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [courts, setCourts] = useState<Array<{ id: string; name: string; venueName: string; sportName: string; venueId: string }>>([])
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    booking: Booking | null
  }>({ visible: false, x: 0, y: 0, booking: null })
  const contextMenuRef = useRef<HTMLDivElement>(null)

  const contextMenuActions = [
    { label: 'View Details', action: 'view', icon: '👁️' },
    { label: 'Edit Booking', action: 'edit', icon: '✏️' },
    { label: 'Send SMS', action: 'sms', icon: '💬' },
    { label: 'Cancel Booking', action: 'cancel', icon: '🚫' },
    { label: 'Mark Complete', action: 'complete', icon: '✅' },
    { label: 'View Customer', action: 'customer', icon: '👤' }
  ]

  // Transform Booking to CalendarBooking format for modal
  const transformBookingToCalendarBooking = useCallback((booking: Booking): any => {
    const statusMap: Record<string, 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'> = {
      'Confirmed': 'CONFIRMED',
      'Pending': 'PENDING',
      'Completed': 'COMPLETED',
      'Cancelled': 'CANCELLED',
      'No-Show': 'NO_SHOW'
    }

    return {
      id: booking.id,
      title: `${booking.customerName} - ${booking.sport}`,
      start: booking.startTime,
      end: booking.endTime,
      resourceId: booking.courtId || '',
      status: statusMap[booking.status] || 'PENDING',
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      courtName: booking.courtName,
      venueName: booking.venueName,
      totalAmount: booking.totalAmount,
      paymentStatus: booking.paymentStatus,
    }
  }, [])

  // Action handlers
  const handleEventClick = useCallback((booking: Booking) => {
    const calendarBooking = transformBookingToCalendarBooking(booking)
    setSelectedBooking(calendarBooking)
    setIsModalOpen(true)
  }, [transformBookingToCalendarBooking])

  const handleEditBooking = useCallback((booking: any) => {
    window.open(`/vendor/bookings/${booking.id}/edit`, '_blank')
  }, [])

  const handleViewCustomer = useCallback((email: string) => {
    window.open(`/vendor/customers?email=${email}`, '_blank')
  }, [])

  const sendSMS = useCallback(async (booking: any) => {
    try {
      const response = await fetch('/api/notifications/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          to: booking.customerEmail,
          message: `Your booking at ${booking.courtName} is confirmed for ${new Date(booking.start).toLocaleString()}`
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
  }, [])

  const handleContextMenu = (e: React.MouseEvent, booking: Booking) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      booking
    })
  }

  const handleContextMenuAction = (action: string, booking: Booking) => {
    // Close context menu first
    setContextMenu({ visible: false, x: 0, y: 0, booking: null })
    
    // Transform booking for actions that need CalendarBooking format
    const calendarBooking = transformBookingToCalendarBooking(booking)
    
    // Execute action based on type
    switch (action) {
      case 'view':
        // Only "View Details" opens the modal
        handleEventClick(booking)
        break
      case 'edit':
        handleEditBooking(calendarBooking)
        break
      case 'sms':
        sendSMS(calendarBooking)
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
  }

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu({ visible: false, x: 0, y: 0, booking: null })
      }
    }

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [contextMenu.visible])

  // Request cancellation ref
  const abortControllerRef = useRef<AbortController | null>(null)

  // Ensure filters is always defined with defaults
  const safeFilters: BookingFilters = filters || {
    search: '',
    venueId: 'all',
    courtId: 'all',
    sportId: 'all',
    status: 'all',
    paymentStatus: 'all'
  }

  // Debounced search - prevents excessive API calls
  const debouncedSearch = useDebounce(safeFilters.search || '', 300)

  // Main API call with debouncing and request cancellation
  const fetchBookings = useCallback(async () => {
    if (!vendorId) return

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      setLoading(true)

      // Build filters
      const statusMap: Record<string, 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'> = {
        'Confirmed': 'CONFIRMED',
        'Pending': 'PENDING',
        'Completed': 'COMPLETED',
        'Cancelled': 'CANCELLED',
        'No-Show': 'NO_SHOW'
      }

      const paymentMap: Record<string, 'PAID' | 'PENDING' | 'REFUNDED' | 'PARTIALLY_REFUNDED'> = {
        'Paid': 'PAID',
        'Pending': 'PENDING',
        'Refunded': 'REFUNDED',
        'Partially Paid': 'PARTIALLY_REFUNDED'
      }

      // Build filters for cache key (without pagination)
      const baseFilters: VendorBookingFilters = {
        sortBy: sorting[0]?.id === 'startTime' ? 'startTime' : sorting[0]?.id === 'totalAmount' ? 'totalAmount' : 'createdAt',
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
      }
      
      // Add optional filters only if they have values
      if (debouncedSearch) {
        baseFilters.search = debouncedSearch
      }
      if (safeFilters.status && safeFilters.status !== 'all' && statusMap[safeFilters.status]) {
        baseFilters.status = statusMap[safeFilters.status]
      }
      if (safeFilters.paymentStatus && safeFilters.paymentStatus !== 'all' && paymentMap[safeFilters.paymentStatus]) {
        baseFilters.paymentStatus = paymentMap[safeFilters.paymentStatus]
      }
      if (safeFilters.venueId && safeFilters.venueId !== 'all') {
        baseFilters.venueId = safeFilters.venueId
      }
      if (safeFilters.courtId && safeFilters.courtId !== 'all') {
        baseFilters.courtId = safeFilters.courtId
      }
      if (safeFilters.sportId && safeFilters.sportId !== 'all') {
        baseFilters.sportId = safeFilters.sportId
      }

      // Check cache first (cache doesn't include pagination)
      const cachedData = getCached(baseFilters, vendorId)
      if (cachedData && cachedData.length > 0) {
        // Transform cached data
        const transformedBookings: Booking[] = cachedData.map((booking: any) => {
          const startTime = new Date(booking.startTime)
          const endTime = new Date(booking.endTime)
          
          const statusMap: Record<string, string> = {
            'CONFIRMED': 'Confirmed',
            'PENDING': 'Pending',
            'COMPLETED': 'Completed',
            'CANCELLED': 'Cancelled',
            'NO_SHOW': 'No-Show'
          }

          const paymentStatusMap: Record<string, string> = {
            'PAID': 'Paid',
            'PENDING': 'Pending',
            'REFUNDED': 'Refunded',
            'PARTIALLY_REFUNDED': 'Partially Paid'
          }

          return {
            id: booking.id,
            bookingNumber: `BK-${booking.id.slice(-6).toUpperCase()}`,
            customerName: booking.user?.name || 'Unknown',
            customerEmail: booking.user?.email || '',
            customerAvatar: booking.user?.avatarUrl || '',
            venueName: booking.venue?.name || 'Unknown',
            courtName: booking.court?.name || 'Unknown',
            courtId: booking.court?.id,
            sport: booking.court?.sport?.displayName || booking.court?.sport?.name || 'Unknown',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            status: statusMap[booking.status] || booking.status,
            totalAmount: Number(booking.totalAmount) || 0,
            paymentStatus: paymentStatusMap[booking.paymentInfo?.status] || booking.paymentInfo?.status || 'Pending',
            createdAt: new Date(booking.createdAt).toISOString(),
            location: booking.venue?.city || 'Unknown'
          }
        })

        // Apply pagination to cached data
        const startIndex = (pagination.page - 1) * pagination.limit
        const endIndex = startIndex + pagination.limit
        const paginatedData = transformedBookings.slice(startIndex, endIndex)
        
        setData(paginatedData)
        
        // Update pagination info
        setPagination(prev => ({
          ...prev,
          totalPages: Math.ceil(transformedBookings.length / pagination.limit),
          totalCount: transformedBookings.length
        }))

        // Get currency from first booking if available
        if (cachedData.length > 0 && cachedData[0].venue?.vendor?.currencyCode) {
          const currencyCode = cachedData[0].venue.vendor.currencyCode
          const currencyMap: Record<string, string> = {
            'INR': '₹',
            'USD': '$',
            'EUR': '€',
            'GBP': '£'
          }
          setCurrencySymbol(currencyMap[currencyCode] || currencyCode)
        }

        return
      }

      // Cache miss - fetch from API with pagination
      const apiFilters: VendorBookingFilters = {
        ...baseFilters,
        page: pagination.page,
        limit: pagination.limit,
      }

      const result = await fetchVendorBookings(vendorId, apiFilters)
      
      // Check if request was cancelled
      if (abortController.signal.aborted) {
        return
      }

      if (result.success && result.data) {
        // Get currency from response if available (check both meta.vendor and root vendor)
        const currencyCode = result.meta?.vendor?.currencyCode || (result as any).vendor?.currencyCode || 'INR'
        const currencyMap: Record<string, string> = {
          'INR': '₹',
          'USD': '$',
          'EUR': '€',
          'GBP': '£'
        }
        setCurrencySymbol(currencyMap[currencyCode] || currencyCode)

        // Transform API response to match Booking type
        const transformedBookings: Booking[] = result.data.map((booking: any) => {
          const startTime = new Date(booking.startTime)
          const endTime = new Date(booking.endTime)
          
          // Map status
          const statusMap: Record<string, string> = {
            'CONFIRMED': 'Confirmed',
            'PENDING': 'Pending',
            'COMPLETED': 'Completed',
            'CANCELLED': 'Cancelled',
            'NO_SHOW': 'No-Show'
          }

          // Map payment status
          const paymentStatusMap: Record<string, string> = {
            'PAID': 'Paid',
            'PENDING': 'Pending',
            'REFUNDED': 'Refunded',
            'PARTIALLY_REFUNDED': 'Partially Paid'
          }

          return {
            id: booking.id,
            bookingNumber: `BK-${booking.id.slice(-6).toUpperCase()}`,
            customerName: booking.user?.name || 'Unknown',
            customerEmail: booking.user?.email || '',
            customerAvatar: booking.user?.avatarUrl || '',
            venueName: booking.venue?.name || 'Unknown',
            courtName: booking.court?.name || 'Unknown',
            courtId: booking.court?.id,
            sport: booking.court?.sport?.displayName || booking.court?.sport?.name || 'Unknown',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            status: statusMap[booking.status] || booking.status,
            totalAmount: Number(booking.totalAmount) || 0,
            paymentStatus: paymentStatusMap[booking.paymentInfo?.status] || booking.paymentInfo?.status || 'Pending',
            createdAt: new Date(booking.createdAt).toISOString(),
            location: booking.venue?.city || 'Unknown'
          }
        })

        setData(transformedBookings)
        
        // Update pagination from response
        const responsePagination = result.meta?.pagination || result.pagination
        if (responsePagination) {
          setPagination(prev => ({
            ...prev,
            page: responsePagination.currentPage,
            totalPages: responsePagination.totalPages,
            totalCount: responsePagination.totalCount,
            limit: responsePagination.limit
          }))
        }

        // Store in cache (store full dataset if we're on page 1, or accumulate)
        // For simplicity, we'll cache each page separately, but calendar can still use overlapping ranges
        // Note: This is a simplified approach - for full optimization, we'd fetch all pages and cache
        if (pagination.page === 1) {
          // Cache the first page - calendar can use this if date ranges overlap
          setCached(baseFilters, result.data, responsePagination?.totalCount, vendorId)
        }
      }
    } catch (error) {
      // Don't update state if request was cancelled
      if (abortController.signal.aborted) {
        return
      }
      console.error('Error fetching vendor bookings:', error)
      setData([])
    } finally {
      // Only update loading state if request wasn't cancelled
      if (!abortController.signal.aborted) {
      setLoading(false)
    }
  }
  }, [vendorId, sorting, debouncedSearch, pagination.page, safeFilters, getCached, setCached])

  // Action handlers that depend on fetchBookings (defined after fetchBookings)
  const cancelBooking = useCallback(async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        credentials: 'include'
      })
      if (response.ok) {
        clearCache()
        fetchBookings()
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
  }, [clearCache, fetchBookings])

  const markComplete = useCallback(async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/complete`, {
        method: 'POST',
        credentials: 'include'
      })
      if (response.ok) {
        clearCache()
        fetchBookings()
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
  }, [clearCache, fetchBookings])

  const handleUpdateBooking = useCallback(async (updatedBooking: any) => {
    clearCache()
    await fetchBookings()
  }, [clearCache, fetchBookings])

  // Effect to fetch bookings when filters change (with debouncing)
  useEffect(() => {
    if (vendorId) {
      fetchBookings()
    }
    
    // Cleanup: cancel request on unmount or when dependencies change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [vendorId, fetchBookings])

  // Sync pagination with URL on mount or URL change
  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get('page') || '1')
    if (pageFromUrl !== pagination.page && pageFromUrl >= 1) {
      setPagination(prev => ({ ...prev, page: pageFromUrl }))
    }
  }, [searchParams.get('page')])

  // Fetch courts for modal
  useEffect(() => {
    if (vendorId) {
      fetch(`/api/courts?vendorId=${vendorId}&limit=1000`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          if (data.courts && Array.isArray(data.courts)) {
            const courtsList = data.courts.map((court: any) => ({
              id: court.id,
              name: court.name,
              venueName: court.venue?.name || '',
              sportName: court.sport?.displayName || court.sport?.name || '',
              venueId: court.venue?.id || '',
            }))
            setCourts(courtsList)
          }
        })
        .catch(err => console.error('Failed to fetch courts:', err))
    }
  }, [vendorId])

  // Filter data by court if needed (client-side filtering removed - handled by API)
  const filteredData = useMemo(() => {
    return data
  }, [data])

  const table = useReactTable({
    data: filteredData,
    columns: createColumns(currencySymbol, handleEventClick),
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
  })

  if (!vendorId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <div className="space-y-4">
          {/* Selected Actions */}
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} booking(s) selected
              </span>
              <Button variant="outline" size="sm">
                Bulk Actions
              </Button>
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {table.getAllColumns().map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      onContextMenu={(e) => handleContextMenu(e, row.original)}
                      className="cursor-pointer"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={table.getAllColumns().length}
                      className="h-24 text-center"
                    >
                      No bookings found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length > 0 && (
                <span>
                  {table.getFilteredSelectedRowModel().rows.length} of{' '}
                  {table.getRowModel().rows.length} row(s) selected.
                </span>
              )}
              {!loading && (
                <span>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                  {pagination.totalCount} bookings
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newPage = pagination.page - 1
                  setPagination(prev => ({ ...prev, page: newPage }))
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('page', newPage.toString())
                  router.push(`${pathname}?${params.toString()}`, { scroll: false })
                }}
                disabled={pagination.page === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newPage = pagination.page + 1
                  setPagination(prev => ({ ...prev, page: newPage }))
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('page', newPage.toString())
                  router.push(`${pathname}?${params.toString()}`, { scroll: false })
                }}
                disabled={pagination.page >= pagination.totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

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
        courts={courts}
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
    </Card>
  )
}
