'use client'

import React, { useState, useEffect } from 'react'
import { useVendor } from '@/hooks/use-vendor'
import { VendorLayout } from '@/components/features/vendor/VendorLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { FormatForm } from '@/components/formats/FormatForm'
import { Switch } from '@/components/ui/switch'

interface Sport {
  id: string
  name: string
  displayName: string
  icon?: string
}

interface Format {
  id: string
  name: string
  displayName: string
  description?: string | null
  playersPerTeam: number
  maxTotalPlayers?: number | null
  isActive: boolean
  usage?: {
    courts: number
    bookings: number
  }
}

export default function FormatsPage() {
  const { vendorId } = useVendor()
  const [sports, setSports] = useState<Sport[]>([])
  const [selectedSportId, setSelectedSportId] = useState<string>('')
  const [formats, setFormats] = useState<Format[]>([])
  const [loading, setLoading] = useState(true)
  const [showFormatForm, setShowFormatForm] = useState(false)
  const [editingFormat, setEditingFormat] = useState<Format | null>(null)

  useEffect(() => {
    loadSports()
  }, [])

  useEffect(() => {
    if (selectedSportId && vendorId) {
      loadFormats(selectedSportId)
    } else {
      setFormats([])
    }
  }, [selectedSportId, vendorId])

  const loadSports = async () => {
    try {
      const response = await fetch('/api/sports')
      if (response.ok) {
        const data = await response.json()
        setSports(data.sports || [])
        if (data.sports && data.sports.length > 0) {
          setSelectedSportId(data.sports[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load sports:', error)
      toast.error('Failed to load sports')
    } finally {
      setLoading(false)
    }
  }

  const loadFormats = async (sportId: string) => {
    if (!vendorId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/vendors/${vendorId}/sports/${sportId}/formats`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const result = await response.json()
        // API returns { success: true, data: { formats: [...] } }
        setFormats(result.data?.formats || [])
      } else {
        throw new Error('Failed to load formats')
      }
    } catch (error) {
      console.error('Failed to load formats:', error)
      toast.error('Failed to load formats')
    } finally {
      setLoading(false)
    }
  }

  const handleFormatSaved = async (format: Format) => {
    // Reload formats from server to ensure we have the latest data
    if (selectedSportId) {
      await loadFormats(selectedSportId)
    }
    setEditingFormat(null)
    setShowFormatForm(false)
  }


  const handleToggleStatus = async (format: Format) => {
    if (!vendorId || !selectedSportId) return

    const newStatus = !format.isActive

    try {
      const response = await fetch(
        `/api/vendors/${vendorId}/sports/${selectedSportId}/formats/${format.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            isActive: newStatus
          })
        }
      )

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.error?.message || result.error || 'Failed to update format status'
        throw new Error(errorMessage)
      }

      if (result.success) {
        toast.success(`Format ${newStatus ? 'activated' : 'deactivated'} successfully`)
        // Reload formats to get updated data
        await loadFormats(selectedSportId)
      }
    } catch (error) {
      console.error('Error toggling format status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update format status')
      // Reload formats to revert UI state
      await loadFormats(selectedSportId)
    }
  }


  const selectedSport = sports.find(s => s.id === selectedSportId)

  return (
    <VendorLayout title="Format Management" subtitle="Manage formats for your courts">
      <div className="p-6 space-y-6">
        {/* Sport Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Sport</CardTitle>
            <CardDescription>Choose a sport to manage its formats</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedSportId} onValueChange={setSelectedSportId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select a sport" />
              </SelectTrigger>
              <SelectContent>
                {sports.map((sport) => (
                  <SelectItem key={sport.id} value={sport.id}>
                    <div className="flex items-center gap-2">
                      {sport.icon && <span>{sport.icon}</span>}
                      <span>{sport.displayName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Formats List */}
        {selectedSportId && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedSport?.icon} {selectedSport?.displayName} Formats
                  </CardTitle>
                  <CardDescription>
                    Manage formats available for your {selectedSport?.displayName.toLowerCase()} courts
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingFormat(null)
                    setShowFormatForm(true)
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Format
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading formats...
                </div>
              ) : formats.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No formats found for this sport.</p>
                  <Button
                    onClick={() => {
                      setEditingFormat(null)
                      setShowFormatForm(true)
                    }}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Format
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Format Name</TableHead>
                      <TableHead>Players</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Usage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formats.map((format) => (
                      <TableRow key={format.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{format.displayName}</div>
                            {format.description && (
                              <div className="text-sm text-muted-foreground">
                                {format.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {format.playersPerTeam} per team ({format.playersPerTeam * 2} total{format.maxTotalPlayers && format.maxTotalPlayers > format.playersPerTeam * 2 ? `, up to ${format.maxTotalPlayers}` : ''})
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={format.isActive}
                              onCheckedChange={() => handleToggleStatus(format)}
                              disabled={loading}
                            />
                            <Badge variant={format.isActive ? 'default' : 'secondary'}>
                              {format.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format.usage ? (
                            <div className="text-sm text-muted-foreground">
                              {format.usage.courts} court{format.usage.courts !== 1 ? 's' : ''}
                              {format.usage.bookings > 0 && (
                                <span className="ml-2">
                                  • {format.usage.bookings} booking{format.usage.bookings !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Format Form Modal */}
        {selectedSportId && vendorId && (
          <FormatForm
            open={showFormatForm}
            onOpenChange={(open) => {
              setShowFormatForm(open)
              if (!open) {
                setEditingFormat(null)
              }
            }}
            vendorId={vendorId}
            sportId={selectedSportId}
            format={editingFormat}
            onSuccess={handleFormatSaved}
          />
        )}

      </div>
    </VendorLayout>
  )
}

