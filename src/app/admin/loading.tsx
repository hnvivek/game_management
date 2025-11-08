import { AdminPageSkeleton } from '@/components/features/admin/AdminPageSkeleton'

export default function AdminLoading() {
  return (
    <AdminPageSkeleton
      title="Loading..."
      subtitle="Please wait while we load your content..."
      showBasicInfo={true}
      showContactInfo={true}
      showOperatingHours={false}
      showSidebar={false} // Don't show sidebar skeleton since sidebar is persistent
    />
  )
}