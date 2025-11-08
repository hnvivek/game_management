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
import { Skeleton } from '@/components/ui/skeleton'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { AdminPageSkeleton } from '@/components/features/admin/AdminPageSkeleton'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { UniversalBreadcrumb } from '@/components/features/admin/UniversalBreadcrumb'

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
}

export default function EditVendorPage() {
  const params = useParams()
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  const handleInputChange = (field: keyof Vendor, value: string | boolean) => {
    if (!vendor) return
    setVendor({ ...vendor, [field]: value })
  }

  const handleSave = async () => {
    if (!vendor) return

    try {
      setSaving(true)

      const response = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: vendor.name,
          description: vendor.description || '',
          website: vendor.website || '',
          phoneCountryCode: vendor.phoneCountryCode || '',
          phoneNumber: vendor.phoneNumber || '',
          address: vendor.address || '',
          postalCode: vendor.postalCode || '',
          country: vendor.country || '',
          state: vendor.state || '',
          city: vendor.city || '',
          countryCode: vendor.countryCode || '',
          isActive: vendor.isActive,
          autoApprove: vendor.autoApprove
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to update vendor')
        return
      }

      const result = await response.json()
      if (result.success) {
        toast.success('Vendor updated successfully')
        setVendor(result.data)
      } else {
        toast.error(result.error || 'Failed to update vendor')
      }
    } catch (error) {
      console.error('Error updating vendor:', error)
      toast.error('Error updating vendor')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (loading) {
    return (
      <AdminPageSkeleton
        title="Edit Vendor"
        subtitle="Loading vendor details..."
        showBasicInfo={true}
        showContactInfo={true}
        showOperatingHours={false}
        showSidebar={false} // Sidebar is handled by persistent layout
      />
    )
  }

  if (error || !vendor) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Vendor Not Found</h3>
        <p className="text-muted-foreground mb-4">
          {error || 'The vendor you\'re looking for doesn\'t exist or you don\'t have access to it.'}
        </p>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
        {/* Breadcrumb */}
        <UniversalBreadcrumb />

        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Vendor</h1>
              <p className="text-muted-foreground">
                {vendor.name}
              </p>
            </div>
          </div>

        {/* Edit Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Update the basic details about this vendor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Vendor Name *</Label>
                  <Input
                    id="name"
                    value={vendor.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Vendor name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={vendor.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={vendor.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Tell us about this vendor..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={vendor.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Update contact details for this vendor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phoneCountryCode">Country Code</Label>
                    <Input
                      id="phoneCountryCode"
                      value={vendor.phoneCountryCode || ''}
                      onChange={(e) => handleInputChange('phoneCountryCode', e.target.value)}
                      placeholder="+1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={vendor.phoneNumber || ''}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={vendor.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Street address"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={vendor.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={vendor.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={vendor.postalCode || ''}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="Postal code"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={vendor.country || ''}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="Country"
                    />
                  </div>
                  <div>
                    <Label htmlFor="countryCode">Country Code (2 letters)</Label>
                    <Input
                      id="countryCode"
                      value={vendor.countryCode || ''}
                      onChange={(e) => handleInputChange('countryCode', e.target.value)}
                      placeholder="US"
                      maxLength={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Vendor Settings</CardTitle>
                <CardDescription>Configure vendor behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Active Status</Label>
                    <p className="text-sm text-muted-foreground">Vendor can operate and receive bookings</p>
                  </div>
                  <Switch
                    checked={vendor.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Approve</Label>
                    <p className="text-sm text-muted-foreground">Automatically approve new bookings</p>
                  </div>
                  <Switch
                    checked={vendor.autoApprove}
                    onCheckedChange={(checked) => handleInputChange('autoApprove', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Save or cancel your changes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full"
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
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="w-full"
                >
                  Cancel
                </Button>
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
        </div>
      </div>
  )
}