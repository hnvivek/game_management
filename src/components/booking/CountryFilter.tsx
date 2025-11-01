import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MapPin, Globe, Loader2 } from 'lucide-react'
import { detectUserLocation, getAvailableCountries, getCountryInfo, COUNTRIES } from '@/lib/location'

interface CountryFilterProps {
  selectedCountry?: string
  onCountryChange: (country: string) => void
  disabled?: boolean
}

export default function CountryFilter({
  selectedCountry,
  onCountryChange,
  disabled = false
}: CountryFilterProps) {
  const [availableCountries, setAvailableCountries] = useState(COUNTRIES)
  const [userLocation, setUserLocation] = useState<string | null>(null)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [locationMethod, setLocationMethod] = useState<string>('')
  const [showAllCountries, setShowAllCountries] = useState(false)

  // Load available countries and detect user location
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        // Load countries with venues
        const countries = await getAvailableCountries()
        setAvailableCountries(countries)

        // Detect user location
        setIsDetectingLocation(true)
        const location = await detectUserLocation()
        setUserLocation(location.country)
        setLocationMethod(location.method)

        // If no country is selected and we detected user location, use it
        if (!selectedCountry && location.confidence === 'high') {
          onCountryChange(location.country)
        }
      } catch (error) {
        console.warn('Failed to initialize location:', error)
      } finally {
        setIsDetectingLocation(false)
      }
    }

    initializeLocation()
  }, [selectedCountry, onCountryChange])

  const handleLocationDetection = async () => {
    setIsDetectingLocation(true)
    try {
      const location = await detectUserLocation()
      setUserLocation(location.country)
      setLocationMethod(location.method)
      onCountryChange(location.country)
    } catch (error) {
      console.error('Location detection failed:', error)
    } finally {
      setIsDetectingLocation(false)
    }
  }

  const handleCountryChange = (countryCode: string) => {
    setShowAllCountries(false)
    onCountryChange(countryCode)
  }

  const currentCountry = getCountryInfo(selectedCountry || userLocation || 'US')
  const detectedCountry = userLocation ? getCountryInfo(userLocation) : null

  return (
    <div className="space-y-4">
      {/* Location Detection Status */}
      {(userLocation || isDetectingLocation) && (
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <div className="text-sm">
              {isDetectingLocation ? (
                <span className="text-blue-600">Detecting your location...</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">
                    Location detected: {detectedCountry?.flag} {detectedCountry?.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {locationMethod}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {!isDetectingLocation && userLocation !== selectedCountry && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLocationDetection}
              disabled={disabled}
            >
              Use My Location
            </Button>
          )}
        </div>
      )}

      {/* Country Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Country
          </label>

          {!showAllCountries && availableCountries.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllCountries(true)}
              className="text-xs h-6 px-2"
            >
              Show All
            </Button>
          )}
        </div>

        <Select
          value={selectedCountry || userLocation || ''}
          onValueChange={handleCountryChange}
          disabled={disabled || isDetectingLocation}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select country...">
              {selectedCountry || userLocation ? (
                <div className="flex items-center gap-2">
                  <span>{currentCountry.flag}</span>
                  <span>{currentCountry.name}</span>
                  {userLocation && selectedCountry === userLocation && (
                    <Badge variant="secondary" className="text-xs ml-auto">
                      Your location
                    </Badge>
                  )}
                </div>
              ) : (
                'Select country...'
              )}
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            {showAllCountries ? (
              // Show all countries
              COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <div className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                    {userLocation === country.code && (
                      <Badge variant="secondary" className="text-xs ml-auto">
                        Your location
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))
            ) : (
              // Show countries with venues first, then popular countries
              <>
                {/* Countries with venues */}
                {availableCountries.length > 0 && (
                  <>
                    {availableCountries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <div className="flex items-center gap-2">
                          <span>{getCountryInfo(country.code).flag}</span>
                          <span>{country.name}</span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {country.venueCount || 'Many'} venues
                          </Badge>
                          {userLocation === country.code && (
                            <Badge variant="secondary" className="text-xs">
                              Your location
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="all" disabled>
                      <div className="text-muted-foreground text-xs">
                        ─────────────────
                      </div>
                    </SelectItem>
                  </>
                )}

                {/* Popular countries */}
                {COUNTRIES.filter(country =>
                  !availableCountries.some(ac => ac.code === country.code)
                ).map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <div className="flex items-center gap-2">
                      <span>{country.flag}</span>
                      <span>{country.name}</span>
                      {userLocation === country.code && (
                        <Badge variant="secondary" className="text-xs ml-auto">
                          Your location
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>

        {/* Location Detection Button */}
        {!userLocation && !isDetectingLocation && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLocationDetection}
            disabled={disabled}
            className="w-full"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Detect My Location
          </Button>
        )}
      </div>

      {/* Info Text */}
      {selectedCountry && (
        <div className="text-xs text-muted-foreground">
          Showing venues in {currentCountry.flag} {currentCountry.name}
          {userLocation && selectedCountry !== userLocation && (
            <span>
              {' '}• Your location: {detectedCountry?.flag} {detectedCountry?.name}
            </span>
          )}
        </div>
      )}
    </div>
  )
}