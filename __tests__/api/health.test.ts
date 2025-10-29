import { describe, it, expect } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/health/route'

describe('/api/health', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBeDefined()
      expect(data.message).toBe('Good!')
    })

    it('should return response with proper headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')
    })
  })
})