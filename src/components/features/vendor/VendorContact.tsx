'use client'

import { Phone, Mail, MessageCircle, MapPin, Clock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface VendorContactProps {
  vendor: {
    id: string
    name: string
    phone?: string
    phoneCountryCode?: string
    phoneNumber?: string
    email?: string
    website?: string
    address?: string
    responseTime?: string
    openingHours?: string
  }
  variant?: 'card' | 'inline' | 'modal'
  showTitle?: boolean
}

export default function VendorContact({
  vendor,
  variant = 'card',
  showTitle = true
}: VendorContactProps) {
  // Combine phoneCountryCode and phoneNumber if phone is not provided
  const phone = vendor.phone || (vendor.phoneCountryCode && vendor.phoneNumber 
    ? `${vendor.phoneCountryCode} ${vendor.phoneNumber}` 
    : undefined)

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return ''
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    // Add country code if missing (assuming India for demo)
    if (cleaned.length === 10) {
      return `91${cleaned}`
    }
    return cleaned
  }

  const createWhatsAppLink = (phone?: string, message?: string) => {
    const formattedPhone = formatPhoneNumber(phone)
    if (!formattedPhone) return '#'

    const defaultMessage = message || `Hi! I'm interested in booking with ${vendor.name}.`
    const encodedMessage = encodeURIComponent(defaultMessage)
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
  }

  const createPhoneLink = (phone?: string) => {
    if (!phone) return '#'
    return `tel:${phone}`
  }

  const createEmailLink = (email?: string) => {
    if (!email) return '#'
    const subject = encodeURIComponent(`Inquiry about ${vendor.name}`)
    const body = encodeURIComponent(`Hi ${vendor.name} team,\n\nI'm interested in your sports facilities and would like to know more about:\n\n- Available courts/venues\n- Pricing information\n- Booking process\n\nLooking forward to hearing from you.\n\nThank you!`)
    return `mailto:${email}?subject=${subject}&body=${body}`
  }

  const ContactContent = () => (
    <div className="space-y-4">
      {/* Contact Information */}
      <div className="space-y-3">
        {vendor.phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{vendor.phone}</span>
          </div>
        )}

        {vendor.email && (
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{vendor.email}</span>
          </div>
        )}

        {vendor.address && (
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="text-sm">{vendor.address}</span>
          </div>
        )}

        {vendor.responseTime && (
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{vendor.responseTime}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        {vendor.phone && (
          <Button
            asChild
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <a
              href={createWhatsAppLink(vendor.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Chat on WhatsApp
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}

        <div className="grid grid-cols-2 gap-2">
          {vendor.phone && (
            <Button
              asChild
              variant="outline"
              size="sm"
            >
              <a
                href={createPhoneLink(vendor.phone)}
                className="flex items-center justify-center gap-1"
              >
                <Phone className="h-3 w-3" />
                Call
              </a>
            </Button>
          )}

          {vendor.email && (
            <Button
              asChild
              variant="outline"
              size="sm"
            >
              <a
                href={createEmailLink(vendor.email)}
                className="flex items-center justify-center gap-1"
              >
                <Mail className="h-3 w-3" />
                Email
              </a>
            </Button>
          )}
        </div>

        {vendor.website && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full"
          >
            <a
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-3 w-3" />
              Visit Website
            </a>
          </Button>
        )}
      </div>

      {/* Business Hours Info */}
      {vendor.openingHours && (
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-3 w-3" />
            <span className="font-medium">Business Hours:</span>
          </div>
          <p>{vendor.openingHours}</p>
        </div>
      )}
    </div>
  )

  // Card variant
  if (variant === 'card') {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <ContactContent />
        </CardContent>
      </Card>
    )
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className="space-y-3">
        {showTitle && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
          </div>
        )}
        <ContactContent />
      </div>
    )
  }

  // Modal variant (for future use)
  return <ContactContent />
}