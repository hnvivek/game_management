'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  MapPin,
  Clock,
  Users,
  Phone,
  Mail,
  Globe,
  Star,
  Heart,
  Share2,
  Calendar as CalendarIcon,
  DollarSign,
  ChevronRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface Venue {
  id: string
  name: string
  description: string
  address: string
  city: string
  postalCode: string
  phone: string
  email: string
  featuredImage: string | null
  isActive: boolean
  courts: Array<{
    id: string
    name: string
    description: string
    surface: string
    pricePerHour: number
    maxPlayers: number
    features: string[]
    images: string[]
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
  }>
  operatingHours: Array<{
    id: string
    dayOfWeek: number
    openingTime: string
    closingTime: string
    isOpen: boolean
  }>
  openingHours: string
  vendor: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    verified: boolean
  }
}

interface TimeSlot {
  time: string
  available: boolean
  courtId: string
  price: number
}

export default function VenueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const venueId = params.id as string

  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Booking state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedCourt, setSelectedCourt] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [bookingLoading, setBookingLoading] = useState(false)

  useEffect(() => {
    fetchVenueDetails()
  }, [venueId])

  useEffect(() => {
    if (selectedDate && selectedCourt) {
      fetchAvailableSlots()
    }
  }, [selectedDate, selectedCourt])

  const fetchVenueDetails = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/venues/${venueId}`)
      if (!response.ok) {
        throw new Error('Venue not found')
      }

      const data = await response.json()
      setVenue(data.venue)

      // Set default court if available
      if (data.venue.courts.length > 0) {
        setSelectedCourt(data.venue.courts[0].id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load venue details')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !selectedCourt) return

    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const response = await fetch(
        `/api/bookings/availability?venueId=${venueId}&courtId=${selectedCourt}&date=${dateStr}`
      )

      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.slots || [])
      }
    } catch (err) {
      console.error('Failed to fetch available slots:', err)
    }
  }

  const handleBooking = async () => {
    if (!selectedDate || !selectedCourt || !selectedTime) {
      setError('Please select date, court, and time')
      return
    }

    setBookingLoading(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venueId,
          courtId: selectedCourt,
          date: selectedDate.toISOString().split('T')[0],
          time: selectedTime,
          duration: 60, // Default 1 hour
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create booking')
      }

      // Redirect to booking confirmation or success page
      alert('Booking successful! You will be redirected to confirmation page.')
      // TODO: Redirect to booking confirmation page

    } catch (err: any) {
      setError(err.message || 'Failed to create booking')
    } finally {
      setBookingLoading(false)
    }
  }

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 6; hour <= 23; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`
      const isAvailable = availableSlots.some(slot => slot.time === time && slot.available)
      slots.push({
        time,
        available: isAvailable,
        courtId: selectedCourt,
        price: venue?.courts.find(c => c.id === selectedCourt)?.pricePerHour || 0
      })
    }
    return slots
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-muted-foreground">{error || 'Venue not found'}</p>
          <Button onClick={() => router.back()} className="mt-4">
            Back to Venues
          </Button>
        </div>
      </div>
    )
  }

  const timeSlots = generateTimeSlots()
  const selectedCourtData = venue.courts.find(c => c.id === selectedCourt)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-blue-100 hover:text-white mb-6 transition-colors duration-200"
            >
              ← Back to Venues
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h1 className="text-4xl font-bold mb-4">{venue.name}</h1>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={20} />
                    <span>{venue.address}, {venue.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={20} />
                    <span>{venue.openingHours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={20} />
                    <span>{venue.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={20} />
                    <span>{venue.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="bg-white/10 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold mb-2">
                    From {selectedCourtData ? `$${selectedCourtData.pricePerHour}` : '$--'}/hour
                  </div>
                  <p className="text-blue-100">per court</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Venue Description */}
            <Card>
              <CardHeader>
                <CardTitle>About {venue.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{venue.description}</p>
              </CardContent>
            </Card>

            {/* Booking Section */}
            <Card>
              <CardHeader>
                <CardTitle>Book a Court</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Date Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Date</label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date() || date < new Date(new Date().setHours(0,0,0,0))}
                    className="rounded-md border"
                  />
                </div>

                {/* Court Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Court</label>
                  <Select value={selectedCourt} onValueChange={setSelectedCourt}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a court" />
                    </SelectTrigger>
                    <SelectContent>
                      {venue.courts.map((court) => (
                        <SelectItem key={court.id} value={court.id}>
                          {court.name} ({court.sport.displayName}) - ${court.pricePerHour}/hr
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Selection */}
                {selectedDate && selectedCourt && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Available Times</label>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot.time}
                          variant={selectedTime === slot.time ? "default" : "outline"}
                          size="sm"
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={!slot.available ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Booking Summary */}
                {selectedDate && selectedCourt && selectedTime && selectedCourtData && (
                  <Card className="bg-blue-50">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Booking Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div>Date: {selectedDate.toLocaleDateString()}</div>
                        <div>Court: {selectedCourtData.name}</div>
                        <div>Time: {selectedTime}</div>
                        <div>Duration: 1 hour</div>
                        <div className="font-semibold text-base mt-2">
                          Total: ${selectedCourtData.pricePerHour}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Book Button */}
                <Button
                  onClick={handleBooking}
                  disabled={!selectedDate || !selectedCourt || !selectedTime || bookingLoading}
                  className="w-full"
                  size="lg"
                >
                  {bookingLoading ? (
                    <>Processing...</>
                  ) : (
                    <>Book Now</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Courts Information */}
            <Card>
              <CardHeader>
                <CardTitle>Available Courts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {venue.courts.map((court) => (
                    <div key={court.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{court.name}</h4>
                          <p className="text-sm text-muted-foreground">{court.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant="secondary">{court.sport.displayName}</Badge>
                            <span className="text-sm">Max {court.maxPlayers} players</span>
                            <span className="text-sm font-medium">${court.pricePerHour}/hour</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vendor Info */}
            <Card>
              <CardHeader>
                <CardTitle>Managed By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {venue.vendor.logoUrl ? (
                    <img
                      src={venue.vendor.logoUrl}
                      alt={venue.vendor.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {venue.vendor.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium">{venue.vendor.name}</h4>
                    {venue.vendor.verified && (
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        Verified Vendor
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Facilities & Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {venue.courts[0]?.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      {feature}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Operating Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Operating Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {venue.operatingHours.map((hours) => (
                    <div key={hours.id} className="flex justify-between text-sm">
                      <span>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][hours.dayOfWeek]}</span>
                      <span>{hours.isOpen ? `${hours.openingTime} - ${hours.closingTime}` : 'Closed'}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}