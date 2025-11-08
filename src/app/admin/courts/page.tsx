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
import { Search, Plus, Filter, MoreHorizontal, MapPin, Circle, Calendar, Users, Eye, Edit, Trash2, Download, Clock } from 'lucide-react'
import Link from 'next/link'
import { UniversalBreadcrumb } from '@/components/features/admin/UniversalBreadcrumb'

interface Court {
  id: string
  name: string
  venueName: string
  venueId: string
  vendorName: string
  vendorId: string
  sportType: string
  format: string
  status: 'available' | 'maintenance' | 'unavailable'
  capacity: number
  hourlyRate: number
  features: string[]
  utilizationRate: number
  totalBookings: number
  monthlyRevenue: number
  averageRating: number
  createdAt: string
  lastUpdated: string
}

const mockCourts: Court[] = [
  {
    id: 'c1',
    name: 'Court 1',
    venueName: 'GameHub Indiranagar 1',
    venueId: '1',
    vendorName: 'SportsZone Pvt Ltd',
    vendorId: 'v1',
    sportType: 'Badminton',
    format: 'Singles',
    status: 'available',
    capacity: 4,
    hourlyRate: 800,
    features: ['Lighting', 'Air Conditioning', 'Wooden Flooring'],
    utilizationRate: 85,
    totalBookings: 156,
    monthlyRevenue: 48000,
    averageRating: 4.6,
    createdAt: '2024-01-15',
    lastUpdated: '2024-11-05'
  },
  {
    id: 'c2',
    name: 'Court 2',
    venueName: 'GameHub Indiranagar 1',
    venueId: '1',
    vendorName: 'SportsZone Pvt Ltd',
    vendorId: 'v1',
    sportType: 'Badminton',
    format: 'Doubles',
    status: 'available',
    capacity: 8,
    hourlyRate: 1200,
    features: ['Lighting', 'Air Conditioning', 'Wooden Flooring'],
    utilizationRate: 92,
    totalBookings: 189,
    monthlyRevenue: 68000,
    averageRating: 4.8,
    createdAt: '2024-01-15',
    lastUpdated: '2024-11-05'
  },
  {
    id: 'c3',
    name: 'Court 3',
    venueName: 'GameHub Indiranagar 1',
    venueId: '1',
    vendorName: 'SportsZone Pvt Ltd',
    vendorId: 'v1',
    sportType: 'Tennis',
    format: 'Singles',
    status: 'maintenance',
    capacity: 4,
    hourlyRate: 1500,
    features: ['Lighting', 'Clay Surface'],
    utilizationRate: 0,
    totalBookings: 0,
    monthlyRevenue: 0,
    averageRating: 0,
    createdAt: '2024-01-15',
    lastUpdated: '2024-11-06'
  },
  {
    id: 'c4',
    name: 'Court 1',
    venueName: 'Elite Sports Complex',
    venueId: '2',
    vendorName: 'Premium Sports Management',
    vendorId: 'v2',
    sportType: 'Squash',
    format: 'Singles',
    status: 'available',
    capacity: 2,
    hourlyRate: 1000,
    features: ['Glass Back Wall', 'Lighting', 'Air Conditioning'],
    utilizationRate: 78,
    totalBookings: 98,
    monthlyRevenue: 35000,
    averageRating: 4.4,
    createdAt: '2024-02-20',
    lastUpdated: '2024-11-04'
  }
]

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>(mockCourts)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sportFilter, setSportFilter] = useState<string>('all')
  const [vendorFilter, setVendorFilter] = useState<string>('all')

  const filteredCourts = courts.filter(court => {
    const matchesSearch = court.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         court.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         court.vendorName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || court.status === statusFilter
    const matchesSport = sportFilter === 'all' || court.sportType === sportFilter
    const matchesVendor = vendorFilter === 'all' || court.vendorId === vendorFilter

    return matchesSearch && matchesStatus && matchesSport && matchesVendor
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500">Available</Badge>
      case 'maintenance':
        return <Badge variant="outline">Maintenance</Badge>
      case 'unavailable':
        return <Badge variant="destructive">Unavailable</Badge>
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

  const totalCourts = courts.length
  const availableCourts = courts.filter(c => c.status === 'available').length
  const maintenanceCourts = courts.filter(c => c.status === 'maintenance').length
  const totalMonthlyRevenue = courts.reduce((sum, c) => sum + c.monthlyRevenue, 0)
  const avgUtilization = courts.filter(c => c.status === 'available').reduce((sum, c) => sum + c.utilizationRate, 0) / availableCourts || 0

  const vendors = Array.from(new Set(courts.map(c => ({ id: c.vendorId, name: c.vendorName }))))
  const sports = Array.from(new Set(courts.map(c => c.sportType)))

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <UniversalBreadcrumb />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Courts Management</h2>
          <p className="text-muted-foreground">
            Manage all courts across all venues and vendors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link href="/admin/courts/create">
              <Plus className="h-4 w-4 mr-2" />
              Add Court
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courts</CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableCourts}</div>
            <p className="text-xs text-muted-foreground">
              Ready for booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{maintenanceCourts}</div>
            <p className="text-xs text-muted-foreground">
              Under maintenance
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
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Utilization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgUtilization)}%</div>
            <p className="text-xs text-muted-foreground">
              Of available courts
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
                  placeholder="Search courts, venues, vendors..."
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
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
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

      {/* Courts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Courts ({filteredCourts.length})</CardTitle>
          <CardDescription>
            Manage court details, pricing, and configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Court</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hourly Rate</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Monthly Revenue</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourts.map((court) => (
                <TableRow key={court.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{court.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {court.format} • {court.features.slice(0, 2).join(', ')}
                        {court.features.length > 2 && '...'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>{court.venueName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {court.vendorName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{court.vendorName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{court.sportType}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">{court.capacity}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(court.status)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(court.hourlyRate)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium">{court.utilizationRate}%</div>
                      <div className="text-xs text-muted-foreground">
                        {court.totalBookings} bookings
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(court.monthlyRevenue)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{court.averageRating.toFixed(1)}</span>
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
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/vendors/${court.vendorId}/venues/${court.venueId}/courts/${court.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/vendors/${court.vendorId}/venues/${court.venueId}/courts/${court.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Court
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/vendors/${court.vendorId}/venues/${court.venueId}/courts/${court.id}/schedule`}>
                            <Calendar className="h-4 w-4 mr-2" />
                            View Schedule
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Court
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}