'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { VendorLayout } from '@/components/features/vendor/VendorLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Clock,
  Star,
  MapPin,
  Activity,
  Download,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Info
} from 'lucide-react'
import { useVendor } from '@/hooks/use-vendor'
import { fetchVendorAnalytics } from '@/lib/api/vendor/analytics'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { theme } from '@/styles/theme/tokens'
import { getSportColor } from '@/styles/theme/sport-colors'
import { useDebounce } from '@/hooks/use-debounce'
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export default function VendorAnalyticsPage() {
  const { vendorId } = useVendor()
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d')
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [chartHeight, setChartHeight] = useState(400)
  
  // Request cancellation ref
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Debounce period changes to avoid excessive API calls
  const debouncedPeriod = useDebounce(selectedPeriod, 300)

  useEffect(() => {
    if (vendorId) {
      loadAnalytics()
    }
  }, [vendorId, debouncedPeriod])

  // Update chart height based on container size
  useEffect(() => {
    const updateChartHeight = () => {
      if (chartContainerRef.current) {
        const height = chartContainerRef.current.clientHeight
        if (height > 0) {
          setChartHeight(height)
        }
      }
    }

    // Initial update
    const timeoutId = setTimeout(updateChartHeight, 100)
    
    // Use ResizeObserver for better accuracy
    const resizeObserver = new ResizeObserver(() => {
      updateChartHeight()
    })

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current)
    }

    window.addEventListener('resize', updateChartHeight)
    
    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateChartHeight)
    }
  }, [analytics])

  const loadAnalytics = useCallback(async () => {
    if (!vendorId) return

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      setLoading(true)
      setError(null)
      
      const data = await fetchVendorAnalytics(vendorId, {
        period: debouncedPeriod,
        groupBy: debouncedPeriod === '7d' ? 'day' : debouncedPeriod === '30d' ? 'day' : 'month',
        compareWith: 'previous_period' // Request comparison data to calculate changes
      }, abortController.signal)
      
      // Check if request was cancelled
      if (abortController.signal.aborted) {
        return
      }
      
      setAnalytics(data)
    } catch (error: any) {
      // Don't set error if request was cancelled
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        return
      }
      
      console.error('Error loading analytics:', error)
      setError(error.message || 'Failed to load analytics data')
    } finally {
      // Only update loading state if request wasn't cancelled
      if (!abortController.signal.aborted) {
        setLoading(false)
      }
    }
  }, [vendorId, debouncedPeriod])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Get currency symbol
  const currencyCode = analytics?.vendor?.currencyCode || 'INR'
  const currencyMap: Record<string, string> = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  }
  const currencySymbol = currencyMap[currencyCode] || currencyCode


  const performanceMetrics = analytics ? [
    {
      title: 'Occupancy Rate',
      value: analytics.performance?.occupancyRate || 0,
      trend: (analytics.growth?.occupancyRate || 0) >= 0 ? 'up' : 'down',
      change: analytics.growth?.occupancyRate || 0,
      hasComparison: analytics.growth !== null && analytics.growth !== undefined,
      description: 'Average venue utilization',
      tooltip: 'The percentage of available court hours that are booked. Calculated as (Total Booked Hours / Total Available Hours) × 100. Higher occupancy indicates better resource utilization.'
    },
    {
      title: 'Customer Satisfaction',
      value: analytics.performance?.customerSatisfaction || 0,
      trend: (analytics.growth?.customerSatisfaction || 0) >= 0 ? 'up' : 'down',
      change: analytics.growth?.customerSatisfaction || 0,
      hasComparison: analytics.growth !== null && analytics.growth !== undefined && (analytics.growth?.customerSatisfaction !== undefined && analytics.growth?.customerSatisfaction !== null),
      description: 'Average customer rating',
      tooltip: 'Average customer rating based on reviews and feedback. This is a placeholder metric that will be integrated with the review system when available.'
    },
    {
      title: 'Revenue Growth',
      value: analytics.revenue?.total || 0,
      trend: (analytics.growth?.revenue || 0) >= 0 ? 'up' : 'down',
      change: analytics.growth?.revenue || 0,
      hasComparison: analytics.growth !== null && analytics.growth !== undefined,
      description: 'Total revenue for the period',
      tooltip: 'Total revenue generated from confirmed and completed bookings during the selected period. The percentage change compares this period with the previous equivalent period.'
    },
    {
      title: 'Booking Efficiency',
      value: analytics.performance?.completionRate || 0,
      trend: (analytics.growth?.completionRate || 0) >= 0 ? 'up' : 'down',
      change: analytics.growth?.completionRate || 0,
      hasComparison: analytics.growth !== null && analytics.growth !== undefined,
      description: 'Successful booking completion rate',
      tooltip: 'The percentage of bookings that were successfully completed. Calculated as (Completed Bookings / Total Bookings) × 100. Higher efficiency indicates fewer cancellations and better booking fulfillment.'
    }
  ] : []

  const topVenues = analytics?.venues?.topPerformers || []
  const customerInsights = analytics?.customers ? {
    newCustomers: analytics.customers.new || 0,
    returningCustomers: analytics.customers.returning || 0,
    totalCustomers: analytics.customers.total || 0,
    averageSpending: analytics.summary?.averageBookingValue || 0,
    repeatRate: analytics.customers.repeatRate || analytics.customers.retentionRate || 0,
    topBookingTime: analytics.timeAnalytics?.peakHours?.[0] ? `${analytics.timeAnalytics.peakHours[0].hour}:00` : '6:00 PM - 8:00 PM',
    popularSports: [], // Sports data not available in API - can be added later if needed
    customerGrowth: analytics.growth?.customers || 0
  } : {
    newCustomers: 0,
    returningCustomers: 0,
    totalCustomers: 0,
    averageSpending: 0,
    repeatRate: 0,
    topBookingTime: '6:00 PM - 8:00 PM',
    popularSports: [],
    customerGrowth: 0
  }

  const revenueBreakdown = analytics?.venues?.topPerformers?.slice(0, 4).map((venue: any) => ({
    category: venue.name,
    revenue: venue.revenue || 0,
    percentage: analytics.summary?.totalRevenue > 0 
      ? ((venue.revenue || 0) / analytics.summary.totalRevenue) * 100 
      : 0
  })) || []

  // Helper function to format hour for display
  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:00 ${period}`
  }

  // Helper function to format time range
  const formatTimeRange = (hour: number) => {
    const nextHour = (hour + 1) % 24
    return `${formatHour(hour)} - ${formatHour(nextHour)}`
  }

  // Get peak day name
  const peakDay = analytics?.timeAnalytics?.peakDays?.[0]?.dayName || 'N/A'

  // Get peak hour range
  const peakHour = analytics?.timeAnalytics?.peakHours?.[0]?.hour
  const peakTimeSlot = peakHour !== undefined ? formatTimeRange(peakHour) : 'N/A'

  // Calculate business hours performance from peak hours
  const businessHoursData = analytics?.timeAnalytics?.peakHours 
    ? (() => {
        const hourGroups = [
          { label: '6AM - 12PM', hours: [6, 7, 8, 9, 10, 11] },
          { label: '12PM - 6PM', hours: [12, 13, 14, 15, 16, 17] },
          { label: '6PM - 10PM', hours: [18, 19, 20, 21] },
          { label: '10PM - 12AM', hours: [22, 23] }
        ]
        
        const totalBookings = analytics.timeAnalytics.peakHours.reduce((sum: number, h: any) => sum + h.bookingCount, 0)
        const maxBookingCount = Math.max(...analytics.timeAnalytics.peakHours.map((h: any) => h.bookingCount), 0)
        
        return hourGroups.map(group => {
          const groupBookings = analytics.timeAnalytics.peakHours
            .filter((h: any) => group.hours.includes(h.hour))
            .reduce((sum: number, h: any) => sum + h.bookingCount, 0)
          const occupancy = maxBookingCount > 0 ? (groupBookings / maxBookingCount) * 100 : 0
          
          // Estimate revenue based on average booking value
          const estimatedRevenue = groupBookings * (analytics.summary?.averageBookingValue || 0)
          
          return {
            time: group.label,
            occupancy: Math.round(occupancy),
            revenue: Math.round(estimatedRevenue)
          }
        })
      })()
    : []

  // Get peak booking times for customer insights
  const peakBookingTimes = analytics?.timeAnalytics?.peakHours
    ? (() => {
        const timeSlots = [
          { label: '6AM - 9AM', hours: [6, 7, 8] },
          { label: '9AM - 12PM', hours: [9, 10, 11] },
          { label: '12PM - 6PM', hours: [12, 13, 14, 15, 16, 17] },
          { label: '6PM - 10PM', hours: [18, 19, 20, 21] }
        ]
        
        const maxBookingCount = Math.max(...analytics.timeAnalytics.peakHours.map((h: any) => h.bookingCount), 0)
        
        return timeSlots.map(slot => {
          const slotBookings = analytics.timeAnalytics.peakHours
            .filter((h: any) => slot.hours.includes(h.hour))
            .reduce((sum: number, h: any) => sum + h.bookingCount, 0)
          const percentage = maxBookingCount > 0 ? Math.round((slotBookings / maxBookingCount) * 100) : 0
          
          return {
            time: slot.label,
            percentage
          }
        })
      })()
    : []

  return (
    <VendorLayout
      title="Analytics"
      subtitle="Track your business performance and identify growth opportunities"
    >
    <div className="p-6 space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">Error loading analytics</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      )}
      
      {/* Page Controls */}
      <div className="flex items-center justify-end gap-2">
        <Select value={selectedPeriod} onValueChange={(val) => setSelectedPeriod(val as typeof selectedPeriod)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last Week</SelectItem>
            <SelectItem value="30d">Last Month</SelectItem>
            <SelectItem value="90d">Last Quarter</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          performanceMetrics.map((metric, index) => (
          <Card key={index} className="relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <div className="flex items-center gap-1">
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4" style={{ color: theme.colors.success[600] }} />
                ) : (
                  <TrendingDown className="h-4 w-4" style={{ color: theme.colors.error[500] }} />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.title.includes('Satisfaction') ? metric.value.toFixed(1) :
                 metric.title === 'Revenue Growth' 
                   ? `${currencySymbol}${metric.value.toLocaleString()}`
                   : metric.title.includes('Rate') || metric.title.includes('Efficiency')
                     ? `${metric.value.toFixed(1)}%` : metric.value}
              </div>
              {metric.hasComparison && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span 
                    style={{ 
                      color: metric.change > 0 
                        ? theme.colors.success[600] 
                        : metric.change < 0 
                          ? theme.colors.error[500] 
                          : undefined
                    }}
                    className={metric.change === 0 ? 'text-muted-foreground' : ''}
                  >
                    {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                  </span>
                  <span>from last period</span>
                </div>
              )}
              {/* Info icon positioned at bottom right */}
              <div className="absolute bottom-3 right-3">
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={`Information about ${metric.title}`}
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="left"
                    className="max-w-xs bg-popover text-popover-foreground border border-border"
                  >
                    <p className="text-xs leading-relaxed">{metric.tooltip}</p>
                  </TooltipContent>
                </UITooltip>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="revenue" className="space-y-6 analytics-tabs">
        <style dangerouslySetInnerHTML={{
          __html: `
            .analytics-tabs [data-slot="tabs-trigger"][data-state="active"] {
              background-color: ${theme.colors.primary[500]} !important;
              color: #ffffff !important;
            }
          `
        }} />
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="venues">Venues</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-0" style={{ overflow: 'visible' }}>
                  {loading ? (
                    <Skeleton className="h-full w-full flex-1" />
                  ) : analytics?.revenue?.byPeriod && analytics.revenue.byPeriod.length > 0 ? (
                    <div ref={chartContainerRef} className="w-full flex-1 min-h-[300px]" style={{ position: 'relative', zIndex: 1 }}>
                        <ResponsiveContainer width="100%" height={chartHeight}>
                          {(() => {
                            // Get sports from API response
                            const sports = analytics.revenue?.sports || []
                            
                            // Transform data to include revenue for each sport
                            const chartData = analytics.revenue.byPeriod.map((item: any) => {
                              const dataPoint: any = {
                                name: selectedPeriod === '7d' || selectedPeriod === '30d' 
                                  ? new Date(item.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                  : new Date(item.period).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                                revenue: item.revenue,
                                bookings: item.bookingCount
                              }
                              
                              // Add revenue for each sport
                              if (item.bySport && sports.length > 0) {
                                sports.forEach((sport: any) => {
                                  dataPoint[`sport_${sport.id}`] = item.bySport[sport.id] || 0
                                })
                              }
                              
                              return dataPoint
                            })
                            
                            return (
                              <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                                <XAxis
                                  dataKey="name"
                                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                  axisLine={{ stroke: 'hsl(var(--border))' }}
                                  tickLine={{ stroke: 'hsl(var(--border))' }}
                                />
                                <YAxis
                                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                  axisLine={{ stroke: 'hsl(var(--border))' }}
                                  tickLine={{ stroke: 'hsl(var(--border))' }}
                                  tickFormatter={(value) => `${currencySymbol}${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    zIndex: 9999,
                                    color: 'hsl(var(--foreground))'
                                  }}
                                  labelStyle={{ 
                                    color: 'hsl(var(--foreground))',
                                    fontWeight: 600,
                                    marginBottom: '4px'
                                  }}
                                  wrapperStyle={{ zIndex: 9999 }}
                                  formatter={(value: any, name: string) => {
                                    if (name.startsWith('sport_')) {
                                      const sportId = name.replace('sport_', '')
                                      const sport = sports.find((s: any) => s.id === sportId)
                                      return [`${currencySymbol}${Number(value).toLocaleString()}`, sport?.displayName || sport?.name || 'Sport']
                                    }
                                    if (name === 'revenue') {
                                      return [`${currencySymbol}${Number(value).toLocaleString()}`, 'Total Revenue']
                                    }
                                    return [value, 'Bookings']
                                  }}
                                />
                                <Legend 
                                  wrapperStyle={{ paddingTop: '20px' }}
                                  iconType="square"
                                  formatter={(value: string) => {
                                    if (value.startsWith('sport_')) {
                                      const sportId = value.replace('sport_', '')
                                      const sport = sports.find((s: any) => s.id === sportId)
                                      return sport?.icon ? `${sport.icon} ${sport.displayName}` : sport?.displayName || sport?.name || 'Sport'
                                    }
                                    return value === 'revenue' ? 'Total Revenue' : value
                                  }}
                                />
                                {/* Render stacked Bar for each sport */}
                                {sports.map((sport: any, index: number) => {
                                  const color = getSportColor(sport.id, sport.name)
                                  // Last sport gets rounded top corners
                                  const isLast = index === sports.length - 1
                                  return (
                                    <Bar
                                      key={sport.id}
                                      dataKey={`sport_${sport.id}`}
                                      stackId="revenue"
                                      fill={color}
                                      radius={isLast ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                    />
                                  )
                                })}
                                {/* Fallback: show total revenue if no sports */}
                                {sports.length === 0 && (
                                  <Bar
                                    dataKey="revenue"
                                    fill="hsl(var(--primary))"
                                    radius={[4, 4, 0, 0]}
                                  />
                                )}
                              </RechartsBarChart>
                            )
                          })()}
                        </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No revenue data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-6 h-full">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    {revenueBreakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                          <span className="text-sm font-medium">{item.category}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{currencySymbol}{item.revenue.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Total Revenue</span>
                        <span className="font-bold">
                          {currencySymbol}{revenueBreakdown.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  {loading ? (
                    [1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Average Order Value</span>
                        <Badge variant="secondary">
                          {currencySymbol}{analytics?.summary?.averageBookingValue?.toFixed(2) || '0.00'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Peak Revenue Day</span>
                        <Badge variant="secondary">{peakDay}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Peak Time Slot</span>
                        <Badge variant="secondary">{peakTimeSlot}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Conversion Rate</span>
                        <Badge variant="secondary">
                          {analytics?.performance?.conversion?.bookingToConfirmation?.toFixed(1) || '0.0'}%
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Court & Sport Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))
            ) : (() => {
              // Calculate sport performance metrics
              const sports = analytics?.revenue?.sports || []
              const revenueByPeriod = analytics?.revenue?.byPeriod || []
              
              // Calculate total revenue by sport
              const sportRevenueMap = new Map<string, { revenue: number; bookings: number; name: string; icon: string | null }>()
              
              revenueByPeriod.forEach((period: any) => {
                if (period.bySport) {
                  Object.entries(period.bySport).forEach(([sportId, revenue]: [string, any]) => {
                    const existing = sportRevenueMap.get(sportId) || { revenue: 0, bookings: 0, name: '', icon: null }
                    const sport = sports.find((s: any) => s.id === sportId)
                    sportRevenueMap.set(sportId, {
                      revenue: existing.revenue + (revenue || 0),
                      bookings: existing.bookings + (period.bookingCount || 0),
                      name: sport?.displayName || sport?.name || 'Unknown',
                      icon: sport?.icon || null
                    })
                  })
                }
              })
              
              // Get most popular sport by revenue
              const mostPopularSport = Array.from(sportRevenueMap.entries())
                .sort((a, b) => b[1].revenue - a[1].revenue)[0]
              
              // Calculate sport revenue percentages
              const totalSportRevenue = Array.from(sportRevenueMap.values())
                .reduce((sum, s) => sum + s.revenue, 0)
              
              // Get top venue
              const topVenue = analytics?.venues?.topPerformers?.[0]
              
              // Calculate average court utilization (using occupancy rate)
              const avgCourtUtilization = analytics?.performance?.occupancyRate || 0
              
              // Get total courts from API (all courts, not just from top performers)
              const totalCourts = analytics?.venues?.totalCourts || 0
              
              // Use confirmed + completed bookings from API (matching occupancy calculation)
              const confirmedCompletedBookings = analytics?.bookings?.activeBookings || 
                analytics?.bookings?.byPeriod?.reduce((sum: number, period: any) => {
                  return sum + (period.confirmed || 0) + (period.completed || 0)
                }, 0) || 0
              
              const avgBookingsPerCourt = totalCourts > 0 ? confirmedCompletedBookings / totalCourts : 0
              
              const courtSportMetrics = [
                {
                  title: 'Most Popular Sport',
                  value: mostPopularSport ? mostPopularSport[1].name : 'N/A',
                  icon: mostPopularSport ? mostPopularSport[1].icon : null,
                  revenue: mostPopularSport ? mostPopularSport[1].revenue : 0,
                  subtitle: mostPopularSport ? `${currencySymbol}${mostPopularSport[1].revenue.toLocaleString()}` : 'No data'
                },
                {
                  title: 'Top Performing Venue',
                  value: topVenue?.name || 'N/A',
                  revenue: topVenue?.revenue || 0,
                  subtitle: topVenue ? `${currencySymbol}${topVenue.revenue.toLocaleString()}` : 'No data'
                },
                {
                  title: 'Average Court Utilization',
                  value: avgCourtUtilization,
                  subtitle: `${avgCourtUtilization.toFixed(1)}% occupancy`,
                  isPercentage: true
                },
                {
                  title: 'Avg Bookings per Court',
                  value: avgBookingsPerCourt,
                  subtitle: `${avgBookingsPerCourt.toFixed(1)} bookings`,
                  isCount: true
                }
              ]
              
              return courtSportMetrics.map((metric, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      {metric.icon && <span className="text-xl">{metric.icon}</span>}
                      {metric.isPercentage 
                        ? `${metric.value.toFixed(1)}%`
                        : metric.isCount
                          ? metric.value.toFixed(1)
                          : metric.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {metric.subtitle}
                    </p>
                  </CardContent>
                </Card>
              ))
            })()}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sport Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i}>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (() => {
                  const sports = analytics?.revenue?.sports || []
                  const revenueByPeriod = analytics?.revenue?.byPeriod || []
                  const totalRevenue = analytics?.summary?.totalRevenue || 0
                  
                  // Calculate total revenue by sport
                  const sportRevenueMap = new Map<string, { revenue: number; name: string; icon: string | null }>()
                  
                  revenueByPeriod.forEach((period: any) => {
                    if (period.bySport) {
                      Object.entries(period.bySport).forEach(([sportId, revenue]: [string, any]) => {
                        const existing = sportRevenueMap.get(sportId) || { revenue: 0, name: '', icon: null }
                        const sport = sports.find((s: any) => s.id === sportId)
                        sportRevenueMap.set(sportId, {
                          revenue: existing.revenue + (revenue || 0),
                          name: sport?.displayName || sport?.name || 'Unknown',
                          icon: sport?.icon || null
                        })
                      })
                    }
                  })
                  
                  const sportBreakdown = Array.from(sportRevenueMap.entries())
                    .map(([id, data]) => ({
                      id,
                      name: data.name,
                      icon: data.icon,
                      revenue: data.revenue,
                      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
                    }))
                    .sort((a, b) => b.revenue - a.revenue)
                  
                  return sportBreakdown.length > 0 ? (
                    <div className="space-y-4">
                      {sportBreakdown.map((sport) => (
                        <div key={sport.id}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {sport.icon && <span className="text-lg">{sport.icon}</span>}
                              <span className="text-sm font-medium">{sport.name}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {currencySymbol}{sport.revenue.toLocaleString()} ({sport.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={sport.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No sport data available</p>
                  )
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Hours Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i}>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : businessHoursData.length > 0 ? (
                  <div className="space-y-4">
                    {businessHoursData.map((slot, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{slot.time}</span>
                          <span className="text-sm text-muted-foreground">
                            {slot.occupancy}% • {currencySymbol}{slot.revenue.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={slot.occupancy} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No time analytics data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{customerInsights.totalCustomers}</div>
                    <div className="text-sm text-muted-foreground">Total Customers</div>
                    <div className="text-xs" style={{ color: theme.colors.success[600] }}>+{customerInsights.customerGrowth}% this month</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold" style={{ color: theme.colors.success[600] }}>{customerInsights.newCustomers}</div>
                      <div className="text-xs text-muted-foreground">New</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold" style={{ color: theme.colors.secondary[500] }}>{customerInsights.returningCustomers}</div>
                      <div className="text-xs text-muted-foreground">Returning</div>
                    </div>
                  </div>
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Repeat Rate</span>
                      <span className="font-medium">{customerInsights.repeatRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg. Spending</span>
                      <span className="font-medium">{currencySymbol}{customerInsights.averageSpending.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : analytics?.customers?.topCustomers && analytics.customers.topCustomers.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.customers.topCustomers.slice(0, 10).map((customer: any, index: number) => (
                      <div key={customer.id || index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{customer.name || customer.email || 'Unknown Customer'}</div>
                            <div className="text-sm text-muted-foreground truncate">{customer.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-sm font-medium">{customer.bookingCount || 0}</div>
                            <div className="text-xs text-muted-foreground">bookings</div>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <div className="text-sm font-medium">{currencySymbol}{(customer.revenue || 0).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">spent</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No customer data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="venues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Venues</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : topVenues.length > 0 ? (
                <div className="space-y-4">
                  {topVenues.map((venue: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{venue.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {venue.bookingCount || 0} bookings • Revenue: {currencySymbol}{venue.revenue?.toLocaleString() || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No venue data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </VendorLayout>
  )
}