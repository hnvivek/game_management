'use client'

import { useState } from 'react'
import { Save, Upload, Eye, Palette, Clock, DollarSign, Bell, Globe } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { defaultVendorSettings, type VendorSettings } from '@/lib/vendor-theme'

interface VendorSettingsProps {
  initialSettings?: Partial<VendorSettings>
  onSave?: (settings: VendorSettings) => void
  preview?: boolean
}

export default function VendorSettings({
  initialSettings = {},
  onSave,
  preview = false
}: VendorSettingsProps) {
  const [settings, setSettings] = useState<VendorSettings>({
    ...defaultVendorSettings,
    ...initialSettings,
  })

  const [activeTab, setActiveTab] = useState('profile')

  const updateSetting = (category: keyof VendorSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }))
  }

  const handleSave = () => {
    onSave?.(settings)
  }

  if (preview) {
    return <VendorPreview settings={settings} />
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Vendor Settings</h1>
        <p className="text-muted-foreground">Customize your venue profile and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Hours
          </TabsTrigger>
          <TabsTrigger value="venue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Venue
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Display
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>Basic information about your venue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={settings.profile.businessName}
                    onChange={(e) => updateSetting('profile', 'businessName', e.target.value)}
                    placeholder="Your venue name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={settings.profile.phone || ''}
                    onChange={(e) => updateSetting('profile', 'phone', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.profile.email || ''}
                  onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                  placeholder="contact@venue.com"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={settings.profile.description || ''}
                  onChange={(e) => updateSetting('profile', 'description', e.target.value)}
                  placeholder="Tell customers about your venue..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={settings.profile.address || ''}
                  onChange={(e) => updateSetting('profile', 'address', e.target.value)}
                  placeholder="Your venue address"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.profile.primaryColor}
                      onChange={(e) => updateSetting('profile', 'primaryColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.profile.primaryColor}
                      onChange={(e) => updateSetting('profile', 'primaryColor', e.target.value)}
                      placeholder="#f39c12"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={settings.profile.secondaryColor}
                      onChange={(e) => updateSetting('profile', 'secondaryColor', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.profile.secondaryColor}
                      onChange={(e) => updateSetting('profile', 'secondaryColor', e.target.value)}
                      placeholder="#0ea5e9"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    {settings.profile.logo ? (
                      <img src={settings.profile.logo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    Upload Logo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Hours */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>Set your operating hours for each day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(settings.businessHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-24 capitalize font-medium">{day}</div>
                    <Switch
                      checked={!hours.closed}
                      onCheckedChange={(checked) => updateSetting('businessHours', day, { ...hours, closed: !checked })}
                    />
                    {!hours.closed && (
                      <div className="flex gap-2 items-center">
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => updateSetting('businessHours', day, { ...hours, open: e.target.value })}
                          className="w-32"
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => updateSetting('businessHours', day, { ...hours, close: e.target.value })}
                          className="w-32"
                        />
                      </div>
                    )}
                    {hours.closed && (
                      <span className="text-muted-foreground text-sm">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Venue Settings */}
        <TabsContent value="venue">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sports & Pricing</CardTitle>
                <CardDescription>Configure available sports and pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Available Sports</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Swimming'].map((sport) => (
                      <Badge
                        key={sport}
                        variant={settings.venue.sportTypes.includes(sport) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const sports = settings.venue.sportTypes.includes(sport)
                            ? settings.venue.sportTypes.filter(s => s !== sport)
                            : [...settings.venue.sportTypes, sport]
                          updateSetting('venue', 'sportTypes', sports)
                        }}
                      >
                        {sport}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="basePrice">Base Price (per hour)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      value={settings.venue.pricing.basePrice}
                      onChange={(e) => updateSetting('venue', 'pricing', { ...settings.venue.pricing, basePrice: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="peakPrice">Peak Hour Price</Label>
                    <Input
                      id="peakPrice"
                      type="number"
                      value={settings.venue.pricing.peakHourPrice || ''}
                      onChange={(e) => updateSetting('venue', 'pricing', { ...settings.venue.pricing, peakHourPrice: Number(e.target.value) })}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weekendPrice">Weekend Price</Label>
                    <Input
                      id="weekendPrice"
                      type="number"
                      value={settings.venue.pricing.weekendPrice || ''}
                      onChange={(e) => updateSetting('venue', 'pricing', { ...settings.venue.pricing, weekendPrice: Number(e.target.value) })}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timeSlot">Booking Time Slot (minutes)</Label>
                    <Select
                      value={settings.venue.bookingTimeSlots.toString()}
                      onValueChange={(value) => updateSetting('venue', 'bookingTimeSlots', Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="advanceDays">Advance Booking (days)</Label>
                    <Input
                      id="advanceDays"
                      type="number"
                      value={settings.venue.advanceBookingDays}
                      onChange={(e) => updateSetting('venue', 'advanceBookingDays', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cancellation">Cancellation Policy</Label>
                  <Textarea
                    id="cancellation"
                    value={settings.venue.cancellationPolicy}
                    onChange={(e) => updateSetting('venue', 'cancellationPolicy', e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
                <CardDescription>Select amenities available at your venue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    'Parking', 'Changing Rooms', 'Showers', 'Floodlights',
                    'Seating', 'Water Cooler', 'First Aid', 'Security',
                    'WiFi', 'Cafeteria', 'Equipment Rental', 'Scoreboard'
                  ].map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={amenity}
                        checked={settings.venue.amenities.includes(amenity)}
                        onChange={(e) => {
                          const amenities = e.target.checked
                            ? [...settings.venue.amenities, amenity]
                            : settings.venue.amenities.filter(a => a !== amenity)
                          updateSetting('venue', 'amenities', amenities)
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={amenity} className="text-sm">{amenity}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Display Settings */}
        <TabsContent value="display">
          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>Control how your venue appears to customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Booking Calendar</Label>
                    <p className="text-sm text-muted-foreground">Display availability calendar to customers</p>
                  </div>
                  <Switch
                    checked={settings.display.showBookingCalendar}
                    onCheckedChange={(checked) => updateSetting('display', 'showBookingCalendar', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Pricing Publicly</Label>
                    <p className="text-sm text-muted-foreground">Display pricing information on your public page</p>
                  </div>
                  <Switch
                    checked={settings.display.showPricingPublicly}
                    onCheckedChange={(checked) => updateSetting('display', 'showPricingPublicly', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Online Payments</Label>
                    <p className="text-sm text-muted-foreground">Enable customers to pay online during booking</p>
                  </div>
                  <Switch
                    checked={settings.display.allowOnlinePayments}
                    onCheckedChange={(checked) => updateSetting('display', 'allowOnlinePayments', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Contact Information</Label>
                    <p className="text-sm text-muted-foreground">Display phone and email on public pages</p>
                  </div>
                  <Switch
                    checked={settings.display.showContactInfo}
                    onCheckedChange={(checked) => updateSetting('display', 'showContactInfo', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to receive updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive updates via SMS</p>
                  </div>
                  <Switch
                    checked={settings.notifications.smsNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'smsNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Booking Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get reminded about upcoming bookings</p>
                  </div>
                  <Switch
                    checked={settings.notifications.bookingReminders}
                    onCheckedChange={(checked) => updateSetting('notifications', 'bookingReminders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Booking Alerts</Label>
                    <p className="text-sm text-muted-foreground">Instant alerts for new bookings</p>
                  </div>
                  <Switch
                    checked={settings.notifications.newBookingAlerts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'newBookingAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Cancellation Alerts</Label>
                    <p className="text-sm text-muted-foreground">Notifications for booking cancellations</p>
                  </div>
                  <Switch
                    checked={settings.notifications.cancellationAlerts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'cancellationAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Payment Alerts</Label>
                    <p className="text-sm text-muted-foreground">Notifications for payment events</p>
                  </div>
                  <Switch
                    checked={settings.notifications.paymentAlerts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'paymentAlerts', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration Settings */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Connect with external services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Payment Provider</Label>
                <Select
                  value={settings.integrations.paymentProvider}
                  onValueChange={(value) => updateSetting('integrations', 'paymentProvider', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="razorpay">Razorpay</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Calendar Sync</Label>
                    <p className="text-sm text-muted-foreground">Sync bookings with your calendar</p>
                  </div>
                  <Switch
                    checked={settings.integrations.calendarSync}
                    onCheckedChange={(checked) => updateSetting('integrations', 'calendarSync', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Website Embed</Label>
                    <p className="text-sm text-muted-foreground">Allow embedding on external websites</p>
                  </div>
                  <Switch
                    checked={settings.integrations.websiteEmbed}
                    onCheckedChange={(checked) => updateSetting('integrations', 'websiteEmbed', checked)}
                  />
                </div>
              </div>

              <div>
                <Label>Social Media Links</Label>
                <div className="space-y-2 mt-2">
                  <Input
                    placeholder="Facebook URL"
                    value={settings.integrations.socialMedia?.facebook || ''}
                    onChange={(e) => updateSetting('integrations', 'socialMedia', {
                      ...settings.integrations.socialMedia,
                      facebook: e.target.value
                    })}
                  />
                  <Input
                    placeholder="Instagram URL"
                    value={settings.integrations.socialMedia?.instagram || ''}
                    onChange={(e) => updateSetting('integrations', 'socialMedia', {
                      ...settings.integrations.socialMedia,
                      instagram: e.target.value
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 mt-8">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}

// Vendor Preview Component
function VendorPreview({ settings }: { settings: VendorSettings }) {
  return (
    <div className="space-y-6">
      {/* Header Preview */}
      <div
        className="p-6 text-white rounded-lg"
        style={{ backgroundColor: settings.profile.primaryColor }}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
            {settings.profile.logo ? (
              <img src={settings.profile.logo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span className="text-2xl font-bold">
                {settings.profile.businessName?.charAt(0) || 'V'}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{settings.profile.businessName || 'Your Venue'}</h1>
            <p className="text-white/80">{settings.profile.description || 'Your venue description'}</p>
          </div>
        </div>
      </div>

      {/* Business Hours Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Business Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(settings.businessHours).map(([day, hours]) => (
              <div key={day} className="flex justify-between">
                <span className="capitalize font-medium">{day}</span>
                <span className="text-muted-foreground">
                  {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sports Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Available Sports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {settings.venue.sportTypes.map((sport) => (
              <Badge key={sport} variant="secondary">{sport}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Base Price</span>
              <span className="font-medium">₹{settings.venue.pricing.basePrice}/hour</span>
            </div>
            {settings.venue.pricing.weekendPrice && (
              <div className="flex justify-between">
                <span>Weekend Price</span>
                <span className="font-medium">₹{settings.venue.pricing.weekendPrice}/hour</span>
              </div>
            )}
            {settings.venue.pricing.peakHourPrice && (
              <div className="flex justify-between">
                <span>Peak Hour Price</span>
                <span className="font-medium">₹{settings.venue.pricing.peakHourPrice}/hour</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}