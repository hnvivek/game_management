'use client'

import { Users } from 'lucide-react'
import TeamManager from '@/components/features/booking/TeamManager'
import Navbar from '@/components/navbar'

export default function ManageTeamsPage() {
  const handleTeamSelect = (team: any) => {
    console.log('Team selected:', team)
    // In a real app, redirect to team details page
    window.location.href = `/teams/${team.id}`
  }

  const handleCreateTeam = (team: any) => {
    console.log('Team created:', team)
    // In a real app, redirect to team details page
    window.location.href = `/teams/${team.id}`
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Unified Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Manage Teams</h1>
          </div>
          <p className="text-muted-foreground">
            Create and manage your sports teams, invite members, and track team performance
          </p>
        </div>

        <TeamManager
          onTeamSelect={handleTeamSelect}
          onCreateTeam={handleCreateTeam}
          showCreateButton={true}
        />
      </main>
    </div>
  )
}