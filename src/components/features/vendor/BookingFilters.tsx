'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'
import { useVendor } from '@/hooks/use-vendor'

export interface BookingFilters {
  search: string
  venueId: string
  courtId: string
  sportId: string
  status: string
  paymentStatus: string
}

interface BookingFiltersProps {
  filters: BookingFilters
  onFiltersChange: (filters: BookingFilters) => void
  onClearFilters: () => void
}

export function BookingFiltersComponent({ filters, onFiltersChange, onClearFilters }: BookingFiltersProps) {
  const { vendorId } = useVendor()
  
  // Filter options data
  const [allVenues, setAllVenues] = useState<Array<{ id: string; name: string }>>([])
  const [allCourts, setAllCourts] = useState<Array<{ id: string; name: string; venueId: string; sportId: string }>>([])
  const [allSports, setAllSports] = useState<Array<{ id: string; name: string; displayName: string }>>([])

  // Fetch venues
  useEffect(() => {
    if (vendorId) {
      fetchVenues()
      fetchCourts()
    }
  }, [vendorId])

  const fetchVenues = async () => {
    if (!vendorId) return
    try {
      const response = await fetch(`/api/vendors/${vendorId}/venues?limit=100&status=active`, {
        credentials: 'include'
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setAllVenues(result.data.map((venue: any) => ({
            id: venue.id,
            name: venue.name
          })))
        }
      }
    } catch (error) {
      console.error('Error fetching venues:', error)
    }
  }

  const fetchCourts = async () => {
    if (!vendorId) return
    try {
      const response = await fetch(`/api/courts?vendorId=${vendorId}&limit=1000`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.courts && Array.isArray(data.courts)) {
          const distinctCourts = new Map<string, { id: string; name: string; venueId: string; sportId: string }>()
          const distinctSports = new Map<string, { id: string; name: string; displayName: string }>()
          
          data.courts.forEach((court: any) => {
            if (court.venue?.id && court.sport?.id) {
              distinctCourts.set(court.id, {
                id: court.id,
                name: court.name,
                venueId: court.venue.id,
                sportId: court.sport.id
              })
            }
            if (court.sport) {
              distinctSports.set(court.sport.id, {
                id: court.sport.id,
                name: court.sport.name,
                displayName: court.sport.displayName || court.sport.name
              })
            }
          })
          
          setAllCourts(Array.from(distinctCourts.values()))
          setAllSports(Array.from(distinctSports.values()))
        }
      }
    } catch (error) {
      console.error('Error fetching courts:', error)
    }
  }

  // Computed filtered options based on cascading logic
  const { venues, courts, sports } = useMemo(() => {
    let filteredVenues = allVenues
    let filteredCourts = allCourts
    let filteredSports = allSports

    // If sport is selected, filter venues and courts by sport
    if (filters.sportId && filters.sportId !== 'all') {
      const venueIdsWithSport = new Set(
        allCourts
          .filter(c => c.sportId === filters.sportId)
          .map(c => c.venueId)
      )
      filteredVenues = filteredVenues.filter(v => venueIdsWithSport.has(v.id))
      filteredCourts = filteredCourts.filter(c => c.sportId === filters.sportId)
    }

    // If venue is selected, filter courts and sports by venue
    if (filters.venueId && filters.venueId !== 'all') {
      const sportIdsAtVenue = new Set(
        allCourts
          .filter(c => c.venueId === filters.venueId)
          .map(c => c.sportId)
      )
      filteredSports = filteredSports.filter(s => sportIdsAtVenue.has(s.id))
      filteredCourts = filteredCourts.filter(c => c.venueId === filters.venueId)
    }

    // If both venue and sport are selected, filter courts by both
    if (filters.venueId !== 'all' && filters.sportId !== 'all') {
      filteredCourts = filteredCourts.filter(
        c => c.venueId === filters.venueId && c.sportId === filters.sportId
      )
    }

    return { venues: filteredVenues, courts: filteredCourts, sports: filteredSports }
  }, [filters.venueId, filters.sportId, allVenues, allCourts, allSports])

  const handleVenueChange = (venueId: string) => {
    const newVenueId = venueId || 'all'
    const newFilters = { ...filters, venueId: newVenueId }
    
    // Reset court if it doesn't belong to new venue
    if (newVenueId !== 'all') {
      const currentCourt = allCourts.find(c => c.id === filters.courtId)
      if (currentCourt && currentCourt.venueId !== newVenueId) {
        newFilters.courtId = 'all'
      }
    }
    
    onFiltersChange(newFilters)
  }

  const handleCourtChange = (courtId: string) => {
    const newCourtId = courtId || 'all'
    const newFilters = { ...filters, courtId: newCourtId }
    
    // Auto-select sport for the court
    if (newCourtId !== 'all') {
      const court = allCourts.find(c => c.id === newCourtId)
      if (court?.sportId) {
        newFilters.sportId = court.sportId
      }
    }
    
    onFiltersChange(newFilters)
  }

  const handleSportChange = (sportId: string) => {
    const newSportId = sportId || 'all'
    const newFilters = { ...filters, sportId: newSportId }
    
    // Reset court if it doesn't match sport
    if (newSportId !== 'all') {
      const currentCourt = allCourts.find(c => c.id === filters.courtId)
      if (currentCourt && currentCourt.sportId !== newSportId) {
        newFilters.courtId = 'all'
      }
    }
    
    onFiltersChange(newFilters)
  }

  const hasActiveFilters = filters.venueId !== 'all' || 
    filters.courtId !== 'all' || 
    filters.sportId !== 'all' || 
    filters.status !== 'all' || 
    filters.paymentStatus !== 'all' || 
    filters.search !== ''

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Filters in a single row */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] sm:max-w-[220px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Venue */}
        <Select value={filters.venueId === 'all' ? undefined : filters.venueId} onValueChange={handleVenueChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Venue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Venues</SelectItem>
            {venues.map((venue) => (
              <SelectItem key={venue.id} value={venue.id}>
                {venue.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Court */}
        <Select 
          value={filters.courtId === 'all' ? undefined : filters.courtId} 
          onValueChange={handleCourtChange}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Court" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courts</SelectItem>
            {courts.map((court) => (
              <SelectItem key={court.id} value={court.id}>
                {court.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sport */}
        <Select value={filters.sportId === 'all' ? undefined : filters.sportId} onValueChange={handleSportChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Sport" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            {sports.map((sport) => (
              <SelectItem key={sport.id} value={sport.id}>
                {sport.displayName || sport.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={filters.status === 'all' ? undefined : filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value || 'all' })}>
          <SelectTrigger className="w-full sm:w-[140px] text-foreground">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Confirmed">Confirmed</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="No-Show">No Show</SelectItem>
          </SelectContent>
        </Select>

        {/* Payment Status */}
        <Select value={filters.paymentStatus === 'all' ? undefined : filters.paymentStatus} onValueChange={(value) => onFiltersChange({ ...filters, paymentStatus: value || 'all' })}>
          <SelectTrigger className="w-full sm:w-[140px] text-foreground">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-blue-800">Active Filters:</span>
          {filters.search && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Search: {filters.search}
              <button
                onClick={() => onFiltersChange({ ...filters, search: '' })}
                className="ml-1 hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.venueId !== 'all' && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Venue: {venues.find(v => v.id === filters.venueId)?.name || filters.venueId}
              <button
                onClick={() => handleVenueChange('all')}
                className="ml-1 hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.courtId !== 'all' && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Court: {courts.find(c => c.id === filters.courtId)?.name || filters.courtId}
              <button
                onClick={() => handleCourtChange('all')}
                className="ml-1 hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.sportId !== 'all' && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Sport: {sports.find(s => s.id === filters.sportId)?.displayName || filters.sportId}
              <button
                onClick={() => handleSportChange('all')}
                className="ml-1 hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Status: {filters.status}
              <button
                onClick={() => onFiltersChange({ ...filters, status: 'all' })}
                className="ml-1 hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.paymentStatus !== 'all' && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Payment: {filters.paymentStatus}
              <button
                onClick={() => onFiltersChange({ ...filters, paymentStatus: 'all' })}
                className="ml-1 hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

