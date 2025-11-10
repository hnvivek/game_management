'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { VendorLayout } from '@/components/features/vendor/VendorLayout'
import { VendorBreadcrumb } from '@/components/features/vendor/VendorBreadcrumb'
import { useVendor } from '@/hooks/use-vendor'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Save,
  ArrowLeft,
  Building,
  Plus,
  Edit,
  Users,
  Circle,
  Settings
} from 'lucide-react'

interface Court {
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
}

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
  countryCode: string
  currencyCode: string
  isActive: boolean
  featuredImage?: string
  courts?: Court[]
  operatingHours?: Array<{
    dayOfWeek: number
    openingTime: string
    closingTime: string
    isOpen: boolean
  }>
}

interface Country {
  code: string
  name: string
  currencyCode: string
}

// Common countries with their currency codes
const countries: Country[] = [
  { code: 'US', name: 'United States', currencyCode: 'USD' },
  { code: 'GB', name: 'United Kingdom', currencyCode: 'GBP' },
  { code: 'CA', name: 'Canada', currencyCode: 'CAD' },
  { code: 'AU', name: 'Australia', currencyCode: 'AUD' },
  { code: 'IN', name: 'India', currencyCode: 'INR' },
  { code: 'AE', name: 'United Arab Emirates', currencyCode: 'AED' },
  { code: 'SG', name: 'Singapore', currencyCode: 'SGD' },
  { code: 'MY', name: 'Malaysia', currencyCode: 'MYR' },
  { code: 'TH', name: 'Thailand', currencyCode: 'THB' },
  { code: 'PH', name: 'Philippines', currencyCode: 'PHP' },
]

// Common timezones
const timezones = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Asia/Bangkok',
  'Asia/Manila',
  'Australia/Sydney',
]

export default function EditVenuePage() {
  const params = useParams()
  const router = useRouter()
  const { vendorId } = useVendor()
  const { toast } = useToast()
  const venueId = params?.venueId as string

  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
    timezone: 'Asia/Kolkata',
    countryCode: 'IN',
    currencyCode: 'INR',
    featuredImage: '',
    isActive: true,
  })

  const [operatingHours, setOperatingHours] = useState([
    { dayOfWeek: 1, dayName: 'Monday', openingTime: '09:00', closingTime: '21:00', isOpen: true },
    { dayOfWeek: 2, dayName: 'Tuesday', openingTime: '09:00', closingTime: '21:00', isOpen: true },
    { dayOfWeek: 3, dayName: 'Wednesday', openingTime: '09:00', closingTime: '21:00', isOpen: true },
    { dayOfWeek: 4, dayName: 'Thursday', openingTime: '09:00', closingTime: '21:00', isOpen: true },
    { dayOfWeek: 5, dayName: 'Friday', openingTime: '09:00', closingTime: '21:00', isOpen: true },
    { dayOfWeek: 6, dayName: 'Saturday', openingTime: '08:00', closingTime: '22:00', isOpen: true },
    { dayOfWeek: 0, dayName: 'Sunday', openingTime: '08:00', closingTime: '20:00', isOpen: true },
  ])

  useEffect(() => {
    if (vendorId && venueId) {
      fetchVenueDetails()
    }
  }, [vendorId, venueId])

  useEffect(() => {
    if (venue) {
      // Validate timezone - ensure it exists in our timezones array, otherwise use default
      let validTimezone = 'Asia/Kolkata'
      if (venue.timezone && venue.timezone.trim() !== '' && timezones.includes(venue.timezone)) {
        validTimezone = venue.timezone
      }
      
      setFormData({
        name: venue.name || '',
        description: venue.description || '',
        address: venue.address || '',
        city: venue.city || '',
        postalCode: venue.postalCode || '',
        phone: venue.phone || '',
        email: venue.email || '',
        website: venue.website || '',
        timezone: validTimezone,
        countryCode: venue.countryCode || 'IN',
        currencyCode: venue.currencyCode || 'INR',
        featuredImage: venue.featuredImage || '',
        isActive: venue.isActive,
      })

      // Load existing operating hours from the venue data
      if (venue.operatingHours && venue.operatingHours.length > 0) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const loadedHours = venue.operatingHours.map((hours: any) => ({
          dayOfWeek: hours.dayOfWeek,
          dayName: dayNames[hours.dayOfWeek],
          openingTime: hours.openingTime,
          closingTime: hours.closingTime,
          isOpen: hours.isOpen
        }))
        setOperatingHours(loadedHours)
      }
    }
  }, [venue])

  const fetchVenueDetails = async () => {
    if (!vendorId || !venueId) return

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
          setError('Access denied. You can only edit venues you manage.')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorId || !venueId) return

    setSaving(true)

    try {
      const submitData = {
        ...formData,
        operatingHours: operatingHours
      }

      const response = await fetch(`/api/vendors/${vendorId}/venues/${venueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to update venue')
      }

      const result = await response.json()
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Venue updated successfully!',
        })
        router.push(`/vendor/venues/${venueId}`)
      } else {
        throw new Error(result.error?.message || 'Failed to update venue')
      }
    } catch (error: any) {
      console.error('Error updating venue:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update venue',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode)
    if (country) {
      setFormData(prev => ({
        ...prev,
        countryCode,
        currencyCode: country.currencyCode
      }))
    }
  }

  const handleOperatingHoursChange = (dayOfWeek: number, field: 'openingTime' | 'closingTime' | 'isOpen', value: string | boolean) => {
    setOperatingHours(prev =>
      prev.map(hours =>
        hours.dayOfWeek === dayOfWeek
          ? { ...hours, [field]: value }
          : hours
      )
    )
  }

  if (loading) {
    return (
      <VendorLayout title="Edit Venue" subtitle="Loading venue details...">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </VendorLayout>
    )
  }

  if (error || !venue) {
    return (
      <VendorLayout title="Edit Venue" subtitle="Error loading venue">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-red-600">{error || 'Venue not found'}</p>
            </CardContent>
          </Card>
        </div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout title="Edit Venue" subtitle={`${venue.name} • ${venue.city || 'No location specified'}`}>
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <VendorBreadcrumb />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/vendor/venues/${venueId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Venue Details
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Essential details about this venue</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Venue Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter venue name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the venue, facilities, and amenities..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Street address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="City"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        placeholder="Postal code"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="venue@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="featuredImage">Featured Image URL</Label>
                    <Input
                      id="featuredImage"
                      type="url"
                      value={formData.featuredImage}
                      onChange={(e) => handleInputChange('featuredImage', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Operating Hours */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Operating Hours</CardTitle>
                      <CardDescription>
                        Set your weekly operating schedule
                        {formData.timezone && (
                          <span className="block text-xs mt-1">
                            All times are in {formData.timezone}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    {formData.timezone && (
                      <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        🕐 {formData.timezone}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {operatingHours.map((hours) => (
                      <div key={hours.dayOfWeek} className="flex items-center gap-4 pb-3 border-b last:border-b-0">
                        <div className="w-20 font-medium">{hours.dayName}</div>
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={hours.isOpen ? hours.openingTime : ''}
                            onChange={(e) => handleOperatingHoursChange(hours.dayOfWeek, 'openingTime', e.target.value)}
                            disabled={!hours.isOpen}
                            className="w-32"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={hours.isOpen ? hours.closingTime : ''}
                            onChange={(e) => handleOperatingHoursChange(hours.dayOfWeek, 'closingTime', e.target.value)}
                            disabled={!hours.isOpen}
                            className="w-32"
                          />
                        </div>
                        <Switch
                          checked={hours.isOpen}
                          onCheckedChange={(checked) => handleOperatingHoursChange(hours.dayOfWeek, 'isOpen', checked)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Courts Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Courts Management</CardTitle>
                      <CardDescription>Manage courts for this venue</CardDescription>
                    </div>
                    <Link href={`/vendor/venues/${venueId}/courts/new`}>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Court
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {venue?.courts && venue.courts.length > 0 ? (
                    <div className="space-y-4">
                      {venue.courts.map((court) => (
                        <div key={court.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
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
                            </div>
                            <div className="flex items-center gap-2">
                              <Link href={`/vendor/venues/${venueId}/courts/${court.id}/edit`}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            {court.supportedFormats && court.supportedFormats.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>
                                  {court.supportedFormats.map(sf => 
                                    `${sf.format.minPlayers}-${sf.format.maxPlayers} players`
                                  ).join(', ')}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <span>{new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: formData.currencyCode || 'INR',
                                minimumFractionDigits: 0,
                              }).format(Number(court.pricePerHour))}/hour</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Circle className="h-3 w-3" />
                              <span>{court.sport.icon}</span>
                            </div>
                            {court.surface && (
                              <span>Surface: {court.surface}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No courts yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Get started by adding your first court to this venue
                      </p>
                      <Link href={`/vendor/venues/${venueId}/courts/new`}>
                        <Button variant="outline">
                          <Plus className="mr-2 h-4 w-4" />
                          Add First Court
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                  <CardDescription>Control venue visibility</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="isActive">Active Venue</Label>
                      <p className="text-sm text-muted-foreground">
                        {formData.isActive ? 'Venue is visible and bookable' : 'Venue is hidden from customers'}
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Location Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Location Settings</CardTitle>
                  <CardDescription>Country and currency preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="countryCode">Country</Label>
                    <Select
                      value={formData.countryCode}
                      onValueChange={handleCountryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="currencyCode">Currency</Label>
                    <Select
                      value={formData.currencyCode}
                      onValueChange={(value) => handleInputChange('currencyCode', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.currencyCode} value={country.currencyCode}>
                            {country.currencyCode} - {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={formData.timezone || 'Asia/Kolkata'}
                      onValueChange={(value) => handleInputChange('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((timezone) => (
                          <SelectItem key={timezone} value={timezone}>
                            {timezone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Saving changes...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/vendor/venues/${venueId}`)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </VendorLayout>
  )
}
