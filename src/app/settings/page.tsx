'use client'

import { useState } from 'react'
import Navbar from '@/components/navbar'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-muted">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Settings</h1>
          <p className="text-muted-foreground">Settings page coming soon...</p>
        </div>
      </main>
    </div>
  )
}