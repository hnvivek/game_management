'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, TrendingUp, DollarSign, Users, Store, Activity, Download, Filter } from 'lucide-react'

// Mock data for analytics
const mockRevenueData = [
  { month: 'Jan', revenue: 85000, bookings: 245, users: 1200, vendors: 12 },
  { month: 'Feb', revenue: 92000, bookings: 268, users: 1350, vendors: 14 },
  { month: 'Mar', revenue: 88000, bookings: 252, users: 1420, vendors: 13 },
  { month: 'Apr', revenue: 105000, bookings: 298, users: 1580, vendors: 15 },
  { month: 'May', revenue: 118000, bookings: 342, users: 1750, vendors: 17 },
  { month: 'Jun', revenue: 125000, bookings: 376, users: 1920, vendors: 18 }
]

const mockBookingData = [
  { day: 'Mon', bookings: 45, confirmed: 38, cancelled: 5, revenue: 6750 },
  { day: 'Tue', bookings: 52, confirmed: 44, cancelled: 6, revenue: 8200 },
  { day: 'Wed', bookings: 48, confirmed: 41, cancelled: 4, revenue: 7400 },
  { day: 'Thu', bookings: 61, confirmed: 55, cancelled: 4, revenue: 9800 },
  { day: 'Fri', bookings: 73, confirmed: 68, cancelled: 3, revenue: 12500 },
  { day: 'Sat', bookings: 89, confirmed: 82, cancelled: 5, revenue: 15800 },
  { day: 'Sun', bookings: 67, confirmed: 61, cancelled: 4, revenue: 11200 }
]

const mockSportData = [
  { name: 'Soccer', bookings: 845, revenue: 127500, color: '#3B82F6' },
  { name: 'Basketball', bookings: 523, revenue: 89450, color: '#10B981' },
  { name: 'Tennis', bookings: 412, revenue: 78200, color: '#F59E0B' },
  { name: 'Volleyball', bookings: 356, revenue: 61200, color: '#8B5CF6' },
  { name: 'Football', bookings: 298, revenue: 53400, color: '#EF4444' },
  { name: 'Baseball', bookings: 187, revenue: 32100, color: '#06B6D4' }
]

const mockUserDistribution = [
  { name: 'Customers', value: 7200, color: '#22C55E' },
  { name: 'Vendor Admins', value: 156, color: '#3B82F6' },
  { name: 'Vendor Staff', value: 342, color: '#F59E0B' },
  { name: 'Platform Admins', value: 8, color: '#EF4444' }
]

const mockPaymentData = [
  { method: 'Credit Card', amount: 285420, transactions: 1842, percentage: 67.2 },
  { method: 'Debit Card', amount: 95040, transactions: 612, percentage: 22.4 },
  { method: 'PayPal', amount: 28980, transactions: 187, percentage: 6.8 },
  { method: 'Bank Transfer', amount: 15630, transactions: 98, percentage: 3.6 }
]

const mockVendorPerformance = [
  { name: 'Sports Complex LLC', revenue: 89500, bookings: 247, venues: 3, rating: 4.8 },
  { name: 'City Recreation Center', revenue: 78300, bookings: 198, venues: 5, rating: 4.6 },
  { name: 'Pro Athletic Centers', revenue: 125000, bookings: 312, venues: 4, rating: 4.9 },
  { name: 'Elite Sports Facilities', revenue: 45700, bookings: 118, venues: 2, rating: 4.7 },
  { name: 'Community Sports Hub', revenue: 32100, bookings: 89, venues: 1, rating: 4.2 }
]

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0']

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease'
  icon?: React.ReactNode
  description?: string
  format?: 'currency' | 'number' | 'percentage'
}

function KPICard({ title, value, change, changeType, icon, description, format = 'number' }: KPICardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val
    if (format === 'currency') return `$${Number(val).toLocaleString()}`
    if (format === 'percentage') return `${val}%`
    return Number(val).toLocaleString()
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{formatValue(value)}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {icon}
            {change !== undefined && (
              <div className={`flex items-center space-x-1 text-sm ${
                changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {changeType === 'increase' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingUp className="h-4 w-4 rotate-180" />
                )}
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('6months')
  const [period, setPeriod] = useState('month')

  const handleExport = () => {
    // Export functionality
    console.log('Exporting analytics data...')
  }

  const handleFilter = () => {
    // Filter functionality
    console.log('Opening filters...')
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value={125000}
          change={12.5}
          changeType="increase"
          icon={<DollarSign className="h-8 w-8 text-blue-500" />}
          format="currency"
          description="Platform-wide revenue"
        />
        <KPICard
          title="Total Bookings"
          value={376}
          change={8.7}
          changeType="increase"
          icon={<Activity className="h-8 w-8 text-green-500" />}
          description="This month"
        />
        <KPICard
          title="Active Users"
          value={1920}
          change={15.2}
          changeType="increase"
          icon={<Users className="h-8 w-8 text-purple-500" />}
          description="Registered users"
        />
        <KPICard
          title="Active Vendors"
          value={18}
          change={12.5}
          changeType="increase"
          icon={<Store className="h-8 w-8 text-orange-500" />}
          description="Verified vendors"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleFilter}>
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Growth */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={mockRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#22C55E"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockPaymentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {mockPaymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPaymentData.map((method, index) => (
                    <div key={method.method} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium">{method.method}</p>
                        <p className="text-sm text-muted-foreground">
                          {method.transactions} transactions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${method.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {method.percentage}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          {/* Weekly Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Booking Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockBookingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#10B981" />
                  <Bar dataKey="confirmed" fill="#22C55E" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sports Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Booking by Sport</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockSportData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Registration Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#22C55E"
                      fill="#22C55E"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Demographics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-3">Age Distribution</h4>
                    <div className="space-y-2">
                      {[
                        { age: '18-24', count: 2450, percentage: 34.0 },
                        { age: '25-34', count: 2890, percentage: 40.2 },
                        { age: '35-44', count: 1580, percentage: 21.9 },
                        { age: '45+', count: 270, percentage: 3.9 }
                      ].map((age) => (
                        <div key={age.age} className="flex items-center justify-between">
                          <span className="text-sm">{age.age}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${age.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {age.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          {/* Top Performing Vendors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockVendorPerformance} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Vendor Details */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockVendorPerformance.map((vendor, index) => (
                  <div key={vendor.name} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.venues} venues • {vendor.bookings} bookings
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full ${
                              i < Math.floor(vendor.rating) ? 'bg-yellow-400' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${vendor.revenue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}