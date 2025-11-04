'use client'

import { useState } from 'react'
import { Filter, ChevronDown, ChevronUp, Clock, Tag, MapPin, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface CollapsibleFilterProps {
  // Time Range Props
  availableTimeSlots: Array<{ value: string; label: string }>
  selectedStartTime: string | null
  selectedEndTime: string | null
  onStartTimeChange: (value: string) => void
  onEndTimeChange: (value: string) => void

  // Format Props
  formats: Array<{ id: string; displayName: string }>
  selectedFormat: string
  onFormatChange: (value: string) => void

  // Venue Props
  venues: Array<{ id: string; name: string }>
  selectedVenue: string
  onVenueChange: (value: string) => void

  // Price Props
  priceRanges: Array<{ value: string; label: string }>
  selectedPriceRange: string
  onPriceRangeChange: (value: string) => void

  // Active Filters Count
  activeFiltersCount?: number
}

export default function CollapsibleFilter({
  availableTimeSlots,
  selectedStartTime,
  selectedEndTime,
  onStartTimeChange,
  onEndTimeChange,
  formats,
  selectedFormat,
  onFormatChange,
  venues,
  selectedVenue,
  onVenueChange,
  priceRanges,
  selectedPriceRange,
  onPriceRangeChange,
  activeFiltersCount = 0
}: CollapsibleFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasTimeFilter = selectedStartTime || selectedEndTime
  const hasSecondaryFilters = selectedFormat !== 'all' || selectedVenue !== 'all' || selectedPriceRange !== 'all'

  // Always show time filter, but make other filters collapsible
  const essentialFiltersCount = hasTimeFilter ? 1 : 0
  const secondaryFiltersCount = hasSecondaryFilters ? 1 : 0
  const totalActiveFilters = essentialFiltersCount + secondaryFiltersCount

  return (
    <Card className="w-full" data-testid="collapsible-filter">
      <CardContent className="p-4">
        {/* Header with Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Filters</h3>
            {totalActiveFilters > 0 && (
              <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                {totalActiveFilters} active
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 px-2 text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                More
              </>
            )}
          </Button>
        </div>

        {/* Always Visible: Time Filter */}
        {availableTimeSlots.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Label className="text-xs sm:text-sm font-medium whitespace-nowrap">Time Range:</Label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedStartTime || ''} onValueChange={onStartTimeChange}>
                <SelectTrigger className="h-8 w-20 sm:w-24">
                  <SelectValue placeholder="Start" />
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

              <Select value={selectedEndTime || ''} onValueChange={onEndTimeChange}>
                <SelectTrigger className="h-8 w-20 sm:w-24">
                  <SelectValue placeholder="End" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimeSlots
                    .filter(slot => {
                      if (!selectedStartTime) return true
                      const endTime = slot.label.split(' - ')[1]
                      return endTime > selectedStartTime
                    })
                    .map((slot) => {
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
          </div>
        )}

        {/* Collapsible Secondary Filters */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="space-y-4">
            {/* Format Filter */}
            {formats.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Label className="text-xs sm:text-sm font-medium whitespace-nowrap">Format:</Label>
                </div>
                <Select value={selectedFormat} onValueChange={onFormatChange}>
                  <SelectTrigger className="h-8 w-32 sm:w-40">
                    <SelectValue placeholder="All formats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All formats</SelectItem>
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
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Label className="text-xs sm:text-sm font-medium whitespace-nowrap">Venue:</Label>
                </div>
                <Select value={selectedVenue} onValueChange={onVenueChange}>
                  <SelectTrigger className="h-8 w-32 sm:w-40">
                    <SelectValue placeholder="All venues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All venues</SelectItem>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        <div className="text-sm truncate">{venue.name}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Price Range Filter */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Label className="text-xs sm:text-sm font-medium whitespace-nowrap">Price:</Label>
              </div>
              <Select value={selectedPriceRange} onValueChange={onPriceRangeChange}>
                <SelectTrigger className="h-8 w-28 sm:w-36">
                  <SelectValue placeholder="All prices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All prices</SelectItem>
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

        {/* Active Filters Summary */}
        {totalActiveFilters > 0 && !isExpanded && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex flex-wrap gap-1">
              {hasTimeFilter && (
                <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                  <Clock className="h-3 w-3 mr-1" />
                  {selectedStartTime && selectedEndTime
                    ? `${selectedStartTime} - ${selectedEndTime}`
                    : selectedStartTime || 'Any time'
                  }
                </Badge>
              )}
              {selectedFormat !== 'all' && (
                <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                  <Tag className="h-3 w-3 mr-1" />
                  {formats.find(f => f.id === selectedFormat)?.displayName || 'Format'}
                </Badge>
              )}
              {selectedVenue !== 'all' && (
                <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                  <MapPin className="h-3 w-3 mr-1" />
                  {venues.find(v => v.id === selectedVenue)?.name || 'Venue'}
                </Badge>
              )}
              {selectedPriceRange !== 'all' && (
                <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {priceRanges.find(p => p.value === selectedPriceRange)?.label || 'Price'}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}