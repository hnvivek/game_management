'use client'

import { useState } from 'react'

export const dynamic = 'force-dynamic'
import { CheckCircle, AlertCircle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import SimpleBookingFlow from '@/components/booking/SimpleBookingFlow'
import Navbar from '@/components/navbar'

export default function BookVenuePage() {
  const [bookingComplete, setBookingComplete] = useState(false)
  const [bookingData, setBookingData] = useState<any>(null)

  const handleBookingComplete = (data: any) => {
    setBookingData(data)
    setBookingComplete(true)
  }

  const handleNewBooking = () => {
    setBookingComplete(false)
    setBookingData(null)
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Unified Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Book a Court</h1>
          <p className="text-muted-foreground">
            Find and book the perfect court for your game or practice session
          </p>
        </div>

        {/* Success Message */}
        {bookingComplete && bookingData && (
          <Alert className="mb-6 border-success/20 bg-success/10">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-success-foreground">
              <div className="font-semibold mb-1">Booking Confirmed!</div>
              <div className="text-sm">
                Your booking has been {bookingData.payment ? 'confirmed and paid' : 'confirmed (payment pending)'}.
                {bookingData.payment && (
                  <span> Payment ID: {bookingData.payment.id}</span>
                )}
              </div>
            </AlertDescription>
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={handleNewBooking}>
                Create New Booking
              </Button>
            </div>
          </Alert>
        )}

        {/* Booking Flow */}
        {!bookingComplete && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Complete Your Court Booking
              </CardTitle>
              <CardDescription>
                Follow the steps below to book your court for practice or casual play
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBookingFlow onBookingComplete={handleBookingComplete} />
            </CardContent>
          </Card>
        )}

        {/* Booking Summary */}
        {bookingComplete && bookingData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
                <CardDescription>
                  Your booking details are below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {bookingData.booking && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Booking Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Booking ID:</span>
                          <span className="font-medium">{bookingData.booking.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Title:</span>
                          <span className="font-medium">{bookingData.booking.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Booking Type:</span>
                          <Badge className="bg-primary/20 text-primary-foreground">
                            Court Booking
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge className={bookingData.booking.status === 'CONFIRMED' ? 'bg-success/20 text-success-foreground' :
                                         bookingData.booking.status === 'PENDING_PAYMENT' ? 'bg-warning/20 text-yellow-800' :
                                         'bg-destructive/20 text-destructive-foreground'}>
                            {bookingData.booking.status === 'PENDING_PAYMENT' ? 'Pending Payment' :
                             bookingData.booking.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Court Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Court:</span>
                          <span className="font-medium">{bookingData.booking.court?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Venue:</span>
                          <span className="font-medium">{bookingData.booking.court?.venue?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sport:</span>
                          <span className="font-medium">{bookingData.booking.court?.sport?.displayName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Address:</span>
                          <span className="font-medium">{bookingData.booking.court?.venue?.address || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Schedule</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-medium">
                            {new Date(bookingData.booking.startTime).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time:</span>
                          <span className="font-medium">
                            {new Date(bookingData.booking.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: bookingData.court?.venue?.timezone || 'UTC'
                            })}
                            {' - '}
                            {new Date(bookingData.booking.endTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: bookingData.court?.venue?.timezone || 'UTC'
                            })} ({bookingData.court?.venue?.timezone})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-medium">{bookingData.booking.duration} hours</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Payment</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Amount:</span>
                          <span className="font-medium text-success">
                            {new Intl.NumberFormat(
                              bookingData.court?.venue?.currencyCode === 'INR' ? 'en-IN' :
                              bookingData.court?.venue?.currencyCode === 'GBP' ? 'en-GB' :
                              bookingData.court?.venue?.currencyCode === 'EUR' ? 'en-IE' :
                              bookingData.court?.venue?.currencyCode === 'AED' ? 'en-AE' :
                              bookingData.court?.venue?.currencyCode === 'CAD' ? 'en-CA' : 'en-US',
                              {
                                style: 'currency',
                                currency: bookingData.court?.venue?.currencyCode || 'USD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }
                            ).format(bookingData.booking.totalAmount)} ({bookingData.court?.venue?.currencyCode})
                          </span>
                        </div>
                        {bookingData.payment && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Payment Status:</span>
                              <Badge className={bookingData.payment.status === 'COMPLETED' ? 'bg-success/20 text-success-foreground' :
                                             bookingData.payment.status === 'PENDING' ? 'bg-warning/20 text-yellow-800' :
                                             'bg-destructive/20 text-destructive-foreground'}>
                                {bookingData.payment.status}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Payment Method:</span>
                              <span className="font-medium">{bookingData.payment.method}</span>
                            </div>
                            {bookingData.payment.processedAt && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Paid At:</span>
                                <span className="font-medium">
                                  {new Date(bookingData.payment.processedAt).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleNewBooking}>
                    Create New Booking
                  </Button>
                  <Button variant="outline">
                    View All Bookings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
