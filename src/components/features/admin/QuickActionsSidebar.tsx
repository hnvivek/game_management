'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Edit,
  Eye,
  Settings,
  Calendar,
  BarChart3,
  Users,
  MapPin,
  Circle,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Download,
  Upload
} from 'lucide-react'
import Link from 'next/link'

interface QuickActionsSidebarProps {
  vendorId?: string
  venueId?: string
  courtId?: string
  vendorName?: string
  venueName?: string
  courtName?: string
  type: 'vendor' | 'venue' | 'court' | 'dashboard'
}

interface QuickAction {
  label: string
  href?: string
  icon: any
  variant?: 'default' | 'secondary' | 'outline'
  badge?: string
  description?: string
}

export function QuickActionsSidebar({
  vendorId,
  venueId,
  courtId,
  vendorName,
  venueName,
  courtName,
  type
}: QuickActionsSidebarProps) {

  const getQuickActions = (): QuickAction[] => {
    switch (type) {
      case 'vendor':
        return [
          {
            label: 'Create Venue',
            href: `/admin/vendors/${vendorId}/venues/create`,
            icon: Plus,
            description: 'Add a new venue'
          },
          {
            label: 'View All Venues',
            href: `/admin/vendors/${vendorId}/venues`,
            icon: MapPin,
            badge: '12',
            description: 'Manage all venues'
          },
          {
            label: 'Vendor Analytics',
            href: `/admin/vendors/${vendorId}/analytics`,
            icon: BarChart3,
            description: 'View performance metrics'
          },
          {
            label: 'Vendor Profile',
            href: `/admin/vendors/${vendorId}/profile`,
            icon: Users,
            description: 'Edit vendor information'
          },
          {
            label: 'Export Data',
            href: `/admin/vendors/${vendorId}/export`,
            icon: Download,
            variant: 'outline',
            description: 'Download vendor data'
          }
        ]

      case 'venue':
        return [
          {
            label: 'Create Court',
            href: `/admin/vendors/${vendorId}/venues/${venueId}/courts/new`,
            icon: Plus,
            description: 'Add a new court'
          },
          {
            label: 'Edit Venue',
            href: `/admin/vendors/${vendorId}/venues/${venueId}/edit`,
            icon: Edit,
            description: 'Update venue details'
          },
          {
            label: 'View All Courts',
            href: `/admin/vendors/${vendorId}/venues/${venueId}`,
            icon: Circle,
            badge: '8',
            description: 'Manage courts'
          },
          {
            label: 'Venue Calendar',
            href: `/admin/vendors/${vendorId}/venues/${venueId}/calendar`,
            icon: Calendar,
            description: 'View booking schedule'
          },
          {
            label: 'Venue Analytics',
            href: `/admin/vendors/${vendorId}/venues/${venueId}/analytics`,
            icon: TrendingUp,
            description: 'View performance metrics'
          },
          {
            label: 'Venue Settings',
            href: `/admin/vendors/${vendorId}/venues/${venueId}/settings`,
            icon: Settings,
            variant: 'outline',
            description: 'Configure venue'
          }
        ]

      case 'court':
        return [
          {
            label: 'Edit Court',
            href: `/admin/vendors/${vendorId}/venues/${venueId}/courts/${courtId}/edit`,
            icon: Edit,
            description: 'Update court details'
          },
          {
            label: 'View Schedule',
            href: `/admin/vendors/${vendorId}/venues/${venueId}/courts/${courtId}/schedule`,
            icon: Calendar,
            description: 'View booking schedule'
          },
          {
            label: 'Court Analytics',
            href: `/admin/vendors/${vendorId}/venues/${venueId}/courts/${courtId}/analytics`,
            icon: BarChart3,
            description: 'View utilization metrics'
          },
          {
            label: 'Court Settings',
            href: `/admin/vendors/${vendorId}/venues/${venueId}/courts/${courtId}/settings`,
            icon: Settings,
            variant: 'outline',
            description: 'Configure court'
          }
        ]

      case 'dashboard':
      default:
        return [
          {
            label: 'Create Venue',
            href: '/admin/venues/create',
            icon: Plus,
            description: 'Add new venue'
          },
          {
            label: 'Create Court',
            href: '/admin/courts/create',
            icon: Plus,
            description: 'Add new court'
          },
          {
            label: 'All Venues',
            href: '/admin/venues',
            icon: MapPin,
            badge: '12',
            description: 'Manage venues'
          },
          {
            label: 'All Courts',
            href: '/admin/courts',
            icon: Circle,
            badge: '45',
            description: 'Manage courts'
          },
          {
            label: 'Vendor Approval',
            href: '/admin/vendors/approval',
            icon: CheckCircle,
            badge: '3',
            description: 'Pending approvals'
          },
          {
            label: 'System Alerts',
            href: '/admin/alerts',
            icon: AlertCircle,
            badge: '2',
            description: 'Active alerts'
          }
        ]
    }
  }

  const quickActions = getQuickActions()

  const getStatusInfo = () => {
    switch (type) {
      case 'vendor':
        return {
          title: vendorName || 'Vendor Management',
          subtitle: 'Manage venues and settings',
          status: 'Active',
          statusColor: 'bg-green-500'
        }
      case 'venue':
        return {
          title: venueName || 'Venue Management',
          subtitle: `Under ${vendorName || 'Vendor'}`,
          status: 'Active',
          statusColor: 'bg-green-500'
        }
      case 'court':
        return {
          title: courtName || 'Court Management',
          subtitle: `At ${venueName || 'Venue'}`,
          status: 'Available',
          statusColor: 'bg-blue-500'
        }
      default:
        return {
          title: 'Quick Actions',
          subtitle: 'Common tasks and shortcuts',
          status: 'Ready',
          statusColor: 'bg-gray-500'
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{statusInfo.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{statusInfo.subtitle}</p>
            </div>
            <div className={`w-2 h-2 rounded-full ${statusInfo.statusColor}`} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{statusInfo.status}</span>
            {type !== 'dashboard' && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Live
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            const ButtonComponent = action.href ? Link : Button

            return (
              <ButtonComponent
                key={index}
                href={action.href}
                variant={action.variant || 'secondary'}
                size="sm"
                className="w-full justify-start h-auto p-3"
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{action.label}</span>
                      {action.badge && (
                        <Badge variant="secondary" className="text-xs h-5 px-1.5">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    {action.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {action.description}
                      </p>
                    )}
                  </div>
                </div>
              </ButtonComponent>
            )
          })}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">New booking created</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Venue updated</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">New vendor registered</p>
                <p className="text-xs text-muted-foreground">3 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}