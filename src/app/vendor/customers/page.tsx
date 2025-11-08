'use client'

import { VendorCustomerDataTable } from '@/components/features/vendor/VendorCustomerDataTable'
import { VendorLayout } from '@/components/features/vendor/VendorLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, UserPlus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchVendorCustomerStats } from '@/lib/api/vendor/customers'
import { useVendor } from '@/hooks/use-vendor'

interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  newCustomersThisMonth: number
  totalRevenue: number
  statusBreakdown: Record<string, number>
}

export default function VendorCustomersPage() {
  const { vendorId } = useVendor()
  const [customerStats, setCustomerStats] = useState<CustomerStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomersThisMonth: 0,
    totalRevenue: 0,
    statusBreakdown: {}
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCustomerStats = async () => {
    if (!vendorId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch customer stats
      const stats = await fetchVendorCustomerStats(vendorId)
      setCustomerStats(stats)
    } catch (err) {
      console.error('Error fetching customer stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load customer stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomerStats()
  }, [vendorId])

  if (!vendorId) {
    return (
      <VendorLayout title="Customers" subtitle="Manage your customer relationships">
        <div className="p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout
      title="Customers"
      subtitle="View and manage your customer base and their booking history"
    >
      <div className="p-6 space-y-6">
        {/* Stats Cards - Matching Dashboard Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{customerStats.totalCustomers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {customerStats.activeCustomers} active
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{customerStats.activeCustomers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {customerStats.totalCustomers > 0 
                      ? Math.round((customerStats.activeCustomers / customerStats.totalCustomers) * 100)
                      : 0}% of total
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{customerStats.newCustomersThisMonth.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    New customer acquisitions
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer Management Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Customer Management</h2>
            <p className="text-sm text-muted-foreground">
              View detailed information about your customers and their booking history
            </p>
          </div>
          <VendorCustomerDataTable availableStatuses={Object.keys(customerStats.statusBreakdown)} />
        </div>
      </div>
    </VendorLayout>
  )
}