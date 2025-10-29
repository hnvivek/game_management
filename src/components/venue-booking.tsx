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
  minPlayers: number
  maxPlayers: number
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Find Venues
          </CardTitle>
          <CardDescription>
            Search and book available venues for your match
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Sport Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sport</Label>
                  <Select value={selectedSport} onValueChange={setSelectedSport}>
                    <SelectTrigger>
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

                {/* Date Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Duration Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Duration</Label>
                  <Select value={selectedDuration} onValueChange={setSelectedDuration}>
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
              
              {/* Area Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Preferred Area <span className="text-gray-500 font-normal">(Optional)</span>
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
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                    <p className="text-sm text-red-800">{error}</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header with Search Results */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Search Summary */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-lg font-bold text-gray-900">Available Slots</h2>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-0">
                    <Target className="h-3 w-3 mr-1" />
                    {sports.find(s => s.name === selectedSport)?.displayName || 'Soccer'}
                  </Badge>
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-0">
                    <Calendar className="h-3 w-3 mr-1" />
                    {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : selectedDate}
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 text-xs px-2 py-0">
                    <Clock className="h-3 w-3 mr-1" />
                    {durations.find(d => d.value === selectedDuration)?.label}
                  </Badge>
                  {selectedArea && (
                    <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200 text-xs px-2 py-0">
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
                className="flex items-center gap-1.5 text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Filter className="h-3.5 w-3.5" />
                New Search
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSearchSlots}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs border-gray-300 text-gray-700 hover:bg-gray-50"
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
          <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-center">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
            <p className="text-red-800 text-xs">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">Searching...</h3>
          </div>
        )}

        {/* Timeline Cards - Compact Layout */}
        {!loading && timelineSlots.length > 0 && (
          <div className="space-y-2">
            {timelineSlots.map((slot) => (
              <Card key={slot.id} className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                <CardContent className="p-3">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    {/* Time & Status Column */}
                    <div className="flex items-center gap-3 lg:w-48 flex-shrink-0">
                      {/* Status Icon */}
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                        slot.status === 'available' ? 'bg-green-100' :
                        slot.status === 'open_match' ? 'bg-blue-100' :
                        slot.status === 'private_match' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        {slot.status === 'available' && <CheckCircle className="h-3.5 w-3.5 text-green-600" />}
                        {slot.status === 'open_match' && <Users className="h-3.5 w-3.5 text-blue-600" />}
                        {slot.status === 'private_match' && <Trophy className="h-3.5 w-3.5 text-yellow-600" />}
                        {slot.status === 'unavailable' && <XCircle className="h-3.5 w-3.5 text-red-600" />}
                      </div>
                      {/* Time */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <div className="text-xs text-gray-500">
                          {durations.find(d => d.value === selectedDuration)?.label}
                        </div>
                      </div>
                    </div>

                    {/* Venue Info Column */}
                    <div className="flex-1 min-w-0 lg:border-l lg:border-gray-200 lg:pl-3">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
                        <span className="font-semibold text-gray-900 truncate">{slot.venue.vendor.name}</span>
                        <span className="text-gray-400">•</span>
                        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                          {slot.venue.format.displayName}
                        </Badge>
                        <span className="text-gray-400">•</span>
                        <span className="truncate">{slot.venue.courtNumber}</span>
                        {slot.venue.location && (
                          <>
                            <span className="text-gray-400">•</span>
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
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-1.5 py-0 h-5">
                            <Trophy className="h-3 w-3 mr-1" />
                            {slot.match.homeTeam}
                          </Badge>
                          <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                            {slot.match.skillLevel}
                          </Badge>
                          <span className="text-blue-600">
                            <Users className="h-3 w-3 inline mr-0.5" />
                            {slot.match.playersNeeded} needed
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price & Actions Column */}
                    <div className="flex items-center gap-2 lg:w-80 flex-shrink-0 lg:border-l lg:border-gray-200 lg:pl-3">
                      {/* Price */}
                      <div className="text-right mr-2">
                        <div className="text-lg font-bold text-green-600 leading-none">
                          {formatPrice(slot.pricePerTeam || slot.totalPrice)}
                        </div>
                        {slot.pricePerTeam && (
                          <div className="text-xs text-gray-500">/team</div>
                        )}
                      </div>

                      {/* Action Buttons - Compact */}
                      <div className="flex gap-1.5 flex-1">
                        {slot.status === 'available' && (
                          <>
                            <Button
                              onClick={() => handleBookVenue(slot)}
                              size="sm"
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-2"
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              Book
                            </Button>
                            <Button
                              onClick={() => handleCreateMatch(slot)}
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-2"
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
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-2"
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
                          <Button variant="outline" size="sm" disabled className="flex-1 text-xs h-8 px-2 border-yellow-300 text-yellow-700">
                            Private
                          </Button>
                        )}
                        {slot.status === 'unavailable' && (
                          <Button variant="outline" size="sm" disabled className="flex-1 text-xs h-8 px-2 border-red-300 text-red-700">
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
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No slots available</h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              We couldn't find any available slots matching your criteria. Try adjusting your search parameters.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={handleNewSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
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
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Try Tomorrow
              </Button>
            </div>
          </div>
        )}

        {/* Summary Stats - Compact */}
        {!loading && timelineSlots.length > 0 && (
          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-gray-600">Summary:</span>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{timelineSlots.filter(s => s.status === 'available').length}</span>
                  <span className="text-xs text-gray-600">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                    <Users className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{timelineSlots.filter(s => s.status === 'open_match').length}</span>
                  <span className="text-xs text-gray-600">Open</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-yellow-100 rounded flex items-center justify-center">
                    <Trophy className="h-3 w-3 text-yellow-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{timelineSlots.filter(s => s.status === 'private_match').length}</span>
                  <span className="text-xs text-gray-600">Private</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-red-100 rounded flex items-center justify-center">
                    <XCircle className="h-3 w-3 text-red-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{timelineSlots.filter(s => s.status === 'unavailable').length}</span>
                  <span className="text-xs text-gray-600">Unavailable</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}