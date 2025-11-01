/**
 * API Integration Tests
 * Run these tests to ensure all API endpoints are working correctly
 */

const API_BASE_URL = 'http://localhost:3000'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  response?: any
  duration?: number
}

class APITester {
  private results: TestResult[] = []

  private async testAPI(name: string, url: string, options: RequestInit = {}): Promise<TestResult> {
    const startTime = Date.now()
    try {
      console.log(`🧪 Testing ${name}...`)
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      const duration = Date.now() - startTime
      const data = await response.json()

      const result: TestResult = {
        name,
        passed: response.ok,
        response: data,
        duration,
      }

      if (response.ok) {
        console.log(`✅ ${name} - ${duration}ms - Status: ${response.status}`)
      } else {
        console.log(`❌ ${name} - ${duration}ms - Status: ${response.status}`)
        result.error = data.error || `HTTP ${response.status}`
      }

      this.results.push(result)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const result: TestResult = {
        name,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      }
      console.log(`❌ ${name} - ${duration}ms - Error: ${result.error}`)
      this.results.push(result)
      return result
    }
  }

  async testSportsAPI(): Promise<void> {
    await this.testAPI('Sports API - GET', '/api/sports')
    await this.testAPI('Sports API - POST', '/api/sports', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Sport',
        displayName: 'Test Sport Display',
        icon: '🏈',
        description: 'Test sport for testing',
        isActive: true,
      }),
    })
  }

  async testTeamsAPI(): Promise<void> {
    await this.testAPI('Teams API - GET', '/api/teams')
    await this.testAPI('Teams API - POST', '/api/teams', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Team',
        description: 'Test team for testing',
        sportId: 'sport-1',
        formatId: 'format-1',
        city: 'Test City',
        maxPlayers: 10,
        isActive: true,
      }),
    })
  }

  async testCourtsAPI(): Promise<void> {
    await this.testAPI('Courts API - GET', '/api/courts')
    await this.testAPI('Courts API - GET with filters', '/api/courts?sport=soccer&date=2025-11-01&duration=2')
  }

  async testVenuesAPI(): Promise<void> {
    await this.testAPI('Venues API - GET', '/api/venues')
    await this.testAPI('Venues API - GET with city filter', '/api/venues?city=Bangalore')
  }

  async testTournamentsAPI(): Promise<void> {
    await this.testAPI('Tournaments API - GET', '/api/tournaments')
    await this.testAPI('Tournaments API - POST', '/api/tournaments', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Tournament',
        description: 'Test tournament',
        sportId: 'sport-1',
        maxTeams: 8,
        startDate: '2025-12-01',
        endDate: '2025-12-02',
        entryFee: 1000,
        prizePool: 5000,
        status: 'DRAFT',
        isPublic: true,
      }),
    })
  }

  async testBookingsAPI(): Promise<void> {
    await this.testAPI('Bookings API - GET', '/api/bookings')
    await this.testAPI('Bookings API - POST', '/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        courtId: 'court-1',
        userId: 'test-user-id',
        sportId: 'sport-1',
        startTime: new Date('2025-12-01T10:00:00.000Z').toISOString(),
        duration: 2,
        totalAmount: 1600,
        type: 'SIMPLE',
        title: 'Test Booking',
        status: 'PENDING_PAYMENT',
      }),
    })
  }

  async testPaymentsAPI(): Promise<void> {
    await this.testAPI('Payments API - GET', '/api/payments')
    await this.testAPI('Payments API - POST', '/api/payments', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'test-user-id',
        amount: 160000, // Amount in cents
        currency: 'INR',
        method: 'CREDIT_CARD',
        type: 'BOOKING_PAYMENT',
        bookingId: 'test-booking-id',
        description: 'Test payment',
      }),
    })
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting API Integration Tests...\n')

    await this.testSportsAPI()
    console.log()

    await this.testTeamsAPI()
    console.log()

    await this.testCourtsAPI()
    console.log()

    await this.testVenuesAPI()
    console.log()

    await this.testTournamentsAPI()
    console.log()

    await this.testBookingsAPI()
    console.log()

    await this.testPaymentsAPI()
    console.log()

    this.printSummary()
  }

  private printSummary(): void {
    console.log('\n📊 Test Results Summary:')
    console.log('=' .repeat(50))

    const totalTests = this.results.length
    const passedTests = this.results.filter(r => r.passed).length
    const failedTests = totalTests - passedTests

    console.log(`Total Tests: ${totalTests}`)
    console.log(`✅ Passed: ${passedTests}`)
    console.log(`❌ Failed: ${failedTests}`)
    console.log(`Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`)
    console.log()

    if (failedTests > 0) {
      console.log('❌ Failed Tests:')
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.name}: ${result.error}`)
      })
      console.log()
    }

    console.log('⏱️  Average Response Time:',
      this.results.length > 0
        ? `${(this.results.reduce((sum, r) => sum + (r.duration || 0), 0) / this.results.length).toFixed(0)}ms`
        : 'N/A'
    )
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new APITester()
  tester.runAllTests().catch(console.error)
}

export default APITester