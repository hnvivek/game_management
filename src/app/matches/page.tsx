'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Calendar, Clock, Users, Trophy, Filter, Loader2, DollarSign, Target, Zap } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navbar from '@/components/navbar'

// Types for match data
interface Match {
  id: string
  bookingId: string
  title?: string
  description?: string
  sportId: string
  formatId: string
  maxPlayers: number
  homeTeamId: string
  awayTeamId?: string
  status: 'OPEN' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
  homeTeam?: {
    id: string
    name: string
    captain?: {
      id: string
      name: string
      phone?: string
    }
    city: string
    area?: string
    _count?: {
      members: number
    }
  }
  awayTeam?: {
    id: string
    name: string
    captain?: {
      id: string
      name: string
      phone?: string
    }
    city: string
    area?: string
    _count?: {
      members: number
    }
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
  booking?: {
    id: string
    startTime: string
    endTime: string
    totalAmount?: number
    venue?: {
      id: string
      name: string
      courtNumber: string
      pricePerHour: number
      vendor?: {
        id: string
        name: string
        slug: string
      }
    }
  }
  splitCostPerTeam?: number
}

export default function MatchesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sportFilter, setSportFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('open') // Default to open matches
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch matches from API
  const fetchMatches = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        lookingForOpponent: 'true', // Focus on open matches looking for opponents
        limit: '20'
      })

      if (sportFilter !== 'all') {
        params.append('sportId', sportFilter)
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/matches?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }

      const data = await response.json()
      setMatches(data.matches || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching matches:', err)
      setError('Failed to load matches')
      // Provide mock data for demonstration
      setMatches([
        {
          id: '1',
          title: 'Weekend Soccer Match',
          description: 'Looking for opponent for a friendly 5-a-side match',
          status: 'OPEN',
          homeTeam: {
            id: '1',
            name: 'Bengaluru Strikers',
            captain: { id: 'capt_1', name: 'Rahul Sharma', phone: '+919876543210' },
            city: 'Bengaluru',
            area: 'Indiranagar'
          },
          sport: { id: '1', name: 'soccer', displayName: 'Soccer', icon: '⚽' },
          format: { id: '1', name: '5-a-side', displayName: '5-a-side', minPlayers: 5, maxPlayers: 10 },
          booking: {
            startTime: new Date(Date.now() + 86400000).toISOString(),
            endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
            totalAmount: 2000,
            venue: {
              id: '1',
              name: 'Sports Arena',
              courtNumber: 'Court 1',
              vendor: { id: '1', name: 'GameHub', slug: 'gamehub' }
            }
          },
          splitCostPerTeam: 1000,
          maxPlayers: 10
        },
        {
          id: '2',
          title: 'Cricket Match - Tape Ball',
          description: 'Competitive tape ball cricket match looking for opponent',
          status: 'OPEN',
          homeTeam: {
            id: '2',
            name: 'Urban Warriors',
            captain: { id: 'capt_2', name: 'Amit Patel', phone: '+918765432109' },
            city: 'Bengaluru',
            area: 'Koramangala'
          },
          sport: { id: '2', name: 'cricket', displayName: 'Cricket', icon: '🏏' },
          format: { id: '2', name: 'tape-ball', displayName: 'Tape Ball', minPlayers: 6, maxPlayers: 12 },
          booking: {
            startTime: new Date(Date.now() + 172800000).toISOString(),
            endTime: new Date(Date.now() + 172800000 + 7200000).toISOString(),
            totalAmount: 2400,
            venue: {
              id: '2',
              name: 'Turf Pro',
              courtNumber: 'Ground A',
              vendor: { id: '2', name: 'Sports Complex', slug: 'sports-complex' }
            }
          },
          splitCostPerTeam: 1200,
          maxPlayers: 12
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Fetch matches on component mount and when filters change
  useEffect(() => {
    fetchMatches()
  }, [sportFilter, statusFilter])

  // Filter matches based on search query
  const filteredMatches = matches.filter(match => {
    const matchesSearch = match.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         match.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         match.homeTeam?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         match.sport?.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         match.booking?.venue?.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const openMatchesCount = matches.filter(m => m.status === 'OPEN').length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-success/10 text-success border-success/20'
      case 'CONFIRMED': return 'bg-primary/10 text-primary border-primary/20'
      case 'COMPLETED': return 'bg-muted text-foreground border-border'
      case 'CANCELLED': return 'bg-destructive/10 text-destructive border-destructive/20'
      default: return 'bg-muted text-foreground border-border'
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString()

    return {
      date: isToday ? 'Today' : isTomorrow ? 'Tomorrow' : date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Target className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Open Matches</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover matches looking for opponents and join the action
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge className="bg-success/10 text-success border-success/20">
                <Zap className="h-3 w-3 mr-1" />
                {openMatchesCount} Open Matches
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading matches...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-destructive mb-4">❌</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Error loading matches</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchMatches} variant="outline">
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
                      placeholder="Search matches..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={sportFilter} onValueChange={setSportFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sports</SelectItem>
                    <SelectItem value="soccer">Football/Soccer</SelectItem>
                    <SelectItem value="cricket">Cricket</SelectItem>
                    <SelectItem value="basketball">Basketball</SelectItem>
                    <SelectItem value="badminton">Badminton</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Matches Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredMatches.map((match) => {
                const dateTime = match.booking?.startTime ? formatDateTime(match.booking.startTime) : null

                return (
                  <Card key={match.id} className="hover:shadow-lg transition-all duration-200">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary" className={getStatusColor(match.status)}>
                          {match.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span className="text-lg">{match.sport?.icon}</span>
                          <span>{match.sport?.displayName}</span>
                        </div>
                      </div>

                      <CardTitle className="text-lg font-semibold mb-2">
                        {match.title || 'Challenge Match'}
                      </CardTitle>

                      {match.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {match.description}
                        </p>
                      )}

                      {/* Home Team */}
                      {match.homeTeam && (
                        <div className="flex items-center gap-3 mt-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                              {match.homeTeam.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{match.homeTeam.name}</div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {match.homeTeam.city}{match.homeTeam.area ? `, ${match.homeTeam.area}` : ''}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Match Details */}
                      {dateTime && (
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="bg-primary/10 rounded p-3 border border-primary/20">
                            <div className="flex items-center justify-center gap-1 text-primary mb-1">
                              <Calendar className="h-4 w-4" />
                              <div className="text-sm font-bold">{dateTime.date}</div>
                            </div>
                            <div className="text-xs text-primary">{dateTime.time}</div>
                          </div>
                          <div className="bg-success/10 rounded p-3 border border-success/20">
                            <div className="flex items-center justify-center gap-1 text-success mb-1">
                              <MapPin className="h-4 w-4" />
                              <div className="text-sm font-bold">Venue</div>
                            </div>
                            <div className="text-xs text-success">
                              {match.booking?.venue?.courtNumber}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cost & Format */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-success" />
                          <span className="font-semibold text-success">
                            ₹{match.splitCostPerTeam || 0}/team
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {match.format?.displayName}
                        </Badge>
                      </div>

                      {/* Players Needed */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{match.maxPlayers} players</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {match.booking?.venue?.name}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button size="sm" className="w-full bg-primary hover:bg-primary-600 text-primary-foreground">
                          <Trophy className="h-3 w-3 mr-1" />
                          Join Match
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <Users className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Empty State */}
            {filteredMatches.length === 0 && (
              <div className="text-center py-16">
                <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No matches found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters to find matches
                </p>
                <Link href="/book-venue">
                  <Button>Create a Match</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}