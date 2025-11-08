'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { VendorLayout } from '@/components/features/vendor/VendorLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Plus,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Eye,
  Edit,
  Trash2,
  Search,
  MoreHorizontal,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useVendor } from '@/hooks/use-vendor'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useDebounce } from '@/hooks/use-debounce'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import Link from 'next/link'

interface Venue {
  id: string
  name: string
  description?: string
  address?: string
  city?: string
  postalCode?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  stats: {
    bookings: number
    revenue: number
    courts: number
    operatingHours: number
  }
  sports: Array<{
    id: string
    name: string
    displayName: string
  }>
}

export default function VendorVenuesPage() {
  const { vendorId, isLoading: vendorLoading } = useVendor()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
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
    // Reset to page 1 when filters change
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  // State management
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(getFilterFromUrl('search', ''))
  const [statusFilter, setStatusFilter] = useState<string>(getFilterFromUrl('status', 'all'))
  const [cityFilter, setCityFilter] = useState<string>(getFilterFromUrl('city', 'all'))
  const [sportFilter, setSportFilter] = useState<string>(getFilterFromUrl('sportId', 'all'))
  const [pagination, setPagination] = useState({
    page: parseInt(getFilterFromUrl('page', '1')),
    totalPages: 1,
    totalCount: 0,
    limit: 20
  })
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalCourts: 0,
    totalBookings: 0,
    totalRevenue: 0
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [venueToDelete, setVenueToDelete] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Request cancellation ref
  const abortControllerRef = useRef<AbortController | null>(null)

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, 300)

  // Fetch venues from API with filters
  const fetchVenues = useCallback(async () => {
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
      setError(null)

      // Build query params
      const params = new URLSearchParams()
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())
      
      if (debouncedSearch) {
        params.set('search', debouncedSearch)
      }
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      if (cityFilter !== 'all') {
        params.set('city', cityFilter)
      }
      if (sportFilter !== 'all') {
        params.set('sportId', sportFilter)
      }

      const response = await fetch(`/api/vendors/${vendorId}/venues?${params.toString()}`, {
        credentials: 'include',
        signal: abortController.signal
      })

      // Check if request was cancelled
      if (abortController.signal.aborted) {
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch venues')
      }

      const result = await response.json()
      
      // Check again if request was cancelled
      if (abortController.signal.aborted) {
        return
      }

      if (result.success && result.data) {
        const apiVenues: Venue[] = result.data || []
        setVenues(apiVenues)

        // Update pagination from response
        const responsePagination = result.meta?.pagination
        if (responsePagination) {
          setPagination(prev => ({
            ...prev,
            page: responsePagination.currentPage,
            totalPages: responsePagination.totalPages,
            totalCount: responsePagination.totalCount,
            limit: responsePagination.limit
          }))
        }

        // Update summary stats from response
        const responseSummary = result.meta?.summary
        if (responseSummary) {
          setSummaryStats({
            total: responseSummary.total || 0,
            active: responseSummary.active || 0,
            inactive: responseSummary.inactive || 0,
            totalCourts: responseSummary.totalCourts || 0,
            totalBookings: responseSummary.totalBookings || 0,
            totalRevenue: responseSummary.totalRevenue || 0
          })
        }
      } else {
        setVenues([])
      }
    } catch (err) {
      // Don't update state if request was cancelled
      if (abortController.signal.aborted) {
        return
      }
      console.error('Error fetching venues:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch venues')
      setVenues([])
    } finally {
      // Only update loading state if request wasn't cancelled
      if (!abortController.signal.aborted) {
        setLoading(false)
      }
    }
  }, [vendorId, debouncedSearch, statusFilter, cityFilter, sportFilter, pagination.page, pagination.limit])

  // Effect to fetch venues when filters change
  useEffect(() => {
    if (vendorId) {
      fetchVenues()
    }
    
    // Cleanup: cancel request on unmount or when dependencies change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [vendorId, fetchVenues])

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

  // Filter handlers
  const handleStatusChange = useCallback((status: string) => {
    setStatusFilter(status)
    updateUrlFilters({ status: status !== 'all' ? status : null })
  }, [updateUrlFilters])

  const handleCityChange = useCallback((city: string) => {
    setCityFilter(city)
    updateUrlFilters({ city: city !== 'all' ? city : null })
  }, [updateUrlFilters])

  const handleSportChange = useCallback((sportId: string) => {
    setSportFilter(sportId)
    updateUrlFilters({ sportId: sportId !== 'all' ? sportId : null })
  }, [updateUrlFilters])

  // Get unique cities and sports from all venues (for filter dropdowns)
  // Note: In a real app, you might want to fetch these separately or from the API
  const { cities, sports } = useMemo(() => {
    const uniqueCities = Array.from(new Set(venues.map(v => v.city).filter(Boolean)))
    const uniqueSports = Array.from(
      new Map(
        venues.flatMap(v => v.sports.map(s => [s.id, { id: s.id, name: s.displayName }]))
      ).values()
    )
    return { cities: uniqueCities, sports: uniqueSports }
  }, [venues])

  // Delete venue handler
  const handleDeleteClick = (venue: Venue) => {
    setVenueToDelete({ id: venue.id, name: venue.name })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!vendorId || !venueToDelete) return

    try {
      setDeleting(true)

      const response = await fetch(`/api/vendors/${vendorId}/venues/${venueToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete venue')
      }

      if (result.success) {
        toast({
          title: 'Success',
          description: `Venue "${venueToDelete.name}" deleted successfully`,
        })
        setDeleteDialogOpen(false)
        setVenueToDelete(null)
        // Refresh venues list
        await fetchVenues()
      } else {
        throw new Error(result.error || 'Failed to delete venue')
      }
    } catch (err) {
      console.error('Error deleting venue:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete venue'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
    }
  }

  // Use venues directly (no client-side filtering needed - API handles it)
  const filteredVenues = venues

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-500">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Use summary stats from API (for all venues) or calculate from current page
  const totalVenues = summaryStats.total || pagination.totalCount
  const activeVenues = summaryStats.active || venues.filter(v => v.isActive).length
  const totalCourts = summaryStats.totalCourts || venues.reduce((sum, v) => sum + (v.stats?.courts || 0), 0)
  const totalMonthlyRevenue = summaryStats.totalRevenue || venues.reduce((sum, v) => sum + (v.stats?.revenue || 0), 0)

  if (vendorLoading || loading) {
    return (
      <VendorLayout
        title="Venues"
        subtitle="Manage your sports facilities and courts"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout
      title="Venues"
      subtitle="Manage your sports facilities and courts"
    >
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Venue Management</h1>
          <p className="text-muted-foreground">
              Manage your venues and courts
          </p>
        </div>
          <Button asChild>
            <Link href={`/vendor/venues/create`}>
              <Plus className="h-4 w-4 mr-2" />
              Add Venue
            </Link>
              </Button>
      </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVenues}</div>
              <p className="text-xs text-muted-foreground">
                {activeVenues} active
              </p>
          </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCourts}</div>
              <p className="text-xs text-muted-foreground">
                Across all venues
              </p>
          </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalMonthlyRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                From all venues
              </p>
          </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Venues</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeVenues}</div>
              <p className="text-xs text-muted-foreground">
                {totalVenues > 0 ? Math.round((activeVenues / totalVenues) * 100) : 0}% of total
              </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
                    placeholder="Search venues, locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
          />
        </div>
              </div>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
              <Select value={cityFilter} onValueChange={handleCityChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sportFilter} onValueChange={handleSportChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sport Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {sports.map(sport => (
                    <SelectItem key={sport.id} value={sport.id}>{sport.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
      </div>
          </CardContent>
        </Card>

        {/* Venues Table */}
        <Card>
            <CardHeader>
            <CardTitle>All Venues ({filteredVenues.length})</CardTitle>
            <CardDescription>
              Manage venue details, courts, and configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-2">Error loading venues</div>
                <div className="text-sm text-muted-foreground">{error}</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venue</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Sports</TableHead>
                    <TableHead>Courts</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Monthly Revenue</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVenues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {venues.length === 0 ? 'No venues found. Add your first venue to get started.' : 'No venues match your filters.'}
                </div>
                        {venues.length === 0 && (
                          <Button className="mt-4" asChild>
                            <Link href={`/vendor/venues/create`}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Your First Venue
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVenues.map((venue) => (
                      <TableRow 
                        key={venue.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onDoubleClick={() => {
                          window.location.href = `/vendor/venues/${venue.id}`
                        }}
                      >
                        <TableCell>
                <div>
                            <div className="font-medium">{venue.name}</div>
                            {venue.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {venue.description}
                </div>
                            )}
                </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {venue.city || venue.address || 'Not specified'}
                            </span>
                </div>
                        </TableCell>
                        <TableCell>
                <div className="flex flex-wrap gap-1">
                            {venue.sports.length === 0 ? (
                              <span className="text-sm text-muted-foreground">No sports</span>
                            ) : (
                              venue.sports.slice(0, 3).map((sport) => (
                                <Badge key={sport.id} variant="secondary" className="text-xs">
                                  {sport.displayName}
                    </Badge>
                              ))
                            )}
                            {venue.sports.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                                +{venue.sports.length - 3}
                    </Badge>
                  )}
                </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center font-medium">{venue.stats?.courts || 0}</div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(venue.isActive)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(venue.stats?.revenue || 0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="font-medium">{venue.stats?.bookings || 0}</div>
                </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                  </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  window.location.href = `/vendor/venues/${venue.id}`
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  window.location.href = `/vendor/venues/${venue.id}/edit`
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Venue
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteClick(venue)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Venue
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                {pagination.totalCount} venues
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
          )}
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Venue</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{venueToDelete?.name}"? This action cannot be undone.
                {venueToDelete && (
                  <span className="block mt-2 text-sm text-muted-foreground">
                    Note: Venues with active bookings cannot be deleted.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
    </VendorLayout>
  )
}
