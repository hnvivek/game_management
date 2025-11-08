'use client'

import { useState, useEffect } from 'react'
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
import { MoreHorizontal, ArrowUpDown, Search, Filter, Calendar, Clock, MapPin, Users, DollarSign, CheckCircle, XCircle, AlertCircle, Timer, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { fetchAdminBookings, AdminBookingFilters } from '@/lib/api/admin/bookings'

// Mock booking data
const mockBookings = [
  {
    id: '1',
    bookingNumber: 'BK-2024-001',
    customerName: 'John Doe',
    customerEmail: 'john.doe@example.com',
    customerAvatar: '/avatars/user1.png',
    vendorName: 'Sports Complex LLC',
    venueName: 'Main Soccer Field',
    sport: 'Soccer',
    startTime: '2024-11-05T14:00:00Z',
    endTime: '2024-11-05T16:00:00Z',
    status: 'Confirmed',
    type: 'One-time',
    totalAmount: 120,
    participants: 10,
    paymentStatus: 'Paid',
    createdAt: '2024-11-01T10:30:00Z',
    location: 'New York, NY'
  },
  {
    id: '2',
    bookingNumber: 'BK-2024-002',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.j@example.com',
    customerAvatar: '/avatars/user2.png',
    vendorName: 'City Recreation Center',
    venueName: 'Basketball Court A',
    sport: 'Basketball',
    startTime: '2024-11-04T18:00:00Z',
    endTime: '2024-11-04T20:00:00Z',
    status: 'Pending',
    type: 'Recurring',
    totalAmount: 85,
    participants: 8,
    paymentStatus: 'Pending',
    createdAt: '2024-11-02T14:20:00Z',
    location: 'Los Angeles, CA'
  },
  {
    id: '3',
    bookingNumber: 'BK-2024-003',
    customerName: 'Mike Chen',
    customerEmail: 'mike.chen@example.com',
    customerAvatar: '/avatars/user3.png',
    vendorName: 'Elite Sports Facilities',
    venueName: 'Tennis Court 1',
    sport: 'Tennis',
    startTime: '2024-11-03T10:00:00Z',
    endTime: '2024-11-03T12:00:00Z',
    status: 'Completed',
    type: 'One-time',
    totalAmount: 60,
    participants: 4,
    paymentStatus: 'Paid',
    createdAt: '2024-10-30T09:15:00Z',
    location: 'Chicago, IL'
  },
  {
    id: '4',
    bookingNumber: 'BK-2024-004',
    customerName: 'Emily Wilson',
    customerEmail: 'emily.w@example.com',
    customerAvatar: '/avatars/user4.png',
    vendorName: 'Pro Athletic Centers',
    venueName: 'Volleyball Court',
    sport: 'Volleyball',
    startTime: '2024-11-06T15:00:00Z',
    endTime: '2024-11-06T17:00:00Z',
    status: 'Confirmed',
    type: 'Tournament',
    totalAmount: 250,
    participants: 12,
    paymentStatus: 'Partially Paid',
    createdAt: '2024-11-03T16:45:00Z',
    location: 'Miami, FL'
  },
  {
    id: '5',
    bookingNumber: 'BK-2024-005',
    customerName: 'David Brown',
    customerEmail: 'david.brown@example.com',
    customerAvatar: '/avatars/user5.png',
    vendorName: 'Community Sports Hub',
    venueName: 'Multipurpose Field',
    sport: 'Football',
    startTime: '2024-11-02T19:00:00Z',
    endTime: '2024-11-02T21:00:00Z',
    status: 'Cancelled',
    type: 'One-time',
    totalAmount: 100,
    participants: 14,
    paymentStatus: 'Refunded',
    createdAt: '2024-10-28T11:30:00Z',
    location: 'Houston, TX'
  }
]

type Booking = {
  id: string
  bookingNumber: string
  customerName: string
  customerEmail: string
  customerAvatar: string
  vendorName: string
  venueName: string
  sport: string
  startTime: string
  endTime: string
  status: string
  type: string
  totalAmount: number
  participants: number
  paymentStatus: string
  createdAt: string
  location: string
}

const columns: ColumnDef<Booking>[] = [
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
    accessorKey: 'vendorName',
    header: 'Vendor',
    cell: ({ row }) => {
      const booking = row.original
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium">{booking.vendorName}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{booking.venueName}</span>
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
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      return (
        <Badge variant="secondary" className="capitalize">
          {type}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'participants',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          Participants
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const participants = row.getValue('participants') as number
      return (
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span>{participants}</span>
        </div>
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
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">${amount}</span>
        </div>
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
              <Link href={`/admin/bookings/${booking.id}`}>
                View details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/bookings/${booking.id}/edit`}>
                Modify booking
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

export function BookingDataTable() {
  const [data, setData] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0, limit: 20 })

  useEffect(() => {
    fetchBookings()
  }, [sorting, columnFilters, globalFilter, pagination.page])

  const fetchBookings = async () => {
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

      const filters: AdminBookingFilters = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sorting[0]?.id === 'startTime' ? 'startTime' : sorting[0]?.id === 'totalAmount' ? 'totalAmount' : 'createdAt',
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
        ...(globalFilter && { search: globalFilter }),
        ...(statusFilter?.value && { status: statusMap[statusFilter.value as string] }),
        ...(paymentFilter?.value && { paymentStatus: paymentMap[paymentFilter.value as string] })
      }

      const result = await fetchAdminBookings(filters)

      if (result.success && result.data) {
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

          // Map booking type
          const typeMap: Record<string, string> = {
            'ONE_TIME': 'One-time',
            'RECURRING': 'Recurring',
            'TOURNAMENT': 'Tournament',
            'MATCH': 'Match',
            'TRAINING': 'Training'
          }

          return {
            id: booking.id,
            bookingNumber: `BK-${booking.id.slice(-6).toUpperCase()}`,
            customerName: booking.user?.name || 'Unknown',
            customerEmail: booking.user?.email || '',
            customerAvatar: booking.user?.avatarUrl || '',
            vendorName: booking.vendorInfo?.name || booking.venue?.vendor?.name || 'Unknown',
            venueName: booking.venue?.name || 'Unknown',
            sport: booking.sport?.displayName || booking.sport?.name || 'Unknown',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            status: statusMap[booking.status] || booking.status,
            type: typeMap[booking.type] || booking.type,
            totalAmount: Number(booking.totalAmount) || 0,
            participants: booking.playerCount || 0,
            paymentStatus: paymentStatusMap[booking.paymentInfo?.status] || booking.paymentInfo?.status || 'Pending',
            createdAt: new Date(booking.createdAt).toISOString(),
            location: booking.venue?.city || 'Unknown'
          }
        })

        setData(transformedBookings)
        
        if (result.pagination) {
          setPagination(prev => ({
            ...prev,
            totalPages: result.pagination.totalPages,
            totalCount: result.pagination.totalCount
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const table = useReactTable({
    data,
    columns,
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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(String(e.target.value))}
                className="pl-10"
              />
            </div>

            <Select onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by status" />
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

            <Select onValueChange={handlePaymentFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Payment status" />
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
                      {columns.map((_, j) => (
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
                      colSpan={columns.length}
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
                  setPagination(prev => ({ ...prev, page: prev.page - 1 }))
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
                  setPagination(prev => ({ ...prev, page: prev.page + 1 }))
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