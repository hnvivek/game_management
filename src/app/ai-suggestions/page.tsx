'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Bot, Clock, MapPin, Users, Trophy, Target, CheckCircle, XCircle, Calendar } from 'lucide-react'
import Link from 'next/link'

interface AISuggestion {
  id: string
  homeTeam: {
    id: string
    name: string
    sport: string
    city: string
  }
  awayTeam: {
    id: string
    name: string
    sport: string
    city: string
  }
  venue: {
    id: string
    name: string
    courtNumber: string
    pricePerHour: number
  }
  vendor: {
    name: string
    slug: string
  }
  scheduledTime: string
  duration: number
  aiScore: number
  scoringFactors: {
    timeSlotCompatibility: number
    venuePreference: number
    teamAvailability: number
    travelDistance: number
    venueAvailability: number
    skillLevelMatch: number
  }
  status: 'PENDING' | 'SCHEDULED' | 'EXPIRED'
  expiresAt?: string
  homeTeamAccepted?: boolean
  awayTeamAccepted?: boolean
}

export default function AISuggestionsPage() {
  const { user } = useAuth()
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Mock AI suggestions - in real app, this would fetch from API
    const mockSuggestions: AISuggestion[] = [
      {
        id: 'ai-suggestion-1',
        homeTeam: {
          id: 'team-1',
          name: 'Thunder Strikers',
          sport: 'Football',
          city: 'Bengaluru'
        },
        awayTeam: {
          id: 'team-2',
          name: 'Lightning Bolts',
          sport: 'Football',
          city: 'Bengaluru'
        },
        venue: {
          id: 'venue-1',
          name: '3Lok Sports Hub',
          courtNumber: 'Field 1',
          pricePerHour: 2000
        },
        vendor: {
          name: '3Lok Sports Hub',
          slug: '3lok'
        },
        scheduledTime: '2025-10-30T18:00:00Z',
        duration: 2,
        aiScore: 92,
        scoringFactors: {
          timeSlotCompatibility: 95,
          venuePreference: 88,
          teamAvailability: 90,
          travelDistance: 85,
          venueAvailability: 100,
          skillLevelMatch: 93
        },
        status: 'PENDING'
      }
    ]

    // Simulate API delay
    setTimeout(() => {
      setSuggestions(mockSuggestions)
      setLoading(false)
    }, 1000)
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to view AI-powered match suggestions</p>
          <Link href="/signin">
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90">
              Sign In
            </button>
          </Link>
        </div>
      </div>
    )
  }


  const getStatusBadge = (status: string, homeAccepted?: boolean, awayAccepted?: boolean) => {
    switch (status) {
      case 'PENDING':
        if (homeAccepted && awayAccepted) {
          return { text: 'Scheduled', color: 'bg-success/20 text-success-foreground', icon: CheckCircle }
        } else if (homeAccepted || awayAccepted) {
          return { text: 'Partial Accept', color: 'bg-warning/20 text-yellow-800', icon: Clock }
        }
        return { text: 'Pending', color: 'bg-primary/20 text-primary-foreground', icon: Clock }
      case 'SCHEDULED':
        return { text: 'Scheduled', color: 'bg-success/20 text-success-foreground', icon: CheckCircle }
      case 'EXPIRED':
        return { text: 'Expired', color: 'bg-destructive/20 text-destructive-foreground', icon: XCircle }
      default:
        return { text: status, color: 'bg-muted text-foreground', icon: Clock }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-success bg-success/10'
    if (score >= 0.8) return 'text-primary bg-primary/10'
    if (score >= 0.7) return 'text-warning bg-warning/10'
    return 'text-destructive bg-destructive/10'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">AI is analyzing team data and generating suggestions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">AI Match Suggestions</h1>
          </div>
          <p className="text-muted-foreground">
            Personalized match recommendations based on team preferences, availability, and venue compatibility
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Suggestions</p>
                <p className="text-2xl font-bold text-foreground">
                  {suggestions.filter(s => s.status === 'PENDING').length}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled Matches</p>
                <p className="text-2xl font-bold text-foreground">
                  {suggestions.filter(s => s.status === 'SCHEDULED' || (s.homeTeamAccepted && s.awayTeamAccepted)).length}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-success" />
            </div>
          </div>
          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average AI Score</p>
                <p className="text-2xl font-bold text-foreground">
                  {suggestions.length > 0 ? (suggestions.reduce((acc, s) => acc + s.aiScore, 0) / suggestions.length * 100).toFixed(0) : 0}%
                </p>
              </div>
              <Bot className="h-8 w-8 text-warning" />
            </div>
          </div>
        </div>

        {/* AI Suggestions List */}
        <div className="space-y-6">
          {suggestions.map((suggestion) => {
            const statusBadge = getStatusBadge(suggestion.status, suggestion.homeTeamAccepted, suggestion.awayTeamAccepted)
            const StatusIcon = statusBadge.icon

            return (
              <div key={suggestion.id} className="bg-card rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header with Score and Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
                        <StatusIcon className="h-4 w-4 inline mr-1" />
                        {statusBadge.text}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(suggestion.aiScore)}`}>
                        AI Score: {(suggestion.aiScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    {suggestion.expiresAt && suggestion.status === 'PENDING' && (
                      <div className="text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Expires in {Math.max(0, Math.floor((new Date(suggestion.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))}h
                      </div>
                    )}
                  </div>

                  {/* Match Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Teams */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{suggestion.homeTeam.name}</p>
                          <p className="text-sm text-muted-foreground">{suggestion.homeTeam.city}</p>
                        </div>
                        {suggestion.homeTeamAccepted && (
                          <CheckCircle className="h-5 w-5 text-success" />
                        )}
                      </div>
                      <div className="text-center text-muted-foreground">vs</div>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{suggestion.awayTeam.name}</p>
                          <p className="text-sm text-muted-foreground">{suggestion.awayTeam.city}</p>
                        </div>
                        {suggestion.awayTeamAccepted && (
                          <CheckCircle className="h-5 w-5 text-success" />
                        )}
                      </div>
                    </div>

                    {/* Venue and Time */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{suggestion.venue.name}</p>
                          <p className="text-sm text-muted-foreground">{suggestion.venue.courtNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{formatDate(suggestion.scheduledTime)}</p>
                          <p className="text-sm text-muted-foreground">{suggestion.duration} hours</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        💰 ₹{suggestion.venue.pricePerHour}/hour
                      </div>
                    </div>

                    {/* AI Scoring Factors */}
                    <div>
                      <h4 className="font-medium text-foreground mb-3">AI Scoring Breakdown</h4>
                      <div className="space-y-2">
                        {Object.entries(suggestion.scoringFactors).map(([factor, score]) => (
                          <div key={factor} className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground capitalize">
                              {factor.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-muted/50 rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${score * 100}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground w-10 text-right">
                                {(score * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {suggestion.status === 'PENDING' && (
                    <div className="mt-6 pt-6 border-t border-border flex justify-end space-x-3">
                      <button className="px-4 py-2 text-muted-foreground hover:text-foreground">
                        Decline
                      </button>
                      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                        Accept Match
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {suggestions.length === 0 && (
          <div className="text-center py-12">
            <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No AI suggestions available</h3>
            <p className="text-muted-foreground">
              AI is analyzing team data and will generate personalized match suggestions soon.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}