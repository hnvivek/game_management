'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import CourtForm from '@/components/courts/CourtForm'
import { VendorLayout } from '@/components/features/vendor/VendorLayout'
import { useVendor } from '@/hooks/use-vendor'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NewCourtPage() {
  const params = useParams()
  const router = useRouter()
  const { vendorId } = useVendor()
  const venueId = params?.venueId as string

  const handleSave = (savedCourt: any) => {
    // Navigate back to venue details
    router.push(`/vendor/venues/${venueId}`)
  }

  const handleCancel = () => {
    // Navigate back to venue details
    router.push(`/vendor/venues/${venueId}`)
  }

  if (!vendorId || !venueId) {
    return (
      <VendorLayout title="Add Court" subtitle="Loading...">
        <div className="p-6">Loading...</div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout title="Add Court" subtitle="Add a new court to this venue">
      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => router.push(`/vendor/venues/${venueId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Venue
        </Button>

        <CourtForm
          vendorId={vendorId}
          venueId={venueId}
          court={null}
          mode="create"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </VendorLayout>
  )
}

