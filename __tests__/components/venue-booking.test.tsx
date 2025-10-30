import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import VenueBooking from '@/components/venue-booking'

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>
global.fetch = mockFetch

describe('VenueBooking Component', () => {
  const mockOnVenueSelect = jest.fn()

  beforeEach(() => {
    mockFetch.mockClear()
    mockOnVenueSelect.mockClear()

    // Mock the sports API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        sports: [
          { id: '1', name: 'soccer', displayName: 'Football/Soccer', icon: '⚽' },
          { id: '2', name: 'basketball', displayName: 'Basketball', icon: '🏀' }
        ]
      })
    } as Response)
  })

  it('should render initial search interface', async () => {
    render(<VenueBooking onVenueSelect={mockOnVenueSelect} />)

    // Wait for sports to load and UI to render
    await waitFor(() => {
      expect(screen.getByText('Find Venues')).toBeInTheDocument()
    })

    expect(screen.getByText('Search and book available venues for your match')).toBeInTheDocument()
    expect(screen.getByText('Sport')).toBeInTheDocument()
    expect(screen.getByText('Date')).toBeInTheDocument()
  })

  it('should load sports data on mount', async () => {
    render(<VenueBooking onVenueSelect={mockOnVenueSelect} />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/sports')
    })

    await waitFor(() => {
      expect(screen.getByText('Football/Soccer')).toBeInTheDocument()
    })
  })

  it('should show error state when API fails', async () => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    } as Response)

    render(<VenueBooking onVenueSelect={mockOnVenueSelect} />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to load sports/)).toBeInTheDocument()
    })
  })
})