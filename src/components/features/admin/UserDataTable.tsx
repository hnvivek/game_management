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
import { MoreHorizontal, ArrowUpDown, Search, Filter, User as UserIcon, Mail, Calendar, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

// User type from API
type User = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  isActive: boolean
  avatarUrl: string
  lastLoginAt: string
  createdAt: string
  isEmailVerified: boolean
  stats: {
    bookings: number
    matches: number
    tournaments: number
    teams: number
    payments: number
  }
  vendorInfo?: {
    id: string
    name: string
  }
}

const columns: ColumnDef<User>[] = [
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
          User
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{user.name}</div>
            <div className="text-sm text-muted-foreground truncate">{user.email}</div>
            {user.vendorInfo && (
              <div className="text-xs text-blue-600 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>{user.vendorInfo.name}</span>
              </div>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.getValue('role') as string
      const roleColors = {
        'CUSTOMER': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        'VENDOR_ADMIN': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        'VENDOR_STAFF': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        'PLATFORM_ADMIN': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }

      return (
        <Badge className={cn(roleColors[role as keyof typeof roleColors])}>
          {role.replace('_', ' ')}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
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
          Join Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return <div>{date.toLocaleDateString()}</div>
    },
  },
  {
    accessorKey: 'lastLoginAt',
    header: 'Last Login',
    cell: ({ row }) => {
      const date = row.getValue('lastLoginAt') as string
      if (!date) {
        return <div className="text-muted-foreground">Never</div>
      }
      return <div>{new Date(date).toLocaleDateString()}</div>
    },
  },
  {
    accessorKey: 'stats',
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
      const stats = row.getValue('stats') as User['stats']
      return <div>{stats.bookings}</div>
    },
  },
  {
    id: 'isEmailVerified',
    header: 'Email',
    cell: ({ row }) => {
      const user = row.original
      return (
        <Badge variant={user.isEmailVerified ? 'default' : 'outline'}>
          {user.isEmailVerified ? 'Verified' : 'Not verified'}
        </Badge>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const user = row.original

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
              onClick={() => navigator.clipboard.writeText(user.id)}
            >
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit user</DropdownMenuItem>
            <DropdownMenuItem>View bookings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              Deactivate user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function UserDataTable() {
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/admin/users', {
          credentials: 'include' // Important for authentication
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.status}`)
        }

        const result = await response.json()

        if (result.success) {
          setData(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch users')
        }
      } catch (err) {
        console.error('Error fetching users:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
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

  const handleRoleFilter = (role: string) => {
    if (role === 'all') {
      table.getColumn('role')?.setFilterValue(undefined)
    } else {
      table.getColumn('role')?.setFilterValue(role)
    }
  }

  const handleStatusFilter = (status: string) => {
    if (status === 'all') {
      table.getColumn('isActive')?.setFilterValue(undefined)
    } else {
      table.getColumn('isActive')?.setFilterValue(status === 'active')
    }
  }

  // Show loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Loading skeleton */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[150px]" />
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
            <UserIcon className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">Error loading users</div>
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
          <UserIcon className="h-5 w-5" />
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(String(e.target.value))}
                className="pl-10"
              />
            </div>

            <Select onValueChange={handleRoleFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="VENDOR_ADMIN">Vendor Admin</SelectItem>
                <SelectItem value="VENDOR_STAFF">Vendor Staff</SelectItem>
                <SelectItem value="PLATFORM_ADMIN">Platform Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selected Actions */}
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} user(s) selected
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
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className="cursor-pointer hover:bg-muted/50"
                      onDoubleClick={() => {
                        const user = row.original
                        window.location.href = `/admin/users/${user.id}`
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
                      No results.
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