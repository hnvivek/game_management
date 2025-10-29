'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Users, Trophy, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navbar from '@/components/navbar'

// Types for team data
interface Team {
  id: string
  name: string
  description?: string
  logoUrl?: string
  captainId: string
  sportId: string
  formatId: string
  maxPlayers: number
  city: string
  area?: string
  isActive: boolean
  isPublic: boolean
  createdAt: string
  updatedAt: string
  captain?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  sport?: {
    id: string
    name: string
    displayName: string
    icon: string
  }
  format?: {
    id: string
    name: string
    displayName: string
    minPlayers: number
    maxPlayers: number
  }
  _count?: {
    members: number
    homeMatches: number
    awayMatches: number
  }
  // Additional stats for better UI
  recentForm?: ('W' | 'D' | 'L')[]
  level?: string
  primaryColor?: string
  secondaryColor?: string
}

// Helper functions for generating mock stats
const generateRandomForm = (): ('W' | 'D' | 'L')[] => {
  const results: ('W' | 'D' | 'L')[] = []
  for (let i = 0; i < 5; i++) {
    const rand = Math.random()
    if (rand < 0.4) results.push('W')
    else if (rand < 0.7) results.push('D')
    else results.push('L')
  }
  return results
}

const getRandomLevel = (): string => {
  const levels = ['Beginner', 'Intermediate', 'Advanced', 'Professional']
  return levels[Math.floor(Math.random() * levels.length)]
}

const getRandomColor = (): string => {
  const colors = ['#EF0107', '#034694', '#DC052D', '#6CABDD', '#FDB913', '#003090', '#FF0000', '#FFFFFF']
  return colors[Math.floor(Math.random() * colors.length)]
}

const getRandomSecondaryColor = (): string => {
  const colors = ['#063672', '#FDB913', '#FFFFFF', '#DC052D', '#000000', '#FF0000', '#6CABDD', '#000000']
  return colors[Math.floor(Math.random() * colors.length)]
}

export default function TeamsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch teams from API
  const fetchTeams = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/teams')

      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }

      const data = await response.json()
      const teamsWithStats = (data.teams || []).map((team: Team) => ({
        ...team,
        recentForm: team.recentForm || generateRandomForm(),
        level: team.level || getRandomLevel(),
        primaryColor: team.primaryColor || getRandomColor(),
        secondaryColor: team.secondaryColor || getRandomSecondaryColor()
      }))
      setTeams(teamsWithStats)
      setError(null)
    } catch (err) {
      console.error('Error fetching teams:', err)
      setError('Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  // Fetch teams on component mount
  useEffect(() => {
    fetchTeams()
  }, [])

  // Filter teams based on search, sport, and level
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.area?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSport = levelFilter === 'all' || team.sport?.name === levelFilter
    const matchesLevel = levelFilter === 'all' || team.level?.toLowerCase() === levelFilter.toLowerCase()
    return matchesSearch && matchesSport && matchesLevel
  })

  // Display all teams (simple listing)
  const displayTeams = filteredTeams

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Teams</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover active teams and connect with players in Bengaluru
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading teams...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-red-500 mb-4">❌</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Error loading teams</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchTeams} variant="outline">
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="bg-card rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search teams..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Teams Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayTeams.map((team, index) => (
                <Card key={team.id} className="hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Team Logo with colors */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center border-2"
                          style={{
                            backgroundColor: team.primaryColor ? `${team.primaryColor}20` : 'hsl(var(--muted))',
                            borderColor: team.primaryColor || 'hsl(var(--border))',
                            color: team.primaryColor || 'hsl(var(--primary))'
                          }}
                        >
                          <span className="text-lg font-bold">
                            {team.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>

                        {/* Team Info */}
                        <div>
                          <CardTitle className="text-base font-semibold">{team.name}</CardTitle>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span>{team.city}{team.area ? `, ${team.area}` : ''}</span>
                          </div>
                        </div>
                      </div>

                      {/* Level Badge */}
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        {team.level || 'Intermediate'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Description */}
                    {team.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {team.description}
                      </p>
                    )}

                    {/* Performance Metrics */}
                    {team.recentForm && (
                      <>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-emerald-50 rounded p-2 border border-emerald-200">
                            <div className="text-base font-bold text-emerald-700">
                              {team.recentForm.filter(f => f === 'W').length}
                            </div>
                            <div className="text-xs text-emerald-600">Wins</div>
                          </div>
                          <div className="bg-amber-50 rounded p-2 border border-amber-200">
                            <div className="text-base font-bold text-amber-700">
                              {team.recentForm.filter(f => f === 'D').length}
                            </div>
                            <div className="text-xs text-amber-600">Draws</div>
                          </div>
                          <div className="bg-red-50 rounded p-2 border border-red-200">
                            <div className="text-base font-bold text-red-700">
                              {team.recentForm.filter(f => f === 'L').length}
                            </div>
                            <div className="text-xs text-red-600">Losses</div>
                          </div>
                        </div>

                        {/* Recent Form */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">Recent Form</span>
                          <div className="flex gap-1">
                            {team.recentForm.map((result, idx) => (
                              <div key={idx} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                result === 'W' ? 'bg-emerald-500 text-white' :
                                result === 'D' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                              }`}>
                                {result}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Team Members */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">Squad</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {team._count?.members || 1} players
                        </span>
                        <div className="flex -space-x-2">
                          {/* Mock squad avatars */}
                          {Array.from({ length: Math.min(4, team._count?.members || 1) }).map((_, idx) => (
                            <Avatar key={idx} className="h-6 w-6 border-2 border-white">
                              <AvatarFallback className="text-xs font-semibold bg-gray-100 text-gray-700">
                                {String.fromCharCode(65 + idx)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Captain Info */}
                    {team.captain && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">Captain</span>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs font-semibold bg-muted text-foreground">
                              {team.captain.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {team.captain.name}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Sport & Format */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{team.sport?.displayName || 'Sport'}</span>
                      <span>{team.format?.displayName || 'Standard'}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Link href={`/teams/${team.id}`} className="block">
                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-8">
                          <Users className="h-3 w-3 mr-1" />
                          View Team
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="w-full text-xs h-8">
                        <Trophy className="h-3 w-3 mr-1" />
                        Challenge
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {displayTeams.length === 0 && (
              <div className="text-center py-16">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No teams found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters to find teams
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
