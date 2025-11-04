'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, MapPin, CreditCard, AlertCircle, ChevronRight, RefreshCw, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Navbar from '@/components/navbar'

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
  payments: Array<{
    id: string
    amount: number
    currency: string
    status: string
    paymentMethod: string
    processedAt?: string
  }>
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    fetchMyBookings()
  }, [])

  const fetchMyBookings = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/bookings?limit=50')
      if (!response.ok) throw new Error('Failed to fetch bookings')

      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setError('Failed to load your bookings')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'PENDING_PAYMENT': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT': return 'Payment Pending'
      case 'CONFIRMED': return 'Confirmed'
      case 'CANCELLED': return 'Cancelled'
      case 'COMPLETED': return 'Completed'
      default: return status
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DIRECT': return '🎯'
      case 'MATCH': return '⚔️'
      case 'TOURNAMENT': return '🏆'
      default: return '📅'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isToday = (dateTime: string) => {
    const today = new Date()
    const bookingDate = new Date(dateTime)
    return today.toDateString() === bookingDate.toDateString()
  }

  const isPast = (dateTime: string) => {
    return new Date(dateTime) < new Date()
  }

  const filteredBookings = bookings.filter(booking => {
    const now = new Date()
    const bookingDate = new Date(booking.startTime)

    switch (activeTab) {
      case 'upcoming':
        return bookingDate > now && booking.status === 'CONFIRMED'
      case 'today':
        return isToday(booking.startTime) && booking.status !== 'CANCELLED'
      case 'past':
        return isPast(booking.startTime) || booking.status === 'COMPLETED'
      case 'pending':
        return booking.status === 'PENDING_PAYMENT'
      default:
        return true
    }
  })

  const renderBookingCard = (booking: Booking) => {
    const bookingDate = new Date(booking.startTime)
    const isPastBooking = isPast(booking.startTime)

    return (
      <Card key={booking.id} className="hover:shadow-md transition-all duration-200 border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Left Section - Date & Time */}
            <div className={`sm:w-32 p-4 ${isPastBooking ? 'bg-gray-50' : 'bg-primary/5'} border-b sm:border-b-0 sm:border-r`}>
              <div className="text-center sm:text-left">
                <div className="text-2xl font-bold text-foreground">
                  {bookingDate.getDate()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {bookingDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center sm:justify-start gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(booking.startTime)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {booking.duration}h
                </div>
              </div>
            </div>

            {/* Middle Section - Booking Details */}
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getTypeIcon(booking.type)}</span>
                    <h3 className="font-semibold text-foreground line-clamp-1">
                      {booking.title || `${booking.court.sport.displayName} Booking`}
                    </h3>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>{booking.court.sport.icon}</span>
                      <span>{booking.court.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{booking.court.venue.name}, {booking.court.venue.city}</span>
                    </div>
                    {booking.description && (
                      <p className="line-clamp-2 text-xs">{booking.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <Badge className={`text-xs ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </Badge>
                    {booking.maxPlayers && (
                      <span className="text-xs text-muted-foreground">
                        Up to {booking.maxPlayers} players
                      </span>
                    )}
                  </div>
                </div>

                <div className="ml-4 text-right">
                  <div className="text-lg font-bold text-foreground">
                    {formatPrice(booking.totalAmount)}
                  </div>
                  {booking.payments.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {booking.payments[0].status === 'COMPLETED' ? 'Paid' : 'Payment pending'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="sm:w-20 p-4 border-l flex items-center justify-center">
              <Button variant="ghost" size="sm" className="h-full w-full sm:w-auto">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderEmptyState = (type: string) => {
    const emptyStates = {
      upcoming: {
        icon: Calendar,
        title: 'No upcoming bookings',
        description: 'You don\'t have any confirmed bookings coming up.',
        action: 'Book a Venue',
        actionHref: '/book-venue'
      },
      today: {
        icon: Clock,
        title: 'No bookings today',
        description: 'You don\'t have any bookings scheduled for today.',
        action: 'Book for Today',
        actionHref: '/book-venue'
      },
      past: {
        icon: Clock,
        title: 'No past bookings',
        description: 'You haven\'t completed any bookings yet.',
        action: 'Book Your First Venue',
        actionHref: '/book-venue'
      },
      pending: {
        icon: CreditCard,
        title: 'No pending payments',
        description: 'You don\'t have any bookings waiting for payment.',
        action: 'Book a Venue',
        actionHref: '/book-venue'
      }
    }

    const state = emptyStates[type as keyof typeof emptyStates]
    const Icon = state.icon

    return (
      <div className="text-center py-12">
        <Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {state.title}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          {state.description}
        </p>
        <Button asChild>
          <Link href={state.actionHref}>
            {state.action}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Bookings</h1>
              <p className="text-muted-foreground">
                Track and manage your venue bookings
              </p>
            </div>
            <Button variant="outline" onClick={fetchMyBookings} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded-full"></div>
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded-full"></div>
              <span>Payment Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded-full"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded-full"></div>
              <span>Cancelled</span>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-16 w-16 rounded" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredBookings.length > 0 ? (
              filteredBookings.map(renderBookingCard)
            ) : (
              renderEmptyState('upcoming')
            )}
          </TabsContent>

          <TabsContent value="today" className="space-y-4">
            {filteredBookings.length > 0 ? (
              filteredBookings.map(renderBookingCard)
            ) : (
              renderEmptyState('today')
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {filteredBookings.length > 0 ? (
              filteredBookings.map(renderBookingCard)
            ) : (
              renderEmptyState('past')
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {filteredBookings.length > 0 ? (
              filteredBookings.map(renderBookingCard)
            ) : (
              renderEmptyState('pending')
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        {bookings.length > 0 && (
          <div className="mt-8 pt-8 border-t">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-4">Need to book more venues?</h3>
              <div className="flex justify-center gap-3">
                <Button asChild>
                  <Link href="/book-venue">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book New Venue
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/venues">
                    Browse All Venues
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}