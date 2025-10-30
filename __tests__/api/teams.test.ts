import { describe, it, expect, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/teams/route'
import { GET as GetTeam, PUT, DELETE } from '@/app/api/teams/[id]/route'
import { GET as GetMembers, POST as AddMember } from '@/app/api/teams/[id]/members/route'

describe('/api/teams', () => {
  // ✨ Database cleaned automatically before each test!

  describe('GET /api/teams', () => {
    it('should return empty teams list initially', async () => {
      const request = new NextRequest('http://localhost:3000/api/teams')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.teams).toEqual([])
      expect(data.count).toBe(0)
    })

    it('should filter teams by sport', async () => {
      const url = new URL('http://localhost:3000/api/teams')
      url.searchParams.set('sportId', 'football')

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.teams)).toBe(true)
      expect(data.filters.sportId).toBe('football')
    })

    it('should return count and filters in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/teams')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.count).toBeDefined()
      expect(data.filters).toBeDefined()
      expect(typeof data.count).toBe('number')
    })
  })

  describe('POST /api/teams', () => {
    it('should create a new team successfully', async () => {
      const teamData = {
        name: 'Test Warriors',
        description: 'A test team for unit testing',
        captainId: 'test-customer-1',
        sportId: 'football',
        formatId: 'test-format-1',
        maxPlayers: 22,
        city: 'Test City',
        area: 'Test Area',
        isPublic: true
      }

      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.team).toBeDefined()
      expect(data.team.name).toBe('Test Warriors')
      expect(data.team.captainId).toBe('test-customer-1')
      expect(data.team.sportId).toBe('football')
    })

    it('should reject team creation with missing required fields', async () => {
      const invalidData = {
        name: 'Test Warriors',
        // Missing captainId, sportId, formatId, maxPlayers
      }

      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Missing required fields')
    })

    it('should reject team creation for non-existent captain', async () => {
      const teamData = {
        name: 'Test Warriors',
        captainId: 'non-existent-user',
        sportId: 'football',
        formatId: 'test-format-1',
        maxPlayers: 22
      }

      const request = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      })

      const response = await POST(request)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Captain not found')
    })
  })

  describe('Team Management', () => {
    it('should get team details', async () => {
      // First create a team
      const teamData = {
        name: 'Test Team for Details',
        captainId: 'test-customer-1',
        sportId: 'football',
        formatId: 'test-format-1',
        maxPlayers: 11
      }

      const createRequest = new NextRequest('http://localhost:3000/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      })

      const createResponse = await POST(createRequest)
      const createData = await createResponse.json()
      const createdTeam = createData.team

      // Now get team details
      const getResponse = await GetTeam(
        new NextRequest(`http://localhost:3000/api/teams/${createdTeam.id}`),
        { params: Promise.resolve({ id: createdTeam.id }) }
      )

      const data = await getResponse.json()
      expect(getResponse.status).toBe(200)
      expect(data.team).toBeDefined()
      expect(data.team.id).toBe(createdTeam.id)
      expect(data.team.name).toBe('Test Team for Details')
    })

    it('should add team member', async () => {
      // First create a team
      const teamData = {
        name: 'Test Team for Members',
        captainId: 'test-customer-1',
        sportId: 'football',
        formatId: 'test-format-1',
        maxPlayers: 22
      }

      const createRequest = new NextRequest('http://localhost:3000/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      })

      const createResponse = await POST(createRequest)
      const createData = await createResponse.json()
      const createdTeam = createData.team

      // Add a team member
      const memberData = {
        userId: 'test-admin-1',
        role: 'member'
      }

      const addMemberRequest = new NextRequest(
        `http://localhost:3000/api/teams/${createdTeam.id}/members`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memberData)
        }
      )

      const response = await AddMember(addMemberRequest, { params: Promise.resolve({ id: createdTeam.id }) })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.message).toBe('Team member added successfully')
      expect(data.member.userId).toBe('test-admin-1')
    })
  })
})