'use client'

import { useState, useEffect } from 'react'
import { VendorDataTable } from '@/components/features/admin/VendorDataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Store, TrendingUp, Clock, CheckCircle, AlertTriangle, MapPin, DollarSign, Users, Eye, Edit, Trash2, Ban, CheckSquare } from 'lucide-react'
import Link from 'next/link'
import { UniversalBreadcrumb } from '@/components/features/admin/UniversalBreadcrumb'
import { fetchAdminVendorStats, bulkUpdateAdminVendors } from '@/lib/api/admin/vendors'

interface VendorStats {
  total: number
  active: number
  pending: number
  suspended: number
  totalVenues: number
  totalRevenue: number
  pendingApplications: number
  growth: number
}

export default function VendorsPage() {
  const [stats, setStats] = useState<VendorStats>({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    totalVenues: 0,
    totalRevenue: 0,
    pendingApplications: 0,
    growth: 0
  })
  const [loading, setLoading] = useState(true)

  // Fetch vendor statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const vendorStats = await fetchAdminVendorStats()
        setStats(vendorStats)
      } catch (error) {
        console.error('Error fetching vendor stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const handleBulkAction = async (action: string, vendorIds: string[]) => {
    try {
      const updates = action === 'approve' ? { isActive: true } :
                     action === 'suspend' ? { isActive: false } :
                     action === 'delete' ? { /* handle deletion separately */ } : {}
      
      if (action === 'delete') {
        // Handle deletion separately if needed
        console.warn('Bulk delete not implemented via bulk update')
        return
      }

      await bulkUpdateAdminVendors(vendorIds, updates)
      
      // Refresh the stats
      const vendorStats = await fetchAdminVendorStats()
      setStats(vendorStats)
    } catch (error) {
      console.error('Error performing bulk action:', error)
    }
  }

  return (
    <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <UniversalBreadcrumb />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.total}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.growth}% this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.active}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Require review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalVenues}</div>
              <p className="text-xs text-muted-foreground">
                Across all vendors
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Applications Alert */}
        {stats.pendingApplications > 0 && (
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                    {stats.pendingApplications} vendor applications pending approval
                  </h3>
                  <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                    Review and approve new vendor applications to onboard them to the platform
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"
                    onClick={() => {/* Navigate to pending applications */}}
                  >
                    Review Applications
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {/* Approve all pending */}}
                  >
                    Approve All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Vendor Directory</h2>
            <p className="text-sm text-muted-foreground">
              Manage all vendor accounts and their performance metrics
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" />
              Bulk Actions
            </Button>
            <Button variant="outline" size="sm">
              <TrendingUp className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Link href="/admin/vendors/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Vendor
              </Button>
            </Link>
          </div>
        </div>

  
        {/* Vendor Table with real data */}
        <VendorDataTable onBulkAction={handleBulkAction} />
      </div>
  )
}