'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Search,
  Plus,
  Store,
  MapPin,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  Filter,
  Edit,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'
import { UniversalBreadcrumb } from '@/components/features/admin/UniversalBreadcrumb'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PageProps {
  params: Promise<{ vendorId: string }>
}

interface Venue {
  id: string
  name: string
  description: string
  address: string
  city: string
  postalCode: string
  phone: string
  email: string
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

interface VendorInfo {
  id: string
  name: string
}

export default function VendorVenuesPage({ params }: PageProps) {
  const router = useRouter()
  const [vendorId, setVendorId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [venues, setVenues] = useState<Venue[]>([])
  const [vendor, setVendor] = useState<VendorInfo | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'bookingCount' | 'revenue'>('createdAt')
  const [error, setError] = useState<string | null>(null)

  // Resolve params and fetch data
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setVendorId(resolvedParams.vendorId)
    }
    resolveParams()
  }, [params])

  // Fetch vendor and venues data when vendorId is available
  useEffect(() => {
    if (vendorId) {
      fetchVendorData()
      fetchVenuesData()
    }
  }, [vendorId, searchTerm, statusFilter, sortBy])

  const fetchVendorData = async () => {
    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        setVendor({
          id: result.data.id,
          name: result.data.name
        })
      } else {
        setError('Failed to fetch vendor data')
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error)
      setError('Error fetching vendor data')
    }
  }

  const fetchVenuesData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        sortBy: sortBy,
        sortOrder: 'desc',
        page: '1',
        limit: '50'
      })

      const response = await fetch(`/api/vendors/${vendorId}/venues?${params}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        const venuesData = result.data || []
        // Debug: Log venue IDs to verify they're correct
        console.log('Fetched venues:', venuesData.map((v: Venue) => ({ id: v.id, name: v.name })))
        setVenues(venuesData)
      } else {
        setError('Failed to fetch venues data')
      }
    } catch (error) {
      console.error('Error fetching venues:', error)
      setError('Error fetching venues')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (venueId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/venues`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          venueIds: [venueId],
          updates: { isActive: !currentStatus }
        })
      })

      if (response.ok) {
        fetchVenuesData() // Refresh the data
      } else {
        alert('Failed to update venue status')
      }
    } catch (error) {
      console.error('Error updating venue:', error)
      alert('Error updating venue')
    }
  }

  if (loading && !vendor) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-muted-foreground">Loading vendor information...</div>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="p-6">
        {/* Breadcrumb */}
        <UniversalBreadcrumb />

        <div className="text-center">
          <p className="text-muted-foreground">Vendor not found</p>
        </div>
      </div>
    )
  }

  const activeVenues = venues.filter(v => v.isActive).length
  const totalBookings = venues.reduce((sum, v) => sum + v.stats.bookings, 0)
  const totalRevenue = venues.reduce((sum, v) => sum + v.stats.revenue, 0)
  const totalCourts = venues.reduce((sum, v) => sum + v.stats.courts, 0)

  return (
      <div className="p-6 space-y-6">
          {/* Breadcrumb */}
          <UniversalBreadcrumb />

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Venues Management</h1>
              <p className="text-muted-foreground">Vendor: {vendor.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/admin/vendors/${vendorId}/venues/create`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Venue
                </Button>
              </Link>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{venues.length}</div>
                <p className="text-xs text-muted-foreground">
                  {activeVenues} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBookings}</div>
                <p className="text-xs text-muted-foreground">
                  Across all venues
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  All time revenue
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
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search venues..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="bookingCount">Bookings</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Venues List */}
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Loading venues...</div>
                </div>
              </CardContent>
            </Card>
          ) : venues.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No venues found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your filters or search terms'
                      : 'Get started by creating your first venue'
                    }
                  </p>
                  <Link href={`/admin/vendors/${vendorId}/venues/create`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Venue
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <Card key={venue.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{venue.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant={venue.isActive ? "default" : "secondary"}
                            className={venue.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          >
                            {venue.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {venue.stats.courts} courts
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              window.location.href = `/admin/vendors/${vendorId}/venues/${venue.id}`
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              window.location.href = `/admin/vendors/${vendorId}/venues/${venue.id}/edit`
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Venue
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleStatusToggle(venue.id, venue.isActive)}
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            {venue.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {venue.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {venue.description}
                        </p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">
                            {venue.address || venue.city || 'No location'}
                          </span>
                        </div>

                        {venue.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{venue.phone}</span>
                          </div>
                        )}

                        {venue.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{venue.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Sports */}
                      {venue.sports.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Sports:</p>
                          <div className="flex flex-wrap gap-1">
                            {venue.sports.map((sport) => (
                              <Badge key={sport.id} variant="outline" className="text-xs">
                                {sport.displayName}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                        <div className="text-center">
                          <div className="text-sm font-medium">{venue.stats.bookings}</div>
                          <div className="text-xs text-muted-foreground">Bookings</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">₹{venue.stats.revenue.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">{venue.stats.courts}</div>
                          <div className="text-xs text-muted-foreground">Courts</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
    </div>
  )
}