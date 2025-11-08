'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  User,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Star,
  Store,
  Edit,
  Save,
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  Settings,
  Shield,
  CreditCard,
  FileText
} from 'lucide-react'

const mockVendorData = {
  // Business Information
  businessName: 'Elite Sports Complex',
  businessEmail: 'contact@elitesports.com',
  businessPhone: '+1 (555) 123-4567',
  website: 'www.elitesports.com',
  description: 'Premium sports facility offering world-class soccer fields, basketball courts, and tennis courts. We provide top-tier equipment and professional coaching services.',
  address: {
    street: '123 Sports Boulevard',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90001',
    country: 'United States'
  },
  foundedYear: '2018',
  sportsType: ['Soccer', 'Basketball', 'Tennis', 'Volleyball'],

  // Profile Settings
  avatar: '/vendor-avatar.jpg',
  timezone: 'America/Los_Angeles',
  currency: 'USD',
  language: 'English',

  // Notifications
  emailNotifications: {
    newBookings: true,
    bookingCancellations: true,
    paymentConfirmations: true,
    weeklyReports: true,
    marketingUpdates: false
  },
  smsNotifications: {
    newBookings: true,
    bookingCancellations: false,
    urgentAlerts: true
  },

  // Payment Settings
  preferredPaymentMethod: 'bank_transfer',
  payoutSchedule: 'weekly',
  taxInformation: {
    taxId: '12-3456789',
    taxRate: 8.5
  },

  // Business Hours
  businessHours: {
    monday: { open: '06:00', close: '22:00', isOpen: true },
    tuesday: { open: '06:00', close: '22:00', isOpen: true },
    wednesday: { open: '06:00', close: '22:00', isOpen: true },
    thursday: { open: '06:00', close: '22:00', isOpen: true },
    friday: { open: '06:00', close: '23:00', isOpen: true },
    saturday: { open: '07:00', close: '23:00', isOpen: true },
    sunday: { open: '08:00', close: '20:00', isOpen: true }
  }
}

export function VendorProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [vendorData, setVendorData] = useState(mockVendorData)
  const [activeTab, setActiveTab] = useState('general')

  const handleSave = () => {
    setIsEditing(false)
    // TODO: Save to API
  }

  const handleInputChange = (field: string, value: any) => {
    setVendorData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddressChange = (field: string, value: string) => {
    setVendorData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }))
  }

  const handleNotificationChange = (category: string, setting: string, value: boolean) => {
    setVendorData(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }))
  }

  const sportsOptions = [
    'Soccer', 'Basketball', 'Tennis', 'Volleyball', 'Baseball',
    'Cricket', 'Badminton', 'Swimming', 'Gym', 'Yoga'
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Profile Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={vendorData.avatar} alt={vendorData.businessName} />
              <AvatarFallback>
                <Store className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <Button size="sm" className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full p-0">
              <Camera className="h-3 w-3" />
            </Button>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{vendorData.businessName}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {vendorData.address.city}, {vendorData.address.state}
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                4.8 Rating
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Verified Vendor
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          variant={isEditing ? "default" : "outline"}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="hours">Business Hours</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Business Name</Label>
                  <Input
                    value={vendorData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label>Business Email</Label>
                  <Input
                    type="email"
                    value={vendorData.businessEmail}
                    onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label>Business Phone</Label>
                  <Input
                    value={vendorData.businessPhone}
                    onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label>Website</Label>
                  <Input
                    value={vendorData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label>Founded Year</Label>
                  <Input
                    value={vendorData.foundedYear}
                    onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Business Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Street Address</Label>
                  <Input
                    value={vendorData.address.street}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={vendorData.address.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={vendorData.address.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ZIP Code</Label>
                    <Input
                      value={vendorData.address.zipCode}
                      onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input
                      value={vendorData.address.country}
                      onChange={(e) => handleAddressChange('country', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Business Description */}
          <Card>
            <CardHeader>
              <CardTitle>Business Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={vendorData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={!isEditing}
                rows={4}
                placeholder="Tell customers about your business..."
              />
            </CardContent>
          </Card>

          {/* Sports Types */}
          <Card>
            <CardHeader>
              <CardTitle>Sports Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {vendorData.sportsType.map((sport, index) => (
                  <Badge key={index} variant="secondary">
                    {sport}
                  </Badge>
                ))}
                {isEditing && (
                  <Button variant="outline" size="sm">
                    <Edit className="h-3 w-3 mr-1" />
                    Add Sport
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(vendorData.businessHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        hours.isOpen ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="font-medium capitalize">{day}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {hours.isOpen ? (
                        <>
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) => handleInputChange('businessHours', {
                              ...vendorData.businessHours,
                              [day]: { ...hours, open: e.target.value }
                            })}
                            disabled={!isEditing}
                            className="w-24"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) => handleInputChange('businessHours', {
                              ...vendorData.businessHours,
                              [day]: { ...hours, close: e.target.value }
                            })}
                            disabled={!isEditing}
                            className="w-24"
                          />
                        </>
                      ) : (
                        <span className="text-muted-foreground">Closed</span>
                      )}

                      {isEditing && (
                        <Switch
                          checked={hours.isOpen}
                          onCheckedChange={(checked) => handleInputChange('businessHours', {
                            ...vendorData.businessHours,
                            [day]: { ...hours, isOpen: checked }
                          })}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(vendorData.emailNotifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {key === 'newBookings' && 'Get notified when someone makes a booking'}
                        {key === 'bookingCancellations' && 'Know when bookings are cancelled'}
                        {key === 'paymentConfirmations' && 'Receive payment confirmations'}
                        {key === 'weeklyReports' && 'Get weekly business summaries'}
                        {key === 'marketingUpdates' && 'Platform updates and news'}
                      </div>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('emailNotifications', key, checked)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* SMS Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  SMS Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(vendorData.smsNotifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {key === 'newBookings' && 'Text alerts for new bookings'}
                        {key === 'bookingCancellations' && 'SMS for cancellations'}
                        {key === 'urgentAlerts' && 'Critical updates only'}
                      </div>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) =>
                        handleNotificationChange('smsNotifications', key, checked)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Preferred Payment Method</Label>
                  <Select
                    value={vendorData.preferredPaymentMethod}
                    onValueChange={(value) => handleInputChange('preferredPaymentMethod', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Payout Schedule</Label>
                  <Select
                    value={vendorData.payoutSchedule}
                    onValueChange={(value) => handleInputChange('payoutSchedule', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tax Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Tax Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Tax ID</Label>
                  <Input
                    value={vendorData.taxInformation.taxId}
                    onChange={(e) => handleInputChange('taxInformation', {
                      ...vendorData.taxInformation,
                      taxId: e.target.value
                    })}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={vendorData.taxInformation.taxRate}
                    onChange={(e) => handleInputChange('taxInformation', {
                      ...vendorData.taxInformation,
                      taxRate: parseFloat(e.target.value)
                    })}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Account Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Change Password
                </Button>

                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Enable Two-Factor Authentication
                </Button>

                <Button variant="outline" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Update Phone Number
                </Button>

                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Update Email Address
                </Button>
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
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>

                <div className="p-4 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <h4 className="font-medium text-red-700">Delete Account</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Permanently delete your vendor account and all associated data.
                  </p>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}