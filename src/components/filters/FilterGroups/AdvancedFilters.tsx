'use client'

import { useState } from 'react'
import { Clock, DollarSign, MapPin, Trophy, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface AdvancedFiltersProps {
  startTime?: string | null
  endTime?: string | null
  priceRange?: string | null
  venue?: string | null
  format?: string | null
  onStartTimeChange: (time: string | null) => void
  onEndTimeChange: (time: string | null) => void
  onPriceRangeChange: (range: string | null) => void
  onVenueChange: (venue: string | null) => void
  onFormatChange: (format: string | null) => void
  venues: Array<{ id: string; name: string }>
  formats: Array<{ id: string; name: string; displayName: string }>
  timeSlots: Array<{ value: string; label: string }>
  isMobile?: boolean
  loading?: boolean
}

// Price ranges with better organization
const priceRanges = [
  { value: 'all', label: 'Any price', min: 0, max: 10000 },
  { value: '0-500', label: 'Under $500', min: 0, max: 500 },
  { value: '500-1000', label: '$500 - $1,000', min: 500, max: 1000 },
  { value: '1000-2000', label: '$1,000 - $2,000', min: 1000, max: 2000 },
  { value: '2000+', label: '$2,000+', min: 2000, max: 10000 },
]

export default function AdvancedFilters({
  startTime,
  endTime,
  priceRange,
  venue,
  format,
  onStartTimeChange,
  onEndTimeChange,
  onPriceRangeChange,
  onVenueChange,
  onFormatChange,
  venues,
  formats,
  timeSlots,
  isMobile = false,
  loading = false
}: AdvancedFiltersProps) {
  const [customPriceRange, setCustomPriceRange] = useState<[number, number]>([0, 5000])
  const [useCustomPrice, setUseCustomPrice] = useState(false)
  const [timeFilterMode, setTimeFilterMode] = useState<'range' | 'any'>('any')

  // Touch-optimized classes
  const touchClasses = isMobile ? {
    select: 'h-12 text-base',
    button: 'h-12 px-4 text-base',
    label: 'text-base font-medium',
    card: 'p-4'
  } : {
    select: 'h-10 text-sm',
    button: 'h-10 px-3 text-sm',
    label: 'text-sm font-medium',
    card: 'p-4'
  }

  // Time filter mode toggle
  const TimeFilterToggle = () => (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
      <Button
        variant={timeFilterMode === 'any' ? 'default' : 'outline'}
        size="sm"
        onClick={() => {
          setTimeFilterMode('any')
          onStartTimeChange(null)
          onEndTimeChange(null)
        }}
        className="flex-1"
      >
        <Clock className="h-4 w-4 mr-2" />
        Any Time
      </Button>
      <Button
        variant={timeFilterMode === 'range' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setTimeFilterMode('range')}
        className="flex-1"
      >
        <Settings className="h-4 w-4 mr-2" />
        Time Range
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Time Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Time Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TimeFilterToggle />

          {timeFilterMode === 'range' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={touchClasses.label}>Start Time</Label>
                <Select
                  value={startTime || 'any'}
                  onValueChange={(value) => onStartTimeChange(value === 'any' ? null : value)}
                  disabled={loading}
                >
                  <SelectTrigger className={touchClasses.select}>
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any time</SelectItem>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={touchClasses.label}>End Time</Label>
                <Select
                  value={endTime || 'any'}
                  onValueChange={(value) => onEndTimeChange(value === 'any' ? null : value)}
                  disabled={loading}
                >
                  <SelectTrigger className={touchClasses.select}>
                    <SelectValue placeholder="Any end time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any end time</SelectItem>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Time Range Summary */}
          {(startTime || endTime) && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                {startTime && !endTime ? `From ${startTime}` :
                 !startTime && endTime ? `Until ${endTime}` :
                 `${startTime} - ${endTime}`}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4" />
            Price Range
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Price Range Toggle */}
          <div className="flex items-center gap-3">
            <Switch
              checked={useCustomPrice}
              onCheckedChange={setUseCustomPrice}
              disabled={loading}
            />
            <Label className="text-sm font-medium">
              Custom price range
            </Label>
          </div>

          {!useCustomPrice ? (
            <Select
              value={priceRange || 'all'}
              onValueChange={(value) => onPriceRangeChange(value === 'all' ? null : value)}
              disabled={loading}
            >
              <SelectTrigger className={touchClasses.select}>
                <SelectValue placeholder="Any price" />
              </SelectTrigger>
              <SelectContent>
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
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Price Range: ${customPriceRange[0]} - ${customPriceRange[1]}
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomPriceRange([0, 5000])}
                    >
                      Reset
                    </Button>
                  </div>
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
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$0</span>
                  <span>$10,000</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Price Buttons */}
          {!useCustomPrice && (
            <div className="flex flex-wrap gap-2">
              {['< $500', '$500-1000', '$1000+'].map((label) => (
                <Button
                  key={label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const value = label === '< $500' ? '0-500' :
                                   label === '$500-1000' ? '500-1000' : '1000+'
                    onPriceRangeChange(value)
                  }}
                  className="h-8 px-3 text-xs"
                >
                  {label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Venue Preferences */}
      {venues.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Venue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={venue || 'all'}
              onValueChange={(value) => onVenueChange(value === 'all' ? null : value)}
              disabled={loading}
            >
              <SelectTrigger className={touchClasses.select}>
                <SelectValue placeholder="All venues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All venues</SelectItem>
                {venues.map((venueItem) => (
                  <SelectItem key={venueItem.id} value={venueItem.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{venueItem.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Game Format */}
      {formats.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4" />
              Game Format
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={format || 'all'}
              onValueChange={(value) => onFormatChange(value === 'all' ? null : value)}
              disabled={loading}
            >
              <SelectTrigger className={touchClasses.select}>
                <SelectValue placeholder="All formats" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All formats</SelectItem>
                {formats.map((formatItem) => (
                  <SelectItem key={formatItem.id} value={formatItem.id}>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{formatItem.displayName}</div>
                        <div className="text-xs text-muted-foreground">{formatItem.name}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Advanced Options Summary */}
      {(priceRange || venue || format || startTime || endTime) && (
        <Card className="border-dashed">
          <CardContent className={cn(touchClasses.card, "pt-4")}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Active Preferences</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onPriceRangeChange(null)
                  onVenueChange(null)
                  onFormatChange(null)
                  onStartTimeChange(null)
                  onEndTimeChange(null)
                  setUseCustomPrice(false)
                  setTimeFilterMode('any')
                }}
                className="h-8 px-3 text-xs"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {startTime && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  From {startTime}
                </Badge>
              )}
              {endTime && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Until {endTime}
                </Badge>
              )}
              {priceRange && !useCustomPrice && (
                <Badge variant="outline" className="text-xs">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {priceRanges.find(r => r.value === priceRange)?.label}
                </Badge>
              )}
              {useCustomPrice && (
                <Badge variant="outline" className="text-xs">
                  <DollarSign className="h-3 w-3 mr-1" />
                  ${customPriceRange[0]}-${customPriceRange[1]}
                </Badge>
              )}
              {venue && venue !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {venues.find(v => v.id === venue)?.name}
                </Badge>
              )}
              {format && format !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  <Trophy className="h-3 w-3 mr-1" />
                  {formats.find(f => f.id === format)?.displayName}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}