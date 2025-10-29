import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

// Extract subdomain from request hostname
export function extractSubdomain(request: NextRequest): string | null {
  const hostname = request.headers.get('host') || ''

  // Remove port if present
  const hostWithoutPort = hostname.split(':')[0]

  // Handle localhost development
  if (hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1') {
    return null // No subdomain on localhost
  }

  // Extract subdomain from domains like: 3lok.gamehub.com
  const domainParts = hostWithoutPort.split('.')

  // If we have at least 3 parts (subdomain.domain.tld), the first part is the subdomain
  if (domainParts.length >= 3) {
    const subdomain = domainParts[0].toLowerCase()

    // Common subdomains to ignore
    const ignoredSubdomains = ['www', 'api', 'app', 'admin', 'test', 'staging', 'dev']

    if (!ignoredSubdomains.includes(subdomain) && subdomain !== 'gamehub') {
      return subdomain
    }
  }

  return null
}

// Get vendor by subdomain (slug)
export async function getVendorBySubdomain(subdomain: string) {
  if (!subdomain) return null

  try {
    const vendor = await db.vendor.findUnique({
      where: { slug: subdomain, isActive: true },
      select: { id: true, name: true, slug: true }
    })

    return vendor
  } catch (error) {
    console.error('Error fetching vendor by subdomain:', error)
    return null
  }
}

// Get vendor context from request (detects subdomain and returns vendor)
export async function getVendorContext(request: NextRequest) {
  const subdomain = extractSubdomain(request)

  if (!subdomain) {
    return null // Not on a vendor subdomain
  }

  return await getVendorBySubdomain(subdomain)
}

// Middleware-style function to add vendor filtering to API queries
export async function addVendorFiltering(
  request: NextRequest,
  baseConditions: any = {},
  vendorIdField = 'vendorId'
) {
  const vendor = await getVendorContext(request)

  if (vendor) {
    // If on vendor subdomain, automatically filter by this vendor
    baseConditions[vendorIdField] = vendor.id
  }

  return baseConditions
}