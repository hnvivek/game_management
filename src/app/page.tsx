'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Calendar, MapPin, Users, Trophy, ArrowRight, Zap, Star, Sparkles, Shield, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Navbar from '@/components/navbar'

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
    color: 'primary'
  },
  {
    icon: Users,
    title: 'Join Teams',
    description: 'Connect with local players and find the perfect team for your skill level',
    link: '/teams',
    color: 'success'
  },
  {
    icon: Trophy,
    title: 'Compete & Win',
    description: 'Join matches and tournaments to showcase your skills and climb the leaderboard',
    link: '/matches',
    color: 'warning'
  }
]

const stats = [
  { label: 'Active Venues', value: '50+', icon: MapPin },
  { label: 'Teams Playing', value: '200+', icon: Users },
  { label: 'Matches This Week', value: '150+', icon: Trophy },
  { label: 'Happy Players', value: '1000+', icon: TrendingUp }
]

const testimonials = [
  {
    name: 'Rahul Sharma',
    role: 'Team Captain',
    content: 'GameHub made it so easy to find venues and connect with players. Our team plays twice a week now!',
    rating: 5
  },
  {
    name: 'Priya Patel',
    role: 'Solo Player',
    content: 'Finally found a platform where I can join matches as an individual player. Amazing experience!',
    rating: 5
  },
  {
    name: 'Amit Kumar',
    role: 'Venue Manager',
    content: 'GameHub helped us increase our venue bookings by 40%. The best platform for sports enthusiasts.',
    rating: 5
  }
]

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data for homepage
  const fetchHomepageData = async () => {
    try {
      setLoading(true)

      // Fetch teams and venues in parallel
      const [teamsResponse, venuesResponse] = await Promise.all([
        fetch('/api/teams?limit=6'),
        fetch('/api/venues?limit=6&city=Bengaluru')
      ])

      const teamsData = await teamsResponse.json()
      const venuesData = await venuesResponse.json()

      const teams = teamsData.teams || []
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
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchHomepageData()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section - Modern Design */}
      <section className="relative overflow-hidden">
        {/* Gradient background with theme support */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
        <div className="absolute inset-0 bg-grid-primary/5 bg-[size:20px_20px]" />

        <div className="relative w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-4 sm:space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Bengaluru's Premier Sports Platform</span>
              </div>

              {/* Main heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="block text-foreground">Where Champions</span>
                <span className="block text-primary">Come to Play</span>
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Discover world-class venues, join competitive teams, and experience the thrill of sports.
                Your journey to athletic excellence starts here.
              </p>

              {/* Search bar */}
              <div className="max-w-2xl mx-auto w-full sm:w-auto">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search venues or teams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 text-base h-12 sm:h-14 border-2 bg-background/80 backdrop-blur-sm focus:border-primary transition-all duration-300"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <Button size="sm" className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm">
                      Search
                    </Button>
                  </div>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
                <Link href="/book-venue">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    <Calendar className="h-5 w-5 mr-2" />
                    Book a Venue
                  </Button>
                </Link>
                <Link href="/teams">
                  <Button size="lg" variant="outline" className="border-2 hover:bg-accent px-8 py-4 text-lg font-semibold">
                    <Users className="h-5 w-5 mr-2" />
                    Join a Team
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 bg-muted/30">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <Card key={stat.label} className="bg-card/50 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-4 text-center">
                      <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                Everything You Need to Play
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                From finding the perfect venue to joining teams, we've got you covered
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Card key={feature.title} className="group hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-xl font-semibold mb-2">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <CardDescription className="text-base mb-6 leading-relaxed">
                        {feature.description}
                      </CardDescription>
                      <Link href={feature.link}>
                        <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          Learn More
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Venues */}
      <section className="py-12 bg-muted/30">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                Popular Venues
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                Top-rated facilities in Bengaluru trusted by thousands of players
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array(3).fill(0).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-muted rounded w-32 mb-4"></div>
                      <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                      <div className="h-20 bg-muted rounded w-full"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                venues.slice(0, 6).map((venue) => (
                  <Card key={venue.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
                    <Link href={`/book-venue?venue=${venue.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{venue.sport?.displayName}</h3>
                            <p className="text-sm text-muted-foreground">{venue.location?.area}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-bold text-primary">
                              ₹{venue.pricePerHour}
                            </span>
                            <span className="text-sm text-muted-foreground ml-1">/hr</span>
                          </div>
                          <Badge variant="secondary">{venue.format?.displayName}</Badge>
                        </div>
                        <div className="mt-4 flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                          ))}
                          <span className="text-sm text-muted-foreground ml-1">(4.8)</span>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))
              )}
            </div>

            <div className="text-center mt-12">
              <Link href="/book-venue">
                <Button size="lg" variant="outline" className="px-8">
                  Browse All Venues
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                Loved by Players
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                See what our community has to say about their GameHub experience
              </p>
            </div>

            <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-card/50 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-4">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Join 1000+ Players</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              Ready to Elevate Your Game?
            </h2>

            <p className="text-lg sm:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join Bengaluru's most active sports community today and experience the difference
              that professional venue booking and team management can make.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/book-venue">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <Zap className="h-5 w-5 mr-2" />
                  Get Started Now
                </Button>
              </Link>
              <Link href="/teams">
                <Button size="lg" variant="outline" className="border-2 px-8 py-4 text-lg font-semibold">
                  Join Teams
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}