'use client'

import { useState, useEffect, useCallback } from 'react'
import { VendorLayout } from '@/components/features/vendor/VendorLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useVendor } from '@/hooks/use-vendor'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import {
  CreditCard,
  DollarSign,
  Users,
  FileText,
  Key,
  Smartphone,
  Mail,
  Save,
  Upload,
  MapPin,
  Phone,
  Store,
  Edit,
  Camera,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface VendorSettingsData {
  profile: {
    name: string
    description?: string
    logoUrl?: string
    website?: string
    phoneCountryCode?: string
    phoneNumber?: string
    email: string
    currencyCode: string
    timezone: string
    primaryColor?: string
    secondaryColor?: string
    accentColor?: string
  }
  address?: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  emailNotifications?: {
    newBookings?: boolean
    bookingCancellations?: boolean
    paymentConfirmations?: boolean
    weeklyReports?: boolean
    marketingUpdates?: boolean
  }
  smsNotifications?: {
    newBookings?: boolean
    bookingCancellations?: boolean
    urgentAlerts?: boolean
    silentHours?: boolean
  }
  businessHours?: {
    [key: string]: { open: string; close: string; isOpen: boolean }
  }
  paymentSettings?: {
    acceptedPaymentMethods?: string[]
    preferredPaymentMethod?: string
    payoutSchedule?: string
    refundPolicy?: string
  }
  taxInformation?: {
    taxId?: string
    taxRate?: number
  }
  defaultOperatingHours?: Array<{
    dayOfWeek: number
    openingTime: string
    closingTime: string
    isOpen: boolean
  }>
}

export default function VendorSettingsPage() {
  const { vendorId, user } = useVendor()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('general')
  const [vendorData, setVendorData] = useState<VendorSettingsData | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Change Password Modal State
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Fetch vendor settings from API
  const fetchSettings = useCallback(async () => {
    if (!vendorId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/vendors/${vendorId}/settings`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const result = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response format')
      }

      const data = result.data

      // Transform API response to form data structure
      const transformedData: VendorSettingsData = {
        profile: {
          name: data.profile?.name || '',
          description: data.profile?.description || '',
          logoUrl: data.profile?.logoUrl || '',
          website: data.profile?.website || '',
          phoneCountryCode: data.profile?.phoneCountryCode || '',
          phoneNumber: data.profile?.phoneNumber || '',
          email: data.profile?.email || '',
          currencyCode: data.profile?.currencyCode || 'USD',
          timezone: data.profile?.timezone || 'America/Los_Angeles',
          primaryColor: data.profile?.primaryColor,
          secondaryColor: data.profile?.secondaryColor,
          accentColor: data.profile?.accentColor
        },
        address: {
          street: data.profile?.address || '',
          city: data.profile?.city || '',
          state: data.profile?.state || '',
          postalCode: data.profile?.postalCode || '',
          country: data.profile?.country || ''
        },
        emailNotifications: {
          newBookings: data.emailNotifications?.newBookings ?? true,
          bookingCancellations: data.emailNotifications?.bookingCancellations ?? true,
          paymentConfirmations: data.emailNotifications?.paymentConfirmations ?? true,
          weeklyReports: data.emailNotifications?.staffUpdates ?? false,
          marketingUpdates: data.emailNotifications?.marketingEmails ?? false
        },
        smsNotifications: {
          newBookings: data.smsNotifications?.newBookings ?? false,
          bookingCancellations: data.smsNotifications?.bookingCancellations ?? false,
          urgentAlerts: data.smsNotifications?.urgentAlerts ?? false,
          silentHours: data.smsNotifications?.silentHours ?? false
        },
        businessHours: convertOperatingHoursToForm(data.defaultOperatingHours || []),
        paymentSettings: {
          acceptedPaymentMethods: data.paymentSettings?.acceptedPaymentMethods || ['credit_card', 'debit_card'],
          preferredPaymentMethod: 'bank_transfer',
          payoutSchedule: 'weekly',
          refundPolicy: data.paymentSettings?.refundPolicy || '24h'
        },
        taxInformation: {
          taxId: data.taxId || '',
          taxRate: data.taxRate ? parseFloat(data.taxRate.toString()) : 0
        }
      }

      setVendorData(transformedData)
    } catch (err) {
      console.error('Error fetching settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [vendorId])

  // Convert operating hours from API format to form format
  const convertOperatingHoursToForm = (hours: Array<{ dayOfWeek: number; openingTime: string; closingTime: string; isOpen: boolean }>) => {
    const result: { [key: string]: { open: string; close: string; isOpen: boolean } } = {}
    
    DAYS_OF_WEEK.forEach((day, index) => {
      const hourData = hours.find(h => h.dayOfWeek === index)
      result[day] = {
        open: hourData?.openingTime || '09:00',
        close: hourData?.closingTime || '18:00',
        isOpen: hourData?.isOpen ?? true
      }
    })
    
    return result
  }

  // Convert form format to API format
  const convertFormToOperatingHours = (hours: { [key: string]: { open: string; close: string; isOpen: boolean } }) => {
    return DAYS_OF_WEEK.map((day, index) => ({
      dayOfWeek: index,
      openingTime: hours[day]?.open || '09:00',
      closingTime: hours[day]?.close || '18:00',
      isOpen: hours[day]?.isOpen ?? true
    }))
  }

  // Save settings to API
  const saveSettings = useCallback(async (data: VendorSettingsData) => {
    if (!vendorId || !data) return

    try {
      setSaving(true)
      setError(null)

      const payload: any = {
        name: data.profile.name,
        description: data.profile.description,
        logoUrl: data.profile.logoUrl,
        website: data.profile.website,
        phoneCountryCode: data.profile.phoneCountryCode,
        phoneNumber: data.profile.phoneNumber,
        email: data.profile.email,
        currencyCode: data.profile.currencyCode,
        timezone: data.profile.timezone,
        address: data.address?.street,
        city: data.address?.city,
        state: data.address?.state,
        postalCode: data.address?.postalCode,
        country: data.address?.country,
        businessHours: convertFormToOperatingHours(data.businessHours || {}),
        emailNotifications: {
          newBookings: data.emailNotifications?.newBookings,
          bookingCancellations: data.emailNotifications?.bookingCancellations,
          paymentConfirmations: data.emailNotifications?.paymentConfirmations,
          staffUpdates: data.emailNotifications?.weeklyReports,
          marketingEmails: data.emailNotifications?.marketingUpdates
        },
        smsNotifications: {
          newBookings: data.smsNotifications?.newBookings,
          bookingCancellations: data.smsNotifications?.bookingCancellations,
          urgentAlerts: data.smsNotifications?.urgentAlerts,
          silentHours: data.smsNotifications?.silentHours
        },
        paymentSettings: {
          acceptedPaymentMethods: data.paymentSettings?.acceptedPaymentMethods,
          refundPolicy: data.paymentSettings?.refundPolicy
        },
        taxId: data.taxInformation?.taxId,
        taxRate: data.taxInformation?.taxRate
      }

      const response = await fetch(`/api/vendors/${vendorId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          success: false,
          error: { message: 'Failed to save settings', code: 'UNKNOWN_ERROR' }
        }))
        
        // Handle API error format: { success: false, error: { message, code } }
        const errorMessage = errorData.error?.message || errorData.error || errorData.message || 'Failed to save settings'
        throw new Error(errorMessage)
      }

      setHasChanges(false)
    } catch (err) {
      console.error('Error saving settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }, [vendorId])

  // Set current user ID from auth context
  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id)
    }
  }, [user])

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Handle Change Password
  const handleChangePassword = async () => {
    if (!currentUserId) {
      setPasswordError('User ID not found. Please refresh the page.')
      return
    }

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setPasswordError('Password must contain at least one uppercase letter, one lowercase letter, and one number')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password')
      return
    }

    try {
      setChangingPassword(true)
      setPasswordError(null)

      const response = await fetch(`/api/users/${currentUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          type: 'password',
          currentPassword,
          newPassword,
          confirmPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      // Success - reset form and close modal
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setChangePasswordOpen(false)
      setPasswordError(null)
      
      // Show success toast notification
      toast({
        title: 'Password changed successfully',
        description: 'Your password has been updated. Please use your new password for future logins.',
      })
    } catch (err) {
      console.error('Error changing password:', err)
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setVendorData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [field]: value
      }
    })
    setHasChanges(true)
  }

  const handleProfileChange = (field: string, value: any) => {
    setVendorData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        profile: {
          ...prev.profile,
          [field]: value
        }
      }
    })
    setHasChanges(true)
  }

  const handleAddressChange = (field: string, value: string) => {
    setVendorData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        address: {
          ...prev.address,
          [field]: value
        }
      }
    })
    setHasChanges(true)
  }

  const handleNotificationChange = (category: string, setting: string, value: boolean) => {
    setVendorData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [category]: {
          ...prev[category as keyof typeof prev],
          [setting]: value
        }
      }
    })
    setHasChanges(true)
  }

  const handleBusinessHoursChange = (day: string, field: string, value: any) => {
    setVendorData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        businessHours: {
          ...prev.businessHours,
          [day]: {
            ...prev.businessHours?.[day],
            [field]: value
          }
        }
      }
    })
    setHasChanges(true)
  }

  const handleManualSave = async () => {
    if (vendorData) {
      await saveSettings(vendorData)
    }
  }

  if (loading) {
    return (
      <VendorLayout title="Settings" subtitle="Loading...">
        <div className="p-6 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </VendorLayout>
    )
  }

  if (error && !vendorData) {
    return (
      <VendorLayout title="Settings" subtitle="Error loading settings">
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive">{error}</p>
                <Button onClick={fetchSettings} className="mt-4">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </VendorLayout>
    )
  }

  if (!vendorData) {
    return null
  }

  return (
    <VendorLayout
      title="Settings"
      subtitle="Manage your business information, account settings, and platform preferences"
    >
      <div className="p-6 space-y-6">
        {/* Error Banner */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saving Indicator */}
        {saving && (
          <Card className="border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-primary">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                <span>Saving changes...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={vendorData.profile.logoUrl} alt={vendorData.profile.name} />
                <AvatarFallback>
                  <Store className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{vendorData.profile.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {vendorData.address?.city && vendorData.address?.state && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {vendorData.address.city}, {vendorData.address.state}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button onClick={handleManualSave} disabled={saving}>
                {saving ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
            {!hasChanges && (
              <Button variant="outline" disabled>
                <Edit className="h-4 w-4 mr-2" />
                All changes saved
              </Button>
            )}
          </div>
        </div>

        {/* Settings Categories */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="hours">Business Hours</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="business-name">Business Name</Label>
                    <Input
                      id="business-name"
                      value={vendorData.profile.name}
                      onChange={(e) => handleProfileChange('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="business-email">Business Email</Label>
                    <Input
                      id="business-email"
                      type="email"
                      value={vendorData.profile.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone-country-code">Phone Country Code</Label>
                      <Input
                        id="phone-country-code"
                        placeholder="+91"
                        value={vendorData.profile.phoneCountryCode || ''}
                        onChange={(e) => handleProfileChange('phoneCountryCode', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone-number">Phone Number</Label>
                      <Input
                        id="phone-number"
                        placeholder="9876543210"
                        value={vendorData.profile.phoneNumber || ''}
                        onChange={(e) => handleProfileChange('phoneNumber', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={vendorData.profile.website || ''}
                      onChange={(e) => handleProfileChange('website', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={vendorData.profile.timezone}
                      onValueChange={(value) => handleProfileChange('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PST)</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (EST)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CST)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MST)</SelectItem>
                        <SelectItem value="Asia/Kolkata">India Standard Time (IST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Business Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Business Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={vendorData.address?.street || ''}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={vendorData.address?.city || ''}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={vendorData.address?.state || ''}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postalCode">ZIP Code</Label>
                      <Input
                        id="postalCode"
                        value={vendorData.address?.postalCode || ''}
                        onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={vendorData.address?.country || ''}
                        onChange={(e) => handleAddressChange('country', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Business Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Business Description</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={vendorData.profile.description || ''}
                  onChange={(e) => handleProfileChange('description', e.target.value)}
                  rows={4}
                  placeholder="Tell customers about your business..."
                />
              </CardContent>
            </Card>

            {/* Regional Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Regional Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select
                      value={vendorData.profile.currencyCode}
                      onValueChange={(value) => handleProfileChange('currencyCode', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Hours Tab */}
          <TabsContent value="hours" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Business Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DAYS_OF_WEEK.map((day, index) => {
                    const hours = vendorData.businessHours?.[day] || { open: '09:00', close: '18:00', isOpen: true }
                    return (
                      <div key={day} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            hours.isOpen ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className="font-medium w-24">{DAY_NAMES[index]}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {hours.isOpen ? (
                            <>
                              <Input
                                type="time"
                                value={hours.open}
                                onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                                className="w-24"
                              />
                              <span>to</span>
                              <Input
                                type="time"
                                value={hours.close}
                                onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                                className="w-24"
                              />
                            </>
                          ) : (
                            <span className="text-muted-foreground">Closed</span>
                          )}

                          <Switch
                            checked={hours.isOpen}
                            onCheckedChange={(checked) => handleBusinessHoursChange(day, 'isOpen', checked)}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Email Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">New Bookings</div>
                      <div className="text-sm text-muted-foreground">
                        Get notified when someone makes a booking
                      </div>
                    </div>
                    <Switch
                      checked={vendorData.emailNotifications?.newBookings ?? false}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('emailNotifications', 'newBookings', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Booking Cancellations</div>
                      <div className="text-sm text-muted-foreground">
                        Know when bookings are cancelled
                      </div>
                    </div>
                    <Switch
                      checked={vendorData.emailNotifications?.bookingCancellations ?? false}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('emailNotifications', 'bookingCancellations', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Payment Confirmations</div>
                      <div className="text-sm text-muted-foreground">
                        Receive payment confirmations
                      </div>
                    </div>
                    <Switch
                      checked={vendorData.emailNotifications?.paymentConfirmations ?? false}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('emailNotifications', 'paymentConfirmations', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Weekly Reports</div>
                      <div className="text-sm text-muted-foreground">
                        Get weekly business summaries
                      </div>
                    </div>
                    <Switch
                      checked={vendorData.emailNotifications?.weeklyReports ?? false}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('emailNotifications', 'weeklyReports', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Marketing Updates</div>
                      <div className="text-sm text-muted-foreground">
                        Platform updates and news
                      </div>
                    </div>
                    <Switch
                      checked={vendorData.emailNotifications?.marketingUpdates ?? false}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('emailNotifications', 'marketingUpdates', checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* SMS Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    SMS Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Enable SMS Alerts</div>
                      <div className="text-sm text-muted-foreground">
                        Receive important updates via SMS
                      </div>
                    </div>
                    <Switch
                      checked={vendorData.smsNotifications?.newBookings ?? false}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('smsNotifications', 'newBookings', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Urgent Bookings Only</div>
                      <div className="text-sm text-muted-foreground">
                        SMS for time-sensitive bookings only
                      </div>
                    </div>
                    <Switch
                      checked={vendorData.smsNotifications?.urgentAlerts ?? false}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('smsNotifications', 'urgentAlerts', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Silent Hours</div>
                      <div className="text-sm text-muted-foreground">
                        No SMS between 10 PM - 7 AM
                      </div>
                    </div>
                    <Switch
                      checked={vendorData.smsNotifications?.silentHours ?? false}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('smsNotifications', 'silentHours', checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payment Methods</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Accepted Payment Methods</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                          <span>Credit/Debit Cards</span>
                        </div>
                        <Switch
                          checked={vendorData.paymentSettings?.acceptedPaymentMethods?.includes('credit_card') ?? false}
                          onCheckedChange={(checked) => {
                            const methods = vendorData.paymentSettings?.acceptedPaymentMethods || []
                            const updated = checked
                              ? [...methods, 'credit_card']
                              : methods.filter(m => m !== 'credit_card')
                            handleInputChange('paymentSettings', {
                              ...vendorData.paymentSettings,
                              acceptedPaymentMethods: updated
                            })
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <span>Cash</span>
                        </div>
                        <Switch
                          checked={vendorData.paymentSettings?.acceptedPaymentMethods?.includes('cash') ?? false}
                          onCheckedChange={(checked) => {
                            const methods = vendorData.paymentSettings?.acceptedPaymentMethods || []
                            const updated = checked
                              ? [...methods, 'cash']
                              : methods.filter(m => m !== 'cash')
                            handleInputChange('paymentSettings', {
                              ...vendorData.paymentSettings,
                              acceptedPaymentMethods: updated
                            })
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="refund-policy">Refund Policy</Label>
                    <Select
                      value={vendorData.paymentSettings?.refundPolicy || '24h'}
                      onValueChange={(value) => handleInputChange('paymentSettings', {
                        ...vendorData.paymentSettings,
                        refundPolicy: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strict">Strict (No Refunds)</SelectItem>
                        <SelectItem value="24h">24 Hours Before</SelectItem>
                        <SelectItem value="48h">48 Hours Before</SelectItem>
                        <SelectItem value="flexible">Flexible (Anytime)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Tax Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Tax Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="tax-id">Tax ID</Label>
                    <Input
                      id="tax-id"
                      value={vendorData.taxInformation?.taxId || ''}
                      onChange={(e) => handleInputChange('taxInformation', {
                        ...vendorData.taxInformation,
                        taxId: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      value={vendorData.taxInformation?.taxRate || 0}
                      onChange={(e) => handleInputChange('taxInformation', {
                        ...vendorData.taxInformation,
                        taxRate: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Account Security */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="pt-4 space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setChangePasswordOpen(true)}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => router.push('/vendor/staff')}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage Team Access
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      disabled
                      title="Coming soon"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Download Account Data
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Account Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <h4 className="font-medium">Export Your Data</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Download all your business data including bookings, customer information, and financial records.
                    </p>
                    <Button variant="outline" size="sm" disabled title="Coming soon">
                      <Upload className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new password. Make sure it's at least 8 characters with uppercase, lowercase, and a number.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {passwordError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                {passwordError}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  disabled={changingPassword}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={changingPassword}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={changingPassword}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={changingPassword}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={changingPassword}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={changingPassword}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setChangePasswordOpen(false)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
                setPasswordError(null)
              }}
              disabled={changingPassword}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {changingPassword ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </VendorLayout>
  )
}
