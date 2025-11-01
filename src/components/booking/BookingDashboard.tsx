'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, DollarSign, TrendingUp, Filter, RefreshCw, Search, MoreHorizontal, Eye, Edit, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Types based on our API schema
interface Booking {
  id: string
  type: 'DIRECT' | 'MATCH' | 'TOURNAMENT'
  title: string
  description?: string
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  startTime: string
  endTime: string
  duration: number
  totalAmount: number
  maxPlayers?: number
  notes?: string
  court: {
    id: string
    name: string
    sport: {
      id: string
      name: string
      displayName: string
      icon: string
    }
    venue: {
      id: string
      name: string
      address: string
      city: string
      vendor: {
        id: string
        name: string
        slug: string
        primaryColor: string
      }
    }
  }
  user: {
    id: string
    name: string
    email: string
    phone: string
  }
  payments: Array<{
    id: string
    amount: number
    currency: string
    status: string
    paymentMethod: string
    processedAt?: string
  }>
}

interface BookingStats {
  totalBookings: number
  totalRevenue: number
  confirmedBookings: number
  pendingPayments: number
  upcomingBookings: number
  cancelledBookings: number
}

interface BookingDashboardProps {
  userId?: string
  vendorId?: string
  dateRange?: { start: string; end: string }
}

export default function BookingDashboard({ userId, vendorId, dateRange }: BookingDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    totalRevenue: 0,
    confirmedBookings: 0,
    pendingPayments: 0,
    upcomingBookings: 0,
    cancelledBookings: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('upcoming')

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sportFilter, setSportFilter] = useState('')

  useEffect(() => {
    fetchBookings()
  }, [userId, vendorId, dateRange, statusFilter, typeFilter, sportFilter])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        ...(userId && { userId }),
        ...(vendorId && { vendorId }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { bookingType: typeFilter }),
        ...(sportFilter && { sport: sportFilter }),
        ...(searchTerm && { search: searchTerm }),
        limit: '50'
      })

      // Add date range if provided
      if (dateRange?.start) {
        params.append('startDate', dateRange.start)
      }
      if (dateRange?.end) {
        params.append('endDate', dateRange.end)
      }

      const response = await fetch(`/api/bookings?${params}`)
      if (!response.ok) throw new Error('Failed to fetch bookings')

      const data = await response.json()
      setBookings(data.bookings || [])

      // Calculate stats
      const bookingStats = data.bookings?.reduce((acc: BookingStats, booking: Booking) => {
        acc.totalBookings++
        acc.totalRevenue += booking.totalAmount

        switch (booking.status) {
          case 'CONFIRMED':
            acc.confirmedBookings++
            if (new Date(booking.startTime) > new Date()) {
              acc.upcomingBookings++
            }
            break
          case 'PENDING_PAYMENT':
            acc.pendingPayments++
            break
          case 'CANCELLED':
            acc.cancelledBookings++
            break
        }

        return acc
      }, {
        totalBookings: 0,
        totalRevenue: 0,
        confirmedBookings: 0,
        pendingPayments: 0,
        upcomingBookings: 0,
        cancelledBookings: 0
      })

      setStats(bookingStats)

    } catch (error) {
      console.error('Error fetching bookings:', error)
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-success/20 text-success-foreground border-success/20'
      case 'PENDING_PAYMENT': return 'bg-warning/20 text-yellow-800 border-yellow-200'
      case 'CANCELLED': return 'bg-destructive/20 text-destructive-foreground border-destructive/20'
      case 'COMPLETED': return 'bg-primary/20 text-primary-foreground border-primary/20'
      default: return 'bg-muted text-foreground border-border'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT': return 'Pending Payment'
      case 'CONFIRMED': return 'Confirmed'
      case 'CANCELLED': return 'Cancelled'
      case 'COMPLETED': return 'Completed'
      default: return status
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DIRECT': return 'bg-primary/20 text-primary-foreground'
      case 'MATCH': return 'bg-success/20 text-success-foreground'
      case 'TOURNAMENT': return 'bg-warning/20 text-purple-800'
      default: return 'bg-muted text-foreground'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'DIRECT': return 'Simple Booking'
      case 'MATCH': return 'Match'
      case 'TOURNAMENT': return 'Tournament'
      default: return type
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredBookings = bookings.filter(booking => {
    const now = new Date()
    const bookingDate = new Date(booking.startTime)

    switch (activeTab) {
      case 'upcoming':
        return bookingDate > now && booking.status === 'CONFIRMED'
      case 'past':
        return bookingDate < now
      case 'pending':
        return booking.status === 'PENDING_PAYMENT'
      case 'cancelled':
        return booking.status === 'CANCELLED'
      default:
        return true
    }
  })

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="shadow-sm border-0 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-foreground">{stats.totalBookings}</p>
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+0% vs last period</span>
              </div>
            </div>
            <div className="h-14 w-14 bg-primary/20 rounded-xl flex items-center justify-center ml-4">
              <Calendar className="h-7 w-7 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-0 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-foreground">{formatPrice(stats.totalRevenue)}</p>
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+0% vs last period</span>
              </div>
            </div>
            <div className="h-14 w-14 bg-success/20 rounded-xl flex items-center justify-center ml-4">
              <DollarSign className="h-7 w-7 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-0 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Confirmed</p>
              <p className="text-3xl font-bold text-foreground">{stats.confirmedBookings}</p>
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>{stats.totalBookings > 0 ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100) : 0}% conversion rate</span>
              </div>
            </div>
            <div className="h-14 w-14 bg-emerald-100 rounded-xl flex items-center justify-center ml-4">
              <Users className="h-7 w-7 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-0 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Pending</p>
              <p className="text-3xl font-bold text-foreground">{stats.pendingPayments}</p>
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                <span>Need action</span>
              </div>
            </div>
            <div className="h-14 w-14 bg-warning/20 rounded-xl flex items-center justify-center ml-4">
              <AlertCircle className="h-7 w-7 text-warning" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderFilters = () => (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PENDING_PAYMENT">Pending Payment</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="DIRECT">Simple Booking</SelectItem>
                <SelectItem value="MATCH">Match</SelectItem>
                <SelectItem value="TOURNAMENT">Tournament</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sport</Label>
            <Input
              placeholder="Filter by sport"
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={fetchBookings}>
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('')
              setTypeFilter('')
              setSportFilter('')
            }}
          >
            Clear Filters
          </Button>
          <Button variant="outline" size="sm" onClick={fetchBookings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderBookingsTable = () => (
    <Card>
      <CardHeader>
        <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
        <CardDescription>
          Manage and track all your bookings
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Court & Venue</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.title}</div>
                        {booking.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {booking.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          ID: {booking.id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.court.name}</div>
                        <div className="text-sm text-muted-foreground">{booking.court.venue.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <span>{booking.court.sport.icon}</span>
                          {booking.court.sport.displayName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{formatDateTime(booking.startTime)}</div>
                        <div className="text-sm text-muted-foreground">{booking.duration} hours</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(booking.type)}>
                        {getTypeText(booking.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusText(booking.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatPrice(booking.totalAmount)}</div>
                      {booking.payments.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {booking.payments[0].status === 'COMPLETED' ? 'Paid' : 'Pending'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Booking
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Cancel Booking
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-foreground mb-3">
              {searchTerm || statusFilter || typeFilter || sportFilter
                ? 'No bookings match your criteria'
                : 'No bookings yet'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchTerm || statusFilter || typeFilter || sportFilter
                ? 'Try adjusting your filters or search terms to find bookings.'
                : 'Start by creating your first venue booking to see your dashboard come to life with booking analytics and management tools.'}
            </p>

            {searchTerm || statusFilter || typeFilter || sportFilter ? (
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('')
                    setTypeFilter('')
                    setSportFilter('')
                  }}
                >
                  Clear All Filters
                </Button>
                <Button onClick={fetchBookings}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            ) : (
              <div className="flex justify-center gap-3">
                <Button asChild>
                  <a href="/book-venue">
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Your First Booking
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/venues">
                    Browse Venues
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-destructive/20 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive-foreground">{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {renderStats()}

      {/* Filters */}
      {renderFilters()}

      {/* Bookings Table with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">
            Upcoming ({stats.upcomingBookings})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({stats.pendingPayments})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({stats.cancelledBookings})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {renderBookingsTable()}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {renderBookingsTable()}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {renderBookingsTable()}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          {renderBookingsTable()}
        </TabsContent>
      </Tabs>
    </div>
  )
}