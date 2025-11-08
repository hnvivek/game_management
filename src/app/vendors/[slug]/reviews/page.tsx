'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { ReviewList } from '@/components/reviews/ReviewList'
import {
  Star,
  TrendingUp,
  Users,
  MessageSquare,
  BarChart3,
  Filter,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: Array<{
    rating: number
    count: number
  }>
  categoryAverages?: {
    cleanliness: number
    service: number
    facilities: number
    value: number
    location: number
  }
}

export default function VendorReviewsPage() {
  const params = useParams()
  const slug = params.slug as string

  const [vendor, setVendor] = useState<any>(null)
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => {
    fetchVendorAndReviews()
  }, [slug])

  const fetchVendorAndReviews = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch vendor details
      const vendorResponse = await fetch(`/api/vendors/${slug}`)
      if (!vendorResponse.ok) {
        throw new Error('Vendor not found')
      }
      const vendorData = await vendorResponse.json()
      setVendor(vendorData.vendor)

      // Fetch review stats
      const reviewsResponse = await fetch(
        `/api/reviews/vendor?vendorId=${vendorData.vendor.id}&limit=1`
      )
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json()
        setReviewStats(reviewsData.stats)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load vendor information')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSuccess = () => {
    setShowReviewForm(false)
    fetchVendorAndReviews() // Refresh data
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-muted-foreground">{error || 'Vendor not found'}</p>
          <Link href="/vendors">
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vendors
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/vendors/${slug}`}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Vendor
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold">
                {vendor.name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{vendor.name}</h1>
              <p className="text-blue-100">
                Read and write reviews for {vendor.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Review Form */}
            {showReviewForm ? (
              <ReviewForm
                type="vendor"
                targetId={vendor.id}
                targetName={vendor.name}
                onSuccess={handleReviewSuccess}
                onCancel={() => setShowReviewForm(false)}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Share Your Experience
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Help others make informed decisions by reviewing {vendor.name}
                  </p>
                  <Button onClick={() => setShowReviewForm(true)}>
                    Write a Review
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Reviews List */}
            <ReviewList
              type="vendor"
              targetId={vendor.id}
              onWriteReview={() => setShowReviewForm(true)}
              canWriteReview={!showReviewForm}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rating Overview */}
            {reviewStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Rating Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Average Rating */}
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">
                      {reviewStats.averageRating.toFixed(1)}
                    </div>
                    <div className="flex justify-center items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={20}
                          className={
                            star <= Math.round(reviewStats.averageRating)
                              ? 'text-yellow-500 fill-current'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Based on {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Rating Distribution */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Rating Distribution</h4>
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviewStats.ratingDistribution.find(r => r.rating === rating)?.count || 0
                      const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0

                      return (
                        <div key={rating} className="flex items-center gap-2">
                          <div className="flex items-center gap-1 w-12">
                            <span className="text-sm">{rating}</span>
                            <Star size={12} className="text-yellow-500 fill-current" />
                          </div>
                          <Progress value={percentage} className="flex-1 h-2" />
                          <span className="text-sm text-muted-foreground w-8 text-right">
                            {count}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round((reviewStats.ratingDistribution.filter(r => r.rating >= 4).reduce((sum, r) => sum + r.count, 0) / reviewStats.totalReviews) * 100) || 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Positive
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {reviewStats.totalReviews}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total Reviews
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vendor Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  About {vendor.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {vendor.description || 'No description available.'}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Contact</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {vendor.email && (
                      <p>Email: {vendor.email}</p>
                    )}
                    {(vendor.phone || (vendor.phoneCountryCode && vendor.phoneNumber)) && (
                      <p>Phone: {vendor.phone || `${vendor.phoneCountryCode} ${vendor.phoneNumber}`}</p>
                    )}
                    {vendor.website && (
                      <p>
                        Website:{' '}
                        <a
                          href={vendor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {vendor.website}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Location</h4>
                  <p className="text-sm text-muted-foreground">
                    {vendor.city}, {vendor.countryCode}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}