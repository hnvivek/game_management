import { chromium, Browser, Page } from 'playwright'
import { mkdir } from 'fs/promises'
import { join } from 'path'

class MobileOptimizationVerification {
  private page: Page
  private browser: Browser
  private screenshotsDir: string

  constructor() {
    this.screenshotsDir = join(process.cwd(), 'mobile-optimization-screenshots')
  }

  async setup() {
    console.log('🔍 Setting up mobile optimization verification...')
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

  async verifyMobileOptimizations() {
    console.log('🚀 Verifying mobile UI optimizations...')

    // Test mobile viewport (iPhone 12)
    const mobileContext = await this.browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    })

    this.page = await mobileContext.newPage()

    try {
      console.log('\n📱 Testing Homepage Optimizations')

      // 1. Test homepage hero section compression
      console.log('  🎯 Testing hero section compression...')
      await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
      await this.page.waitForTimeout(2000)
      await this.captureScreenshot('mobile-optimized-hero', 'Mobile Hero Section - Compressed')

      // Check hero section height
      const heroHeight = await this.page.evaluate(() => {
        const hero = document.querySelector('section[class*="hero-mobile-compact"]')
        if (hero) {
          return hero.getBoundingClientRect().height
        }
        return 0
      })
      console.log(`  📏 Hero section height: ${Math.round(heroHeight)}px (should be < 400px for mobile)`)

      // 2. Test bottom navigation
      console.log('  🧭 Testing bottom navigation...')
      const bottomNavExists = await this.page.$('nav.fixed.bottom-0')
      const bottomNavHeight = await this.page.evaluate(() => {
        const nav = document.querySelector('nav.fixed.bottom-0')
        return nav ? nav.getBoundingClientRect().height : 0
      })

      console.log(`  ✅ Bottom navigation height: ${Math.round(bottomNavHeight)}px`)
      await this.captureScreenshot('mobile-bottom-nav', 'Mobile Bottom Navigation')

      // 3. Test stats section optimization
      console.log('  📊 Testing stats section...')
      const statsCards = await this.page.$$('.stats-mobile-compact .card-mobile-compact')
      console.log(`  ✅ Stats cards found: ${statsCards.length} (should be 4)`)

      // 4. Test search bar visibility
      console.log('  🔍 Testing search bar...')
      const searchBar = await this.page.$('input[placeholder*="Search"]')
      const searchVisible = await searchBar?.isVisible()
      console.log(`  ✅ Search bar visible: ${searchVisible}`)

      // 5. Test mobile CTA
      console.log('  🎯 Testing mobile CTA...')
      const ctaButton = await this.page.$('button:has-text("Book Now")')
      const ctaVisible = await ctaButton?.isVisible()
      console.log(`  ✅ Mobile CTA visible: ${ctaVisible}`)

      console.log('\n📱 Testing Navigation and Scrolling')

      // 6. Test scrolling behavior
      console.log('  📜 Testing scroll behavior...')
      const initialHeight = await this.page.evaluate(() => document.body.scrollHeight)
      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
      await this.page.waitForTimeout(1000)
      await this.captureScreenshot('mobile-mid-scroll', 'Mobile - Mid Scroll')

      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await this.page.waitForTimeout(1000)
      await this.captureScreenshot('mobile-bottom-scroll', 'Mobile - Bottom Scroll')

      // Check if bottom nav stays fixed
      const bottomNavFixed = await this.page.evaluate(() => {
        const nav = document.querySelector('nav.fixed.bottom-0')
        if (nav) {
          const rect = nav.getBoundingClientRect()
          return rect.bottom === window.innerHeight
        }
        return false
      })
      console.log(`  ✅ Bottom navigation stays fixed: ${bottomNavFixed}`)

      console.log('\n📱 Testing Page Transitions')

      // 7. Test navigation to other pages
      const testPages = ['/teams', '/matches', '/book-venue']

      for (const pageUrl of testPages) {
        console.log(`  📄 Testing ${pageUrl}...`)
        await this.page.goto(`http://localhost:3000${pageUrl}`, { waitUntil: 'networkidle' })
        await this.page.waitForTimeout(2000)

        // Check if bottom nav is still present
        const navStillPresent = await this.page.$('nav.fixed.bottom-0')
        const pageName = pageUrl.replace('/', '').toUpperCase() || 'HOME'

        await this.captureScreenshot(`mobile-${pageName.toLowerCase()}`, `Mobile ${pageName} Page`)
        console.log(`  ✅ ${pageName}: Bottom nav present: ${!!navStillPresent}`)
      }

      console.log('\n📏 Measuring Space Improvements')

      // 8. Calculate space savings
      console.log('  📐 Calculating space improvements...')
      await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
      await this.page.waitForTimeout(2000)

      const spaceAnalysis = await this.page.evaluate(() => {
        const viewportHeight = window.innerHeight
        const heroElement = document.querySelector('section[class*="hero-mobile-compact"]')
        const navElement = document.querySelector('nav.fixed.bottom-0')
        const statsElement = document.querySelector('.stats-mobile-compact')

        const heroHeight = heroElement ? heroElement.getBoundingClientRect().height : 0
        const navHeight = navElement ? navElement.getBoundingClientRect().height : 0
        const statsHeight = statsElement ? statsElement.getBoundingClientRect().height : 0

        return {
          viewportHeight,
          heroHeight,
          navHeight,
          statsHeight,
          availableContentHeight: viewportHeight - navHeight,
          heroPercentage: (heroHeight / viewportHeight) * 100,
          totalFixedElements: navHeight,
          contentUtilization: ((viewportHeight - navHeight - heroHeight) / viewportHeight) * 100
        }
      })

      console.log(`  📊 Space Analysis Results:`)
      console.log(`    • Viewport Height: ${Math.round(spaceAnalysis.viewportHeight)}px`)
      console.log(`    • Hero Section: ${Math.round(spaceAnalysis.heroHeight)}px (${Math.round(spaceAnalysis.heroPercentage)}% of viewport)`)
      console.log(`    • Bottom Navigation: ${Math.round(spaceAnalysis.navHeight)}px`)
      console.log(`    • Stats Section: ${Math.round(spaceAnalysis.statsHeight)}px`)
      console.log(`    • Available Content Area: ${Math.round(spaceAnalysis.availableContentHeight)}px`)
      console.log(`    • Content Utilization: ${Math.round(spaceAnalysis.contentUtilization)}%`)

      // Success criteria
      const optimizationsSuccessful = [
        spaceAnalysis.heroPercentage < 40, // Hero should be < 40% of viewport
        spaceAnalysis.navHeight > 0 && spaceAnalysis.navHeight < 80, // Nav should be 60-80px
        spaceAnalysis.contentUtilization > 50 // Content area should be > 50% utilized
      ]

      console.log(`\n✅ Optimization Results:`)
      console.log(`    • Hero section compressed: ${optimizationsSuccessful[0] ? '✅' : '❌'}`)
      console.log(`    • Bottom navigation implemented: ${optimizationsSuccessful[1] ? '✅' : '❌'}`)
      console.log(`    • Content area optimized: ${optimizationsSuccessful[2] ? '✅' : '❌'}`)

      const allOptimizationsSuccessful = optimizationsSuccessful.every(Boolean)
      console.log(`\n🎉 Overall optimization success: ${allOptimizationsSuccessful ? '✅ PASSED' : '❌ NEEDS IMPROVEMENT'}`)

      return allOptimizationsSuccessful

    } catch (error) {
      console.error('❌ Mobile optimization verification failed:', error)
      return false
    } finally {
      await mobileContext.close()
    }
  }
}

// Execute verification
async function runMobileOptimizationVerification() {
  const verification = new MobileOptimizationVerification()

  try {
    await verification.setup()
    const success = await verification.verifyMobileOptimizations()

    if (success) {
      console.log('\n🎉 All mobile optimizations verified successfully!')
    } else {
      console.log('\n⚠️  Some optimizations need improvement')
    }

  } catch (error) {
    console.error('❌ Verification failed:', error)
  } finally {
    await verification.cleanup()
  }
}

if (require.main === module) {
  runMobileOptimizationVerification()
}

export default runMobileOptimizationVerification