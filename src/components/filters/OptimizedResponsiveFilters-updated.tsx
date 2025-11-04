'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, X, ChevronDown, ChevronUp, MapPin, Calendar, Clock, DollarSign, Users, Globe, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

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
      setScreenSize({ width, height: window.innerHeight })

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

// Responsive classes
const useResponsiveClasses = () => {
  const [classes, setClasses] = useState({
    filterContainer: '',
    button: '',
    input: '',
    text: ''
  })

  useEffect(() => {
    const updateClasses = () => {
      const width = window.innerWidth

      setClasses({
        filterContainer: width < 768
          ? 'px-3 py-2'
          : width < 1024
            ? 'px-4 py-3'
            : 'p-6',
        button: width < 768
          ? 'h-12 px-4 text-base'
          : width < 1024
            ? 'h-10 px-3 text-sm'
            : 'h-9 px-3 text-sm',
        input: width < 768
          ? 'h-12 text-base'
          : width < 1024
            ? 'h-10 text-sm'
            : 'h-9 text-sm',
        text: width < 768
          ? 'text-base'
          : width < 1024
            ? 'text-sm'
            : 'text-sm'
      })
    }

    updateClasses()
    window.addEventListener('resize', updateClasses)
    return () => window.removeEventListener('resize', updateClasses)
  }, [])

  return classes
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
  const [isFilterOpen, setIsFilterOpen] = useState(deviceType !== 'mobile')
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
    if (key === 'selectedDuration') {
      return `${value} hour${parseInt(value) > 1 ? 's' : ''}`
    }
    if (key === 'selectedSport') {
      const sport = sports.find(s => s.name === value)
      return sport?.displayName || value
    }
    return value
  }

  // Filter groups
  const filterGroups = [
    {
      id: 'primary',
      title: 'Basic Filters',
      icon: Calendar,
      items: [
        {
          type: 'select',
          label: 'Sport',
          value: searchParams.selectedSport,
          options: sports.map(sport => ({
            value: sport.name,
            label: sport.displayName,
            icon: sport.icon
          }))
        },
        {
          type: 'date',
          label: 'Date',
          value: searchParams.selectedDate
        },
        {
          type: 'select',
          label: 'Duration',
          value: searchParams.selectedDuration,
          options: [
            { value: '1', label: '1 hour' },
            { value: '2', label: '2 hours' },
            { value: '3', label: '3 hours' },
            { value: '4', label: '4 hours' }
          ]
        }
      ]
    },
    {
      id: 'location',
      title: 'Location',
      icon: MapPin,
      items: [
        {
          type: 'select',
          label: 'Country',
          value: searchParams.selectedCountry,
          options: [
            { value: 'US', label: 'United States' },
            { value: 'GB', label: 'United Kingdom' },
            { value: 'CA', label: 'Canada' },
            { value: 'AU', label: 'Australia' }
          ]
        },
        {
          type: 'text',
          label: 'City',
          value: searchParams.selectedCity || '',
          placeholder: 'Enter city name'
        },
        {
          type: 'text',
          label: 'Area',
          value: searchParams.selectedArea,
          placeholder: 'Enter area or landmark'
        }
      ]
    },
    {
      id: 'advanced',
      title: 'Advanced Options',
      icon: Sparkles,
      items: [
        {
          type: 'select',
          label: 'Format',
          value: searchParams.selectedFormat,
          options: formats
            .filter(format =>
              searchParams.selectedSport &&
              formats.some(f => f.sportId === sports.find(s => s.name === searchParams.selectedSport)?.id)
            )
            .map(format => ({
              value: format.name,
              label: format.displayName,
              description: `${format.minPlayers}-${format.maxPlayers} players`
            }))
        },
        {
          type: 'time-range',
          label: 'Time Range',
          startTime: searchParams.selectedStartTime,
          endTime: searchParams.selectedEndTime,
          options: availableTimeSlots
        },
        {
          type: 'price-range',
          label: 'Price Range',
          value: searchParams.selectedPriceRange,
          customRange: customPriceRange,
          useCustom: useCustomPrice,
          onCustomChange: setCustomPriceRange,
          onToggleCustom: setUseCustomPrice,
          options: priceRanges
        },
        {
          type: 'select',
          label: 'Venue',
          value: searchParams.selectedVenue,
          options: venues.map(venue => ({
            value: venue.id,
            label: venue.name
          }))
        }
      ]
    }
  ]

  // Filter content organized by groups
  const FilterContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const handleApplyAndSearch = () => {
      onSearch()
      // Close the panel for mobile after applying filters
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
              <AccordionItem key={group.id} value={group.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", isMobile && "h-5 w-5")} />
                    <span className={cn(isMobile && "font-medium")}>
                      {group.title}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {group.items.map((item, index) => {
                    if (item.type === 'select') {
                      return (
                        <div key={index}>
                          <Label className={cn("text-sm font-medium mb-2", isMobile && "text-base")}>
                            {item.label}
                          </Label>
                          <Select
                            value={item.value}
                            onValueChange={(value) => handleParameterChange(
                              'selectedSport' as keyof SearchParams,
                              value
                            )}
                            className={cn(responsiveClasses.select, isMobile && "text-base")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${item.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {item.options?.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  <div className="flex items-center gap-2">
                                    {option.icon && <span>{option.icon}</span>}
                                    <span>{option.label}</span>
                                    {option.description && (
                                      <span className="text-xs text-muted-foreground">
                                        {option.description}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )
                    }

                    if (item.type === 'date') {
                      return (
                        <div key={index}>
                          <Label className={cn("text-sm font-medium mb-2", isMobile && "text-base")}>
                            {item.label}
                          </Label>
                          <Input
                            type="date"
                            value={item.value}
                            onChange={(e) => handleParameterChange(
                              'selectedDate' as keyof SearchParams,
                              e.target.value
                            )}
                            className={responsiveClasses.input, isMobile && "text-base"}
                          />
                        </div>
                      )
                    }

                    if (item.type === 'text') {
                      return (
                        <div key={index}>
                          <Label className={cn("text-sm font-medium mb-2", isMobile && "text-base")}>
                            {item.label}
                          </Label>
                          <Input
                            type="text"
                            value={item.value}
                            onChange={(e) => handleParameterChange(
                              item.label.toLowerCase().includes('city')
                                ? 'selectedCity' as keyof SearchParams
                                : 'selectedArea' as keyof SearchParams,
                              e.target.value
                            )}
                            placeholder={item.placeholder}
                            className={responsiveClasses.input, isMobile && "text-base"}
                          />
                        </div>
                      )
                    }

                    if (item.type === 'time-range') {
                      return (
                        <div key={index} className="space-y-3">
                          <Label className={cn("text-sm font-medium", isMobile && "text-base")}>
                            {item.label}
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Start Time</Label>
                              <Select
                                value={item.startTime}
                                onValueChange={(value) => handleParameterChange(
                                  'selectedStartTime' as keyof SearchParams,
                                  value
                                )}
                                className={responsiveClasses.select}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Start time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {item.options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">End Time</Label>
                              <Select
                                value={item.endTime}
                                onValueChange={(value) => handleParameterChange(
                                  'selectedEndTime' as keyof SearchParams,
                                  value
                                )}
                                className={responsiveClasses.select}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="End time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {item.options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    if (item.type === 'price-range') {
                      return (
                        <div key={index} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className={cn("text-sm font-medium", isMobile && "text-base")}>
                              {item.label}
                            </Label>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={item.useCustom}
                                onCheckedChange={item.onToggleCustom}
                                size="sm"
                              />
                              <span className="text-xs text-muted-foreground">
                                Custom
                              </span>
                            </div>
                          </div>

                          {!item.useCustom && (
                            <Select
                              value={item.value}
                              onValueChange={(value) => handleParameterChange(
                                'selectedPriceRange' as keyof SearchParams,
                                value
                              )}
                              className={responsiveClasses.select}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Price range" />
                              </SelectTrigger>
                              <SelectContent>
                                {item.options?.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {item.useCustom && (
                            <div className="space-y-3">
                              <Slider
                                value={item.customRange}
                                onValueChange={item.onCustomChange}
                                max={5000}
                                step={100}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>${item.customRange[0]}</span>
                                <span>${item.customRange[1]}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    }

                    return null
                  })}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>

        {/* Action Buttons */}
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
                selectedDate: '',
                selectedDuration: '',
                selectedCity: null,
                selectedArea: '',
                selectedCountry: null,
                selectedFormat: '',
                selectedStartTime: null,
                selectedEndTime: null,
                selectedPriceRange: '',
                selectedVenue: 'all'
              })
            }}
            className="w-full"
            disabled={activeFilterCount === 0}
          >
            <X className="h-4 w-4 mr-2" />
            Clear All ({activeFilterCount})
          </Button>
        </div>
      </div>
      )
    )
  }

  // Active filters summary
  const ActiveFiltersSummary = () => {
    if (activeFilterCount === 0) return null

    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">Active Filters:</span>
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
                  ))
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSearchParamsChange({
                  selectedSport: '',
                  selectedDate: '',
                  selectedDuration: '',
                  selectedCity: null,
                  selectedArea: '',
                  selectedCountry: null,
                  selectedFormat: '',
                  selectedStartTime: null,
                  selectedEndTime: null,
                  selectedPriceRange: '',
                  selectedVenue: 'all'
                })
              }}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Mobile: Side Panel Pattern
  if (deviceType === 'mobile') {
    return (
      <div className="flex">
        {/* Fixed Side Filter Panel */}
        <div className={cn(
          "fixed left-0 top-0 h-full bg-background border-r z-40 transition-all duration-300 shadow-lg",
          isFilterOpen ? "w-80" : "w-16"
        )}>
          <div className="sticky top-0 h-full flex flex-col">
            {/* Header */}
            <div className={cn(
              "flex items-center justify-between p-4 border-b",
              isFilterOpen ? "" : "flex-col gap-2"
            )}>
              {isFilterOpen && (
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  <span className="font-semibold">Filters</span>
                </div>
              )}
              <Button
                variant="outline"
                size={isFilterOpen ? "sm" : "lg"}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={cn(
                  "transition-all duration-300 hover:scale-105",
                  isFilterOpen ? "" : "w-12 h-12 p-0 rounded-full"
                )}
                aria-label={isFilterOpen ? "Close filters" : "Open filters"}
              >
                {isFilterOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Filter className="h-5 w-5" />
                )}
                {activeFilterCount > 0 && !isFilterOpen && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold animate-pulse"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Active Filter Count Badge (expanded state) */}
            {isFilterOpen && activeFilterCount > 0 && (
              <div className="px-4 py-2 border-b">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    {activeFilterCount} active
                  </Badge>
                  <span className="text-sm text-muted-foreground">filters applied</span>
                </div>
              </div>
            )}

            {/* Filter Content */}
            <div className={cn(
              "flex-1 overflow-y-auto",
              isFilterOpen ? "p-4" : "p-2"
            )}>
              {isFilterOpen && <FilterContent mobile={true} />}
            </div>

            {/* Apply Button (always visible) */}
            <div className={cn(
              "border-t p-4",
              !isFilterOpen && "mt-auto"
            )}>
              <Button
                onClick={() => {
                  onSearch()
                }}
                className="w-full"
                size={isFilterOpen ? "default" : "sm"}
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
                    {isFilterOpen ? "Apply Filters" : "Search"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={cn(
          "flex-1 transition-all duration-300",
          isFilterOpen ? "ml-80" : "ml-16"
        )}>
          {/* Active Filters Bar (when filters are applied but panel is collapsed) */}
          {activeFilterCount > 0 && !isFilterOpen && (
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">
                    {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFilterOpen(true)}
                >
                  Modify
                </Button>
              </div>
              {/* Filter Pills */}
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(searchParams).map(([key, value]) =>
                  value && value !== 'all' && (
                    <Badge
                      key={key}
                      variant="secondary"
                      className="text-xs"
                    >
                      {getFilterDisplay(key as keyof SearchParams, value)}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          )}
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
              "transition-all duration-300",
              isFilterOpen ? "p-4 space-y-4" : "p-2"
            )}>
              {isFilterOpen && <FilterContent mobile={false} />}
            </CardContent>

            {!isFilterOpen && activeFilterCount > 0 && (
              <div className="border-t p-2">
                <Button
                  onClick={() => onSearch()}
                  className="w-full"
                  size="sm"
                  disabled={loading || !searchParams.selectedSport || !searchParams.selectedDate || !searchParams.selectedDuration}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Apply
                </Button>
              </div>
            )}
          </Card>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {children}
        </div>
      </div>
    )
  }

  // Desktop: Persistent Sidebar Pattern
  return (
    <div className="flex gap-6">
      {/* Persistent Sidebar */}
      <aside className="w-80">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {activeFilterCount} active
              </Badge>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <FilterContent mobile={false} />
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button
              onClick={onSearch}
              className="flex-1"
              disabled={loading || !searchParams.selectedSport || !searchParams.selectedDate || !searchParams.selectedDuration}
            >
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Clear all filters
                onSearchParamsChange({
                  selectedSport: '',
                  selectedDate: '',
                  selectedDuration: '',
                  selectedCity: null,
                  selectedArea: '',
                  selectedCountry: null,
                  selectedFormat: '',
                  selectedStartTime: null,
                  selectedEndTime: null,
                  selectedPriceRange: '',
                  selectedVenue: 'all'
                })
              }}
              disabled={activeFilterCount === 0}
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </CardFooter>
        </Card>

        {/* Active Filters Summary */}
        <ActiveFiltersSummary />
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {children}
      </div>
    </div>
  )
}

// Export the component
export { OptimizedResponsiveFilters }