'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, CalendarIcon, Clock, MapPin, Users, AlertCircle, X, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import CollapsibleSearchContainer from '@/components/search/CollapsibleSearchContainer'
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

  // Helper function to get current time in vendor timezone
  const getCurrentTimeInVendorTimezone = () => {
    // Get timezone from first available court, or default to local timezone
    const vendorTimezone = courts.length > 0 && courts[0].venue?.vendor?.timezone
      ? courts[0].venue.vendor.timezone
      : Intl.DateTimeFormat().resolvedOptions().timeZone

    try {
      const now = new Date()

      // Use Intl.DateTimeFormat to get vendor's current time components
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: vendorTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })

      const parts = formatter.formatToParts(now)
      const values: any = {}
      parts.forEach(part => {
        values[part.type] = part.value
      })

      // Construct vendor time in local timezone (avoids timezone conversion issues)
      const vendorTime = new Date(
        `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`
      )

      console.log('Local time:', now.toISOString())
      console.log('Vendor timezone:', vendorTimezone)
      console.log('Vendor hour:', values.hour, 'Vendor minute:', values.minute)
      console.log('Vendor time constructed:', vendorTime.toISOString())

      return vendorTime
    } catch (error) {
      console.warn('Failed to convert timezone, using local time:', error)
      return new Date()
    }
  }

  // Generate default time slots (6 AM to 11 PM in 1-hour intervals)
  const generateDefaultTimeSlots = () => {
    const slots = []
    const vendorNow = getCurrentTimeInVendorTimezone()
    const currentHour = vendorNow.getHours()
    const currentMinute = vendorNow.getMinutes()

    // Check if selected date is today (in vendor timezone)
    const isToday = selectedDate &&
      vendorNow.toDateString() === new Date(selectedDate).toDateString()

    for (let hour = 6; hour <= 23; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`
      const displayTime = hour <= 12 ? `${hour}:00 ${hour === 12 ? 'PM' : 'AM'}` : `${hour - 12}:00 PM`

      // Skip past times if the selected date is today
      if (isToday) {
        // Skip slots that are in the past or very close to current time
        if (hour < currentHour ||
            (hour === currentHour && currentMinute >= 30)) {
          continue // Skip past slots
        }
      }

      slots.push({
        value: startTime,
        label: displayTime
      })
    }
    return slots
  }

  // Initialize default time slots and update when selected date or courts change
  useEffect(() => {
    setAvailableTimeSlots(generateDefaultTimeSlots())
  }, [selectedDate, courts])

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

  // Search parameters for CollapsibleSearchContainer
  const searchParams = {
    selectedSport,
    selectedDate,
    selectedDuration,
    selectedCity,
    selectedArea,
    selectedCountry,
    selectedFormat,
    selectedStartTime,
    selectedEndTime,
    selectedPriceRange,
    selectedVenue
  }

  const handleSearchParamsChange = (newParams: typeof searchParams) => {
    setSelectedSport(newParams.selectedSport)
    setSelectedDate(newParams.selectedDate)
    setSelectedDuration(newParams.selectedDuration)
    setSelectedCity(newParams.selectedCity)
    setSelectedArea(newParams.selectedArea)
    setSelectedCountry(newParams.selectedCountry)
    setSelectedFormat(newParams.selectedFormat)
    setSelectedStartTime(newParams.selectedStartTime)
    setSelectedEndTime(newParams.selectedEndTime)
    setSelectedPriceRange(newParams.selectedPriceRange)
    setSelectedVenue(newParams.selectedVenue)
  }

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

  // Remove auto-search - courts should only be fetched when user clicks search
  // useEffect(() => {
  //   if (selectedSport && selectedDate && selectedDuration) {
  //     fetchCourts()
  //   }
  // }, [selectedSport, selectedFormat, selectedDate, selectedDuration, selectedCity, selectedArea, selectedCountry])

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
        ...(selectedStartTime && { startTime: selectedStartTime }),
        ...(selectedEndTime && { endTime: selectedEndTime }),
        ...(selectedPriceRange && selectedPriceRange !== 'all' && { priceRange: selectedPriceRange }),
        ...(selectedVenue && selectedVenue !== 'all' && { venue: selectedVenue }),
      })

      const response = await fetch(`/api/courts?${params}`)
      if (!response.ok) throw new Error('Failed to fetch courts')

      const data = await response.json()
      let filteredCourts = data.courts || []

      // If no specific time range provided, filter past times based on vendor timezone
      if (!selectedStartTime && !selectedEndTime && filteredCourts.length > 0) {
        const vendorNow = getCurrentTimeInVendorTimezone()
        const currentHour = vendorNow.getHours()
        const currentMinute = vendorNow.getMinutes()
        const isToday = selectedDate &&
          vendorNow.toDateString() === new Date(selectedDate).toDateString()

        console.log('Filtering API results - isToday:', isToday, 'vendorHour:', currentHour)

        if (isToday) {
          filteredCourts = filteredCourts.map(court => {
            if (court.availableSlots && court.availableSlots.length > 0) {
              const futureSlots = court.availableSlots.filter(slot => {
                const [slotHour] = slot.startTime.split(':').map(Number)

                // Skip past slots
                if (slotHour < currentHour ||
                    (slotHour === currentHour && currentMinute >= 30)) {
                  console.log('Filtering out past slot:', slot.startTime)
                  return false
                }
                return true
              })

              console.log('Court', court.name, 'slots:', court.availableSlots.length, '->', futureSlots.length)

              return {
                ...court,
                availableSlots: futureSlots,
                isAvailable: futureSlots.length > 0
              }
            }
            return court
          })
        }
      }

      setCourts(filteredCourts)

  
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
    <CollapsibleSearchContainer
      sports={sports}
      formats={formats}
      courts={courts}
      loading={loading}
      error={error}
      searchParams={searchParams}
      onSearchParamsChange={handleSearchParamsChange}
      onSearch={fetchCourts}
      venues={venues}
      priceRanges={priceRanges}
      availableTimeSlots={availableTimeSlots}
    >
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
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">
                Available Courts ({filteredCourts.length})
                {filteredCourts.length !== courts.length && (
                  <span className="text-sm text-muted-foreground ml-2">
                    of {courts.length} total
                  </span>
                )}
              </h3>
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
    </CollapsibleSearchContainer>
  )
}