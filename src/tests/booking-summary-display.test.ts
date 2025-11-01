import { chromium, Browser, Page } from 'playwright'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface BookingSummaryTestStep {
  name: string
  action: (page: Page) => Promise<void>
  expect?: (page: Page) => Promise<boolean>
  description: string
}

interface BookingSummaryTestResult {
  step: string
  success: boolean
  error?: string
  screenshotPath: string
  duration: number
  description: string
  bookingDetails?: any
}

class BookingSummaryTest {
  private page: Page
  private browser: Browser
  private screenshotsDir: string

  constructor() {
    this.screenshotsDir = join(process.cwd(), 'test-screenshots-booking-summary')
  }

  async setup() {
    console.log('🌐 Setting up browser for booking summary test...')

    // Ensure screenshots directory exists
    await mkdir(this.screenshotsDir, { recursive: true })

    this.browser = await chromium.launch({
      headless: false,
      slowMo: 800, // Slow down for realistic user interaction
      args: [
        '--start-maximized',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    })

    // Test with responsive desktop viewport (common laptop size)
    const context = await this.browser.newContext({
      viewport: { width: 1366, height: 768 }, // More realistic laptop size
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false
    })

    this.page = await context.newPage()

    // Disable animations for consistent screenshots
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-delay: 0.01ms !important;
          transition-duration: 0.01ms !important;
          transition-delay: 0.01ms !important;
        }
      `
    })
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  private async captureScreenshot(stepName: string, testName: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${testName}-${stepName}-${timestamp}.png`
    const screenshotPath = join(this.screenshotsDir, filename)

    await this.page.screenshot({
      path: screenshotPath,
      fullPage: true
    })

    return screenshotPath
  }

  private async extractBookingSummary(page: Page): Promise<any> {
    try {
      const bookingSummary = {
        bookingId: await page.textContent('span:has-text("Booking ID:") + span'),
        title: await page.textContent('span:has-text("Title:") + span'),
        bookingType: await page.textContent('span:has-text("Booking Type:") + span'),
        status: await page.textContent('span:has-text("Status:") + span'),
        courtName: await page.textContent('span:has-text("Court:") + span'),
        venueName: await page.textContent('span:has-text("Venue:") + span'),
        sport: await page.textContent('span:has-text("Sport:") + span'),
        address: await page.textContent('span:has-text("Address:") + span'),
        date: await page.textContent('span:has-text("Date:") + span'),
        time: await page.textContent('span:has-text("Time:") + span'),
        duration: await page.textContent('span:has-text("Duration:") + span'),
        totalAmount: await page.textContent('span:has-text("Total Amount:") + span'),
        paymentStatus: await page.textContent('span:has-text("Payment Status:") + span'),
        paymentMethod: await page.textContent('span:has-text("Payment Method:") + span')
      }

      // Clean up null values
      Object.keys(bookingSummary).forEach(key => {
        if (bookingSummary[key]) {
          bookingSummary[key] = bookingSummary[key].trim()
        } else {
          delete bookingSummary[key]
        }
      })

      return bookingSummary
    } catch (error) {
      console.error('Error extracting booking summary:', error)
      return null
    }
  }

  private async executeStep(step: BookingSummaryTestStep, testName: string, stepIndex: number): Promise<BookingSummaryTestResult> {
    const stepNumber = (stepIndex + 1).toString().padStart(2, '0')
    const stepName = `${stepNumber}-${step.name.toLowerCase().replace(/\s+/g, '-')}`

    const startTime = Date.now()
    let success = false
    let error = ''
    let bookingDetails: any = null

    try {
      console.log(`📸 Step ${stepNumber}: ${step.description}`)

      // Execute the step action
      await step.action(this.page)

      // Wait for network to be idle after action
      await this.page.waitForLoadState('networkidle')

      // Extract booking summary details if on summary page
      const isOnSummaryPage = await this.page.$('text=Booking Summary') !== null
      if (isOnSummaryPage) {
        bookingDetails = await this.extractBookingSummary(this.page)
      }

      // Check expectation if provided
      if (step.expect) {
        const expectationMet = await step.expect(this.page)
        if (!expectationMet) {
          throw new Error('Step expectation not met')
        }
      }

      success = true
      console.log(`  ✅ ${step.name} - ${Date.now() - startTime}ms`)

    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error'
      console.log(`  ❌ ${step.name} - ${Date.now() - startTime}ms - Error: ${error}`)
    }

    // Always capture screenshot
    const screenshotPath = await this.captureScreenshot(stepName, testName)

    return {
      step: step.name,
      success,
      error,
      screenshotPath,
      duration: Date.now() - startTime,
      description: step.description,
      bookingDetails
    }
  }

  async runBookingSummaryTest(): Promise<{ results: BookingSummaryTestResult[], summary: any }> {
    console.log('🚀 Starting Comprehensive Booking Summary Test...')
    console.log('📸 This will test booking flow and verify summary display with proper currency, timezone, and formatting')
    console.log('')

    const testName = 'Booking-Summary-Display'
    const results: BookingSummaryTestResult[] = []

    // Comprehensive Booking Summary Test Steps
    const bookingSummaryTestSteps: BookingSummaryTestStep[] = [
      {
        name: 'Navigate to Booking Page',
        description: 'Navigate to book-venue page and verify it loads',
        action: async (page) => {
          await page.goto('http://localhost:3000/book-venue')
          await page.waitForLoadState('networkidle')
        },
        expect: async (page) => {
          await page.waitForSelector('h1:has-text("Book a Court")', { timeout: 10000 })
          const title = await page.textContent('h1')
          return title?.includes('Book a Court') || false
        }
      },

      {
        name: 'Complete Court Selection',
        description: 'Select sport, date, time and court to proceed to booking details',
        action: async (page) => {
          // Select sport (Football, not Soccer)
          await page.waitForSelector('button[role="combobox"]', { timeout: 10000 })
          await page.click('button[role="combobox"]')
          await page.waitForTimeout(500)
          await page.click('text=Football').catch(() => page.click('text=⚽ Football'))

          // Select date (tomorrow)
          const dateInput = await page.$('input[type="date"]')
          if (dateInput) {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            const dateStr = tomorrow.toISOString().split('T')[0]
            await dateInput.fill(dateStr)
          }

          // Wait for courts to load
          await page.waitForTimeout(2000)

          // Select the first available court
          const selectCourtButtons = await page.$$('button:has-text("Select Court")')
          if (selectCourtButtons.length > 0) {
            await selectCourtButtons[0].click()
            await page.waitForTimeout(1000)
          }
        },
        expect: async (page) => {
          // Check if we moved to step 2
          const bookingDetails = await page.$('text=Booking Details')
          return bookingDetails !== null
        }
      },

      {
        name: 'Fill Booking Details',
        description: 'Enter booking title and description',
        action: async (page) => {
          // Fill booking title
          const titleInput = await page.$('input[placeholder*="title"], input[id="title"]')
          if (titleInput) {
            await titleInput.fill('Test Soccer Match Booking')
          }

          // Fill description
          const descTextarea = await page.$('textarea[placeholder*="description"]')
          if (descTextarea) {
            await descTextarea.fill('Test booking for comprehensive summary verification')
          }

          // Fill notes
          const notesTextarea = await page.$('textarea[placeholder*="requirements"]')
          if (notesTextarea) {
            await notesTextarea.fill('Test notes for booking')
          }

          await page.waitForTimeout(500)
        },
        expect: async (page) => {
          const titleInput = await page.$('input[placeholder*="title"], input[id="title"]')
          if (titleInput) {
            const value = await titleInput.inputValue()
            return value.length > 0
          }
          return false
        }
      },

      {
        name: 'Proceed to Contact Information',
        description: 'Continue to user details step',
        action: async (page) => {
          const nextButton = await page.$('button:has-text("Next")')
          if (nextButton) {
            await nextButton.click()
            await page.waitForTimeout(1000)
          }
        },
        expect: async (page) => {
          const contactInfo = await page.$('text=Contact Information')
          return contactInfo !== null
        }
      },

      {
        name: 'Fill Contact Information',
        description: 'Enter user contact details',
        action: async (page) => {
          // Fill name
          const nameInput = await page.$('input[placeholder*="name"], input[id="name"]')
          if (nameInput) {
            await nameInput.fill('Test User')
          }

          // Fill email
          const emailInput = await page.$('input[type="email"], input[placeholder*="email"]')
          if (emailInput) {
            await emailInput.fill('testuser@example.com')
          }

          // Fill phone
          const phoneInput = await page.$('input[type="tel"], input[placeholder*="phone"], input[id="phone"]')
          if (phoneInput) {
            await phoneInput.fill('+1234567890')
          }

          await page.waitForTimeout(500)
        },
        expect: async (page) => {
          const nameValue = await page.$eval('input[placeholder*="name"], input[id="name"]',
            el => (el as HTMLInputElement).value).catch(() => '')
          const emailValue = await page.$eval('input[type="email"], input[placeholder*="email"]',
            el => (el as HTMLInputElement).value).catch(() => '')
          return nameValue.length > 0 && emailValue.includes('@')
        }
      },

      {
        name: 'Proceed to Payment',
        description: 'Continue to payment step',
        action: async (page) => {
          const nextButton = await page.$('button:has-text("Next")')
          if (nextButton) {
            await nextButton.click()
            await page.waitForTimeout(1000)
          }
        },
        expect: async (page) => {
          const paymentSection = await page.$('text=Payment')
          return paymentSection !== null
        }
      },

      {
        name: 'Select Payment Method',
        description: 'Choose cash payment method',
        action: async (page) => {
          // Look for payment method dropdown
          const paymentSelect = await page.$('select')
          if (paymentSelect) {
            await paymentSelect.click()
            await page.waitForTimeout(500)
            await paymentSelect.selectOption({ value: 'CASH' }).catch(() => {
              // Alternative approach
              page.click('text=Cash')
            })
          } else {
            // Try clicking on cash option directly
            await page.click('text=Cash').catch(() => {})
          }

          await page.waitForTimeout(500)
        },
        expect: async (page) => {
          const cashSelected = await page.$('text=Cash')
          return cashSelected !== null
        }
      },

      {
        name: 'Complete Booking',
        description: 'Submit booking to complete reservation',
        action: async (page) => {
          const submitButton = await page.$('button:has-text("Complete Booking")')
          if (submitButton) {
            await submitButton.click()
            await page.waitForTimeout(3000) // Wait for booking processing
          }
        },
        expect: async (page) => {
          await page.waitForTimeout(2000)
          // Check for booking summary or success message
          const bookingSummary = await page.$('text=Booking Summary')
          const successMessage = await page.$('text=Booking Confirmed')
          return bookingSummary !== null || successMessage !== null
        }
      },

      {
        name: 'Verify Booking Summary Display',
        description: 'Verify booking summary shows correct information',
        action: async (page) => {
          await page.waitForTimeout(2000)
        },
        expect: async (page) => {
          // Check if we're on the booking summary page
          const bookingSummary = await page.$('text=Booking Summary')
          if (!bookingSummary) {
            return false
          }

          // Verify key summary elements are present
          const elements = await Promise.all([
            page.$('text=Booking Information'),
            page.$('text=Court Information'),
            page.$('text=Schedule'),
            page.$('text=Payment'),
            page.$('text=Booking ID'),
            page.$('text=Title'),
            page.$('text=Total Amount')
          ])

          return elements.every(el => el !== null)
        }
      },

      {
        name: 'Extract and Validate Booking Details',
        description: 'Extract all booking summary details for validation',
        action: async (page) => {
          await page.waitForTimeout(1000)
        },
        expect: async (page) => {
          const bookingDetails = await this.extractBookingSummary(page)

          if (!bookingDetails) {
            return false
          }

          // Validate required fields are present
          const requiredFields = ['bookingId', 'title', 'courtName', 'venueName', 'totalAmount']
          const allFieldsPresent = requiredFields.every(field =>
            bookingDetails[field] && bookingDetails[field].length > 0
          )

          // Validate currency format (should not be just $)
          const hasProperCurrency = bookingDetails.totalAmount &&
            !bookingDetails.totalAmount.includes('$ ()') &&
            bookingDetails.totalAmount.length > 3

          // Validate timezone format (should not be empty parentheses)
          const hasProperTimezone = bookingDetails.time &&
            !bookingDetails.time.includes('()') &&
            bookingDetails.time.length > 5

          console.log(`    📋 Booking ID: ${bookingDetails.bookingId}`)
          console.log(`    📋 Title: ${bookingDetails.title}`)
          console.log(`    📋 Total Amount: ${bookingDetails.totalAmount}`)
          console.log(`    📋 Time: ${bookingDetails.time}`)
          console.log(`    📋 Currency Format OK: ${hasProperCurrency}`)
          console.log(`    📋 Timezone Format OK: ${hasProperTimezone}`)

          return allFieldsPresent && hasProperCurrency && hasProperTimezone
        }
      },

      {
        name: 'Verify Currency and Timezone Fixes',
        description: 'Verify currency and timezone are properly displayed',
        action: async (page) => {
          await page.waitForTimeout(1000)
        },
        expect: async (page) => {
          const bookingDetails = await this.extractBookingSummary(page)

          if (!bookingDetails) {
            return false
          }

          // Check currency is properly formatted (not $2,500 ())
          const currencyFormatValid = bookingDetails.totalAmount &&
            !bookingDetails.totalAmount.includes('$ ()') &&
            !bookingDetails.totalAmount.includes('()') &&
            /\$[\d,]+/.test(bookingDetails.totalAmount)

          // Check timezone is properly displayed (not empty parentheses)
          const timezoneFormatValid = bookingDetails.time &&
            !bookingDetails.time.includes('()') &&
            /[A-Z]{3,4}/.test(bookingDetails.time)

          console.log(`    ✅ Currency Format: ${currencyFormatValid ? 'VALID' : 'INVALID'}`)
          console.log(`    ✅ Timezone Format: ${timezoneFormatValid ? 'VALID' : 'INVALID'}`)
          console.log(`    💰 Total Amount Display: ${bookingDetails.totalAmount}`)
          console.log(`    🕐 Time Display: ${bookingDetails.time}`)

          return currencyFormatValid && timezoneFormatValid
        }
      }
    ]

    // Execute all steps
    for (let i = 0; i < bookingSummaryTestSteps.length; i++) {
      const step = bookingSummaryTestSteps[i]
      const result = await this.executeStep(step, testName, i)
      results.push(result)

      // If a critical step fails, we might want to continue anyway
      if (!result.success) {
        console.log(`  ⚠️  Step failed but continuing workflow to see full picture...`)
      }
    }

    // Generate summary
    const totalSteps = results.length
    const successfulSteps = results.filter(r => r.success).length
    const successRate = ((successfulSteps / totalSteps) * 100).toFixed(1)
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

    const summary = {
      testName,
      totalSteps,
      successfulSteps,
      failedSteps: totalSteps - successfulSteps,
      successRate: `${successRate}%`,
      totalDuration: `${totalDuration}ms`,
      averageStepTime: `${Math.round(totalDuration / totalSteps)}ms`,
      timestamp: new Date().toISOString(),
      bookingDetails: results.find(r => r.bookingDetails)?.bookingDetails
    }

    return { results, summary }
  }
}

// Main execution function
async function runBookingSummaryTest() {
  const test = new BookingSummaryTest()

  try {
    await test.setup()
    const { results, summary } = await test.runBookingSummaryTest()

    // Display results
    console.log('\n📊 Booking Summary Test Results:')
    console.log('='.repeat(70))

    console.log(`\n🧪 Test: ${summary.testName}`)
    console.log(`✅ Successful Steps: ${summary.successfulSteps}/${summary.totalSteps}`)
    console.log(`❌ Failed Steps: ${summary.failedSteps}`)
    console.log(`📈 Success Rate: ${summary.successRate}`)
    console.log(`⏱️  Total Duration: ${summary.totalDuration}`)
    console.log(`⚡ Average Step Time: ${summary.averageStepTime}`)
    console.log(`🕐 Completed: ${summary.timestamp}`)

    if (summary.bookingDetails) {
      console.log('\n📋 Final Booking Summary Details:')
      console.log('-'.repeat(50))
      Object.entries(summary.bookingDetails).forEach(([key, value]) => {
        if (value) {
          console.log(`${key}: ${value}`)
        }
      })
    }

    console.log('\n📸 Step-by-Step Results:')
    console.log('-'.repeat(70))

    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌'
      const errorInfo = result.error ? ` - ${result.error}` : ''
      console.log(`${status} Step ${index + 1}: ${result.description}${errorInfo}`)
      console.log(`   📸 Screenshot: ${result.screenshotPath.split('/').pop()}`)
      console.log(`   ⏱️  Duration: ${result.duration}ms`)
      if (result.bookingDetails) {
        console.log(`   📋 Has Booking Data: Yes`)
      }
      console.log('')
    })

    // Generate final analysis
    console.log('🎯 Booking Summary Analysis:')
    console.log('='.repeat(50))
    console.log(`✅ Currency Display: ${summary.successRate === '100.0%' ? 'FIXED' : 'NEEDS ATTENTION'}`)
    console.log(`✅ Timezone Display: ${summary.successRate === '100.0%' ? 'FIXED' : 'NEEDS ATTENTION'}`)
    console.log(`✅ Data Structure: ${summary.bookingDetails ? 'FIXED' : 'NEEDS ATTENTION'}`)
    console.log(`✅ Overall Success: ${summary.successfulSteps === summary.totalSteps ? 'PASS' : 'FAIL'}`)

    return {
      success: summary.successfulSteps === summary.totalSteps,
      summary,
      results,
      bookingDetails: summary.bookingDetails
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  } finally {
    await test.cleanup()
  }
}

// Execute the test
if (require.main === module) {
  runBookingSummaryTest()
    .then(({ success, summary, bookingDetails }) => {
      console.log(`\n🏁 Test ${success ? 'PASSED' : 'FAILED'}`)
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('Test execution failed:', error)
      process.exit(1)
    })
}

export default runBookingSummaryTest