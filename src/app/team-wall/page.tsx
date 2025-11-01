'use client'

import { useState, useEffect } from 'react'
import { Search, Users, Trophy, Plus, MapPin, Star, Calendar, Filter, User, Crown, ArrowLeft, Heart, MessageCircle, Share2, Camera, Edit, MoreHorizontal, Target, Zap, Shield, Medal, Flag, Gamepad2, TrendingUp, Award, Clock, Activity, BarChart3, Settings, Bell, Grid3x3, List, ChevronRight, Home, Target as TargetIcon } from 'lucide-react'
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
import Navbar from '@/components/navbar'
import { toast } from 'sonner'

// Types for data
interface Team {
  id: string
  name: string
  city: string
  area?: string
  description?: string
  isActive: boolean
  createdAt: string
  sport?: {
    id: string
    name: string
    displayName: string
    icon: string
  }
  captain?: {
    id: string
    name: string
    phone?: string
  }
  members?: {
    id: string
    user: {
      id: string
      name: string
      phone?: string
    }
    role: 'CAPTAIN' | 'MEMBER'
    joinedAt: string
  }[]
  _count?: {
    members: number
  }
}

interface User {
  id: string
  name: string
  email?: string
  phone?: string
}

// Mock current user - in real app, this would come from auth context
const currentUser: User = {
  id: 'user_123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890'
}

export default function TeamWall() {
  const [searchQuery, setSearchQuery] = useState('')
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [teamsImIn, setTeamsImIn] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  // Fetch teams data
  const fetchTeamsData = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/teams')
      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }

      const data = await response.json()
      const teams = data.teams || []

      // Process teams to categorize them
      const ownedTeams: Team[] = []
      const memberTeams: Team[] = []

      teams.forEach((team: Team) => {
        // Check if user is captain/owner
        if (team.captain?.id === currentUser.id) {
          ownedTeams.push(team)
        }

        // Check if user is a member
        const isMember = team.members?.some(member => member.user.id === currentUser.id)
        if (isMember && !ownedTeams.find(t => t.id === team.id)) {
          memberTeams.push(team)
        }
      })

      setAllTeams(teams)
      setMyTeams(ownedTeams)
      setTeamsImIn(memberTeams)
      setError(null)
    } catch (err) {
      console.error('Error fetching teams:', err)
      setError('Failed to load teams')
      toast.error('Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamsData()
  }, [])

  // Filter teams based on search query
  const filterTeams = (teams: Team[]) => {
    if (!searchQuery) return teams

    const query = searchQuery.toLowerCase()
    return teams.filter(team =>
      team.name.toLowerCase().includes(query) ||
      team.city.toLowerCase().includes(query) ||
      team.area?.toLowerCase().includes(query) ||
      team.description?.toLowerCase().includes(query) ||
      team.sport?.displayName.toLowerCase().includes(query)
    )
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-success/10 text-success border-success/20'
      : 'bg-muted text-foreground border-border'
  }

  const getRoleBadge = (team: Team) => {
    if (team.captain?.id === currentUser.id) {
      return (
        <Badge className="bg-warning/10 text-warning border-amber-200">
          <Crown className="h-3 w-3 mr-1" />
          Captain
        </Badge>
      )
    }

    const member = team.members?.find(m => m.user.id === currentUser.id)
    if (member) {
      return (
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
          <User className="h-3 w-3 mr-1" />
          Member
        </Badge>
      )
    }

    return null
  }

  const TeamCard = ({ team, showRole = false }: { team: Team; showRole?: boolean }) => (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
      <Link href={`/teams/${team.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {team.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                    {team.name}
                    {team.sport && (
                      <span className="text-lg">{team.sport.icon}</span>
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {team.city}{team.area && `, ${team.area}`}
                  </CardDescription>
                </div>
              </div>
              {team.description && (
                <CardDescription className="line-clamp-2 ml-13">
                  {team.description}
                </CardDescription>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="secondary" className={getStatusColor(team.isActive)}>
                {team.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {showRole && getRoleBadge(team)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              {team._count?.members || team.members?.length || 0} members
            </div>
            {team.captain && (
              <div className="flex items-center text-muted-foreground">
                <Crown className="h-4 w-4 mr-1 text-warning" />
                {team.captain.name}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Created {new Date(team.createdAt).toLocaleDateString()}
            </div>
            {team.sport && (
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-warning" />
                <span>{team.sport.displayName}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < 4 ? 'text-amber-400 fill-current' : 'text-gray-300'}`}
                />
              ))}
              <span className="text-sm text-muted-foreground">(4.0)</span>
            </div>
            <Button variant="ghost" size="sm" className="text-primary group-hover:text-primary p-0 h-auto">
              View Team <Trophy className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  )

  const LoadingSkeleton = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(6).fill(0).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="h-10 w-10 bg-muted/50 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-muted/50 rounded w-32"></div>
                  <div className="h-4 bg-muted/50 rounded w-40"></div>
                  <div className="h-4 bg-muted/50 rounded w-28"></div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-6 bg-muted/50 rounded w-16"></div>
                <div className="h-6 bg-muted/50 rounded w-20"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-muted/50 rounded w-20"></div>
              <div className="h-4 bg-muted/50 rounded w-24"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="h-4 bg-muted/50 rounded w-28"></div>
              <div className="h-4 bg-muted/50 rounded w-20"></div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="h-4 bg-muted/50 rounded w-24"></div>
              <div className="h-8 bg-muted/50 rounded w-20"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />

      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                Teams Wall
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your teams and discover new ones to join
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Link href="/teams">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              </Link>
            </div>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-primary/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{allTeams.length}</div>
                <div className="text-sm text-primary">All Teams</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-warning">{myTeams.length}</div>
                <div className="text-sm text-warning">My Teams</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-success/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-success">{teamsImIn.length}</div>
                <div className="text-sm text-success">Teams Joined</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-warning/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-warning">
                  {myTeams.length + teamsImIn.length}
                </div>
                <div className="text-sm text-warning">Total Participation</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Teams Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-96">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Teams ({allTeams.length})
            </TabsTrigger>
            <TabsTrigger value="my" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              My Teams ({myTeams.length})
            </TabsTrigger>
            <TabsTrigger value="joined" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Teams I'm In ({teamsImIn.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {loading ? (
              <LoadingSkeleton />
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-destructive mb-4">❌</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Error loading teams</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={fetchTeamsData}>Try Again</Button>
              </div>
            ) : filterTeams(allTeams).length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchQuery ? 'No teams found' : 'No teams yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Be the first to create a team and start building the community!'
                  }
                </p>
                {!searchQuery && (
                  <Link href="/teams">
                    <Button>Create Team</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterTeams(allTeams).map((team) => (
                  <TeamCard key={team.id} team={team} showRole={true} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my" className="space-y-6">
            {loading ? (
              <LoadingSkeleton />
            ) : myTeams.length === 0 ? (
              <div className="text-center py-12">
                <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No teams owned</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't created any teams yet. Start by creating your first team!
                </p>
                <Link href="/teams">
                  <Button>Create Team</Button>
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterTeams(myTeams).map((team) => (
                  <TeamCard key={team.id} team={team} showRole={true} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="joined" className="space-y-6">
            {loading ? (
              <LoadingSkeleton />
            ) : teamsImIn.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No teams joined</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't joined any teams yet. Browse available teams and request to join!
                </p>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('all')}
                >
                  Browse Teams
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterTeams(teamsImIn).map((team) => (
                  <TeamCard key={team.id} team={team} showRole={true} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}