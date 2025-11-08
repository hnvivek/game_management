'use client'

import { BookingDataTable } from '@/components/features/admin/BookingDataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, TrendingUp, Clock, CheckCircle, AlertCircle, DollarSign, Filter, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { UniversalBreadcrumb } from '@/components/features/admin/UniversalBreadcrumb'
import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchAdminBookingStats } from '@/lib/api/admin/bookings'

interface BookingStats {
  total: number
  today: number
  thisWeek: number
  thisMonth: number
  confirmed: number
  pending: number
  cancelled: number
  completed: number
  revenue: number
  avgBookingValue: number
  growth: number
}

export default function BookingsPage() {
  const [bookingStats, setBookingStats] = useState<BookingStats>({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    completed: 0,
    revenue: 0,
    avgBookingValue: 0,
    growth: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBookingStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const stats = await fetchAdminBookingStats()
      setBookingStats(stats)
    } catch (err) {
      console.error('Error fetching booking stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load booking stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookingStats()
  }, [])
  return (
    <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <UniversalBreadcrumb />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{bookingStats.total.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {bookingStats.growth > 0 ? `+${bookingStats.growth}%` : ''} this month
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{bookingStats.today}</div>
                  <p className="text-xs text-muted-foreground">
                    {bookingStats.thisWeek} this week
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">${(bookingStats.revenue / 1000).toFixed(1)}K</div>
                  <p className="text-xs text-muted-foreground">
                    ${bookingStats.avgBookingValue.toFixed(2)} avg value
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {bookingStats.total > 0 
                      ? ((bookingStats.confirmed / bookingStats.total) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Confirmed bookings
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">Confirmed</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-green-900">{bookingStats.confirmed}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-800">Pending</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-yellow-900">{bookingStats.pending}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Completed</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-blue-900">{bookingStats.completed}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800">Cancelled</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-red-900">{bookingStats.cancelled}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Booking Directory</h2>
            <p className="text-sm text-muted-foreground">
              Manage all platform bookings and their status
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Advanced Filters
            </Button>
            <Link href="/admin/bookings/calendar">
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Calendar View
              </Button>
            </Link>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Booking
            </Button>
          </div>
        </div>

        {/* Booking Table */}
        <BookingDataTable />

        {/* Recent Activity & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 1, action: 'New booking', user: 'John Doe', details: 'Soccer field at Sports Complex LLC', time: '2 minutes ago', status: 'success' },
                  { id: 2, action: 'Booking confirmed', user: 'Sarah Johnson', details: 'Basketball court A at City Recreation', time: '15 minutes ago', status: 'success' },
                  { id: 3, action: 'Payment received', user: 'Mike Chen', details: 'Tennis court booking for $60', time: '1 hour ago', status: 'success' },
                  { id: 4, action: 'Booking cancelled', user: 'Emily Wilson', details: 'Volleyball tournament booking', time: '2 hours ago', status: 'warning' },
                  { id: 5, action: 'Booking modified', user: 'David Brown', details: 'Changed time slot for football field', time: '3 hours ago', status: 'info' }
                ].map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-yellow-500' :
                      activity.status === 'error' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Booking Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Peak booking hours</span>
                  <Badge variant="secondary">6:00 PM - 8:00 PM</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Most popular sport</span>
                  <Badge variant="secondary">Soccer</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average duration</span>
                  <Badge variant="secondary">2 hours</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Popular location</span>
                  <Badge variant="secondary">New York, NY</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Recurring bookings</span>
                  <Badge variant="secondary">23%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}