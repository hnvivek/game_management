'use client'

import { useState } from 'react'
import { Search, Calendar, MapPin, Users, Trophy, ArrowRight, Zap, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/navbar'

// Featured match challenges
const featuredMatches = [
  {
    id: 1,
    sport: 'Football',
    date: '2024-01-20',
    time: '18:00',
    venue: '3Lok Football Fitness Hub, Whitefield',
    level: 'Intermediate',
    requestingTeam: 'Arsenal FC',
    requestingTeamId: 1,
    price: '₹1500/team',
    status: 'open',
    description: 'Competitive 11-a-side match on premium turf',
    playersNeeded: 11
  },
  {
    id: 2,
    sport: 'Football',
    date: '2024-01-22',
    time: '20:00',
    venue: '3Lok Football Fitness Hub, Whitefield',
    level: 'Advanced',
    requestingTeam: 'Liverpool FC',
    requestingTeamId: 3,
    price: '₹2000/team',
    status: 'open',
    description: 'High-level competitive match',
    playersNeeded: 11
  }
]

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Unified Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center space-y-6">
            <Badge className="bg-blue-500/20 text-white border-blue-400/30 px-4 py-1">
              <Zap className="h-3 w-3 mr-1 inline" />
              Sports Hub in Bengaluru
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              Find Your Perfect Match
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
              Book venues, challenge teams, and compete in the best sports leagues in Bengaluru
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto pt-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search for teams, venues, or matches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 text-base h-12 border-0 shadow-xl bg-white text-gray-900"
                />
              </div>
            </div>

            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/book-venue">
                <Button
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-6 text-base font-semibold shadow-lg h-auto"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Book a Venue Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/teams">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base font-semibold h-auto"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Browse Teams
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="bg-white shadow-lg border-0">
                <CardContent className="p-4 text-center">
                  <Icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need</h2>
          <p className="text-lg text-gray-600">Your complete sports management platform</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Link key={feature.title} href={feature.link}>
                <Card className="h-full hover:shadow-xl transition-all duration-200 cursor-pointer border-2 hover:border-blue-200 group">
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${
                      feature.color === 'blue' ? 'from-blue-500 to-blue-600' :
                      feature.color === 'green' ? 'from-green-500 to-green-600' :
                      'from-yellow-500 to-yellow-600'
                    } flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-6">
                    <Button variant="ghost" className="text-blue-600 group-hover:text-blue-700">
                      Explore <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Featured Matches Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Open Match Challenges</h2>
              <p className="text-gray-600">Join these matches or create your own</p>
            </div>
            <Button variant="outline" className="hidden sm:flex">
              View All Matches
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {featuredMatches.map((match) => (
              <Card key={match.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="mb-2">{match.sport}</Badge>
                      <CardTitle className="text-lg">{match.requestingTeam}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {match.venue}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      Open
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      {match.date} • {match.time}
                    </div>
                    <Badge variant="outline">{match.level}</Badge>
                  </div>

                  <p className="text-sm text-gray-600">{match.description}</p>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-bold text-green-600">{match.price}</span>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Accept Challenge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Button variant="outline" className="w-full">
              View All Matches
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Target className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Start Playing?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of players in Bengaluru's most active sports community
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book-venue">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8 h-12">
                Book Your First Venue
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 h-12">
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
