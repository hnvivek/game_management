'use client'

import { useState } from 'react'
import { ArrowLeft, Heart, MessageCircle, Share2, Calendar, MapPin, Trophy, Users, Camera, Edit, MoreHorizontal, Star, Target, Zap, Shield, Medal, Flag, Gamepad2, TrendingUp, Award, Clock, Activity, BarChart3, UserPlus, Settings, Bell, Grid3x3, List, ChevronRight, Home, Target as TargetIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'

// Real team data with theme colors
const teamData = {
  id: 1,
  name: 'Arsenal FC',
  logo: 'https://1000logos.net/wp-content/uploads/2016/10/Arsenal-Logo.png',
  primaryColor: 'hsl(0, 100%, 47%)',
  secondaryColor: 'hsl(210, 100%, 22%)',
  accentColor: 'hsl(35, 40%, 45%)',
  level: 'Intermediate',
  founded: '1886',
  city: 'Bengaluru',
  description: '⚡ The Gunners! Passion, precision, and beautiful football on the local pitch!',
  stats: {
    wins: 12,
    losses: 3,
    draws: 2,
    points: 38,
    rank: 2,
    winRate: 75,
    goalsScored: 35,
    goalsConceded: 15,
    matchesPlayed: 17
  },
  achievements: [
    { id: 1, name: 'Unbeaten Run', icon: '🔥', description: '5 matches without defeat', color: 'bg-gradient-to-r from-red-500 to-orange-500' },
    { id: 2, name: 'Top Scorers', icon: '⚽', description: 'Most goals this month', color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
    { id: 3, name: 'Team Spirit', icon: '💪', description: 'Best teamwork award', color: 'bg-gradient-to-r from-blue-500 to-indigo-500' }
  ],
  members: [
    { id: 1, name: 'Alex Johnson', role: 'Captain', avatar: '/alex.jpg', joinDate: '2023-01', goals: 12, assists: 8, position: 'Forward', number: 10 },
    { id: 2, name: 'Sam Wilson', role: 'Goalkeeper', avatar: '/sam.jpg', joinDate: '2023-02', goals: 0, assists: 2, position: 'Goalkeeper', number: 1 },
    { id: 3, name: 'Mike Chen', role: 'Striker', avatar: '/mike.jpg', joinDate: '2023-03', goals: 18, assists: 5, position: 'Forward', number: 9 },
    { id: 4, name: 'David Lee', role: 'Midfielder', avatar: '/david.jpg', joinDate: '2023-04', goals: 5, assists: 12, position: 'Midfielder', number: 7 }
  ],
  upcomingMatches: [
    { id: 1, opponent: 'Manchester United', date: '2024-01-21', time: '19:30', venue: '3Lok Football Fitness Hub', isNext: true },
    { id: 2, opponent: 'Chelsea FC', date: '2024-01-25', time: '18:00', venue: '3Lok Football Fitness Hub', isNext: false },
    { id: 3, opponent: 'Liverpool FC', date: '2024-01-28', time: '20:00', venue: '3Lok Football Fitness Hub', isNext: false }
  ],
  recentResults: [
    { id: 1, opponent: 'Bayern Munich', score: '3-1', result: 'Win', date: '2024-01-15', goalsFor: 3, goalsAgainst: 1 },
    { id: 2, opponent: 'Liverpool FC', score: '2-2', result: 'Draw', date: '2024-01-10', goalsFor: 2, goalsAgainst: 2 },
    { id: 3, opponent: 'Chelsea FC', score: '4-0', result: 'Win', date: '2024-01-05', goalsFor: 4, goalsAgainst: 0 }
  ],
  recentForm: ['W', 'W', 'D', 'W', 'L']
}

const wallPosts = [
  {
    id: 1,
    author: { name: 'Alex Johnson', avatar: '/alex.jpg', role: 'Captain' },
    content: '🔥 INCREDIBLE MATCH TODAY! Team energy was off the charts! That last-minute goal was pure magic! Ready to take on Lightning Bolts next week! 💪⚽',
    image: '/victory1.jpg',
    timestamp: '2 hours ago',
    likes: 24,
    comments: 8,
    liked: false,
    mood: 'excited'
  },
  {
    id: 2,
    author: { name: 'Sam Wilson', avatar: '/sam.jpg', role: 'Goalkeeper' },
    content: '🥅 Clean sheet today! Defense was solid as a rock! Special thanks to Mike for those incredible saves in the final minutes. Teamwork makes the dream work! 🌟',
    image: '/defense.jpg',
    timestamp: '1 day ago',
    likes: 45,
    comments: 12,
    liked: true,
    mood: 'proud'
  },
  {
    id: 3,
    author: { name: 'Mike Chen', avatar: '/mike.jpg', role: 'Striker' },
    content: '🎯 Training session highlights! Working on those set pieces. Who\'s ready for our next match? Let\'s keep this winning momentum going! 🚀',
    image: null,
    timestamp: '2 days ago',
    likes: 18,
    comments: 6,
    liked: false,
    mood: 'focused'
  }
]

export default function TeamWall() {
  const [newPost, setNewPost] = useState('')
  const [posts, setPosts] = useState(wallPosts)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
        : post
    ))
  }

  const handleCreatePost = () => {
    if (newPost.trim()) {
      const post = {
        id: posts.length + 1,
        author: { name: 'Alex Johnson', avatar: '/alex.jpg', role: 'Captain' },
        content: newPost,
        image: null,
        timestamp: 'Just now',
        likes: 0,
        comments: 0,
        liked: false,
        mood: 'neutral'
      }
      setPosts([post, ...posts])
      setNewPost('')
      setShowCreatePost(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Professional Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="p-2 hover:bg-muted">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg">
                    TS
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{teamData.name}</h1>
                  <p className="text-sm text-muted-foreground">{teamData.level} • {teamData.city}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="p-2 hover:bg-muted">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-muted">
                <Settings className="h-5 w-5" />
              </Button>
              <Button size="sm" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Compact Gamified Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-700 text-white relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-300 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Team Logo with Animated Ring */}
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                <div className="relative w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
                  <img 
                    src={teamData.logo} 
                    alt={teamData.name}
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement.innerHTML = '<span class="text-3xl font-bold bg-gradient-to-br from-red-600 to-red-800 bg-clip-text text-transparent">AFC</span>';
                    }}
                  />
                </div>
                {/* Rank Badge */}
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg border-2 border-white">
                  #{teamData.stats.rank}
                </div>
              </div>
              
              {/* Team Info */}
              <div>
                <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
                  {teamData.name}
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    {teamData.level}
                  </Badge>
                </h1>
                <p className="text-orange-100 text-sm mb-3">{teamData.description}</p>
                
                {/* Quick Stats Bar */}
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-1">
                    <Trophy className="h-4 w-4 text-yellow-300" />
                    <span className="font-semibold">{teamData.stats.points} pts</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Target className="h-4 w-4 text-green-300" />
                    <span className="font-semibold">{teamData.stats.winRate}% win</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="h-4 w-4 text-yellow-300" />
                    <span className="font-semibold">{teamData.stats.goalsScored} goals</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4 text-red-300" />
                    <span>{teamData.city}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              <Button size="sm" className="bg-white text-red-600 hover:bg-red-50 font-semibold shadow-lg">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Players
              </Button>
              <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/20 font-medium">
                <Settings className="h-4 w-4 mr-2" />
                Manage Team
              </Button>
            </div>
          </div>
          
          {/* Achievement Badges */}
          <div className="flex items-center space-x-4 mt-6">
            {teamData.achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                <span className="text-lg">{achievement.icon}</span>
                <span className="text-xs font-medium">{achievement.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Grid3x3 },
              { id: 'matches', label: 'Matches', icon: TargetIcon },
              { id: 'squad', label: 'Squad', icon: Users },
              { id: 'stats', label: 'Statistics', icon: BarChart3 },
              { id: 'wall', label: 'Team Wall', icon: Activity }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-destructive text-destructive'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Next Match Card */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-destructive to-orange-500"></div>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold flex items-center">
                  <Clock className="h-6 w-6 mr-3 text-destructive" />
                  Next Match
                  <Badge className="ml-3 bg-destructive text-destructive-foreground animate-pulse">LIVE SOON</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teamData.upcomingMatches.filter(m => m.isNext).map((match) => (
                  <div key={match.id} className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200 relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-500 rounded-full"></div>
                    </div>
                    
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg mb-2">
                            <img 
                              src={teamData.logo} 
                              alt={teamData.name}
                              className="w-12 h-12 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement.innerHTML = '<span class="text-xl font-bold text-red-600">AFC</span>';
                              }}
                            />
                          </div>
                          <p className="text-sm font-semibold">{teamData.name}</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-400 mb-1">VS</div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Match</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center shadow-lg mb-2">
                            <span className="text-xl font-bold text-gray-600">?</span>
                          </div>
                          <p className="text-sm font-semibold">{match.opponent}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="bg-white rounded-lg p-3 shadow-sm mb-2">
                          <p className="text-sm font-semibold text-gray-900">{match.date}</p>
                          <p className="text-sm text-gray-600">{match.time}</p>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {match.venue}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Recent Results */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold flex items-center">
                      <TrendingUp className="h-6 w-6 mr-3 text-red-600" />
                      Recent Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {teamData.recentResults.map((result, index) => (
                        <div key={result.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md ${
                          result.result === 'Win' ? 'bg-green-50 border-green-200' : 
                          result.result === 'Draw' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${
                              result.result === 'Win' ? 'bg-green-500' : 
                              result.result === 'Draw' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <div>
                              <p className="font-semibold">{result.opponent}</p>
                              <p className="text-sm text-gray-500">{result.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">{result.score}</p>
                            <Badge variant={result.result === 'Win' ? 'default' : 'secondary'} className="text-xs">
                              {result.result}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Team Performance */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold flex items-center">
                      <BarChart3 className="h-6 w-6 mr-3 text-red-600" />
                      Team Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="text-3xl font-bold text-green-600">{teamData.stats.wins}</div>
                        <div className="text-sm text-green-600 font-medium">Wins</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                        <div className="text-3xl font-bold text-red-600">{teamData.stats.losses}</div>
                        <div className="text-sm text-red-600 font-medium">Losses</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                        <div className="text-3xl font-bold text-yellow-600">{teamData.stats.draws}</div>
                        <div className="text-sm text-yellow-600 font-medium">Draws</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="text-3xl font-bold text-blue-600">{teamData.stats.points}</div>
                        <div className="text-sm text-blue-600 font-medium">Points</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Win Rate</span>
                        <span className="text-sm font-bold text-red-600">{teamData.stats.winRate}%</span>
                      </div>
                      <div className="relative">
                        <Progress value={teamData.stats.winRate} className="h-3" />
                        <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-600 rounded-full" style={{ width: `${teamData.stats.winRate}%` }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {/* Top Performers */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold flex items-center">
                      <Star className="h-5 w-5 mr-2 text-red-600" />
                      Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {teamData.members.slice(0, 3).map((member, index) => (
                      <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                            {member.number}
                          </div>
                          {index === 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                              <Star className="h-2 w-2 text-white fill-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.position}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">{member.goals}</p>
                          <p className="text-xs text-gray-500">goals</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold flex items-center">
                      <Target className="h-5 w-5 mr-2 text-red-600" />
                      Team Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-blue-700">Goals Scored</span>
                      <span className="text-lg font-bold text-blue-600">{teamData.stats.goalsScored}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium text-red-700">Goals Conceded</span>
                      <span className="text-lg font-bold text-red-600">{teamData.stats.goalsConceded}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-green-700">Goal Difference</span>
                      <span className="text-lg font-bold text-green-600">+{teamData.stats.goalsScored - teamData.stats.goalsConceded}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-purple-700">Matches Played</span>
                      <span className="text-lg font-bold text-purple-600">{teamData.stats.matchesPlayed}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Squad Tab */}
        {activeTab === 'squad' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamData.members.map((member) => (
              <Card key={member.id} className="shadow-sm border-0 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {member.number}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      <p className="text-gray-500">{member.position}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Role</span>
                      <span className="font-medium">{member.role}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Goals</span>
                      <span className="font-medium">{member.goals}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Assists</span>
                      <span className="font-medium">{member.assists}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Joined</span>
                      <span className="font-medium">{member.joinDate}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-6">
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Upcoming Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamData.upcomingMatches.map((match) => (
                    <div key={match.id} className="border-l-4 border-orange-500 pl-4 py-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">vs {match.opponent}</h4>
                          <p className="text-sm text-gray-500">{match.venue}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{match.date} • {match.time}</p>
                          <Badge variant="outline" className="text-xs">{match.type}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{teamData.stats.matchesPlayed}</div>
                      <div className="text-sm text-blue-600">Matches Played</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">{teamData.stats.points}</div>
                      <div className="text-sm text-purple-600">Total Points</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Team Wall Tab */}
        {activeTab === 'wall' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Create Post */}
            <Card className="shadow-sm border-0">
              <CardContent className="p-4">
                <div className="flex space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                    AJ
                  </div>
                  <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="flex-1 justify-start text-gray-500 h-12 border-gray-200 hover:border-orange-300"
                      >
                        Share team updates, victories, or training highlights...
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Create Team Post</DialogTitle>
                        <DialogDescription>
                          Share updates with your team
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <Textarea
                          placeholder="What's happening with the team?"
                          value={newPost}
                          onChange={(e) => setNewPost(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Camera className="h-4 w-4 mr-2" />
                            Add Photo
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowCreatePost(false)} className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">Cancel</Button>
                        <Button onClick={handleCreatePost} className="bg-red-600 hover:bg-red-700 text-white font-medium">Post</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="shadow-sm border-0 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                          {post.author.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900">{post.author.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {post.author.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">{post.timestamp}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-gray-800 leading-relaxed">{post.content}</p>
                    {post.image && (
                      <div className="rounded-lg overflow-hidden">
                        <img 
                          src={post.image} 
                          alt="Post image" 
                          className="w-full h-64 object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`flex items-center space-x-1 font-medium ${post.liked ? 'text-red-600 hover:text-red-700' : 'text-gray-600 hover:text-gray-700'}`}
                          onClick={() => handleLike(post.id)}
                        >
                          <Heart className={`h-4 w-4 ${post.liked ? 'fill-current' : ''}`} />
                          <span className="text-sm">{post.likes}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 font-medium">
                          <MessageCircle className="h-4 w-4" />
                          <span className="text-sm">{post.comments}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 font-medium">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}