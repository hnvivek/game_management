'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Calendar, DollarSign, Users, Star, ExternalLink, Filter, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import OptimizedResponsiveFilters from '@/components/filters/OptimizedResponsiveFilters'
import Navbar from '@/components/navbar'

// API Types
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
  address?: string
  city?: string
  currencyCode?: string
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
  venue: {
    id: string
    name: string
    address: string
    city: string
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

export default function CourtsPage() {
  const [loading, setLoading] = useState(false)
  const [courts, setCourts] = useState<Court[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [venues, setVenues] = useState<Vendor[]>([])
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Minimum required search params for API
  const [searchParams, setSearchParams] = useState({
    selectedSport: '', // Will be set after sports are loaded
    selectedDate: new Date().toISOString().split('T')[0], // Today's date
    selectedDuration: '2', // Default 2-hour session
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

      // Trigger search with the first sport
      performDirectSearch(firstSport.name, searchParams.selectedDate, searchParams.selectedDuration)
    }
  }, [sports])

  
  
  const loadInitialData = async () => {
    try {
      // Load sports
      const sportsResponse = await fetch('/api/sports')
      if (sportsResponse.ok) {
        const sportsData = await sportsResponse.json()
        setSports(sportsData.sports || [])
      }

      // Load vendors for venues
      const vendorsResponse = await fetch('/api/vendors')
      if (vendorsResponse.ok) {
        const vendorsData = await vendorsResponse.json()
        setVenues(vendorsData.vendors || [])
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

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const CourtCard = ({ court }: { court: Court }) => (
    <Card data-testid="court-card" className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
      {/* Rectangular layout for larger screens */}
      <div className="hidden md:flex">
        {/* Left side - Court info */}
        <div className="flex-1 p-4 border-r">
          <div className="flex items-start gap-3">
            <div className="text-3xl">{court.sport.icon || '🏃'}</div>
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{court.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mb-2">
                <MapPin className="h-3 w-3" />
                {court.venue.name}, {court.venue.city}
              </CardDescription>

              {/* Sport and Format */}
              <div className="flex items-center gap-3 mb-3">
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

              {/* Venue Info */}
              <div className="text-sm text-muted-foreground leading-tight">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span>{court.venue.address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Price and availability */}
        <div className="w-72 p-4 flex flex-col justify-between">
          <div>
            <div className="text-2xl font-bold text-primary mb-1">
              {formatPrice(court.pricePerHour, court.venue.currencyCode)}
            </div>
            <div className="text-sm text-muted-foreground mb-3">per hour</div>

            {/* Availability Info */}
            {court.availableSlots && court.availableSlots.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Available Today
                  </span>
                  <Badge variant="default" className="bg-green-600">
                    {court.availableSlots.length} slots
                  </Badge>
                </div>
                <div className="space-y-2">
                  {court.availableSlots.slice(0, 3).map((slot, index) => (
                    <div key={index} className="text-sm text-green-600 dark:text-green-400">
                      {slot.startTime} - {slot.endTime}
                    </div>
                  ))}
                  {court.availableSlots.length > 3 && (
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                      +{court.availableSlots.length - 3} more slots
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button className="flex-1 h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium transition-all duration-200 hover:shadow-lg">
              <Search className="h-4 w-4 mr-2" />
              Book Now
            </Button>
            <Button variant="outline" className="h-12 px-4 hover:bg-gray-50 transition-colors duration-200">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile layout - original vertical card */}
      <div className="md:hidden">
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
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Available Today
                </span>
                <Badge variant="default" className="bg-green-600">
                  {court.availableSlots.length} slots
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {court.availableSlots.slice(0, 3).map((slot, index) => (
                  <span key={index} className="text-xs text-green-600 dark:text-green-400">
                    {slot.startTime} - {slot.endTime}
                  </span>
                ))}
                {court.availableSlots.length > 3 && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    +{court.availableSlots.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Venue Info */}
          <div className="text-xs text-muted-foreground leading-tight">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="leading-tight">{court.venue.address}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button className="flex-1 h-11 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium transition-all duration-200 hover:shadow-lg">
              <Search className="h-4 w-4 mr-2" />
              Book Now
            </Button>
            <Button variant="outline" className="h-11 px-4 hover:bg-gray-50 transition-colors duration-200">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  )

  const CourtSkeleton = () => (
    <Card>
      {/* Rectangular skeleton layout for larger screens */}
      <div className="hidden md:flex">
        {/* Left side - Court info skeleton */}
        <div className="flex-1 p-6 border-r">
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Price and availability skeleton */}
        <div className="w-80 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-16" />
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 w-12" />
          </div>
        </div>
      </div>

      {/* Mobile skeleton layout - original vertical card */}
      <div className="md:hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="text-right">
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-12" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-10" />
          </div>
        </CardContent>
      </div>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Unified Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Find Available Courts</h1>
          <p className="text-muted-foreground mb-4">
            Search and book the perfect court for your game or practice session
          </p>

          </div>

        {/* Search Results Summary */}
        {searchPerformed && (
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium">{courts.length}</span> courts found
                {searchParams.selectedSport && (
                  <span> for <span className="font-medium">{searchParams.selectedSport}</span></span>
                )}
                {searchParams.selectedDate && (
                  <span> on <span className="font-medium">{formatDate(searchParams.selectedDate)}</span></span>
                )}
              </div>
              {loading && (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">Searching...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Optimized Responsive Filters with Results */}
        <OptimizedResponsiveFilters
          sports={sports.map(sport => ({
            id: sport.id,
            name: sport.name,
            displayName: sport.displayName,
            icon: sport.icon || '🏃',
            isActive: sport.isActive
          }))}
          formats={sports.flatMap(sport => sport.formats || []).map(format => ({
            id: format.id,
            name: format.name,
            displayName: format.displayName,
            minPlayers: format.minPlayers,
            maxPlayers: format.maxPlayers
          }))}
          venues={venues.map(vendor => ({
            id: vendor.id,
            name: vendor.name
          }))}
          loading={loading}
          searchParams={searchParams}
          onSearchParamsChange={handleSearchParamsChange}
          onSearch={handleSearch}
          availableTimeSlots={timeSlots}
          priceRanges={priceRanges}
        >
          {/* Results Section */}
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!searchPerformed ? (
              <Alert>
                <Search className="h-4 w-4" />
                <AlertDescription>
                  Loading available sports and venues... This will only take a moment.
                </AlertDescription>
              </Alert>
            ) : loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <CourtSkeleton key={i} />
                ))}
              </div>
            ) : courts.length === 0 ? (
              <Alert>
                <Filter className="h-4 w-4" />
                <AlertDescription>
                  No courts found matching your criteria. Try adjusting your filters or search parameters.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {courts.map((court) => (
                  <CourtCard key={court.id} court={court} />
                ))}
              </div>
            )}
          </div>
        </OptimizedResponsiveFilters>
      </main>
    </div>
  )
}