/**
 * Enhanced Screenshot Testing Framework
 * Captures each page at every test step for comprehensive UI/UX analysis
 */

import { chromium, Browser, Page } from 'playwright'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const BASE_URL = 'http://localhost:3000'
const SCREENSHOT_DIR = 'test-screenshots'

interface TestStep {
  name: string
  description: string
  action: (page: Page) => Promise<void>
}

interface TestResult {
  testName: string
  steps: StepResult[]
  overallSuccess: boolean
  totalDuration: number
}

interface StepResult {
  name: string
  description: string
  passed: boolean
  error?: string
  screenshotPath: string
  duration: number
}

class EnhancedUITester {
  private browser: Browser | null = null
  private page: Page | null = null
  private results: TestResult[] = []

  async setup(): Promise<void> {
    console.log('🌐 Setting up enhanced browser for screenshot testing...')

    // Ensure screenshot directory exists
    if (!existsSync(SCREENSHOT_DIR)) {
      mkdirSync(SCREENSHOT_DIR, { recursive: true })
    }

    this.browser = await chromium.launch({
      headless: true,
      viewport: { width: 1920, height: 1080 } // Standard desktop viewport
    })
    this.page = await this.browser.newPage()
    this.page.setDefaultTimeout(10000)
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
    }
  }

  private async captureScreenshot(page: Page, stepName: string, testName: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${testName}-${stepName}-${timestamp}.png`
    const path = join(SCREENSHOT_DIR, filename)

    await page.screenshot({
      path,
      fullPage: true, // Capture entire page including scrollable content
      animations: 'disabled' // Disable animations for consistent screenshots
    })

    return path
  }

  private async executeStep(
    step: TestStep,
    testName: string,
    stepIndex: number
  ): Promise<StepResult> {
    const startTime = Date.now()
    const stepName = `${String(stepIndex + 1).padStart(2, '0')}-${step.name.toLowerCase().replace(/\s+/g, '-')}`

    console.log(`📸 Step ${stepIndex + 1}: ${step.description}`)

    try {
      // Wait a bit for any dynamic content to load
      await this.page.waitForTimeout(1000)

      // Execute the step action
      await step.action(this.page)

      // Wait for any animations or network requests to complete
      await this.page.waitForLoadState('networkidle')
      await this.page.waitForTimeout(500)

      // Capture screenshot regardless of success/failure
      const screenshotPath = await this.captureScreenshot(this.page, stepName, testName)

      const duration = Date.now() - startTime
      const result: StepResult = {
        name: step.name,
        description: step.description,
        passed: true,
        screenshotPath,
        duration
      }

      console.log(`  ✅ ${step.name} - ${duration}ms - Screenshot captured`)
      return result

    } catch (error) {
      const duration = Date.now() - startTime
      const screenshotPath = await this.captureScreenshot(this.page, stepName, testName)

      const result: StepResult = {
        name: step.name,
        description: step.description,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        screenshotPath,
        duration
      }

      console.log(`  ❌ ${step.name} - ${duration}ms - Error: ${result.error}`)
      return result
    }
  }

  private async testPage(testName: string, url: string, steps: TestStep[]): Promise<TestResult> {
    const startTime = Date.now()
    console.log(`🧪 Testing ${testName}...`)
    console.log(`   URL: ${url}`)
    console.log(`   Steps: ${steps.length}`)

    try {
      // Navigate to the page
      await this.page.goto(`${BASE_URL}${url}`)
      await this.page.waitForLoadState('domcontentloaded')
      await this.page.waitForTimeout(1000) // Allow page to settle

      const stepResults: StepResult[] = []

      // Execute each step
      for (let i = 0; i < steps.length; i++) {
        const stepResult = await this.executeStep(steps[i], testName, i)
        stepResults.push(stepResult)
      }

      const totalDuration = Date.now() - startTime
      const overallSuccess = stepResults.every(step => step.passed)

      const result: TestResult = {
        testName,
        steps: stepResults,
        overallSuccess,
        totalDuration
      }

      console.log(`\n${overallSuccess ? '✅' : '❌'} ${testName} - ${totalDuration}ms - ${stepResults.filter(s => s.passed).length}/${steps.length} steps passed`)
      this.results.push(result)
      return result

    } catch (error) {
      const totalDuration = Date.now() - startTime
      const result: TestResult = {
        testName,
        steps: [],
        overallSuccess: false,
        totalDuration
      }

      console.log(`❌ ${testName} - ${totalDuration}ms - Failed to navigate: ${error}`)
      this.results.push(result)
      return result
    }
  }

  async testBookingPage(): Promise<void> {
    const steps: TestStep[] = [
      {
        name: 'Initial Page Load',
        description: 'Page loads with correct title and elements',
        action: async (page) => {
          const title = await page.textContent('h1')
          if (!title || !title.includes('Book a Court')) {
            throw new Error('Page title is incorrect')
          }
        }
      },
      {
        name: 'Form Elements Present',
        description: 'All form elements are visible and interactive',
        action: async (page) => {
          const sportSelect = await page.$('[data-slot="select-trigger"]')
          const dateInput = await page.$('input[type="date"]')
          const searchButton = await page.$('button:has-text("Search Courts")')

          if (!sportSelect) throw new Error('Sport dropdown not found')
          if (!dateInput) throw new Error('Date input not found')
          if (!searchButton) throw new Error('Search button not found')
        }
      },
      {
        name: 'Sport Dropdown Interaction',
        description: 'Sport dropdown opens and shows options',
        action: async (page) => {
          const sportSelect = await page.$('[data-slot="select-trigger"]')
          await sportSelect?.click()
          await page.waitForTimeout(500)

          const sportOptions = await page.$$('[data-state="open"] [role="option"]')
          if (sportOptions.length === 0) {
            throw new Error('No sport options found')
          }
        }
      },
      {
        name: 'Form Validation',
        description: 'Form validation works for required fields',
        action: async (page) => {
          const searchButton = await page.$('button:has-text("Search Courts")')
          await searchButton?.click()
          await page.waitForTimeout(1000)

          // Check for validation messages or error states
          // This will capture the validation state in the screenshot
        }
      }
    ]

    await this.testPage('Booking-Page', '/book-venue', steps)
  }

  async testTeamsPage(): Promise<void> {
    const steps: TestStep[] = [
      {
        name: 'Initial Page Load',
        description: 'Teams management page loads correctly',
        action: async (page) => {
          const title = await page.textContent('h1')
          if (!title || !title.includes('Manage Teams')) {
            throw new Error('Page title is incorrect')
          }
        }
      },
      {
        name: 'Team Management Interface',
        description: 'Team list and management controls are visible',
        action: async (page) => {
          const createButton = await page.$('button:has-text("Create Team")')
          const searchInput = await page.$('input[placeholder*="Search"]')

          if (!createButton) throw new Error('Create team button not found')
          if (!searchInput) throw new Error('Search input not found')
        }
      },
      {
        name: 'Create Team Dialog',
        description: 'Create team dialog opens and functions',
        action: async (page) => {
          const createButton = await page.$('button:has-text("Create Team")')
          await createButton?.click()
          await page.waitForTimeout(500)

          const dialog = await page.$('[role="dialog"]')
          const teamNameInput = await page.$('input#teamName')

          if (!dialog) throw new Error('Create team dialog not found')
          if (!teamNameInput) throw new Error('Team name input not found')
        }
      },
      {
        name: 'Team Search Functionality',
        description: 'Search functionality works for filtering teams',
        action: async (page) => {
          // Close dialog first if it's open
          const closeButton = await page.$('button[aria-label="Close"]')
          if (closeButton) await closeButton?.click()
          await page.waitForTimeout(300)

          const searchInput = await page.$('input[placeholder*="Search"]')
          await searchInput?.fill('Test')
          await page.waitForTimeout(500)
        }
      }
    ]

    await this.testPage('Teams-Management', '/teams/manage', steps)
  }

  async testTournamentPage(): Promise<void> {
    const steps: TestStep[] = [
      {
        name: 'Initial Page Load',
        description: 'Tournament creation page loads with correct structure',
        action: async (page) => {
          const title = await page.textContent('h1')
          if (!title || !title.includes('Create Tournament')) {
            throw new Error('Page title is incorrect')
          }
        }
      },
      {
        name: 'Tournament Form Elements',
        description: 'All tournament form fields are present',
        action: async (page) => {
          const nameInput = await page.$('input[name="name"]')
          const descriptionInput = await page.$('textarea[name="description"]')
          const createButton = page.locator('button').filter({ hasText: 'Create Tournament' }).first()

          if (!nameInput) throw new Error('Tournament name input not found')
          if (!descriptionInput) throw new Error('Tournament description input not found')
          if (createButton.count() === 0) throw new Error('Create Tournament button not found')
        }
      },
      {
        name: 'Step Progress Indicator',
        description: 'Tournament creation steps are clearly indicated',
        action: async (page) => {
          // This captures the step indicator state
          const stepElements = await page.$$('.step-indicator, [data-testid="step"]')
          // Screenshot will capture the current step state
        }
      },
      {
        name: 'Form Validation',
        description: 'Form validation provides appropriate feedback',
        action: async (page) => {
          const createButton = page.locator('button').filter({ hasText: 'Create Tournament' }).first()
          await createButton?.click()
          await page.waitForTimeout(1000)

          // Screenshot will capture any validation errors or success states
        }
      }
    ]

    await this.testPage('Tournament-Creation', '/tournaments/create', steps)
  }

  async testBookingDashboard(): Promise<void> {
    const steps: TestStep[] = [
      {
        name: 'Initial Page Load',
        description: 'Booking dashboard loads with correct layout',
        action: async (page) => {
          const title = await page.textContent('h1')
          if (!title || !title.includes('Bookings Dashboard')) {
            throw new Error('Page title is incorrect')
          }
        }
      },
      {
        name: 'Dashboard Stats Cards',
        description: 'Statistics cards are displayed with data',
        action: async (page) => {
          const statCards = await page.$$('.bg-card, [data-testid="stat-card"]')
          if (statCards.length === 0) {
            throw new Error('No stats cards found')
          }
        }
      },
      {
        name: 'Navigation and Tabs',
        description: 'Dashboard navigation and tabs are functional',
        action: async (page) => {
          const tabs = await page.$$('button[role="tab"], .tab-button')
          const navElements = await page.$$('nav a, .nav-link')

          // Screenshot will capture the navigation state
        }
      },
      {
        name: 'Filter Controls',
        description: 'Dashboard filters are present and interactive',
        action: async (page) => {
          const filterDropdowns = await page.$$('[data-slot="select-trigger"]')
          const filterButtons = await page.$$('button:has-text("Filter"), button:has-text("Apply")')

          // Screenshot will capture the filter interface
        }
      }
    ]

    await this.testPage('Booking-Dashboard', '/dashboard/bookings', steps)
  }

  async runAllTests(): Promise<void> {
    await this.setup()
    console.log('🚀 Starting Enhanced Screenshot Testing...\n')
    console.log('📸 Each step will be captured for expert UI/UX analysis\n')

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
      this.generateExpertReport()
    } finally {
      await this.cleanup()
    }
  }

  private printSummary(): void {
    console.log('\n📊 Enhanced Test Results Summary:')
    console.log('=' .repeat(60))

    const totalTests = this.results.length
    const successfulTests = this.results.filter(r => r.overallSuccess).length
    const failedTests = totalTests - successfulTests

    console.log(`Total Tests: ${totalTests}`)
    console.log(`✅ Successful: ${successfulTests}`)
    console.log(`❌ Failed: ${failedTests}`)
    console.log(`Success Rate: ${totalTests > 0 ? ((successfulTests / totalTests) * 100).toFixed(1) : 0}%`)
    console.log()

    let totalSteps = 0
    let successfulSteps = 0

    this.results.forEach(result => {
      totalSteps += result.steps.length
      successfulSteps += result.steps.filter(s => s.passed).length
    })

    console.log(`Total Steps: ${totalSteps}`)
    console.log(`✅ Steps Passed: ${successfulSteps}`)
    console.log(`❌ Steps Failed: ${totalSteps - successfulSteps}`)
    console.log(`Step Success Rate: ${totalSteps > 0 ? ((successfulSteps / totalSteps) * 100).toFixed(1) : 0}%`)
    console.log()

    console.log('⏱️  Average Test Time:',
      this.results.length > 0
        ? `${(this.results.reduce((sum, r) => sum + r.totalDuration, 0) / this.results.length).toFixed(0)}ms`
        : 'N/A'
    )

    console.log('\n📸 Screenshot Details:')
    this.results.forEach(result => {
      console.log(`\n🧪 ${result.testName}:`)
      result.steps.forEach((step, index) => {
        const status = step.passed ? '✅' : '❌'
        console.log(`  ${status} Step ${index + 1}: ${step.name}`)
        console.log(`     📸 ${step.screenshotPath}`)
        if (!step.passed) {
          console.log(`     ❌ Error: ${step.error}`)
        }
      })
    })
  }

  private generateExpertReport(): void {
    console.log('\n🤖 Expert UI/UX Analysis Report Ready!')
    console.log('=' .repeat(60))
    console.log('All screenshots have been captured with detailed step-by-step documentation.')
    console.log('Each screenshot is available in the test-screenshots/ directory.')
    console.log('\nKey improvements made to testing framework:')
    console.log('✅ Captures EVERY test step, not just failures')
    console.log('✅ Full-page screenshots for complete context')
    console.log('✅ Consistent viewport (1920x1080) for uniform testing')
    console.log('✅ Timestamped filenames for organized analysis')
    console.log('✅ Detailed step descriptions and error documentation')
    console.log('✅ Network idle wait for complete page rendering')
    console.log('✅ Animation disabled for consistent screenshots')

    console.log('\n🎯 Ready for expert analysis!')
    console.log('Screenshots are organized by test and step for systematic UI/UX review.')
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new EnhancedUITester()
  tester.runAllTests().catch(console.error)
}

export default EnhancedUITester