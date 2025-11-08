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
import { MoreHorizontal, ArrowUpDown, Search, Mail, Phone, Calendar, TrendingUp, Users, MapPin, Eye, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { fetchVendorCustomers, VendorCustomerFilters } from '@/lib/api/vendor/customers'
import { useVendor } from '@/hooks/use-vendor'
import { useDebounce } from '@/hooks/use-debounce'

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  avatarUrl: string
  isActive: boolean
  createdAt: string
  totalBookings: number
  totalSpent: number
  firstBookingDate?: string
  lastBookingDate?: string
  lastVenue?: string
  status: string
  bookingStatusBreakdown: Record<string, number>
}

const createColumns = (currencySymbol: string = '₹'): ColumnDef<Customer>[] => [
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
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const customer = row.original
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={customer.avatarUrl} alt={customer.name} />
            <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{customer.name}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant={customer.isActive ? 'default' : 'secondary'} className="text-xs">
                {customer.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <span className="capitalize">
                {customer.status === 'FIRST_TIME' ? 'First Time' : customer.status.replace('_', ' ').toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'email',
    header: 'Contact',
    cell: ({ row }) => {
      const customer = row.original
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="truncate max-w-[150px]">{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{customer.phone}</span>
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'totalBookings',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          Bookings
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const customer = row.original
      return (
        <div className="space-y-1">
          <div className="font-medium">{customer.totalBookings}</div>
          <div className="text-xs text-muted-foreground">
            {customer.bookingStatusBreakdown['CONFIRMED'] || 0} confirmed
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'totalSpent',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          Total Spent
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = row.getValue('totalSpent') as number
      return (
        <span className="font-medium">{currencySymbol}{amount.toLocaleString()}</span>
      )
    },
  },
  {
    accessorKey: 'lastBookingDate',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          Last Activity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const customer = row.original
      return (
        <div className="space-y-1">
          {customer.lastBookingDate ? (
            <>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>{new Date(customer.lastBookingDate).toLocaleDateString()}</span>
              </div>
              {customer.lastVenue && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[100px]">{customer.lastVenue}</span>
                </div>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No bookings yet</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          Joined
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as string
      return (
        <div className="text-sm">
          {new Date(date).toLocaleDateString()}
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const customer = row.original

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
              onClick={() => navigator.clipboard.writeText(customer.email)}
            >
              <Mail className="mr-2 h-4 w-4" />
              Copy email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/vendor/customers/${customer.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/vendor/bookings?userId=${customer.id}`}>
                <Calendar className="mr-2 h-4 w-4" />
                View bookings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact customer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function VendorCustomerDataTable({ availableStatuses = [] }: { availableStatuses?: string[] }) {
  const { vendorId, vendor } = useVendor()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // URL state management
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
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  // State management
  const [data, setData] = useState<Customer[]>([])
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

  // Filter options
  const [allVenues, setAllVenues] = useState<Array<{ id: string; name: string }>>([])
  const [selectedVenueId, setSelectedVenueId] = useState<string>(getFilterFromUrl('venueId', 'all'))
  const [selectedStatus, setSelectedStatus] = useState<string>(getFilterFromUrl('status', 'all'))

  // Request cancellation ref
  const abortControllerRef = useRef<AbortController | null>(null)

  // Debounced search
  const debouncedSearch = useDebounce(globalFilter, 300)

  // Handle filter changes
  const handleVenueChange = useCallback((venueId: string) => {
    const newVenueId = venueId || 'all'
    setSelectedVenueId(newVenueId)
    updateUrlFilters({ venueId: newVenueId === 'all' ? null : newVenueId })
  }, [updateUrlFilters])

  // Initialize data on mount
  useEffect(() => {
    if (vendorId) {
      fetchVenues()
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
        }
      }
    } catch (error) {
      console.error('Error fetching venues:', error)
    }
  }

  // Main API call
  const fetchCustomers = useCallback(async () => {
    if (!vendorId) return

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      setLoading(true)

      // Build filters - use selectedStatus directly (consistent with bookings page pattern)
      // Status is already in DB format (ACTIVE, INACTIVE, FIRST_TIME, RETURNING)

      const filters: VendorCustomerFilters = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sorting[0]?.id || 'createdAt',
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
      }

      if (debouncedSearch) {
        filters.search = debouncedSearch
      }
      if (selectedStatus && selectedStatus !== 'all') {
        // selectedStatus is already in DB format (ACTIVE, INACTIVE, FIRST_TIME, RETURNING)
        filters.status = selectedStatus as 'ACTIVE' | 'INACTIVE' | 'FIRST_TIME' | 'RETURNING'
      }
      if (selectedVenueId && selectedVenueId !== 'all') {
        filters.venueId = selectedVenueId
      }

      const result = await fetchVendorCustomers(vendorId, filters)

      if (abortController.signal.aborted) {
        return
      }

      if (result.success && result.data) {
        // Get currency from response
        const currencyCode = result.meta?.vendor?.currencyCode || 'INR'
        const currencyMap: Record<string, string> = {
          'INR': '₹',
          'USD': '$',
          'EUR': '€',
          'GBP': '£'
        }
        setCurrencySymbol(currencyMap[currencyCode] || currencyCode)

        // Transform API response to match Customer type
        const transformedCustomers: Customer[] = result.data.map((customer: any) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          avatarUrl: customer.avatarUrl,
          isActive: customer.isActive,
          createdAt: new Date(customer.createdAt).toISOString(),
          totalBookings: customer.totalBookings,
          totalSpent: customer.totalSpent,
          firstBookingDate: customer.firstBookingDate,
          lastBookingDate: customer.lastBookingDate,
          lastVenue: customer.lastVenue,
          status: customer.status,
          bookingStatusBreakdown: customer.bookingStatusBreakdown || {}
        }))

        setData(transformedCustomers)

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
      }
    } catch (error) {
      if (abortController.signal.aborted) {
        return
      }
      console.error('Error fetching vendor customers:', error)
      setData([])
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false)
      }
    }
  }, [vendorId, sorting, debouncedSearch, pagination.page, selectedVenueId, selectedStatus])

  // Effect to fetch customers when filters change
  useEffect(() => {
    if (vendorId) {
      fetchCustomers()
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [vendorId, fetchCustomers])

  // Sync URL when search changes
  useEffect(() => {
    const currentSearch = getFilterFromUrl('search', '')
    if (debouncedSearch !== currentSearch) {
      updateUrlFilters({ search: debouncedSearch || null })
    }
  }, [debouncedSearch])

  // Sync pagination with URL
  useEffect(() => {
    const pageFromUrl = parseInt(getFilterFromUrl('page', '1'))
    if (pageFromUrl !== pagination.page && pageFromUrl >= 1) {
      setPagination(prev => ({ ...prev, page: pageFromUrl }))
    }
  }, [searchParams.get('page')])

  // Sync status filter with URL on mount
  useEffect(() => {
    const statusFromUrl = getFilterFromUrl('status', 'all')
    if (statusFromUrl !== selectedStatus) {
      setSelectedStatus(statusFromUrl)
    }
  }, [searchParams.get('status')])

  const table = useReactTable({
    data,
    columns: createColumns(currencySymbol),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const handleStatusFilter = (status: string) => {
    const newStatus = status || 'all'
    setSelectedStatus(newStatus)
    updateUrlFilters({ status: newStatus === 'all' ? null : newStatus })
    // Also update table filter for UI consistency
    if (newStatus === 'all') {
      table.getColumn('status')?.setFilterValue(undefined)
    } else {
      table.getColumn('status')?.setFilterValue(newStatus)
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
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            Customer List
          </CardTitle>
          {!loading && (
            <Badge variant="secondary" className="text-xs">
              {pagination.totalCount} {pagination.totalCount === 1 ? 'customer' : 'customers'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] sm:max-w-[280px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(String(e.target.value))}
                className="pl-10 h-10"
              />
            </div>

            {/* Venue Filter */}
            <Select value={selectedVenueId === 'all' ? undefined : selectedVenueId} onValueChange={handleVenueChange}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <SelectValue placeholder="All Venues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Venues</SelectItem>
                {allVenues.map((venue) => (
                  <SelectItem key={venue.id} value={venue.id}>
                    {venue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter - Dynamic from DB */}
            <Select value={selectedStatus === 'all' ? undefined : selectedStatus} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-10">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {availableStatuses.map((status) => {
                  // Map DB status to display name
                  const statusDisplayMap: Record<string, string> = {
                    'ACTIVE': 'Active',
                    'INACTIVE': 'Inactive',
                    'FIRST_TIME': 'First Time',
                    'RETURNING': 'Returning'
                  }
                  return (
                    <SelectItem key={status} value={status}>
                      {statusDisplayMap[status] || status.replace('_', ' ')}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Actions */}
          {table.getSelectedRowModel().rows.length > 0 && (
            <div className="flex items-center justify-between gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <span className="text-sm font-medium text-foreground">
                {table.getSelectedRowModel().rows.length} customer{table.getSelectedRowModel().rows.length === 1 ? '' : 's'} selected
              </span>
              <Button variant="outline" size="sm" className="h-8">
                Bulk Actions
              </Button>
            </div>
          )}

          {/* Table */}
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="font-semibold">
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
                        className="hover:bg-muted/50 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-3">
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
                        className="h-32 text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm font-medium text-muted-foreground">No customers found</p>
                          <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {table.getSelectedRowModel().rows.length > 0 ? (
                <span className="font-medium">
                  {table.getSelectedRowModel().rows.length} of{' '}
                  {table.getRowModel().rows.length} row{table.getSelectedRowModel().rows.length === 1 ? '' : 's'} selected
                </span>
              ) : (
                !loading && (
                  <span>
                    Showing <span className="font-medium text-foreground">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="font-medium text-foreground">{Math.min(pagination.page * pagination.limit, pagination.totalCount)}</span> of{' '}
                    <span className="font-medium text-foreground">{pagination.totalCount}</span> customer{pagination.totalCount === 1 ? '' : 's'}
                  </span>
                )
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newPage = pagination.page - 1
                  setPagination(prev => ({ ...prev, page: newPage }))
                  updateUrlFilters({ page: newPage.toString() })
                }}
                disabled={pagination.page === 1 || loading}
                className="h-9"
              >
                Previous
              </Button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
                <span className="text-sm font-medium text-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newPage = pagination.page + 1
                  setPagination(prev => ({ ...prev, page: newPage }))
                  updateUrlFilters({ page: newPage.toString() })
                }}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="h-9"
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