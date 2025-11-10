import { useState, useEffect, useCallback } from 'react'

export interface CalendarColumnPreferences {
  venueWidth: number
  sportWidth: number
  courtWidth: number
  formatWidth: number
  timeSlotWidth: number
  autoFit: boolean // If true, time slots auto-adjust to viewport
  showVenueColumn: boolean // Show/hide venue column
  showFormatColumn: boolean // Show/hide format column (format as separate rows)
}

export type ViewMode = 'day' | 'week' | 'month'

const DEFAULT_PREFERENCES: CalendarColumnPreferences = {
  venueWidth: 120,
  sportWidth: 100,
  courtWidth: 150,
  formatWidth: 120,
  timeSlotWidth: 60,
  autoFit: true, // Default to auto-fit for better UX
  showVenueColumn: true, // Show by default if multiple venues exist
  showFormatColumn: true, // Show by default (format as separate rows)
}

const STORAGE_KEY_PREFIX = 'vendor-calendar-columns'

const getStorageKey = (viewMode: ViewMode): string => {
  return `${STORAGE_KEY_PREFIX}-${viewMode}`
}

export function useCalendarPreferences(viewMode: ViewMode) {
  const [preferences, setPreferences] = useState<CalendarColumnPreferences>(DEFAULT_PREFERENCES)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const storageKey = getStorageKey(viewMode)
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as CalendarColumnPreferences
        // Validate and merge with defaults
        setPreferences({
          venueWidth: parsed.venueWidth || DEFAULT_PREFERENCES.venueWidth,
          sportWidth: parsed.sportWidth || DEFAULT_PREFERENCES.sportWidth,
          courtWidth: parsed.courtWidth || DEFAULT_PREFERENCES.courtWidth,
          formatWidth: parsed.formatWidth || DEFAULT_PREFERENCES.formatWidth,
          timeSlotWidth: parsed.timeSlotWidth || DEFAULT_PREFERENCES.timeSlotWidth,
          autoFit: parsed.autoFit !== undefined ? parsed.autoFit : DEFAULT_PREFERENCES.autoFit,
          showVenueColumn: parsed.showVenueColumn !== undefined ? parsed.showVenueColumn : DEFAULT_PREFERENCES.showVenueColumn,
          showFormatColumn: parsed.showFormatColumn !== undefined ? parsed.showFormatColumn : DEFAULT_PREFERENCES.showFormatColumn,
        })
      }
    } catch (error) {
      console.error('Failed to load calendar preferences:', error)
      // Use defaults on error
      setPreferences(DEFAULT_PREFERENCES)
    } finally {
      setIsLoaded(true)
    }
  }, [viewMode])

  // Save preferences to localStorage
  const savePreferences = useCallback((newPreferences: Partial<CalendarColumnPreferences>) => {
    try {
      const updated = { ...preferences, ...newPreferences }
      const storageKey = getStorageKey(viewMode)
      localStorage.setItem(storageKey, JSON.stringify(updated))
      setPreferences(updated)
    } catch (error) {
      console.error('Failed to save calendar preferences:', error)
    }
  }, [preferences, viewMode])

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    try {
      const storageKey = getStorageKey(viewMode)
      localStorage.removeItem(storageKey)
      setPreferences(DEFAULT_PREFERENCES)
    } catch (error) {
      console.error('Failed to reset calendar preferences:', error)
    }
  }, [viewMode])

  // Update individual preference
  const updatePreference = useCallback(<K extends keyof CalendarColumnPreferences>(
    key: K,
    value: CalendarColumnPreferences[K]
  ) => {
    savePreferences({ [key]: value })
  }, [savePreferences])

  // Calculate auto-fit time slot width based on available space
  const calculateAutoFitTimeSlotWidth = useCallback((
    availableWidth: number,
    timeSlotCount: number,
    minWidth: number = 40,
    maxWidth: number = 200
  ): number => {
    if (timeSlotCount === 0) return minWidth
    
    const calculatedWidth = availableWidth / timeSlotCount
    // Clamp between min and max
    return Math.max(minWidth, Math.min(maxWidth, calculatedWidth))
  }, [])

  return {
    preferences,
    isLoaded,
    savePreferences,
    resetToDefaults,
    updatePreference,
    calculateAutoFitTimeSlotWidth,
  }
}

