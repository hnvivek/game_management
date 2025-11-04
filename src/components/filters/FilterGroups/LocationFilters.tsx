'use client'

import { useState, useEffect } from 'react'
import { MapPin, Navigation, Globe, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface LocationFiltersProps {
  country?: string | null
  city?: string | null
  area?: string
  onCountryChange: (country: string | null) => void
  onCityChange: (city: string | null) => void
  onAreaChange: (area: string) => void
  countries: Array<{ value: string; label: string }>
  cities: Array<{ value: string; label: string }>
  isMobile?: boolean
  loading?: boolean
}

// Common countries with better organization
const popularCountries = [
  { value: 'US', label: 'United States', priority: 'high' },
  { value: 'IN', label: 'India', priority: 'high' },
  { value: 'GB', label: 'United Kingdom', priority: 'high' },
  { value: 'CA', label: 'Canada', priority: 'medium' },
  { value: 'AU', label: 'Australia', priority: 'medium' },
]

export default function LocationFilters({
  country,
  city,
  area,
  onCountryChange,
  onCityChange,
  onAreaChange,
  countries,
  isMobile = false,
  loading = false
}: LocationFiltersProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [searchInput, setSearchInput] = useState(area || '')

  // Touch-optimized classes
  const touchClasses = isMobile ? {
    select: 'h-12 text-base',
    input: 'h-12 text-base',
    button: 'h-12 px-4 text-base',
    label: 'text-base font-medium'
  } : {
    select: 'h-10 text-sm',
    input: 'h-10 text-sm',
    button: 'h-10 px-3 text-sm',
    label: 'text-sm font-medium'
  }

  // Get user's location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setLocationLoading(false)

        // In a real app, you would reverse geocode to get country/city
        // For now, we'll just show the coordinates
        console.log('User location:', position.coords)
      },
      (error) => {
        console.error('Error getting location:', error)
        setLocationLoading(false)
      }
    )
  }

  // Handle area search with debouncing
  const handleAreaSearch = (value: string) => {
    setSearchInput(value)
    // Debounce the actual search
    const timeoutId = setTimeout(() => {
      onAreaChange(value)
    }, 300)
    return () => clearTimeout(timeoutId)
  }

  // Enhanced country selection with popular countries
  const sortedCountries = [...countries].sort((a, b) => {
    const aPriority = popularCountries.find(pc => pc.value === a.value)?.priority || 'low'
    const bPriority = popularCountries.find(pc => pc.value === b.value)?.priority || 'low'

    if (aPriority === bPriority) {
      return a.label.localeCompare(b.label)
    }

    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[aPriority as keyof typeof priorityOrder] -
           priorityOrder[bPriority as keyof typeof priorityOrder]
  })

  return (
    <div className="space-y-4">
      {/* Current Location Card */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Navigation className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-sm">Use Current Location</div>
                <div className="text-xs text-muted-foreground">
                  Find courts near you
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={getUserLocation}
              disabled={locationLoading}
              className={cn(touchClasses.button, "flex items-center gap-2")}
            >
              {locationLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Locating...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  {isMobile ? 'Use Location' : 'Use Current Location'}
                </>
              )}
            </Button>
          </div>

          {userLocation && (
            <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                Location detected: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Country Selection */}
      <div className="space-y-2">
        <Label className={touchClasses.label}>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Country
          </div>
        </Label>
        <Select
          value={country || 'all'}
          onValueChange={(value) => onCountryChange(value === 'all' ? null : value)}
          disabled={loading}
        >
          <SelectTrigger className={cn(
            touchClasses.select,
            "transition-all duration-200 hover:border-primary/50"
          )}>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>

            {/* Popular countries section */}
            <div className="px-2 py-1.5">
              <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
                POPULAR
              </div>
              {popularCountries.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  <div className="flex items-center gap-2">
                    <span>{country.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      Popular
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </div>

            {/* All countries section */}
            {sortedCountries.length > popularCountries.length && (
              <div className="px-2 py-1.5">
                <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
                  ALL COUNTRIES
                </div>
                {sortedCountries
                  .filter(c => !popularCountries.find(pc => pc.value === c.value))
                  .map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* City Selection */}
      <div className="space-y-2">
        <Label className={touchClasses.label}>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            City
          </div>
        </Label>
        <Select
          value={city || 'all'}
          onValueChange={(value) => onCityChange(value === 'all' ? null : value)}
          disabled={loading || !country}
        >
          <SelectTrigger className={cn(
            touchClasses.select,
            "transition-all duration-200 hover:border-primary/50",
            !country && "opacity-50"
          )}>
            <SelectValue placeholder={country ? "Select city" : "Select country first"} />
          </SelectTrigger>
          <SelectContent>
            {country && <SelectItem value="all">All cities</SelectItem>}
            {cities.map((cityItem) => (
              <SelectItem key={cityItem.value} value={cityItem.value}>
                {cityItem.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Area Search */}
      <div className="space-y-2">
        <Label className={touchClasses.label}>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Area (Optional)
          </div>
        </Label>
        <div className="relative">
          <Input
            type="text"
            placeholder={isMobile ? "e.g., Downtown, Whitefield" : "e.g., Whitefield, Koramangala, Downtown"}
            value={searchInput}
            onChange={(e) => handleAreaSearch(e.target.value)}
            className={cn(
              touchClasses.input,
              "pr-10 transition-all duration-200 hover:border-primary/50",
              searchInput && "border-primary"
            )}
            disabled={loading}
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchInput('')
                onAreaChange('')
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Area Suggestions */}
        {isMobile && (
          <div className="flex flex-wrap gap-1 mt-2">
            {['Downtown', 'Whitefield', 'Koramangala', 'Indiranagar'].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchInput(suggestion)
                  onAreaChange(suggestion)
                }}
                className="h-8 px-3 text-xs"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-1">
          Search for specific neighborhoods, landmarks, or areas within the city
        </p>
      </div>

      {/* Location Summary */}
      {(country || city || area) && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Searching in:
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onCountryChange(null)
                  onCityChange(null)
                  onAreaChange('')
                  setSearchInput('')
                }}
                className="h-6 px-2 text-xs text-blue-600 dark:text-blue-400"
              >
                Clear
              </Button>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              {country && (
                <Badge variant="secondary" className="text-xs">
                  {countries.find(c => c.value === country)?.label || country}
                </Badge>
              )}
              {city && city !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {cities.find(c => c.value === city)?.label || city}
                </Badge>
              )}
              {area && (
                <Badge variant="secondary" className="text-xs">
                  {area}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}