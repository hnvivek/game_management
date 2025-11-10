'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Save,
  Eye,
  DollarSign,
  Users,
  Plus,
  X,
  Edit2
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { FormatForm } from '@/components/formats/FormatForm'

interface Sport {
  id: string
  name: string
  displayName: string
  icon?: string
  isActive: boolean
}

interface Format {
  id: string
  name: string
  displayName: string
  playersPerTeam: number
  maxTotalPlayers?: number | null
  isActive: boolean
}

interface Venue {
  id: string
  name: string
  address?: string
  city?: string
  currencyCode: string
}

interface FormatConfig {
  formatId: string
  maxSlots: number
}

interface Court {
  id: string
  name: string
  description?: string
  courtNumber: string
  surface?: string
  pricePerHour: number
  maxPlayers: number
  isActive: boolean
  features: string[]
  length?: number | null
  width?: number | null
  sport: Sport
  supportedFormats?: Array<{
    format: Format
    maxSlots: number
  }>
  venue: Venue
}

interface CourtFormProps {
  vendorId: string
  venueId: string
  court?: Court | null
  mode: 'create' | 'edit'
  onSave: (court: Court) => void
  onCancel: () => void
  hideHeader?: boolean // Option to hide the header when used in VendorLayout
}

// Common court surfaces
const courtSurfaces = [
  'Hard Court',
  'Clay Court',
  'Grass Court',
  'Artificial Turf',
  'Wood Flooring',
  'Concrete',
  'Asphalt',
  'Synthetic',
  'Sand',
  'Indoor Court',
  'Outdoor Court'
]

// Court-specific features (not venue-level amenities)
const commonFeatures = [
  'Floodlights',
  'Spectator Seating',
  'Equipment Rental',
  'Coaching Available',
  'Video Recording',
  'Air Conditioning',
  'Heating',
  'Wheelchair Accessible',
  'Water Fountain',
  'First Aid Kit',
  'Electronic Scoreboard',
  'Sound System',
  'Court-Side Seating',
  'Wind Protection',
  'Court Covering/Roof',
  'Premium Flooring',
  'Adjustable Hoops/Net',
  'Court Lighting Control',
  'Practice Equipment',
  'Rebound Walls'
]

export default function CourtForm({ vendorId, venueId, court, mode, onSave, onCancel, hideHeader = false }: CourtFormProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sports, setSports] = useState<Sport[]>([])
  const [formats, setFormats] = useState<Format[]>([])
  const [venue, setVenue] = useState<Venue | null>(null)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showFormatForm, setShowFormatForm] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    surface: '',
    pricePerHour: 0,
    maxPlayers: 10,
    isActive: true,
    sportId: '',
    formatConfigs: [] as FormatConfig[], // Array of { formatId, maxSlots }
  })

  const [generatedCourtNumber, setGeneratedCourtNumber] = useState<string>('')

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (court && mode === 'edit') {
      setFormData({
        name: court.name || '',
        description: court.description || '',
        surface: court.surface || '',
        pricePerHour: court.pricePerHour || 0,
        maxPlayers: court.maxPlayers || 10,
        isActive: court.isActive || true,
        sportId: court.sport?.id || '',
        formatConfigs: court.supportedFormats?.map(sf => ({
          formatId: sf.format.id,
          maxSlots: sf.maxSlots
        })) || [],
      })
      setSelectedFeatures(court.features || [])
      setVenue(court.venue)
      setGeneratedCourtNumber(court.courtNumber || '')
    }
  }, [court, mode])

  const loadInitialData = async () => {
    try {
      setLoading(true)

      // Load sports
      const sportsResponse = await fetch('/api/sports')
      if (sportsResponse.ok) {
        const sportsData = await sportsResponse.json()
        setSports(sportsData.sports || [])
      }

      // Load venue details
      const venueResponse = await fetch(`/api/vendors/${vendorId}/venues/${venueId}`)
      if (venueResponse.ok) {
        const venueData = await venueResponse.json()
        setVenue(venueData.data)
      }
    } catch (error) {
      console.error('Failed to load initial data:', error)
      toast.error('Failed to load initial data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (formData.sportId && vendorId) {
      loadFormats(formData.sportId, vendorId)
    } else {
      setFormats([])
    }
  }, [formData.sportId, vendorId])

  const loadFormats = async (sportId: string, vendorId: string) => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/sports/${sportId}/formats`, {
        credentials: 'include'
      })
      if (response.ok) {
        const result = await response.json()
        // API returns { success: true, data: { formats: [...] } }
        const formatsList = result.data?.formats || []
        // Filter to only show active formats for court selection
        const activeFormats = formatsList.filter((f: Format) => f.isActive)
        setFormats(activeFormats)
        
        // Prefill common formats when sport is selected (create mode only)
        if (mode === 'create' && activeFormats.length > 0) {
          const commonFormats = getCommonFormatsForSport(sportId, activeFormats)
          if (commonFormats.length > 0 && formData.formatConfigs.length === 0) {
            setFormData(prev => ({
              ...prev,
              formatConfigs: commonFormats.map(f => ({
                formatId: f.id,
                maxSlots: getDefaultMaxSlots(f.name)
              }))
            }))
          }
        }
      } else {
        const errorData = await response.json()
        console.error('Failed to load formats:', errorData)
        toast.error(errorData.error?.message || 'Failed to load formats')
      }
    } catch (error) {
      console.error('Failed to load formats:', error)
      toast.error('Failed to load formats')
    }
  }

  // Get common formats for a sport (for prefilling)
  const getCommonFormatsForSport = (sportId: string, allFormats: Format[]): Format[] => {
    // Return first 3 formats as common defaults
    return allFormats.slice(0, 3)
  }

  // Get default max slots based on format name
  const getDefaultMaxSlots = (formatName: string): number => {
    const defaults: Record<string, number> = {
      '11-a-side': 1,
      '7-a-side': 2,
      '5-a-side': 4,
      '5v5': 1,
      '3x3': 2,
      'singles': 1,
      'doubles': 1,
    }
    return defaults[formatName] || 1
  }

  const toggleFormat = (formatId: string) => {
    setFormData(prev => {
      const existing = prev.formatConfigs.find(fc => fc.formatId === formatId)
      if (existing) {
        // Remove format
        return {
          ...prev,
          formatConfigs: prev.formatConfigs.filter(fc => fc.formatId !== formatId)
        }
      } else {
        // Add format with default max slots
        const format = formats.find(f => f.id === formatId)
        return {
          ...prev,
          formatConfigs: [
            ...prev.formatConfigs,
            {
              formatId,
              maxSlots: format ? getDefaultMaxSlots(format.name) : 1
            }
          ]
        }
      }
    })
  }

  const updateFormatMaxSlots = (formatId: string, maxSlots: number) => {
    setFormData(prev => ({
      ...prev,
      formatConfigs: prev.formatConfigs.map(fc =>
        fc.formatId === formatId ? { ...fc, maxSlots } : fc
      )
    }))
  }

  const handleFormatCreated = (newFormat: Format) => {
    // Add the new format to the list
    setFormats(prev => [...prev, newFormat])
    
    // Automatically select it with default max slots
    setFormData(prev => ({
      ...prev,
      formatConfigs: [
        ...prev.formatConfigs,
        {
          formatId: newFormat.id,
          maxSlots: getDefaultMaxSlots(newFormat.name)
        }
      ]
    }))
    
    toast.success('Format created and selected')
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const addFeature = () => {
    if (newFeature.trim() && !selectedFeatures.includes(newFeature.trim())) {
      setSelectedFeatures(prev => [...prev, newFeature.trim()])
      setNewFeature('')
    }
  }

  const removeFeature = (feature: string) => {
    setSelectedFeatures(prev => prev.filter(f => f !== feature))
  }

  const toggleCommonFeature = (feature: string) => {
    setSelectedFeatures(prev => {
      if (prev.includes(feature)) {
        return prev.filter(f => f !== feature)
      } else {
        return [...prev, feature]
      }
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Court name is required'
    }

    if (!formData.sportId) {
      newErrors.sportId = 'Sport is required'
    }

    if (formData.formatConfigs.length === 0) {
      newErrors.formatConfigs = 'At least one format must be selected'
    }

    if (formData.formatConfigs.length > 5) {
      newErrors.formatConfigs = 'Maximum 5 formats allowed per court'
    }

    if (!formData.pricePerHour || formData.pricePerHour <= 0) {
      newErrors.pricePerHour = 'Valid price per hour is required'
    }

    if (!formData.maxPlayers || formData.maxPlayers <= 0) {
      newErrors.maxPlayers = 'Valid max players is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setSaving(true)

    try {
      const submitData = {
        ...formData,
        formatConfigs: formData.formatConfigs, // Send format configs array
        features: selectedFeatures,
        venueId
      }

      let response;
      if (mode === 'create') {
        response = await fetch('/api/courts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
          credentials: 'include'
        })
      } else {
        response = await fetch(`/api/courts/${court!.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
          credentials: 'include'
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${mode === 'create' ? 'create' : 'update'} court`)
      }

      const result = await response.json()
      if (result.success) {
        toast.success(`Court ${mode === 'create' ? 'created' : 'updated'} successfully!`)
        onSave(result.data)
      } else {
        throw new Error(result.error?.message || `Failed to ${mode === 'create' ? 'create' : 'update'} court`)
      }
    } catch (error: any) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} court:`, error)
      toast.error(error.message || `Failed to ${mode === 'create' ? 'create' : 'update'} court`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={cn("space-y-6", !hideHeader && "container mx-auto py-8")}>
        {!hideHeader && (
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        )}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", !hideHeader && "container mx-auto py-8")}>
      {/* Header - only show if not hidden */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {venue?.name || 'Venue'}
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {mode === 'create' ? 'Create New Court' : 'Edit Court'}
              </h1>
              <p className="text-muted-foreground">
                {venue?.name} • {venue?.city || 'No location specified'}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Essential details about this court</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Court Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter court name"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                  </div>
                                  </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the court, facilities, and special features..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="sport">Sport *</Label>
                  <Select
                    value={formData.sportId}
                    onValueChange={(value) => {
                      handleInputChange('sportId', value)
                      // Clear formats when sport changes
                      setFormData(prev => ({ ...prev, formatConfigs: [] }))
                    }}
                  >
                    <SelectTrigger className={errors.sportId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {sports.map((sport) => (
                        <SelectItem key={sport.id} value={sport.id}>
                          <div className="flex items-center gap-2">
                            <span>{sport.icon || '🏃'}</span>
                            {sport.displayName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.sportId && <p className="text-sm text-red-500 mt-1">{errors.sportId}</p>}
                </div>

                {/* Multi-Format Selection */}
                {formData.sportId && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Supported Formats *</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Select all formats this court can accommodate. Set max slots for each format.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFormatForm(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create Format
                      </Button>
                    </div>

                    {formats.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-4">
                        No formats available for this sport. Please create formats first.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {formats.map((format) => {
                          const isSelected = formData.formatConfigs.some(fc => fc.formatId === format.id)
                          const config = formData.formatConfigs.find(fc => fc.formatId === format.id)

                          return (
                            <div
                              key={format.id}
                              className={cn(
                                "flex items-start gap-3 p-3 border rounded-lg transition-colors",
                                isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                              )}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleFormat(format.id)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="font-medium">{format.displayName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format.playersPerTeam} players per team ({format.playersPerTeam * 2} total{format.maxTotalPlayers && format.maxTotalPlayers > format.playersPerTeam * 2 ? `, up to ${format.maxTotalPlayers} with substitutes` : ''})
                                </div>
                                {isSelected && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <Label htmlFor={`maxSlots-${format.id}`} className="text-xs">
                                      Max Slots:
                                    </Label>
                                    <Input
                                      id={`maxSlots-${format.id}`}
                                      type="number"
                                      min="1"
                                      max="10"
                                      value={config?.maxSlots || 1}
                                      onChange={(e) => updateFormatMaxSlots(format.id, parseInt(e.target.value) || 1)}
                                      className="w-20 h-8 text-sm"
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      {config?.maxSlots === 1 ? 'slot' : 'slots'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <Badge variant="secondary" className="ml-auto">Selected</Badge>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {formData.formatConfigs.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="text-sm text-muted-foreground">Selected:</span>
                        {formData.formatConfigs.map(config => {
                          const format = formats.find(f => f.id === config.formatId)
                          return format ? (
                            <Badge key={config.formatId} variant="default">
                              {format.displayName} ({config.maxSlots} {config.maxSlots === 1 ? 'slot' : 'slots'})
                            </Badge>
                          ) : null
                        })}
                      </div>
                    )}

                    {errors.formatConfigs && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Format Selection Required</AlertTitle>
                        <AlertDescription>{errors.formatConfigs}</AlertDescription>
                      </Alert>
                    )}

                    {/* Format Creation Modal */}
                    {formData.sportId && (
                      <FormatForm
                        open={showFormatForm}
                        onOpenChange={setShowFormatForm}
                        vendorId={vendorId}
                        sportId={formData.sportId}
                        format={null}
                        onSuccess={handleFormatCreated}
                      />
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="surface">Surface Type</Label>
                  <Select
                    value={formData.surface}
                    onValueChange={(value) => handleInputChange('surface', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select surface type" />
                    </SelectTrigger>
                    <SelectContent>
                      {courtSurfaces.map((surface) => (
                        <SelectItem key={surface} value={surface}>
                          {surface}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Court Features</CardTitle>
                <CardDescription>Available amenities and facilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Custom Feature Input */}
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add custom feature..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" onClick={addFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Selected Features */}
                {selectedFeatures.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Features</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedFeatures.map((feature) => (
                        <Badge key={feature} variant="secondary" className="flex items-center gap-1">
                          {feature}
                          <button
                            type="button"
                            onClick={() => removeFeature(feature)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Common Features */}
                <div className="space-y-2">
                  <Label>Common Features (Quick Add)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {commonFeatures.map((feature) => (
                      <Button
                        key={feature}
                        type="button"
                        variant={selectedFeatures.includes(feature) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCommonFeature(feature)}
                        className="text-xs h-8"
                      >
                        {feature}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing & Capacity */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Capacity</CardTitle>
                <CardDescription>Set pricing and player limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pricePerHour">Price per Hour *</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                      {venue?.currencyCode || '$'}
                    </span>
                    <Input
                      id="pricePerHour"
                      type="number"
                      value={formData.pricePerHour}
                      onChange={(e) => handleInputChange('pricePerHour', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="pl-12 pr-3"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {errors.pricePerHour && <p className="text-sm text-red-500 mt-1">{errors.pricePerHour}</p>}
                </div>

                <div>
                  <Label htmlFor="maxPlayers">Maximum Players *</Label>
                  <Input
                    id="maxPlayers"
                    type="number"
                    value={formData.maxPlayers}
                    onChange={(e) => handleInputChange('maxPlayers', parseInt(e.target.value) || 0)}
                    placeholder="10"
                    min="1"
                    className={errors.maxPlayers ? 'border-red-500' : ''}
                  />
                  {errors.maxPlayers && <p className="text-sm text-red-500 mt-1">{errors.maxPlayers}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>Control court visibility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Active Court</Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.isActive ? 'Court is visible and bookable' : 'Court is hidden from customers'}
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={saving}
                  >
                    {saving ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {mode === 'create' ? 'Create Court' : 'Save Changes'}
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={onCancel}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}