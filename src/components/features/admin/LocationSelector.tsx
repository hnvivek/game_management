'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

// Import the country-state-city library
import { Country, State, City } from 'country-state-city'

interface LocationSelectorProps {
  onLocationChange: (location: {
    country: string
    state: string
    city: string
    countryCode: string
  }) => void
  initialCountry?: string
  initialState?: string
  initialCity?: string
}

export function LocationSelector({
  onLocationChange,
  initialCountry = '',
  initialState = '',
  initialCity = ''
}: LocationSelectorProps) {
  const [countries, setCountries] = useState<Country[]>([])
  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [selectedCountry, setSelectedCountry] = useState(initialCountry)
  const [selectedState, setSelectedState] = useState(initialState)
  const [selectedCity, setSelectedCity] = useState(initialCity)
  const [loading, setLoading] = useState(false)

  // Load countries on component mount
  useEffect(() => {
    const countryList = Country.getAllCountries()
    setCountries(countryList)
  }, [])

  // Load states when country changes
  useEffect(() => {
    if (selectedCountry) {
      setLoading(true)
      try {
        const stateList = State.getStatesOfCountry(selectedCountry)
        setStates(stateList)
        setCities([]) // Clear cities when country changes
        // Only clear state/city if the country actually changed (not initial load)
        if (selectedCountry !== initialCountry) {
          setSelectedState('')
          setSelectedCity('')
        }
      } catch (error) {
        console.error('Error loading states:', error)
        setStates([])
      } finally {
        setLoading(false)
      }
    } else {
      setStates([])
      setCities([])
      setSelectedState('')
      setSelectedCity('')
    }
  }, [selectedCountry, initialCountry, initialState])

  // Load cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      setLoading(true)
      try {
        // Find the state ISO code from the states list
        const selectedStateObj = states.find(s => s.name === selectedState)
        const stateIsoCode = selectedStateObj ? selectedStateObj.isoCode : selectedState

        const cityList = City.getCitiesOfState(selectedCountry, stateIsoCode)
        setCities(cityList)
        // Only clear city if the state actually changed (not initial load)
        if (selectedState !== initialState) {
          setSelectedCity('')
        }
      } catch (error) {
        console.error('Error loading cities:', error)
        setCities([])
      } finally {
        setLoading(false)
      }
    } else {
      setCities([])
      setSelectedCity('')
    }
  }, [selectedCountry, selectedState, states, initialState, initialCity])

  // Notify parent component of location changes
  useEffect(() => {
    const country = countries.find(c => c.isoCode === selectedCountry)
    onLocationChange({
      country: country?.name || '',
      state: selectedState,
      city: selectedCity,
      countryCode: selectedCountry
    })
  }, [selectedCountry, selectedState, selectedCity, onLocationChange])

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Select
            value={selectedCountry}
            onValueChange={setSelectedCountry}
            disabled={countries.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.isoCode} value={country.isoCode}>
                  {country.name} ({country.isoCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State/Province *</Label>
          <Select
            value={selectedState}
            onValueChange={setSelectedState}
            disabled={states.length === 0 || loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={selectedCountry ? "Select a state" : "Select country first"} />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state.isoCode} value={state.name}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Select
            value={selectedCity}
            onValueChange={setSelectedCity}
            disabled={cities.length === 0 || loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={selectedState ? "Select a city" : "Select state first"} />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.name} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading && (
          <div className="text-sm text-muted-foreground">
            Loading...
          </div>
        )}
      </CardContent>
    </Card>
  )
}