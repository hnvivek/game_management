'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  MapPin,
  Star,
  Clock,
  DollarSign,
  Filter,
  Users,
  Calendar,
  Heart,
  Share2,
  Navigation,
  TrendingUp,
  Award,
  MessageCircle
} from 'lucide-react'
import Link from 'next/link'

interface Vendor {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  description: string
  location: string
  city: string
  phone?: string | null
  phoneCountryCode?: string | null
  phoneNumber?: string | null
  rating: number
  reviewCount: number
  totalVenues: number
  activeVenues: number
  sports: string[]
  featured: boolean
  priceRange: string
  openingHours: string
  featuredImage: string | null
  amenities: string[]
  verified: boolean
  responseTime: string
  venues: Array<{
    id: string
    name: string
    courtCount: number
    sports: string[]
    priceRange: string
  }>
}

interface Filters {
  cities: Array<{ value: string; label: string }>
  sports: Array<{ value: string; label: string }>
}

interface VendorsResponse {
  vendors: Vendor[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: Filters
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filters, setFilters] = useState<Filters | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState('all')
  const [selectedSport, setSelectedSport] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchVendors = async (resetPage = false) => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        limit: '12',
        page: resetPage ? '1' : page.toString(),
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedCity !== 'all') params.append('city', selectedCity)
      if (selectedSport !== 'all') params.append('sport', selectedSport)
      if (sortBy !== 'featured') params.append('sortBy', sortBy)

      const response = await fetch(`/api/vendors/search?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch vendors')
      }

      const data: VendorsResponse = await response.json()

      if (resetPage) {
        setVendors(data.vendors)
        setPage(1)
      } else {
        setVendors(data.vendors)
      }

      setFilters(data.filters)
      setTotalPages(data.pagination.totalPages)
    } catch (err: any) {
      setError(err.message || 'Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors(true)
  }, [searchTerm, selectedCity, selectedSport, sortBy])

  useEffect(() => {
    if (page > 1) {
      fetchVendors(false)
    }
  }, [page])

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={
              star <= rating
                ? 'text-yellow-500 fill-current'
                : 'text-gray-300'
            }
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">
          {rating.toFixed(1)}
        </span>
      </div>
    )
  }

  if (loading && vendors.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => fetchVendors(true)} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Discover Sports Venues</h1>
            <p className="text-xl text-blue-100 mb-8">
              Find the perfect sports facility for your game, training, or event
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search venues, sports, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-lg bg-white/10 border-white/20 text-white placeholder-white/70"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filters:</span>
              </div>

              {filters && (
                <>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="City" />
                    </SelectTrigger>
                    <SelectContent>
                      {filters.cities.map((city) => (
                        <SelectItem key={city.value} value={city.value}>
                          {city.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedSport} onValueChange={setSelectedSport}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {filters.sports.map((sport) => (
                        <SelectItem key={sport.value} value={sport.value}>
                          {sport.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Showing {vendors.length} vendors
          </p>
        </div>

        {/* Vendors Grid */}
        {vendors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {vendors.map((vendor) => (
              <Card key={vendor.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {vendor.logoUrl ? (
                        <img
                          src={vendor.logoUrl}
                          alt={vendor.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {vendor.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold group-hover:text-blue-600 transition-colors">
                          {vendor.name}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin size={12} />
                          {vendor.city}
                        </div>
                      </div>
                    </div>
                    {vendor.featured && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Award className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {vendor.description}
                  </p>

                  {/* Sports */}
                  <div className="flex flex-wrap gap-1">
                    {vendor.sports.slice(0, 3).map((sport, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {sport}
                      </Badge>
                    ))}
                    {vendor.sports.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{vendor.sports.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Rating and Reviews */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {renderStars(vendor.rating)}
                      <span className="text-xs text-muted-foreground">
                        ({vendor.reviewCount} reviews)
                      </span>
                    </div>
                    {vendor.verified && (
                      <Badge variant="secondary" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>

                  {/* Price and Hours */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} />
                      <span>{vendor.priceRange}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span className="text-xs">{vendor.openingHours}</span>
                    </div>
                  </div>

                  {/* Venues Count */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users size={14} />
                    <span>{vendor.totalVenues} venue{vendor.totalVenues !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/vendors/${vendor.slug}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/book-venue?vendorId=${vendor.id}`} className="flex-1">
                      <Button className="w-full">
                        Book Now
                      </Button>
                    </Link>
                    {(vendor.phone || (vendor.phoneCountryCode && vendor.phoneNumber)) && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={`https://wa.me/${(vendor.phoneCountryCode || '91').replace(/\D/g, '')}${(vendor.phoneNumber || vendor.phone || '').replace(/\D/g, '')}?text=Hi! I'm interested in booking with ${vendor.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}