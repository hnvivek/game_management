'use client'

import { AnalyticsDashboard } from '@/components/features/admin/AnalyticsDashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, TrendingDown, Download, Calendar, Filter, Target, Zap, Clock, DollarSign, Users, Store } from 'lucide-react'
import Link from 'next/link'
import { UniversalBreadcrumb } from '@/components/features/admin/UniversalBreadcrumb'

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <UniversalBreadcrumb />

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Data Freshness</span>
                  <Badge variant="default">Live</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm">Just now</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Coverage</span>
                  <span className="text-sm">100%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Revenue growth of 12.5% this month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">User acquisition rate increased by 15.2%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Vendor satisfaction at 4.7/5 average</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Optimize Pricing
                  </h4>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    Weekend bookings show 25% higher conversion rates
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                    Peak Performance
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Soccer venues generate 35% more revenue
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Dashboard */}
        <AnalyticsDashboard />

        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Detailed Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Comprehensive platform insights and detailed reports
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Reports
            </Button>
            <Link href="/admin/analytics/reports">
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Custom Reports
              </Button>
            </Link>
            <Link href="/admin/analytics/insights">
              <Button variant="outline" size="sm">
                <TrendingUp className="mr-2 h-4 w-4" />
                Deep Insights
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Monthly Recurring</span>
                  <Badge variant="secondary">$45.2K</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Order Value</span>
                  <Badge variant="secondary">$149.50</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Customer Lifetime Value</span>
                  <Badge variant="secondary">$2,340</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">User Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Sessions</span>
                  <Badge variant="secondary">342</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg. Session Duration</span>
                  <Badge variant="secondary">12m 35s</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Bounce Rate</span>
                  <Badge variant="secondary">23.4%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Page Load Time</span>
                  <Badge variant="secondary">1.2s</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">API Response Time</span>
                  <Badge variant="secondary">284ms</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Uptime</span>
              <Badge className="bg-green-100 text-green-800">99.9%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Growth Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Monthly Growth</span>
                  <Badge variant="secondary">+8.7%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Year-over-Year</span>
                  <Badge variant="secondary">+45.2%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Forecast Accuracy</span>
                  <Badge variant="secondary">92.3%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}