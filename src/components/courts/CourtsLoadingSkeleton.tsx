'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export function CourtsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(6)].map((_, index) => (
        <Card key={index} className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            {/* Desktop/Tablet: Split Layout */}
            <div className="hidden md:flex">
              <div className="flex-1 pr-6 border-r space-y-4">
                {/* Court Name */}
                <Skeleton className="h-6 w-48" />

                {/* Sport and Duration */}
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                </div>

                {/* Venue Info */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>

              <div className="w-80 pl-6 flex flex-col justify-between space-y-4">
                {/* Price */}
                <div className="text-right">
                  <Skeleton className="h-7 w-20 ml-auto" />
                  <Skeleton className="h-4 w-16 ml-auto mt-1" />
                </div>

                {/* Availability */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <div className="space-y-1">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-8 w-1/2" />
                  </div>
                </div>

                {/* Action Button */}
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* Mobile: Vertical Layout */}
            <div className="md:hidden space-y-4">
              {/* Header with Court Name and Price */}
              <div className="flex justify-between items-start">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-7 w-16" />
              </div>

              {/* Sport and Duration */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>

              {/* Venue Info */}
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-14 rounded-full" />
                <Skeleton className="h-6 w-18 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>

              {/* Availability */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <div className="space-y-1">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-2/3" />
                </div>
              </div>

              {/* Action Button */}
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default CourtsLoadingSkeleton