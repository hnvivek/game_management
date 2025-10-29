'use client'

import { useState } from 'react'
import { Search, Calendar, MapPin, Users, Trophy, Plus, Filter, Clock, Star, BarChart3, TrendingUp, Shield, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navbar from '@/components/navbar'

// Enterprise Design System
const DESIGN_SYSTEM = {
  colors: {
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      900: '#1E3A8A'
    },
    secondary: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      900: '#111827'
    },
    success: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      500: '#10B981',
      600: '#059669'
    },
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      500: '#F59E0B',
      600: '#D97706'
    },
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      500: '#EF4444',
      600: '#DC2626'
    },
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4'
    }
  },
  spacing: {
    xs: '0.5rem',  // 8px
    sm: '0.75rem', // 12px
    md: '1rem',    // 16px
    lg: '1.5rem',  // 24px
    xl: '2rem',    // 32px
    '2xl': '3rem'  // 48px
  },
  typography: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem'   // 36px
  },
  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem'       // 16px
  }
}

// Dummy matches for local games in Bengaluru, India
const dummyMatches = [
  {
    id: 1,
    sport: 'Football',
    date: '2024-01-20',
    time: '18:00',
    venue: '3Lok Football Fitness Hub, Whitefield',
    level: 'Intermediate',
    requestingTeam: 'Arsenal FC',
    requestingTeamId: 1,
    requestedOpponent: 'Looking for Team',
    matchType: 'Team vs Team',
    playersPerTeam: 11,
    price: '₹1500/team',
    status: 'open',
    description: 'Competitive 11-a-side match on premium turf'
  },
  {
    id: 2,
    sport: 'Football',
    date: '2024-01-21',
    time: '19:30',
    venue: '3Lok Football Fitness Hub, Whitefield',
    level: 'Beginner',
    requestingTeam: 'Manchester United',
    requestingTeamId: 2,
    requestedOpponent: 'Chelsea FC',
    requestedOpponentId: 4,
    matchType: 'Team vs Team',
    playersPerTeam: 7,
    price: '₹1200/team',
    status: 'pending',
    description: 'Friendly 7-a-side match'
  },
  {
    id: 3,
    sport: 'Football',
    date: '2024-01-22',
    time: '20:00',
    venue: '3Lok Football Fitness Hub, Whitefield',
    level: 'Advanced',
    requestingTeam: 'Liverpool FC',
    requestingTeamId: 3,
    requestedOpponent: 'Looking for Team',
    matchType: 'Team vs Team',
    playersPerTeam: 11,
    price: '₹2000/team',
    status: 'open',
    description: 'High-level competitive match'
  }
]

// Real team data for local matches in Bengaluru
const dummyTeams = [
  {
    id: 1,
    name: 'Arsenal FC',
    logo: 'https://1000logos.net/wp-content/uploads/2016/10/Arsenal-Logo.png',
    primaryColor: '#EF0107',
    secondaryColor: '#063672',
    members: ['Alex Johnson', 'Sam Wilson', 'Mike Chen', 'David Lee'],
    level: 'Intermediate',
    city: 'Bengaluru',
    recentForm: ['W', 'W', 'D', 'W', 'L']
  },
  {
    id: 2,
    name: 'Manchester United',
    logo: 'https://1000logos.net/wp-content/uploads/2017/03/Manchester-United-Logo.png',
    primaryColor: '#DA020E',
    secondaryColor: '#FBE122',
    members: ['Sarah Miller', 'Tom Brown', 'Chris Taylor', 'Jake Davis'],
    level: 'Beginner',
    city: 'Bengaluru',
    recentForm: ['L', 'D', 'W', 'L', 'D']
  },
  {
    id: 3,
    name: 'Liverpool FC',
    logo: 'https://1000logos.net/wp-content/uploads/2017/04/Liverpool-Logo.png',
    primaryColor: '#C8102E',
    secondaryColor: '#00B2A9',
    members: ['Carlos Rodriguez', 'James Smith', 'Ryan Garcia', 'Kevin Park'],
    level: 'Advanced',
    city: 'Bengaluru',
    recentForm: ['W', 'W', 'W', 'D', 'W']
  },
  {
    id: 4,
    name: 'Chelsea FC',
    logo: 'https://1000logos.net/wp-content/uploads/2016/11/Chelsea-Logo.png',
    primaryColor: '#034694',
    secondaryColor: '#DBA732',
    members: ['Emma Wilson', 'Oliver Brown', 'Sophie Taylor', 'Lucas Davis'],
    level: 'Intermediate',
    city: 'Bengaluru',
    recentForm: ['D', 'W', 'L', 'W', 'W']
  },
  {
    id: 5,
    name: 'Bayern Munich',
    logo: 'https://1000logos.net/wp-content/uploads/2018/05/Bayern-Munchen-Logo.png',
    primaryColor: '#DC052D',
    secondaryColor: '#FFFFFF',
    members: 'Hans Mueller, Klaus Schmidt, Erik Weber, Karl Fischer',
    level: 'Advanced',
    city: 'Bengaluru',
    recentForm: ['W', 'W', 'W', 'W', 'D']
  }
]

const dummyLeaderboard = [
  { rank: 1, team: 'Liverpool FC', teamId: 3, points: 45, wins: 14, losses: 2, level: 'Advanced', logo: 'https://1000logos.net/wp-content/uploads/2017/04/Liverpool-Logo.png', recentForm: ['W', 'W', 'W', 'D', 'W'] },
  { rank: 2, team: 'Arsenal FC', teamId: 1, points: 38, wins: 12, losses: 3, level: 'Intermediate', logo: 'https://1000logos.net/wp-content/uploads/2016/10/Arsenal-Logo.png', recentForm: ['W', 'W', 'D', 'W', 'L'] },
  { rank: 3, team: 'Chelsea FC', teamId: 4, points: 35, wins: 11, losses: 4, level: 'Intermediate', logo: 'https://1000logos.net/wp-content/uploads/2016/11/Chelsea-Logo.png', recentForm: ['D', 'W', 'L', 'W', 'W'] },
  { rank: 4, team: 'Bayern Munich', teamId: 5, points: 32, wins: 10, losses: 5, level: 'Advanced', logo: 'https://1000logos.net/wp-content/uploads/2018/05/Bayern-Munchen-Logo.png', recentForm: ['W', 'W', 'W', 'W', 'D'] },
  { rank: 5, team: 'Manchester United', teamId: 2, points: 20, wins: 6, losses: 9, level: 'Beginner', logo: 'https://1000logos.net/wp-content/uploads/2017/03/Manchester-United-Logo.png', recentForm: ['L', 'D', 'W', 'L', 'D'] }
]

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSport, setSelectedSport] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedDate, setSelectedDate] = useState('')

  const filteredMatches = dummyMatches.filter(match => {
    const matchesSearch = match.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         match.requestingTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         match.requestedOpponent.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSport = selectedSport === 'all' || match.sport.toLowerCase() === selectedSport.toLowerCase()
    const matchesLevel = selectedLevel === 'all' || match.level.toLowerCase() === selectedLevel.toLowerCase()
    const matchesDate = !selectedDate || match.date === selectedDate
    
    return matchesSearch && matchesSport && matchesLevel && matchesDate
  })


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Unified Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Your Match</h1>
          <p className="text-lg text-gray-600 mb-8">Connect with teams in Bengaluru • Challenge • Compete</p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for teams, venues, or matches in Bengaluru..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 text-lg h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/book-venue">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-0 rounded-lg"
              >
                <Plus className="h-5 w-5 mr-3" />
                Find & Book Venues
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Users className="h-5 w-5 mr-3" />
              Browse Teams
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Trophy className="h-5 w-5 mr-3" />
              Leaderboard
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="w-40 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                <SelectItem value="football">Football</SelectItem>
                <SelectItem value="cricket">Cricket</SelectItem>
                <SelectItem value="basketball">Basketball</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-40 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40 border-gray-300"
            />
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="matches" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="matches" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-gray-700 data-[state=active]:text-gray-900 font-medium">
              Match Challenges
            </TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-gray-700 data-[state=active]:text-gray-900 font-medium">
              Teams
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-gray-700 data-[state=active]:text-gray-900 font-medium">
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Match Challenges Tab */}
          <TabsContent value="matches" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
              {filteredMatches.map((match) => (
                <Card key={match.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{match.sport}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {match.venue}
                        </CardDescription>
                      </div>
                      <Badge variant={match.status === 'open' ? 'default' : 'secondary'}>
                        {match.status === 'open' ? 'Open' : 'Pending'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {match.date}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {match.time}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          {match.requestingTeamId && (
                            <img 
                              src={dummyTeams.find(t => t.id === match.requestingTeamId)?.logo} 
                              alt={match.requestingTeam}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <span className="text-sm font-medium">{match.requestingTeam}</span>
                        </div>
                        <span className="text-xs text-gray-500">CHALLENGES</span>
                        <div className="flex items-center space-x-2">
                          {match.requestedOpponentId && (
                            <img 
                              src={dummyTeams.find(t => t.id === match.requestedOpponentId)?.logo} 
                              alt={match.requestedOpponent}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <span className="text-sm font-medium">{match.requestedOpponent}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 text-center">
                        {match.matchType} • {match.playersPerTeam} players per team
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <Badge variant="outline">{match.level}</Badge>
                      {match.status === 'open' && (
                        <span className="text-green-600 font-medium">{match.price}</span>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600">{match.description}</p>
                    
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium" size="sm">
                        {match.status === 'open' ? 'Accept Challenge' : 'View Details'}
                      </Button>
                      {match.status === 'open' && (
                        <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
                          Message
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-8">
            {/* Teams Header with Search and Filters */}
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Elite Teams</h2>
                <p className="text-lg text-gray-600">Discover the most competitive teams in Bengaluru's sports scene</p>
              </div>
              
              {/* Search and Filter Controls */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-80">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Search teams by name or location..."
                        className="pl-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-48 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="rank">
                    <SelectTrigger className="w-48 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rank">Sort by Rank</SelectItem>
                      <SelectItem value="name">Sort by Name</SelectItem>
                      <SelectItem value="wins">Sort by Wins</SelectItem>
                      <SelectItem value="form">Sort by Form</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Teams Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
              {dummyTeams.map((team, index) => (
                <Card key={team.id} className="group hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white">
                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Team Logo */}
                        <div className="relative">
                          <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 overflow-hidden">
                            <img 
                              src={team.logo} 
                              alt={team.name}
                              className="w-12 h-12 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = document.createElement('div');
                                fallback.className = 'text-xl font-bold text-gray-600';
                                fallback.textContent = team.name.split(' ').map(n => n[0]).join('');
                                if (e.currentTarget.parentElement) {
                                  e.currentTarget.parentElement.appendChild(fallback);
                                }
                              }}
                            />
                          </div>
                          {/* Rank Badge */}
                          <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm ${
                            index === 0 ? 'bg-amber-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-500 text-white' :
                            'bg-blue-500 text-white'
                          }`}>
                            {index + 1}
                          </div>
                        </div>
                        
                        {/* Team Info */}
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900">{team.name}</CardTitle>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{team.city}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Level Badge */}
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                        {team.level}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                        <div className="text-lg font-bold text-emerald-700">
                          {team.recentForm.filter(f => f === 'W').length}
                        </div>
                        <div className="text-xs text-emerald-600 font-medium">Wins</div>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                        <div className="text-lg font-bold text-amber-700">
                          {team.recentForm.filter(f => f === 'D').length}
                        </div>
                        <div className="text-xs text-amber-600 font-medium">Draws</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <div className="text-lg font-bold text-red-700">
                          {team.recentForm.filter(f => f === 'L').length}
                        </div>
                        <div className="text-xs text-red-600 font-medium">Losses</div>
                      </div>
                    </div>

                    {/* Recent Form */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Recent Form</span>
                        <div className="flex space-x-2">
                          {team.recentForm.map((result, idx) => (
                            <div key={idx} className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${
                              result === 'W' ? 'bg-emerald-500 text-white' :
                              result === 'D' ? 'bg-amber-500 text-white' :
                              'bg-red-500 text-white'
                            }`}>
                              {result}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Team Members */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Squad</span>
                        <span className="text-xs text-gray-500">
                          {Array.isArray(team.members) ? team.members.length : 4} players
                        </span>
                      </div>
                      <div className="flex -space-x-2">
                        {Array.isArray(team.members) ? team.members.slice(0, 4).map((member, idx) => (
                          <Avatar key={idx} className="h-8 w-8 border-2 border-white">
                            <AvatarFallback className="text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                              {member.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )) : (
                          [1, 2, 3, 4].map((idx) => (
                            <Avatar key={idx} className="h-8 w-8 border-2 border-white">
                              <AvatarFallback className="text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                P{idx}
                              </AvatarFallback>
                            </Avatar>
                          ))
                        )}
                        {Array.isArray(team.members) && team.members.length > 4 && (
                          <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                            <span className="text-xs font-semibold text-gray-600">
                              +{team.members.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-2">
                      <Link href="/team-wall" className="block">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
                          <Users className="h-4 w-4 mr-2" />
                          View Team Wall
                        </Button>
                      </Link>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-medium">
                          <Trophy className="h-4 w-4 mr-1" />
                          Challenge
                        </Button>
                        <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50 font-medium">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Statistics
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            {/* Leaderboard Header with Filters */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center">
                      <Trophy className="h-8 w-8 mr-3 text-yellow-500" />
                      Bengaluru Sports League Rankings
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Local teams competing in Bengaluru's premier sports leagues
                    </CardDescription>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex flex-wrap gap-3">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sports</SelectItem>
                        <SelectItem value="football">Football</SelectItem>
                        <SelectItem value="cricket">Cricket</SelectItem>
                        <SelectItem value="basketball">Basketball</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="points">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="points">Sort by Points</SelectItem>
                        <SelectItem value="wins">Sort by Wins</SelectItem>
                        <SelectItem value="name">Sort by Name</SelectItem>
                        <SelectItem value="level">Sort by Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dummyLeaderboard.map((entry, index) => (
                    <div key={entry.rank} className={`relative rounded-xl border transition-all hover:shadow-lg ${
                      entry.rank === 1 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' :
                      entry.rank === 2 ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200' :
                      entry.rank === 3 ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200' :
                      'bg-white border-gray-200 hover:border-gray-300'
                    }`}>
                      {/* Rank Badge */}
                      <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                        entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        entry.rank === 2 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                        entry.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                        'bg-gradient-to-br from-blue-400 to-blue-600'
                      }`}>
                        {entry.rank}
                      </div>
                      
                      <div className="flex items-center justify-between p-4 pl-20">
                        <div className="flex items-center space-x-4">
                          {/* Team Logo */}
                          <div className="w-12 h-12 bg-white rounded-lg p-1 shadow-sm">
                            <img 
                              src={entry.logo} 
                              alt={entry.team}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.parentElement) {
                                  e.currentTarget.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xs font-bold bg-gray-100 rounded">${entry.team.split(' ').map(n => n[0]).join('')}</div>`;
                                }
                              }}
                            />
                          </div>
                          
                          {/* Team Info */}
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{entry.team}</h3>
                            <div className="flex items-center space-x-3 text-sm text-gray-600">
                              <Badge variant="outline" className="text-xs">{entry.level}</Badge>
                              <span>•</span>
                              <span>{entry.wins}W {entry.losses}L</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Stats */}
                        <div className="flex items-center space-x-6">
                          {/* Recent Form */}
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500 mr-2">Form:</span>
                            {entry.recentForm.map((result, idx) => (
                              <div key={idx} className={`w-4 h-4 rounded flex items-center justify-center text-xs font-bold ${
                                result === 'W' ? 'bg-green-500 text-white' :
                                result === 'D' ? 'bg-yellow-500 text-white' :
                                'bg-red-500 text-white'
                              }`}>
                                {result}
                              </div>
                            ))}
                          </div>
                          
                          {/* Points */}
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">{entry.points}</div>
                            <div className="text-xs text-gray-500">points</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Top 3 Crown */}
                      {entry.rank <= 3 && (
                        <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center ${
                          entry.rank === 1 ? 'bg-yellow-400' :
                          entry.rank === 2 ? 'bg-gray-400' :
                          'bg-orange-400'
                        }`}>
                          <Trophy className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* League Stats Summary */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">League Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{dummyLeaderboard.length}</div>
                      <div className="text-xs text-gray-500">Teams</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {dummyLeaderboard.reduce((sum, team) => sum + team.wins, 0)}
                      </div>
                      <div className="text-xs text-gray-500">Total Wins</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {dummyLeaderboard.reduce((sum, team) => sum + team.losses, 0)}
                      </div>
                      <div className="text-xs text-gray-500">Total Losses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {dummyLeaderboard.reduce((sum, team) => sum + team.points, 0)}
                      </div>
                      <div className="text-xs text-gray-500">Total Points</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}