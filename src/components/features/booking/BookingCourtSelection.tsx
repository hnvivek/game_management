'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Calendar, DollarSign, Users, AlertTriangle, Clock, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import OptimizedResponsiveFilters from '@/components/filters/OptimizedResponsiveFilters'

// Enhanced types based on our API schema
interface Sport {
  id: string
  name: string
  displayName: string
  icon?: string
  isActive: boolean
  formats?: Format[]
}

interface Format {
  id: string
  name: string
  displayName: string
  minPlayers: number
  maxPlayers: number
  isActive: boolean
}

interface Vendor {
  id: string
  name: string
  slug: string
  primaryColor: string
  secondaryColor: string
  timezone?: string
}

interface Court {
  id: string
  name: string
  description?: string
  courtNumber: number
  pricePerHour: number
  features: string[]
  isActive: boolean
  sport: Sport
  format?: Format
  maxPlayers?: number
  venue: {
    id: string
    name: string
    address: string
    city: string
    area?: string
    postalCode?: string
    currencyCode: string
    timezone: string
    vendor: Vendor
  }
  isAvailable?: boolean
  availableSlots?: Array<{
    startTime: string
    endTime: string
  }>
}

interface BookingCourtSelectionProps {
  onCourtSelect: (court: Court, date: string, startTime: string, duration: number, totalAmount: number) => void
  initialCourt?: Court | null
  initialDate?: string
  initialDuration?: number
  preSelectedVendorId?: string
}

// Static time slots and price ranges for filters
const timeSlots = [
  { value: '06:00', label: '6:00 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
  { value: '22:00', label: '10:00 PM' },
]

const priceRanges = [
  { value: '0-25', label: 'Under $25' },
  { value: '25-50', label: '$25 - $50' },
  { value: '50-100', label: '$50 - $100' },
  { value: '100+', label: '$100+' },
]

export default function BookingCourtSelection({
  onCourtSelect,
  initialCourt,
  initialDate,
  initialDuration,
  preSelectedVendorId
}: BookingCourtSelectionProps) {
  const [loading, setLoading] = useState(false)
  const [courts, setCourts] = useState<Court[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Minimum required search params for API
  const [formats, setFormats] = useState<Format[]>([])

  const [searchParams, setSearchParams] = useState({
    selectedSport: '', // Will be set after sports are loaded
    selectedDate: initialDate || new Date().toISOString().split('T')[0], // Today's date
    selectedDuration: initialDuration?.toString() || '2', // Default 2-hour session
    selectedCity: null as string | null,
    selectedArea: '',
    selectedCountry: null as string | null,
    selectedFormat: '',
    selectedStartTime: null as string | null,
    selectedEndTime: null as string | null,
    selectedPriceRange: '',
    selectedVenue: 'all'
  })

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Auto-search when first sport is loaded
  useEffect(() => {
    if (sports.length > 0 && !searchParams.selectedSport) {
      const firstSport = sports[0]

      // Set the sport immediately and trigger search
      const updatedParams = { ...searchParams, selectedSport: firstSport.name }
      setSearchParams(updatedParams)

      // Load formats for the first sport
      loadFormats(firstSport.name)

      // Trigger search with the first sport
      performDirectSearch(firstSport.name, searchParams.selectedDate, searchParams.selectedDuration)
    }
  }, [sports])

  // Load formats when sport changes
  useEffect(() => {
    if (searchParams.selectedSport) {
      loadFormats(searchParams.selectedSport)
    }
  }, [searchParams.selectedSport])

  const loadFormats = async (sportName: string) => {
    try {
      const response = await fetch(`/api/sports/${sportName}/formats`)
      if (response.ok) {
        const data = await response.json()
        setFormats(data.formats || [])
      } else {
        setFormats([])
      }
    } catch (error) {
      console.error('Failed to load formats:', error)
      setFormats([])
    }
  }

  const loadInitialData = async () => {
    try {
      // Load sports
      const sportsResponse = await fetch('/api/sports')
      if (sportsResponse.ok) {
        const sportsData = await sportsResponse.json()
        setSports(sportsData.sports || [])
      }

      // Load venues
      const venuesResponse = await fetch('/api/venues')
      if (venuesResponse.ok) {
        const venuesData = await venuesResponse.json()
        setVenues(venuesData.venues || [])
      }
    } catch (error) {
      console.error('Failed to load initial data:', error)
      setError('Failed to load initial data')
    }
  }

  const performDirectSearch = async (sport: string, date: string, duration: string) => {
    if (!sport || !date || !duration) return

    setLoading(true)
    setError(null)
    setSearchPerformed(true)

    try {
      const queryParams = new URLSearchParams({
        sport,
        date,
        duration,
        available: 'true'
      })

      // Add vendor filtering if pre-selected
      if (preSelectedVendorId) {
        queryParams.append('vendorId', preSelectedVendorId)
      }

      const response = await fetch(`/api/courts?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch courts')
      }

      const data = await response.json()
      setCourts(data.courts || [])
    } catch (error) {
      console.error('Direct search failed:', error)
      setError('Failed to search courts. Please try again.')
      setCourts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearchParamsChange = (newParams: any) => {
    setSearchParams(prev => ({ ...prev, ...newParams }))
  }

  const handleSearch = async () => {
    if (!searchParams.selectedSport || !searchParams.selectedDate || !searchParams.selectedDuration) {
      setError('Please select sport, date, and duration')
      return
    }

    setLoading(true)
    setError(null)
    setSearchPerformed(true)

    try {
      // Build API query parameters
      const queryParams = new URLSearchParams({
        sport: searchParams.selectedSport,
        date: searchParams.selectedDate,
        duration: searchParams.selectedDuration,
        available: 'true'
      })

      // Add optional parameters
      if (searchParams.selectedCity) queryParams.append('city', searchParams.selectedCity)
      if (searchParams.selectedArea) queryParams.append('area', searchParams.selectedArea)
      if (searchParams.selectedCountry) queryParams.append('country', searchParams.selectedCountry)
      if (searchParams.selectedFormat) queryParams.append('format', searchParams.selectedFormat)
      if (searchParams.selectedStartTime) queryParams.append('startTime', searchParams.selectedStartTime)
      if (searchParams.selectedEndTime) queryParams.append('endTime', searchParams.selectedEndTime)
      if (searchParams.selectedVenue && searchParams.selectedVenue !== 'all') {
        queryParams.append('venueId', searchParams.selectedVenue)
      }

      // Add vendor filtering if pre-selected
      if (preSelectedVendorId) {
        queryParams.append('vendorId', preSelectedVendorId)
      }

      const response = await fetch(`/api/courts?${queryParams}`)

      if (!response.ok) {
        throw new Error('Failed to fetch courts')
      }

      const data = await response.json()
      setCourts(data.courts || [])

    } catch (error) {
      console.error('Search failed:', error)
      setError('Failed to search courts. Please try again.')
      setCourts([])
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handleCourtBooking = (court: Court) => {
    // Calculate the first available time slot or use a default
    let selectedTime = '09:00'

    if (court.availableSlots && court.availableSlots.length > 0) {
      selectedTime = court.availableSlots[0].startTime
    }

    const totalAmount = court.pricePerHour * parseInt(searchParams.selectedDuration)

    onCourtSelect(
      court,
      searchParams.selectedDate,
      selectedTime,
      parseInt(searchParams.selectedDuration),
      totalAmount
    )
  }

  const CourtCard = ({ court }: { court: Court }) => (
    <Card data-testid="court-card" className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
      {/* Rectangular layout for larger screens */}
      <div className="hidden lg:flex">
        {/* Left side - Court info with availability */}
        <div className="flex-1 p-4 border-r min-w-0">
          <div className="flex items-start gap-3">
            <div className="text-3xl">{court.sport.icon || '🏃'}</div>
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{court.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mb-2">
                <MapPin className="h-3 w-3" />
                {court.venue.name}, {court.venue.city}
              </CardDescription>

              {/* Sport and Format */}
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="secondary" className="text-sm">
                  {court.sport.displayName}
                  {court.format && court.format.displayName !== court.sport.displayName && ` • ${court.format.displayName}`}
                </Badge>
                {court.format && (
                  <span className="text-sm text-muted-foreground">
                    {court.format.minPlayers}-{court.format.maxPlayers} players
                  </span>
                )}
              </div>

              {/* Availability Info - Moved here */}
              {court.availableSlots && court.availableSlots.length > 0 && (
                <div className="bg-muted/30 border border-border rounded-lg p-1.5 mb-2 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        Available Today
                      </span>
                      {(court.venue.vendor?.timezone || court.venue.timezone) && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Globe className="h-2.5 w-2.5" />
                          {court.venue.vendor?.timezone || court.venue.timezone}
                        </div>
                      )}
                    </div>
                    <Badge variant="default" className="bg-primary text-xs px-1.5 py-0.5">
                      {court.availableSlots.length}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-0.5 items-center">
                    {court.availableSlots.slice(0, 6).map((slot, index) => (
                      <div key={index} className="text-xs text-muted-foreground bg-background border border-border rounded px-1.5 py-0.5 flex items-center gap-0.5 whitespace-nowrap">
                        <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                        <span>{slot.startTime}-{slot.endTime}</span>
                      </div>
                    ))}
                    {court.availableSlots.length > 6 && (
                      <div className="text-xs text-muted-foreground font-medium bg-background border border-border rounded px-1.5 py-0.5 whitespace-nowrap">
                        +{court.availableSlots.length - 6} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Price, address and vendor info */}
        <div className="w-72 p-3 flex flex-col justify-between">
          <div>
            <div className="text-2xl font-bold text-primary mb-1">
              {formatPrice(court.pricePerHour, court.venue.currencyCode)}
            </div>
            <div className="text-sm text-muted-foreground mb-4">per hour</div>

            {/* Vendor Info - Moved above address */}
            {court.venue.vendor && (
              <div className="mb-3">
                <Badge
                  variant="outline"
                  className="text-xs w-full justify-center"
                  style={{
                    borderColor: court.venue.vendor.primaryColor,
                    color: court.venue.vendor.primaryColor
                  }}
                >
                  {court.venue.vendor.name}
                </Badge>
              </div>
            )}

            {/* Venue Address - Moved here */}
            <div className="text-sm text-muted-foreground leading-tight mb-3 p-2 bg-muted/20 rounded-lg">
              <div className="flex items-start gap-1.5 mb-1">
                <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                <span>{court.venue.address}</span>
              </div>
              {court.venue.area && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span>{court.venue.area}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <Button
            onClick={() => handleCourtBooking(court)}
            className="w-full h-12 px-6 bg-primary hover:bg-primary/90 text-white font-medium transition-all duration-200 hover:shadow-lg"
            disabled={!court.isAvailable}
          >
            {court.isAvailable ? 'Select Court' : 'Unavailable'}
          </Button>
        </div>
      </div>

      {/* Mobile layout - vertical card */}
      <div className="lg:hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-2xl">{court.sport.icon || '🏃'}</span>
                {court.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {court.venue.name}, {court.venue.city}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {formatPrice(court.pricePerHour, court.venue.currencyCode)}
              </div>
              <div className="text-xs text-muted-foreground">per hour</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Sport and Format */}
          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              {court.sport.displayName}
              {court.format && court.format.displayName !== court.sport.displayName && ` • ${court.format.displayName}`}
            </Badge>
            {court.format && (
              <span className="text-xs text-muted-foreground">
                {court.format.minPlayers}-{court.format.maxPlayers} players
              </span>
            )}
          </div>

          {/* Availability Info */}
          {court.availableSlots && court.availableSlots.length > 0 && (
            <div className="bg-muted/30 border border-border rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    Available Today
                  </span>
                  {(court.venue.vendor?.timezone || court.venue.timezone) && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="h-2.5 w-2.5" />
                      {court.venue.vendor?.timezone || court.venue.timezone}
                    </div>
                  )}
                </div>
                <Badge variant="default" className="bg-primary text-xs px-1.5 py-0.5">
                  {court.availableSlots.length}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {court.availableSlots.slice(0, 4).map((slot, index) => (
                  <div key={index} className="text-xs text-muted-foreground bg-background border border-border rounded px-1.5 py-0.5 flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {slot.startTime}-{slot.endTime}
                  </div>
                ))}
                {court.availableSlots.length > 4 && (
                  <div className="text-xs text-muted-foreground font-medium bg-background border border-border rounded px-1.5 py-0.5">
                    +{court.availableSlots.length - 4} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vendor Info */}
          {court.venue.vendor && (
            <div className="flex justify-center">
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: court.venue.vendor.primaryColor,
                  color: court.venue.vendor.primaryColor
                }}
              >
                {court.venue.vendor.name}
              </Badge>
            </div>
          )}

          <Button
            onClick={() => handleCourtBooking(court)}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium transition-all duration-200 hover:shadow-lg"
            disabled={!court.isAvailable}
          >
            {court.isAvailable ? 'Select Court' : 'Unavailable'}
          </Button>
        </CardContent>
      </div>
    </Card>
  )

  return (
    <div className="space-y-6">

      {/* Filters and Results - Using OptimizedResponsiveFilters layout */}
      <OptimizedResponsiveFilters
        sports={sports}
        formats={formats}
        venues={venues}
        timeSlots={timeSlots}
        priceRanges={priceRanges}
        availableTimeSlots={timeSlots}
        searchParams={searchParams}
        onSearchParamsChange={handleSearchParamsChange}
        onSearch={handleSearch}
        loading={loading}
      >
        {/* Results Section - This will be rendered as the main content area */}
        <div className="space-y-6">
          {/* Error Message */}
          {error && (
            <Alert className="border-red-200 bg-red-50 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-10 w-32" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Results */}
          {!loading && searchPerformed && (
            <div className="space-y-4">
              {courts.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium">
                      Available Courts ({courts.length})
                    </h4>
                  </div>
                  {courts.map((court) => (
                    <CourtCard key={court.id} court={court} />
                  ))}
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No courts available</h3>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting your search criteria or date to find available courts.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </OptimizedResponsiveFilters>
    </div>
  )
}