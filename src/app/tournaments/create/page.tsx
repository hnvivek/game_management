'use client'

import { Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TournamentBuilder from '@/components/booking/TournamentBuilder'
import Navbar from '@/components/navbar'

export default function CreateTournamentPage() {
  const handleTournamentCreate = (tournament: any) => {
    console.log('Tournament created:', tournament)
    // In a real app, redirect to tournament details page
    window.location.href = `/tournaments/${tournament.tournament.id}`
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Unified Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Create Tournament</h1>
          </div>
          <p className="text-muted-foreground">
            Organize and manage your sports tournament with our comprehensive tools
          </p>
        </div>

        <TournamentBuilder onTournamentCreate={handleTournamentCreate} />
      </main>
    </div>
  )
}