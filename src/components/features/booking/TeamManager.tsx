'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Search, Filter, Trophy, Star, MapPin, Calendar, Settings, UserPlus, Crown, Shield, Sword } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

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

interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

interface TeamMember {
  id: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  joinedAt: string
  user: User
}

interface Team {
  id: string
  name: string
  description?: string
  logoUrl?: string
  city?: string
  area?: string
  level?: string
  maxPlayers: number
  isActive: boolean
  sport: Sport
  format: Format
  members: TeamMember[]
  _count: {
    members: number
    homeMatches: number
    awayMatches: number
    teamInvites: number
  }
}

interface TeamFormData {
  name: string
  description: string
  logoUrl: string
  sportId: string
  formatId: string
  city: string
  area: string
  level: string
  maxPlayers: number
  isActive: boolean
}

interface TeamManagerProps {
  onTeamSelect?: (team: Team) => void
  onCreateTeam?: (team: Team) => void
  showCreateButton?: boolean
  maxTeams?: number
}

export default function TeamManager({
  onTeamSelect,
  onCreateTeam,
  showCreateButton = true,
  maxTeams
}: TeamManagerProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [formats, setFormats] = useState<Format[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSport, setSelectedSport] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // Create team dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [teamForm, setTeamForm] = useState<TeamFormData>({
    name: '',
    description: '',
    logoUrl: '',
    sportId: '',
    formatId: '',
    city: '',
    area: '',
    level: '',
    maxPlayers: 10,
    isActive: true
  })

  useEffect(() => {
    fetchTeams()
    fetchSports()
  }, [])

  useEffect(() => {
    if (teamForm.sportId) {
      fetchFormats(teamForm.sportId)
    }
  }, [teamForm.sportId])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(selectedSport && { sportId: selectedSport }),
        ...(selectedCity && { city: selectedCity }),
        ...(showInactive && { isActive: 'false' })
      })

      const response = await fetch(`/api/teams?${params}`)
      if (!response.ok) throw new Error('Failed to fetch teams')

      const data = await response.json()
      setTeams(data.teams || [])
    } catch (error) {
      console.error('Error fetching teams:', error)
      setError('Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

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

  const handleCreateTeam = async () => {
    if (!teamForm.name || !teamForm.sportId || !teamForm.formatId) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setCreatingTeam(true)
      setError('')

      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamForm)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create team')
      }

      const newTeam = await response.json()
      setTeams(prev => [newTeam.team, ...prev])
      setIsCreateDialogOpen(false)
      setTeamForm({
        name: '',
        description: '',
        logoUrl: '',
        sportId: '',
        formatId: '',
        city: '',
        area: '',
        level: '',
        maxPlayers: 10,
        isActive: true
      })

      if (onCreateTeam) {
        onCreateTeam(newTeam.team)
      }

    } catch (error) {
      console.error('Error creating team:', error)
      setError(error instanceof Error ? error.message : 'Failed to create team')
    } finally {
      setCreatingTeam(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Crown className="h-3 w-3 text-warning" />
      case 'ADMIN': return <Shield className="h-3 w-3 text-primary" />
      default: return <Sword className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-warning/20 text-yellow-800 border-yellow-200'
      case 'ADMIN': return 'bg-primary/20 text-primary-foreground border-primary/20'
      default: return 'bg-muted text-foreground border-border'
    }
  }

  const getLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'bg-success/20 text-success-foreground'
      case 'intermediate': return 'bg-warning/20 text-yellow-800'
      case 'advanced': return 'bg-destructive/20 text-destructive-foreground'
      default: return 'bg-muted text-foreground'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Teams</h2>
          <p className="text-muted-foreground">Manage your sports teams</p>
        </div>
        {showCreateButton && (!maxTeams || teams.length < maxTeams) && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Create a new team for your sport and start managing members
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-sm text-destructive-foreground">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Team Name *</Label>
                    <Input
                      id="teamName"
                      placeholder="Enter team name"
                      value={teamForm.name}
                      onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input
                      id="logoUrl"
                      placeholder="https://example.com/logo.png"
                      value={teamForm.logoUrl}
                      onChange={(e) => setTeamForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your team, goals, and playing style..."
                    value={teamForm.description}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sport *</Label>
                    <Select value={teamForm.sportId} onValueChange={(value) => setTeamForm(prev => ({ ...prev, sportId: value }))}>
                      <SelectTrigger>
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
                  </div>

                  <div className="space-y-2">
                    <Label>Format *</Label>
                    <Select value={teamForm.formatId} onValueChange={(value) => setTeamForm(prev => ({ ...prev, formatId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        {formats.map((format) => (
                          <SelectItem key={format.id} value={format.id}>
                            <div className="flex flex-col">
                              <span>{format.displayName}</span>
                              <span className="text-xs text-muted-foreground">
                                {format.minPlayers}-{format.maxPlayers} players
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="e.g., Bangalore"
                      value={teamForm.city}
                      onChange={(e) => setTeamForm(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">Area</Label>
                    <Input
                      id="area"
                      placeholder="e.g., Whitefield"
                      value={teamForm.area}
                      onChange={(e) => setTeamForm(prev => ({ ...prev, area: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">Skill Level</Label>
                    <Select value={teamForm.level} onValueChange={(value) => setTeamForm(prev => ({ ...prev, level: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPlayers">Maximum Players</Label>
                  <Input
                    id="maxPlayers"
                    type="number"
                    min="1"
                    max="50"
                    value={teamForm.maxPlayers}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTeam} disabled={creatingTeam}>
                    {creatingTeam ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Team
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search Teams</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sport</Label>
              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger>
                  <SelectValue placeholder="All sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All sports</SelectItem>
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
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Input
                placeholder="Filter by city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Include Inactive</Label>
              <div className="flex items-center space-x-2 mt-3">
                <input
                  type="checkbox"
                  id="showInactive"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded border-border"
                />
                <Label htmlFor="showInactive" className="text-sm">
                  Show inactive teams
                </Label>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={fetchTeams}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setSelectedSport('')
                setSelectedCity('')
                setShowInactive(false)
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teams Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-16 w-full mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onTeamSelect?.(team)}>
              <CardContent className="p-6">
                {/* Team Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={team.logoUrl} alt={team.name} />
                      <AvatarFallback>
                        <Trophy className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{team.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>{team.sport.icon}</span>
                        <span>{team.sport.displayName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">4.8</span>
                  </div>
                </div>

                {/* Team Description */}
                {team.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {team.description}
                  </p>
                )}

                {/* Team Stats */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Members:</span>
                    <span className="font-medium">
                      {team._count.members} / {team.maxPlayers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Matches:</span>
                    <span className="font-medium">
                      {team._count.homeMatches + team._count.awayMatches}
                    </span>
                  </div>
                  {team.level && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Level:</span>
                      <Badge className={getLevelColor(team.level)}>
                        {team.level}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Location */}
                {(team.city || team.area) && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {team.area && `${team.area}, `}
                      {team.city}
                    </span>
                  </div>
                )}

                {/* Team Members Preview */}
                {team.members.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {team.members.slice(0, 3).map((member, index) => (
                          <Avatar key={member.id} className="h-8 w-8 border-2 border-primary-foreground">
                            <AvatarImage src={member.user.avatarUrl} alt={member.user.name} />
                            <AvatarFallback className="text-xs">
                              {member.user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      {team.members.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{team.members.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <Users className="h-4 w-4 mr-2" />
                    View Team
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>

                {/* Status Badge */}
                <div className="mt-3">
                  <Badge className={team.isActive ? 'bg-success/20 text-success-foreground' : 'bg-destructive/20 text-destructive-foreground'}>
                    {team.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No teams found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || selectedSport || selectedCity
                ? 'No teams match your search criteria.'
                : 'Create your first team to get started.'}
            </p>
            {showCreateButton && (!searchTerm && !selectedSport && !selectedCity) && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Team
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}