'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronDown, ChevronUp, MapPin, Calendar, Filter, Clock, Users, Globe, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import SearchableSelect from '@/components/ui/searchable-select'
import { cn } from '@/lib/utils'

// Enhanced types
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
}

interface CollapsibleSearchContainerProps {
  sports: Sport[]
  formats: Format[]
  courts: Court[]
  loading: boolean
  error: string | null
  searchParams: {
    selectedSport: string
    selectedDate: string
    selectedDuration: string
    selectedCity: string | null
    selectedArea: string
    selectedCountry: string | null
    selectedFormat: string
    selectedStartTime: string | null
    selectedEndTime: string | null
    selectedPriceRange: string
    selectedVenue: string
  }
  onSearchParamsChange: (params: any) => void
  onSearch: () => void
  children: React.ReactNode // Results section
  // Additional data for filters
  venues: Array<{id: string, name: string}>
  priceRanges: Array<{value: string, label: string}>
  availableTimeSlots: Array<{value: string, label: string}>
}

export default function CollapsibleSearchContainer({
  sports,
  formats,
  courts,
  loading,
  error,
  searchParams,
  onSearchParamsChange,
  onSearch,
  children,
  venues,
  priceRanges,
  availableTimeSlots
}: CollapsibleSearchContainerProps) {
  // ✅ Correct state initialization - starts expanded!
  const [isExpanded, setIsExpanded] = useState(true)
  const [hasSearched, setHasSearched] = useState(false)

  // Auto-collapse only after successful manual search
  useEffect(() => {
    if (hasSearched && !loading && courts.length > 0) {
      // Only collapse if user has actually clicked search and got results
      setIsExpanded(false)
    }
  }, [hasSearched, loading, courts])

  // Handle search with proper state management
  const handleSearch = async () => {
    setIsExpanded(true) // Keep expanded during search
    await onSearch()
    setHasSearched(true) // Mark as searched after manual search completion
    // The useEffect will handle collapsing
  }

  // Handle parameter changes - expand when user modifies search
  const handleParameterChange = (key: string, value: any) => {
    setIsExpanded(true) // Auto-expand when modifying search
    onSearchParamsChange({ ...searchParams, [key]: value })
  }

  // Calculate active filters count
  const activeSearchFilters = [
    searchParams.selectedSport,
    searchParams.selectedDate,
    searchParams.selectedDuration,
    searchParams.selectedCity,
    searchParams.selectedArea,
    searchParams.selectedCountry,
    searchParams.selectedFormat,
    searchParams.selectedStartTime,
    searchParams.selectedEndTime,
    searchParams.selectedPriceRange !== 'all' ? searchParams.selectedPriceRange : null,
    searchParams.selectedVenue !== 'all' ? searchParams.selectedVenue : null
  ].filter(Boolean).length

  // Get display values for badges
  const getSportDisplay = () => {
    const sport = sports.find(s => s.name === searchParams.selectedSport)
    return sport?.displayName || searchParams.selectedSport
  }

  const getCountryDisplay = () => {
    if (!searchParams.selectedCountry || searchParams.selectedCountry === 'all') return null
    const countryNames: { [key: string]: string } = {
      'US': 'United States',
      'IN': 'India',
      'GB': 'United Kingdom',
      'CA': 'Canada',
      'AU': 'Australia',
    }
    return countryNames[searchParams.selectedCountry] || searchParams.selectedCountry
  }

  const durations = [
    { value: '1', label: '1 hour' },
    { value: '2', label: '2 hours' },
    { value: '3', label: '3 hours' },
  ]

  const formatPrice = (price: number, currencyCode: string) => {
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

  return (
    <div className="space-y-6">
      {/* Search Header - Always Visible */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Find Available Courts</CardTitle>
                {!hasSearched ? (
                  <p className="text-sm text-muted-foreground">
                    Search for available courts based on sport, location, and availability
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {loading ? (
                      'Searching...'
                    ) : (
                      `${courts.length} courts found`
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Show toggle button after first search */}
              {hasSearched && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-10 sm:h-8 px-3 sm:px-3 flex items-center gap-2"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Hide Search
                    </>
                  ) : (
                    <>
                      <Filter className="h-4 w-4" />
                      Modify Search
                    </>
                  )}
                  {activeSearchFilters > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs px-2 py-0 h-5">
                      {activeSearchFilters}
                    </Badge>
                  )}
                </Button>
              )}

              {/* Responsive search button - always visible when collapsed */}
              {hasSearched && !isExpanded && (
                <Button
                  onClick={handleSearch}
                  disabled={loading || !searchParams.selectedSport || !searchParams.selectedDate || !searchParams.selectedDuration}
                  size="sm"
                  className="h-12 sm:h-8 px-4 sm:px-3 flex items-center gap-2 sm:gap-1"
                >
                  {loading ? (
                    <>
                      <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-3 w-3" />
                      <span className="text-xs sm:text-sm inline">Search</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Summary (when collapsed) */}
          {hasSearched && !isExpanded && activeSearchFilters > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {searchParams.selectedSport && (
                <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                  {getSportDisplay()}
                </Badge>
              )}
              {searchParams.selectedDate && (
                <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                  <Calendar className="h-3 w-3 mr-1" />
                  {(() => {
                    const [year, month, day] = searchParams.selectedDate.split('-').map(Number)
                    const date = new Date(year, month - 1, day) // month is 0-indexed
                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })
                  })()}
                </Badge>
              )}
              {searchParams.selectedDuration && (
                <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                  <Clock className="h-3 w-3 mr-1" />
                  {durations.find(d => d.value === searchParams.selectedDuration)?.label}
                </Badge>
              )}
              {searchParams.selectedCity && searchParams.selectedCity !== 'all' && (
                <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                  <MapPin className="h-3 w-3 mr-1" />
                  {searchParams.selectedCity}
                </Badge>
              )}
              {searchParams.selectedArea && (
                <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                  <MapPin className="h-3 w-3 mr-1" />
                  {searchParams.selectedArea}
                </Badge>
              )}
              {searchParams.selectedCountry && searchParams.selectedCountry !== 'all' && (
                <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                  <Globe className="h-3 w-3 mr-1" />
                  {getCountryDisplay()}
                </Badge>
              )}
              {searchParams.selectedStartTime && (
                <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                  <Clock className="h-3 w-3 mr-1" />
                  From {searchParams.selectedStartTime}
                </Badge>
              )}
              {searchParams.selectedEndTime && (
                <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                  <Clock className="h-3 w-3 mr-1" />
                  Until {searchParams.selectedEndTime}
                </Badge>
              )}
              {searchParams.selectedPriceRange && searchParams.selectedPriceRange !== 'all' && (
                <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                  Price: {priceRanges.find(r => r.value === searchParams.selectedPriceRange)?.label}
                </Badge>
              )}
              {searchParams.selectedVenue && searchParams.selectedVenue !== 'all' && (
                <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                  <MapPin className="h-3 w-3 mr-1" />
                  {venues.find(v => v.id === searchParams.selectedVenue)?.name}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        {/* Collapsible Search Form */}
        <CardContent
          className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden",
            isExpanded ? "max-h-screen opacity-100 p-6" : "max-h-0 opacity-0 p-0"
          )}
        >
          <div className={cn("space-y-4", isExpanded ? "block" : "hidden")}>
            {/* Primary Search Controls - 3 column layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sport Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sport *</Label>
                <SearchableSelect
                  value={searchParams.selectedSport}
                  onValueChange={(value) => handleParameterChange('selectedSport', value)}
                  placeholder="Select sport"
                  options={sports.map((sport) => ({
                    id: sport.id,
                    name: sport.name,
                    displayName: sport.displayName,
                    icon: sport.icon || undefined
                  }))}
                />
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date *</Label>
                <Input
                  type="date"
                  value={searchParams.selectedDate}
                  onChange={(e) => handleParameterChange('selectedDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Duration Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Duration *</Label>
                <Select
                  value={searchParams.selectedDuration}
                  onValueChange={(value) => handleParameterChange('selectedDuration', value)}
                >
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
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Location</Label>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Country</Label>
                  <Select
                    value={searchParams.selectedCountry || 'all'}
                    onValueChange={(value) => handleParameterChange('selectedCountry', value === 'all' ? null : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All countries</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="IN">India</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">City</Label>
                  <Input
                    type="text"
                    placeholder="Enter city name"
                    value={searchParams.selectedCity || ''}
                    onChange={(e) => handleParameterChange('selectedCity', e.target.value || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Area (Optional)</Label>
                  <Input
                    type="text"
                    placeholder="e.g., Whitefield, Koramangala"
                    value={searchParams.selectedArea}
                    onChange={(e) => handleParameterChange('selectedArea', e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Filter venues by specific area or locality within the city
              </p>
            </div>

            {/* Secondary Filters Section */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Additional Filters</Label>
              </div>

              {/* Format Selection */}
              {formats.length > 0 && (
                <div className="mb-4">
                  <Label className="text-xs sm:text-sm font-medium">Game Format</Label>
                  <Select
                    value={searchParams.selectedFormat}
                    onValueChange={(value) => handleParameterChange('selectedFormat', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All formats" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All formats</SelectItem>
                      {formats.map((format) => (
                        <SelectItem key={format.id} value={format.id}>
                          {format.displayName} ({format.minPlayers}-{format.maxPlayers} players)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Time Range Filter */}
              <div className="mb-4">
                <Label className="text-xs sm:text-sm font-medium">Time Range</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={searchParams.selectedStartTime || 'all'}
                    onValueChange={(value) => handleParameterChange('selectedStartTime', value === 'all' ? null : value)}
                  >
                    <SelectTrigger className="h-10 sm:h-9 w-32 sm:w-28">
                      <SelectValue placeholder="Start" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All times</SelectItem>
                      {availableTimeSlots.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center justify-center text-sm text-muted-foreground">
                    →
                  </div>

                  <Select
                    value={searchParams.selectedEndTime || 'all'}
                    onValueChange={(value) => handleParameterChange('selectedEndTime', value === 'all' ? null : value)}
                  >
                    <SelectTrigger className="h-10 sm:h-9 w-32 sm:w-28">
                      <SelectValue placeholder="End" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any end</SelectItem>
                      {availableTimeSlots.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-4">
                <Label className="text-xs sm:text-sm font-medium">Price Range</Label>
                <Select
                  value={searchParams.selectedPriceRange || 'all'}
                  onValueChange={(value) => handleParameterChange('selectedPriceRange', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All prices</SelectItem>
                    {priceRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Venue Filter */}
              {venues.length > 0 && (
                <div className="mb-4">
                  <Label className="text-xs sm:text-sm font-medium">Venue</Label>
                  <Select
                    value={searchParams.selectedVenue || 'all'}
                    onValueChange={(value) => handleParameterChange('selectedVenue', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All venues" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All venues</SelectItem>
                      {venues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={loading || !searchParams.selectedSport || !searchParams.selectedDate || !searchParams.selectedDuration}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search Courts
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-destructive mr-2" />
            <p className="text-sm text-destructive-foreground">{error}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {children}
    </div>
  )
}