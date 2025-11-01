'use client'

import { useState, useEffect } from 'react'
import { Search, Calendar, MapPin, Users, Trophy, ArrowRight, Zap, Target, TrendingUp, Loader2, Clock, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Navbar from '@/components/navbar'
import { toast } from 'sonner'

// Types for data
interface Team {
  id: string
  name: string
  city: string
  area?: string
  captain?: {
    id: string
    name: string
    phone?: string
  }
  _count?: {
    members: number
  }
}

interface Match {
  id: string
  title?: string
  description?: string
  status: 'OPEN' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
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
  }
  sport?: {
    id: string
    name: string
    displayName: string
    icon: string
  }
  booking?: {
    startTime: string
    endTime: string
    totalAmount?: number
    venue?: {
      id: string
      name: string
      courtNumber: string
      vendor?: {
        id: string
        name: string
        slug: string
      }
    }
  }
  splitCostPerTeam?: number
  maxPlayers: number
}

interface Venue {
  id: string
  name: string
  sport?: {
    displayName: string
  }
  format?: {
    displayName: string
    minPlayers: number
    maxPlayers: number
  }
  location?: {
    city: string
    area: string
  }
  pricePerHour: number
  vendor?: {
    name: string
    primaryColor?: string
    secondaryColor?: string
  }
}

const features = [
  {
    icon: Calendar,
    title: 'Find & Book Venues',
    description: 'Discover and book the best sports venues in your area instantly',
    link: '/book-venue',
    color: 'blue'
  },
  {
    icon: Users,
    title: 'Browse Teams',
    description: 'Connect with local teams and find the perfect match for your skill level',
    link: '/teams',
    color: 'green'
  },
  {
    icon: Trophy,
    title: 'View Leaderboard',
    description: 'Check rankings and see how teams stack up in the competition',
    link: '/leaderboard',
    color: 'yellow'
  }
]

const stats = [
  { label: 'Active Venues', value: '50+', icon: MapPin },
  { label: 'Teams Playing', value: '200+', icon: Users },
  { label: 'Matches This Week', value: '150+', icon: Trophy },
  { label: 'Happy Players', value: '1000+', icon: TrendingUp }
]

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data for homepage
  const fetchHomepageData = async () => {
    try {
      setLoading(true)

      // Fetch teams, matches, and venues in parallel
      const [teamsResponse, matchesResponse, venuesResponse] = await Promise.all([
        fetch('/api/teams?limit=6'), // Limit to 6 teams for homepage
        fetch('/api/matches?lookingForOpponent=true&limit=6'), // Get matches looking for opponents
        fetch('/api/venues?limit=6&city=Bengaluru') // Get venues in Bengaluru
      ])

      const teamsData = await teamsResponse.json()
      const matchesData = await matchesResponse.json()
      const venuesData = await venuesResponse.json()

      const teams = teamsData.teams || []
      const matches = matchesData.matches || []
      const venues = venuesData.venues || []

      // If APIs return empty arrays, provide mock data for demonstration
      setTeams(teams.length > 0 ? teams : [
        {
          id: '1',
          name: 'Bengaluru Strikers',
          city: 'Bengaluru',
          area: 'Indiranagar',
          captain: { id: 'capt_1', name: 'Rahul Sharma', phone: '+919876543210' },
          _count: { members: 8 },
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Urban Warriors',
          city: 'Bengaluru',
          area: 'Koramangala',
          captain: { id: 'capt_2', name: 'Amit Patel', phone: '+918765432109' },
          _count: { members: 12 },
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ])

      setMatches(matches.length > 0 ? matches : [
        {
          id: '1',
          title: 'Weekend Soccer Match',
          description: 'Looking for opponent for a friendly 5-a-side match',
          status: 'OPEN',
          homeTeam: {
            id: '1',
            name: 'Bengaluru Strikers',
            captain: { id: 'capt_1', name: 'Rahul Sharma' },
            city: 'Bengaluru',
            area: 'Indiranagar'
          },
          sport: { id: '1', name: 'soccer', displayName: 'Soccer', icon: '⚽' },
          booking: {
            startTime: new Date(Date.now() + 86400000).toISOString(),
            venue: {
              id: '1',
              name: 'Sports Arena',
              courtNumber: 'Court 1',
              vendor: { id: '1', name: 'GameHub', slug: 'gamehub' }
            }
          },
          splitCostPerTeam: 500,
          maxPlayers: 10
        }
      ])

      setVenues(venues.length > 0 ? venues : [
        {
          id: '1',
          name: 'Sports Arena',
          sport: { displayName: 'Soccer' },
          format: { displayName: '5-a-side', minPlayers: 5, maxPlayers: 10 },
          location: { city: 'Bengaluru', area: 'Indiranagar' },
          pricePerHour: 1000,
          vendor: { name: 'GameHub', primaryColor: '#f39c12' }
        },
        {
          id: '2',
          name: 'Turf Pro',
          sport: { displayName: 'Cricket' },
          format: { displayName: 'Tape Ball', minPlayers: 6, maxPlayers: 12 },
          location: { city: 'Bengaluru', area: 'Koramangala' },
          pricePerHour: 1200,
          vendor: { name: 'Sports Complex', primaryColor: '#10b981' }
        }
      ])

      setError(null)
    } catch (err) {
      console.error('Error fetching homepage data:', err)
      setError('Failed to load data')
      // Don't show toast on homepage, just set error state
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchHomepageData()
  }, [])

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-background">
      {/* Unified Navbar */}
      <Navbar />

      {/* Hero Section - Optimized for Mobile */}
      <section
        className="relative overflow-hidden text-primary-foreground hero-mobile-compact"
        style={{
          background: 'linear-gradient(to bottom right, var(--primary-600), var(--primary-700), var(--primary-800))'
        }}
      >
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
          <div className="text-center space-y-4 sm:space-y-6">
            {/* Mobile-optimized Badge */}
            <div className="flex justify-center">
              <Badge className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 px-3 py-0.5 text-xs sm:text-sm">
                <Zap className="h-3 w-3 mr-1 inline" />
                Sports Hub in Bengaluru
              </Badge>
            </div>

            {/* Mobile-optimized Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight">
              <span className="block sm:hidden">GameHub Sports</span>
              <span className="hidden sm:block">Bengaluru's Premier Sports Platform</span>
            </h1>

            {/* Mobile-optimized Description */}
            <p className="text-sm sm:text-base md:text-lg text-primary-foreground/90 max-w-xl mx-auto px-2">
              Discover venues, join teams, and elevate your game
            </p>

            {/* Compact Search - Always Visible */}
            <div className="max-w-md sm:max-w-xl mx-auto pt-2 sm:pt-6">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-primary-foreground/60 h-4 w-4 sm:h-5 sm:w-5" />
                <Input
                  type="text"
                  placeholder="Search venues, teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base h-10 sm:h-12 border border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground placeholder:text-primary-foreground/60"
                />
              </div>
            </div>

            {/* Mobile-optimized CTA */}
            <div className="pt-4 sm:pt-8">
              <Link href="/book-venue">
                <Button
                  size="sm"
                  className="bg-card text-primary hover:bg-muted px-4 sm:px-8 py-2 sm:py-4 text-sm sm:text-base font-semibold shadow-lg sm:shadow-xl h-10 sm:h-auto transition-all hover:scale-105"
                >
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Book Now</span>
                  <ArrowRight className="h-4 w-4 ml-1 sm:ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Mobile Optimized */}
      <section className="w-full px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stats-mobile-compact">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="bg-card shadow-md sm:shadow-lg border-0 card-mobile-compact">
                <CardContent className="p-3 sm:p-4 text-center">
                  <Icon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-primary" />
                  <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs sm:text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground">Simple steps to get you playing</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Find Venues</h3>
            <p className="text-muted-foreground">Discover and book the best sports facilities in your area</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Join Teams</h3>
            <p className="text-muted-foreground">Connect with local players and find your perfect team</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Compete</h3>
            <p className="text-muted-foreground">Join matches and tournaments to showcase your skills</p>
          </div>
        </div>
      </section>

      {/* Popular Venues */}
      <section className="py-16 bg-muted/30">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Popular Venues</h2>
            <p className="text-lg text-muted-foreground">Top-rated facilities in Bengaluru</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array(3).fill(0).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted/50 rounded w-32 mb-4"></div>
                    <div className="h-4 bg-muted/50 rounded w-24 mb-2"></div>
                    <div className="h-20 bg-muted/50 rounded w-full"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              venues.slice(0, 6).map((venue) => (
                <Card key={venue.id} className="hover:shadow-lg transition-all duration-200">
                  <Link href={`/book-venue?venue=${venue.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{venue.sport?.displayName}</h3>
                          <p className="text-sm text-muted-foreground">{venue.location?.area}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">
                          ₹{venue.pricePerHour}/hr
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {venue.format?.displayName}
                        </span>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))
            )}
          </div>

          <div className="text-center mt-8">
            <Link href="/book-venue">
              <Button variant="outline" className="px-8">
                Browse All Venues
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

    {/* Simple CTA */}
      <section className="py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join Bengaluru's most active sports community today
          </p>
          <Link href="/book-venue">
            <Button size="lg" className="bg-primary hover:bg-primary-600 text-primary-foreground px-12 py-4 text-lg font-semibold shadow-lg transition-all hover:scale-105">
              Start Playing
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
