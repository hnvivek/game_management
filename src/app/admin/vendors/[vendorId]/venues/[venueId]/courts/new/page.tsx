'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import CourtForm from '@/components/courts/CourtForm'

export default function NewCourtPage() {
  const params = useParams()
  const router = useRouter()

  const { vendorId, venueId } = params as {
    vendorId: string;
    venueId: string
  }

  const handleSave = (savedCourt: any) => {
    // Navigate back to the previous page
    router.back()
  }

  const handleCancel = () => {
    // Navigate back to the previous page
    router.back()
  }

  return (
    <div className="p-6 space-y-6">
      <CourtForm
        vendorId={vendorId}
        venueId={venueId}
        court={null}
        mode="create"
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  )
}