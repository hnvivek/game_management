'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Star,
  ThumbsUp,
  AlertCircle,
  CheckCircle,
  Camera,
  X,
  Upload,
  Send
} from 'lucide-react'

interface ReviewFormProps {
  type: 'vendor' | 'venue'
  targetId: string
  targetName: string
  bookingId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

const specificRatingLabels = {
  cleanliness: 'Cleanliness',
  service: 'Service',
  facilities: 'Facilities',
  value: 'Value for Money',
  location: 'Location'
}

export function ReviewForm({
  type,
  targetId,
  targetName,
  bookingId,
  onSuccess,
  onCancel
}: ReviewFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Review data
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [specificRatings, setSpecificRatings] = useState<Record<string, number>>({})
  const [images, setImages] = useState<string[]>([])

  // Hover state for star ratings
  const [hoveredRating, setHoveredRating] = useState(0)
  const [hoveredSpecific, setHoveredSpecific] = useState<Record<string, number>>({})

  const handleRatingChange = (value: number) => {
    setRating(value)
    setError('')
  }

  const handleSpecificRatingChange = (category: string, value: number) => {
    setSpecificRatings(prev => ({
      ...prev,
      [category]: value
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file))
      setImages(prev => [...prev, ...newImages].slice(0, 5)) // Limit to 5 images
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    if (!comment.trim()) {
      setError('Please write a review')
      return
    }

    setIsLoading(true)

    try {
      const reviewData = {
        [type === 'vendor' ? 'vendorId' : 'venueId']: targetId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        bookingId: bookingId || undefined,
        images: images.length > 0 ? images : undefined,
        ...specificRatings,
      }

      const response = await fetch(`/api/reviews/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      setSuccess('Review submitted successfully!')

      // Reset form
      setTimeout(() => {
        setRating(0)
        setTitle('')
        setComment('')
        setSpecificRatings({})
        setImages([])
        onSuccess?.()
      }, 1500)

    } catch (err: any) {
      setError(err.message || 'Failed to submit review. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const StarRating = ({
    value,
    onChange,
    size = 'default',
    label
  }: {
    value: number
    onChange: (value: number) => void
    size?: 'small' | 'default' | 'large'
    label?: string
  }) => {
    const starSize = size === 'small' ? 16 : size === 'large' ? 32 : 24
    const hoveredValue = label ? hoveredSpecific[label] || 0 : hoveredRating
    const setHovered = label
      ? (val: number) => setHoveredSpecific(prev => ({ ...prev, [label]: val }))
      : setHoveredRating

    return (
      <div className="space-y-2">
        {label && (
          <Label className="text-sm font-medium">
            {specificRatingLabels[label as keyof typeof specificRatingLabels] || label}
          </Label>
        )}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="transition-colors"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
            >
              <Star
                size={starSize}
                className={`${
                  star <= (hoveredValue || value)
                    ? 'text-yellow-500 fill-current'
                    : 'text-gray-300'
                } hover:text-yellow-400`}
              />
            </button>
          ))}
          {label && (
            <span className="ml-2 text-sm text-muted-foreground">
              {value}/5
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Review {targetName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Share your experience to help others make informed decisions
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Overall Rating */}
          <div>
            <Label className="text-base font-medium">Overall Rating</Label>
            <StarRating
              value={rating}
              onChange={handleRatingChange}
              size="large"
            />
          </div>

          {/* Specific Ratings for Venue Reviews */}
          {type === 'venue' && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Specific Ratings</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(specificRatingLabels).map((category) => (
                  <StarRating
                    key={category}
                    label={category}
                    value={specificRatings[category] || 0}
                    onChange={(value) => handleSpecificRatingChange(category, value)}
                    size="small"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Review Title */}
          <div>
            <Label htmlFor="title">Review Title (Optional)</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience in a few words"
              maxLength={100}
            />
          </div>

          {/* Review Comment */}
          <div>
            <Label htmlFor="comment">Your Review *</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              rows={5}
              maxLength={1000}
            />
            <div className="text-right text-sm text-muted-foreground">
              {comment.length}/1000
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <Label>Photos (Optional)</Label>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                    <Camera className="h-4 w-4" />
                    <span className="text-sm">Add Photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </label>
                <span className="text-sm text-muted-foreground">
                  Up to 5 photos
                </span>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Verified Badge */}
          {bookingId && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">
                ✓ Verified review - linked to your booking
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || rating === 0 || !comment.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}