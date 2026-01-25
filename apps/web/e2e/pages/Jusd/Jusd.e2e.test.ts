import { expect, test } from '@playwright/test'

const JUSD_PAGE_PATH = '/jusd'

// Viewport sizes for testing
const DESKTOP_VIEWPORT = { width: 1440, height: 900 }
const TABLET_VIEWPORT = { width: 768, height: 1024 }
const MOBILE_VIEWPORT = { width: 375, height: 667 }

test.describe('JUSD Stablecoin Info Page', () => {
  test.describe('Page Load', () => {
    test('should load jusd page successfully', async ({ page }) => {
      await page.goto(JUSD_PAGE_PATH)
      await expect(page).toHaveURL(JUSD_PAGE_PATH)

      // Wait for the page to be fully loaded
      await page.waitForLoadState('networkidle')

      // Check that main content is visible
      await expect(page.locator('text=The Decentralized Dollar on Bitcoin').first()).toBeVisible()
    })

    test('should display all main sections', async ({ page }) => {
      await page.goto(JUSD_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Hero section
      await expect(page.locator('text=The Decentralized Dollar on Bitcoin').first()).toBeVisible()

      // Overview section
      await expect(page.locator('text=What is JUSD?')).toBeVisible()

      // How It Works section
      await expect(page.locator('text=How JUSD Works')).toBeVisible()

      // Use Cases section
      await expect(page.locator('text=What Can You Do With JUSD?')).toBeVisible()

      // Savings section
      await expect(page.locator('text=Savings & Interest')).toBeVisible()

      // Tech Details section
      await expect(page.locator('text=Technical Specifications')).toBeVisible()

      // FAQ section
      await expect(page.locator('text=Frequently Asked Questions')).toBeVisible()
    })
  })

  test.describe('Visual Regression - Desktop', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(DESKTOP_VIEWPORT)
    })

    test('should match baseline screenshot in light mode', async ({ page }) => {
      // Set light theme in localStorage before navigation
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Light"')
      })

      await page.goto(JUSD_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Wait for animations to settle
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('jusd-page-desktop-light.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('should match baseline screenshot in dark mode', async ({ page }) => {
      // Set dark theme in localStorage before navigation
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Dark"')
      })

      await page.goto(JUSD_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Wait for animations to settle
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('jusd-page-desktop-dark.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })

  test.describe('Visual Regression - Tablet', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(TABLET_VIEWPORT)
    })

    test('should match baseline screenshot in light mode - tablet', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Light"')
      })

      await page.goto(JUSD_PAGE_PATH)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('jusd-page-tablet-light.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('should match baseline screenshot in dark mode - tablet', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Dark"')
      })

      await page.goto(JUSD_PAGE_PATH)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('jusd-page-tablet-dark.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })

  test.describe('Visual Regression - Mobile', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT)
    })

    test('should match baseline screenshot in light mode - mobile', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Light"')
      })

      await page.goto(JUSD_PAGE_PATH)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('jusd-page-mobile-light.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('should match baseline screenshot in dark mode - mobile', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Dark"')
      })

      await page.goto(JUSD_PAGE_PATH)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('jusd-page-mobile-dark.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })

  test.describe('Interactions', () => {
    test('should expand and collapse FAQ items', async ({ page }) => {
      await page.goto(JUSD_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Scroll to FAQ section
      await page.locator('text=Frequently Asked Questions').scrollIntoViewIfNeeded()

      // Click on first FAQ item
      const firstFaqQuestion = page.locator('text=What is JUSD?').last()
      await firstFaqQuestion.click()

      // Check if the answer is visible
      await expect(page.locator('text=decentralized stablecoin that tracks the US Dollar').first()).toBeVisible()
    })

    test('should have working CTA buttons in hero section', async ({ page }) => {
      await page.goto(JUSD_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Check that CTA buttons exist
      await expect(page.locator('text=Learn More').first()).toBeVisible()
      await expect(page.locator('text=Get JUSD').first()).toBeVisible()
    })

    test('should have clickable contract addresses with explorer links', async ({ page }) => {
      await page.goto(JUSD_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Scroll to tech details
      await page.locator('text=Technical Specifications').scrollIntoViewIfNeeded()

      // Check that contract addresses are present (partial match for JUSD token)
      await expect(page.locator('text=0xFdB0a8')).toBeVisible()
    })

    test('should navigate to swap page when Get JUSD is clicked', async ({ page }) => {
      await page.goto(JUSD_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Click Get JUSD button
      await page.locator('text=Get JUSD').first().click()

      // Should navigate to swap page with JUSD as output
      await expect(page).toHaveURL(/\/swap\?.*outputCurrency=JUSD/)
    })
  })

  test.describe('Responsive Layout', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT)
      await page.goto(JUSD_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Main content should still be visible
      await expect(page.locator('text=The Decentralized Dollar on Bitcoin').first()).toBeVisible()
      await expect(page.locator('text=What is JUSD?')).toBeVisible()
    })

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize(TABLET_VIEWPORT)
      await page.goto(JUSD_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Main content should still be visible
      await expect(page.locator('text=The Decentralized Dollar on Bitcoin').first()).toBeVisible()
      await expect(page.locator('text=What is JUSD?')).toBeVisible()
    })
  })

  test.describe('Content Verification', () => {
    test('should display key JUSD information', async ({ page }) => {
      await page.goto(JUSD_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Check for key JUSD-specific content
      await expect(page.locator('text=Oracle-Free')).toBeVisible()
      await expect(page.locator('text=Overcollateralized').first()).toBeVisible()
      await expect(page.locator('text=Cypherpunk')).toBeVisible()
    })

    test('should display savings module information', async ({ page }) => {
      await page.goto(JUSD_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Scroll to savings section
      await page.locator('text=Savings & Interest').scrollIntoViewIfNeeded()

      // Check for savings-related content
      await expect(page.locator('text=Leadrate')).toBeVisible()
      await expect(page.locator('text=svJUSD')).toBeVisible()
    })

    test('should display stablecoin bridge information', async ({ page }) => {
      await page.goto(JUSD_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Scroll to How It Works section
      await page.locator('text=How JUSD Works').scrollIntoViewIfNeeded()

      // Check for bridge-related content
      await expect(page.locator('text=Stablecoin Bridges')).toBeVisible()
    })
  })
})
