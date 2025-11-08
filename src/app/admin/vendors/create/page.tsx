'use client'

import { useState, useCallback, useMemo } from 'react'
import { LocationSelector } from '@/components/features/admin/LocationSelector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Country } from 'country-state-city'

export default function CreateVendorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneCountryCode: '+1',
    phoneNumber: '',
    description: '',
    website: '',
    address: '',
    postalCode: '',
    // Location fields will be handled by LocationSelector
    country: '',
    state: '',
    city: '',
    countryCode: '',
    isActive: true,
    autoApprove: false
  })
  const [validationErrors, setValidationErrors] = useState<{
    name?: string
    email?: string
    phoneNumber?: string
    website?: string
    countryCode?: string
  }>({})
  const [touchedFields, setTouchedFields] = useState<{
    name?: boolean
    email?: boolean
    phoneNumber?: boolean
    website?: boolean
  }>({})
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')

  // Dynamic country code options from country-state-city library
  const countryPhoneCodes = useMemo(() => {
    try {
      const countries = Country.getAllCountries()

      // Get countries with phone codes, format phone codes consistently
      const countryOptions = countries
        .filter(country => country.phonecode)
        .map(country => ({
          isoCode: country.isoCode,
          name: country.name,
          phoneCode: country.phonecode.startsWith('+') ? country.phonecode : `+${country.phonecode}`
        }))
        .sort((a, b) => a.name.localeCompare(b.name))

      // Remove duplicates based on phone code, keeping the first occurrence
      const uniqueCountryOptions = countryOptions.filter((country, index, self) =>
        index === self.findIndex((c) => c.phoneCode === country.phoneCode)
      )

      return uniqueCountryOptions
    } catch (error) {
      // Fallback to basic options if there's an error
      return [
        { isoCode: 'US', name: 'United States', phoneCode: '+1' },
        { isoCode: 'GB', name: 'United Kingdom', phoneCode: '+44' },
        { isoCode: 'IN', name: 'India', phoneCode: '+91' }
      ]
    }
  }, [])

  // Validation functions
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Vendor name is required'
        if (value.trim().length < 2) return 'Vendor name must be at least 2 characters'
        if (value.trim().length > 100) return 'Vendor name must be less than 100 characters'
        return undefined

      case 'email':
        if (!value.trim()) return 'Email address is required'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return 'Please enter a valid email address'
        return undefined

      case 'phoneNumber':
        if (value && !/^\d{7,15}$/.test(value.replace(/\D/g, ''))) {
          return 'Phone number must be 7-15 digits'
        }
        return undefined

      case 'website':
        if (value && value.trim()) {
          try {
            new URL(value)
          } catch {
            return 'Please enter a valid website URL (e.g., https://example.com)'
          }
        }
        return undefined

      default:
        return undefined
    }
  }

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {}

    // Validate required fields
    errors.name = validateField('name', formData.name)
    errors.email = validateField('email', formData.email)
    errors.phoneNumber = validateField('phoneNumber', formData.phoneNumber)
    errors.website = validateField('website', formData.website)
    errors.countryCode = !formData.countryCode ? 'Please select a country' : undefined

    setValidationErrors(errors)

    // Return true if no errors
    return !Object.values(errors).some(error => error !== undefined)
  }

  // Handle location changes from LocationSelector
  const handleLocationChange = useCallback((location: {
    country: string
    state: string
    city: string
    countryCode: string
  }) => {
    setFormData(prev => ({
      ...prev,
      country: location.country,
      state: location.state,
      city: location.city,
      countryCode: location.countryCode
    }))

    // Auto-select phone country code based on selected location
    if (location.countryCode) {
      const selectedCountry = countryPhoneCodes.find(
        country => country.isoCode === location.countryCode
      )
      if (selectedCountry) {
        setFormData(prev => ({
          ...prev,
          phoneCountryCode: selectedCountry.phoneCode
        }))
      }
      // Clear country code error when location is selected
      setValidationErrors(prev => ({ ...prev, countryCode: undefined }))
    }
  }, [countryPhoneCodes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    setTouchedFields({
      name: true,
      email: true,
      phoneNumber: true,
      website: true
    })

    // Validate form
    if (!validateForm()) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phoneCountryCode: formData.phoneCountryCode,
          phoneNumber: formData.phoneNumber,
          description: formData.description,
          website: formData.website || null, // Convert empty string to null
          country: formData.countryCode, // API expects country field
          isActive: formData.isActive,
          password: password || 'tempPassword123', // Default password
        }),
      })

      if (response.ok) {
        router.push('/admin/vendors')
      } else {
        const error = await response.json()
        const errorMessage = error.details || error.message || error.error || 'Unknown error'
        alert('Error creating vendor: ' + errorMessage)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert('Error creating vendor: ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Real-time validation for string fields
    if (typeof value === 'string') {
      const error = validateField(field, value)
      setValidationErrors(prev => ({
        ...prev,
        [field]: error
      }))

      // Mark field as touched when user starts typing
      if (value.trim()) {
        setTouchedFields(prev => ({
          ...prev,
          [field]: true
        }))
      }
    }
  }

  return (
    <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/admin/vendors">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Vendors
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Create New Vendor</h1>
                <p className="text-muted-foreground">Add a new vendor to the platform</p>
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Create Vendor'}
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Vendor Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Sports Complex LLC"
                      className={touchedFields.name && validationErrors.name ? 'border-red-500' : ''}
                      required
                    />
                    {touchedFields.name && validationErrors.name && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="contact@vendor.com"
                      className={touchedFields.email && validationErrors.email ? 'border-red-500' : ''}
                      required
                    />
                    {touchedFields.email && validationErrors.email && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.phoneCountryCode}
                        onValueChange={(value) => handleInputChange('phoneCountryCode', value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select country code" />
                        </SelectTrigger>
                        <SelectContent>
                          {countryPhoneCodes.map((country) => (
                            <SelectItem key={country.isoCode} value={country.phoneCode}>
                              {country.name} ({country.phoneCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="phone"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        placeholder="(555) 123-4567"
                        className={touchedFields.phoneNumber && validationErrors.phoneNumber ? 'border-red-500' : ''}
                      />
                    </div>
                    {touchedFields.phoneNumber && validationErrors.phoneNumber && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.phoneNumber}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://vendor.com"
                      className={touchedFields.website && validationErrors.website ? 'border-red-500' : ''}
                    />
                    {touchedFields.website && validationErrors.website && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.website}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the vendor..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle>Location Information *</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select the vendor's location using professional location data
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <LocationSelector
                  onLocationChange={handleLocationChange}
                  initialCountry=""
                  initialState=""
                  initialCity=""
                />
                {validationErrors.countryCode && (
                  <p className="text-sm text-red-500">{validationErrors.countryCode}</p>
                )}

                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="10001"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="password">Initial Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave empty for default password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Leave empty to use default password: tempPassword123
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Active Vendor</Label>
                    <p className="text-sm text-muted-foreground">
                      Vendor can receive bookings and appear in searches
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoApprove">Auto Approve</Label>
                    <p className="text-sm text-muted-foreground">
                      Skip manual approval process for this vendor
                    </p>
                  </div>
                  <Switch
                    id="autoApprove"
                    checked={formData.autoApprove}
                    onCheckedChange={(checked) => handleInputChange('autoApprove', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end gap-4">
              <Link href="/admin/vendors">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Creating...' : 'Create Vendor'}
              </Button>
            </div>
          </form>
        </div>
      </div>
  )
}