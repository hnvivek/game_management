'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Clock,
  Star,
  MapPin,
  Activity,
  Bell,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MoreHorizontal,
  Settings
} from 'lucide-react'
import { RevenueChart } from './RevenueChart'
import { BookingCalendar } from './BookingCalendar'
import { useVendor } from '@/hooks/use-vendor'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface Stats {
  revenue: {
    total: number
    monthly: number
    weekly: number
    daily: number
    growth: number
  }
  bookings: {
    total: number
    recent: number
    confirmed: number
    completed: number
    cancelled: number
    growth: number
  }
  venues: {
    total: number
    active: number
    inactive: number
  }
  performance: {
    occupancyRate: number
    confirmedRate: number
    completionRate: number
    averageBookingValue: number
  }
}



interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease'
  icon: React.ReactNode
  description?: string
  trend?: 'up' | 'down' | 'neutral'
}

function KPICard({ title, value, change, changeType, icon, description, trend }: KPICardProps) {
  const isPositive = changeType === 'increase'

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3 text-green-500" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            )}
            <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
              {isPositive ? '+' : ''}{change}%
            </span>
            <span>{description}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function VendorDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const { vendorId, isLoading: vendorLoading } = useVendor()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!vendorId) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch stats
        const statsResponse = await fetch(`/api/vendors/${vendorId}/stats`, {
          credentials: 'include'
        })
        if (!statsResponse.ok) throw new Error('Failed to fetch stats')
        const statsData = await statsResponse.json()
        setStats(statsData.data)

        // Fetch recent bookings
        const bookingsResponse = await fetch(
          `/api/vendors/${vendorId}/bookings?limit=5&sortBy=createdAt&sortOrder=desc`,
          { credentials: 'include' }
        )
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json()
          setRecentBookings(bookingsData.data?.slice(0, 5) || [])
        }

        // Fetch venues
        const venuesResponse = await fetch(
          `/api/vendors/${vendorId}/venues?limit=10`,
          { credentials: 'include' }
        )
        if (venuesResponse.ok) {
          const venuesData = await venuesResponse.json()
          setVenues(venuesData.data || [])
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
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

  if (error || !stats) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          {error || 'Failed to load dashboard data'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your venues today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value={`$${stats.revenue.total.toLocaleString()}`}
          change={stats.revenue.growth}
          changeType={stats.revenue.growth >= 0 ? 'increase' : 'decrease'}
          icon={<DollarSign className="h-4 w-4" />}
          description="from last month"
        />
        <KPICard
          title="Total Bookings"
          value={stats.bookings.total}
          change={stats.bookings.growth}
          changeType={stats.bookings.growth >= 0 ? 'increase' : 'decrease'}
          icon={<Calendar className="h-4 w-4" />}
          description="all time"
        />
        <KPICard
          title="Active Venues"
          value={stats.venues.active}
          change={undefined}
          changeType="increase"
          icon={<MapPin className="h-4 w-4" />}
          description={`of ${stats.venues.total} total`}
        />
        <KPICard
          title="Occupancy Rate"
          value={`${stats.performance.occupancyRate.toFixed(1)}%`}
          change={undefined}
          changeType="increase"
          icon={<Activity className="h-4 w-4" />}
          description="average utilization"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Revenue Overview</span>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RevenueChart />
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Schedule
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Customers
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <DollarSign className="h-4 w-4 mr-2" />
                    View Revenue
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Venue Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Venue Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Venue Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {venues.slice(0, 3).map((venue) => (
                      <div key={venue.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            venue.isActive ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></div>
                          <span className="text-sm">{venue.name}</span>
                        </div>
                        <Badge variant={venue.isActive ? 'default' : 'secondary'}>
                          {venue.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                    {venues.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No venues found
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => window.location.href = '/vendor/venues'}>
                    View All Venues
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Bookings</span>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No recent bookings
                  </div>
                ) : (
                  recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{booking.user?.name || 'Unknown Customer'}</div>
                          <div className="text-sm text-muted-foreground">{booking.venue?.name || 'Unknown Venue'}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(booking.startTime).toLocaleDateString()} • {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${Number(booking.totalAmount).toFixed(2)}</div>
                        <div className="flex items-center gap-1 text-xs">
                          <Badge
                            variant={booking.status === 'CONFIRMED' || booking.status === 'COMPLETED' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <BookingCalendar />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Occupancy Rate</span>
                    <span className="text-sm text-muted-foreground">{stats.performance.occupancyRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.performance.occupancyRate} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Confirmation Rate</span>
                    <span className="text-sm text-muted-foreground">{stats.performance.confirmedRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.performance.confirmedRate} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm text-muted-foreground">{stats.performance.completionRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.performance.completionRate} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Avg Booking Value</span>
                    <span className="text-sm text-muted-foreground">${stats.performance.averageBookingValue.toFixed(2)}</span>
                  </div>
                  <Progress value={Math.min((stats.performance.averageBookingValue / 200) * 100, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Top Venues */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Venues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {venues.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      No venues found
                    </div>
                  ) : (
                    venues.slice(0, 4).map((venue) => (
                      <div key={venue.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{venue.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {venue.stats?.bookings || 0} bookings • {venue.stats?.courts || 0} courts
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={venue.isActive ? 'default' : 'secondary'}>
                            {venue.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings.filter(b => b.status === 'PENDING').length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No pending bookings
                  </div>
                ) : (
                  recentBookings.filter(b => b.status === 'PENDING').map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <div>
                          <div className="font-medium">{booking.user?.name || 'Unknown Customer'}</div>
                          <div className="text-sm text-muted-foreground">
                            {booking.venue?.name} • {new Date(booking.startTime).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {booking.status}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => window.location.href = '/vendor/bookings'}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
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