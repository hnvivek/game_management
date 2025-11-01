'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Trophy,
  DollarSign,
  Target,
  Shield,
  UserPlus,
  Phone,
  Mail,
  Loader2,
  Edit,
  Settings,
  Share2
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import Navbar from '@/components/navbar'
import { toast } from 'sonner'

// Types
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
      location?: {
        name: string
        address: string
        city: string
        area: string
      }
    }
  }
  splitCostPerTeam?: number
  participants?: Array<{
    id: string
    userId: string
    teamId: string
    role: 'PLAYER' | 'SUBSTITUTE'
    joinedAt: string
    user?: {
      id: string
      name: string
      email: string
      phone?: string
    }
    team?: {
      id: string
      name: string
    }
  }>
}

export default function MatchDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string

  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  // Fetch match details
  const fetchMatch = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/matches/${matchId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Match not found')
        }
        throw new Error('Failed to fetch match details')
      }

      const data = await response.json()
      setMatch(data.match)
      setError(null)
    } catch (err) {
      console.error('Error fetching match:', err)
      setError(err instanceof Error ? err.message : 'Failed to load match')
      toast.error('Failed to load match details')
    } finally {
      setLoading(false)
    }
  }

  // Join match as opponent
  const handleJoinMatch = async () => {
    if (!match || joining) return

    try {
      setJoining(true)
      const response = await fetch(`/api/matches/${matchId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: 'cmhbk4j990002tzs9y68hyq8q' // TODO: Get from auth
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to join match')
      }

      toast.success('Successfully joined the match!')
      fetchMatch() // Refresh match data
    } catch (err) {
      console.error('Error joining match:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to join match')
    } finally {
      setJoining(false)
    }
  }

  // Share match
  const handleShareMatch = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: match?.title || 'Match Invitation',
          text: `Join our ${match?.sport?.displayName} match on ${new Date(match?.booking?.startTime || '').toLocaleDateString()}`,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Match link copied to clipboard!')
      }
    } catch (err) {
      console.error('Error sharing match:', err)
    }
  }

  useEffect(() => {
    if (matchId) {
      fetchMatch()
    }
  }, [matchId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading match details...</span>
        </div>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="text-destructive mb-4">❌</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {error || 'Match not found'}
            </h3>
            <p className="text-muted-foreground mb-4">
              The match you're looking for doesn't exist or you don't have access to it.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Link href="/matches">
                <Button>Browse Matches</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const dateTime = formatDateTime(match.booking?.startTime || match.createdAt)
  const isMyMatch = match.homeTeamId === 'cmhbk4j990002tzs9y68hyq8q' || match.awayTeamId === 'cmhbk4j990002tzs9y68hyq8q'
  const canJoin = !match.awayTeam && match.status === 'OPEN' && !isMyMatch

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {match.title || `${match.homeTeam?.name} vs ${match.awayTeam?.name || 'Opponent'}`}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="secondary" className={getStatusColor(match.status)}>
                    {match.status}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{dateTime.date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{dateTime.time}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShareMatch}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              {canJoin && (
                <Button onClick={handleJoinMatch} disabled={joining}>
                  {joining ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Join Match
                </Button>
              )}
              {isMyMatch && (
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Match Description */}
            {match.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About This Match</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{match.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Teams */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Home Team */}
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/10">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-lg font-semibold bg-primary/20 text-primary">
                          {match.homeTeam?.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-lg">{match.homeTeam?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {match.homeTeam?.city}{match.homeTeam?.area ? `, ${match.homeTeam.area}` : ''}
                        </div>
                        {match.homeTeam?.captain && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Shield className="h-3 w-3" />
                            <span>Captain: {match.homeTeam.captain.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-primary">Home Team</div>
                      <div className="text-xs text-muted-foreground">
                        {match.homeTeam?._count?.members || 0} members
                      </div>
                    </div>
                  </div>

                  {/* VS */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground">VS</div>
                  </div>

                  {/* Away Team */}
                  {match.awayTeam ? (
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-destructive/10">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="text-lg font-semibold bg-destructive/20 text-destructive">
                            {match.awayTeam.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-lg">{match.awayTeam.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {match.awayTeam.city}{match.awayTeam.area ? `, ${match.awayTeam.area}` : ''}
                          </div>
                          {match.awayTeam.captain && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Shield className="h-3 w-3" />
                              <span>Captain: {match.awayTeam.captain.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-destructive">Away Team</div>
                        <div className="text-xs text-muted-foreground">
                          {match.awayTeam._count?.members || 0} members
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed rounded-lg text-center">
                      <div className="text-lg font-semibold text-muted-foreground">Looking for Opponent</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Be the first to join this match!
                      </div>
                      {match.splitCostPerTeam && (
                        <div className="flex items-center justify-center gap-1 mt-2">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {match.splitCostPerTeam.toFixed(0)} per team
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Match Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Match Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Sport</div>
                      <div className="font-medium">{match.sport?.displayName}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Format</div>
                      <div className="font-medium">{match.format?.displayName}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Max Players</div>
                      <div className="font-medium">{match.maxPlayers} players</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Status</div>
                      <Badge variant="secondary" className={getStatusColor(match.status)}>
                        {match.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Created</div>
                      <div className="font-medium">
                        {new Date(match.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {match.splitCostPerTeam && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Cost per Team</div>
                        <div className="font-medium">
                          ${match.splitCostPerTeam.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Venue Information */}
            {match.booking?.venue && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Venue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Name</div>
                    <div className="font-medium">{match.booking.venue.name}</div>
                    {match.booking.venue.courtNumber && (
                      <div className="text-sm text-muted-foreground">
                        Court {match.booking.venue.courtNumber}
                      </div>
                    )}
                  </div>
                  {match.booking.venue.location && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Address</div>
                      <div className="text-sm">{match.booking.venue.location.address}</div>
                      <div className="text-sm">
                        {match.booking.venue.location.city}, {match.booking.venue.location.area}
                      </div>
                    </div>
                  )}
                  {match.booking.venue.vendor && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Vendor</div>
                      <div className="text-sm">{match.booking.venue.vendor.name}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            {match.homeTeam?.captain && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Organizer</div>
                    <div className="font-medium">{match.homeTeam.captain.name}</div>
                  </div>
                  {match.homeTeam.captain.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{match.homeTeam.captain.phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full" onClick={handleShareMatch}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Match
                </Button>
                {isMyMatch && (
                  <Button variant="outline" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Match
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}