'use client'

import { useState, useEffect } from 'react'
import { Plus, TrendingUp, Calendar, DollarSign, Users, Settings, MapPin, Clock, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

// Mock data - replace with real API calls
const mockVendor = {
  id: 'vendor-1',
  name: '3Lok Sports Hub',
  location: 'Whitefield, Bengaluru',
  turfs: 7,
  bookings: 156,
  revenue: 450000
}

const mockTurfs = [
  { id: '1', sport: 'soccer', size: '11 a side', courtNumber: 'Field 1', pricePerHour: 4000, maxPlayers: 22 },
  { id: '2', sport: 'soccer', size: '8 a side', courtNumber: 'Field 2', pricePerHour: 2600, maxPlayers: 16 },
  { id: '3', sport: 'basketball', size: 'Full Court', courtNumber: 'Court 1', pricePerHour: 2000, maxPlayers: 10 },
]

const mockBookings = [
  { id: '1', date: '2025-10-29', time: '14:00-16:00', court: 'Field 1', customer: 'John Doe', amount: 8000, status: 'confirmed' },
  { id: '2', date: '2025-10-29', time: '18:00-19:00', court: 'Field 2', customer: 'Team Alpha', amount: 2600, status: 'confirmed' },
]

const sportOptions = [
  { value: 'soccer', label: 'Football/Soccer' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'cricket', label: 'Cricket' },
  { value: 'badminton', label: 'Badminton' },
  { value: 'tennis', label: 'Tennis' }
]

export default function VendorDashboard() {
  const [showAddVenue, setShowAddVenue] = useState(false)
  const [newVenue, setNewVenue] = useState({
    sport: '',
    size: '',
    courtNumber: '',
    pricePerHour: '',
    maxPlayers: '',
    description: ''
  })

  const handleAddVenue = async () => {
    // TODO: Implement API call to add venue
    console.log('Adding venue:', newVenue)
    setShowAddVenue(false)
    setNewVenue({
      sport: '',
      size: '',
      courtNumber: '',
      pricePerHour: '',
      maxPlayers: '',
      description: ''
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Vendor Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">{mockVendor.name}</span>
                  <span className="text-sm text-gray-500 block">{mockVendor.location}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                View Public Page
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockVendor.turfs}</div>
              <p className="text-xs text-muted-foreground">
                Across multiple sports
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month's Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockVendor.bookings}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{mockVendor.revenue.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground">
                +8% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="venues" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="venues">Venues</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Venues Tab */}
          <TabsContent value="venues" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Manage Venues</h2>
              <Dialog open={showAddVenue} onOpenChange={setShowAddVenue}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Venue
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Venue</DialogTitle>
                    <DialogDescription>
                      Create a new sports venue for customers to book
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Sport Type</Label>
                      <Select value={newVenue.sport} onValueChange={(value) => setNewVenue(prev => ({...prev, sport: value}))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sport" />
                        </SelectTrigger>
                        <SelectContent>
                          {sportOptions.map(sport => (
                            <SelectItem key={sport.value} value={sport.value}>
                              {sport.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Venue Size/Type</Label>
                      <Input 
                        placeholder="e.g. 11 a side, Full Court"
                        value={newVenue.size}
                        onChange={(e) => setNewVenue(prev => ({...prev, size: e.target.value}))}
                      />
                    </div>
                    
                    <div>
                      <Label>Court/Field Number</Label>
                      <Input 
                        placeholder="e.g. Field 1, Court A"
                        value={newVenue.courtNumber}
                        onChange={(e) => setNewVenue(prev => ({...prev, courtNumber: e.target.value}))}
                      />
                    </div>
                    
                    <div>
                      <Label>Price per Hour (₹)</Label>
                      <Input 
                        type="number"
                        placeholder="2000"
                        value={newVenue.pricePerHour}
                        onChange={(e) => setNewVenue(prev => ({...prev, pricePerHour: e.target.value}))}
                      />
                    </div>
                    
                    <div>
                      <Label>Max Players</Label>
                      <Input 
                        type="number"
                        placeholder="22"
                        value={newVenue.maxPlayers}
                        onChange={(e) => setNewVenue(prev => ({...prev, maxPlayers: e.target.value}))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Description (Optional)</Label>
                    <Textarea 
                      placeholder="Additional details about the venue..."
                      value={newVenue.description}
                      onChange={(e) => setNewVenue(prev => ({...prev, description: e.target.value}))}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => setShowAddVenue(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddVenue} className="bg-blue-600 hover:bg-blue-700">
                      Add Venue
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockTurfs.map((turf) => (
                <Card key={turf.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{turf.size}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {turf.courtNumber}
                        </CardDescription>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {turf.sport}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Price/hour:</span>
                      <span className="font-semibold text-green-600">₹{turf.pricePerHour.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Max players:</span>
                      <span className="font-medium">{turf.maxPlayers}</span>
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Bookings</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{booking.customer}</span>
                          <span className="text-sm text-gray-500">{booking.court}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{booking.time}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-semibold text-green-600">₹{booking.amount.toLocaleString('en-IN')}</span>
                        <Badge className="bg-green-100 text-green-800">
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
            <Card>
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Detailed analytics and reporting features will be available soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
