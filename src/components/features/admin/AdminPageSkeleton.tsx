import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface AdminPageSkeletonProps {
  title: string
  subtitle: string
  showOperatingHours?: boolean
  showContactInfo?: boolean
  showBasicInfo?: boolean
  showSidebar?: boolean
}

export function AdminPageSkeleton({
  title,
  subtitle,
  showOperatingHours = false,
  showContactInfo = true,
  showBasicInfo = true,
  showSidebar = true
}: AdminPageSkeletonProps) {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-20" />
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
        </div>
      </div>

      {/* Form Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Card */}
          {showBasicInfo && (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-4 w-28 mb-2" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Information Card */}
          {showContactInfo && (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-44 mb-2" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-28 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-16 w-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Skeleton className="h-4 w-12 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-28 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Operating Hours Card */}
          {showOperatingHours && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 pb-3 border-b last:border-b-0">
                      <Skeleton className="w-20 h-4" />
                      <div className="flex items-center gap-2 flex-1">
                        <Skeleton className="h-10 w-24" />
                        <span className="text-muted-foreground">to</span>
                        <Skeleton className="h-10 w-24" />
                      </div>
                      <Skeleton className="h-6 w-12" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Skeleton */}
        {showSidebar && (
          <div className="space-y-6">
            {/* Settings Card */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-6 w-11" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-36 mb-2" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}