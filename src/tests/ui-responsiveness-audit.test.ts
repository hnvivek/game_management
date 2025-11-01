import { chromium, Browser, Page, devices } from 'playwright'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface ResponsivenessTestStep {
  name: string
  description: string
  device?: any
  viewport: { width: number; height: number }
  action: (page: Page) => Promise<void>
  validate?: (page: Page) => Promise<boolean>
}

interface ResponsivenessTestResult {
  device: string
  viewport: string
  step: string
  success: boolean
  error?: string
  screenshotPath: string
  duration: number
  issues?: string[]
}

class UIResponsivenessAudit {
  private page: Page
  private browser: Browser
  private screenshotsDir: string

  constructor() {
    this.screenshotsDir = join(process.cwd(), 'test-screenshots-responsiveness')
  }

  async setup() {
    console.log('🌐 Setting up browser for UI responsiveness audit...')

    await mkdir(this.screenshotsDir, { recursive: true })

    this.browser = await chromium.launch({
      headless: false,
      slowMo: 400,
      args: [
        '--start-maximized',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    })
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  private async captureScreenshot(deviceName: string, stepName: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${deviceName}-${stepName}-${timestamp}.png`
    const screenshotPath = join(this.screenshotsDir, filename)

    await this.page.screenshot({
      path: screenshotPath,
      fullPage: true
    })

    return screenshotPath
  }

  private async checkLayoutIssues(page: Page): Promise<string[]> {
    const issues: string[] = []

    try {
      // Check for horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > document.body.clientWidth
      })
      if (hasHorizontalScroll) {
        issues.push('Horizontal scroll detected')
      }

      // Check for overlapping elements
      const overlappingElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'))
        const overlaps = []

        for (let i = 0; i < elements.length; i++) {
          const rect1 = elements[i].getBoundingClientRect()
          if (rect1.width === 0 || rect1.height === 0) continue

          for (let j = i + 1; j < elements.length; j++) {
            const rect2 = elements[j].getBoundingClientRect()
            if (rect2.width === 0 || rect2.height === 0) continue

            if (!(rect1.right < rect2.left ||
                  rect1.left > rect2.right ||
                  rect1.bottom < rect2.top ||
                  rect1.top > rect2.bottom)) {
              overlaps.push(`${elements[i].tagName} overlaps ${elements[j].tagName}`)
            }
          }
        }
        return overlaps.slice(0, 5) // Limit to first 5 overlaps
      })

      issues.push(...overlappingElements)

      // Check for elements outside viewport
      const elementsOutsideViewport = await page.evaluate(() => {
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight
        }
        const elements = Array.from(document.querySelectorAll('*'))
        const outside = []

        elements.forEach(el => {
          const rect = el.getBoundingClientRect()
          if (rect.right > viewport.width || rect.bottom > viewport.height) {
            if (rect.width > 50 && rect.height > 20) { // Only significant elements
              outside.push(el.tagName)
            }
          }
        })
        return [...new Set(outside)].slice(0, 3)
      })

      issues.push(...elementsOutsideViewport.map(tag => `${tag} outside viewport`))

    } catch (error) {
      issues.push('Error checking layout issues')
    }

    return issues
  }

  async runResponsivenessAudit(): Promise<{ results: ResponsivenessTestResult[], summary: any }> {
    console.log('🚀 Starting Comprehensive UI Responsiveness Audit...')
    console.log('📱 Testing across multiple device sizes and breakpoints')
    console.log('')

    const results: ResponsivenessTestResult[] = []

    // Define viewports to test
    const viewports = [
      {
        name: 'Mobile Small',
        device: devices['iPhone SE'],
        viewport: { width: 375, height: 667 }
      },
      {
        name: 'Mobile Large',
        device: devices['iPhone 14 Pro Max'],
        viewport: { width: 430, height: 932 }
      },
      {
        name: 'Tablet',
        device: devices['iPad'],
        viewport: { width: 768, height: 1024 }
      },
      {
        name: 'Laptop',
        device: null,
        viewport: { width: 1366, height: 768 }
      },
      {
        name: 'Desktop Large',
        device: null,
        viewport: { width: 1920, height: 1080 }
      }
    ]

    // Test steps for each viewport
    const testSteps: ResponsivenessTestStep[] = [
      {
        name: 'Load Homepage',
        description: 'Test homepage layout',
        action: async (page) => {
          await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
          await page.waitForTimeout(2000)
        }
      },
      {
        name: 'Load Booking Page',
        description: 'Test booking page layout',
        action: async (page) => {
          await page.goto('http://localhost:3000/book-venue', { waitUntil: 'networkidle' })
          await page.waitForTimeout(2000)
        }
      },
      {
        name: 'Test Navigation',
        description: 'Test navigation menu responsiveness',
        action: async (page) => {
          const navButton = await page.$('button[aria-label="Toggle menu"], button:has-text("Menu")')
          if (navButton) {
            await navButton.click()
            await page.waitForTimeout(1000)
            await navButton.click() // Close menu
          }
          await page.waitForTimeout(1000)
        }
      },
      {
        name: 'Test Booking Form',
        description: 'Test booking form layout',
        action: async (page) => {
          // Try to interact with form elements
          const selectButton = await page.$('button[role="combobox"]')
          if (selectButton) {
            await selectButton.click()
            await page.waitForTimeout(500)
            await page.keyboard.press('Escape') // Close dropdown
          }
          await page.waitForTimeout(1000)
        }
      },
      {
        name: 'Test Footer',
        description: 'Test footer layout',
        action: async (page) => {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
          await page.waitForTimeout(1000)
        }
      }
    ]

    // Run tests for each viewport
    for (const viewportInfo of viewports) {
      console.log(`\n📱 Testing on ${viewportInfo.name} (${viewportInfo.viewport.width}x${viewportInfo.viewport.height})`)

      // Create new context for this viewport
      const context = await this.browser.newContext({
        ...viewportInfo.device,
        viewport: viewportInfo.viewport,
        deviceScaleFactor: 1,
        isMobile: viewportInfo.viewport.width < 768,
        hasTouch: viewportInfo.viewport.width < 768
      })

      this.page = await context.newPage()

      // Add responsive debugging styles
      await this.page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-delay: 0.01ms !important;
            transition-duration: 0.01ms !important;
            transition-delay: 0.01ms !important;
          }

          /* Debug outlines */
          * {
            outline: 1px solid rgba(255, 0, 0, 0.1) !important;
          }

          /* Highlight overflow */
          body {
            overflow-x: auto !important;
            background: linear-gradient(90deg,
              transparent 0%,
              rgba(255,0,0,0.05) 50%,
              transparent 100%);
          }
        `
      })

      for (let i = 0; i < testSteps.length; i++) {
        const step = testSteps[i]
        const startTime = Date.now()
        let success = false
        let error = ''
        let issues: string[] = []

        try {
          console.log(`  📸 ${step.description}`)

          await step.action(this.page)

          // Check for layout issues
          issues = await this.checkLayoutIssues(this.page)

          success = true
          console.log(`    ✅ ${step.name} - ${Date.now() - startTime}ms`)

          if (issues.length > 0) {
            console.log(`    ⚠️  Issues found: ${issues.join(', ')}`)
          }

        } catch (err) {
          error = err instanceof Error ? err.message : 'Unknown error'
          console.log(`    ❌ ${step.name} - ${Date.now() - startTime}ms - Error: ${error}`)
        }

        // Capture screenshot
        const screenshotPath = await this.captureScreenshot(
          viewportInfo.name.toLowerCase().replace(/\s+/g, '-'),
          step.name.toLowerCase().replace(/\s+/g, '-')
        )

        results.push({
          device: viewportInfo.name,
          viewport: `${viewportInfo.viewport.width}x${viewportInfo.viewport.height}`,
          step: step.name,
          success,
          error,
          screenshotPath,
          duration: Date.now() - startTime,
          issues: issues.length > 0 ? issues : undefined
        })
      }

      await context.close()
    }

    // Generate summary
    const totalTests = results.length
    const successfulTests = results.filter(r => r.success).length
    const testsWithIssues = results.filter(r => r.issues && r.issues.length > 0).length
    const successRate = ((successfulTests / totalTests) * 100).toFixed(1)

    // Group results by device
    const resultsByDevice = results.reduce((acc, result) => {
      if (!acc[result.device]) {
        acc[result.device] = []
      }
      acc[result.device].push(result)
      return acc
    }, {} as Record<string, ResponsivenessTestResult[]>)

    // Find common issues
    const allIssues = results.flatMap(r => r.issues || [])
    const commonIssues = allIssues.reduce((acc, issue) => {
      acc[issue] = (acc[issue] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const summary = {
      totalTests,
      successfulTests,
      failedTests: totalTests - successfulTests,
      testsWithIssues,
      successRate: `${successRate}%`,
      devices: Object.keys(resultsByDevice),
      commonIssues: Object.entries(commonIssues)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([issue, count]) => ({ issue, count })),
      timestamp: new Date().toISOString()
    }

    return { results, summary }
  }
}

// Main execution function
async function runUIResponsivenessAudit() {
  const audit = new UIResponsivenessAudit()

  try {
    await audit.setup()
    const { results, summary } = await audit.runResponsivenessAudit()

    // Display results
    console.log('\n📊 UI Responsiveness Audit Results:')
    console.log('='.repeat(70))

    console.log(`\n🧪 Total Tests: ${summary.totalTests}`)
    console.log(`✅ Successful: ${summary.successfulTests}`)
    console.log(`❌ Failed: ${summary.failedTests}`)
    console.log(`⚠️  With Issues: ${summary.testsWithIssues}`)
    console.log(`📈 Success Rate: ${summary.successRate}`)
    console.log(`🕐 Completed: ${summary.timestamp}`)

    console.log('\n📱 Results by Device:')
    console.log('-'.repeat(50))
    Object.entries(results.reduce((acc, result) => {
      if (!acc[result.device]) {
        acc[result.device] = { total: 0, successful: 0, issues: 0 }
      }
      acc[result.device].total++
      if (result.success) acc[result.device].successful++
      if (result.issues && result.issues.length > 0) acc[result.device].issues++
      return acc
    }, {} as Record<string, { total: number; successful: number; issues: number }>)).forEach(([device, stats]) => {
      const rate = ((stats.successful / stats.total) * 100).toFixed(1)
      console.log(`${device}: ${stats.successful}/${stats.total} (${rate}%) - ${stats.issues} with issues`)
    })

    if (summary.commonIssues.length > 0) {
      console.log('\n⚠️  Most Common Issues:')
      console.log('-'.repeat(50))
      summary.commonIssues.forEach(({ issue, count }) => {
        console.log(`${issue}: ${count} occurrences`)
      })
    }

    console.log('\n📸 Screenshots saved to: test-screenshots-responsiveness/')
    console.log('Review screenshots for visual issues and layout problems')

    // Recommendations
    console.log('\n🎯 Recommendations:')
    console.log('-'.repeat(30))

    if (summary.commonIssues.some(issue => issue.issue.includes('Horizontal scroll'))) {
      console.log('• Fix horizontal scrolling by adjusting layout widths')
    }
    if (summary.commonIssues.some(issue => issue.issue.includes('overlaps'))) {
      console.log('• Fix element overlaps with better spacing and positioning')
    }
    if (summary.commonIssues.some(issue => issue.issue.includes('outside viewport'))) {
      console.log('• Ensure all content fits within viewport boundaries')
    }

    const mobileResults = results.filter(r => r.device.includes('Mobile'))
    const mobileSuccessRate = mobileResults.length > 0
      ? (mobileResults.filter(r => r.success).length / mobileResults.length * 100).toFixed(1)
      : '0'

    if (parseFloat(mobileSuccessRate) < 80) {
      console.log('• Improve mobile responsiveness - current success rate: ' + mobileSuccessRate + '%')
    }

    return {
      success: parseFloat(summary.successRate) >= 80,
      summary,
      results,
      mobileSuccessRate: parseFloat(mobileSuccessRate)
    }

  } catch (error) {
    console.error('❌ Audit execution failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  } finally {
    await audit.cleanup()
  }
}

// Execute the audit
if (require.main === module) {
  runUIResponsivenessAudit()
    .then(({ success, mobileSuccessRate }) => {
      console.log(`\n🏁 Responsiveness Audit ${success ? 'PASSED' : 'FAILED'}`)
      console.log(`📱 Mobile Success Rate: ${mobileSuccessRate}%`)
      process.exit(success && mobileSuccessRate >= 70 ? 0 : 1)
    })
    .catch((error) => {
      console.error('Audit execution failed:', error)
      process.exit(1)
    })
}

export default runUIResponsivenessAudit