'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, CreditCard, Check, AlertCircle, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import CourtAvailability from './CourtAvailability'

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
    vendor: {
      id: string
      name: string
      slug: string
      primaryColor: string
      secondaryColor: string
    }
  }
}

interface BookingDetails {
  type: 'SIMPLE' | 'MATCH' | 'TOURNAMENT'
  title: string
  description: string
  maxPlayers: number
  notes: string
  skillLevel: 'beginner' | 'intermediate' | 'advanced'
  isPublic: boolean
}

interface PaymentDetails {
  method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'STRIPE' | 'CASH' | 'BANK_TRANSFER'
  cardNumber?: string
  cardExpiry?: string
  cardCVV?: string
  cardholderName?: string
  saveCard: boolean
}

interface BookingFlowProps {
  onBookingComplete: (booking: any) => void
  initialCourt?: Court
  initialDate?: string
  initialTime?: string
  initialDuration?: number
  initialTotalAmount?: number
}

export default function BookingFlow({
  onBookingComplete,
  initialCourt,
  initialDate,
  initialTime,
  initialDuration,
  initialTotalAmount
}: BookingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Court Selection
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(initialCourt || null)
  const [selectedDate, setSelectedDate] = useState(initialDate || '')
  const [selectedTime, setSelectedTime] = useState(initialTime || '09:00')
  const [selectedDuration, setSelectedDuration] = useState(initialDuration?.toString() || '2')
  const [totalAmount, setTotalAmount] = useState(initialTotalAmount || 0)

  // Step 2: Booking Details
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    type: 'SIMPLE',
    title: '',
    description: '',
    maxPlayers: 2,
    notes: '',
    skillLevel: 'intermediate',
    isPublic: true
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
    setCurrentStep(2)
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(selectedCourt && selectedDate && selectedTime && selectedDuration)
      case 2:
        return !!(bookingDetails.title && bookingDetails.type)
      case 3:
        return !!(userInfo.name && userInfo.email && userInfo.phone)
      case 4:
        return !!paymentDetails.method
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
      }
    } else {
      setError('Please complete all required fields')
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError('')
    }
  }

  const handleBookingSubmit = async () => {
    if (!selectedCourt || !validateStep(currentStep)) {
      setError('Please complete all required fields')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Create booking via API
      const bookingData = {
        courtId: selectedCourt.id,
        userId: userInfo.userId,
        sportId: selectedCourt.sport.id,
        startTime: new Date(`${selectedDate}T${selectedTime}:00.000Z`).toISOString(),
        endTime: new Date(`${selectedDate}T${selectedTime}:00.000Z`).getTime() +
                  parseInt(selectedDuration) * 60 * 60 * 1000,
        duration: parseInt(selectedDuration),
        totalAmount,
        type: bookingDetails.type,
        title: bookingDetails.title,
        description: bookingDetails.description,
        maxPlayers: bookingDetails.maxPlayers,
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
          description: `Booking for ${selectedCourt.name} on ${selectedDate}`,
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
          onBookingComplete({ booking: booking.booking, payment: payment.payment })
        } else {
          // Booking created but payment failed
          onBookingComplete({ booking: booking.booking, payment: null })
        }
      }

    } catch (error) {
      console.error('Booking error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {[...Array(totalSteps)].map((_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep > i + 1
                ? 'bg-success text-primary-foreground'
                : currentStep === i + 1
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground'
            }`}
          >
            {currentStep > i + 1 ? <Check className="h-5 w-5" /> : i + 1}
          </div>
          <div className="ml-2">
            <div className={`text-sm font-medium ${
              currentStep === i + 1 ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {i === 0 && 'Select Court'}
              {i === 1 && 'Booking Details'}
              {i === 2 && 'Your Information'}
              {i === 3 && 'Payment'}
            </div>
          </div>
          {i < totalSteps - 1 && (
            <div className={`flex-1 h-1 mx-4 ${
              currentStep > i + 1 ? 'bg-success' : 'bg-muted/50'
            }`} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <CourtAvailability
            onCourtSelect={handleCourtSelect}
            selectedSport={selectedCourt?.sport.name}
            selectedDate={selectedDate}
            selectedCity={selectedCourt?.venue.city}
            selectedArea={selectedCourt?.venue.area || ''}
          />
        )

      case 2:
        return (
          <div className="space-y-6">
            {/* Booking Summary */}
            {selectedCourt && (
              <Card className="bg-primary/10 border-primary/20">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-primary-foreground mb-3">Selected Court</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Court:</span>
                      <p className="font-medium">{selectedCourt.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Venue:</span>
                      <p className="font-medium">{selectedCourt.venue.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date & Time:</span>
                      <p className="font-medium">{selectedDate} at {selectedTime}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <p className="font-medium">{selectedDuration} hour(s)</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-primary-foreground">Total Amount:</span>
                      <span className="text-xl font-bold text-primary-foreground">{formatPrice(totalAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Type</CardTitle>
                <CardDescription>Choose how you want to use this court</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: 'SIMPLE', label: 'Simple Booking', desc: 'Just book the court for yourself or group' },
                    { value: 'MATCH', label: 'Create Match', desc: 'Open it up for others to join' },
                    { value: 'TOURNAMENT', label: 'Tournament', desc: 'Organize a tournament' }
                  ].map((type) => (
                    <Button
                      key={type.value}
                      variant={bookingDetails.type === type.value ? 'default' : 'outline'}
                      className={`h-auto p-4 flex-col items-start ${
                        bookingDetails.type === type.value ? 'bg-primary text-primary-foreground' : ''
                      }`}
                      onClick={() => setBookingDetails(prev => ({ ...prev, type: type.value as any }))}
                    >
                      <div className="font-semibold">{type.label}</div>
                      <div className={`text-xs mt-1 ${
                        bookingDetails.type === type.value ? 'text-blue-100' : 'text-muted-foreground'
                      }`}>
                        {type.desc}
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Give your booking a title"
                      value={bookingDetails.title}
                      onChange={(e) => setBookingDetails(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPlayers">Max Players</Label>
                    <Select
                      value={bookingDetails.maxPlayers.toString()}
                      onValueChange={(value) => setBookingDetails(prev => ({
                        ...prev,
                        maxPlayers: parseInt(value)
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCourt && [...Array(selectedCourt.format.maxPlayers)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1} {i === 0 ? 'player' : 'players'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {bookingDetails.type === 'MATCH' && (
                  <div className="space-y-2">
                    <Label>Skill Level</Label>
                    <Select
                      value={bookingDetails.skillLevel}
                      onValueChange={(value) => setBookingDetails(prev => ({
                        ...prev,
                        skillLevel: value as any
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your booking, match, or tournament..."
                    value={bookingDetails.description}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special requirements or notes..."
                    value={bookingDetails.notes}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>Provide your contact details for the booking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={userInfo.phone}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCourt && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Court:</span>
                      <span className="font-medium">{selectedCourt.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-medium">{selectedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">{selectedDuration} hour(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate:</span>
                      <span className="font-medium">{formatPrice(selectedCourt.pricePerHour)}/hour</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount:</span>
                      <span className="text-success">{formatPrice(totalAmount)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { value: 'CREDIT_CARD', label: 'Credit Card', icon: '💳' },
                    { value: 'DEBIT_CARD', label: 'Debit Card', icon: '💳' },
                    { value: 'STRIPE', label: 'Stripe', icon: '🔵' },
                    { value: 'PAYPAL', label: 'PayPal', icon: '🅿️' },
                    { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦' },
                    { value: 'CASH', label: 'Pay at Venue', icon: '💵' }
                  ].map((method) => (
                    <Button
                      key={method.value}
                      variant={paymentDetails.method === method.value ? 'default' : 'outline'}
                      className={`h-auto p-4 flex-col items-center gap-2 ${
                        paymentDetails.method === method.value ? 'bg-primary text-primary-foreground' : ''
                      }`}
                      onClick={() => setPaymentDetails(prev => ({ ...prev, method: method.value as any }))}
                    >
                      <div className="text-2xl">{method.icon}</div>
                      <div className="font-medium">{method.label}</div>
                    </Button>
                  ))}
                </div>

                {(paymentDetails.method === 'CREDIT_CARD' || paymentDetails.method === 'DEBIT_CARD') && (
                  <div className="mt-6 p-4 bg-muted rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={paymentDetails.cardNumber || ''}
                          onChange={(e) => setPaymentDetails(prev => ({
                            ...prev,
                            cardNumber: e.target.value
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardholderName">Cardholder Name</Label>
                        <Input
                          id="cardholderName"
                          placeholder="John Doe"
                          value={paymentDetails.cardholderName || ''}
                          onChange={(e) => setPaymentDetails(prev => ({
                            ...prev,
                            cardholderName: e.target.value
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardExpiry">Expiry Date</Label>
                        <Input
                          id="cardExpiry"
                          placeholder="MM/YY"
                          value={paymentDetails.cardExpiry || ''}
                          onChange={(e) => setPaymentDetails(prev => ({
                            ...prev,
                            cardExpiry: e.target.value
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardCVV">CVV</Label>
                        <Input
                          id="cardCVV"
                          placeholder="123"
                          value={paymentDetails.cardCVV || ''}
                          onChange={(e) => setPaymentDetails(prev => ({
                            ...prev,
                            cardCVV: e.target.value
                          }))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="saveCard"
                        checked={paymentDetails.saveCard}
                        onChange={(e) => setPaymentDetails(prev => ({
                          ...prev,
                          saveCard: e.target.checked
                        }))}
                        className="rounded border-border"
                      />
                      <Label htmlFor="saveCard" className="text-sm">
                        Save card for future bookings
                      </Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                By confirming this booking, you agree to our terms of service and cancellation policy.
                Court bookings are non-refundable if cancelled less than 24 hours before the scheduled time.
              </AlertDescription>
            </Alert>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {renderStepIndicator()}

      {error && (
        <Alert className="mb-6 border-destructive/20 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive-foreground">{error}</AlertDescription>
        </Alert>
      )}

      {renderStepContent()}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep < totalSteps ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleBookingSubmit} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Complete Booking
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}