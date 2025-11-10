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
  Clock,
  Calendar,
  Users,
  Building,
  Edit,
  Circle,
  DollarSign
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
  timezone?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  stats: {
    courts: number
    bookings: number
    operatingHours: number
    sports: any[]
  }
  operatingHours: Array<{
    id: string
    dayOfWeek: number
    dayName: string
    openingTime?: string
    closingTime?: string
    isOpen: boolean
  }>
  courts: Array<{
    id: string
    name: string
    courtNumber: string
    description?: string
    surface?: string
    pricePerHour: number
    isActive: boolean
    maxPlayers: number
    sport: {
      id: string
      name: string
      displayName: string
      icon?: string
    }
    supportedFormats?: Array<{
      format: {
        id: string
        name: string
        displayName: string
        minPlayers: number
        maxPlayers: number
      }
      maxSlots: number
    }>
  }>
  vendor: {
    id: string
    name: string
    email: string
    phone?: string
  }
}

export default function VenueDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { vendorId, venueId } = params as { vendorId: string; venueId: string }

  useEffect(() => {
    fetchVenueDetails()
  }, [vendorId, venueId])

  const fetchVenueDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/vendors/${vendorId}/venues/${venueId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 404) {
          setError('Venue not found')
        } else if (response.status === 403) {
          setError('Access denied. You can only view venues you manage.')
        } else {
          setError('Failed to fetch venue details')
        }
        return
      }

      const result = await response.json()
      if (result.success) {
        setVenue(result.data)
      } else {
        setError(result.error?.message || 'Failed to fetch venue details')
      }
    } catch (error) {
      console.error('Error fetching venue details:', error)
      setError('Error fetching venue details')
    } finally {
      setLoading(false)
    }
  }

  const toggleVenueStatus = async () => {
    if (!venue) return

    try {
      const response = await fetch(`/api/vendors/${vendorId}/venues/${venueId}/toggle-status`, {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        toast.error('Failed to update venue status')
        return
      }

      const result = await response.json()
      if (result.success) {
        toast.success(result.meta?.message || 'Venue status updated successfully')
        fetchVenueDetails() // Refresh data
      } else {
        toast.error(result.error?.message || 'Failed to update venue status')
      }
    } catch (error) {
      console.error('Error toggling venue status:', error)
      toast.error('Error updating venue status')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !venue) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error || 'Venue not found'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <UniversalBreadcrumb />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{venue.name}</h1>
          <p className="text-muted-foreground">
            {venue.vendor.name} • {venue.city || 'No location specified'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={venue.isActive ? 'default' : 'secondary'}>
            {venue.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleVenueStatus}
          >
            {venue.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Link href={`/admin/vendors/${vendorId}/venues`}>
            <Button variant="outline" size="sm">
              <Building className="h-4 w-4 mr-2" />
              All Venues
            </Button>
          </Link>
          <Link href={`/admin/vendors/${vendorId}/venues/${venueId}/edit`}>
            <Button size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Venue
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Courts</p>
                <p className="text-2xl font-bold">{venue.stats.courts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Bookings</p>
                <p className="text-2xl font-bold">{venue.stats.bookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Circle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Sports</p>
                <p className="text-2xl font-bold">{venue.stats.sports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Operating Days</p>
                <p className="text-2xl font-bold">{venue.stats.operatingHours}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Venue Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Venue Information</CardTitle>
              <CardDescription>Basic details about this venue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {venue.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{venue.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {venue.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{venue.address}</span>
                  </div>
                )}
                {venue.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{venue.phone}</span>
                  </div>
                )}
                {venue.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{venue.email}</span>
                  </div>
                )}
                {venue.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {venue.website}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Courts */}
          <Card>
            <CardHeader>
              <CardTitle>Courts ({venue.courts.length})</CardTitle>
              <CardDescription>All courts available at this venue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {venue.courts.map((court) => (
                  <Card key={court.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{court.name}</h4>
                          <Badge variant="outline">{court.courtNumber}</Badge>
                          {!court.isActive && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {court.sport.displayName}
                          {court.supportedFormats && court.supportedFormats.length > 0 && (
                            <> • {court.supportedFormats.map(sf => sf.format.displayName).join(', ')}</>
                          )}
                        </p>
                        {court.description && (
                          <p className="text-sm text-muted-foreground">{court.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {court.supportedFormats && court.supportedFormats.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>
                                {court.supportedFormats.map(sf => 
                                  `${sf.format.minPlayers}-${sf.format.maxPlayers} players`
                                ).join(', ')}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>${court.pricePerHour}/hour</span>
                          </div>
                        </div>
                        {court.surface && (
                          <p className="text-sm text-muted-foreground">
                            Surface: {court.surface}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Operating Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Operating Hours</CardTitle>
              <CardDescription>Weekly schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {venue.operatingHours.map((hours) => (
                  <div key={hours.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{hours.dayName}</span>
                    {hours.isOpen ? (
                      <span className="text-green-600">
                        {hours.openingTime} - {hours.closingTime}
                      </span>
                    ) : (
                      <span className="text-red-600">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sports Available */}
          <Card>
            <CardHeader>
              <CardTitle>Sports Available</CardTitle>
              <CardDescription>Sports offered at this venue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {venue.stats.sports.map((sport) => (
                  <Badge key={sport.id} variant="secondary">
                    {sport.displayName}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Venue Details */}
          <Card>
            <CardHeader>
              <CardTitle>Venue Details</CardTitle>
              <CardDescription>Additional information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={venue.isActive ? 'default' : 'secondary'}>
                  {venue.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Timezone</span>
                <span>{venue.timezone || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(venue.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{new Date(venue.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  </div>
  )
}