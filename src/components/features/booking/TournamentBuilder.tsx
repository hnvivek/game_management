'use client'

import { useState, useEffect } from 'react'
import { Trophy, Users, Calendar, MapPin, DollarSign, Settings, Plus, Trash2, AlertCircle, Check, ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

// Inline error message component
const InlineError = ({ message }: { message: string }) => {
  if (!message) return null
  return (
    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  )
}

// Types based on our API schema
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

interface Venue {
  id: string
  name: string
  address: string
  city: string
  area: string | null
  vendor: {
    id: string
    name: string
    slug: string
    primaryColor: string
  }
}

interface TournamentSettings {
  name: string
  description: string
  sportId: string
  venueId: string
  preferredFormatId: string
  actualFormatId: string
  maxTeams: number
  maxPlayersPerTeam: number
  entryFee: number
  prizePool: number
  startDate: string
  endDate: string
  registrationDeadline: string
  status: 'DRAFT' | 'REGISTRATION' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  rules: string
  isAutoSchedule: boolean
  isPublic: boolean
}

interface TournamentBuilderProps {
  onTournamentCreate: (tournament: any) => void
  initialSettings?: Partial<TournamentSettings>
}

export default function TournamentBuilder({ onTournamentCreate, initialSettings }: TournamentBuilderProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [sports, setSports] = useState<Sport[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [formats, setFormats] = useState<Format[]>([])

  const [settings, setSettings] = useState<TournamentSettings>({
    name: '',
    description: '',
    sportId: '',
    venueId: '',
    preferredFormatId: '',
    actualFormatId: '',
    maxTeams: 8,
    maxPlayersPerTeam: 5,
    entryFee: 0,
    prizePool: 0,
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    status: 'DRAFT',
    rules: '',
    isAutoSchedule: false,
    isPublic: true,
    ...initialSettings
  })

  const totalSteps = 4

  // Fetch initial data
  useEffect(() => {
    fetchSports()
    if (settings.sportId) {
      fetchFormats(settings.sportId)
    }
  }, [])

  useEffect(() => {
    if (settings.sportId) {
      fetchFormats(settings.sportId)
      fetchVenues()
    }
  }, [settings.sportId])

  const fetchSports = async () => {
    try {
      const response = await fetch('/api/sports')
      if (response.ok) {
        const data = await response.json()
        setSports(data.sports || [])
      }
    } catch (error) {
      console.error('Error fetching sports:', error)
    }
  }

  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/venues')
      if (response.ok) {
        const data = await response.json()
        setVenues(data.venues || [])
      }
    } catch (error) {
      console.error('Error fetching venues:', error)
    }
  }

  const fetchFormats = async (sportId: string) => {
    try {
      const response = await fetch(`/api/sports/${sportId}/formats`)
      if (response.ok) {
        const data = await response.json()
        setFormats(data.formats || [])
      }
    } catch (error) {
      console.error('Error fetching formats:', error)
    }
  }

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'name':
        if (!value || value.trim() === '') return 'Tournament name is required'
        if (value.trim().length < 3) return 'Tournament name must be at least 3 characters'
        if (value.trim().length > 200) return 'Tournament name must be less than 200 characters'
        return ''
      case 'sportId':
        if (!value) return 'Please select a sport'
        return ''
      case 'venueId':
        if (!value) return 'Please select a venue'
        return ''
      case 'startDate':
        if (!value) return 'Start date is required'
        if (new Date(value) <= new Date()) return 'Start date must be in the future'
        return ''
      case 'endDate':
        if (!value) return 'End date is required'
        if (settings.startDate && new Date(value) <= new Date(settings.startDate)) {
          return 'End date must be after start date'
        }
        return ''
      case 'preferredFormatId':
        if (!value) return 'Please select a tournament format'
        return ''
      case 'maxTeams':
        if (!value || value <= 0) return 'Maximum teams must be at least 2'
        if (value > 64) return 'Maximum teams cannot exceed 64'
        return ''
      default:
        return ''
    }
  }

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {}

    switch (step) {
      case 1:
        errors.name = validateField('name', settings.name)
        errors.sportId = validateField('sportId', settings.sportId)
        errors.venueId = validateField('venueId', settings.venueId)
        break
      case 2:
        errors.startDate = validateField('startDate', settings.startDate)
        errors.endDate = validateField('endDate', settings.endDate)
        // Registration deadline is optional
        break
      case 3:
        errors.preferredFormatId = validateField('preferredFormatId', settings.preferredFormatId)
        errors.maxTeams = validateField('maxTeams', settings.maxTeams)
        break
      case 4:
        return true // Review step - always valid
    }

    const hasErrors = Object.values(errors).some(error => error !== '')
    setFieldErrors(errors)
    return !hasErrors
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
        setError('')
      }
    } else {
      // Global error message is no longer needed - inline errors will show
      setError('')
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError('')
      setFieldErrors({}) // Clear all field errors when going back
    }
  }

  const handleCreateTournament = async () => {
    if (!validateStep(currentStep)) {
      // Field errors will be shown inline, no need for global error
      return
    }

    try {
      setLoading(true)
      setError('')

      const tournamentData = {
        ...settings,
        startDate: new Date(settings.startDate).toISOString(),
        endDate: new Date(settings.endDate).toISOString(),
        registrationDeadline: settings.registrationDeadline ? new Date(settings.registrationDeadline).toISOString() : null,
        entryFee: settings.entryFee * 100, // Convert to cents
        prizePool: settings.prizePool * 100, // Convert to cents
        createdBy: 'demo-user-id' // In real app, this comes from auth
      }

      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tournamentData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create tournament')
      }

      const tournament = await response.json()
      setSuccess('Tournament created successfully!')

      setTimeout(() => {
        onTournamentCreate(tournament)
      }, 2000)

    } catch (error) {
      console.error('Tournament creation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create tournament')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {[...Array(totalSteps)].map((_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep > i + 1
                ? 'bg-success text-primary-foreground'
                : currentStep === i + 1
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground'
            }`}
          >
            {currentStep > i + 1 ? <Check className="h-5 w-5" /> : i + 1}
          </div>
          <div className="ml-2">
            <div className={`text-sm font-medium ${
              currentStep === i + 1 ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {i === 0 && 'Basic Info'}
              {i === 1 && 'Schedule'}
              {i === 2 && 'Format & Rules'}
              {i === 3 && 'Review'}
            </div>
          </div>
          {i < totalSteps - 1 && (
            <div className={`flex-1 h-1 mx-4 ${
              currentStep > i + 1 ? 'bg-success' : 'bg-muted/50'
            }`} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Details</CardTitle>
                <CardDescription>Basic information about your tournament</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tournament Name *</Label>
                  <Input
                    id="name"
                    placeholder="Summer Soccer Championship 2025"
                    value={settings.name}
                    onChange={(e) => {
                      setSettings(prev => ({ ...prev, name: e.target.value }))
                      // Clear field error when user starts typing
                      if (fieldErrors.name) {
                        setFieldErrors(prev => ({ ...prev, name: '' }))
                      }
                    }}
                    className={fieldErrors.name ? 'border-destructive focus:border-destructive' : ''}
                  />
                  <InlineError message={fieldErrors.name} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your tournament, target audience, and what makes it special..."
                    value={settings.description}
                    onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sport *</Label>
                    <Select
                      value={settings.sportId}
                      onValueChange={(value) => {
                        setSettings(prev => ({ ...prev, sportId: value }))
                        // Clear field error when user selects a sport
                        if (fieldErrors.sportId) {
                          setFieldErrors(prev => ({ ...prev, sportId: '' }))
                        }
                      }}
                    >
                      <SelectTrigger className={fieldErrors.sportId ? 'border-destructive focus:border-destructive' : ''}>
                        <SelectValue placeholder="Select sport" />
                      </SelectTrigger>
                      <SelectContent>
                        {sports.map((sport) => (
                          <SelectItem key={sport.id} value={sport.id}>
                            <div className="flex items-center gap-2">
                              <span>{sport.icon}</span>
                              {sport.displayName}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InlineError message={fieldErrors.sportId} />
                  </div>

                  <div className="space-y-2">
                    <Label>Venue *</Label>
                    <Select
                      value={settings.venueId}
                      onValueChange={(value) => {
                        setSettings(prev => ({ ...prev, venueId: value }))
                        // Clear field error when user selects a venue
                        if (fieldErrors.venueId) {
                          setFieldErrors(prev => ({ ...prev, venueId: '' }))
                        }
                      }}
                    >
                      <SelectTrigger className={fieldErrors.venueId ? 'border-destructive focus:border-destructive' : ''}>
                        <SelectValue placeholder="Select venue" />
                      </SelectTrigger>
                      <SelectContent>
                        {venues.map((venue) => (
                          <SelectItem key={venue.id} value={venue.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{venue.name}</span>
                              <span className="text-xs text-muted-foreground">{venue.city}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InlineError message={fieldErrors.venueId} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxTeams">Maximum Teams</Label>
                    <Input
                      id="maxTeams"
                      type="number"
                      min="2"
                      max="64"
                      value={settings.maxTeams}
                      onChange={(e) => {
                        setSettings(prev => ({ ...prev, maxTeams: parseInt(e.target.value) || 0 }))
                        // Clear field error when user changes the value
                        if (fieldErrors.maxTeams) {
                          setFieldErrors(prev => ({ ...prev, maxTeams: '' }))
                        }
                      }}
                      className={fieldErrors.maxTeams ? 'border-destructive focus:border-destructive' : ''}
                    />
                    <InlineError message={fieldErrors.maxTeams} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxPlayersPerTeam">Players per Team</Label>
                    <Input
                      id="maxPlayersPerTeam"
                      type="number"
                      min="1"
                      max="20"
                      value={settings.maxPlayersPerTeam}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxPlayersPerTeam: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublic"
                    checked={settings.isPublic}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, isPublic: checked }))}
                  />
                  <Label htmlFor="isPublic">Make tournament publicly visible</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Schedule</CardTitle>
                <CardDescription>Set the dates for your tournament</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={settings.startDate}
                      onChange={(e) => {
                        setSettings(prev => ({ ...prev, startDate: e.target.value }))
                        // Clear field error when user selects a date
                        if (fieldErrors.startDate) {
                          setFieldErrors(prev => ({ ...prev, startDate: '' }))
                        }
                      }}
                      min={new Date().toISOString().slice(0, 16)}
                      className={fieldErrors.startDate ? 'border-destructive focus:border-destructive' : ''}
                    />
                    <InlineError message={fieldErrors.startDate} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={settings.endDate}
                      onChange={(e) => {
                        setSettings(prev => ({ ...prev, endDate: e.target.value }))
                        // Clear field error when user selects a date
                        if (fieldErrors.endDate) {
                          setFieldErrors(prev => ({ ...prev, endDate: '' }))
                        }
                      }}
                      min={settings.startDate || new Date().toISOString().slice(0, 16)}
                      className={fieldErrors.endDate ? 'border-destructive focus:border-destructive' : ''}
                    />
                    <InlineError message={fieldErrors.endDate} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                  <Input
                    id="registrationDeadline"
                    type="datetime-local"
                    value={settings.registrationDeadline}
                    onChange={(e) => setSettings(prev => ({ ...prev, registrationDeadline: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                    max={settings.startDate || undefined}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty if registration doesn't have a deadline
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entryFee">Entry Fee per Team</Label>
                    <Input
                      id="entryFee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={settings.entryFee}
                      onChange={(e) => setSettings(prev => ({ ...prev, entryFee: parseFloat(e.target.value) || 0 }))}
                    />
                    <p className="text-xs text-muted-foreground">Amount in INR</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prizePool">Prize Pool (Optional)</Label>
                    <Input
                      id="prizePool"
                      type="number"
                      min="0"
                      step="0.01"
                      value={settings.prizePool}
                      onChange={(e) => setSettings(prev => ({ ...prev, prizePool: parseFloat(e.target.value) || 0 }))}
                    />
                    <p className="text-xs text-muted-foreground">Total prize amount in INR</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {settings.entryFee > 0 && (
              <Card className="bg-success/10 border-success/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-green-900">Revenue Estimate</h4>
                      <p className="text-sm text-success">
                        If all {settings.maxTeams} teams register:
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-success">
                        {formatPrice(settings.entryFee * settings.maxTeams)}
                      </div>
                      <p className="text-xs text-success">Total Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Format</CardTitle>
                <CardDescription>Choose the format and rules for your tournament</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preferred Format *</Label>
                    <Select
                      value={settings.preferredFormatId}
                      onValueChange={(value) => {
                        setSettings(prev => ({ ...prev, preferredFormatId: value }))
                        // Clear field error when user selects a format
                        if (fieldErrors.preferredFormatId) {
                          setFieldErrors(prev => ({ ...prev, preferredFormatId: '' }))
                        }
                      }}
                    >
                      <SelectTrigger className={fieldErrors.preferredFormatId ? 'border-destructive focus:border-destructive' : ''}>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        {formats.map((format) => (
                          <SelectItem key={format.id} value={format.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{format.displayName}</span>
                              <span className="text-xs text-muted-foreground">
                                {format.playersPerTeam} per team ({format.playersPerTeam * 2} total{format.maxTotalPlayers && format.maxTotalPlayers > format.playersPerTeam * 2 ? `, up to ${format.maxTotalPlayers}` : ''})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <InlineError message={fieldErrors.preferredFormatId} />
                  </div>

                  <div className="space-y-2">
                    <Label>Actual Format (if different)</Label>
                    <Select value={settings.actualFormatId} onValueChange={(value) => setSettings(prev => ({ ...prev, actualFormatId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Same as preferred" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Same as preferred</SelectItem>
                        {formats.map((format) => (
                          <SelectItem key={format.id} value={format.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{format.displayName}</span>
                              <span className="text-xs text-muted-foreground">
                                {format.playersPerTeam} per team ({format.playersPerTeam * 2} total{format.maxTotalPlayers && format.maxTotalPlayers > format.playersPerTeam * 2 ? `, up to ${format.maxTotalPlayers}` : ''})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rules">Tournament Rules</Label>
                  <Textarea
                    id="rules"
                    placeholder="Describe the rules, format, and any special conditions for your tournament..."
                    value={settings.rules}
                    onChange={(e) => setSettings(prev => ({ ...prev, rules: e.target.value }))}
                    rows={6}
                  />
                </div>

                <div className="flex items-center space-x-2 p-4 bg-primary/10 rounded-lg">
                  <Settings className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isAutoSchedule"
                        checked={settings.isAutoSchedule}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, isAutoSchedule: checked }))}
                      />
                      <Label htmlFor="isAutoSchedule" className="font-medium">
                        Enable Automatic Scheduling
                      </Label>
                    </div>
                    <p className="text-sm text-primary mt-1">
                      Automatically generate match schedules and court assignments based on team registrations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Tournament</CardTitle>
                <CardDescription>Review all details before creating the tournament</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Tournament Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{settings.name || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sport:</span>
                      <p className="font-medium">
                        {sports.find(s => s.id === settings.sportId)?.displayName || 'Not selected'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Venue:</span>
                      <p className="font-medium">
                        {venues.find(v => v.id === settings.venueId)?.name || 'Not selected'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Teams:</span>
                      <p className="font-medium">{settings.maxTeams} teams</p>
                    </div>
                  </div>
                  {settings.description && (
                    <div className="mt-3">
                      <span className="text-muted-foreground">Description:</span>
                      <p className="text-sm mt-1">{settings.description}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Schedule */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Start Date:</span>
                      <p className="font-medium">
                        {settings.startDate ? new Date(settings.startDate).toLocaleString() : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">End Date:</span>
                      <p className="font-medium">
                        {settings.endDate ? new Date(settings.endDate).toLocaleString() : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Registration Deadline:</span>
                      <p className="font-medium">
                        {settings.registrationDeadline
                          ? new Date(settings.registrationDeadline).toLocaleString()
                          : 'No deadline'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline">{settings.status}</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Financial */}
                {(settings.entryFee > 0 || settings.prizePool > 0) && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Financial Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {settings.entryFee > 0 && (
                        <div>
                          <span className="text-muted-foreground">Entry Fee per Team:</span>
                          <p className="font-medium">{formatPrice(settings.entryFee)}</p>
                        </div>
                      )}
                      {settings.prizePool > 0 && (
                        <div>
                          <span className="text-muted-foreground">Prize Pool:</span>
                          <p className="font-medium">{formatPrice(settings.prizePool)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Features */}
                <div>
                  <h4 className="font-semibold mb-3">Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {settings.isPublic && <Badge>Public Tournament</Badge>}
                    {settings.isAutoSchedule && <Badge>Auto Scheduling</Badge>}
                    {settings.entryFee > 0 && <Badge>Paid Entry</Badge>}
                    {settings.prizePool > 0 && <Badge>Prize Pool</Badge>}
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    By creating this tournament, you agree to our terms of service and tournament guidelines.
                    You'll be responsible for managing the tournament and ensuring fair play.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {renderStepIndicator()}

      {error && (
        <Alert className="mb-6 border-destructive/20 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive-foreground">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-success/20 bg-success/10">
          <Check className="h-4 w-4 text-success" />
          <AlertDescription className="text-success-foreground">{success}</AlertDescription>
        </Alert>
      )}

      {renderStepContent()}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep < totalSteps ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleCreateTournament} disabled={loading || success !== ''}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                Creating Tournament...
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4 mr-2" />
                Create Tournament
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}