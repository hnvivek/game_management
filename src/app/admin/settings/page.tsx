'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Database,
  Mail,
  Globe,
  CreditCard,
  Users,
  FileText,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Save,
  RotateCcw,
  Download,
  Upload
} from 'lucide-react'
import { UniversalBreadcrumb } from '@/components/features/admin/UniversalBreadcrumb'

export default function AdminSettingsPage() {
  return (
    <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <UniversalBreadcrumb />

        {/* Settings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Healthy</div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
              <Database className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2h ago</div>
              <p className="text-xs text-muted-foreground">
                Automatic backup enabled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Features</CardTitle>
              <Zap className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24/30</div>
              <p className="text-xs text-muted-foreground">
                6 features in beta
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">A+</div>
              <p className="text-xs text-muted-foreground">
                Excellent security posture
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Settings Categories */}
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Platform Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="platform-name">Platform Name</Label>
                    <Input id="platform-name" defaultValue="Game Management Platform" />
                  </div>
                  <div>
                    <Label htmlFor="platform-url">Platform URL</Label>
                    <Input id="platform-url" defaultValue="https://gamemanagement.com" />
                  </div>
                  <div>
                    <Label htmlFor="admin-email">Admin Email</Label>
                    <Input id="admin-email" type="email" defaultValue="admin@gamemanagement.com" />
                  </div>
                  <div>
                    <Label htmlFor="support-phone">Support Phone</Label>
                    <Input id="support-phone" defaultValue="+1 (555) 123-4567" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="platform-description">Platform Description</Label>
                  <Textarea
                    id="platform-description"
                    rows={3}
                    defaultValue="Comprehensive game and venue management platform for sports facilities and recreational centers."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Regional Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="timezone">Default Timezone</Label>
                    <Select defaultValue="utc-5">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem>
                        <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                        <SelectItem value="utc+0">UTC</SelectItem>
                        <SelectItem value="utc+1">Central European Time (UTC+1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select defaultValue="usd">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="eur">EUR (€)</SelectItem>
                        <SelectItem value="gbp">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">Default Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Authentication Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all admin accounts
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">
                      Auto-logout after inactivity
                    </p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Password Requirements</Label>
                    <p className="text-sm text-muted-foreground">
                      Enforce strong password policies
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>IP Whitelist</Label>
                    <p className="text-sm text-muted-foreground">
                      Restrict admin access to specific IPs
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">API Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rate Limiting</Label>
                    <p className="text-sm text-muted-foreground">
                      Limit API requests per user
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>CORS Configuration</Label>
                    <p className="text-sm text-muted-foreground">
                      Configure cross-origin requests
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div>
                  <Label>API Key Rotation</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Automatically rotate API keys
                  </p>
                  <Select defaultValue="90">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input id="smtp-host" defaultValue="smtp.gmail.com" />
                  </div>
                  <div>
                    <Label htmlFor="smtp-port">SMTP Port</Label>
                    <Input id="smtp-port" type="number" defaultValue="587" />
                  </div>
                  <div>
                    <Label htmlFor="smtp-username">SMTP Username</Label>
                    <Input id="smtp-username" defaultValue="noreply@gamemanagement.com" />
                  </div>
                  <div>
                    <Label htmlFor="smtp-password">SMTP Password</Label>
                    <Input id="smtp-password" type="password" defaultValue="••••••••" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Vendor Applications</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when new vendors apply
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Booking Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify about important booking changes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify about platform updates
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">SMS Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable SMS</Label>
                    <p className="text-sm text-muted-foreground">
                      Send SMS notifications for urgent matters
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="twilio-number">Twilio Number</Label>
                    <Input id="twilio-number" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div>
                    <Label htmlFor="twilio-sid">Account SID</Label>
                    <Input id="twilio-sid" placeholder="ACxxxxxxxxxxxx" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Gateway</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Primary Gateway</Label>
                  <Select defaultValue="stripe">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="publishable-key">Publishable Key</Label>
                    <Input id="publishable-key" type="password" defaultValue="pk_test_••••••••" />
                  </div>
                  <div>
                    <Label htmlFor="secret-key">Secret Key</Label>
                    <Input id="secret-key" type="password" defaultValue="sk_test_••••••••" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Test Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use test credentials for development
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="platform-fee">Platform Fee (%)</Label>
                    <Input id="platform-fee" type="number" defaultValue="5" />
                  </div>
                  <div>
                    <Label htmlFor="min-booking">Minimum Booking Amount</Label>
                    <Input id="min-booking" type="number" defaultValue="25" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatic Refunds</Label>
                    <p className="text-sm text-muted-foreground">
                      Process refunds automatically for cancellations
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Partial Payments</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow customers to pay deposits
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Theme Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Default Theme</Label>
                  <Select defaultValue="light">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <Input id="primary-color" type="color" defaultValue="#3b82f6" />
                  </div>
                  <div>
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <Input id="secondary-color" type="color" defaultValue="#64748b" />
                  </div>
                  <div>
                    <Label htmlFor="accent-color">Accent Color</Label>
                    <Input id="accent-color" type="color" defaultValue="#10b981" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Custom Logo</Label>
                    <p className="text-sm text-muted-foreground">
                      Upload custom platform logo
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Brand Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="brand-tagline">Brand Tagline</Label>
                  <Input id="brand-tagline" defaultValue="Your Sports, Your Schedule" />
                </div>
                <div>
                  <Label htmlFor="brand-description">Brand Description</Label>
                  <Textarea
                    id="brand-description"
                    rows={3}
                    defaultValue="The most comprehensive platform for managing sports facilities and bookings."
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Branding</Label>
                    <p className="text-sm text-muted-foreground">
                      Display branding on customer-facing pages
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Database Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="db-host">Database Host</Label>
                    <Input id="db-host" defaultValue="localhost:5432" />
                  </div>
                  <div>
                    <Label htmlFor="db-name">Database Name</Label>
                    <Input id="db-name" defaultValue="gamemanagement" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Connection Pooling</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable database connection pooling
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Query Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Log database queries for debugging
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cache Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Cache Provider</Label>
                  <Select defaultValue="redis">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="redis">Redis</SelectItem>
                      <SelectItem value="memory">Memory</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cache-ttl">Default TTL (seconds)</Label>
                    <Input id="cache-ttl" type="number" defaultValue="3600" />
                  </div>
                  <div>
                    <Label htmlFor="cache-size">Max Cache Size (MB)</Label>
                    <Input id="cache-size" type="number" defaultValue="512" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Maintenance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    These actions can affect platform availability. Please schedule maintenance during off-peak hours.
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restart Application
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Database
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Database
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Save Changes</h2>
            <p className="text-sm text-muted-foreground">
              Your settings will be applied immediately after saving
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save All Settings
            </Button>
          </div>
        </div>
    </div>
  )
}