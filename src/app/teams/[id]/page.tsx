'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Users,
  Trophy,
  TrendingUp,
  Shield,
  Star,
  Calendar,
  MapPin,
  Plus,
  Settings,
  UserPlus,
  BarChart3,
  Target,
  Clock,
  Loader2,
  Edit
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navbar from '@/components/navbar'
import { toast } from 'sonner'

// Types
interface TeamMember {
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  joinedAt: string
  statistics?: {
    totalMatches: number
    totalWins: number
    totalLosses: number
    totalDraws: number
    winRate: number
    averageScorePerMatch: number
  }
}

interface Team {
  id: string
  name: string
  description?: string
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PROFESSIONAL'
  vendor?: {
    id: string
    name: string
    primaryColor?: string
    secondaryColor?: string
  }
  members: TeamMember[]
  statistics?: {
    totalMatches: number
    totalWins: number
    totalLosses: number
    totalDraws: number
    winRate: number
    averageScorePerMatch: number
    recentForm: Array<{
      result: 'WIN' | 'LOSS' | 'DRAW'
      matchId: string
      playedAt: string
    }>
  }
  createdAt: string
  updatedAt: string
  _count?: {
    members: number
    matchesAsTeam1: number
    matchesAsTeam2: number
  }
}

export default function TeamDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string

  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Form states
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'MEMBER' as const
  })

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    level: 'INTERMEDIATE' as const
  })

  // Fetch team details
  const fetchTeam = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teams/${teamId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Team not found')
        }
        throw new Error('Failed to fetch team details')
      }

      const data = await response.json()
      setTeam(data.team)
      setEditForm({
        name: data.team.name,
        description: data.team.description || '',
        level: data.team.level
      })
      setError(null)
    } catch (err) {
      console.error('Error fetching team:', err)
      setError(err instanceof Error ? err.message : 'Failed to load team')
      toast.error('Failed to load team details')
    } finally {
      setLoading(false)
    }
  }

  // Invite member
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteForm),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to invite member')
      }

      toast.success('Member invited successfully!')
      setShowInviteDialog(false)
      setInviteForm({ email: '', role: 'MEMBER' })
      fetchTeam() // Refresh team data
    } catch (err) {
      console.error('Error inviting member:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to invite member')
    }
  }

  // Update team
  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update team')
      }

      toast.success('Team updated successfully!')
      setShowEditDialog(false)
      fetchTeam() // Refresh team data
    } catch (err) {
      console.error('Error updating team:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to update team')
    }
  }

  // Remove member
  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove member')
      }

      toast.success('Member removed successfully!')
      fetchTeam() // Refresh team data
    } catch (err) {
      console.error('Error removing member:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  useEffect(() => {
    if (teamId) {
      fetchTeam()
    }
  }, [teamId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading team details...</span>
        </div>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="text-red-500 mb-4">❌</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {error || 'Team not found'}
            </h3>
            <p className="text-muted-foreground mb-4">
              The team you're looking for doesn't exist or you don't have access to it.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Link href="/teams">
                <Button>Browse Teams</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentUserRole = team.members.find(m => m.user.email === 'user@example.com')?.role // TODO: Get current user

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
              <div className="flex items-center gap-3">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center border"
                  style={{
                    backgroundColor: team.vendor?.primaryColor ? `${team.vendor.primaryColor}20` : 'hsl(var(--muted))',
                    borderColor: team.vendor?.primaryColor || 'hsl(var(--border))'
                  }}
                >
                  <span
                    className="text-xl font-bold"
                    style={{ color: team.vendor?.primaryColor || 'hsl(var(--foreground))' }}
                  >
                    {team.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{team.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{team.level}</Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{team.members.length} members</span>
                    </div>
                    {team.vendor && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{team.vendor.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') && (
                <>
                  <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Team</DialogTitle>
                        <DialogDescription>
                          Update team information
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleUpdateTeam} className="space-y-4">
                        <div>
                          <Label htmlFor="edit-name">Team Name</Label>
                          <Input
                            id="edit-name"
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-description">Description</Label>
                          <Textarea
                            id="edit-description"
                            value={editForm.description}
                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-level">Skill Level</Label>
                          <Select value={editForm.level} onValueChange={(value: any) => setEditForm(prev => ({ ...prev, level: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BEGINNER">Beginner</SelectItem>
                              <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                              <SelectItem value="ADVANCED">Advanced</SelectItem>
                              <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Save Changes</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                          Add a new member to your team
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleInviteMember} className="space-y-4">
                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={inviteForm.email}
                            onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Enter email address"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="role">Role</Label>
                          <Select value={inviteForm.role} onValueChange={(value: any) => setInviteForm(prev => ({ ...prev, role: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MEMBER">Member</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Send Invite</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              <Button size="sm">
                <Trophy className="h-4 w-4 mr-2" />
                Challenge
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {team.description && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{team.description}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Performance Overview */}
            {team.statistics && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      <span className="text-sm font-medium text-muted-foreground">Total Wins</span>
                    </div>
                    <div className="text-2xl font-bold mt-2">{team.statistics.totalWins}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-medium text-muted-foreground">Win Rate</span>
                    </div>
                    <div className="text-2xl font-bold mt-2">{team.statistics.winRate.toFixed(1)}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium text-muted-foreground">Total Matches</span>
                    </div>
                    <div className="text-2xl font-bold mt-2">{team.statistics.totalMatches}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-500" />
                      <span className="text-sm font-medium text-muted-foreground">Avg Score</span>
                    </div>
                    <div className="text-2xl font-bold mt-2">{team.statistics.averageScorePerMatch.toFixed(1)}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Form */}
            {team.statistics?.recentForm && team.statistics.recentForm.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Form</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {team.statistics.recentForm.slice(0, 10).map((result, idx) => (
                      <div key={idx} className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold ${
                        result.result === 'WIN' ? 'bg-emerald-500 text-white' :
                        result.result === 'DRAW' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {result.result[0]}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {team.members.map((member) => (
                    <div key={member.user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="font-semibold">
                            {member.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.user.name}</div>
                          <div className="text-sm text-muted-foreground">{member.user.email}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {member.role}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              Joined {new Date(member.joinedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.statistics && (
                          <div className="text-right mr-4">
                            <div className="text-sm font-medium">{member.statistics.winRate.toFixed(1)}% win rate</div>
                            <div className="text-xs text-muted-foreground">
                              {member.statistics.totalMatches} matches
                            </div>
                          </div>
                        )}
                        {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') &&
                         member.role !== 'OWNER' &&
                         member.user.email !== 'user@example.com' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No matches yet</h3>
                  <p className="text-muted-foreground">This team hasn't played any matches yet.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {team.statistics ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="font-medium">Performance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Matches</span>
                          <span className="font-medium">{team.statistics.totalMatches}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Wins</span>
                          <span className="font-medium text-emerald-600">{team.statistics.totalWins}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Draws</span>
                          <span className="font-medium text-amber-600">{team.statistics.totalDraws}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Losses</span>
                          <span className="font-medium text-red-600">{team.statistics.totalLosses}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Win Rate</span>
                          <span className="font-medium">{team.statistics.winRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">Scoring</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Average Score per Match</span>
                          <span className="font-medium">{team.statistics.averageScorePerMatch.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No statistics yet</h3>
                    <p className="text-muted-foreground">Play some matches to see team statistics.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}