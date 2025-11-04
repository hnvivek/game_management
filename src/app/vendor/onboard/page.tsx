'use client'

import { useState } from 'react'
import { CheckCircle, MapPin, Mail, Phone, Globe, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useThemeColors } from '@/styles/theme'

export default function VendorOnboarding() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { getWarning } = useThemeColors()
  const [vendorData, setVendorData] = useState({
    // Venue information
    name: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    
    // Admin user information
    adminName: '',
    adminEmail: '',
    adminPhone: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setVendorData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vendorData),
      })
      
      if (response.ok) {
        setStep(3) // Success step
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error onboarding vendor:', error)
      alert('Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceedToStep2 = vendorData.name && vendorData.location && vendorData.email && vendorData.phone

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-2xl mx-auto px-6">
        {/* Progress Indicator */}
        <div className="flex justify-between items-center mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>
              1
            </div>
            <span className="ml-2 font-medium">Venue Info</span>
          </div>
          <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary' : 'bg-muted/50'} rounded`}></div>
          <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>
              2
            </div>
            <span className="ml-2 font-medium">Admin Details</span>
          </div>
          <div className={`w-16 h-1 ${step >= 3 ? 'bg-success' : 'bg-muted/50'} rounded`}></div>
          <div className={`flex items-center ${step >= 3 ? 'text-success' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-success text-primary-foreground' : 'bg-muted/50'}`}>
              {step >= 3 ? <CheckCircle className="h-5 w-5" /> : '3'}
            </div>
            <span className="ml-2 font-medium">Complete</span>
          </div>
        </div>

        {/* Step 1: Venue Information */}
        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome to Our Platform!</CardTitle>
              <CardDescription className="text-base">
                Join hundreds of sports venues using our booking platform. Let's get started with your venue information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Venue Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., 3Lok Sports Hub"
                    value={vendorData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="e.g., Whitefield, Bengaluru"
                      className="pl-10"
                      value={vendorData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Full Address</Label>
                <Textarea
                  id="address"
                  placeholder="Street address, landmarks, etc."
                  value={vendorData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="+91 9876543210"
                      className="pl-10"
                      value={vendorData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="info@3loksports.com"
                      className="pl-10"
                      value={vendorData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website (Optional)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    placeholder="https://www.3loksports.com"
                    className="pl-10"
                    value={vendorData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell customers about your venue, facilities, and what makes it special..."
                  value={vendorData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              <Button 
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Continue to Admin Setup
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Admin Details */}
        {step === 2 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Admin Account Setup</CardTitle>
              <CardDescription className="text-base">
                Create an admin account to manage your venue bookings and settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="adminName">Admin Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="adminName"
                    placeholder="Full name of the admin"
                    className="pl-10"
                    value={vendorData.adminName}
                    onChange={(e) => handleInputChange('adminName', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="adminEmail">Admin Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@3loksports.com"
                    className="pl-10"
                    value={vendorData.adminEmail}
                    onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="adminPhone">Admin Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="adminPhone"
                    placeholder="+91 9876543210"
                    className="pl-10"
                    value={vendorData.adminPhone}
                    onChange={(e) => handleInputChange('adminPhone', e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-warning/10 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-warning-700 mb-2">Admin Login Credentials</h4>
                <p className="text-sm text-warning">
                  A temporary password will be sent to the admin email address. 
                  You can change it after first login.
                </p>
              </div>

              <div className="flex space-x-4">
                <Button 
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!vendorData.adminName || !vendorData.adminEmail || isSubmitting}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Creating Account...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="text-2xl text-success-foreground">Welcome Aboard! 🎉</CardTitle>
              <CardDescription className="text-base">
                Your venue has been successfully onboarded to our platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="bg-success/10 border border-success/20 rounded-lg p-6">
                <h3 className="font-semibold text-success-foreground mb-3">What's Next?</h3>
                <ul className="space-y-2 text-sm text-success">
                  <li>✅ Admin credentials have been sent to your email</li>
                  <li>📱 Log in to your dashboard to add venues and sports</li>
                  <li>💰 Set your pricing and availability</li>
                  <li>🚀 Start receiving bookings from customers!</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={() => window.location.href = '/vendor/dashboard'}
                >
                  Go to Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => window.location.href = '/'}
                >
                  View Customer App
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
