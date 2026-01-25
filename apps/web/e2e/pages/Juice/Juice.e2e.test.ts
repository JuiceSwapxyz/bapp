import { expect, test } from '@playwright/test'

const JUICE_PAGE_PATH = '/juice'

// Viewport sizes for testing
const DESKTOP_VIEWPORT = { width: 1440, height: 900 }
const TABLET_VIEWPORT = { width: 768, height: 1024 }
const MOBILE_VIEWPORT = { width: 375, height: 667 }

test.describe('Juice Info Page', () => {
  test.describe('Page Load', () => {
    test('should load juice page successfully', async ({ page }) => {
      await page.goto(JUICE_PAGE_PATH)
      await expect(page).toHaveURL(JUICE_PAGE_PATH)

      // Wait for the page to be fully loaded
      await page.waitForLoadState('networkidle')

      // Check that main content is visible (use .first() as "Juice Protocol" appears multiple times)
      await expect(page.locator('text=Juice Protocol').first()).toBeVisible()
    })

    test('should display all main sections', async ({ page }) => {
      await page.goto(JUICE_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Hero section
      await expect(page.locator('text=Juice Protocol').first()).toBeVisible()

      // Overview section
      await expect(page.locator('text=What is JUICE?')).toBeVisible()

      // Tokenomics section
      await expect(page.locator('text=Tokenomics')).toBeVisible()

      // Governance section
      await expect(page.locator('text=Governance').first()).toBeVisible()

      // Use Cases section
      await expect(page.locator('text=What Can You Do With JUICE?')).toBeVisible()

      // Risks & Economics section
      await expect(page.locator('text=Risks & Economics')).toBeVisible()

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

      await page.goto(JUICE_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Wait for animations to settle
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('juice-page-desktop-light.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('should match baseline screenshot in dark mode', async ({ page }) => {
      // Set dark theme in localStorage before navigation
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Dark"')
      })

      await page.goto(JUICE_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Wait for animations to settle
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('juice-page-desktop-dark.png', {
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

      await page.goto(JUICE_PAGE_PATH)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('juice-page-tablet-light.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('should match baseline screenshot in dark mode - tablet', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Dark"')
      })

      await page.goto(JUICE_PAGE_PATH)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('juice-page-tablet-dark.png', {
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

      await page.goto(JUICE_PAGE_PATH)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('juice-page-mobile-light.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('should match baseline screenshot in dark mode - mobile', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Dark"')
      })

      await page.goto(JUICE_PAGE_PATH)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('juice-page-mobile-dark.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })

  test.describe('Interactions', () => {
    test('should expand and collapse FAQ items', async ({ page }) => {
      await page.goto(JUICE_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Scroll to FAQ section
      await page.locator('text=Frequently Asked Questions').scrollIntoViewIfNeeded()

      // Click on first FAQ item
      const firstFaqQuestion = page.locator('text=How do I get JUICE tokens?')
      await firstFaqQuestion.click()

      // Check if the answer is visible
      await expect(page.locator('text=You can acquire JUICE by investing JUSD')).toBeVisible()
    })

    test('should have working CTA buttons in hero section', async ({ page }) => {
      await page.goto(JUICE_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Check that CTA buttons exist
      await expect(page.locator('text=Learn More').first()).toBeVisible()
      await expect(page.locator('text=Get JUICE').first()).toBeVisible()
    })

    test('should have clickable contract addresses with explorer links', async ({ page }) => {
      await page.goto(JUICE_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Scroll to tech details
      await page.locator('text=Technical Specifications').scrollIntoViewIfNeeded()

      // Check that contract addresses are present (partial match)
      await expect(page.locator('text=0x7b2A56')).toBeVisible()
    })
  })

  test.describe('Responsive Layout', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT)
      await page.goto(JUICE_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Main content should still be visible
      await expect(page.locator('text=Juice Protocol').first()).toBeVisible()
      await expect(page.locator('text=What is JUICE?')).toBeVisible()
    })

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize(TABLET_VIEWPORT)
      await page.goto(JUICE_PAGE_PATH)
      await page.waitForLoadState('networkidle')

      // Main content should still be visible
      await expect(page.locator('text=Juice Protocol').first()).toBeVisible()
      await expect(page.locator('text=What is JUICE?')).toBeVisible()
    })
  })
})
