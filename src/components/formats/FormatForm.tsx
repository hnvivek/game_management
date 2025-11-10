'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Format {
  id: string
  name: string
  displayName: string
  description?: string | null
  playersPerTeam: number
  maxTotalPlayers?: number | null
  length?: number | null
  width?: number | null
  isActive: boolean
}

interface FormatFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorId: string
  sportId: string
  format?: Format | null
  onSuccess: (format: Format) => void
}

export function FormatForm({
  open,
  onOpenChange,
  vendorId,
  sportId,
  format,
  onSuccess
}: FormatFormProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    name: format?.name || '',
    displayName: format?.displayName || '',
    description: format?.description || '',
    playersPerTeam: format?.playersPerTeam || 5,
    maxTotalPlayers: format?.maxTotalPlayers || null,
    length: format?.length || null,
    width: format?.width || null,
    isActive: format?.isActive ?? true
  })

  React.useEffect(() => {
    if (format) {
      setFormData({
        name: format.name,
        displayName: format.displayName,
        description: format.description || '',
        playersPerTeam: format.playersPerTeam,
        maxTotalPlayers: format.maxTotalPlayers || null,
        length: format.length || null,
        width: format.width || null,
        isActive: format.isActive
      })
    } else {
      setFormData({
        name: '',
        displayName: '',
        description: '',
        playersPerTeam: 5,
        maxTotalPlayers: null,
        length: null,
        width: null,
        isActive: true
      })
    }
    setErrors({})
  }, [format, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Format name is required'
    } else if (formData.name.length > 50) {
      newErrors.name = 'Format name must be 50 characters or less'
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required'
    } else if (formData.displayName.length > 100) {
      newErrors.displayName = 'Display name must be 100 characters or less'
    }

    if (formData.playersPerTeam < 1) {
      newErrors.playersPerTeam = 'Players per team must be at least 1'
    }

    if (formData.maxTotalPlayers !== null && formData.maxTotalPlayers !== undefined) {
      if (formData.maxTotalPlayers < formData.playersPerTeam * 2) {
        newErrors.maxTotalPlayers = 'Max total players must be at least twice the players per team'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const url = format
        ? `/api/vendors/${vendorId}/sports/${sportId}/formats/${format.id}`
        : `/api/vendors/${vendorId}/sports/${sportId}/formats`

      const method = format ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          displayName: formData.displayName.trim(),
          description: formData.description.trim() || null,
          playersPerTeam: formData.playersPerTeam,
          maxTotalPlayers: formData.maxTotalPlayers ?? formData.playersPerTeam * 2,
          length: formData.length || null,
          width: formData.width || null,
          isActive: formData.isActive
        })
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.error?.message || result.error || `Failed to ${format ? 'update' : 'create'} format`
        throw new Error(errorMessage)
      }

      if (result.success) {
        toast.success(result.message || `Format ${format ? 'updated' : 'created'} successfully`)
        onSuccess(result.data.format)
        onOpenChange(false)
      } else {
        const errorMessage = result.error?.message || result.error || 'Operation failed'
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error(`Error ${format ? 'updating' : 'creating'} format:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to ${format ? 'update' : 'create'} format`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{format ? 'Edit Format' : 'Create New Format'}</DialogTitle>
          <DialogDescription>
            {format
              ? 'Update the format details. Changes will affect all courts using this format.'
              : 'Add a new format to your format library. It will be available for all your courts.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Format Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., 8-a-side"
              maxLength={50}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Internal identifier (lowercase, no spaces recommended)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="e.g., 8-a-side"
              maxLength={100}
              className={errors.displayName ? 'border-red-500' : ''}
            />
            {errors.displayName && (
              <p className="text-sm text-red-500">{errors.displayName}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Name shown to users
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="playersPerTeam">Players Per Team *</Label>
              <Input
                id="playersPerTeam"
                type="number"
                min="1"
                value={formData.playersPerTeam}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  setFormData({ 
                    ...formData, 
                    playersPerTeam: value,
                    maxTotalPlayers: formData.maxTotalPlayers || value * 2
                  })
                }}
                className={errors.playersPerTeam ? 'border-red-500' : ''}
              />
              {errors.playersPerTeam && (
                <p className="text-sm text-red-500">{errors.playersPerTeam}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Number of players per team (e.g., 5 for 5-a-side)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTotalPlayers">Max Total Players</Label>
              <Input
                id="maxTotalPlayers"
                type="number"
                min={formData.playersPerTeam * 2}
                value={formData.maxTotalPlayers || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  maxTotalPlayers: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder={`${formData.playersPerTeam * 2} (default)`}
                className={errors.maxTotalPlayers ? 'border-red-500' : ''}
              />
              {errors.maxTotalPlayers && (
                <p className="text-sm text-red-500">{errors.maxTotalPlayers}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Maximum total players including substitutes (defaults to {formData.playersPerTeam * 2})
              </p>
            </div>
          </div>

          {formData.playersPerTeam && (
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
              <strong>Format:</strong> {formData.playersPerTeam}-a-side ({formData.playersPerTeam * 2} total players)
              {formData.maxTotalPlayers && formData.maxTotalPlayers > formData.playersPerTeam * 2 && (
                <span className="ml-2">• Up to {formData.maxTotalPlayers} with substitutes</span>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this format..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length">Length (meters)</Label>
              <Input
                id="length"
                type="number"
                min="0"
                step="0.1"
                value={formData.length || ''}
                onChange={(e) => setFormData({ ...formData, length: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="e.g., 100"
              />
              <p className="text-xs text-muted-foreground">
                Required length for this format
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="width">Width (meters)</Label>
              <Input
                id="width"
                type="number"
                min="0"
                step="0.1"
                value={formData.width || ''}
                onChange={(e) => setFormData({ ...formData, width: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="e.g., 60"
              />
              <p className="text-xs text-muted-foreground">
                Required width for this format
              </p>
            </div>
          </div>

          {formData.length && formData.width && (
            <div className="text-sm text-muted-foreground">
              Area: {(formData.length * formData.width).toFixed(1)} m²
            </div>
          )}

          {format && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Editing this format will affect all courts currently using it.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : format ? 'Update Format' : 'Create Format'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

