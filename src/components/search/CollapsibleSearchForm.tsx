'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronDown, ChevronUp, MapPin, Calendar, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface CollapsibleSearchFormProps {
  // Sport selection
  sports: Array<{ id: string; name: string; displayName: string }>
  selectedSport: string
  onSportChange: (value: string) => void

  // Date selection
  selectedDate: string
  onDateChange: (value: string) => void

  // Duration selection
  durations: Array<{ value: string; label: string }>
  selectedDuration: string
  onDurationChange: (value: string) => void

  // Location selections
  selectedCity: string
  onCityChange: (value: string) => void
  selectedArea: string
  onAreaChange: (value: string) => void
  cities: Array<{ id: string; name: string }>

  // Search action
  onSearch: () => void
  loading: boolean
  hasSearched: boolean
  searchResultsCount?: number

  // Auto-collapse behavior
  autoCollapse?: boolean
}

export default function CollapsibleSearchForm({
  sports,
  selectedSport,
  onSportChange,
  selectedDate,
  onDateChange,
  durations,
  selectedDuration,
  onDurationChange,
  selectedCity,
  onCityChange,
  selectedArea,
  onAreaChange,
  cities,
  onSearch,
  loading,
  hasSearched,
  searchResultsCount,
  autoCollapse = false
}: CollapsibleSearchFormProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Debug logging
  console.log('CollapsibleSearchForm render:', { isExpanded, hasSearched, loading, autoCollapse })

  // Auto-collapse after successful search using useEffect for proper timing
  useEffect(() => {
    console.log('CollapsibleSearchForm useEffect:', { hasSearched, loading, autoCollapse })
    if (autoCollapse && hasSearched && !loading) {
      console.log('Collapsing search form...')
      setIsExpanded(false)
    }
  }, [autoCollapse, hasSearched, loading])

  // Auto-expand when changing search parameters
  const handleParameterChange = () => {
    if (!isExpanded) {
      setIsExpanded(true)
    }
  }

  const handleSportChange = (value: string) => {
    handleParameterChange()
    onSportChange(value)
  }

  const handleDateChange = (value: string) => {
    handleParameterChange()
    onDateChange(value)
  }

  const handleDurationChange = (value: string) => {
    handleParameterChange()
    onDurationChange(value)
  }

  const handleCityChange = (value: string) => {
    handleParameterChange()
    onCityChange(value)
  }

  const handleAreaChange = (value: string) => {
    handleParameterChange()
    onAreaChange(value)
  }

  const activeSearchFilters = [
    selectedSport,
    selectedDate,
    selectedDuration,
    selectedCity,
    selectedArea
  ].filter(Boolean).length

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        {/* Search Header with Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Find Available Courts</CardTitle>
              {!hasSearched ? (
                <p className="text-sm text-muted-foreground">
                  Search for available courts based on sport, location, and availability
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {searchResultsCount !== undefined
                    ? `${searchResultsCount} courts found`
                    : 'Available courts'
                  }
                </p>
              )}
            </div>
          </div>

          {/* Show toggle button after first search */}
          {hasSearched && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2 text-xs"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <Filter className="h-4 w-4 mr-1" />
                  Modify
                </>
              )}
              {activeSearchFilters > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs px-2 py-0 h-5">
                  {activeSearchFilters}
                </Badge>
              )}
            </Button>
          )}
        </div>

        {/* Active Filters Summary (when collapsed) */}
        {hasSearched && !isExpanded && activeSearchFilters > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedSport && (
              <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                {sports.find(s => s.id === selectedSport)?.displayName || selectedSport}
              </Badge>
            )}
            {selectedDate && (
              <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                <Calendar className="h-3 w-3 mr-1" />
                {selectedDate}
              </Badge>
            )}
            {selectedDuration && (
              <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                {durations.find(d => d.value === selectedDuration)?.label || selectedDuration}
              </Badge>
            )}
            {selectedCity && selectedCity !== 'all' && (
              <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                <MapPin className="h-3 w-3 mr-1" />
                {cities.find(c => c.id === selectedCity)?.name || selectedCity}
              </Badge>
            )}
            {selectedArea && (
              <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                <MapPin className="h-3 w-3 mr-1" />
                {selectedArea}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      {/* Collapsible Search Form */}
      <CardContent
        className="opacity-100"
      >
        <div className="space-y-4">
          {/* Primary Search Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sport Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sport *</Label>
              <Select value={selectedSport} onValueChange={handleSportChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  {sports.map((sport) => (
                    <SelectItem key={sport.id} value={sport.id}>
                      {sport.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date *</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Duration Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Duration *</Label>
              <Select value={selectedDuration} onValueChange={handleDurationChange}>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">City</Label>
                <Select value={selectedCity} onValueChange={handleCityChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm">Area (Optional)</Label>
                <Input
                  type="text"
                  placeholder="e.g., Whitefield, Koramangala"
                  value={selectedArea}
                  onChange={(e) => handleAreaChange(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Filter venues by specific area or locality within the city
            </p>
          </div>

          {/* Search Button */}
          <Button
            onClick={onSearch}
            disabled={loading || !selectedSport || !selectedDate || !selectedDuration}
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
  )
}