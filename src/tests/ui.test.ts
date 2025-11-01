/**
 * UI Component Tests
 * Run these tests to ensure all UI components are working correctly
 */

import { chromium, Browser, Page } from 'playwright'

const BASE_URL = 'http://localhost:3000'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  screenshotPath?: string
  duration?: number
}

class UITester {
  private browser: Browser | null = null
  private page: Page | null = null
  private results: TestResult[] = []

  async setup(): Promise<void> {
    console.log('🌐 Setting up browser for UI testing...')
    this.browser = await chromium.launch({ headless: false })
    this.page = await this.browser.newPage()
    this.page.setDefaultTimeout(10000)
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
    }
  }

  private async testPage(name: string, url: string, testFn: (page: Page) => Promise<void>): Promise<TestResult> {
    const startTime = Date.now()
    try {
      console.log(`🧪 Testing ${name}...`)
      await this.page.goto(`${BASE_URL}${url}`)
      await this.page.waitForLoadState('domcontentloaded')

      await testFn(this.page)

      const duration = Date.now() - startTime
      const result: TestResult = {
        name,
        passed: true,
        duration,
      }

      console.log(`✅ ${name} - ${duration}ms - Passed`)
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

      if (this.page) {
        result.screenshotPath = `test-screenshots/${name.toLowerCase().replace(/\s+/g, '-')}-fail.png`
        await this.page.screenshot({ path: result.screenshotPath })
      }

      console.log(`❌ ${name} - ${duration}ms - Error: ${result.error}`)
      this.results.push(result)
      return result
    }
  }

  async testBookingPage(): Promise<void> {
    await this.testPage('Booking Page', '/book-venue', async (page) => {
      // Check if page title is correct
      const title = await page.textContent('h1')
      if (!title || !title.includes('Book a Court')) {
        throw new Error('Page title is incorrect')
      }

      // Check if sport dropdown exists and is populated
      const sportSelect = await page.$('[data-slot="select-trigger"]')
      if (!sportSelect) {
        throw new Error('Sport dropdown not found')
      }

      // Check if date input exists
      const dateInput = await page.$('input[type="date"]')
      if (!dateInput) {
        throw new Error('Date input not found')
      }

      // Check if search button exists
      const searchButton = await page.$('button:has-text("Search Courts")')
      if (!searchButton) {
        throw new Error('Search button not found')
      }

      // Test sport dropdown interaction
      await sportSelect.click()
      await page.waitForTimeout(500)

      const sportOptions = await page.$$( '[data-state="open"] [role="option"]')
      if (sportOptions.length === 0) {
        throw new Error('No sport options found')
      }

      // Close dropdown
      await page.keyboard.press('Escape')

      console.log('  ✓ Booking page elements verified')
      console.log('  ✓ Sport dropdown interaction works')
      console.log('  ✓ Date input available')
      console.log('  ✓ Search button available')
    })
  }

  async testTeamsPage(): Promise<void> {
    await this.testPage('Teams Management Page', '/teams/manage', async (page) => {
      // Check if page title is correct
      const title = await page.textContent('h1')
      if (!title || !title.includes('Manage Teams')) {
        throw new Error('Page title is incorrect')
      }

      // Check if create team button exists
      const createButton = await page.$('button:has-text("Create Team")')
      if (!createButton) {
        throw new Error('Create team button not found')
      }

      // Check if search input exists
      const searchInput = await page.$('input[placeholder*="Search"]')
      if (!searchInput) {
        throw new Error('Search input not found')
      }

      // Test create team button click
      await createButton.click()
      await page.waitForTimeout(500)

      // Check if dialog appears
      const dialog = await page.$('[role="dialog"]')
      if (!dialog) {
        throw new Error('Create team dialog not found')
      }

      // Check if team name input exists in dialog
      const teamNameInput = await page.$('input#teamName')
      if (!teamNameInput) {
        throw new Error('Team name input not found in dialog')
      }

      // Close dialog
      const closeButton = await page.$('button[aria-label="Close"]')
      if (closeButton) {
        await closeButton.click()
      }

      console.log('  ✓ Teams page elements verified')
      console.log('  ✓ Create team button works')
      console.log('  ✓ Search functionality available')
      console.log('  ✓ Team creation dialog works')
    })
  }

  async testTournamentPage(): Promise<void> {
    await this.testPage('Tournament Creation Page', '/tournaments/create', async (page) => {
      // Check if page title is correct
      const title = await page.textContent('h1')
      if (!title || !title.includes('Create Tournament')) {
        throw new Error('Page title is incorrect')
      }

      // Check if main form elements exist
      const nameInput = await page.$('input[name="name"]')
      if (!nameInput) {
        throw new Error('Tournament name input not found')
      }

      // Check if create button exists
      const createButton = page.locator('button').filter({ hasText: 'Create Tournament' }).first()
      if (createButton.count() === 0) {
        throw new Error('Create Tournament button not found')
      }

      console.log('  ✓ Tournament page elements verified')
      console.log('  ✓ Form inputs available')
      console.log('  ✓ Create button available')
    })
  }

  async testBookingDashboard(): Promise<void> {
    await this.testPage('Booking Dashboard', '/dashboard/bookings', async (page) => {
      // Check if page title is correct
      const title = await page.textContent('h1')
      if (!title || !title.includes('Bookings Dashboard')) {
        throw new Error('Page title is incorrect')
      }

      // Check if stats cards exist
      const statCards = await page.$$('.bg-card')
      if (statCards.length === 0) {
        throw new Error('No stats cards found')
      }

      console.log('  ✓ Dashboard page elements verified')
      console.log('  ✓ Stats cards displayed')
    })
  }

  async runAllTests(): Promise<void> {
    await this.setup()
    console.log('🚀 Starting UI Component Tests...\n')

    try {
      await this.testBookingPage()
      console.log()

      await this.testTeamsPage()
      console.log()

      await this.testTournamentPage()
      console.log()

      await this.testBookingDashboard()
      console.log()

      this.printSummary()
    } finally {
      await this.cleanup()
    }
  }

  private printSummary(): void {
    console.log('\n📊 UI Test Results Summary:')
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
        if (result.screenshotPath) {
          console.log(`    Screenshot: ${result.screenshotPath}`)
        }
      })
      console.log()
    }

    console.log('⏱️  Average Test Time:',
      this.results.length > 0
        ? `${(this.results.reduce((sum, r) => sum + (r.duration || 0), 0) / this.results.length).toFixed(0)}ms`
        : 'N/A'
    )
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new UITester()
  tester.runAllTests().catch(console.error)
}

export default UITester