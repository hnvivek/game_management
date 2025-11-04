'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface PrimaryFiltersProps {
  sport?: string
  date?: string
  duration?: string
  onSportChange: (sport: string) => void
  onDateChange: (date: string) => void
  onDurationChange: (duration: string) => void
  sports: Array<{ id: string; name: string; displayName: string; icon?: string }>
  isMobile?: boolean
  loading?: boolean
}

const durations = [
  { value: '1', label: '1 hour' },
  { value: '2', label: '2 hours' },
  { value: '3', label: '3 hours' },
]

export default function PrimaryFilters({
  sport,
  date,
  duration,
  onSportChange,
  onDateChange,
  onDurationChange,
  sports,
  isMobile = false,
  loading = false
}: PrimaryFiltersProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  // Touch-optimized classes
  const touchClasses = isMobile ? {
    select: 'h-12 text-base',
    button: 'h-12 px-4 text-base',
    input: 'h-12 text-base',
    label: 'text-base font-medium'
  } : {
    select: 'h-10 text-sm',
    button: 'h-10 px-3 text-sm',
    input: 'h-10 text-sm',
    label: 'text-sm font-medium'
  }

  return (
    <div className="space-y-4">
      {/* Sport Selection */}
      <div className="space-y-2">
        <Label className={touchClasses.label}>
          Sport <span className="text-destructive">*</span>
        </Label>
        <Select
          value={sport || ''}
          onValueChange={onSportChange}
          disabled={loading}
        >
          <SelectTrigger className={cn(
            touchClasses.select,
            "transition-all duration-200 hover:border-primary/50"
          )}>
            <SelectValue placeholder="Select sport" />
          </SelectTrigger>
          <SelectContent>
            {sports.map((sportItem) => (
              <SelectItem key={sportItem.id} value={sportItem.id}>
                <div className="flex items-center gap-2">
                  {sportItem.icon && <span>{sportItem.icon}</span>}
                  <div>
                    <div className="font-medium">{sportItem.displayName}</div>
                    <div className="text-xs text-muted-foreground">{sportItem.name}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Selection */}
      <div className="space-y-2">
        <Label className={touchClasses.label}>
          Date <span className="text-destructive">*</span>
        </Label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal transition-all duration-200 hover:border-primary/50",
                touchClasses.button,
                !date && "text-muted-foreground"
              )}
              disabled={loading}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {date ? (
                (() => {
                  const [year, month, day] = date.split('-').map(Number)
                  const displayDate = new Date(year, month - 1, day)
                  return displayDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                })()
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={date ? (() => {
                const [year, month, day] = date.split('-').map(Number)
                return new Date(year, month - 1, day)
              })() : undefined}
              onSelect={(selectedDate) => {
                if (selectedDate) {
                  const year = selectedDate.getFullYear()
                  const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0')
                  const day = selectedDate.getDate().toString().padStart(2, '0')
                  const formattedDate = `${year}-${month}-${day}`
                  onDateChange(formattedDate)
                }
                setIsCalendarOpen(false)
              }}
              disabled={(date) =>
                date < new Date(new Date().setHours(0, 0, 0, 0))
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Duration Selection */}
      <div className="space-y-2">
        <Label className={touchClasses.label}>
          Duration <span className="text-destructive">*</span>
        </Label>
        <Select
          value={duration || ''}
          onValueChange={onDurationChange}
          disabled={loading}
        >
          <SelectTrigger className={cn(
            touchClasses.select,
            "transition-all duration-200 hover:border-primary/50"
          )}>
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            {durations.map((durationItem) => (
              <SelectItem key={durationItem.value} value={durationItem.value}>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{durationItem.label}</div>
                    {isMobile && (
                      <div className="text-xs text-muted-foreground">
                        Perfect for a quick game
                      </div>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Duration Helper Text */}
        {duration && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>
              {duration === '1' ? 'Perfect for a quick game' :
               duration === '2' ? 'Great for practice and matches' :
               'Ideal for tournaments'}
            </span>
          </div>
        )}
      </div>

      {/* Validation Status */}
      {sport && date && duration && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="h-2 w-2 bg-green-500 rounded-full" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Ready to search for courts
          </span>
        </div>
      )}
    </div>
  )
}