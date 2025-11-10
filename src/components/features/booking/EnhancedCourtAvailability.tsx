'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, RefreshCw, MapPin, Clock, Users, Star, Calendar } from 'lucide-react'
import AdaptiveFilterContainer from '@/components/filters/AdaptiveFilterContainer'
import PrimaryFilters from '@/components/filters/FilterGroups/PrimaryFilters'
import LocationFilters from '@/components/filters/FilterGroups/LocationFilters'
import AdvancedFilters from '@/components/filters/FilterGroups/AdvancedFilters'

interface Court {
  id: string
  name: string
  description: string
  venue: {
    id: string
    name: string
    address: string
    city: string
    postalCode: string
    featuredImage: string
    countryCode: string
    currencyCode: string
    timezone: string
    vendor: {
      id: string
      name: string
      slug: string
      logoUrl: string
      primaryColor: string
      secondaryColor: string
    }
  }
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
    playersPerTeam: number
    maxTotalPlayers?: number | null
  }
  pricePerHour: number
  maxPlayers: number
  isAvailable: boolean
  availableSlots: Array<{
    startTime: string
    endTime: string
  }>
}

interface Sport {
  id: string
  name: string
  displayName: string
  icon?: string
}

interface Format {
  id: string
  name: string
  displayName: string
  playersPerTeam: number
  maxTotalPlayers?: number | null
}

interface Venue {
  id: string
  name: string
}

export default function EnhancedCourtAvailability() {
  // State management
  const [sports, setSports] = useState<Sport[]>([])
  const [formats, setFormats] = useState<Format[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<Array<{value: string, label: string}>>([])
  const [venues, setVenues] = useState<Venue[]>([])

  // Search state
  const [searchParams, setSearchParams] = useState({
    sport: '',
    date: '',
    duration: '',
    country: '',
    city: '',
    area: '',
    startTime: '',
    endTime: '',
    priceRange: '',
    venue: '',
    format: ''
  })

  // Generate time slots (6 AM to 11 PM)
  useEffect(() => {
    const slots = []
    for (let hour = 6; hour <= 23; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`
      const displayTime = hour <= 12 ? `${hour}:00 ${hour === 12 ? 'PM' : 'AM'}` : `${hour - 12}:00 PM`
      slots.push({
        value: startTime,
        label: displayTime
      })
    }
    setAvailableTimeSlots(slots)
  }, [])

  // Fetch initial data
  useEffect(() => {
    // Set today's date
    const today = new Date()
    const year = today.getFullYear()
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const day = today.getDate().toString().padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`

    setSearchParams(prev => ({ ...prev, date: formattedDate }))

    // Mock data (in production, this would come from API)
    setSports([
      { id: '1', name: 'football', displayName: 'Football', icon: '⚽' },
      { id: '2', name: 'cricket', displayName: 'Cricket', icon: '🏏' },
      { id: '3', name: 'basketball', displayName: 'Basketball', icon: '🏀' },
      { id: '4', name: 'tennis', displayName: 'Tennis', icon: '🎾' },
    ])

    setFormats([
      { id: '1', name: '5v5', displayName: 'Mini Pitch 5v5', playersPerTeam: 5, maxTotalPlayers: 10 },
      { id: '2', name: '7v7', displayName: 'Small Pitch 7v7', playersPerTeam: 7, maxTotalPlayers: 14 },
      { id: '3', name: '11v11', displayName: 'Full Pitch 11v11', playersPerTeam: 11, maxTotalPlayers: 22 },
    ])

    // Mock venues
    setVenues([
      { id: '1', name: 'Bangalore Sports Complex' },
      { id: '2', name: 'Sports Arena Downtown' },
      { id: '3', name: 'Elite Sports Center' },
    ])
  }, [])

  // Mock countries and cities
  const countries = [
    { value: 'US', label: 'United States' },
    { value: 'IN', label: 'India' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' },
    { value: 'AU', label: 'Australia' },
  ]

  const cities = [
    { value: 'bangalore', label: 'Bangalore' },
    { value: 'mumbai', label: 'Mumbai' },
    { value: 'delhi', label: 'Delhi' },
    { value: 'chennai', label: 'Chennai' },
  ]

  // Enhanced search function
  const fetchCourts = async () => {
    if (!searchParams.sport || !searchParams.date || !searchParams.duration) {
      setError('Please select sport, date, and duration')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // In production, this would be a real API call
      // For demo purposes, we'll create mock data
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockCourts: Court[] = [
        {
          id: '1',
          name: 'Premier Football Pitch',
          description: 'Professional full-size football pitch with FIFA-approved turf',
          venue: {
            id: '1',
            name: 'Bangalore Sports Complex',
            address: '100 Feet Road, Indiranagar',
            city: 'Bangalore',
            postalCode: '560038',
            featuredImage: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800&h=600&fit=crop',
            countryCode: 'IN',
            currencyCode: 'INR',
            timezone: 'Asia/Kolkata',
            vendor: {
              id: '1',
              name: 'Bangalore Sports Arena',
              slug: 'bangalore-sports-arena',
              logoUrl: null,
              primaryColor: '#FF6B35',
              secondaryColor: '#1A535C'
            }
          },
          sport: {
            id: '1',
            name: 'football',
            displayName: 'Football',
            icon: '⚽'
          },
          format: {
            id: '3',
            name: '11v11',
            displayName: 'Full Pitch 11v11',
            playersPerTeam: 11,
            maxTotalPlayers: 22
          },
          pricePerHour: 2500,
          maxPlayers: 22,
          isAvailable: true,
          availableSlots: [
            { startTime: '14:00', endTime: '15:00' },
            { startTime: '15:00', endTime: '16:00' },
            { startTime: '16:00', endTime: '17:00' },
          ]
        },
        {
          id: '2',
          name: 'Training Pitch 7v7',
          description: 'Smaller pitch perfect for training and 7-a-side matches',
          venue: {
            id: '1',
            name: 'Bangalore Sports Complex',
            address: '100 Feet Road, Indiranagar',
            city: 'Bangalore',
            postalCode: '560038',
            featuredImage: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800&h=600&fit=crop',
            countryCode: 'IN',
            currencyCode: 'INR',
            timezone: 'Asia/Kolkata',
            vendor: {
              id: '1',
              name: 'Bangalore Sports Arena',
              slug: 'bangalore-sports-arena',
              logoUrl: null,
              primaryColor: '#FF6B35',
              secondaryColor: '#1A535C'
            }
          },
          sport: {
            id: '1',
            name: 'football',
            displayName: 'Football',
            icon: '⚽'
          },
          format: {
            id: '2',
            name: '7v7',
            displayName: 'Small Pitch 7v7',
            playersPerTeam: 7,
            maxTotalPlayers: 14
          },
          pricePerHour: 1800,
          maxPlayers: 14,
          isAvailable: true,
          availableSlots: [
            { startTime: '17:00', endTime: '18:00' },
            { startTime: '18:00', endTime: '19:00' },
          ]
        }
      ]

      setCourts(mockCourts)
    } catch (error) {
      setError('Failed to load courts. Please try again.')
      console.error('Error fetching courts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<typeof searchParams>) => {
    setSearchParams(prev => ({ ...prev, ...newFilters }))
  }

  const handleClearFilters = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const day = today.getDate().toString().padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`

    setSearchParams({
      sport: '',
      date: formattedDate,
      duration: '',
      country: '',
      city: '',
      area: '',
      startTime: '',
      endTime: '',
      priceRange: '',
      venue: '',
      format: ''
    })
  }

  // Filter courts based on search parameters
  const filteredCourts = useMemo(() => {
    return courts.filter(court => {
      if (searchParams.venue && searchParams.venue !== 'all' && court.venue.id !== searchParams.venue) {
        return false
      }
      if (searchParams.format && searchParams.format !== 'all' && court.format.id !== searchParams.format) {
        return false
      }
      return true
    })
  }, [courts, searchParams])

  // Court card component
  const CourtCard = ({ court }: { court: Court }) => (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{court.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {court.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {court.format.displayName}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {court.venue.name}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: court.venue.currencyCode
              }).format(court.pricePerHour)}
            </div>
            <div className="text-xs text-muted-foreground">per hour</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Venue Information */}
          <div className="flex items-start gap-3">
            <img
              src={court.venue.featuredImage}
              alt={court.venue.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h4 className="font-medium">{court.venue.name}</h4>
              <p className="text-sm text-muted-foreground">{court.venue.address}</p>
              <p className="text-xs text-muted-foreground">
                {court.venue.city}, {court.venue.countryCode}
              </p>
            </div>
          </div>

          {/* Sport Information */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{court.sport.icon}</span>
            <div>
              <div className="font-medium">{court.sport.displayName}</div>
              <div className="text-sm text-muted-foreground">{court.sport.name}</div>
            </div>
          </div>

          {/* Available Slots */}
          {court.isAvailable && court.availableSlots.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  Available Slots ({court.availableSlots.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {court.availableSlots.slice(0, 3).map((slot, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {slot.startTime}
                  </Badge>
                ))}
                {court.availableSlots.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{court.availableSlots.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button className="w-full" size="lg">
            Book Now
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // Loading skeletons
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Skeleton className="w-16 h-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <AdaptiveFilterContainer
      appliedFilters={searchParams}
      onClearFilters={handleClearFilters}
      onFilterChange={handleFilterChange}
      loading={loading}
      resultCount={filteredCourts.length}
      showResultsCount={true}
    >
      {/* Filter Content */}
      <div className="space-y-6">
        {/* Primary Filters */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Primary Filters</h3>
          <PrimaryFilters
            sport={searchParams.sport}
            date={searchParams.date}
            duration={searchParams.duration}
            onSportChange={(sport) => handleFilterChange({ sport })}
            onDateChange={(date) => handleFilterChange({ date })}
            onDurationChange={(duration) => handleFilterChange({ duration })}
            sports={sports}
            isMobile={false}
            loading={loading}
          />
        </div>

        {/* Location Filters */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Location</h3>
          <LocationFilters
            country={searchParams.country}
            city={searchParams.city}
            area={searchParams.area}
            onCountryChange={(country) => handleFilterChange({ country })}
            onCityChange={(city) => handleFilterChange({ city })}
            onAreaChange={(area) => handleFilterChange({ area })}
            countries={countries}
            cities={cities}
            isMobile={false}
            loading={loading}
          />
        </div>

        {/* Advanced Filters */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Advanced Options</h3>
          <AdvancedFilters
            startTime={searchParams.startTime}
            endTime={searchParams.endTime}
            priceRange={searchParams.priceRange}
            venue={searchParams.venue}
            format={searchParams.format}
            onStartTimeChange={(startTime) => handleFilterChange({ startTime })}
            onEndTimeChange={(endTime) => handleFilterChange({ endTime })}
            onPriceRangeChange={(priceRange) => handleFilterChange({ priceRange })}
            onVenueChange={(venue) => handleFilterChange({ venue })}
            onFormatChange={(format) => handleFilterChange({ format })}
            venues={venues}
            formats={formats}
            timeSlots={availableTimeSlots}
            isMobile={false}
            loading={loading}
          />
        </div>

        {/* Search Button */}
        <Button
          onClick={fetchCourts}
          disabled={loading || !searchParams.sport || !searchParams.date || !searchParams.duration}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              Search Courts
            </>
          )}
        </Button>
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        {loading && <LoadingSkeleton />}

        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                  <h3 className="font-medium text-destructive-foreground">Error</h3>
                  <p className="text-sm text-destructive-foreground">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && filteredCourts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Available Courts ({filteredCourts.length})
              </h3>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">
                  All courts are verified and maintained
                </span>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
              {filteredCourts.map((court) => (
                <CourtCard key={court.id} court={court} />
              ))}
            </div>
          </div>
        )}

        {!loading && !error && filteredCourts.length === 0 && (searchParams.sport || searchParams.date || searchParams.duration) && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">No courts found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search criteria to find available courts.
                </p>
                <Button onClick={handleClearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && !searchParams.sport && !searchParams.date && !searchParams.duration && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Start Your Search</h3>
                <p className="text-muted-foreground">
                  Select your sport, date, and duration to find available courts for booking.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdaptiveFilterContainer>
  )
}