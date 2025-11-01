'use client'

import { useState, useEffect } from 'react'
import { Trophy, TrendingUp, Medal, Crown, Filter, Users, Target, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navbar from '@/components/navbar'
import { theme } from '@/lib/theme'

// Mock leaderboard data - in real app this would come from API
const mockLeaderboardData = [
  { rank: 1, team: 'Liverpool FC', teamId: 3, points: 45, wins: 14, losses: 2, level: 'Advanced', sportId: 1, sportName: 'Football', logo: 'https://1000logos.net/wp-content/uploads/2017/04/Liverpool-Logo.png', recentForm: ['W', 'W', 'W', 'D', 'W'] },
  { rank: 2, team: 'Arsenal FC', teamId: 1, points: 38, wins: 12, losses: 3, level: 'Intermediate', sportId: 1, sportName: 'Football', logo: 'https://1000logos.net/wp-content/uploads/2016/10/Arsenal-Logo.png', recentForm: ['W', 'W', 'D', 'W', 'L'] },
  { rank: 3, team: 'Chelsea FC', teamId: 4, points: 35, wins: 11, losses: 4, level: 'Intermediate', sportId: 1, sportName: 'Football', logo: 'https://1000logos.net/wp-content/uploads/2016/11/Chelsea-Logo.png', recentForm: ['D', 'W', 'L', 'W', 'W'] },
  { rank: 4, team: 'Royal Challengers', teamId: 5, points: 32, wins: 10, losses: 5, level: 'Advanced', sportId: 2, sportName: 'Cricket', logo: 'https://1000logos.net/wp-content/uploads/2021/04/Royal-Challengers-Bangalore-Logo.png', recentForm: ['W', 'W', 'W', 'W', 'D'] },
  { rank: 5, team: 'Manchester United', teamId: 2, points: 20, wins: 6, losses: 9, level: 'Beginner', sportId: 1, sportName: 'Football', logo: 'https://1000logos.net/wp-content/uploads/2017/03/Manchester-United-Logo.png', recentForm: ['L', 'D', 'W', 'L', 'D'] },
  { rank: 6, team: 'Mumbai Indians', teamId: 6, points: 28, wins: 9, losses: 6, level: 'Intermediate', sportId: 2, sportName: 'Cricket', logo: 'https://1000logos.net/wp-content/uploads/2021/04/Mumbai-Indians-Logo.png', recentForm: ['W', 'D', 'W', 'L', 'W'] }
]

interface Sport {
  id: number
  name: string
  displayName: string
  icon: string
  isActive: boolean
}

export default function LeaderboardPage() {
  const [sportFilter, setSportFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch sports data
  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await fetch('/api/sports')
        const data = await response.json()
        setSports(data.sports || [])
      } catch (error) {
        console.error('Error fetching sports:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSports()
  }, [])

  const filteredLeaderboard = mockLeaderboardData.filter(entry => {
    const matchesSport = sportFilter === 'all' || entry.sportId.toString() === sportFilter
    const matchesLevel = levelFilter === 'all' || entry.level.toLowerCase() === levelFilter.toLowerCase()
    return matchesSport && matchesLevel
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Crown className="h-12 w-12 text-primary-foreground drop-shadow-lg" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-2 tracking-tight">Leaderboard</h1>
          <p className="text-base text-primary-foreground/90 font-medium">Bengaluru Sports League Rankings</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">

        {/* League Statistics - Now at top */}
        <Card className="shadow-lg border-0 bg-card mb-6">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
              <div className="p-1.5 bg-secondary-50 rounded-lg">
                <TrendingUp className="h-4 w-4 text-secondary-600" />
              </div>
              League Overview
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Performance metrics across all teams and competitions
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-200">
                <div className="flex justify-center mb-2">
                  <div className="p-2 bg-secondary-50 rounded-lg group-hover:bg-secondary-100 transition-colors">
                    <Users className="h-4 w-4 text-secondary-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {filteredLeaderboard.length}
                </div>
                <div className="text-xs text-muted-foreground font-medium">Teams</div>
              </div>
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-200">
                <div className="flex justify-center mb-2">
                  <div className="p-2 bg-success-50 rounded-lg group-hover:bg-success-100 transition-colors">
                    <Target className="h-4 w-4 text-success-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {filteredLeaderboard.reduce((sum, team) => sum + team.wins, 0)}
                </div>
                <div className="text-xs text-muted-foreground font-medium">Total Wins</div>
              </div>
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-200">
                <div className="flex justify-center mb-2">
                  <div className="p-2 bg-error-50 rounded-lg group-hover:bg-error-100 transition-colors">
                    <Activity className="h-4 w-4 text-error-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {filteredLeaderboard.reduce((sum, team) => sum + team.losses, 0)}
                </div>
                <div className="text-xs text-muted-foreground font-medium">Total Losses</div>
              </div>
              <div className="text-center group hover:transform hover:scale-105 transition-all duration-200">
                <div className="flex justify-center mb-2">
                  <div className="p-2 bg-warning-50 rounded-lg group-hover:bg-warning-100 transition-colors">
                    <Trophy className="h-4 w-4 text-warning-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {filteredLeaderboard.reduce((sum, team) => sum + team.points, 0)}
                </div>
                <div className="text-xs text-muted-foreground font-medium">Total Points</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Filters Section */}
        <Card className="shadow-md border-0 bg-card mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              Filter Teams
              {(sportFilter !== 'all' || levelFilter !== 'all') && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {filteredLeaderboard.length} of {mockLeaderboardData.length} teams
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-secondary-500 rounded-full"></div>
                  Sport Type
                </label>
                <Select value={sportFilter} onValueChange={setSportFilter} disabled={loading}>
                  <SelectTrigger className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <SelectValue placeholder={loading ? "Loading sports..." : "All Sports"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                        All Sports
                      </div>
                    </SelectItem>
                    {sports.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-secondary-500 rounded-full"></div>
                          {sport.displayName}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-success-500 rounded-full"></div>
                  Skill Level
                </label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                        All Levels
                      </div>
                    </SelectItem>
                    <SelectItem value="beginner">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-success-500 rounded-full"></div>
                        Beginner
                      </div>
                    </SelectItem>
                    <SelectItem value="intermediate">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-warning-500 rounded-full"></div>
                        Intermediate
                      </div>
                    </SelectItem>
                    <SelectItem value="advanced">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-error-500 rounded-full"></div>
                        Advanced
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(sportFilter !== 'all' || levelFilter !== 'all') && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Active filters:</span>
                  {sportFilter !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      Sport: {sports.find(s => s.id.toString() === sportFilter)?.displayName || sportFilter}
                    </Badge>
                  )}
                  {levelFilter !== 'all' && (
                    <Badge variant="outline" className="text-xs capitalize">
                      Level: {levelFilter}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning-500" />
              Team Rankings
            </h2>
            <div className="text-xs text-muted-foreground">
              Showing {filteredLeaderboard.length} of {mockLeaderboardData.length} teams
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-3">
          {loading ? (
            <Card className="text-center py-8">
              <CardContent>
                <div className="animate-spin w-8 h-8 border-4 border-secondary-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                <h3 className="text-base font-semibold text-foreground mb-1">Loading Leaderboard</h3>
                <p className="text-sm text-muted-foreground">Fetching the latest rankings...</p>
              </CardContent>
            </Card>
          ) : filteredLeaderboard.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trophy className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">No teams found</h3>
                <p className="text-sm text-muted-foreground mb-3">Try adjusting your filters to see more teams.</p>
                <div className="flex justify-center gap-2">
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-muted text-xs"
                    onClick={() => {
                      setSportFilter('all')
                      setLevelFilter('all')
                    }}
                  >
                    Clear All Filters
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredLeaderboard.map((entry) => (
            <Card key={entry.rank} className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
              entry.rank === 1 ? 'bg-gradient-to-r from-warning-50 via-warning-100 to-warning-50 border border-warning-300' :
              entry.rank === 2 ? 'bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 border border-border' :
              entry.rank === 3 ? 'bg-gradient-to-r from-orange-50 via-orange-100 to-orange-50 border border-orange-300' :
              'bg-card border border-border hover:border-border'
            }`}>
              {/* Top 3 Decorative Border */}
              {entry.rank <= 3 && (
                <div className={`absolute inset-x-0 h-0.5 ${
                  entry.rank === 1 ? 'bg-gradient-to-r from-warning-400 to-warning-500' :
                  entry.rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-500' : 'bg-gradient-to-r from-orange-400 to-orange-500'
                }`}></div>
              )}

              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Rank Circle */}
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-primary-foreground shadow-md ${
                      entry.rank === 1 ? 'bg-gradient-to-br from-warning-400 via-warning-500 to-warning-600' :
                      entry.rank === 2 ? 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600' :
                      entry.rank === 3 ? 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600' :
                      'bg-gradient-to-br from-secondary-400 via-secondary-500 to-secondary-600'
                    }`}>
                      <span className="text-sm font-bold">{entry.rank}</span>
                    </div>
                    {/* Top 3 Crown Indicator */}
                    {entry.rank <= 3 && (
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center ${
                        entry.rank === 1 ? 'bg-warning-300' :
                        entry.rank === 2 ? 'bg-gray-300' : 'bg-orange-300'
                      }`}>
                        <Crown className="h-1.5 w-1.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      {/* Team Section */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Team Logo */}
                        <div className="w-8 h-8 bg-card rounded-lg p-1 shadow-sm border border-gray-100 flex-shrink-0">
                          <img
                            src={entry.logo}
                            alt={entry.team}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              if (e.currentTarget.parentElement) {
                                e.currentTarget.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xs font-bold bg-muted rounded">${entry.team.split(' ').map(n => n[0]).join('')}</div>`
                              }
                            }}
                          />
                        </div>

                        {/* Team Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-foreground truncate mb-1">{entry.team}</h3>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-secondary-100 text-secondary-800 border-secondary-200 font-medium">
                              {entry.sportName}
                            </Badge>
                            <Badge variant="outline" className={`text-xs px-1.5 py-0.5 font-medium ${
                              entry.level === 'Advanced' ? 'border-error-200 text-error-700 bg-error-50' :
                              entry.level === 'Intermediate' ? 'border-warning-200 text-warning-700 bg-warning-50' :
                              'border-success-200 text-success-700 bg-success-50'
                            }`}>
                              {entry.level}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-medium">
                              {entry.wins}W • {entry.losses}L
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Performance Section */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Recent Form */}
                        <div className="hidden sm:block">
                          <div className="flex items-center gap-1">
                            {entry.recentForm.map((result, idx) => (
                              <div key={idx} className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                                result === 'W' ? 'bg-success-500 text-primary-foreground' :
                                result === 'D' ? 'bg-warning-500 text-primary-foreground' :
                                'bg-error-500 text-primary-foreground'
                              }`}>
                                {result}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Points Display */}
                        <div className="text-center">
                          <div className={`text-lg font-bold ${
                            entry.rank === 1 ? 'text-warning-600' :
                            entry.rank === 2 ? 'text-muted-foreground' :
                            entry.rank === 3 ? 'text-orange-600' : 'text-foreground'
                          }`}>
                            {entry.points}
                          </div>
                          <div className="text-xs text-muted-foreground font-medium">pts</div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Form */}
                    <div className="flex sm:hidden items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Form</div>
                        <div className="flex items-center gap-1">
                          {entry.recentForm.map((result, idx) => (
                            <div key={idx} className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                              result === 'W' ? 'bg-success-500 text-primary-foreground' :
                              result === 'D' ? 'bg-warning-500 text-primary-foreground' :
                              'bg-error-500 text-primary-foreground'
                            }`}>
                              {result}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
          )}
        </div>

        </main>
    </div>
  )
}
