'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, CalendarIcon, Clock, MapPin, Users, RefreshCw, AlertCircle, X, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import SearchableSelect from '@/components/ui/searchable-select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn, formatPrice } from '@/lib/utils'

// Enhanced types based on our API schema
interface Sport {
  id: string
  name: string
  displayName: string
  icon: string
  isActive: boolean
}

interface Format {
  id: string
  name: string
  displayName: string
  minPlayers: number
  maxPlayers: number
}

interface Vendor {
  id: string
  name: string
  slug: string
  primaryColor: string
  secondaryColor: string
  timezone: string
}

interface Court {
  id: string
  name: string
  pricePerHour: number
  isActive: boolean
  sport: Sport
  format: Format
  venue: {
    id: string
    name: string
    address: string
    city: string
    area: string | null
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

interface CourtAvailabilityProps {
  onCourtSelect: (court: Court, date: string, startTime: string, duration: number, totalAmount: number) => void
  selectedSport?: string
  selectedDate?: string
  selectedCity?: string
  selectedArea?: string
}

export default function CourtAvailability({
  onCourtSelect,
  selectedSport: propSelectedSport,
  selectedDate: propSelectedDate,
  selectedCity: propSelectedCity,
  selectedArea: propSelectedArea
}: CourtAvailabilityProps) {
  const [sports, setSports] = useState<Sport[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Internal state for form control
  const [selectedSport, setSelectedSport] = useState(propSelectedSport || '')
  const [selectedDate, setSelectedDate] = useState(propSelectedDate || '')
  const [selectedDuration, setSelectedDuration] = useState('1') // Default to 1 hour
  const [selectedCity, setSelectedCity] = useState<string | null>(propSelectedCity || null)
  const [selectedArea, setSelectedArea] = useState(propSelectedArea || '')
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [availableCities, setAvailableCities] = useState<Array<{value: string, label: string}>>([])
  const [availableCountries, setAvailableCountries] = useState<Array<{value: string, label: string}>>([])
  const [selectedFormat, setSelectedFormat] = useState('')
  const [formats, setFormats] = useState<Format[]>([])

  // State for filters
  const [selectedVenue, setSelectedVenue] = useState('all')
  const [selectedPriceRange, setSelectedPriceRange] = useState('all')
  const [selectedTime, setSelectedTime] = useState('all') // New time filter state
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null)
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null)
  const [venues, setVenues] = useState<Array<{id: string, name: string}>>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<Array<{value: string, label: string}>>([])
  const [useTimeRange, setUseTimeRange] = useState(false)

  // State for date picker
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // Dynamic price ranges based on currency
  const [priceRanges, setPriceRanges] = useState<Array<{value: string, label: string}>>([
    { value: '0-50', label: 'Under $50' },
    { value: '50-100', label: '$50 - $100' },
    { value: '100-200', label: '$100 - $200' },
    { value: '200+', label: 'Above $200' },
  ])

  // Update price ranges when courts are loaded
  useEffect(() => {
    const currencyCode = selectedCity && courts.length > 0 ? courts[0].venue.currencyCode : 'USD'

    if (currencyCode === 'INR') {
      setPriceRanges([
        { value: '0-1000', label: 'Under ₹1,000' },
        { value: '1000-2000', label: '₹1,000 - ₹2,000' },
        { value: '2000-3000', label: '₹2,000 - ₹3,000' },
        { value: '3000+', label: 'Above ₹3,000' },
      ])
    } else {
      // USD and other currencies
      setPriceRanges([
        { value: '0-50', label: `Under ${formatPrice(50, currencyCode)}` },
        { value: '50-100', label: `${formatPrice(50, currencyCode)} - ${formatPrice(100, currencyCode)}` },
        { value: '100-200', label: `${formatPrice(100, currencyCode)} - ${formatPrice(200, currencyCode)}` },
        { value: '200+', label: `Above ${formatPrice(200, currencyCode)}` },
      ])
    }
  }, [selectedCity, courts])

  const durations = [
    { value: '1', label: '1 hour' },
    { value: '2', label: '2 hours' },
    { value: '3', label: '3 hours' },
  ]

  // Auto-set today's date and fetch sports
  useEffect(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const day = today.getDate().toString().padStart(2, '0')
    const todayString = `${year}-${month}-${day}`
    if (!selectedDate) setSelectedDate(todayString)
    fetchSports()
  }, [])

  // Fetch formats when sport changes
  useEffect(() => {
    if (selectedSport) {
      fetchFormats()
    } else {
      setFormats([])
      setSelectedFormat('all')
    }
  }, [selectedSport])

  // Fetch courts when primary search parameters change
  useEffect(() => {
    if (selectedSport && selectedDate && selectedDuration) {
      fetchCourts()
    }
  }, [selectedSport, selectedFormat, selectedDate, selectedDuration, selectedCity, selectedArea, selectedCountry])

  // Filter courts locally based on time range and other filters
  const filteredCourts = useMemo(() => {
    let filtered = courts

    // Filter by venue
    if (selectedVenue && selectedVenue !== 'all') {
      filtered = filtered.filter(court => court.venue.id === selectedVenue)
    }

    // Filter by price range
    if (selectedPriceRange && selectedPriceRange !== 'all') {
      const [min, max] = selectedPriceRange.split('-').map(p => p === '+' ? Infinity : parseInt(p))
      filtered = filtered.filter(court => {
        if (max === Infinity) {
          return court.pricePerHour >= min
        }
        return court.pricePerHour >= min && court.pricePerHour <= max
      })
    }

    // Filter by single time slot
    if (!useTimeRange && selectedTime && selectedTime !== 'all') {
      filtered = filtered.filter(court =>
        court.availableSlots && court.availableSlots.some(slot => slot.startTime === selectedTime)
      )
    }

    // Filter by time range
    if (useTimeRange && selectedStartTime) {
      filtered = filtered.filter(court => {
        if (!court.availableSlots || court.availableSlots.length === 0) return false

        // Check if any slot falls within the time range
        return court.availableSlots.some(slot => {
          const slotStartTime = slot.startTime
          const slotEndTime = slot.endTime

          // Check if slot overlaps with the selected time range
          if (selectedEndTime) {
            // Time range selected: check if slot falls within range
            return slotStartTime >= selectedStartTime && slotEndTime <= selectedEndTime
          } else {
            // Only start time selected: show all slots that start at or after the start time
            return slotStartTime >= selectedStartTime
          }
        })
      })
    }

    return filtered
  }, [courts, selectedVenue, selectedPriceRange, selectedTime, useTimeRange, selectedStartTime, selectedEndTime])

  // Extract unique venues from courts data
  useEffect(() => {
    if (courts.length > 0) {
      const uniqueVenues = Array.from(
        new Map(courts.map(court => [court.venue.id, { id: court.venue.id, name: court.venue.name }])).values()
      )
      setVenues(uniqueVenues)
    }
  }, [courts])

  // Update available countries and cities when courts data changes
  useEffect(() => {
    if (courts.length > 0) {
      // Extract countries from courts
      const countries = [...new Set(courts.map(court => (court.venue as any)?.countryCode).filter(Boolean))]
        .filter(country => country && country.trim() !== '')
        .map(country => ({
          value: country,
          label: getCountryName(country)
        }))
        .sort((a, b) => a.label.localeCompare(b.label))

      setAvailableCountries(countries)

      // Extract cities filtered by selected country
      const filteredCities = [...new Set(
        courts
          .filter(court => !selectedCountry || (court.venue as any)?.countryCode === selectedCountry)
          .map(court => court.venue?.city)
          .filter(Boolean)
      )]
        .filter(city => city && city.trim() !== '')
        .sort()
        .map(city => ({ value: city, label: city }))

      setAvailableCities(filteredCities)

      // Clear city selection if it's not in the filtered list
      if (selectedCity && selectedCity !== 'all' && !filteredCities.some(city => city.value === selectedCity)) {
        setSelectedCity(null)
      }

      // Clear country selection if it's not in the available list
      if (selectedCountry && selectedCountry !== 'all' && !countries.some(country => country.value === selectedCountry)) {
        setSelectedCountry(null)
      }
    } else {
      setAvailableCountries([])
      setAvailableCities([])
      setSelectedCity(null)
    }
  }, [courts, selectedCountry])

  const fetchFormats = async () => {
    if (!selectedSport) return

    try {
      const response = await fetch(`/api/sports/${selectedSport}/formats`)
      if (!response.ok) throw new Error('Failed to fetch formats')

      const data = await response.json()
      setFormats(data.formats || [])

      // Default to 'all' for format selection
      if (!selectedFormat) {
        setSelectedFormat('all')
      }
    } catch (error) {
      console.error('Error fetching formats:', error)
      setFormats([])
      setSelectedFormat('all')
    }
  }

  const fetchSports = async () => {
    try {
      const response = await fetch('/api/sports')
      if (!response.ok) throw new Error('Failed to fetch sports')

      const data = await response.json()
      setSports(data.sports || [])

      if (data.sports?.length > 0 && !selectedSport) {
        setSelectedSport(data.sports[0].name)
      }
    } catch (error) {
      console.error('Error fetching sports:', error)
      setError('Failed to load sports. Please try again.')
    }
  }

  // Helper function to get country name from country code
  const getCountryName = (countryCode: string): string => {
    const countryNames: { [key: string]: string } = {
      'US': 'United States',
      'IN': 'India',
      'GB': 'United Kingdom',
      'CA': 'Canada',
      'AU': 'Australia',
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'ES': 'Spain',
      'JP': 'Japan',
      'CN': 'China',
      'BR': 'Brazil',
      'MX': 'Mexico',
      'AE': 'United Arab Emirates',
      'SG': 'Singapore',
      'NL': 'Netherlands',
      'SE': 'Sweden',
      'NO': 'Norway',
      'DK': 'Denmark',
      'FI': 'Finland',
      'CH': 'Switzerland',
      'AT': 'Austria',
      'BE': 'Belgium',
      'IE': 'Ireland',
      'PT': 'Portugal',
      'GR': 'Greece',
      'TR': 'Turkey',
      'IL': 'Israel',
      'SA': 'Saudi Arabia',
      'ZA': 'South Africa',
      'EG': 'Egypt',
      'NG': 'Nigeria',
      'KE': 'Kenya',
      'TH': 'Thailand',
      'MY': 'Malaysia',
      'ID': 'Indonesia',
      'PH': 'Philippines',
      'VN': 'Vietnam',
      'PK': 'Pakistan',
      'BD': 'Bangladesh',
      'LK': 'Sri Lanka',
      'NP': 'Nepal',
      'MM': 'Myanmar',
      'KH': 'Cambodia',
      'LA': 'Laos',
      'NZ': 'New Zealand',
      'FJ': 'Fiji',
      'PG': 'Papua New Guinea',
    }
    return countryNames[countryCode] || countryCode
  }

  const fetchCourts = async () => {
    if (!selectedSport || !selectedDate || !selectedDuration) return

    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        sport: selectedSport,
        date: selectedDate,
        duration: selectedDuration,
        available: 'true', // This enables availability checking in the courts API
        ...(selectedFormat && selectedFormat !== 'all' && { format: selectedFormat }),
        ...(selectedCity && selectedCity !== 'all' && { city: selectedCity }),
        ...(selectedArea && { area: selectedArea }),
        ...(selectedCountry && selectedCountry !== 'all' && { country: selectedCountry }),
      })

      const response = await fetch(`/api/courts?${params}`)
      if (!response.ok) throw new Error('Failed to fetch courts')

      const data = await response.json()
      setCourts(data.courts || [])

      // Extract available time slots from court data
      if (data.courts && data.courts.length > 0) {
        const timeSlotMap = new Map<string, string>()
        data.courts.forEach(court => {
          if (court.availableSlots) {
            court.availableSlots.forEach(slot => {
              // Use the actual end time from the API response
              timeSlotMap.set(slot.startTime, slot.endTime)
            })
          }
        })

        const timeSlots = Array.from(timeSlotMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([startTime, endTime]) => {
            const [hours, minutes] = startTime.split(':').map(Number)
            const [endHours, endMinutes] = endTime.split(':').map(Number)
            const startHour = hours.toString().padStart(2, '0')
            const startMin = minutes.toString().padStart(2, '0')
            const endHour = endHours.toString().padStart(2, '0')
            const endMin = endMinutes.toString().padStart(2, '0')
            const timeRange = `${startHour}:${startMin} - ${endHour}:${endMin}`

            return {
              value: startTime,
              label: timeRange
            }
          })
        setAvailableTimeSlots(timeSlots)
      }

    } catch (error) {
      setError('Failed to load courts. Please try again.')
      console.error('Error fetching courts:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number, currencyCode: string) => {
    // Map currency codes to locales and symbols
    const currencyConfig: { [key: string]: { locale: string, symbol: string } } = {
      'USD': { locale: 'en-US', symbol: '$' },
      'INR': { locale: 'en-IN', symbol: '₹' },
      'GBP': { locale: 'en-GB', symbol: '£' },
      'EUR': { locale: 'en-IE', symbol: '€' },
      'AED': { locale: 'en-AE', symbol: 'د.إ' },
      'CAD': { locale: 'en-CA', symbol: 'C$' },
    }

    const config = currencyConfig[currencyCode] || { locale: 'en-US', symbol: '$' }

    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handleCourtSelect = (court: Court) => {
    const totalAmount = court.pricePerHour * parseInt(selectedDuration)
    let startTime = '09:00'

    if (useTimeRange && selectedStartTime) {
      // Use the selected start time from time range
      startTime = selectedStartTime
    } else if (selectedTime && selectedTime !== 'all') {
      // Use the single selected time
      startTime = selectedTime
    } else if (court.availableSlots && court.availableSlots.length > 0) {
      // Use the first available time slot
      startTime = court.availableSlots[0].startTime
    }

    onCourtSelect(court, selectedDate, startTime, parseInt(selectedDuration), totalAmount)
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Find Available Courts
              </CardTitle>
              <CardDescription>
                Search for available courts based on sport, location, and availability
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchCourts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Search Controls - 3 column layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sport Selection */}
            <div className="space-y-2">
              <Label>Sport</Label>
              <SearchableSelect
                value={selectedSport}
                onValueChange={setSelectedSport}
                placeholder="Search sports..."
                options={sports.map(sport => ({
                  id: sport.id,
                  name: sport.name,
                  displayName: sport.displayName,
                  icon: sport.icon
                }))}
              />
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      (() => {
                        // Parse YYYY-MM-DD as local date to avoid timezone issues
                        const [year, month, day] = selectedDate.split('-').map(Number)
                        const displayDate = new Date(year, month - 1, day) // month is 0-indexed
                        return displayDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      })()
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate ? (() => {
                      const [year, month, day] = selectedDate.split('-').map(Number)
                      return new Date(year, month - 1, day)
                    })() : undefined}
                    onSelect={(date) => {
                      if (date) {
                        // Format date as YYYY-MM-DD in local timezone to avoid UTC conversion issues
                        const year = date.getFullYear()
                        const month = (date.getMonth() + 1).toString().padStart(2, '0')
                        const day = date.getDate().toString().padStart(2, '0')
                        const formattedDate = `${year}-${month}-${day}`

                        setSelectedDate(formattedDate)
                        setDatePickerOpen(false)
                      }
                    }}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Duration Selection */}
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((duration) => (
                    <SelectItem key={duration.value} value={duration.value}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location Section */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Location</Label>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Select
                  value={selectedCountry || 'all'}
                  onValueChange={(value) => setSelectedCountry(value === 'all' ? null : value)}
                >
                  <SelectTrigger className="w-full min-w-[180px]">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All countries</SelectItem>
                    {availableCountries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Select
                  value={selectedCity || 'all'}
                  onValueChange={(value) => setSelectedCity(value === 'all' ? null : value)}
                  disabled={!selectedCountry && availableCountries.length > 0}
                >
                  <SelectTrigger className="w-full min-w-[180px]">
                    <SelectValue placeholder={selectedCountry ? "Select city" : "Select country first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCountry && <SelectItem value="all">All cities</SelectItem>}
                    {availableCities.map((city) => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Area (Optional)</Label>
                <Input
                  type="text"
                  placeholder="e.g., Whitefield, Koramangala"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full min-w-[180px]"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Filter venues by specific area or locality within the city
            </p>
          </div>

  
          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-destructive mr-2" />
                <p className="text-sm text-destructive-foreground">{error}</p>
              </div>
            </div>
          )}

          {/* Search Button */}
          <Button
            onClick={fetchCourts}
            disabled={loading || !selectedSport || !selectedDate || !selectedDuration}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search Courts
              </>
            )}
          </Button>
        </CardContent>
      </Card>

    
      {/* Results Section */}
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

      {!loading && courts.length > 0 && (
        <div className="space-y-6">
          {/* Results Header with Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">
                Available Courts ({filteredCourts.length})
                {filteredCourts.length !== courts.length && (
                  <span className="text-sm text-muted-foreground ml-2">
                    of {courts.length} total
                  </span>
                )}
              </h3>
              {/* Show active time range filter */}
              {useTimeRange && selectedStartTime && (
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-primary" />
                  <span className="text-sm text-primary font-medium">
                    {selectedStartTime} - {selectedEndTime || 'Any'}
                  </span>
                  <span className="text-xs text-muted-foreground">(time range filter)</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Filters - Always visible in single row */}
              <div className="flex items-center gap-2">
                {/* Time Slot Filter */}
                {availableTimeSlots.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        id="time-range-toggle"
                        checked={useTimeRange}
                        onChange={(e) => {
                          setUseTimeRange(e.target.checked)
                          if (!e.target.checked) {
                            setSelectedTime('all')
                            setSelectedStartTime(null)
                            setSelectedEndTime(null)
                          } else {
                            setSelectedTime('')
                          }
                        }}
                        className="h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="time-range-toggle" className="text-xs text-muted-foreground">
                        Time Range
                      </Label>
                    </div>

                    {!useTimeRange ? (
                      <Select value={selectedTime || 'all'} onValueChange={setSelectedTime}>
                        <SelectTrigger className="h-8 w-40">
                          <SelectValue placeholder="All times" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All times</SelectItem>
                          {availableTimeSlots.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              <div className="text-sm">
                                {slot.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Select value={selectedStartTime || ''} onValueChange={(value) => {
                          setSelectedStartTime(value)
                          // Reset end time when start time changes
                          setSelectedEndTime(null)
                        }}>
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue placeholder="Start time" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTimeSlots.map((slot) => (
                              <SelectItem key={slot.value} value={slot.value}>
                                <div className="text-sm">
                                  {slot.label.split(' - ')[0]}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">to</span>
                        <Select value={selectedEndTime || ''} onValueChange={setSelectedEndTime}>
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue placeholder="End time" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTimeSlots
                              .filter(slot => {
                                // Only show end times that are greater than the selected start time
                                if (!selectedStartTime) return true

                                // Get the end time from this slot
                                const endTime = slot.label.split(' - ')[1]

                                // Simple string comparison for times in HH:MM format
                                // This works because HH:MM format sorts correctly lexicographically
                                return endTime > selectedStartTime
                              })
                              .map((slot) => {
                                // Extract the end time from the slot label
                                const endTime = slot.label.split(' - ')[1]
                                return (
                                  <SelectItem key={`end-${slot.value}`} value={endTime}>
                                    <div className="text-sm">
                                      {endTime}
                                    </div>
                                  </SelectItem>
                                )
                              })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                {/* Format Filter */}
                {formats.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">Format:</Label>
                    <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {formats.map((format) => (
                          <SelectItem key={format.id} value={format.id}>
                            <div className="text-sm">{format.displayName}</div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Venue Filter */}
                {venues.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">Venue:</Label>
                    <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {venues.map((venue) => (
                          <SelectItem key={venue.id} value={venue.id}>
                            <div className="text-sm truncate">{venue.name}</div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Divider when there are additional filters */}
                {(formats.length > 0 || venues.length > 0) && (
                  <div className="w-px h-6 bg-border"></div>
                )}

                {/* Price Range Filter */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">Price:</Label>
                  <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
                    <SelectTrigger className="h-8 w-36">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {priceRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          <div className="text-sm">{range.label}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Courts List */}
          <div className="space-y-4">
            {filteredCourts.map((court) => (
            <Card key={court.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* Court Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-lg">{court.name}</h4>
                        <p className="text-muted-foreground">{court.venue.name}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          className="bg-primary/20 text-primary-foreground border-primary/20 mb-1"
                          style={{
                            backgroundColor: `${court.venue.vendor.primaryColor}20`,
                            borderColor: court.venue.vendor.primaryColor,
                            color: court.venue.vendor.primaryColor
                          }}
                        >
                          {court.venue.vendor.name}
                        </Badge>
                        {court.venue.vendor.timezone && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                            <Globe className="w-3 h-3" />
                            {court.venue.vendor.timezone}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {court.venue.address}, {court.venue.city}
                        {court.venue.area && ` • ${court.venue.area}`}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {court.format.minPlayers}-{court.format.maxPlayers} players
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{court.sport.icon}</span>
                        {court.sport.displayName}
                      </div>
                    </div>

                    {(() => {
                      // Filter available slots based on time range
                      let filteredSlots = court.availableSlots || []

                      if (useTimeRange && selectedStartTime) {
                        filteredSlots = filteredSlots.filter(slot => {
                          if (selectedEndTime) {
                            // Time range selected: show slots that fall within the range
                            return slot.startTime >= selectedStartTime && slot.endTime <= selectedEndTime
                          } else {
                            // Only start time selected: show slots that start at or after the start time
                            return slot.startTime >= selectedStartTime
                          }
                        })
                      } else if (!useTimeRange && selectedTime && selectedTime !== 'all') {
                        // Single time slot selected
                        filteredSlots = filteredSlots.filter(slot => slot.startTime === selectedTime)
                      }

                      return filteredSlots.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                            <span className="text-sm font-semibold text-success">
                              {filteredSlots.length} time slot{filteredSlots.length > 1 ? 's' : ''} available
                              {filteredSlots.length !== (court.availableSlots || []).length && (
                                <span className="text-muted-foreground font-normal">
                                  {' '}of {(court.availableSlots || []).length} total
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="max-w-full overflow-x-auto">
                            <div className="flex flex-wrap gap-1 pb-1">
                              {filteredSlots.slice(0, 10).map((slot, index) => (
                                <button
                                  key={index}
                                  onClick={() => onCourtSelect(
                                    court,
                                    selectedDate,
                                    slot.startTime,
                                    parseInt(selectedDuration),
                                    court.pricePerHour * parseInt(selectedDuration)
                                  )}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors border border-primary/20 whitespace-nowrap flex-shrink-0"
                                >
                                  <Clock className="w-3 h-3 flex-shrink-0" />
                                  {slot.startTime}
                                </button>
                              ))}
                              {filteredSlots.length > 10 && (
                                <Badge variant="outline" className="text-xs bg-success/10 border-success/30 text-success flex-shrink-0">
                                  +{filteredSlots.length - 10} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                    {court.isAvailable !== undefined && (!court.availableSlots || court.availableSlots.length === 0) && (
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${court.isAvailable ? 'bg-success' : 'bg-destructive'}`} />
                        <span className="text-sm font-medium">
                          {court.isAvailable ? 'Available' : 'Not Available'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Pricing and Action */}
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-success">
                        {formatPrice(court.pricePerHour, court.venue.currencyCode)}
                      </div>
                      <div className="text-sm text-muted-foreground">per hour</div>
                      {selectedDuration && (
                        <div className="text-lg font-semibold text-primary">
                          Total: {formatPrice(court.pricePerHour * parseInt(selectedDuration), court.venue.currencyCode)}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground text-right">
                        {(() => {
                          let selectedTimeText = 'First available'
                          if (useTimeRange && selectedStartTime) {
                            selectedTimeText = selectedStartTime
                          } else if (selectedTime && selectedTime !== 'all') {
                            selectedTimeText = selectedTime
                          } else if (court.availableSlots && court.availableSlots.length > 0) {
                            selectedTimeText = court.availableSlots[0].startTime
                          }
                          return `Selected time: ${selectedTimeText}`
                        })()}
                      </div>
                      <Button
                        onClick={() => handleCourtSelect(court)}
                        disabled={!court.isAvailable}
                        className="w-full lg:w-auto"
                      >
                        {court.isAvailable ? 'Select Court' : 'Unavailable'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredCourts.length === 0 && courts.length > 0 && selectedSport && selectedDate && selectedDuration && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No courts match your filters</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filters (time range, venue, price range) or search with different criteria.
            </p>
            <Button variant="outline" onClick={() => {
              const today = new Date()
              const year = today.getFullYear()
              const month = (today.getMonth() + 1).toString().padStart(2, '0')
              const day = today.getDate().toString().padStart(2, '0')
              setSelectedDate(`${year}-${month}-${day}`)
              setSelectedArea('')
              setSelectedCity(null)
              setSelectedTime('all')
              setSelectedStartTime(null)
              setSelectedEndTime(null)
              setUseTimeRange(false)
              setSelectedFormat('all')
              setSelectedVenue('all')
              setSelectedPriceRange('all')
            }}>
              Reset Search
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}