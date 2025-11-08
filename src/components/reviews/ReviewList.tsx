'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  User,
  Calendar,
  CheckCircle,
  Camera,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface Review {
  id: string
  rating: number
  title?: string
  comment?: string
  isVerified: boolean
  isFeatured: boolean
  helpfulCount: number
  totalVotes: number
  createdAt: string
  images?: string[]
  reviewer: {
    id: string
    name?: string
    avatarUrl?: string
  }
  responses?: Array<{
    id: string
    response: string
    createdAt: string
    responder: {
      id: string
      name?: string
      avatarUrl?: string
    }
  }>
  // For venue reviews
  cleanlinessRating?: number
  serviceRating?: number
  facilitiesRating?: number
  valueRating?: number
  locationRating?: number
}

interface ReviewListProps {
  type: 'vendor' | 'venue'
  targetId: string
  initialReviews?: Review[]
  showWriteReview?: boolean
  onWriteReview?: () => void
  canWriteReview?: boolean
  className?: string
}

const specificRatingLabels = {
  cleanliness: 'Cleanliness',
  service: 'Service',
  facilities: 'Facilities',
  value: 'Value',
  location: 'Location'
}

export function ReviewList({
  type,
  targetId,
  initialReviews = [],
  showWriteReview = true,
  onWriteReview,
  canWriteReview = true,
  className = ''
}: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())
  const [voting, setVoting] = useState<Set<string>>(new Set())

  const loadMoreReviews = async () => {
    if (loading || !hasMore) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `/api/reviews/${type}?${type === 'vendor' ? 'vendorId' : 'venueId'}=${targetId}&page=${page + 1}&limit=10`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load reviews')
      }

      setReviews(prev => [...prev, ...data.reviews])
      setPage(prev => prev + 1)
      setHasMore(data.pagination.page < data.pagination.totalPages)
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (reviewId: string, isHelpful: boolean) => {
    if (voting.has(reviewId)) return

    setVoting(prev => new Set(prev).add(reviewId))

    try {
      const response = await fetch('/api/reviews/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          reviewType: type === 'vendor' ? 'VENDOR_REVIEW' : 'VENUE_REVIEW',
          isHelpful,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to vote')
      }

      const data = await response.json()

      // Update the review in local state
      setReviews(prev => prev.map(review =>
        review.id === reviewId
          ? {
              ...review,
              helpfulCount: data.helpfulCount,
              totalVotes: data.totalVotes,
            }
          : review
      ))
    } catch (err) {
      console.error('Failed to vote:', err)
    } finally {
      setVoting(prev => {
        const newSet = new Set(prev)
        newSet.delete(reviewId)
        return newSet
      })
    }
  }

  const toggleReviewExpansion = (reviewId: string) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev)
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId)
      } else {
        newSet.add(reviewId)
      }
      return newSet
    })
  }

  const renderStars = (rating: number, size = 'default') => {
    const starSize = size === 'small' ? 12 : size === 'large' ? 20 : 16
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={starSize}
            className={
              star <= rating
                ? 'text-yellow-500 fill-current'
                : 'text-gray-300'
            }
          />
        ))}
      </div>
    )
  }

  const renderSpecificRatings = (review: Review) => {
    if (type !== 'venue') return null

    const ratings = [
      { key: 'cleanlinessRating', label: 'Cleanliness' },
      { key: 'serviceRating', label: 'Service' },
      { key: 'facilitiesRating', label: 'Facilities' },
      { key: 'valueRating', label: 'Value' },
      { key: 'locationRating', label: 'Location' },
    ]

    const hasSpecificRatings = ratings.some(r => review[r.key as keyof Review])

    if (!hasSpecificRatings) return null

    return (
      <div className="mt-3 space-y-2">
        {ratings.map(({ key, label }) => {
          const rating = review[key as keyof Review] as number
          if (!rating) return null

          return (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <div className="flex items-center gap-1">
                {renderStars(rating, 'small')}
                <span className="text-muted-foreground ml-1">{rating}/5</span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          {error}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Reviews</h2>
          {reviews.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {showWriteReview && canWriteReview && (
          <Button onClick={onWriteReview}>
            Write a Review
          </Button>
        )}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share your experience!
            </p>
            {showWriteReview && canWriteReview && (
              <Button onClick={onWriteReview}>
                Write the First Review
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.reviewer.avatarUrl} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {review.reviewer.name || 'Anonymous'}
                        </span>
                        {review.isVerified && (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
                        {review.isFeatured && (
                          <Badge variant="secondary" className="text-xs">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {renderStars(review.rating)}
                  </div>
                </div>

                {review.title && (
                  <h3 className="font-medium mt-2">{review.title}</h3>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Specific Ratings */}
                {renderSpecificRatings(review)}

                {/* Review Content */}
                {review.comment && (
                  <div>
                    <p className={`text-sm ${
                      expandedReviews.has(review.id) || review.comment!.length <= 300
                        ? ''
                        : 'line-clamp-3'
                    }`}>
                      {review.comment}
                    </p>
                    {review.comment.length > 300 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleReviewExpansion(review.id)}
                        className="mt-2 p-0 h-auto text-xs"
                      >
                        {expandedReviews.has(review.id) ? (
                          <>
                            Show less <ChevronUp className="h-3 w-3 ml-1" />
                          </>
                        ) : (
                          <>
                            Show more <ChevronDown className="h-3 w-3 ml-1" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {/* Images */}
                {review.images && review.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {review.images.slice(0, 3).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    ))}
                    {review.images.length > 3 && (
                      <div className="relative">
                        <img
                          src={review.images[3]}
                          alt="Review image 4"
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            +{review.images.length - 3}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Vendor Response */}
                {review.responses && review.responses.length > 0 && (
                  <div className="space-y-2">
                    <Separator />
                    <div className="space-y-3">
                      {review.responses.map((response) => (
                        <div
                          key={response.id}
                          className="bg-muted/50 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={response.responder.avatarUrl} />
                              <AvatarFallback className="text-xs">
                                {response.responder.name?.[0] || 'V'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="text-sm font-medium">
                                {response.responder.name}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {formatDate(response.createdAt)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm">{response.response}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Helpful Voting */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    {review.isVerified && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Verified purchase
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Helpful ({review.helpfulCount})
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(review.id, true)}
                        disabled={voting.has(review.id)}
                        className="h-6 px-2"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(review.id, false)}
                        disabled={voting.has(review.id)}
                        className="h-6 px-2"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={loadMoreReviews}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load More Reviews'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}