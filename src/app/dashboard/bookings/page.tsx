'use client'

import { Calendar } from 'lucide-react'
import BookingDashboard from '@/components/features/booking/BookingDashboard'
import Navbar from '@/components/navbar'

export default function BookingsDashboardPage() {
  return (
    <div className="min-h-screen bg-muted">
      {/* Unified Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Bookings Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Track and manage all your venue bookings, payments, and performance metrics
          </p>
        </div>

        <BookingDashboard />
      </main>
    </div>
  )
}