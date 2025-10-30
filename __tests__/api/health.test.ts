import { describe, it, expect } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/health/route'

describe('/api/health', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBeDefined()
      expect(data.message).toBe('Good!')
    })

    it('should return response with proper headers', async () => {
      const response = await GET()

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')
    })
  })
})