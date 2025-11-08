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
import { MoreHorizontal, ArrowUpDown, Search, Filter, Store, MapPin, Mail, Phone, Calendar, Eye, Edit, CheckCircle, XCircle, Clock, TrendingUp, Users, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Vendor type from API
type Vendor = {
  id: string
  name: string
  email: string
  phone: string
  status: string
  avatar: string
  joinDate: string
  location: string
  venues: number
  totalBookings: number
  totalRevenue: number
  approvalStatus: string
  contact: string
  rating: number | null
  isActive: boolean
  stats?: {
    venues: {
      total: number
      active: number
    }
    staff: number
    bookings: number
    domains: number
  }
}

interface VendorDataTableProps {
  onBulkAction?: (action: string, vendorIds: string[]) => void
}

const columns: ColumnDef<Vendor>[] = [
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
          Vendor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const vendor = row.original
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={vendor.avatar} alt={vendor.name} />
            <AvatarFallback>{vendor.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{vendor.name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{vendor.location}</span>
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'contact',
    header: 'Contact',
    cell: ({ row }) => {
      const vendor = row.original
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium">{vendor.contact}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{vendor.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{vendor.phone}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'approvalStatus',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('approvalStatus') as string
      const isActive = row.original.isActive

      const statusColors = {
        'Approved': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        'Suspended': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        'Rejected': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      }

      const statusIcons = {
        'Approved': <CheckCircle className="h-3 w-3" />,
        'Pending': <Clock className="h-3 w-3" />,
        'Suspended': <XCircle className="h-3 w-3" />,
        'Rejected': <XCircle className="h-3 w-3" />
      }

      return (
        <div className="flex items-center gap-2">
          <Badge className={cn(statusColors[status as keyof typeof statusColors])}>
            <div className="flex items-center gap-1">
              {statusIcons[status as keyof typeof statusIcons]}
              <span>{status}</span>
            </div>
          </Badge>
          {!isActive && status !== 'Suspended' && (
            <Badge variant="outline" className="text-xs">
              Inactive
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'venues',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          Venues
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
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
  },
  {
    accessorKey: 'totalRevenue',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          Revenue
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('totalRevenue'))
      return <div className="font-medium">${amount.toLocaleString()}</div>
    },
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    cell: ({ row }) => {
      const rating = row.getValue('rating') as number | null
      if (rating === null) {
        return <span className="text-muted-foreground">No ratings</span>
      }
      return (
        <div className="flex items-center gap-1">
          <span className="font-medium">{rating}</span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-3 h-3 rounded-full',
                  i < Math.floor(rating) ? 'bg-yellow-400' : 'bg-gray-200'
                )}
              />
            ))}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'joinDate',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          Join Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('joinDate'))
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span>{date.toLocaleDateString()}</span>
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const vendor = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Vendor Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(vendor.id)}
            >
              Copy vendor ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                window.location.href = `/admin/vendors/${vendor.id}`
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                window.location.href = `/admin/vendors/${vendor.id}/edit`
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit vendor
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                window.location.href = `/admin/vendors/${vendor.id}/venues`
              }}
            >
              <Store className="mr-2 h-4 w-4" />
              Manage venues ({vendor.venues})
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                window.location.href = `/admin/vendors/${vendor.id}/analytics`
              }}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              View analytics
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                window.location.href = `/admin/vendors/${vendor.id}/bookings`
              }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              View bookings ({vendor.totalBookings})
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {vendor.approvalStatus === 'Pending' && (
              <>
                <DropdownMenuItem
                  className="text-green-600"
                  onClick={() => onBulkAction?.('approve', [vendor.id])}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve vendor
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => onBulkAction?.('reject', [vendor.id])}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject application
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => {
                window.location.href = `/admin/vendors/${vendor.id}/staff`
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage staff
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                window.location.href = `/admin/vendors/${vendor.id}/support`
              }}
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact vendor
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {vendor.isActive ? (
              <DropdownMenuItem
                className="text-orange-600"
                onClick={() => onBulkAction?.('suspend', [vendor.id])}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Suspend vendor
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-green-600"
                onClick={() => onBulkAction?.('activate', [vendor.id])}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Reactivate vendor
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => {
                if (confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
                  onBulkAction?.('delete', [vendor.id])
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete vendor
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function VendorDataTable({ onBulkAction }: VendorDataTableProps) {
  const [data, setData] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch vendors from API
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/admin/vendors', {
          credentials: 'include' // Important for authentication
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch vendors: ${response.status}`)
        }

        const result = await response.json()

        if (result.success) {
          // Transform API data to match component structure
          const transformedData = result.data.map((vendor: any) => ({
            id: vendor.id,
            name: vendor.name,
            email: vendor.email,
            phone: vendor.phone,
            status: vendor.isActive ? 'Active' : 'Inactive',
            avatar: vendor.logoUrl || '',
            joinDate: vendor.createdAt?.split('T')[0] || '',
            location: vendor.city || 'Not specified',
            venues: vendor.stats?.venues?.total || 0,
            totalBookings: vendor.stats?.bookings || 0,
            totalRevenue: 0, // TODO: Calculate from bookings
            approvalStatus: vendor.isActive ? 'Approved' : 'Pending',
            contact: vendor.name || 'Unknown',
            rating: 4.5, // TODO: Calculate from reviews
            isActive: vendor.isActive,
            stats: vendor.stats
          }))

          setData(transformedData)
        } else {
          throw new Error(result.error || 'Failed to fetch vendors')
        }
      } catch (err) {
        console.error('Error fetching vendors:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch vendors')
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [])
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')

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
      table.getColumn('approvalStatus')?.setFilterValue(undefined)
    } else {
      table.getColumn('approvalStatus')?.setFilterValue(status)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Vendor Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Loading skeleton */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[150px]" />
            </div>
            <div className="rounded-md border">
              <div className="space-y-2 p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Vendor Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">Error loading vendors</div>
            <div className="text-sm text-muted-foreground mb-4">{error}</div>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Vendor Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
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
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selected Actions */}
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} vendor(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id)
                    onBulkAction?.('approve', selectedIds)
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id)
                    onBulkAction?.('suspend', selectedIds)
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Suspend
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id)
                    onBulkAction?.('delete', selectedIds)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
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
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className="cursor-pointer hover:bg-muted/50"
                      onDoubleClick={() => {
                        const vendor = row.original
                        window.location.href = `/admin/vendors/${vendor.id}`
                      }}
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
                      No vendors found.
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
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
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