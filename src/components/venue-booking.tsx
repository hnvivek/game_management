'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Users, Filter, RefreshCw, MessageCircle, Search, CheckCircle, XCircle, AlertCircle, Trophy, Target, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface Sport {
  id: string
  name: string
  displayName: string
  icon: string
}

interface Format {
  id: string
  name: string
  displayName: string
  playersPerTeam: number
  maxTotalPlayers?: number | null
}

interface Vendor {
  id: string
  name: string
  slug: string
  primaryColor: string
}

interface Location {
  id: string
  name: string
  area: string
  city: string
}

interface Venue {
  id: string
  name: string
  courtNumber: string
  pricePerHour: number
  maxPlayers: number
  sport: Sport
  format: Format
  vendor: Vendor
  location: Location | null
}

interface Match {
  id: string
  homeTeam: string
  lookingForOpponent: boolean
  skillLevel: string
  playersConfirmed: number
  playersNeeded: number
  contact?: string
  description?: string
}

interface TimelineSlot {
  id: string
  startTime: string
  endTime: string
  venue: Venue
  status: 'available' | 'open_match' | 'private_match' | 'unavailable'
  totalPrice: number
  pricePerTeam?: number
  match?: Match
  actions: string[]
}

interface VenueBookingProps {
  onVenueSelect: (venue: Venue & { isMatch?: boolean }, date: string, startTime: string, duration: number, totalAmount: number) => void
}

export default function VenueBooking({ onVenueSelect }: VenueBookingProps) {
  const [selectedSport, setSelectedSport] = useState('soccer')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedDuration, setSelectedDuration] = useState('2')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [timelineSlots, setTimelineSlots] = useState<TimelineSlot[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false) // New state to control timeline visibility

  const durations = [
    { value: '1', label: '1hr' },
    { value: '2', label: '2hr' },
    { value: '3', label: '3hr' },
  ]

  // Auto-set today's date as default and fetch sports
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
    fetchSports()
  }, [])

  // Only fetch timeline manually when user clicks search
  // Removed automatic fetching to improve UX and performance

  const fetchSports = async () => {
    try {
      const response = await fetch('/api/sports')
      if (!response.ok) throw new Error('Failed to fetch sports')
      
      const data = await response.json()
      setSports(data.sports)
      
      if (data.sports.length > 0 && !selectedSport) {
        setSelectedSport(data.sports[0].name)
      }
    } catch (error) {
      console.error('Error fetching sports:', error)
      setError('Failed to load sports. Please try again.')
    }
  }

  const handleSearchSlots = async () => {
    // Validate required fields
    if (!selectedSport || !selectedDate || !selectedDuration) {
      setError('Please select sport, date, and duration before searching.')
      return
    }

    try {
      setLoading(true)
      setError('')
      setShowTimeline(true) // Show timeline section
      
      const params = new URLSearchParams({
        sport: selectedSport,
        date: selectedDate,
        duration: selectedDuration,
        ...(selectedCity && { city: selectedCity }),
        ...(selectedArea && { area: selectedArea }),
      })
      
      const response = await fetch(`/api/timeline?${params}`)
      if (!response.ok) throw new Error('Failed to fetch timeline')
      
      const data = await response.json()
      setTimelineSlots(data.slots)
      
      console.log(`Loaded ${data.slots.length} timeline slots`, data.summary)
    } catch (error) {
      setError('Failed to load timeline. Please try again.')
      console.error('Error fetching timeline:', error)
      setShowTimeline(false) // Hide timeline on error
    } finally {
      setLoading(false)
    }
  }

  const handleNewSearch = () => {
    setShowTimeline(false)
    setTimelineSlots([])
    setError('')
  }

  const handleBookVenue = (slot: TimelineSlot) => {
    onVenueSelect(slot.venue, selectedDate, slot.startTime, parseInt(selectedDuration), slot.totalPrice)
  }

  const handleCreateMatch = (slot: TimelineSlot) => {
    onVenueSelect(
      { ...slot.venue, isMatch: true }, 
      selectedDate, 
      slot.startTime, 
      parseInt(selectedDuration), 
      slot.totalPrice
    )
  }

  const handleJoinMatch = (slot: TimelineSlot) => {
    if (slot.match) {
      alert(`Join ${slot.match.homeTeam}'s match!\n\nSkill Level: ${slot.match.skillLevel}\nPlayers needed: ${slot.match.playersNeeded}\n\nContact team to confirm participation.`)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price)
  }


  const getStatusText = (slot: TimelineSlot) => {
    switch(slot.status) {
      case 'available': return 'Available'
      case 'open_match': return slot.match ? `${slot.match.homeTeam} vs ???` : 'Open Match'
      case 'private_match': return 'Private Match'
      case 'unavailable': return 'Unavailable'
      default: return 'Unknown'
    }
  }

  // Don't show timeline view until user searches
  if (!showTimeline) {
    return (
      <Card className="w-full overflow-hidden">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Find Venues
          </CardTitle>
          <CardDescription>
            Search and book available venues for your match
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-4">
              <div className="w-full overflow-x-hidden">
                <div className="grid grid-cols-1 gap-3 sm:gap-4 min-w-0">
                {/* Sport Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sport</Label>
                  <Select value={selectedSport} onValueChange={setSelectedSport}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {sports.map((sport) => (
                        <SelectItem key={sport.name} value={sport.name}>
                          {sport.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date and Duration in same row on larger screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
                  <div className="space-y-2 min-w-0">
                    <Label className="text-sm font-medium">Date</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2 min-w-0">
                    <Label className="text-sm font-medium">Duration</Label>
                    <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                      <SelectTrigger className="w-full">
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
                </div>
              </div>
              
              {/* Area Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Preferred Area <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. Whitefield, Koramangala"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-destructive mr-2" />
                    <p className="text-sm text-destructive-foreground">{error}</p>
                  </div>
                </div>
              )}

              {/* Search Button */}
              <Button
                onClick={handleSearchSlots}
                disabled={loading || !selectedSport || !selectedDate || !selectedDuration}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Find Available Slots
                  </>
                )}
              </Button>
        </CardContent>
      </Card>
    )
  }

  // Timeline View (after search)
  return (
    <div className="min-h-screen bg-muted">
      {/* Header with Search Results */}
      <div className="bg-card border-b border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Search Summary */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-lg font-bold text-foreground">Available Slots</h2>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-0">
                    <Target className="h-3 w-3 mr-1" />
                    {sports.find(s => s.name === selectedSport)?.displayName || 'Soccer'}
                  </Badge>
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20 text-xs px-2 py-0">
                    <Calendar className="h-3 w-3 mr-1" />
                    {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : selectedDate}
                  </Badge>
                  <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20 text-xs px-2 py-0">
                    <Clock className="h-3 w-3 mr-1" />
                    {durations.find(d => d.value === selectedDuration)?.label}
                  </Badge>
                  {selectedArea && (
                    <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 text-xs px-2 py-0">
                      <MapPin className="h-3 w-3 mr-1" />
                      {selectedArea}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewSearch}
                className="flex items-center gap-1.5 text-xs border-border text-foreground hover:bg-muted"
              >
                <Filter className="h-3.5 w-3.5" />
                New Search
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSearchSlots}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs border-border text-foreground hover:bg-muted"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Error Message */}
        {error && (
          <div className="mb-3 bg-destructive/10 border border-destructive/20 rounded-lg p-2.5 flex items-center">
            <AlertCircle className="h-4 w-4 text-destructive mr-2 flex-shrink-0" />
            <p className="text-destructive-foreground text-xs">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground">Searching...</h3>
          </div>
        )}

        {/* Timeline Cards - Compact Layout */}
        {!loading && timelineSlots.length > 0 && (
          <div className="space-y-2">
            {timelineSlots.map((slot) => (
              <Card key={slot.id} className="bg-card border border-border hover:border-border hover:shadow-sm transition-all">
                <CardContent className="p-3">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    {/* Time & Status Column */}
                    <div className="flex items-center gap-3 lg:w-48 flex-shrink-0">
                      {/* Status Icon */}
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                        slot.status === 'available' ? 'bg-success/20' :
                        slot.status === 'open_match' ? 'bg-primary/20' :
                        slot.status === 'private_match' ? 'bg-warning/20' : 'bg-destructive/20'
                      }`}>
                        {slot.status === 'available' && <CheckCircle className="h-3.5 w-3.5 text-success" />}
                        {slot.status === 'open_match' && <Users className="h-3.5 w-3.5 text-primary" />}
                        {slot.status === 'private_match' && <Trophy className="h-3.5 w-3.5 text-warning" />}
                        {slot.status === 'unavailable' && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                      </div>
                      {/* Time */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-foreground truncate">
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {durations.find(d => d.value === selectedDuration)?.label}
                        </div>
                      </div>
                    </div>

                    {/* Venue Info Column */}
                    <div className="flex-1 min-w-0 lg:border-l lg:border-border lg:pl-3">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground truncate">{slot.venue.vendor.name}</span>
                        <span className="text-muted-foreground">•</span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                          {slot.venue.format.displayName}
                        </Badge>
                        <span className="text-muted-foreground">•</span>
                        <span className="truncate">{slot.venue.courtNumber}</span>
                        {slot.venue.location && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <div className="flex items-center gap-0.5 truncate">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span>{slot.venue.location.area}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Match Info - Compact */}
                      {slot.match && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                          <Badge className="bg-primary/20 text-primary-foreground border-primary/20 px-1.5 py-0 h-5">
                            <Trophy className="h-3 w-3 mr-1" />
                            {slot.match.homeTeam}
                          </Badge>
                          <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                            {slot.match.skillLevel}
                          </Badge>
                          <span className="text-primary">
                            <Users className="h-3 w-3 inline mr-0.5" />
                            {slot.match.playersNeeded} needed
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price & Actions Column */}
                    <div className="flex items-center gap-2 lg:w-80 flex-shrink-0 lg:border-l lg:border-border lg:pl-3">
                      {/* Price */}
                      <div className="text-right mr-2">
                        <div className="text-lg font-bold text-success leading-none">
                          {formatPrice(slot.pricePerTeam || slot.totalPrice)}
                        </div>
                        {slot.pricePerTeam && (
                          <div className="text-xs text-muted-foreground">/team</div>
                        )}
                      </div>

                      {/* Action Buttons - Compact */}
                      <div className="flex gap-1.5 flex-1">
                        {slot.status === 'available' && (
                          <>
                            <Button
                              onClick={() => handleBookVenue(slot)}
                              size="sm"
                              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 px-2"
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              Book
                            </Button>
                            <Button
                              onClick={() => handleCreateMatch(slot)}
                              size="sm"
                              className="flex-1 bg-success hover:bg-success/90 text-primary-foreground text-xs h-8 px-2"
                            >
                              <Trophy className="h-3 w-3 mr-1" />
                              Match
                            </Button>
                          </>
                        )}
                        {slot.status === 'open_match' && (
                          <>
                            <Button
                              onClick={() => handleJoinMatch(slot)}
                              size="sm"
                              className="flex-1 bg-success hover:bg-success/90 text-primary-foreground text-xs h-8 px-2"
                            >
                              <Users className="h-3 w-3 mr-1" />
                              Join
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => slot.match && alert(`Contact: ${slot.match.contact || 'No contact info'}`)}
                              className="text-xs h-8 px-2"
                            >
                              <MessageCircle className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {slot.status === 'private_match' && (
                          <Button variant="outline" size="sm" disabled className="flex-1 text-xs h-8 px-2 border-warning text-warning">
                            Private
                          </Button>
                        )}
                        {slot.status === 'unavailable' && (
                          <Button variant="outline" size="sm" disabled className="flex-1 text-xs h-8 px-2 border-destructive text-destructive">
                            Unavailable
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && timelineSlots.length === 0 && selectedSport && selectedDate && selectedDuration && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">No slots available</h3>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              We couldn't find any available slots matching your criteria. Try adjusting your search parameters.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={handleNewSearch}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                <Filter className="h-4 w-4 mr-2" />
                Adjust Search
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setSelectedDate(new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0])
                  handleSearchSlots()
                }}
                className="border-border text-foreground hover:bg-muted"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Try Tomorrow
              </Button>
            </div>
          </div>
        )}

        {/* Summary Stats - Compact */}
        {!loading && timelineSlots.length > 0 && (
          <div className="mt-4 bg-card border border-border rounded-lg p-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-muted-foreground">Summary:</span>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-success/20 rounded flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-success" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{timelineSlots.filter(s => s.status === 'available').length}</span>
                  <span className="text-xs text-muted-foreground">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-primary/20 rounded flex items-center justify-center">
                    <Users className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{timelineSlots.filter(s => s.status === 'open_match').length}</span>
                  <span className="text-xs text-muted-foreground">Open</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-warning/20 rounded flex items-center justify-center">
                    <Trophy className="h-3 w-3 text-warning" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{timelineSlots.filter(s => s.status === 'private_match').length}</span>
                  <span className="text-xs text-muted-foreground">Private</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-destructive/20 rounded flex items-center justify-center">
                    <XCircle className="h-3 w-3 text-destructive" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{timelineSlots.filter(s => s.status === 'unavailable').length}</span>
                  <span className="text-xs text-muted-foreground">Unavailable</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}