import { expect, test } from '../../fixtures'

// Viewport sizes for visual regression testing
const DESKTOP_VIEWPORT = { width: 1440, height: 900 }
const TABLET_VIEWPORT = { width: 768, height: 1024 }
const MOBILE_VIEWPORT = { width: 375, height: 667 }

const UNCONNECTED_USER_PARAM = '?eagerlyConnect=false'

test.describe('Launchpad Create Page', () => {
  test.describe('Visual Regression - Desktop', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(DESKTOP_VIEWPORT)
    })

    test('should match baseline screenshot in light mode', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Light"')
      })

      await page.goto(`/launchpad/create${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('launchpad-create-desktop-light.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('should match baseline screenshot in dark mode', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Dark"')
      })

      await page.goto(`/launchpad/create${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('launchpad-create-desktop-dark.png', {
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

      await page.goto(`/launchpad/create${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('launchpad-create-tablet-light.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('should match baseline screenshot in dark mode - tablet', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Dark"')
      })

      await page.goto(`/launchpad/create${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('launchpad-create-tablet-dark.png', {
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

      await page.goto(`/launchpad/create${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('launchpad-create-mobile-light.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('should match baseline screenshot in dark mode - mobile', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Dark"')
      })

      await page.goto(`/launchpad/create${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('launchpad-create-mobile-dark.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })

  test.describe('Page Elements', () => {
    test('should display all form elements', async ({ page }) => {
      await page.goto(`/launchpad/create${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')

      // Header
      await expect(page.getByText('Create Token')).toBeVisible()
      await expect(page.getByText('Launch your token on the bonding curve')).toBeVisible()

      // Form fields
      await expect(page.getByText('Token Name')).toBeVisible()
      await expect(page.getByPlaceholder('My Awesome Token')).toBeVisible()
      await expect(page.getByText('Token Symbol')).toBeVisible()
      await expect(page.getByPlaceholder('TOKEN', { exact: true })).toBeVisible()
      await expect(page.getByText('Description').first()).toBeVisible()
      await expect(page.getByPlaceholder('Describe your token project...')).toBeVisible()
      await expect(page.getByText('Logo Image')).toBeVisible()
      await expect(page.getByText('Click to upload logo')).toBeVisible()

      // Optional fields
      await expect(page.getByText('Website').first()).toBeVisible()
      await expect(page.getByText('Twitter').first()).toBeVisible()
      await expect(page.getByText('Telegram').first()).toBeVisible()

      // Token Economics section
      await expect(page.getByText('Token Economics')).toBeVisible()
      await expect(page.getByText('Total Supply')).toBeVisible()
      await expect(page.getByText('1,000,000,000')).toBeVisible()

      // How it works section
      await expect(page.getByText('How it works')).toBeVisible()
    })

    test('should show Connect Wallet button when not connected', async ({ page }) => {
      await page.goto(`/launchpad/create${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')

      await expect(page.getByText('Connect Wallet')).toBeVisible()
    })

    test('should navigate back to launchpad on back button click', async ({ page }) => {
      await page.goto(`/launchpad/create${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')

      await page.getByText('Back to Launchpad').click()
      await expect(page).toHaveURL(/\/launchpad/)
    })
  })

  test.describe('Form Interaction', () => {
    test('should allow typing in form fields', async ({ page }) => {
      await page.goto(`/launchpad/create${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')

      // Fill in form fields
      await page.getByPlaceholder('My Awesome Token').fill('Test Token')
      await page.getByPlaceholder('TOKEN', { exact: true }).fill('test')
      await page.getByPlaceholder('Describe your token project...').fill('A test description')

      // Verify inputs
      await expect(page.getByPlaceholder('My Awesome Token')).toHaveValue('Test Token')
      await expect(page.getByPlaceholder('TOKEN', { exact: true })).toHaveValue('TEST') // Should be uppercase
      await expect(page.getByPlaceholder('Describe your token project...')).toHaveValue('A test description')
    })

    test('should show character count for name field', async ({ page }) => {
      await page.goto(`/launchpad/create${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')

      await page.getByPlaceholder('My Awesome Token').fill('Test')
      await expect(page.getByText('4/100 characters')).toBeVisible()
    })

    test('should show character count for description field', async ({ page }) => {
      await page.goto(`/launchpad/create${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')

      await page.getByPlaceholder('Describe your token project...').fill('Test description')
      await expect(page.getByText('16/500 characters')).toBeVisible()
    })

    test('should take screenshot with filled form', async ({ page }) => {
      await page.setViewportSize(DESKTOP_VIEWPORT)
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Dark"')
      })

      await page.goto(`/launchpad/create${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')

      // Fill in form fields
      await page.getByPlaceholder('My Awesome Token').fill('Moon Token')
      await page.getByPlaceholder('TOKEN', { exact: true }).fill('MOON')
      await page.getByPlaceholder('Describe your token project...').fill('A token that goes to the moon!')
      await page.getByPlaceholder('https://mytoken.com').fill('https://moontoken.xyz')
      await page.getByPlaceholder('@mytoken').first().fill('@moontoken')

      await page.waitForTimeout(300)

      await expect(page).toHaveScreenshot('launchpad-create-filled-form.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })
})
