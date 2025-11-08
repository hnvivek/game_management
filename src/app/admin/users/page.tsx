'use client'

import { useState, useEffect } from 'react'
import { UserDataTable } from '@/components/features/admin/UserDataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Users, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import Link from 'next/link'
import { UniversalBreadcrumb } from '@/components/features/admin/UniversalBreadcrumb'
import { fetchAdminUserStats } from '@/lib/api/admin/users'

interface UserStats {
  total: number
  active: number
  inactive: number
  newThisMonth: number
  growth: number
}

export default function UsersPage() {
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0,
    growth: 0
  })
  const [loading, setLoading] = useState(true)

  // Fetch user statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const userStats = await fetchAdminUserStats()
        setStats(userStats)
      } catch (error) {
        console.error('Error fetching user stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <UniversalBreadcrumb />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.newThisMonth} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.active.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.inactive.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? ((stats.inactive / stats.total) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : `+${stats.growth}%`}</div>
              <p className="text-xs text-muted-foreground">
                Compared to last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">User Directory</h2>
            <p className="text-sm text-muted-foreground">
              Manage all user accounts and their permissions
            </p>
          </div>
          <Link href="/admin/users/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </Link>
        </div>

        {/* User Table */}
        <UserDataTable />
    </div>
  )
}