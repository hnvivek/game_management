'use client'

import { useState, useEffect } from 'react'
import { useVendor } from '@/hooks/use-vendor'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react'

const timeSlots = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'
]


export function BookingCalendar() {
  const { vendorId, isLoading: vendorLoading } = useVendor()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedVenue, setSelectedVenue] = useState('all')
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week')
  const [searchTerm, setSearchTerm] = useState('')
  const [bookings, setBookings] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!vendorId) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch bookings
        const bookingsResponse = await fetch(
          `/api/vendors/${vendorId}/bookings?limit=100&sortBy=startTime&sortOrder=asc`,
          { credentials: 'include' }
        )
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json()
          setBookings(bookingsData.data || [])
        }

        // Fetch venues
        const venuesResponse = await fetch(
          `/api/vendors/${vendorId}/venues?limit=100`,
          { credentials: 'include' }
        )
        if (venuesResponse.ok) {
          const venuesData = await venuesResponse.json()
          setVenues(venuesData.data || [])
        }
      } catch (err) {
        console.error('Error fetching booking data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [vendorId])

  if (vendorLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">{error}</div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
      case 'NO_SHOW':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return <CheckCircle className="h-3 w-3" />
      case 'PENDING':
        return <AlertCircle className="h-3 w-3" />
      case 'CANCELLED':
      case 'NO_SHOW':
        return <XCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const customerName = booking.user?.name || ''
    const venueName = booking.venue?.name || ''
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venueName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesVenue = selectedVenue === 'all' || booking.venueId === selectedVenue
    return matchesSearch && matchesVenue
  })

  const renderCalendarGrid = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const currentWeek = []
    const startOfWeek = new Date(selectedDate)
    const day = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - day)

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      currentWeek.push(date)
    }

    return (
      <div className="space-y-4">
        {/* Week Header */}
        <div className="grid grid-cols-8 gap-2">
          <div className="text-sm font-medium text-muted-foreground">Time</div>
          {currentWeek.map((date, index) => (
            <div key={index} className="text-center">
              <div className="text-xs text-muted-foreground">{days[index]}</div>
              <div className={`text-sm font-medium ${
                date.toDateString() === new Date().toDateString() ? 'text-primary' : ''
              }`}>
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="space-y-2">
          {timeSlots.slice(6, 20).map((time, timeIndex) => (
            <div key={time} className="grid grid-cols-8 gap-2">
              <div className="text-xs text-muted-foreground py-2">{time}</div>
              {currentWeek.map((date, dayIndex) => {
                const dateStr = date.toISOString().split('T')[0]
                const timeSlotBookings = filteredBookings.filter(booking => {
                  const bookingDate = new Date(booking.startTime).toISOString().split('T')[0]
                  if (bookingDate === dateStr) {
                    const bookingHour = new Date(booking.startTime).getHours()
                    const slotHour = parseInt(time.split(':')[0]) + (time.includes('PM') && parseInt(time.split(':')[0]) !== 12 ? 12 : 0) - (time.includes('AM') && parseInt(time.split(':')[0]) === 12 ? 12 : 0)
                    return bookingHour === slotHour
                  }
                  return false
                })

                return (
                  <div
                    key={dayIndex}
                    className={`border rounded p-1 min-h-[60px] ${
                      date.toDateString() === new Date().toDateString() ? 'bg-primary/5' : ''
                    }`}
                  >
                    {timeSlotBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className={`text-xs p-1 rounded mb-1 cursor-pointer hover:opacity-80 ${getStatusColor(booking.status)}`}
                      >
                        <div className="font-medium truncate">{booking.user?.name || 'Unknown'}</div>
                        <div className="truncate">{booking.venue?.name?.split(' ')[0] || 'Venue'}</div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <Button variant="outline" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={viewType} onValueChange={(value) => setViewType(value as any)}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedVenue} onValueChange={setSelectedVenue}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by venue" />
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
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          {/* Venue Status */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {venues.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-4">
                No venues found
              </div>
            ) : (
              venues.map((venue) => (
                <Card key={venue.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">{venue.name}</div>
                      <div className={`w-2 h-2 rounded-full ${
                        venue.isActive ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                    </div>
                    <div className="text-xs text-muted-foreground">{venue.stats?.courts || 0} courts</div>
                    <Badge variant={venue.isActive ? 'default' : 'secondary'} className="text-xs mt-2">
                      {venue.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Calendar Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {renderCalendarGrid()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bookings List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredBookings.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No bookings found
                  </div>
                ) : (
                  filteredBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{booking.user?.name || 'Unknown Customer'}</div>
                          <div className="text-sm text-muted-foreground">{booking.venue?.name || 'Unknown Venue'}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(booking.startTime).toLocaleString()} - {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {booking.notes && (
                            <div className="text-xs text-muted-foreground mt-1">{booking.notes}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-medium">${Number(booking.totalAmount).toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">{new Date(booking.startTime).toLocaleDateString()}</div>
                        </div>
                        <Badge variant="outline" className={getStatusColor(booking.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(booking.status)}
                            <span className="capitalize">{booking.status}</span>
                          </div>
                        </Badge>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}