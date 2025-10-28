'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, DollarSign, Users, Check, X, AlertCircle, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface Turf {
  id: string
  name: string
  venue: string
  sport: string
  size: string
  courtNumber: string
  pricePerHour: number
  maxPlayers: number
  isAvailable?: boolean
  totalAmount?: number
}

interface TimeSlot {
  startTime: string
  endTime: string
  isAvailable: boolean
  hasBooking: boolean
  hasConflict: boolean
  booking?: any
  conflict?: any
}

interface TurfBookingProps {
  onTurfSelect: (turf: Turf, date: string, startTime: string, duration: number, totalAmount: number) => void
}

export default function TurfBooking({ onTurfSelect }: TurfBookingProps) {
  const [selectedSport, setSelectedSport] = useState('soccer')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedDuration, setSelectedDuration] = useState('1')
  const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [turfs, setTurfs] = useState<Turf[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: select basics, 2: select turf, 3: select time

  const sports = [
    { value: 'soccer', label: 'Football/Soccer' },
    { value: 'ultimate-frisbee', label: 'Ultimate Frisbee' },
    { value: 'box-cricket', label: 'Box Cricket' },
  ]

  const durations = [
    { value: '1', label: '1 hour' },
    { value: '2', label: '2 hours' },
    { value: '3', label: '3 hours' },
  ]

  // Auto-set today's date as default
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
  }, [])

  // Fetch turfs when sport, date, time, and duration are selected
  useEffect(() => {
    if (selectedSport && selectedDate && selectedTime && selectedDuration) {
      fetchTurfs()
    }
  }, [selectedSport, selectedDate, selectedTime, selectedDuration])

  // Fetch time slots when turf and date are selected
  useEffect(() => {
    if (selectedTurf && selectedDate) {
      fetchTimeSlots()
    }
  }, [selectedTurf, selectedDate])

  const fetchTurfs = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = new URLSearchParams({
        sport: selectedSport,
        date: selectedDate,
        startTime: selectedTime,
        duration: selectedDuration,
      })
      
      const response = await fetch(`/api/turfs?${params}`)
      if (!response.ok) throw new Error('Failed to fetch turfs')
      
      const data = await response.json()
      setTurfs(data.turfs)
      
      // Auto-select first available turf
      const availableTurf = data.turfs.find((t: Turf) => t.isAvailable)
      if (availableTurf) {
        setSelectedTurf(availableTurf)
      }
    } catch (error) {
      setError('Failed to load turfs. Please try again.')
      console.error('Error fetching turfs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTimeSlots = async () => {
    if (!selectedTurf) return
    
    try {
      const params = new URLSearchParams({
        turfId: selectedTurf.id,
        date: selectedDate,
      })
      
      const response = await fetch(`/api/turfs/availability?${params}`)
      if (!response.ok) throw new Error('Failed to fetch availability')
      
      const data = await response.json()
      setTimeSlots(data.timeSlots)
    } catch (error) {
      console.error('Error fetching time slots:', error)
    }
  }

  const handleTurfSelect = (turf: Turf) => {
    setSelectedTurf(turf)
  }

  const handleTimeSelect = (timeSlot: TimeSlot) => {
    if (!timeSlot.isAvailable) return
    setSelectedTime(timeSlot.startTime)
  }

  const handleConfirmBooking = () => {
    if (!selectedTurf || !selectedDate || !selectedTime) return
    
    const duration = parseInt(selectedDuration)
    const totalAmount = selectedTurf.pricePerHour * duration
    
    onTurfSelect(selectedTurf, selectedDate, selectedTime, duration, totalAmount)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price)
  }

  const canProceedToStep2 = selectedSport && selectedDate && selectedTime && selectedDuration
  const canProceedToStep3 = selectedTurf && canProceedToStep2

  return (
    <div className="space-y-6">
      {/* Step 1: Basic Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Step 1: Select Sport & Time</h3>
          <Badge variant={step === 1 ? "default" : "secondary"} className="bg-blue-100 text-blue-800">
            {step === 1 ? "Current" : "Completed"}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="sport">Sport</Label>
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger>
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                {sports.map((sport) => (
                  <SelectItem key={sport.value} value={sport.value}>
                    {sport.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <Label htmlFor="duration">Duration</Label>
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

          <div>
            <Label htmlFor="time">Start Time</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 17 }, (_, i) => {
                  const hour = i + 6
                  const time = `${hour.toString().padStart(2, '0')}:00`
                  return (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {canProceedToStep2 && (
          <div className="flex justify-center">
            <Button 
              onClick={() => setStep(2)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Next: Select Turf
            </Button>
          </div>
        )}
      </div>

      {/* Step 2: Turf Selection */}
      {step >= 2 && (
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Step 2: Select Turf</h3>
            <Badge variant={step === 2 ? "default" : "secondary"} className="bg-blue-100 text-blue-800">
              {step === 2 ? "Current" : "Completed"}
            </Badge>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading available turfs...</p>
            </div>
          )}

          {!loading && turfs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {turfs.map((turf) => (
                <Card 
                  key={turf.id} 
                  className={`cursor-pointer transition-all ${
                    selectedTurf?.id === turf.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : turf.isAvailable 
                        ? 'hover:shadow-md' 
                        : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => turf.isAvailable && handleTurfSelect(turf)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{turf.size}</CardTitle>
                        <CardDescription className="text-sm">
                          {turf.courtNumber}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={turf.isAvailable ? "default" : "secondary"}
                        className={turf.isAvailable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {turf.isAvailable ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Price/hr:</span>
                      <span className="font-semibold text-green-600">
                        {formatPrice(turf.pricePerHour)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Max players:</span>
                      <span className="font-medium">{turf.maxPlayers}</span>
                    </div>
                    {turf.totalAmount && (
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total ({selectedDuration}h):</span>
                          <span className="font-bold text-blue-600">
                            {formatPrice(turf.totalAmount)}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {step === 2 && canProceedToStep3 && (
            <div className="flex justify-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Back
              </Button>
              <Button 
                onClick={() => setStep(3)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next: Select Time Slot
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Time Slot Selection */}
      {step >= 3 && selectedTurf && (
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Step 3: Select Time Slot - {selectedTurf.size} ({selectedTurf.courtNumber})
            </h3>
            <Badge variant={step === 3 ? "default" : "secondary"} className="bg-blue-100 text-blue-800">
              {step === 3 ? "Current" : "Completed"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {timeSlots.map((slot) => (
              <Button
                key={slot.startTime}
                variant={selectedTime === slot.startTime ? "default" : "outline"}
                size="sm"
                disabled={!slot.isAvailable}
                onClick={() => handleTimeSelect(slot)}
                className={`${
                  !slot.isAvailable 
                    ? 'opacity-50 cursor-not-allowed' 
                    : selectedTime === slot.startTime
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-xs font-medium">{slot.startTime}</span>
                  {slot.hasBooking && <X className="h-3 w-3 text-red-500" />}
                  {slot.hasConflict && <AlertCircle className="h-3 w-3 text-orange-500" />}
                  {slot.isAvailable && !slot.hasBooking && !slot.hasConflict && (
                    <Check className="h-3 w-3 text-green-500" />
                  )}
                </div>
              </Button>
            ))}
          </div>

          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setStep(2)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Back
            </Button>
          </div>
        </div>
      )}

      {/* Booking Summary */}
      {selectedTurf && selectedDate && selectedTime && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-blue-900">Booking Summary</h4>
                <div className="flex items-center space-x-2 text-sm text-blue-700 mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>3Lok Football Fitness Hub, Whitefield</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {selectedTurf.size} ({selectedTurf.courtNumber}) • {selectedDate} • {selectedTime} • {selectedDuration}h
                </p>
                <p className="text-lg font-bold text-blue-900 mt-2">
                  Total: {formatPrice(selectedTurf.pricePerHour * parseInt(selectedDuration))}
                </p>
              </div>
              <Button 
                onClick={handleConfirmBooking}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Confirm Turf Booking
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}