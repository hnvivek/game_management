'use client'

import { VendorLayout } from '@/components/features/vendor/VendorLayout'
import { VendorBreadcrumb } from '@/components/features/vendor/VendorBreadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, TrendingUp, Clock, DollarSign, BarChart3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useVendor } from '@/hooks/use-vendor'
import { theme } from '@/styles/theme/tokens'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

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

interface RecentActivity {
  id: string
  type: string
  title: string
  description: string
  time: string
  status: 'success' | 'warning' | 'info' | 'error'
}

interface BookingInsights {
  peakHours: string
  averageDuration: string
  conversionRate: number
}

export default function VendorDashboard() {
  const { vendorId } = useVendor()
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
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [insights, setInsights] = useState<BookingInsights>({
    peakHours: 'N/A',
    averageDuration: 'N/A',
    conversionRate: 0
  })
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [currencySymbol, setCurrencySymbol] = useState<string>('₹')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBookingStats = async () => {
    if (!vendorId) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Single API call for all dashboard data
      const dashboardResponse = await fetch(`/api/vendors/${vendorId}/dashboard`, {
        credentials: 'include'
      })
      
      if (!dashboardResponse.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const dashboardData = await dashboardResponse.json()
      
      if (!dashboardData.success || !dashboardData.data) {
        throw new Error('Invalid response format')
      }

      const data = dashboardData.data

      // Set currency symbol
      const currencyCode = data.vendor?.currencyCode || 'INR'
      const currencyMap: Record<string, string> = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£'
      }
      setCurrencySymbol(currencyMap[currencyCode] || currencyCode)

      // Set booking stats
      setBookingStats(data.stats)

      // Set recent activity
      setRecentActivity(data.recentActivity || [])

      // Set insights
      setInsights(data.insights || {
        peakHours: 'N/A',
        averageDuration: 'N/A',
        conversionRate: 0
      })

      // Set analytics data for charts (already formatted correctly from API)
      setAnalyticsData({
        bookings: {
          byPeriod: data.charts.weeklyBookings
        },
        revenue: {
          byPeriod: data.charts.revenueTrend
        }
      })
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookingStats()
  }, [vendorId])

  if (!vendorId) {
    return (
      <VendorLayout title="Dashboard" subtitle="Welcome back! Here's what's happening with your venues today.">
        <div className="p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </VendorLayout>
    )
  }

  // Chart color palette from theme (optimized for data visualization)
  // Uses centralized theme colors for consistency across the application
  const chartColors = {
    // Primary chart colors (brand identity)
    primary: theme.colors.charts.primary,
    primaryLight: theme.colors.charts.primaryLight,
    
    // Secondary chart colors
    secondary: theme.colors.charts.secondary,
    secondaryLight: theme.colors.charts.secondaryLight,
    
    // Status colors (semantic meaning - colorblind-friendly)
    confirmed: theme.colors.charts.confirmed,
    pending: theme.colors.charts.pending,
    completed: theme.colors.charts.completed,
    cancelled: theme.colors.charts.cancelled,
    
    // Metric-specific colors
    bookings: theme.colors.charts.bookings,
    revenue: theme.colors.charts.revenue,
    
    // Categorical palette for multi-series charts
    categorical: theme.colors.charts.categorical,
    
    // Activity status colors
    activity: theme.colors.charts.activity
  }

  // Prepare chart data using standardized theme colors
  const statusChartData = [
    { name: 'Confirmed', value: bookingStats.confirmed, color: chartColors.confirmed },
    { name: 'Pending', value: bookingStats.pending, color: chartColors.pending },
    { name: 'Completed', value: bookingStats.completed, color: chartColors.completed },
    { name: 'Cancelled', value: bookingStats.cancelled, color: chartColors.cancelled }
  ].filter(item => item.value > 0)

  // Weekly bookings data (last 7 days) - already formatted from API
  const weeklyBookingsData = analyticsData?.bookings?.byPeriod || []
  
  // Revenue trend data - already formatted from API
  const revenueTrendData = analyticsData?.revenue?.byPeriod || []

  return (
    <VendorLayout
      title="Dashboard"
      subtitle="Comprehensive overview of your bookings, revenue, and performance metrics"
    >
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <VendorBreadcrumb />
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
                  {bookingStats.growth > 0 ? `+${bookingStats.growth.toFixed(1)}%` : ''} this month
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
                <div className="text-2xl font-bold">{currencySymbol}{(bookingStats.revenue / 1000).toFixed(1)}K</div>
                <p className="text-xs text-muted-foreground">
                  {currencySymbol}{bookingStats.avgBookingValue.toFixed(2)} avg value
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Booking Trends (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : weeklyBookingsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyBookingsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill={chartColors.bookings} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No booking data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : revenueTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${currencySymbol}${Number(value).toLocaleString()}`, 'Revenue']} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={chartColors.revenue}
                    strokeWidth={2}
                    dot={{ fill: chartColors.revenue }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown Chart */}
      {statusChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Booking Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[250px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill={chartColors.primary}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col justify-center space-y-3">
                  {statusChartData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div
                        className="w-2 h-2 rounded-full mt-2"
                        style={{
                          backgroundColor: chartColors.activity[activity.status] || chartColors.activity.info
                        }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Peak booking hours</span>
                    <Badge variant="secondary">{insights.peakHours}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average duration</span>
                    <Badge variant="secondary">{insights.averageDuration}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Conversion rate</span>
                    <Badge variant="secondary">
                      {insights.conversionRate.toFixed(1)}%
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
    </VendorLayout>
  )
}
