import { chromium, Browser, Page } from 'playwright'
import { mkdir } from 'fs/promises'
import { join } from 'path'

class QuickResponsiveTest {
  private page: Page
  private browser: Browser
  private screenshotsDir: string

  constructor() {
    this.screenshotsDir = join(process.cwd(), 'test-screenshots-quick-responsive')
  }

  async setup() {
    console.log('🌐 Quick responsive test setup...')
    await mkdir(this.screenshotsDir, { recursive: true })

    this.browser = await chromium.launch({
      headless: false,
      slowMo: 300,
      args: ['--start-maximized', '--disable-web-security']
    })
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  private async captureScreenshot(name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${name}-${timestamp}.png`
    const screenshotPath = join(this.screenshotsDir, filename)

    await this.page.screenshot({
      path: screenshotPath,
      fullPage: true
    })

    return screenshotPath
  }

  async runQuickTest() {
    console.log('🚀 Running quick responsive test...')

    // Test with mobile viewport
    const mobileContext = await this.browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true
    })

    this.page = await mobileContext.newPage()

    // Test homepage
    console.log('📱 Testing mobile homepage...')
    await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    await this.page.waitForTimeout(2000)
    await this.captureScreenshot('mobile-homepage')

    // Test navigation menu
    console.log('📱 Testing mobile navigation...')
    const menuButton = await this.page.$('button[aria-label="Toggle menu"]')
    if (menuButton) {
      await menuButton.click()
      await this.page.waitForTimeout(1000)
      await this.captureScreenshot('mobile-menu-open')
    }

    // Test booking page
    console.log('📱 Testing mobile booking page...')
    await this.page.goto('http://localhost:3000/book-venue', { waitUntil: 'networkidle' })
    await this.page.waitForTimeout(2000)
    await this.captureScreenshot('mobile-booking-page')

    await mobileContext.close()

    // Test with tablet viewport
    const tabletContext = await this.browser.newContext({
      viewport: { width: 768, height: 1024 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: true
    })

    this.page = await tabletContext.newPage()

    console.log('📱 Testing tablet booking page...')
    await this.page.goto('http://localhost:3000/book-venue', { waitUntil: 'networkidle' })
    await this.page.waitForTimeout(2000)
    await this.captureScreenshot('tablet-booking-page')

    await tabletContext.close()

    // Test with desktop viewport
    const desktopContext = await this.browser.newContext({
      viewport: { width: 1366, height: 768 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false
    })

    this.page = await desktopContext.newPage()

    console.log('📱 Testing desktop booking page...')
    await this.page.goto('http://localhost:3000/book-venue', { waitUntil: 'networkidle' })
    await this.page.waitForTimeout(2000)
    await this.captureScreenshot('desktop-booking-page')

    await desktopContext.close()

    console.log('✅ Quick responsive test completed!')
    console.log(`📸 Screenshots saved to: ${this.screenshotsDir}`)
    console.log('Review screenshots to verify responsive fixes:')
    console.log('- No horizontal scrolling on mobile')
    console.log('- Navigation menu works on mobile')
    console.log('- Booking page layout adapts to screen size')
    console.log('- Elements fit within viewport')
  }
}

// Execute the test
async function runQuickResponsiveTest() {
  const test = new QuickResponsiveTest()

  try {
    await test.setup()
    await test.runQuickTest()
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await test.cleanup()
  }
}

if (require.main === module) {
  runQuickResponsiveTest()
}

export default runQuickResponsiveTest