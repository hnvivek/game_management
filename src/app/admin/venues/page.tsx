'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Plus, Filter, MoreHorizontal, MapPin, Calendar, Users, Eye, Edit, Trash2, Download } from 'lucide-react'
import Link from 'next/link'
import { UniversalBreadcrumb } from '@/components/features/admin/UniversalBreadcrumb'
import { searchVenues } from '@/lib/api/user/venues'

interface Venue {
  id: string
  name: string
  vendorName: string
  vendorId: string
  location: string
  city: string
  status: 'active' | 'inactive' | 'pending'
  sportTypes: string[]
  totalCourts: number
  monthlyRevenue: number
  utilizationRate: number
  averageRating: number
  totalBookings: number
  createdAt: string
  lastUpdated: string
}

interface ApiVenue {
  id: string
  name: string
  description?: string
  address?: string
  city?: string
  postalCode?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  vendor: {
    id: string
    name: string
  }
  courts: Array<{
    id: string
    sport: {
      displayName: string
    }
  }>
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [sportFilter, setSportFilter] = useState<string>('all')
  const [vendorFilter, setVendorFilter] = useState<string>('all')

  // Fetch venues from API
  useEffect(() => {
    const loadVenues = async () => {
      try {
        setLoading(true)
        setError(null)

        const result = await searchVenues()
        const apiVenues: ApiVenue[] = result.venues || []

        // Transform API data to match component structure
        const transformedVenues: Venue[] = apiVenues.map((venue) => {
          // Get unique sport types from courts
          const sportTypes = [...new Set(venue.courts.map(court => court.sport.displayName))]

          return {
            id: venue.id,
            name: venue.name,
            vendorName: venue.vendor.name,
            vendorId: venue.vendor.id,
            location: venue.address || venue.city || 'Not specified',
            city: venue.city || 'Not specified',
            status: venue.isActive ? 'active' : 'inactive',
            sportTypes,
            totalCourts: venue.courts.length,
            monthlyRevenue: 0, // TODO: Calculate from bookings
            utilizationRate: 0, // TODO: Calculate from bookings
            averageRating: 0, // TODO: Calculate from reviews
            totalBookings: 0, // TODO: Calculate from bookings
            createdAt: venue.createdAt,
            lastUpdated: venue.updatedAt
          }
        })

        setVenues(transformedVenues)
      } catch (err) {
        console.error('Error fetching venues:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch venues')
      } finally {
        setLoading(false)
      }
    }

    loadVenues()
  }, [])

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.location.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || venue.status === statusFilter
    const matchesCity = cityFilter === 'all' || venue.city === cityFilter
    const matchesSport = sportFilter === 'all' || venue.sportTypes.includes(sportFilter)
    const matchesVendor = vendorFilter === 'all' || venue.vendorId === vendorFilter

    return matchesSearch && matchesStatus && matchesCity && matchesSport && matchesVendor
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const totalVenues = venues.length
  const activeVenues = venues.filter(v => v.status === 'active').length
  const totalCourts = venues.reduce((sum, v) => sum + v.totalCourts, 0)
  const totalMonthlyRevenue = venues.reduce((sum, v) => sum + v.monthlyRevenue, 0)

  // Get unique vendors for filter
  const vendors = Array.from(new Set(venues.map(v => ({ id: v.vendorId, name: v.vendorName }))))

  // Get unique cities for filter
  const cities = Array.from(new Set(venues.map(v => v.city).filter(Boolean)))

  // Get unique sports for filter
  const sports = Array.from(new Set(venues.flatMap(v => v.sportTypes)))

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <UniversalBreadcrumb />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Venues Management</h2>
          <p className="text-muted-foreground">
            Manage all venues across the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link href="/admin/venues/create">
              <Plus className="h-4 w-4 mr-2" />
              Add Venue
            </Link>
          </Button>
        </div>
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
              +{activeVenues} active this month
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
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Utilization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeVenues > 0
                ? Math.round(venues.filter(v => v.status === 'active').reduce((sum, v) => sum + v.utilizationRate, 0) / activeVenues)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
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
                  placeholder="Search venues, vendors, locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={cityFilter} onValueChange={setCityFilter}>
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
            <Select value={sportFilter} onValueChange={setSportFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sport Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {sports.map(sport => (
                  <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map(vendor => (
                  <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
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
            Manage venue details, settings, and configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading venues...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">Error loading venues</div>
              <div className="text-sm text-muted-foreground">{error}</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venue</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Sports</TableHead>
                  <TableHead>Courts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Monthly Revenue</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVenues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="text-muted-foreground">No venues found</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVenues.map((venue) => (
                <TableRow 
                  key={venue.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onDoubleClick={() => {
                    window.location.href = `/admin/vendors/${venue.vendorId}/venues/${venue.id}`
                  }}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{venue.name}</div>
                      <div className="text-sm text-muted-foreground">ID: {venue.id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {venue.vendorName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{venue.vendorName}</div>
                        <div className="text-sm text-muted-foreground">{venue.vendorId}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>{venue.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {venue.sportTypes.map((sport, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {sport}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">{venue.totalCourts}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(venue.status)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(venue.monthlyRevenue)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium">{venue.utilizationRate}%</div>
                      <div className="text-xs text-muted-foreground">
                        {venue.totalBookings} bookings
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{venue.averageRating.toFixed(1)}</span>
                      <span className="text-yellow-500">★</span>
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
                            window.location.href = `/admin/vendors/${venue.vendorId}/venues/${venue.id}`
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            window.location.href = `/admin/vendors/${venue.vendorId}/venues/${venue.id}/edit`
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Venue
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
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
      </Card>
    </div>
  )
}