'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CourtForm from '@/components/courts/CourtForm'
import { UniversalBreadcrumb } from '@/components/features/admin/UniversalBreadcrumb'

export default function EditCourtPage() {
  const params = useParams()
  const router = useRouter()
  const [court, setCourt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { vendorId, venueId, courtId } = params as {
    vendorId: string;
    venueId: string;
    courtId: string
  }

  useEffect(() => {
    fetchCourtDetails()
  }, [vendorId, venueId, courtId])

  const fetchCourtDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/courts/${courtId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 404) {
          setError('Court not found')
        } else if (response.status === 403) {
          setError('Access denied')
        } else {
          setError('Failed to fetch court details')
        }
        return
      }

      const result = await response.json()
      if (result.success) {
        setCourt(result.data)
      } else {
        setError(result.error || 'Failed to fetch court details')
      }
    } catch (error) {
      console.error('Error fetching court details:', error)
      setError('Error fetching court details')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = (savedCourt: any) => {
    // Navigate back to the previous page
    router.back()
  }

  const handleCancel = () => {
    // Navigate back to the previous page
    router.back()
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !court) {
    return (
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <UniversalBreadcrumb />

        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Court Not Found</h3>
          <p className="text-muted-foreground mb-4">
            {error || 'The court you\'re looking for doesn\'t exist or you don\'t have access to it.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <UniversalBreadcrumb />

      <CourtForm
        vendorId={vendorId}
        venueId={venueId}
        court={court}
        mode="edit"
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  )
}