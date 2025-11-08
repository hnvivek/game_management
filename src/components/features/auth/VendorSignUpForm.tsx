'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Lock,
  User,
  Palette,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
]

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
]

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
]

interface FormData {
  // Personal Information
  email: string
  password: string
  confirmPassword: string
  name: string
  phone: string

  // Business Information
  businessName: string
  businessDescription: string
  businessEmail: string
  businessPhone: string
  website: string

  // Address Information
  address: string
  city: string
  postalCode: string
  countryCode: string

  // Business Settings
  currencyCode: string
  timezone: string
  locale: string

  // Branding
  primaryColor: string
  secondaryColor: string

  // Terms
  acceptTerms: boolean
  acceptPrivacy: boolean
}

export function VendorSignUpForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    businessName: '',
    businessDescription: '',
    businessEmail: '',
    businessPhone: '',
    website: '',
    address: '',
    city: '',
    postalCode: '',
    countryCode: 'US',
    currencyCode: 'USD',
    timezone: 'America/New_York',
    locale: 'en-US',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    acceptTerms: false,
    acceptPrivacy: false,
  })

  const totalSteps = 4
  const progressPercentage = (currentStep / totalSteps) * 100

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.email || !formData.password || !formData.confirmPassword || !formData.name) {
          setError('Please fill in all required fields')
          return false
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match')
          return false
        }
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters long')
          return false
        }
        break

      case 2:
        if (!formData.businessName || !formData.businessDescription || !formData.businessEmail) {
          setError('Please fill in all required business information')
          return false
        }
        break

      case 3:
        if (!formData.address || !formData.city || !formData.postalCode) {
          setError('Please fill in all address information')
          return false
        }
        break

      case 4:
        if (!formData.acceptTerms || !formData.acceptPrivacy) {
          setError('Please accept the terms and conditions')
          return false
        }
        break
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateStep()) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/vendor-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setSuccess(data.message || 'Registration successful!')

      // Redirect to vendor dashboard after successful registration
      setTimeout(() => {
        window.location.href = '/vendor/dashboard'
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError('')
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Personal Information</h2>
              <p className="text-muted-foreground">
                Create your personal administrator account
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="countryCode">Country *</Label>
                <Select value={formData.countryCode} onValueChange={(value) => updateFormData('countryCode', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  placeholder="Re-enter password"
                  required
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Business Information</h2>
              <p className="text-muted-foreground">
                Tell us about your sports venue business
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => updateFormData('businessName', e.target.value)}
                  placeholder="Elite Sports Complex"
                  required
                />
              </div>

              <div>
                <Label htmlFor="businessDescription">Business Description *</Label>
                <Textarea
                  id="businessDescription"
                  value={formData.businessDescription}
                  onChange={(e) => updateFormData('businessDescription', e.target.value)}
                  placeholder="Describe your sports facilities, services, and what makes your business special..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessEmail">Business Email *</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => updateFormData('businessEmail', e.target.value)}
                    placeholder="contact@elitesports.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="businessPhone">Business Phone</Label>
                  <Input
                    id="businessPhone"
                    type="tel"
                    value={formData.businessPhone}
                    onChange={(e) => updateFormData('businessPhone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateFormData('website', e.target.value)}
                  placeholder="https://elitesports.com"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Business Address</h2>
              <p className="text-muted-foreground">
                Where is your business located?
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  placeholder="123 Main Street"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    placeholder="New York"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => updateFormData('postalCode', e.target.value)}
                    placeholder="10001"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="currencyCode">Currency *</Label>
                  <Select value={formData.currencyCode} onValueChange={(value) => updateFormData('currencyCode', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone *</Label>
                  <Select value={formData.timezone} onValueChange={(value) => updateFormData('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map(timezone => (
                        <SelectItem key={timezone} value={timezone}>
                          {timezone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="locale">Language</Label>
                  <Select value={formData.locale} onValueChange={(value) => updateFormData('locale', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English</SelectItem>
                      <SelectItem value="es-ES">Spanish</SelectItem>
                      <SelectItem value="fr-FR">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">Brand Colors</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose colors that represent your brand
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => updateFormData('primaryColor', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) => updateFormData('primaryColor', e.target.value)}
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => updateFormData('secondaryColor', e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.secondaryColor}
                        onChange={(e) => updateFormData('secondaryColor', e.target.value)}
                        placeholder="#10B981"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Review & Submit</h2>
              <p className="text-muted-foreground">
                Review your information and accept the terms
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Account Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{formData.name}</span>
                    <span className="text-muted-foreground">Email:</span>
                    <span>{formData.email}</span>
                    <span className="text-muted-foreground">Business:</span>
                    <span>{formData.businessName}</span>
                    <span className="text-muted-foreground">Location:</span>
                    <span>{formData.city}, {formData.countryCode}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => updateFormData('acceptTerms', checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="acceptTerms" className="text-sm font-normal">
                      I accept the Terms of Service
                    </Label>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptPrivacy"
                    checked={formData.acceptPrivacy}
                    onCheckedChange={(checked) => updateFormData('acceptPrivacy', checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="acceptPrivacy" className="text-sm font-normal">
                      I accept the Privacy Policy
                    </Label>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  After registration, your account will be subject to approval by our team.
                  You'll receive an email once your account is activated.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-3xl font-bold">Vendor Registration</CardTitle>
        <p className="text-muted-foreground">
          Join our platform and start managing your sports venues
        </p>

        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-8">
          {renderStep()}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={nextStep} disabled={isLoading}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Complete Registration'}
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-blue-600 hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}