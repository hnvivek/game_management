'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, CreditCard, Check, AlertCircle, ChevronRight, ChevronLeft, ArrowRight, Globe } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import BookingCourtSelection from './BookingCourtSelection'

// Enhanced types based on our API schema
interface Court {
  id: string
  name: string
  pricePerHour: number
  isActive: boolean
  sport: {
    id: string
    name: string
    displayName: string
    icon: string
  }
  format: {
    id: string
    name: string
    displayName: string
    minPlayers: number
    maxPlayers: number
  }
  venue: {
    id: string
    name: string
    address: string
    city: string
    area: string | null
    currencyCode: string
    timezone: string
    vendor: {
      id: string
      name: string
      slug: string
      primaryColor: string
      secondaryColor: string
    }
  }
  isAvailable?: boolean
}

interface SimpleBookingDetails {
  title: string
  description: string
  notes: string
}

interface PaymentDetails {
  method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'STRIPE' | 'CASH' | 'BANK_TRANSFER'
  cardNumber?: string
  cardExpiry?: string
  cardCVV?: string
  cardholderName?: string
  saveCard: boolean
}

interface SimpleBookingFlowProps {
  onBookingComplete: (booking: any) => void
  initialCourt?: Court
  initialDate?: string
  initialTime?: string
  initialDuration?: number
  initialTotalAmount?: number
  preSelectedVendorId?: string
}

export default function SimpleBookingFlow({
  onBookingComplete,
  initialCourt,
  initialDate,
  initialTime,
  initialDuration,
  initialTotalAmount,
  preSelectedVendorId
}: SimpleBookingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Step 1: Court Selection
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(initialCourt || null)
  const [selectedDate, setSelectedDate] = useState(initialDate || '')
  const [selectedTime, setSelectedTime] = useState(initialTime || '09:00')
  const [selectedDuration, setSelectedDuration] = useState(initialDuration?.toString() || '1')
  const [totalAmount, setTotalAmount] = useState(initialTotalAmount || 0)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<Array<{startTime: string, endTime: string}>>([])

  // Step 2: Booking Details (Simplified - only DIRECT booking)
  const [bookingDetails, setBookingDetails] = useState<SimpleBookingDetails>({
    title: '',
    description: '',
    notes: ''
  })

  // Step 3: User Information
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    userId: 'demo-user-id' // In real app, this comes from auth
  })

  // Step 4: Payment
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    method: 'CREDIT_CARD',
    saveCard: false
  })

  const totalSteps = 4

  // Update total amount when court or duration changes
  useEffect(() => {
    if (selectedCourt && selectedDuration) {
      const amount = selectedCourt.pricePerHour * parseInt(selectedDuration)
      setTotalAmount(amount)
    }
  }, [selectedCourt, selectedDuration])

  const handleCourtSelect = (court: Court, date: string, time: string, duration: number, amount: number) => {
    setSelectedCourt(court)
    setSelectedDate(date)
    setSelectedTime(time)
    setSelectedDuration(duration.toString())
    setTotalAmount(amount)
    setAvailableTimeSlots(court.availableSlots || [])
    setCurrentStep(2)
  }

  const handleTimeSlotChange = (newTime: string) => {
    setSelectedTime(newTime)
    if (selectedCourt) {
      const newAmount = selectedCourt.pricePerHour * parseInt(selectedDuration)
      setTotalAmount(newAmount)
    }
  }

  const validateStep = (step: number): { isValid: boolean; errors: string[]; fieldErrors: Record<string, string> } => {
    const errors: string[] = []
    const fieldErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!selectedCourt) {
          errors.push('Please select a court')
          fieldErrors.court = 'Please select a court to continue'
        }
        if (!selectedDate) {
          errors.push('Please select a date')
          fieldErrors.date = 'Date is required'
        }
        if (!selectedTime) {
          errors.push('Please select a time')
          fieldErrors.time = 'Time is required'
        }
        if (!selectedDuration) {
          errors.push('Please select a duration')
          fieldErrors.duration = 'Duration is required'
        }
        break

      case 2:
        if (!bookingDetails.title?.trim()) {
          errors.push('Booking title is required')
          fieldErrors.title = 'Please enter a booking title'
        }
        break

      case 3:
        if (!userInfo.name?.trim()) {
          errors.push('Full name is required')
          fieldErrors.name = 'Full name is required'
        }
        if (!userInfo.email?.trim()) {
          errors.push('Email address is required')
          fieldErrors.email = 'Email address is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email)) {
          errors.push('Please enter a valid email address')
          fieldErrors.email = 'Please enter a valid email address'
        }
        if (!userInfo.phone?.trim()) {
          errors.push('Phone number is required')
          fieldErrors.phone = 'Phone number is required'
        } else if (!/^[\d\s\-\+\(\)]+$/.test(userInfo.phone) || userInfo.phone.replace(/\D/g, '').length < 10) {
          errors.push('Please enter a valid phone number')
          fieldErrors.phone = 'Please enter a valid phone number (at least 10 digits)'
        }
        break

      case 4:
        if (!paymentDetails.method) {
          errors.push('Please select a payment method')
          fieldErrors.payment = 'Please select a payment method'
        }
        break

      default:
        errors.push('Invalid step')
    }

    return { isValid: errors.length === 0, errors, fieldErrors }
  }

  const handleNext = () => {
    const validation = validateStep(currentStep)
    if (validation.isValid) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
        setFieldErrors({}) // Clear errors when moving to next step
        setError('')
      }
    } else {
      setFieldErrors(validation.fieldErrors)
      setError(validation.errors[0] || 'Please complete all required fields')
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setFieldErrors({})
      setError('')
    }
  }

  const handleBookingSubmit = async () => {
    const validation = validateStep(currentStep)
    if (!selectedCourt || !validation.isValid) {
      setFieldErrors(validation.fieldErrors)
      setError(validation.errors[0] || 'Please complete all required fields')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Create booking via API (always DIRECT type)
      const startDateTime = new Date(`${selectedDate}T${selectedTime}:00.000Z`)
      const endDateTime = new Date(startDateTime.getTime() + parseInt(selectedDuration) * 60 * 60 * 1000)

      const bookingData = {
        courtId: selectedCourt.id,
        userId: userInfo.userId,
        sportId: selectedCourt.sport.id,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        duration: parseInt(selectedDuration),
        totalAmount,
        type: 'DIRECT', // Always DIRECT for simple venue bookings
        title: bookingDetails.title,
        description: bookingDetails.description,
        maxPlayers: selectedCourt.maxPlayers, // Use court's maxPlayers
        notes: bookingDetails.notes,
        status: 'PENDING_PAYMENT'
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create booking')
      }

      const booking = await response.json()

      // Create payment
      if (booking.booking) {
        const paymentData = {
          userId: userInfo.userId,
          amount: totalAmount * 100, // Convert to cents
          currency: 'INR',
          method: paymentDetails.method,
          type: 'BOOKING_PAYMENT',
          bookingId: booking.booking.id,
          description: `Court booking for ${selectedCourt.name} on ${selectedDate}`,
          metadata: JSON.stringify({
            courtId: selectedCourt.id,
            date: selectedDate,
            time: selectedTime,
            duration: selectedDuration,
            saveCard: paymentDetails.saveCard
          })
        }

        const paymentResponse = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData)
        })

        if (paymentResponse.ok) {
          const payment = await paymentResponse.json()
          onBookingComplete({
            booking: booking.booking,
            payment: payment.payment,
            court: selectedCourt
          })
        } else {
          // Booking created but payment failed
          onBookingComplete({
            booking: booking.booking,
            payment: null,
            court: selectedCourt
          })
        }
      }

    } catch (error) {
      console.error('Booking submission error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Find Your Court</h3>

              {/* Step 1 Validation Errors */}
              {(fieldErrors.court || fieldErrors.date || fieldErrors.time || fieldErrors.duration) && (
                <Alert className="border-destructive/20 bg-destructive/10 mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">Please complete court selection</div>
                    <div className="text-sm mt-1 space-y-1">
                      {fieldErrors.court && <div>• {fieldErrors.court}</div>}
                      {fieldErrors.date && <div>• {fieldErrors.date}</div>}
                      {fieldErrors.time && <div>• {fieldErrors.time}</div>}
                      {fieldErrors.duration && <div>• {fieldErrors.duration}</div>}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <BookingCourtSelection
                onCourtSelect={handleCourtSelect}
                initialCourt={selectedCourt}
                initialDate={selectedDate}
                initialDuration={parseInt(selectedDuration)}
                preSelectedVendorId={preSelectedVendorId}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Booking Details</h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Provide details about your court booking and review your selection
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 lg:gap-8">
              {/* Left Side - User Input Form */}
              <div className="lg:col-span-3 xl:col-span-3">
                <Card className="border-0 shadow-sm bg-card overflow-hidden">
                  <CardContent className="p-4 sm:p-6 lg:p-8">
                    <div className="mb-4 sm:mb-6">
                      <h4 className="text-lg font-semibold text-foreground mb-2">Booking Information</h4>
                      <p className="text-sm text-muted-foreground">
                        Tell us more about your booking
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="title" className="text-sm font-medium text-gray-900 mb-2">
                          Booking Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="title"
                          placeholder="e.g., Practice Session, Friendly Game"
                          value={bookingDetails.title}
                          onChange={(e) => {
                            setBookingDetails(prev => ({ ...prev, title: e.target.value }))
                            // Clear field error when user starts typing
                            if (fieldErrors.title && e.target.value.trim()) {
                              setFieldErrors(prev => ({ ...prev, title: '' }))
                            }
                          }}
                          className={`h-11 ${fieldErrors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary'}`}
                        />
                        {fieldErrors.title && (
                          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            {fieldErrors.title}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="description" className="text-sm font-medium text-gray-900 mb-2">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="What's this booking for?"
                          value={bookingDetails.description}
                          onChange={(e) => setBookingDetails(prev => ({ ...prev, description: e.target.value }))}
                          rows={4}
                          className="border-gray-300 focus:border-primary resize-none"
                        />
                      </div>

                      <div>
                        <Label htmlFor="notes" className="text-sm font-medium text-gray-900 mb-2">
                          Special Requirements
                        </Label>
                        <Textarea
                          id="notes"
                          placeholder="Any special requirements or notes (optional)"
                          value={bookingDetails.notes}
                          onChange={(e) => setBookingDetails(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                          className="border-gray-300 focus:border-primary resize-none"
                        />
                      </div>

                      <div>
                        <Label htmlFor="timeSlot" className="text-sm font-medium text-gray-900 mb-2">
                          Time Slot <span className="text-red-500">*</span>
                        </Label>
                        {availableTimeSlots.length > 0 ? (
                          <Select value={selectedTime} onValueChange={handleTimeSlotChange}>
                            <SelectTrigger className="h-11 border-gray-300 focus:border-primary">
                              <SelectValue placeholder="Select time slot" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTimeSlots.map((slot) => (
                                <SelectItem key={slot.startTime} value={slot.startTime}>
                                  <div className="font-medium">
                                    {(() => {
                                      const [hours, minutes] = slot.startTime.split(':').map(Number)
                                      const startHour = hours.toString().padStart(2, '0')
                                      const startMin = minutes.toString().padStart(2, '0')
                                      const endHours = (hours + parseInt(selectedDuration)).toString().padStart(2, '0')
                                      return `${startHour}:${startMin} - ${endHours}:${startMin}`
                                    })()}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="h-11 border-gray-300 focus:border-primary"
                            placeholder="Select time"
                          />
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Select your preferred time slot for the booking
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - Professional Booking Summary */}
              <div className="lg:col-span-2 xl:col-span-2 order-first lg:order-last">
                <div className="sticky top-20 lg:top-4">
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardHeader className="pb-4 border-b border-primary/10 px-4 sm:px-6">
                      <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
                        Booking Summary
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Review your booking details
                      </p>
                      {selectedCourt?.venue?.vendor?.timezone && (
                        <div className="mt-3 p-2 sm:p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <span className="font-medium truncate">All times in {selectedCourt.venue.vendor.timezone}</span>
                          </div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Booking times are displayed in the vendor's local timezone
                          </p>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-4">
                      {/* Court & Venue */}
                      <div className="bg-white dark:bg-gray-950 rounded-lg p-3 sm:p-4 border border-primary/10">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Court</span>
                            <span className="text-sm font-semibold text-gray-900">{selectedCourt?.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Venue</span>
                            <span className="text-sm font-semibold text-gray-900">{selectedCourt?.venue?.name}</span>
                          </div>
                          {selectedCourt?.venue?.vendor && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                <div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center">
                                  <Globe className="w-2 h-2 text-purple-600" />
                                </div>
                                Vendor
                              </span>
                              <div className="text-right">
                                <span className="text-sm font-semibold text-gray-900">{selectedCourt.venue.vendor.name}</span>
                                {selectedCourt.venue.vendor.timezone && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {selectedCourt.venue.vendor.timezone}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Sport</span>
                            <span className="text-sm font-semibold text-gray-900">{selectedCourt?.sport?.displayName}</span>
                          </div>
                        </div>
                      </div>
                      {/* Date & Time */}
                      <div className="bg-white rounded-lg p-4 border border-primary/10">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              Date
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {selectedDate && (() => {
                                const [year, month, day] = selectedDate.split('-').map(Number)
                                const date = new Date(year, month - 1, day)
                                return date.toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              })()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-primary" />
                              Time Slot
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {selectedTime && (() => {
                                const [hours, minutes] = selectedTime.split(':').map(Number)
                                const startHour = hours.toString().padStart(2, '0')
                                const startMin = minutes.toString().padStart(2, '0')
                                const endHours = (hours + parseInt(selectedDuration)).toString().padStart(2, '0')
                                return `${startHour}:${startMin} - ${endHours}:${startMin}`
                              })()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                              <div className="w-4 h-4 bg-amber-100 rounded flex items-center justify-center">
                                <Clock className="w-2 h-2 text-amber-600" />
                              </div>
                              Duration
                            </span>
                            <span className="text-sm font-semibold text-gray-900">{selectedDuration} hour{parseInt(selectedDuration) > 1 ? 's' : ''}</span>
                          </div>
                          {selectedCourt?.venue?.timezone && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                                  <Globe className="w-2 h-2 text-blue-600" />
                                </div>
                                Timezone
                              </span>
                              <span className="text-sm font-semibold text-gray-900">{selectedCourt.venue.timezone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Capacity */}
                      <div className="bg-white rounded-lg p-4 border border-primary/10">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            Max Players
                          </span>
                          <span className="text-sm font-semibold text-gray-900">{selectedCourt?.maxPlayers || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="bg-gradient-to-r from-success/5 to-success/10 rounded-lg p-4 border border-success/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-600 mb-1">Total Price</div>
                            <div className="text-xs text-gray-500">{selectedCourt?.pricePerHour} per hour</div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-success">
                              {selectedCourt && formatPrice(totalAmount, selectedCourt.venue.currencyCode || 'USD')}
                            </div>
                          </div>
                        </div>
                      </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <p className="text-muted-foreground mb-6">
                Provide your contact details for booking confirmation
              </p>
            </div>

            <div className="max-w-md space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={userInfo.name}
                  onChange={(e) => {
                    setUserInfo(prev => ({ ...prev, name: e.target.value }))
                    // Clear field error when user starts typing
                    if (fieldErrors.name && e.target.value.trim()) {
                      setFieldErrors(prev => ({ ...prev, name: '' }))
                    }
                  }}
                  className={fieldErrors.name ? 'border-destructive focus:border-destructive' : ''}
                />
                {fieldErrors.name && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={userInfo.email}
                  onChange={(e) => {
                    setUserInfo(prev => ({ ...prev, email: e.target.value }))
                    // Clear field error when user starts typing
                    if (fieldErrors.email && e.target.value.trim()) {
                      setFieldErrors(prev => ({ ...prev, email: '' }))
                    }
                  }}
                  className={fieldErrors.email ? 'border-destructive focus:border-destructive' : ''}
                />
                {fieldErrors.email && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  value={userInfo.phone}
                  onChange={(e) => {
                    setUserInfo(prev => ({ ...prev, phone: e.target.value }))
                    // Clear field error when user starts typing
                    if (fieldErrors.phone && e.target.value.trim()) {
                      setFieldErrors(prev => ({ ...prev, phone: '' }))
                    }
                  }}
                  className={fieldErrors.phone ? 'border-destructive focus:border-destructive' : ''}
                />
                {fieldErrors.phone && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.phone}
                  </p>
                )}
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                We'll use this information to send booking confirmations and updates.
              </AlertDescription>
            </Alert>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Payment</h3>
              <p className="text-muted-foreground mb-6">
                Choose your preferred payment method
              </p>
            </div>

            <div className="max-w-md space-y-4">
              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select
                  value={paymentDetails.method}
                  onValueChange={(value) => {
                    setPaymentDetails(prev => ({
                      ...prev,
                      method: value as any
                    }))
                    // Clear field error when user selects a payment method
                    if (fieldErrors.payment && value) {
                      setFieldErrors(prev => ({ ...prev, payment: '' }))
                    }
                  }}
                >
                  <SelectTrigger className={fieldErrors.payment ? 'border-destructive focus:border-destructive' : ''}>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                    <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                    <SelectItem value="PAYPAL">PayPal</SelectItem>
                    <SelectItem value="STRIPE">Stripe</SelectItem>
                    <SelectItem value="CASH">Cash (Pay at venue)</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.payment && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.payment}
                  </p>
                )}
              </div>

              {paymentDetails.method !== 'CASH' && paymentDetails.method !== 'BANK_TRANSFER' && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={paymentDetails.cardNumber || ''}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry">Expiry</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        value={paymentDetails.cardExpiry || ''}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardExpiry: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={paymentDetails.cardCVV || ''}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardCVV: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cardholderName">Cardholder Name</Label>
                    <Input
                      id="cardholderName"
                      placeholder="John Doe"
                      value={paymentDetails.cardholderName || ''}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardholderName: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="saveCard"
                  checked={paymentDetails.saveCard}
                  onChange={(e) => setPaymentDetails(prev => ({ ...prev, saveCard: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="saveCard" className="text-sm">
                  Save payment details for future bookings
                </Label>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Mobile: Vertical dots */}
        <div className="flex sm:hidden justify-between items-center w-full px-2">
          {[
            { step: 1, title: 'Court', icon: Calendar },
            { step: 2, title: 'Details', icon: Users },
            { step: 3, title: 'Contact', icon: Users },
            { step: 4, title: 'Payment', icon: CreditCard }
          ].map((item, index) => (
            <div key={item.step} className="flex items-center">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                currentStep >= item.step
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/30 text-muted-foreground'
              }`}>
                {currentStep > item.step ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <item.icon className="h-3 w-3" />
                )}
              </div>
              {index < 3 && (
                <div className={`w-6 h-0.5 mx-1 ${
                  currentStep > item.step ? 'bg-primary' : 'bg-muted-foreground/30'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Desktop: Horizontal steps */}
        <div className="hidden sm:flex items-center justify-between w-full">
          {[
            { step: 1, title: 'Court', icon: Calendar },
            { step: 2, title: 'Details', icon: Users },
            { step: 3, title: 'Contact', icon: Users },
            { step: 4, title: 'Payment', icon: CreditCard }
          ].map((item) => (
            <div key={item.step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= item.step
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/30 text-muted-foreground'
                }`}>
                  {currentStep > item.step ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <item.icon className="h-5 w-5" />
                  )}
                </div>
                <span className={`mt-1 text-xs sm:text-sm font-medium ${
                  currentStep >= item.step ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {item.title}
                </span>
              </div>
              {item.step < totalSteps && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep > item.step ? 'bg-primary' : 'bg-muted-foreground/30'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {renderStep()}

      {/* Error Message */}
      {error && (
        <Alert className="border-destructive/20 bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">{error}</div>
            {Object.keys(fieldErrors).length > 1 && (
              <div className="text-sm mt-1">
                Please check all fields marked in red
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
        )}
        {currentStep === 1 && <div />} {/* Spacer for alignment when no Previous button */}

        <div className="flex gap-3">
          {currentStep === totalSteps ? (
            <Button
              onClick={handleBookingSubmit}
              disabled={loading || !selectedCourt}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  Complete Booking
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          ) : currentStep === 1 ? (
            // No Next button for step 1 - court selection advances automatically
            <div />
          ) : (
            <Button onClick={handleNext} className="min-w-[80px]">
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}