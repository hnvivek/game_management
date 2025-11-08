'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  MapPin,
  Clock,
  Star,
  Phone,
  Mail,
  Globe,
  Calendar,
  Users,
  Heart,
  Share2,
  Navigation,
  CheckCircle,
  Award,
  TrendingUp,
  DollarSign,
  Filter,
  Wifi,
  Car,
  Shield,
  Camera
} from 'lucide-react'
import Image from 'next/image'

const mockVendorDetails = {
  'elite-sports-complex': {
    id: '1',
    name: 'Elite Sports Complex',
    description: 'Premium sports facility with world-class soccer fields, basketball courts, and tennis courts. Professional coaching available for all skill levels.',
    location: '1234 Sports Boulevard, Los Angeles, CA 90001',
    city: 'Los Angeles',
    coordinates: { lat: 34.0522, lng: -118.2437 },
    logo: '/vendors/elite-logo.jpg',
    coverImage: '/venues/elite-sports-cover.jpg',
    rating: 4.8,
    reviewCount: 245,
    totalVenues: 6,
    activeVenues: 5,
    sports: ['Soccer', 'Basketball', 'Tennis'],
    featured: true,
    verified: true,
    responseTime: 'Within 1 hour',
    establishedYear: '2018',
    openingHours: '6:00 AM - 11:00 PM',
    website: 'www.elitesports.com',
    phone: '+1 (555) 123-4567',
    email: 'info@elitesports.com',
    amenities: [
      'Free Parking', 'Changing Rooms', 'Equipment Rental', 'Café', 'Wi-Fi',
      'Pro Shop', 'Showers', 'Lockers', 'First Aid', 'Security'
    ],
    priceRange: '$80-$150/hour',
    about: 'Elite Sports Complex is a premier sports facility that has been serving the Los Angeles community since 2018. Our state-of-the-art facilities include multiple professional-grade soccer fields, NBA-quality basketball courts, and championship tennis courts. We pride ourselves on maintaining the highest standards of facility management and customer service.',
    venues: [
      {
        id: 'sf1',
        name: 'Soccer Field A',
        type: 'Soccer',
        surface: 'Artificial Turf',
        capacity: 22,
        price: 120,
        rating: 4.9,
        features: ['Floodlights', 'Bleachers', 'Changing Rooms', 'Water Fountain']
      },
      {
        id: 'sf2',
        name: 'Soccer Field B',
        type: 'Soccer',
        surface: 'Natural Grass',
        capacity: 22,
        price: 100,
        rating: 4.7,
        features: ['Floodlights', 'Changing Rooms', 'Water Fountain']
      },
      {
        id: 'bc1',
        name: 'Basketball Court 1',
        type: 'Basketball',
        surface: 'Hardwood',
        capacity: 10,
        price: 80,
        rating: 4.8,
        features: ['Scoreboard', 'Scoretable', 'Bleachers']
      },
      {
        id: 'bc2',
        name: 'Basketball Court 2',
        type: 'Basketball',
        surface: 'Hardwood',
        capacity: 10,
        price: 80,
        rating: 4.6,
        features: ['Scoreboard', 'Bleachers']
      },
      {
        id: 'tc1',
        name: 'Tennis Court 1',
        type: 'Tennis',
        surface: 'Hard Court',
        capacity: 4,
        price: 60,
        rating: 4.8,
        features: ['Floodlights', 'Scorekeeper', 'Ball Machine']
      },
      {
        id: 'tc2',
        name: 'Tennis Court 2',
        type: 'Tennis',
        surface: 'Clay',
        capacity: 4,
        price: 70,
        rating: 4.7,
        features: ['Floodlights', 'Scorekeeper']
      }
    ],
    reviews: [
      {
        id: 1,
        userName: 'Sarah Johnson',
        rating: 5,
        date: '2024-01-15',
        comment: 'Excellent facility! The soccer fields are well-maintained and the staff is very professional. Highly recommend for tournaments.',
        avatar: '/avatars/user1.jpg'
      },
      {
        id: 2,
        userName: 'Michael Chen',
        rating: 4,
        date: '2024-01-12',
        comment: 'Great basketball courts. The hardwood surface is perfect and the scoreboards work well. Only wish they had more parking.',
        avatar: '/avatars/user2.jpg'
      },
      {
        id: 3,
        userName: 'Emily Davis',
        rating: 5,
        date: '2024-01-10',
        comment: 'Best tennis courts in the area! The lighting is great for night play and the ball machine is very helpful.',
        avatar: '/avatars/user3.jpg'
      }
    ],
    gallery: [
      '/venues/gallery1.jpg',
      '/venues/gallery2.jpg',
      '/venues/gallery3.jpg',
      '/venues/gallery4.jpg',
      '/venues/gallery5.jpg',
      '/venues/gallery6.jpg'
    ]
  }
}

const getVendorData = (slug: string) => {
  return mockVendorDetails[slug as keyof typeof mockVendorDetails] || null
}

export default function VendorDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [selectedTab, setSelectedTab] = useState('venues')
  const [isSaved, setIsSaved] = useState(false)

  const vendor = getVendorData(slug)

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Vendor Not Found</h1>
          <p className="text-muted-foreground">The vendor you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image */}
      <div className="relative h-64 md:h-96">
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0">
          <div className="h-full w-full bg-gradient-to-t from-black/80 to-transparent" />
        </div>
        <div className="container mx-auto px-4 h-full flex items-end pb-8">
          <div className="text-white">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16 border-4 border-white">
                <AvatarImage src={vendor.logo} alt={vendor.name} />
                <AvatarFallback>
                  <Award className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{vendor.name}</h1>
                <div className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  {vendor.location}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <span className="font-semibold text-lg">{vendor.rating}</span>
              <span className="text-muted-foreground">({vendor.reviewCount} reviews)</span>
            </div>
            {vendor.verified && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Verified
              </Badge>
            )}
            {vendor.featured && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSaved(!isSaved)}
            >
              <Heart className={`h-4 w-4 mr-2 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
              {isSaved ? 'Saved' : 'Save'}
            </Button>
            <Button variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Book Now
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>About {vendor.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{vendor.about}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Established</div>
                        <div className="text-sm text-muted-foreground">{vendor.establishedYear}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Total Venues</div>
                        <div className="text-sm text-muted-foreground">{vendor.activeVenues}/{vendor.totalVenues}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Price Range</div>
                        <div className="text-sm text-muted-foreground">{vendor.priceRange}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Opening Hours</div>
                        <div className="text-sm text-muted-foreground">{vendor.openingHours}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Phone</div>
                        <div className="text-sm text-muted-foreground">{vendor.phone}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Website</div>
                        <div className="text-sm text-muted-foreground">{vendor.website}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList>
                <TabsTrigger value="venues">Venues ({vendor.venues.length})</TabsTrigger>
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                <TabsTrigger value="reviews">Reviews ({vendor.reviews.length})</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
              </TabsList>

              <TabsContent value="venues" className="space-y-4">
                {vendor.venues.map((venue) => (
                  <Card key={venue.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{venue.name}</h3>
                            <Badge variant="outline">{venue.type}</Badge>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="font-medium">{venue.rating}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            {venue.surface} • Capacity: {venue.capacity} players
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {venue.features.map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">${venue.price}/hr</div>
                          <Button className="mt-2">Book Now</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="gallery">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {vendor.gallery.map((image, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                <div className="space-y-4">
                  {vendor.reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarImage src={review.avatar} alt={review.userName} />
                            <AvatarFallback>
                              {review.userName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="font-medium">{review.userName}</div>
                                <div className="flex items-center gap-1 text-sm">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < review.rating
                                          ? 'text-yellow-500 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                  <span className="text-muted-foreground ml-1">
                                    {review.date}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-muted-foreground">{review.comment}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="amenities">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {vendor.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 border rounded-lg">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Phone</div>
                    <div className="text-sm text-muted-foreground">{vendor.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">{vendor.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Address</div>
                    <div className="text-sm text-muted-foreground">{vendor.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Website</div>
                    <div className="text-sm text-blue-600">{vendor.website}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Response Time</span>
                  <Badge variant="secondary">{vendor.responseTime}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Venues Available</span>
                  <Badge variant="secondary">{vendor.activeVenues}/{vendor.totalVenues}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Rating</span>
                  <Badge variant="secondary">{vendor.rating}/5</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Reviews</span>
                  <Badge variant="secondary">{vendor.reviewCount}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Sports Offered */}
            <Card>
              <CardHeader>
                <CardTitle>Sports Offered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {vendor.sports.map((sport, index) => (
                    <Badge key={index} variant="outline">
                      {sport}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}