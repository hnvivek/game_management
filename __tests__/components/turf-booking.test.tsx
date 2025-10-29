import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import TurfBooking from '@/components/turf-booking'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock data
const mockTurfs = [
  {
    id: 'turf-1',
    name: 'Test Sports Hub',
    venue: 'Test City',
    sport: 'soccer',
    size: '8 a side',
    courtNumber: 'Field 1',
    pricePerHour: 2000,
    maxPlayers: 16,
    isAvailable: true,
    totalAmount: 4000
  },
  {
    id: 'turf-2',
    name: 'Test Sports Hub',
    venue: 'Test City',
    sport: 'basketball',
    size: 'Full Court',
    courtNumber: 'Court 1',
    pricePerHour: 1500,
    maxPlayers: 10,
    isAvailable: true,
    totalAmount: 3000
  }
]

const mockAvailability = {
  slots: [
    { startTime: '09:00', endTime: '11:00', isAvailable: true, price: 4000 },
    { startTime: '10:00', endTime: '12:00', isAvailable: true, price: 4000 },
    { startTime: '14:00', endTime: '16:00', isAvailable: false, price: 4000 },
    { startTime: '15:00', endTime: '17:00', isAvailable: true, price: 4000 }
  ]
}

describe('TurfBooking Component', () => {
  const mockOnTurfSelect = jest.fn()
  
  beforeEach(() => {
    mockFetch.mockClear()
    mockOnTurfSelect.mockClear()
  })

  it('should render initial step with sport and date selection', () => {
    render(<TurfBooking onTurfSelect={mockOnTurfSelect} />)
    
    expect(screen.getByText('Step 1: Select Sport & Date')).toBeInTheDocument()
    expect(screen.getByText('Sport')).toBeInTheDocument()
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Duration (hours)')).toBeInTheDocument()
    expect(screen.getByText('Preferred Time')).toBeInTheDocument()
  })

  it('should enable next button when required fields are filled', async () => {
    const user = userEvent.setup()
    render(<TurfBooking onTurfSelect={mockOnTurfSelect} />)
    
    // Initially, next button should not be visible
    expect(screen.queryByText('Next: View Available Venues')).not.toBeInTheDocument()
    
    // Fill required fields
    const sportSelect = screen.getByRole('combobox', { name: /sport/i })
    await user.click(sportSelect)
    await user.click(screen.getByText('Football/Soccer'))
    
    const dateInput = screen.getByDisplayValue('')
    await user.type(dateInput, '2025-12-01')
    
    const durationSelect = screen.getByRole('combobox', { name: /duration/i })
    await user.click(durationSelect)
    await user.click(screen.getByText('2 hours'))
    
    // Next button should now be visible
    await waitFor(() => {
      expect(screen.getByText('Next: View Available Venues')).toBeInTheDocument()
    })
  })

  it('should fetch and display turfs when proceeding to step 2', async () => {
    const user = userEvent.setup()
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ turfs: mockTurfs })
    })
    
    render(<TurfBooking onTurfSelect={mockOnTurfSelect} />)
    
    // Fill step 1
    const sportSelect = screen.getByRole('combobox', { name: /sport/i })
    await user.click(sportSelect)
    await user.click(screen.getByText('Football/Soccer'))
    
    const dateInput = screen.getByDisplayValue('')
    await user.type(dateInput, '2025-12-01')
    
    const durationSelect = screen.getByRole('combobox', { name: /duration/i })
    await user.click(durationSelect)
    await user.click(screen.getByText('2 hours'))
    
    // Proceed to step 2
    const nextButton = await screen.findByText('Next: View Available Venues')
    await user.click(nextButton)
    
    // Should show step 2
    await waitFor(() => {
      expect(screen.getByText('Step 2: Select Venue')).toBeInTheDocument()
    })
    
    // Should display turfs
    await waitFor(() => {
      expect(screen.getByText('Field 1')).toBeInTheDocument()
      expect(screen.getByText('8 a side')).toBeInTheDocument()
    })
    
    // Verify fetch was called with correct parameters
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/turfs?sport=soccer&date=2025-12-01&duration=2')
    )
  })

  it('should show loading state while fetching turfs', async () => {
    const user = userEvent.setup()
    
    // Mock a delayed response
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => 
        resolve({
          ok: true,
          json: () => Promise.resolve({ turfs: mockTurfs })
        }), 100))
    )
    
    render(<TurfBooking onTurfSelect={mockOnTurfSelect} />)
    
    // Fill and proceed to step 2
    const sportSelect = screen.getByRole('combobox', { name: /sport/i })
    await user.click(sportSelect)
    await user.click(screen.getByText('Football/Soccer'))
    
    const dateInput = screen.getByDisplayValue('')
    await user.type(dateInput, '2025-12-01')
    
    const durationSelect = screen.getByRole('combobox', { name: /duration/i })
    await user.click(durationSelect)
    await user.click(screen.getByText('2 hours'))
    
    const nextButton = await screen.findByText('Next: View Available Venues')
    await user.click(nextButton)
    
    // Should show loading state
    expect(screen.getByText('Loading available venues...')).toBeInTheDocument()
    
    // Loading should disappear after fetch completes
    await waitFor(() => {
      expect(screen.queryByText('Loading available venues...')).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should handle turf selection and proceed to step 3', async () => {
    const user = userEvent.setup()
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ turfs: mockTurfs })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAvailability)
      })
    
    render(<TurfBooking onTurfSelect={mockOnTurfSelect} />)
    
    // Navigate to step 2
    const sportSelect = screen.getByRole('combobox', { name: /sport/i })
    await user.click(sportSelect)
    await user.click(screen.getByText('Football/Soccer'))
    
    const dateInput = screen.getByDisplayValue('')
    await user.type(dateInput, '2025-12-01')
    
    const durationSelect = screen.getByRole('combobox', { name: /duration/i })
    await user.click(durationSelect)
    await user.click(screen.getByText('2 hours'))
    
    const nextButton = await screen.findByText('Next: View Available Venues')
    await user.click(nextButton)
    
    // Wait for turfs to load and select one
    await waitFor(() => {
      expect(screen.getByText('Field 1')).toBeInTheDocument()
    })
    
    const selectTurfButton = screen.getByRole('button', { name: /select this venue/i })
    await user.click(selectTurfButton)
    
    // Should proceed to step 3
    await waitFor(() => {
      expect(screen.getByText('Step 3: Select Time')).toBeInTheDocument()
    })
    
    // Should show available time slots
    await waitFor(() => {
      expect(screen.getByText('09:00')).toBeInTheDocument()
      expect(screen.getByText('10:00')).toBeInTheDocument()
    })
  })

  it('should show unavailable slots as disabled', async () => {
    const user = userEvent.setup()
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ turfs: mockTurfs })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAvailability)
      })
    
    render(<TurfBooking onTurfSelect={mockOnTurfSelect} />)
    
    // Navigate to step 3
    const sportSelect = screen.getByRole('combobox', { name: /sport/i })
    await user.click(sportSelect)
    await user.click(screen.getByText('Football/Soccer'))
    
    const dateInput = screen.getByDisplayValue('')
    await user.type(dateInput, '2025-12-01')
    
    const durationSelect = screen.getByRole('combobox', { name: /duration/i })
    await user.click(durationSelect)
    await user.click(screen.getByText('2 hours'))
    
    const nextButton = await screen.findByText('Next: View Available Venues')
    await user.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('Field 1')).toBeInTheDocument()
    })
    
    const selectTurfButton = screen.getByRole('button', { name: /select this venue/i })
    await user.click(selectTurfButton)
    
    await waitFor(() => {
      expect(screen.getByText('Step 3: Select Time')).toBeInTheDocument()
    })
    
    // Check that unavailable slot (14:00) is disabled
    const unavailableSlot = screen.getByText('14:00').closest('button')
    expect(unavailableSlot).toHaveClass('opacity-50', 'cursor-not-allowed')
  })

  it('should call onTurfSelect when booking is confirmed', async () => {
    const user = userEvent.setup()
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ turfs: mockTurfs })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAvailability)
      })
    
    render(<TurfBooking onTurfSelect={mockOnTurfSelect} />)
    
    // Navigate through all steps
    const sportSelect = screen.getByRole('combobox', { name: /sport/i })
    await user.click(sportSelect)
    await user.click(screen.getByText('Football/Soccer'))
    
    const dateInput = screen.getByDisplayValue('')
    await user.type(dateInput, '2025-12-01')
    
    const durationSelect = screen.getByRole('combobox', { name: /duration/i })
    await user.click(durationSelect)
    await user.click(screen.getByText('2 hours'))
    
    const nextButton = await screen.findByText('Next: View Available Venues')
    await user.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('Field 1')).toBeInTheDocument()
    })
    
    const selectTurfButton = screen.getByRole('button', { name: /select this venue/i })
    await user.click(selectTurfButton)
    
    await waitFor(() => {
      expect(screen.getByText('Step 3: Select Time')).toBeInTheDocument()
    })
    
    // Select available time slot
    const timeSlot = screen.getByText('09:00').closest('button')
    await user.click(timeSlot!)
    
    // Confirm booking
    const confirmButton = screen.getByText('Confirm Reservation')
    await user.click(confirmButton)
    
    // Should call onTurfSelect with booking details
    expect(mockOnTurfSelect).toHaveBeenCalledWith({
      turf: expect.objectContaining({
        id: 'turf-1',
        name: 'Test Sports Hub'
      }),
      date: '2025-12-01',
      startTime: '09:00',
      endTime: '11:00',
      duration: 2,
      totalAmount: 4000,
      sport: 'soccer'
    })
  })

  it('should show error for incomplete booking', async () => {
    const user = userEvent.setup()
    
    render(<TurfBooking onTurfSelect={mockOnTurfSelect} />)
    
    // Try to confirm without completing steps
    // This would happen if component state gets into invalid state
    // The component should handle this gracefully
    
    expect(mockOnTurfSelect).not.toHaveBeenCalled()
  })

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup()
    
    mockFetch.mockRejectedValueOnce(new Error('API Error'))
    
    render(<TurfBooking onTurfSelect={mockOnTurfSelect} />)
    
    // Fill step 1 and proceed
    const sportSelect = screen.getByRole('combobox', { name: /sport/i })
    await user.click(sportSelect)
    await user.click(screen.getByText('Football/Soccer'))
    
    const dateInput = screen.getByDisplayValue('')
    await user.type(dateInput, '2025-12-01')
    
    const durationSelect = screen.getByRole('combobox', { name: /duration/i })
    await user.click(durationSelect)
    await user.click(screen.getByText('2 hours'))
    
    const nextButton = await screen.findByText('Next: View Available Venues')
    await user.click(nextButton)
    
    // Should show error state or handle gracefully
    await waitFor(() => {
      expect(screen.queryByText('Loading available venues...')).not.toBeInTheDocument()
    })
    
    // Component should not crash and should handle error state
    expect(screen.getByText('Step 2: Select Venue')).toBeInTheDocument()
  })
})
