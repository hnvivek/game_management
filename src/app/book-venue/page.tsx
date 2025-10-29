'use client'

import { useState } from 'react'
import { Search, Calendar, MapPin, Users, Trophy, ArrowLeft, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import VenueBooking from '@/components/venue-booking'

export default function BookVenuePage() {
  const [venueBooking, setVenueBooking] = useState<any>(null)
  const [matchDetails, setMatchDetails] = useState({
    level: '',
    playersPerTeam: '',
    notes: '',
  })
  const [isCreatingMatch, setIsCreatingMatch] = useState(false)
  const [bookingError, setBookingError] = useState('')

  const handleVenueSelect = (venue: any, date: string, startTime: string, duration: number, totalAmount: number) => {
    setVenueBooking({ venue, date, startTime, duration, totalAmount })
  }

  const handleCreateMatch = async () => {
    if (!venueBooking || !matchDetails.level) {
      setBookingError('Please complete all required fields')
      return
    }
    
    try {
      setIsCreatingMatch(true)
      setBookingError('')
      
      // Validate match details
      if (matchDetails.playersPerTeam && 
          (parseInt(matchDetails.playersPerTeam) > venueBooking.venue.maxPlayers || 
           parseInt(matchDetails.playersPerTeam) < 1)) {
        setBookingError(`Players per team must be between 1 and ${venueBooking.venue.maxPlayers}`)
        setIsCreatingMatch(false)
        return
      }
      
      // Create booking first
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: venueBooking.venue.id,
          date: venueBooking.date,
          startTime: venueBooking.startTime,
          duration: venueBooking.duration,
          totalAmount: venueBooking.totalAmount,
          bookingType: 'match',
        }),
      })
      
      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json()
        throw new Error(errorData.error || 'Failed to create booking')
      }
      
      const bookingData = await bookingResponse.json()
      console.log('Booking created successfully:', bookingData)
      
      // Create match logic here (would be a separate API call in a real app)
      console.log('Match created successfully!')
      
      // Reset form
      setVenueBooking(null)
      setMatchDetails({ level: '', playersPerTeam: '', notes: '' })
      setBookingError('')
      
      // Show success message and potentially redirect
      alert('Match created successfully! Redirecting to dashboard...')
      
    } catch (error) {
      console.error('Error creating match:', error)
      setBookingError(error instanceof Error ? error.message : 'Failed to create match. Please try again.')
    } finally {
      setIsCreatingMatch(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation - Compact */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center space-x-1.5 group">
                <Button variant="ghost" size="sm" className="p-1 h-7 w-7">
                  <ArrowLeft className="h-3.5 w-3.5 text-gray-600 group-hover:text-gray-900" />
                </Button>
                <div className="flex items-center space-x-1.5">
                  <Trophy className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">Book Venues</span>
                </div>
              </Link>
            </div>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs px-3">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Compact */}
      <main className="max-w-7xl mx-auto px-4">
        <div className="py-4 space-y-4">
          {/* Error Display */}
          {bookingError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                <p className="text-red-800 text-xs">{bookingError}</p>
              </div>
            </div>
          )}

          {/* Venue Booking Section */}
          <VenueBooking onVenueSelect={handleVenueSelect} />

          {/* Match Details Section - Appears after venue selection */}
          {venueBooking && (
            <Card className="shadow-sm border">
              <CardHeader className="px-4 py-2.5 border-b bg-green-50">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-green-900">
                  <Check className="h-4 w-4 text-green-600" />
                  Match Setup
                </CardTitle>
              </CardHeader>

                <CardContent className="px-4 py-3 space-y-3">
                  {/* Booking Summary - Compact */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <Badge className="bg-green-100 text-green-800 border-green-200 px-1.5 py-0 h-5">
                          {venueBooking.venue.vendor.name}
                        </Badge>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-700 font-medium">
                          {venueBooking.venue.format.displayName}
                        </span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-700">
                          {venueBooking.venue.courtNumber}
                        </span>
                        <span className="text-gray-600">•</span>
                        <Calendar className="h-3 w-3 text-gray-600" />
                        <span className="text-gray-700">{venueBooking.date}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-700">{venueBooking.startTime}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-700">{venueBooking.duration}h</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-green-900">
                          {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            minimumFractionDigits: 0,
                          }).format(venueBooking.totalAmount)}
                        </p>
                        <Badge className="bg-green-100 text-green-800 border-green-200 px-1.5 py-0 h-5">
                          <Check className="h-3 w-3 mr-0.5" />
                          Reserved
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Match Configuration - Compact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Match Level *</Label>
                      <Select value={matchDetails.level} onValueChange={(value) => setMatchDetails(prev => ({ ...prev, level: value }))}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Players per Team</Label>
                      <Select
                        value={matchDetails.playersPerTeam}
                        onValueChange={(value) => setMatchDetails(prev => ({ ...prev, playersPerTeam: value }))}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder={`Max: ${venueBooking.venue.maxPlayers}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(venueBooking.venue.maxPlayers)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1} {i === 0 ? 'player' : 'players'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Additional Notes - Compact */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Additional Notes <span className="text-gray-500 font-normal">(Optional)</span>
                    </Label>
                    <Textarea
                      placeholder="Any special requirements or match details..."
                      value={matchDetails.notes}
                      onChange={(e) => setMatchDetails(prev => ({ ...prev, notes: e.target.value }))}
                      className="min-h-[60px] resize-none text-sm"
                    />
                  </div>

                  {/* Action Buttons - Compact */}
                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setVenueBooking(null)
                        setMatchDetails({ level: '', playersPerTeam: '', notes: '' })
                        setBookingError('')
                      }}
                      className="w-full sm:w-auto order-2 sm:order-1 h-8 text-xs"
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCreateMatch}
                      disabled={!venueBooking || !matchDetails.level || isCreatingMatch}
                      className="w-full sm:w-auto order-1 sm:order-2 h-8 text-xs"
                    >
                      {isCreatingMatch ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                          Creating...
                        </>
                      ) : (
                        'Confirm Booking'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
          )}
        </div>
      </main>
    </div>
  )
}
