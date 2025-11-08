'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Building,
  Users,
  Calendar,
  Edit,
    Settings,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'
import { UniversalBreadcrumb } from '@/components/features/admin/UniversalBreadcrumb'

interface Venue {
  id: string
  name: string
  description?: string
  address?: string
  city?: string
  postalCode?: string
  phone?: string
  email?: string
  website?: string
  isActive: boolean
  createdAt: string
  courts: {
    total: number
    active: number
  }
}

interface Vendor {
  id: string
  name: string
  email: string
  phoneCountryCode?: string
  phoneNumber?: string
  description?: string
  website?: string
  address?: string
  postalCode?: string
  country?: string
  state?: string
  city?: string
  countryCode?: string
  isActive: boolean
  autoApprove: boolean
  createdAt: string
  updatedAt: string
  stats: {
    venues: {
      total: number
      active: number
    }
    staff: number
    bookings: number
  }
}

export default function VendorDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [recentVenues, setRecentVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { vendorId } = params as { vendorId: string }

  useEffect(() => {
    fetchVendorDetails()
  }, [vendorId])

  const fetchVendorDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/vendors/${vendorId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 404) {
          setError('Vendor not found')
        } else if (response.status === 403) {
          setError('Access denied')
        } else {
          setError('Failed to fetch vendor details')
        }
        return
      }

      const result = await response.json()
      if (result.success) {
        setVendor(result.data)
        // Fetch recent venues for summary (limit to 5 most recent)
        fetchRecentVenues()
      } else {
        setError(result.error || 'Failed to fetch vendor details')
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error)
      setError('Error fetching vendor details')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentVenues = async () => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/venues?limit=5&sortBy=createdAt&sortOrder=desc`, {
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          // Show only first 5 venues (most recent)
          setRecentVenues(Array.isArray(result.data) ? result.data.slice(0, 5) : [])
        }
      }
    } catch (error) {
      console.error('Error fetching recent venues:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <UniversalBreadcrumb />
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !vendor) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <UniversalBreadcrumb />
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error || 'Vendor not found'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatPhoneNumber = () => {
    if (!vendor.phoneNumber) return 'Not provided'
    const countryCode = vendor.phoneCountryCode || '+1'
    return `${countryCode} ${vendor.phoneNumber}`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <UniversalBreadcrumb />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{vendor.name}</h1>
          <p className="text-muted-foreground">
            {vendor.city || 'No location specified'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={vendor.isActive ? 'default' : 'secondary'}>
            {vendor.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Link href={`/admin/vendors/${vendorId}/edit`}>
            <Button size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Vendor
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Venues</p>
                <p className="text-2xl font-bold">{vendor.stats.venues.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Active Venues</p>
                <p className="text-2xl font-bold">{vendor.stats.venues.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Staff Members</p>
                <p className="text-2xl font-bold">{vendor.stats.staff}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Bookings</p>
                <p className="text-2xl font-bold">{vendor.stats.bookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
              <CardDescription>Basic details about this vendor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {vendor.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{vendor.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{vendor.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatPhoneNumber()}</span>
                </div>
                {vendor.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {vendor.website}
                    </a>
                  </div>
                )}
                {vendor.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {vendor.address}
                      {vendor.city && `, ${vendor.city}`}
                      {vendor.state && `, ${vendor.state}`}
                      {vendor.country && `, ${vendor.country}`}
                      {vendor.postalCode && ` ${vendor.postalCode}`}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Venues Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Venues</CardTitle>
                  <CardDescription>
                    {vendor.stats.venues.total > 0 
                      ? `Showing ${Math.min(recentVenues.length, 5)} of ${vendor.stats.venues.total} venues`
                      : 'No venues yet'}
                  </CardDescription>
                </div>
                <Link href={`/admin/vendors/${vendorId}/venues`}>
                  <Button size="sm">
                    <Building className="h-4 w-4 mr-2" />
                    Manage All Venues
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {vendor.stats.venues.total > 0 ? (
                <div className="space-y-4">
                  {recentVenues.length > 0 ? (
                    <>
                      <div className="space-y-3">
                        {recentVenues.map((venue) => (
                          <div key={venue.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{venue.name}</h4>
                                  <Badge variant={venue.isActive ? 'default' : 'secondary'}>
                                    {venue.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>

                                {venue.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {venue.description}
                                  </p>
                                )}

                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  {venue.city && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      <span>{venue.city}</span>
                                    </div>
                                  )}
                                  {venue.courts && (
                                    <span>{venue.courts.total} courts</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 ml-4">
                                <Link href={`/admin/vendors/${vendorId}/venues/${venue.id}`}>
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {vendor.stats.venues.total > recentVenues.length && (
                        <div className="pt-4 border-t">
                          <Link href={`/admin/vendors/${vendorId}/venues`}>
                            <Button variant="outline" className="w-full">
                              <Building className="h-4 w-4 mr-2" />
                              View All {vendor.stats.venues.total} Venues
                            </Button>
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">Loading venues...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No venues yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by adding the first venue for this vendor
                  </p>
                  <Link href={`/admin/vendors/${vendorId}/venues`}>
                    <Button>
                      <Building className="mr-2 h-4 w-4" />
                      Add First Venue
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href={`/admin/vendors/${vendorId}/venues`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Building className="h-4 w-4 mr-2" />
                    Manage Venues
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Staff
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Bookings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Settings</CardTitle>
              <CardDescription>Configuration status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={vendor.isActive ? 'default' : 'secondary'}>
                  {vendor.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auto Approve</span>
                <Badge variant={vendor.autoApprove ? 'default' : 'secondary'}>
                  {vendor.autoApprove ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Country Code</span>
                <span>{vendor.countryCode || 'Not set'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Details */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Details</CardTitle>
              <CardDescription>Additional information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor ID</span>
                <span className="font-mono text-xs">{vendor.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(vendor.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{new Date(vendor.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div> {/* Close grid container */}
    </div>
  )
}