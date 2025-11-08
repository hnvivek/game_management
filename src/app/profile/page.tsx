'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/navbar'
import { useAuth } from '@/components/features/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { User, Mail, Phone, MapPin, Calendar, Clock, Globe, Shield, Camera, Save, X, Check, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    city: '',
    area: '',
    countryCode: '',
    timezone: '',
    currencyCode: '',
    dateFormat: 'DD/MM/YYYY' as const,
    timeFormat: '24h' as const,
    language: 'en',
    profilePicture: '',
    socialLinks: {
      website: '',
      linkedin: '',
      twitter: '',
      instagram: '',
      github: ''
    },
    notificationPreferences: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      bookingReminders: true,
      teamInvites: true,
      matchInvites: true
    },
    privacySettings: {
      profileVisibility: 'public' as const,
      showEmail: false,
      showPhone: false,
      allowTeamInvites: true,
      allowMatchInvites: true
    }
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Fetch user profile data
  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setProfileData(prev => ({
          ...prev,
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          bio: data.user.bio || '',
          city: data.user.city || '',
          area: data.user.area || '',
          countryCode: data.user.countryCode || '',
          timezone: data.user.timezone || '',
          currencyCode: data.user.currencyCode || '',
          dateFormat: data.user.dateFormat || 'DD/MM/YYYY',
          timeFormat: data.user.timeFormat || '24h',
          language: data.user.language || 'en',
          profilePicture: data.user.profilePicture || '',
          socialLinks: data.user.socialLinks || prev.socialLinks,
          notificationPreferences: data.user.notificationPreferences || prev.notificationPreferences,
          privacySettings: data.user.privacySettings || prev.privacySettings
        }))
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to load profile data')
    }
  }

  const handleSave = async (section?: string) => {
    setIsLoading(true)
    setError('')
    setSaveStatus('idle')

    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      if (response.ok) {
        setSaveStatus('success')
        setIsEditing(false)
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save profile')
        setSaveStatus('error')
      }
    } catch (error) {
      setError('Network error. Please try again.')
      setSaveStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'password',
          ...passwordData
        }),
      })

      if (response.ok) {
        setSaveStatus('success')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setShowPasswordFields(false)
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update password')
        setSaveStatus('error')
      }
    } catch (error) {
      setError('Network error. Please try again.')
      setSaveStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-muted">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Alert className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please sign in to view your profile</AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <div className="flex items-center gap-3">
              {saveStatus === 'success' && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <Check className="h-4 w-4" />
                  <AlertDescription>Profile saved successfully!</AlertDescription>
                </Alert>
              )}
              {saveStatus === 'error' && (
                <Alert className="bg-red-50 border-red-200 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="bg-primary hover:bg-primary-600">
                  Edit Profile
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      fetchProfile() // Reset to original data
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary-600"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Header */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profileData.profilePicture} alt={profileData.name} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {profileData.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full hover:bg-primary/90 transition-colors">
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">{profileData.name}</h2>
                  <p className="text-muted-foreground">{profileData.email}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="secondary">Active</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {profileData.city || 'Location not set'}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Full Name</FieldLabel>
                      <Input
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        disabled={!isEditing}
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Email Address</FieldLabel>
                      <Input
                        value={profileData.email}
                        disabled
                        className="bg-muted"
                      />
                      <FieldDescription>Email cannot be changed</FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel>Phone Number</FieldLabel>
                      <Input
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="+91 9876543210"
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Bio</FieldLabel>
                      <Textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Tell us about yourself..."
                        className="min-h-[100px]"
                      />
                      <FieldDescription>{profileData.bio?.length || 0}/500 characters</FieldDescription>
                    </Field>

                    <FieldSeparator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel>City</FieldLabel>
                        <Input
                          value={profileData.city}
                          onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                          disabled={!isEditing}
                          placeholder="Bengaluru"
                        />
                      </Field>

                      <Field>
                        <FieldLabel>Area</FieldLabel>
                        <Input
                          value={profileData.area}
                          onChange={(e) => setProfileData(prev => ({ ...prev, area: e.target.value }))}
                          disabled={!isEditing}
                          placeholder="Koramangala"
                        />
                      </Field>
                    </div>
                  </FieldGroup>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Customize your app experience</CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel>Date Format</FieldLabel>
                        <select
                          value={profileData.dateFormat}
                          onChange={(e) => setProfileData(prev => ({ ...prev, dateFormat: e.target.value as any }))}
                          disabled={!isEditing}
                          className="w-full p-2 border rounded-md bg-background"
                        >
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </Field>

                      <Field>
                        <FieldLabel>Time Format</FieldLabel>
                        <select
                          value={profileData.timeFormat}
                          onChange={(e) => setProfileData(prev => ({ ...prev, timeFormat: e.target.value as any }))}
                          disabled={!isEditing}
                          className="w-full p-2 border rounded-md bg-background"
                        >
                          <option value="12h">12-hour</option>
                          <option value="24h">24-hour</option>
                        </select>
                      </Field>

                      <Field>
                        <FieldLabel>Language</FieldLabel>
                        <Input
                          value={profileData.language}
                          onChange={(e) => setProfileData(prev => ({ ...prev, language: e.target.value }))}
                          disabled={!isEditing}
                          placeholder="English"
                        />
                      </Field>

                      <Field>
                        <FieldLabel>Timezone</FieldLabel>
                        <Input
                          value={profileData.timezone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
                          disabled={!isEditing}
                          placeholder="Asia/Kolkata"
                        />
                      </Field>
                    </div>
                  </FieldGroup>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Control how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <div className="flex items-center justify-between">
                        <div>
                          <FieldLabel>Email Notifications</FieldLabel>
                          <FieldDescription>Receive updates via email</FieldDescription>
                        </div>
                        <Switch
                          checked={profileData.notificationPreferences.emailNotifications}
                          onCheckedChange={(checked) =>
                            setProfileData(prev => ({
                              ...prev,
                              notificationPreferences: { ...prev.notificationPreferences, emailNotifications: checked }
                            }))
                          }
                          disabled={!isEditing}
                        />
                      </div>
                    </Field>

                    <Field>
                      <div className="flex items-center justify-between">
                        <div>
                          <FieldLabel>Push Notifications</FieldLabel>
                          <FieldDescription>Browser push notifications</FieldDescription>
                        </div>
                        <Switch
                          checked={profileData.notificationPreferences.pushNotifications}
                          onCheckedChange={(checked) =>
                            setProfileData(prev => ({
                              ...prev,
                              notificationPreferences: { ...prev.notificationPreferences, pushNotifications: checked }
                            }))
                          }
                          disabled={!isEditing}
                        />
                      </div>
                    </Field>

                    <Field>
                      <div className="flex items-center justify-between">
                        <div>
                          <FieldLabel>Booking Reminders</FieldLabel>
                          <FieldDescription>Remind before bookings</FieldDescription>
                        </div>
                        <Switch
                          checked={profileData.notificationPreferences.bookingReminders}
                          onCheckedChange={(checked) =>
                            setProfileData(prev => ({
                              ...prev,
                              notificationPreferences: { ...prev.notificationPreferences, bookingReminders: checked }
                            }))
                          }
                          disabled={!isEditing}
                        />
                      </div>
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy */}
            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>Control your privacy and visibility</CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <div className="flex items-center justify-between">
                        <div>
                          <FieldLabel>Profile Visibility</FieldLabel>
                          <FieldDescription>Who can see your profile</FieldDescription>
                        </div>
                        <select
                          value={profileData.privacySettings.profileVisibility}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            privacySettings: { ...prev.privacySettings, profileVisibility: e.target.value as any }
                          }))}
                          disabled={!isEditing}
                          className="p-2 border rounded-md bg-background"
                        >
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                          <option value="friends">Friends Only</option>
                        </select>
                      </div>
                    </Field>

                    <Field>
                      <div className="flex items-center justify-between">
                        <div>
                          <FieldLabel>Show Email</FieldLabel>
                          <FieldDescription>Display email on profile</FieldDescription>
                        </div>
                        <Switch
                          checked={profileData.privacySettings.showEmail}
                          onCheckedChange={(checked) =>
                            setProfileData(prev => ({
                              ...prev,
                              privacySettings: { ...prev.privacySettings, showEmail: checked }
                            }))
                          }
                          disabled={!isEditing}
                        />
                      </div>
                    </Field>

                    <Field>
                      <div className="flex items-center justify-between">
                        <div>
                          <FieldLabel>Show Phone</FieldLabel>
                          <FieldDescription>Display phone on profile</FieldDescription>
                        </div>
                        <Switch
                          checked={profileData.privacySettings.showPhone}
                          onCheckedChange={(checked) =>
                            setProfileData(prev => ({
                              ...prev,
                              privacySettings: { ...prev.privacySettings, showPhone: checked }
                            }))
                          }
                          disabled={!isEditing}
                        />
                      </div>
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Password Change Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent>
              {!showPasswordFields ? (
                <Button
                  onClick={() => setShowPasswordFields(true)}
                  variant="outline"
                  className="w-full md:w-auto"
                >
                  Change Password
                </Button>
              ) : (
                <FieldGroup>
                  <Field>
                    <FieldLabel>Current Password</FieldLabel>
                    <div className="relative">
                      <Input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel>New Password</FieldLabel>
                    <div className="relative">
                      <Input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel>Confirm New Password</FieldLabel>
                    <div className="relative">
                      <Input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>

                  <div className="flex items-center gap-3">
                    <Button onClick={handlePasswordChange} disabled={isLoading}>
                      {isLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setShowPasswordFields(false)
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    }}>
                      Cancel
                    </Button>
                  </div>
                </FieldGroup>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}