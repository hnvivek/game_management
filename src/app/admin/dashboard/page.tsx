'use client'

import { useEffect, useState } from 'react'
import { KPIGrid, KPIWidget } from '@/components/features/admin/KPIWidget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { UniversalBreadcrumb } from '@/components/features/admin/UniversalBreadcrumb'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, Users, Store, Calendar, TrendingUp, DollarSign, Activity, AlertCircle, MapPin, Circle, Plus } from 'lucide-react'
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

// Mock data for development
const mockKPIMetrics = [
  {
    title: 'Total Revenue',
    value: 125430,
    change: { value: 12.5, trend: 'up' as const, period: 'vs last month' },
    icon: DollarSign,
    format: 'currency' as const,
    description: 'Platform-wide revenue'
  },
  {
    title: 'Active Users',
    value: 8429,
    change: { value: 8.2, trend: 'up' as const, period: 'vs last month' },
    icon: Users,
    format: 'number' as const,
    description: 'Registered active users'
  },
  {
    title: 'Total Vendors',
    value: 156,
    change: { value: 3.1, trend: 'up' as const, period: 'vs last month' },
    icon: Store,
    format: 'number' as const,
    description: 'Active vendor accounts'
  },
  {
    title: 'Total Bookings',
    value: 2847,
    change: { value: -2.4, trend: 'down' as const, period: 'vs last month' },
    icon: Calendar,
    format: 'number' as const,
    description: 'Platform bookings'
  }
]

const mockRevenueData = [
  { month: 'Jan', revenue: 85000 },
  { month: 'Feb', revenue: 92000 },
  { month: 'Mar', revenue: 88000 },
  { month: 'Apr', revenue: 105000 },
  { month: 'May', revenue: 118000 },
  { month: 'Jun', revenue: 125430 }
]

const mockBookingData = [
  { day: 'Mon', bookings: 45 },
  { day: 'Tue', bookings: 52 },
  { day: 'Wed', bookings: 48 },
  { day: 'Thu', bookings: 61 },
  { day: 'Fri', bookings: 73 },
  { day: 'Sat', bookings: 89 },
  { day: 'Sun', bookings: 67 }
]

const mockUserDistribution = [
  { name: 'Customers', value: 7200, color: '#0088FE' },
  { name: 'Vendor Admins', value: 156, color: '#00C49F' },
  { name: 'Vendor Staff', value: 342, color: '#FFBB28' },
  { name: 'Platform Admins', value: 8, color: '#FF8042' }
]

const mockRecentActivity = [
  { id: 1, type: 'user', title: 'New user registration', description: 'John Doe joined the platform', time: '2 minutes ago', status: 'success' },
  { id: 2, type: 'vendor', title: 'Vendor application', description: 'Sports Complex LLC applied for vendor account', time: '15 minutes ago', status: 'pending' },
  { id: 3, type: 'booking', title: 'Large booking', description: 'Corporate event booked for 50 people', time: '1 hour ago', status: 'success' },
  { id: 4, type: 'system', title: 'System update', description: 'Platform maintenance completed successfully', time: '2 hours ago', status: 'info' },
  { id: 5, type: 'alert', title: 'Payment issue', description: 'Payment gateway temporarily unavailable', time: '3 hours ago', status: 'warning' }
]

const mockQuickStats = {
  totalVenues: 12,
  activeVenues: 10,
  pendingVenues: 2,
  totalCourts: 45,
  availableCourts: 38,
  maintenanceCourts: 7,
  monthlyVenueRevenue: 434000,
  monthlyCourtRevenue: 151000,
  avgVenueUtilization: 78,
  avgCourtUtilization: 82
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(mockKPIMetrics)

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <UniversalBreadcrumb />

        {/* KPI Metrics */}
        <KPIGrid
          metrics={loading ? metrics.map(m => ({ ...m, loading: true })) : metrics}
          columns={4}
        />

        {/* Quick Access Cards for Venues & Courts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Venues Quick Access */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Venues Management
                </CardTitle>
                <Badge variant="secondary">{mockQuickStats.totalVenues} Total</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-600">{mockQuickStats.activeVenues}</p>
                  <p className="text-sm text-muted-foreground">Active Venues</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-orange-600">{mockQuickStats.pendingVenues}</p>
                  <p className="text-sm text-muted-foreground">Pending Approval</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Revenue</span>
                  <span className="font-medium">₹{mockQuickStats.monthlyVenueRevenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg. Utilization</span>
                  <span className="font-medium">{mockQuickStats.avgVenueUtilization}%</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button asChild className="flex-1">
                  <Link href="/admin/venues">
                    <MapPin className="h-4 w-4 mr-2" />
                    View All Venues
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/venues/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Venue
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Courts Quick Access */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Circle className="h-5 w-5" />
                  Courts Management
                </CardTitle>
                <Badge variant="secondary">{mockQuickStats.totalCourts} Total</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-600">{mockQuickStats.availableCourts}</p>
                  <p className="text-sm text-muted-foreground">Available</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-orange-600">{mockQuickStats.maintenanceCourts}</p>
                  <p className="text-sm text-muted-foreground">Maintenance</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Revenue</span>
                  <span className="font-medium">₹{mockQuickStats.monthlyCourtRevenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg. Utilization</span>
                  <span className="font-medium">{mockQuickStats.avgCourtUtilization}%</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button asChild className="flex-1">
                  <Link href="/admin/courts">
                    <Circle className="h-4 w-4 mr-2" />
                    View All Courts
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/courts/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Court
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-muted-foreground">Loading chart...</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: '#2563eb' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Bookings Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Weekly Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-muted-foreground">Loading chart...</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockBookingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="text-muted-foreground">Loading chart...</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={mockUserDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockUserDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-muted rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockRecentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.status === 'success' ? 'bg-green-500' :
                          activity.status === 'warning' ? 'bg-yellow-500' :
                          activity.status === 'error' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}