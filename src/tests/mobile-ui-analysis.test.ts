import { chromium, Browser, Page } from 'playwright'
import { mkdir } from 'fs/promises'
import { join } from 'path'

class MobileUIAnalysis {
  private page: Page
  private browser: Browser
  private screenshotsDir: string

  constructor() {
    this.screenshotsDir = join(process.cwd(), 'mobile-ui-analysis-screenshots')
  }

  async setup() {
    console.log('📱 Setting up mobile UI analysis...')
    await mkdir(this.screenshotsDir, { recursive: true })

    this.browser = await chromium.launch({
      headless: false,
      slowMo: 500,
      args: ['--start-maximized', '--disable-web-security']
    })
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  private async captureScreenshot(name: string, description?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${name}-${timestamp}.png`
    const screenshotPath = join(this.screenshotsDir, filename)

    await this.page.screenshot({
      path: screenshotPath,
      fullPage: true
    })

    console.log(`📸 Captured: ${name}${description ? ` - ${description}` : ''}`)
    return screenshotPath
  }

  async captureMobileUIAnalysis() {
    console.log('📱 Starting comprehensive mobile UI analysis...')

    // Test with various mobile viewports
    const mobileViewports = [
      { name: 'mobile-small', width: 375, height: 667, description: 'iPhone SE' },
      { name: 'mobile-standard', width: 390, height: 844, description: 'iPhone 12' },
      { name: 'mobile-large', width: 430, height: 932, description: 'iPhone 14 Pro Max' },
      { name: 'tablet-small', width: 768, height: 1024, description: 'iPad Mini' },
      { name: 'tablet-standard', width: 820, height: 1180, description: 'iPad Air' }
    ]

    for (const viewport of mobileViewports) {
      console.log(`\n📱 Analyzing ${viewport.description} (${viewport.width}x${viewport.height})`)

      const context = await this.browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        isMobile: viewport.width < 768,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      })

      this.page = await context.newPage()

      try {
        // 1. Homepage Analysis
        console.log(`  🏠 Analyzing homepage layout...`)
        await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
        await this.page.waitForTimeout(2000)
        await this.captureScreenshot(`${viewport.name}-homepage`, `${viewport.description} - Homepage`)

        // 2. Navigation Analysis (closed state)
        console.log(`  🧭 Analyzing navigation (closed)...`)
        await this.captureScreenshot(`${viewport.name}-nav-closed`, `${viewport.description} - Navigation Closed`)

        // 3. Navigation Analysis (open state)
        console.log(`  🧭 Analyzing navigation (open)...`)
        const menuButton = await this.page.$('button[aria-label="Toggle menu"]')
        if (menuButton) {
          await menuButton.click()
          await this.page.waitForTimeout(1000)
          await this.captureScreenshot(`${viewport.name}-nav-open`, `${viewport.description} - Navigation Open`)
        }

        // 4. Book Venue Page
        console.log(`  📅 Analyzing booking page...`)
        await this.page.goto('http://localhost:3000/book-venue', { waitUntil: 'networkidle' })
        await this.page.waitForTimeout(2000)
        await this.captureScreenshot(`${viewport.name}-booking-page`, `${viewport.description} - Booking Page`)

        // 5. Booking Form Analysis
        console.log(`  📝 Analyzing booking form...`)
        await this.page.waitForTimeout(1000)
        await this.captureScreenshot(`${viewport.name}-booking-form`, `${viewport.description} - Booking Form`)

        // 6. Teams Page
        console.log(`  👥 Analyzing teams page...`)
        await this.page.goto('http://localhost:3000/teams', { waitUntil: 'networkidle' })
        await this.page.waitForTimeout(2000)
        await this.captureScreenshot(`${viewport.name}-teams-page`, `${viewport.description} - Teams Page`)

        // 7. Matches Page
        console.log(`  ⚽ Analyzing matches page...`)
        await this.page.goto('http://localhost:3000/matches', { waitUntil: 'networkidle' })
        await this.page.waitForTimeout(2000)
        await this.captureScreenshot(`${viewport.name}-matches-page`, `${viewport.description} - Matches Page`)

        // 8. Leaderboard Page
        console.log(`  🏆 Analyzing leaderboard page...`)
        await this.page.goto('http://localhost:3000/leaderboard', { waitUntil: 'networkidle' })
        await this.page.waitForTimeout(2000)
        await this.captureScreenshot(`${viewport.name}-leaderboard-page`, `${viewport.description} - Leaderboard Page`)

        // 9. AI Suggestions Page (if available)
        console.log(`  🤖 Analyzing AI suggestions page...`)
        await this.page.goto('http://localhost:3000/ai-suggestions', { waitUntil: 'networkidle' })
        await this.page.waitForTimeout(2000)
        await this.captureScreenshot(`${viewport.name}-ai-suggestions`, `${viewport.description} - AI Suggestions`)

        console.log(`  ✅ Completed analysis for ${viewport.description}`)

      } catch (error) {
        console.error(`  ❌ Error analyzing ${viewport.description}:`, error)
      } finally {
        await context.close()
      }
    }

    // Additional analysis for space utilization
    console.log('\n🔍 Analyzing space utilization details...')

    // Test specific pages for detailed space analysis
    const mobileContext = await this.browser.newContext({
      viewport: { width: 390, height: 844 }, // Standard iPhone
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true
    })

    this.page = await mobileContext.newPage()

    try {
      // Detailed booking flow analysis
      console.log('  📋 Detailed booking flow analysis...')
      await this.page.goto('http://localhost:3000/book-venue', { waitUntil: 'networkidle' })

      // Scroll through the entire page to see full layout
      await this.page.waitForTimeout(2000)

      // Capture viewport at different scroll positions
      await this.captureScreenshot('mobile-booking-top', 'Mobile Booking - Top of Page')

      // Scroll to middle
      await this.page.evaluate(() => window.scrollTo(0, window.innerHeight / 2))
      await this.page.waitForTimeout(1000)
      await this.captureScreenshot('mobile-booking-middle', 'Mobile Booking - Middle of Page')

      // Scroll to bottom
      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await this.page.waitForTimeout(1000)
      await this.captureScreenshot('mobile-booking-bottom', 'Mobile Booking - Bottom of Page')

      // Analyze element spacing
      const spacingInfo = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('body > *');
        const spacingData = [];

        for (let i = 0; i < Math.min(elements.length, 10); i++) {
          const el = elements[i] as HTMLElement;
          const rect = el.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(el);

          spacingData.push({
            tag: el.tagName,
            class: el.className,
            height: rect.height,
            marginTop: computedStyle.marginTop,
            marginBottom: computedStyle.marginBottom,
            paddingTop: computedStyle.paddingTop,
            paddingBottom: computedStyle.paddingBottom,
            visible: rect.height > 0
          });
        }

        return spacingData;
      });

      console.log('  📏 Element spacing analysis:')
      spacingInfo.forEach((info, index) => {
        if (info.visible && info.height > 50) { // Only show significant elements
          console.log(`    ${index + 1}. ${info.tag} - Height: ${Math.round(info.height)}px, Margins: ${info.marginTop}/${info.marginBottom}`)
        }
      });

    } catch (error) {
      console.error('  ❌ Error in detailed analysis:', error)
    } finally {
      await mobileContext.close()
    }

    console.log('\n✅ Mobile UI analysis completed!')
    console.log(`📸 Screenshots saved to: ${this.screenshotsDir}`)
    console.log('\n📋 Analysis Summary:')
    console.log('- Captured multiple viewport sizes (mobile small/standard/large, tablet small/standard)')
    console.log('- Analyzed key pages: Homepage, Booking, Teams, Matches, Leaderboard, AI Suggestions')
    console.log('- Documented navigation states (open/closed)')
    console.log('- Captured scroll behavior on booking page')
    console.log('- Measured element spacing and heights')
  }
}

// Execute the analysis
async function runMobileUIAnalysis() {
  const analysis = new MobileUIAnalysis()

  try {
    await analysis.setup()
    await analysis.captureMobileUIAnalysis()
  } catch (error) {
    console.error('❌ Mobile UI analysis failed:', error)
  } finally {
    await analysis.cleanup()
  }
}

if (require.main === module) {
  runMobileUIAnalysis()
}

export default runMobileUIAnalysis