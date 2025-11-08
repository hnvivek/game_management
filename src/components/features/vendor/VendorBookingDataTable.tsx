'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
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

const createColumns = (currencySymbol: string = '₹'): ColumnDef<Booking>[] => [
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
              onClick={() => navigator.clipboard.writeText(booking.id)}
            >
              Copy booking ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/vendor/bookings/${booking.id}`}>
                View details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {booking.status === 'Pending' && (
              <>
                <DropdownMenuItem className="text-green-600">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm booking
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel booking
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem>
              Contact customer
            </DropdownMenuItem>
            <DropdownMenuItem>
              View payment details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function VendorBookingDataTable() {
  const { vendorId, vendor } = useVendor()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Shared bookings cache
  const { getCached, setCached, clearCache } = useBookingsCache()
  
  // URL state management - sync filters with URL for bookmarkable/shareable links
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
    // Reset to page 1 when filters change
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  // State management
  const [data, setData] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currencySymbol, setCurrencySymbol] = useState<string>('₹')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState(getFilterFromUrl('search', ''))
  const [pagination, setPagination] = useState({ 
    page: parseInt(getFilterFromUrl('page', '1')), 
    totalPages: 1, 
    totalCount: 0, 
    limit: 20 
  })
  
  // Filter options - all available data
  const [allVenues, setAllVenues] = useState<Array<{ id: string; name: string }>>([])
  const [allCourts, setAllCourts] = useState<Array<{ id: string; name: string; venueId: string; sportId: string }>>([])
  const [allSports, setAllSports] = useState<Array<{ id: string; name: string; displayName: string }>>([])
  
  // Selected filters - initialized from URL
  const [selectedVenueId, setSelectedVenueId] = useState<string>(getFilterFromUrl('venueId'))
  const [selectedCourtId, setSelectedCourtId] = useState<string>(getFilterFromUrl('courtId'))
  const [selectedSportId, setSelectedSportId] = useState<string>(getFilterFromUrl('sportId'))

  // Request cancellation ref
  const abortControllerRef = useRef<AbortController | null>(null)

  // Debounced search - prevents excessive API calls
  const debouncedSearch = useDebounce(globalFilter, 300)

  // Computed filtered options based on cascading logic
  const { venues, courts, sports } = useMemo(() => {
    let filteredVenues = allVenues
    let filteredCourts = allCourts
    let filteredSports = allSports

    // If sport is selected, filter venues and courts by sport
    if (selectedSportId && selectedSportId !== 'all') {
      const venueIdsWithSport = new Set(
        allCourts
          .filter(c => c.sportId === selectedSportId)
          .map(c => c.venueId)
      )
      filteredVenues = filteredVenues.filter(v => venueIdsWithSport.has(v.id))
      filteredCourts = filteredCourts.filter(c => c.sportId === selectedSportId)
    }

    // If venue is selected, filter courts and sports by venue
    if (selectedVenueId && selectedVenueId !== 'all') {
      const sportIdsAtVenue = new Set(
        allCourts
          .filter(c => c.venueId === selectedVenueId)
          .map(c => c.sportId)
      )
      filteredSports = filteredSports.filter(s => sportIdsAtVenue.has(s.id))
      filteredCourts = filteredCourts.filter(c => c.venueId === selectedVenueId)
    }

    // If both venue and sport are selected, filter courts by both
    if (selectedVenueId !== 'all' && selectedSportId !== 'all') {
      filteredCourts = filteredCourts.filter(
        c => c.venueId === selectedVenueId && c.sportId === selectedSportId
      )
    }

    return { venues: filteredVenues, courts: filteredCourts, sports: filteredSports }
  }, [selectedVenueId, selectedSportId, allVenues, allCourts, allSports])

  // Handle cascading filter updates with batched state updates
  const handleVenueChange = useCallback((venueId: string) => {
    const newVenueId = venueId || 'all'
    setSelectedVenueId(newVenueId)
    
    // Reset court if it doesn't belong to new venue
    if (newVenueId !== 'all') {
      const currentCourt = allCourts.find(c => c.id === selectedCourtId)
      if (currentCourt && currentCourt.venueId !== newVenueId) {
        setSelectedCourtId('all')
        updateUrlFilters({ venueId: newVenueId, courtId: null })
      } else {
        updateUrlFilters({ venueId: newVenueId })
      }
    } else {
      updateUrlFilters({ venueId: null })
    }
  }, [selectedCourtId, allCourts, updateUrlFilters])

  const handleCourtChange = useCallback((courtId: string) => {
    const newCourtId = courtId || 'all'
    setSelectedCourtId(newCourtId)
    
    // Auto-select sport for the court
    if (newCourtId !== 'all') {
      const court = allCourts.find(c => c.id === newCourtId)
      if (court?.sportId) {
        setSelectedSportId(court.sportId)
        updateUrlFilters({ courtId: newCourtId, sportId: court.sportId })
      } else {
        updateUrlFilters({ courtId: newCourtId })
      }
    } else {
      updateUrlFilters({ courtId: null })
    }
  }, [allCourts, updateUrlFilters])

  const handleSportChange = useCallback((sportId: string) => {
    const newSportId = sportId || 'all'
    setSelectedSportId(newSportId)
    
    // Reset court if it doesn't match sport
    if (newSportId !== 'all') {
      const currentCourt = allCourts.find(c => c.id === selectedCourtId)
      if (currentCourt && currentCourt.sportId !== newSportId) {
        setSelectedCourtId('all')
        updateUrlFilters({ sportId: newSportId, courtId: null })
      } else {
        updateUrlFilters({ sportId: newSportId })
      }
    } else {
      updateUrlFilters({ sportId: null })
    }
  }, [selectedCourtId, allCourts, updateUrlFilters])

  // Initialize data on mount
  useEffect(() => {
    if (vendorId) {
      fetchVenues()
      fetchCourts()
    }
  }, [vendorId])

  // Fetch venues for the vendor
  const fetchVenues = async () => {
    if (!vendorId) return
    try {
      const response = await fetch(`/api/vendors/${vendorId}/venues?limit=100&status=active`, {
        credentials: 'include'
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setAllVenues(result.data.map((venue: any) => ({
            id: venue.id,
            name: venue.name
          })))
        } else {
          console.error('Invalid venues response:', result)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch venues:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error fetching venues:', error)
    }
  }

  // Fetch all courts for the vendor and extract distinct sports
  const fetchCourts = async () => {
    if (!vendorId) return
    try {
      const response = await fetch(`/api/courts?vendorId=${vendorId}&limit=1000`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.courts && Array.isArray(data.courts)) {
          // Extract distinct courts with venue and sport info
          const distinctCourts = new Map<string, { id: string; name: string; venueId: string; sportId: string }>()
          // Extract distinct sports from vendor's courts
          const distinctSports = new Map<string, { id: string; name: string; displayName: string }>()
          
          data.courts.forEach((court: any) => {
            // Add court with venue and sport info
            if (court.venue?.id && court.sport?.id) {
              distinctCourts.set(court.id, {
                id: court.id,
                name: court.name,
                venueId: court.venue.id,
                sportId: court.sport.id
              })
            }
            // Add sport
            if (court.sport) {
              distinctSports.set(court.sport.id, {
                id: court.sport.id,
                name: court.sport.name,
                displayName: court.sport.displayName || court.sport.name
              })
            }
          })
          
          const courtsArray = Array.from(distinctCourts.values())
          const sportsArray = Array.from(distinctSports.values())
          console.log('Fetched courts:', courtsArray.length, courtsArray)
          setAllCourts(courtsArray) // Store all courts
          setAllSports(sportsArray) // Store all sports
        } else {
          console.error('Invalid courts response format:', data)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch courts:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error fetching courts:', error)
    }
  }

  // Fetch sports - filter to only sports that the vendor has courts for
  const fetchSports = async () => {
    // This is now handled in fetchCourts to avoid duplicate API calls
    // Keeping this function for backwards compatibility but it's no longer needed
  }

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
      const statusFilter = columnFilters.find(f => f.id === 'status')
      const paymentFilter = columnFilters.find(f => f.id === 'paymentStatus')

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
      if (statusFilter?.value && statusMap[statusFilter.value as string]) {
        baseFilters.status = statusMap[statusFilter.value as string]
      }
      if (paymentFilter?.value && paymentMap[paymentFilter.value as string]) {
        baseFilters.paymentStatus = paymentMap[paymentFilter.value as string]
      }
      if (selectedVenueId && selectedVenueId !== 'all') {
        baseFilters.venueId = selectedVenueId
      }
      if (selectedCourtId && selectedCourtId !== 'all') {
        baseFilters.courtId = selectedCourtId
      }
      if (selectedSportId && selectedSportId !== 'all') {
        baseFilters.sportId = selectedSportId
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
      const filters: VendorBookingFilters = {
        ...baseFilters,
        page: pagination.page,
        limit: pagination.limit,
      }

      const result = await fetchVendorBookings(vendorId, filters)
      
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
  }, [vendorId, sorting, columnFilters, debouncedSearch, pagination.page, selectedVenueId, selectedCourtId, selectedSportId, getCached, setCached])

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

  // Sync URL when search changes (only if different from URL)
  useEffect(() => {
    const currentSearch = getFilterFromUrl('search', '')
    if (debouncedSearch !== currentSearch) {
      updateUrlFilters({ search: debouncedSearch || null })
    }
  }, [debouncedSearch]) // Removed updateUrlFilters from deps to prevent loop

  // Sync pagination with URL on mount or URL change (but not from our own updates)
  useEffect(() => {
    const pageFromUrl = parseInt(getFilterFromUrl('page', '1'))
    if (pageFromUrl !== pagination.page && pageFromUrl >= 1) {
      setPagination(prev => ({ ...prev, page: pageFromUrl }))
    }
  }, [searchParams.get('page')]) // Only depend on page param, not entire searchParams

  // Filter data by court if needed (client-side filtering removed - handled by API)
  const filteredData = useMemo(() => {
    return data
  }, [data])

  const table = useReactTable({
    data: filteredData,
    columns: createColumns(currencySymbol),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  const handleStatusFilter = (status: string) => {
    if (status === 'all') {
      table.getColumn('status')?.setFilterValue(undefined)
    } else {
      table.getColumn('status')?.setFilterValue(status)
    }
  }

  const handlePaymentFilter = (status: string) => {
    if (status === 'all') {
      table.getColumn('paymentStatus')?.setFilterValue(undefined)
    } else {
      table.getColumn('paymentStatus')?.setFilterValue(status)
    }
  }

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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Booking Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {/* 1. Search - Most general filter, text-based */}
            <div className="relative flex-1 min-w-[200px] sm:max-w-[220px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(String(e.target.value))}
                className="pl-10"
              />
            </div>

            {/* 2. Venue - Location hierarchy starts here */}
            <Select value={selectedVenueId === 'all' ? undefined : selectedVenueId} onValueChange={handleVenueChange}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Venue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Venues</SelectItem>
                {venues.map((venue) => (
                  <SelectItem key={venue.id} value={venue.id}>
                    {venue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 3. Court - Filtered by venue and sport (cascading) */}
            <Select 
              value={selectedCourtId === 'all' ? undefined : selectedCourtId} 
              onValueChange={handleCourtChange}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Court" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courts</SelectItem>
                {courts.map((court) => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 4. Sport - Activity type */}
            <Select value={selectedSportId === 'all' ? undefined : selectedSportId} onValueChange={handleSportChange}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {sports.map((sport) => (
                  <SelectItem key={sport.id} value={sport.id}>
                    {sport.displayName || sport.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 5. Status - Booking state */}
            <Select onValueChange={handleStatusFilter}>
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

            {/* 6. Payment - Payment state */}
            <Select onValueChange={handlePaymentFilter}>
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
                  {table.getFilteredRowModel().rows.length} row(s) selected.
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
                  updateUrlFilters({ page: newPage.toString() })
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
                  updateUrlFilters({ page: newPage.toString() })
                }}
                disabled={pagination.page >= pagination.totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
