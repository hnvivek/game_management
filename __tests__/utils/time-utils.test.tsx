import { describe, it, expect } from '@jest/globals'

// Import utility functions - we'll need to create these
function calculateEndTime(startTime: string, durationHours: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const startDate = new Date()
  startDate.setHours(hours, minutes, 0, 0)
  
  const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000)
  
  return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
}

function isTimeSlotAvailable(
  startTime: string,
  endTime: string,
  existingBookings: Array<{ startTime: string; endTime: string }>
): boolean {
  for (const booking of existingBookings) {
    // Check for overlap: start1 < end2 AND start2 < end1
    if (startTime < booking.endTime && booking.startTime < endTime) {
      return false
    }
  }
  return true
}

function generateBusinessHours(
  operatingStart: string = '09:00',
  operatingEnd: string = '21:00',
  slotDuration: number = 1
): string[] {
  const slots: string[] = []
  const [startHour, startMin] = operatingStart.split(':').map(Number)
  const [endHour, endMin] = operatingEnd.split(':').map(Number)
  
  const start = startHour * 60 + startMin
  const end = endHour * 60 + endMin
  const duration = slotDuration * 60
  
  for (let time = start; time + duration <= end; time += 60) {
    const hours = Math.floor(time / 60)
    const minutes = time % 60
    slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
  }
  
  return slots
}

describe('Time Utility Functions', () => {
  describe('calculateEndTime', () => {
    it('should calculate correct end time for 1 hour duration', () => {
      expect(calculateEndTime('09:00', 1)).toBe('10:00')
      expect(calculateEndTime('14:30', 1)).toBe('15:30')
      expect(calculateEndTime('23:00', 1)).toBe('00:00')
    })

    it('should calculate correct end time for multiple hours', () => {
      expect(calculateEndTime('09:00', 2)).toBe('11:00')
      expect(calculateEndTime('14:00', 3)).toBe('17:00')
      expect(calculateEndTime('20:00', 4)).toBe('00:00')
    })

    it('should handle minutes correctly', () => {
      expect(calculateEndTime('09:15', 2)).toBe('11:15')
      expect(calculateEndTime('14:45', 1)).toBe('15:45')
    })

    it('should handle edge cases', () => {
      expect(calculateEndTime('00:00', 1)).toBe('01:00')
      expect(calculateEndTime('23:30', 1)).toBe('00:30')
    })
  })

  describe('isTimeSlotAvailable', () => {
    const existingBookings = [
      { startTime: '10:00', endTime: '12:00' },
      { startTime: '14:00', endTime: '16:00' },
      { startTime: '18:30', endTime: '19:30' }
    ]

    it('should return true for non-overlapping slots', () => {
      expect(isTimeSlotAvailable('08:00', '10:00', existingBookings)).toBe(true)
      expect(isTimeSlotAvailable('12:00', '14:00', existingBookings)).toBe(true)
      expect(isTimeSlotAvailable('16:00', '18:00', existingBookings)).toBe(true)
      expect(isTimeSlotAvailable('20:00', '22:00', existingBookings)).toBe(true)
    })

    it('should return false for overlapping slots', () => {
      expect(isTimeSlotAvailable('09:00', '11:00', existingBookings)).toBe(false)
      expect(isTimeSlotAvailable('11:00', '15:00', existingBookings)).toBe(false)
      expect(isTimeSlotAvailable('13:00', '17:00', existingBookings)).toBe(false)
      expect(isTimeSlotAvailable('18:00', '19:00', existingBookings)).toBe(false)
    })

    it('should return false for exact matches', () => {
      expect(isTimeSlotAvailable('10:00', '12:00', existingBookings)).toBe(false)
      expect(isTimeSlotAvailable('14:00', '16:00', existingBookings)).toBe(false)
    })

    it('should return false for partial overlaps', () => {
      expect(isTimeSlotAvailable('11:30', '13:30', existingBookings)).toBe(false)
      expect(isTimeSlotAvailable('15:30', '17:30', existingBookings)).toBe(false)
    })

    it('should return true for empty bookings array', () => {
      expect(isTimeSlotAvailable('10:00', '12:00', [])).toBe(true)
    })
  })

  describe('generateBusinessHours', () => {
    it('should generate hourly slots for default hours', () => {
      const slots = generateBusinessHours()
      expect(slots).toContain('09:00')
      expect(slots).toContain('10:00')
      expect(slots).toContain('20:00') // Last slot that fits before 21:00
      expect(slots).not.toContain('21:00') // Would end at 22:00, outside operating hours
    })

    it('should generate slots for custom operating hours', () => {
      const slots = generateBusinessHours('06:00', '23:00')
      expect(slots[0]).toBe('06:00')
      expect(slots).toContain('22:00') // Last slot that fits
      expect(slots).not.toContain('23:00')
    })

    it('should handle half-hour boundaries', () => {
      const slots = generateBusinessHours('09:30', '17:30')
      expect(slots[0]).toBe('09:30')
      expect(slots).toContain('16:30') // Last slot that fits
      expect(slots).not.toContain('17:30')
    })

    it('should generate correct number of slots', () => {
      const slots = generateBusinessHours('09:00', '17:00') // 8 hours
      expect(slots.length).toBe(8) // 9:00, 10:00, ..., 16:00
    })

    it('should handle edge case of very short operating window', () => {
      const slots = generateBusinessHours('09:00', '10:00') // 1 hour window
      expect(slots).toEqual(['09:00'])
    })

    it('should return empty array if operating window is too small', () => {
      const slots = generateBusinessHours('09:00', '09:30') // 30 min window, 1 hour slots
      expect(slots).toEqual([])
    })
  })
})

describe('Date Utility Functions', () => {
  describe('date formatting and validation', () => {
    it('should validate date format YYYY-MM-DD', () => {
      const isValidDateFormat = (date: string): boolean => {
        const regex = /^\d{4}-\d{2}-\d{2}$/
        if (!regex.test(date)) return false
        
        const dateObj = new Date(date + 'T00:00:00') // Add time to avoid timezone issues
        return dateObj instanceof Date && !isNaN(dateObj.getTime())
      }

      expect(isValidDateFormat('2025-12-01')).toBe(true)
      expect(isValidDateFormat('25-12-01')).toBe(false)    // Wrong format
      expect(isValidDateFormat('2025/12/01')).toBe(false)  // Wrong separator
      expect(isValidDateFormat('invalid')).toBe(false)
    })

    it('should check if date is in future', () => {
      const isFutureDate = (date: string): boolean => {
        const inputDate = new Date(date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        inputDate.setHours(0, 0, 0, 0)
        
        return inputDate >= today
      }

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      expect(isFutureDate(tomorrowStr)).toBe(true)
      expect(isFutureDate(yesterdayStr)).toBe(false)
    })

    it('should get next N business days', () => {
      const getNextBusinessDays = (count: number): string[] => {
        const days: string[] = []
        const date = new Date()
        
        // Start from tomorrow
        date.setDate(date.getDate() + 1)
        
        while (days.length < count) {
          // Skip weekends (0 = Sunday, 6 = Saturday)
          if (date.getDay() !== 0 && date.getDay() !== 6) {
            days.push(date.toISOString().split('T')[0])
          }
          date.setDate(date.getDate() + 1)
        }
        
        return days
      }

      const businessDays = getNextBusinessDays(3) // Test with 3 days instead of 5
      expect(businessDays).toHaveLength(3)
      
      // All should be valid dates and weekdays
      businessDays.forEach(day => {
        const date = new Date(day + 'T00:00:00')
        expect(date instanceof Date && !isNaN(date.getTime())).toBe(true)
        
        const dayOfWeek = date.getDay()
        // Should be Monday(1) through Friday(5)
        expect(dayOfWeek).toBeGreaterThanOrEqual(1)
        expect(dayOfWeek).toBeLessThanOrEqual(5)
      })
    })
  })
})
