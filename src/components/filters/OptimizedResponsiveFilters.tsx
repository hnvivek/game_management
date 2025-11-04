'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, X, ChevronDown, ChevronUp, ChevronRight, MapPin, Calendar, Clock, DollarSign, Users, Globe, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import SearchableSelect from '@/components/ui/searchable-select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { FilterLoadingSkeleton } from './FilterLoadingSkeleton'

// Types
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

interface Venue {
  id: string
  name: string
}

interface SearchParams {
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

interface OptimizedResponsiveFiltersProps {
  sports: Sport[]
  formats: Format[]
  venues: Venue[]
  loading: boolean
  searchParams: SearchParams
  onSearchParamsChange: (params: Partial<SearchParams>) => void
  onSearch: () => void
  availableTimeSlots: Array<{ value: string, label: string }>
  priceRanges: Array<{ value: string, label: string }>
  children: React.ReactNode
}

// Device detection with proper breakpoints
const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [screenSize, setScreenSize] = useState({ width: 1920, height: 1080 })

  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      setScreenSize({ width, height })

      if (width < 768) {
        setDeviceType('mobile')
      } else if (width < 1024) {
        setDeviceType('tablet')
      } else {
        setDeviceType('desktop')
      }
    }

    updateDeviceType()
    window.addEventListener('resize', updateDeviceType)
    return () => window.removeEventListener('resize', updateDeviceType)
  }, [])

  return { deviceType, screenSize }
}

// Filter group definitions with research-backed organization
const filterGroups = [
  {
    id: 'primary',
    label: 'What & When',
    icon: Calendar,
    description: 'Sport, date and duration',
    priority: 'primary' as const,
    required: true
  },
  {
    id: 'location',
    label: 'Where',
    icon: MapPin,
    description: 'Location preferences',
    priority: 'primary' as const
  },
  {
    id: 'time',
    label: 'Time Preferences',
    icon: Clock,
    description: 'Time and availability',
    priority: 'secondary' as const
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: Filter,
    description: 'Price, venue and format',
    priority: 'tertiary' as const
  }
]

// Custom hook for responsive classes
const useResponsiveClasses = () => {
  const { deviceType } = useDeviceType()

  const baseClasses = {
    mobile: {
      button: 'h-12 px-4 text-base w-full',
      select: 'h-12 text-base w-full border-0',
      input: 'h-12 text-base w-full border-0',
      label: 'text-base font-medium mb-2',
      card: 'p-3'
    },
    tablet: {
      button: 'h-10 px-3 text-sm',
      select: 'h-10 text-sm border-0',
      input: 'h-10 text-sm border-0',
      label: 'text-sm font-medium mb-2',
      card: 'p-3'
    },
    desktop: {
      button: 'h-10 px-3 text-sm w-full',
      select: 'h-10 text-sm w-full border-0',
      input: 'h-10 text-sm w-full border-0',
      label: 'text-sm font-medium mb-2',
      card: 'p-3'
    }
  }

  return baseClasses[deviceType]
}

export default function OptimizedResponsiveFilters({
  sports,
  formats,
  venues,
  loading,
  searchParams,
  onSearchParamsChange,
  onSearch,
  availableTimeSlots,
  priceRanges,
  children
}: OptimizedResponsiveFiltersProps) {
  const { deviceType, screenSize } = useDeviceType()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState(['primary'])
  const [customPriceRange, setCustomPriceRange] = useState([0, 5000])
  const [useCustomPrice, setUseCustomPrice] = useState(false)
  const responsiveClasses = useResponsiveClasses()

  // Count active filters
  const activeFilterCount = Object.values(searchParams).filter(Boolean).length

  // Handle parameter changes
  const handleParameterChange = (key: keyof SearchParams, value: any) => {
    onSearchParamsChange({ ...searchParams, [key]: value })
  }

  // Get display values
  const getSportDisplay = () => {
    const sport = sports.find(s => s.name === searchParams.selectedSport)
    return sport?.displayName || searchParams.selectedSport
  }

  const getFilterDisplay = (key: keyof SearchParams, value: string): string => {
    if (key === 'selectedSport') {
      const sport = sports.find(s => s.name === value)
      return sport?.displayName || value
    }
    if (key === 'selectedDuration') {
      return `${value} hour${value === '1' ? '' : 's'}`
    }
    if (key === 'selectedPriceRange') {
      return value === 'all' ? 'Any price' : value
    }
    if (key === 'selectedFormat') {
      const format = formats.find(f => f.id === value)
      return format?.displayName || value
    }
    if (key === 'selectedVenue') {
      const venue = venues.find(v => v.id === value)
      return venue?.name || value
    }
    return value
  }

  // Duration options
  const durations = [
    { value: '1', label: '1 hour' },
    { value: '2', label: '2 hours' },
    { value: '3', label: '3 hours' },
  ]

  // Primary filters component
  const PrimaryFilters = () => (
    <div className="space-y-4">
      {/* Sport Selection */}
      <div className="space-y-2">
        <Label className={responsiveClasses.label}>
          Sport <span className="text-destructive">*</span>
        </Label>
        <SearchableSelect
          value={searchParams.selectedSport || ''}
          onValueChange={(value) => handleParameterChange('selectedSport', value)}
          disabled={loading}
          placeholder="Select sport"
          className={cn(responsiveClasses.select, "transition-all duration-200 hover:bg-muted/50")}
          options={sports.map(sport => ({
            id: sport.name,
            value: sport.name,
            name: sport.name,
            displayName: sport.displayName,
            label: sport.displayName,
            icon: sport.icon
          }))}
        />
      </div>

      {/* Date Selection */}
      <div className="space-y-2">
        <Label className={responsiveClasses.label}>
          Date <span className="text-destructive">*</span>
        </Label>
        <Input
          type="date"
          value={searchParams.selectedDate}
          onChange={(e) => handleParameterChange('selectedDate', e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className={cn(responsiveClasses.input, "hover:bg-muted/50")}
        />
      </div>

      {/* Duration Selection */}
      <div className="space-y-2">
        <Label className={responsiveClasses.label}>
          Duration <span className="text-destructive">*</span>
        </Label>
        <Select
          value={searchParams.selectedDuration || ''}
          onValueChange={(value) => handleParameterChange('selectedDuration', value)}
          disabled={loading}
        >
          <SelectTrigger className={cn(responsiveClasses.select, "transition-all duration-200 hover:bg-muted/50")}>
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            {durations.map((duration) => (
              <SelectItem key={duration.value} value={duration.value}>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{duration.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  // Location filters component
  const LocationFilters = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label className={responsiveClasses.label}>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Country
            </div>
          </Label>
          <Select
            value={searchParams.selectedCountry || 'all'}
            onValueChange={(value) => handleParameterChange('selectedCountry', value === 'all' ? null : value)}
            disabled={loading}
          >
            <SelectTrigger className={cn(responsiveClasses.select, "transition-all duration-200 hover:bg-muted/50")}>
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
          <Label className={responsiveClasses.label}>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              City
            </div>
          </Label>
          <Input
            type="text"
            placeholder="Enter city name"
            value={searchParams.selectedCity || ''}
            onChange={(e) => handleParameterChange('selectedCity', e.target.value || null)}
            className={cn(responsiveClasses.input, "hover:bg-muted/50")}
          />
        </div>

        <div className="space-y-2">
          <Label className={responsiveClasses.label}>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Area (Optional)
            </div>
          </Label>
          <Input
            type="text"
            placeholder="e.g., Whitefield, Koramangala"
            value={searchParams.selectedArea}
            onChange={(e) => handleParameterChange('selectedArea', e.target.value)}
            className={cn(responsiveClasses.input, "hover:bg-muted/50")}
          />
        </div>
      </div>
    </div>
  )

  // Time preferences component
  const TimePreferences = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label className={responsiveClasses.label}>Start Time</Label>
          <Select
            value={searchParams.selectedStartTime || 'all'}
            onValueChange={(value) => handleParameterChange('selectedStartTime', value === 'all' ? null : value)}
            disabled={loading}
          >
            <SelectTrigger className={cn(responsiveClasses.select, "transition-all duration-200 hover:bg-muted/50")}>
              <SelectValue placeholder="Any time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any time</SelectItem>
              {availableTimeSlots.map((slot) => (
                <SelectItem key={slot.value} value={slot.value}>
                  {slot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={responsiveClasses.label}>End Time</Label>
          <Select
            value={searchParams.selectedEndTime || 'all'}
            onValueChange={(value) => handleParameterChange('selectedEndTime', value === 'all' ? null : value)}
            disabled={loading}
          >
            <SelectTrigger className={cn(responsiveClasses.select, "transition-all duration-200 hover:bg-muted/50")}>
              <SelectValue placeholder="Any end time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any end time</SelectItem>
              {availableTimeSlots.map((slot) => (
                <SelectItem key={slot.value} value={slot.value}>
                  {slot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )

  // Advanced preferences component
  const AdvancedPreferences = () => (
    <div className="space-y-4">
      {/* Price Range */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className={responsiveClasses.label}>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price Range
            </div>
          </Label>
          <Switch
            checked={useCustomPrice}
            onCheckedChange={setUseCustomPrice}
            disabled={loading}
          />
        </div>

        {!useCustomPrice ? (
          <Select
            value={searchParams.selectedPriceRange || 'all'}
            onValueChange={(value) => handleParameterChange('selectedPriceRange', value)}
            disabled={loading}
          >
            <SelectTrigger className={responsiveClasses.select}>
              <SelectValue placeholder="Any price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All prices</SelectItem>
              {priceRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{range.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">
                Price: ${customPriceRange[0]} - ${customPriceRange[1]}
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCustomPriceRange([0, 5000])}
              >
                Reset
              </Button>
            </div>
            <Slider
              value={customPriceRange}
              onValueChange={setCustomPriceRange}
              max={10000}
              min={0}
              step={100}
              className="w-full"
              disabled={loading}
            />
          </div>
        )}
      </div>

      {/* Game Format */}
      {formats.length > 0 && (
        <div className="space-y-2">
          <Label className={responsiveClasses.label}>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Game Format
            </div>
          </Label>
          <Select
            value={searchParams.selectedFormat || 'all'}
            onValueChange={(value) => handleParameterChange('selectedFormat', value)}
            disabled={loading}
          >
            <SelectTrigger className={responsiveClasses.select}>
              <SelectValue placeholder="All formats" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All formats</SelectItem>
              {formats.map((format) => (
                <SelectItem key={format.id} value={format.id}>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{format.displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {format.minPlayers}-{format.maxPlayers} players
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Venue */}
      {venues.length > 0 && (
        <div className="space-y-2">
          <Label className={responsiveClasses.label}>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Venue
            </div>
          </Label>
          <Select
            value={searchParams.selectedVenue || 'all'}
            onValueChange={(value) => handleParameterChange('selectedVenue', value)}
            disabled={loading}
          >
            <SelectTrigger className={responsiveClasses.select}>
              <SelectValue placeholder="All venues" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All venues</SelectItem>
              {venues.map((venue) => (
                <SelectItem key={venue.id} value={venue.id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{venue.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )

  // Filter content organized by groups
  const FilterContent = ({ isMobile = false, hideActions = false }: { isMobile?: boolean; hideActions?: boolean }) => {
    const handleApplyAndSearch = () => {
      onSearch()
      // Close the sheet for mobile after applying filters
      if (isMobile) {
        setIsFilterOpen(false)
      }
    }

    return (
    <div className={cn("space-y-6", isMobile && "px-4 pb-6")}>
      <Accordion
        type="multiple"
        value={expandedGroups}
        onValueChange={setExpandedGroups}
        className="space-y-4"
      >
        {filterGroups.map((group) => {
          const Icon = group.icon

          return (
            <AccordionItem
              key={group.id}
              value={group.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className={cn(
                    "p-2 rounded-lg",
                    group.priority === 'primary' ? "bg-blue-100 text-blue-700" :
                    group.priority === 'secondary' ? "bg-green-100 text-green-700" :
                    "bg-purple-100 text-purple-700"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{group.label}</h3>
                      {group.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {group.id === 'primary' && <PrimaryFilters />}
                {group.id === 'location' && <LocationFilters />}
                {group.id === 'time' && <TimePreferences />}
                {group.id === 'preferences' && <AdvancedPreferences />}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      {/* Action Buttons */}
      {!hideActions && (
        <div className="flex flex-col gap-3 pt-4 border-t">
          <Button
            onClick={handleApplyAndSearch}
            className="w-full"
            size={isMobile ? "lg" : "default"}
            disabled={loading || !searchParams.selectedSport || !searchParams.selectedDate || !searchParams.selectedDuration}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                {isMobile ? "Search Courts" : "Apply Filters & Search"}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              // Clear all filters
              onSearchParamsChange({
                selectedSport: '',
                selectedDate: new Date().toISOString().split('T')[0], // Today's date
                selectedDuration: '2', // Default 2-hour session
                selectedCity: null,
                selectedArea: '',
                selectedCountry: null,
                selectedFormat: '',
                selectedStartTime: null,
                selectedEndTime: null,
                selectedPriceRange: '',
                selectedVenue: 'all'
              })
              setUseCustomPrice(false)
              setCustomPriceRange([0, 5000])
            }}
            className="w-full"
            disabled={activeFilterCount === 0}
          >
            <X className="h-4 w-4 mr-2" />
            Clear All ({activeFilterCount})
          </Button>
        </div>
      )}
    </div>
    )
  }

  // Active filters summary
  const ActiveFiltersSummary = () => {
    if (activeFilterCount === 0) return null

    return (
      <Card className="mb-6">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">Active Filters:</span>
              <div className="flex flex-wrap gap-1">
                {Object.entries(searchParams).map(([key, value]) =>
                  value && value !== 'all' && (
                    <Badge
                      key={key}
                      variant="outline"
                      className="text-xs"
                    >
                      {getFilterDisplay(key as keyof SearchParams, value)}
                    </Badge>
                  )
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSearchParamsChange({
                  selectedSport: '',
                  selectedDate: new Date().toISOString().split('T')[0], // Today's date
                  selectedDuration: '2', // Default 2-hour session
                  selectedCity: null,
                  selectedArea: '',
                  selectedCountry: null,
                  selectedFormat: '',
                  selectedStartTime: null,
                  selectedEndTime: null,
                  selectedPriceRange: '',
                  selectedVenue: 'all'
                })
                setUseCustomPrice(false)
                setCustomPriceRange([0, 5000])
              }}
              className="h-8 px-3"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Mobile: Hidden Side Panel with Top Modify Button
  if (deviceType === 'mobile') {
    return (
      <div className="relative">
        {/* Side Panel (completely hidden by default) */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsFilterOpen(false)}
            />

            {/* Slide-in Panel */}
            <div className="absolute left-0 top-0 h-full w-full bg-background shadow-xl transform transition-transform duration-300">
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    <h3 className="font-semibold text-lg">Filters</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFilterOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Filter Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <FilterContent mobile={true} hideActions={true} />
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t bg-muted/50 space-y-2">
                  <Button
                    onClick={() => {
                      onSearch()
                      setIsFilterOpen(false)
                    }}
                    className="w-full h-12"
                    size="lg"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Apply Filters
                  </Button>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Clear all filters but keep defaults
                        onSearchParamsChange({
                          selectedSport: '',
                          selectedDate: new Date().toISOString().split('T')[0], // Today's date
                          selectedDuration: '2', // Default 2-hour session
                          selectedCity: null,
                          selectedArea: '',
                          selectedCountry: null,
                          selectedFormat: '',
                          selectedStartTime: null,
                          selectedEndTime: null,
                          selectedPriceRange: '',
                          selectedVenue: 'all'
                        })
                        setUseCustomPrice(false)
                        setCustomPriceRange([0, 5000])
                      }}
                      className="w-full h-10"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Modify Bar */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
          <div className="p-3">
            {activeFilterCount > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} applied
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFilterOpen(true)}
                    className="h-9 px-4"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Modify
                  </Button>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1">
                  {Object.entries(searchParams).map(([key, value]) =>
                    value && value !== 'all' && (
                      <Badge
                        key={key}
                        variant="secondary"
                        className="text-xs"
                      >
                        {getFilterDisplay(key as keyof SearchParams, value)}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">No filters applied</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFilterOpen(true)}
                  className="h-9 px-4"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Add Filters
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content (full width on mobile) */}
        <div className="min-h-screen">
          {children}
        </div>
      </div>
    )
  }

  // Tablet: Side Drawer Pattern
  if (deviceType === 'tablet') {
    return (
      <div className="flex gap-4">
        {/* Collapsible Sidebar */}
        <aside className={cn(
          "transition-all duration-300",
          isFilterOpen ? "w-80" : "w-16"
        )}>
          <Card className="sticky top-4 h-fit">
            <CardHeader className={cn(
              "transition-all duration-300",
              isFilterOpen ? "p-4" : "p-2"
            )}>
              <div className="flex items-center justify-between">
                {isFilterOpen && (
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Filter className="h-5 w-5" />
                    Filters
                  </CardTitle>
                )}
                <Button
                  variant="outline"
                  size={isFilterOpen ? "sm" : "lg"}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={cn(
                    "transition-all duration-300 hover:scale-105",
                    isFilterOpen ? "h-10 px-4" : "h-14 w-14 p-0 rounded-full"
                  )}
                  aria-label={isFilterOpen ? "Close filters" : "Open filters"}
                >
                  {isFilterOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Filter className="h-6 w-6" />
                  )}
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs font-bold",
                        isFilterOpen ? "ml-2" : "absolute -top-1 -right-1 h-6 w-6 p-0"
                      )}
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className={cn(
              "transition-all duration-300 overflow-hidden",
              isFilterOpen ? "max-h-screen opacity-100 p-4" : "max-h-0 opacity-0 p-0"
            )}>
              {isFilterOpen && <FilterContent />}
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <ActiveFiltersSummary />
          {children}
        </main>
      </div>
    )
  }

  // Desktop: Persistent Sidebar Pattern
  return (
    <div className="flex gap-6">
      {/* Persistent Sidebar */}
      <aside className="w-96">
        <Card className="sticky top-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <FilterContent />
          </CardContent>
        </Card>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <ActiveFiltersSummary />
        {children}
      </main>
    </div>
  )
}