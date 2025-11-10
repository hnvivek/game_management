'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CourtForm from '@/components/courts/CourtForm'
import { VendorLayout } from '@/components/features/vendor/VendorLayout'
import { VendorBreadcrumb } from '@/components/features/vendor/VendorBreadcrumb'
import { useVendor } from '@/hooks/use-vendor'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Card, CardContent } from '@/components/ui/card'

export default function EditCourtPage() {
  const params = useParams()
  const router = useRouter()
  const { vendorId } = useVendor()
  const venueId = params?.venueId as string
  const courtId = params?.courtId as string

  const [court, setCourt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (courtId) {
      fetchCourtDetails()
    }
  }, [courtId])

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
    // Navigate back to venue details
    router.push(`/vendor/venues/${venueId}`)
  }

  const handleCancel = () => {
    // Navigate back to venue details
    router.push(`/vendor/venues/${venueId}`)
  }

  if (loading) {
    return (
      <VendorLayout title="Edit Court" subtitle="Loading court details...">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </VendorLayout>
    )
  }

  if (error || !court) {
    return (
      <VendorLayout title="Edit Court" subtitle="Error loading court">
        <div className="p-6 space-y-6">
          <VendorBreadcrumb />
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Court Not Found</h3>
                <p className="text-muted-foreground mb-4">
                  {error || 'The court you\'re looking for doesn\'t exist or you don\'t have access to it.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </VendorLayout>
    )
  }

  if (!vendorId || !venueId) {
    return (
      <VendorLayout title="Edit Court" subtitle="Loading...">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout title="Edit Court" subtitle={court.name || 'Update court information'}>
      <div className="p-6 space-y-6">
        <VendorBreadcrumb />

        <CourtForm
          vendorId={vendorId}
          venueId={venueId}
          court={court}
          mode="edit"
          onSave={handleSave}
          onCancel={handleCancel}
          hideHeader={true}
        />
      </div>
    </VendorLayout>
  )
}

