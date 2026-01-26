import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, test } from '../../fixtures'

// Viewport sizes for visual regression testing
const DESKTOP_VIEWPORT = { width: 1440, height: 900 }
const TABLET_VIEWPORT = { width: 768, height: 1024 }
const MOBILE_VIEWPORT = { width: 375, height: 667 }

const UNCONNECTED_USER_PARAM = '?eagerlyConnect=false' // Query param to prevent automatic wallet connection
const FORCE_INTRO_PARAM = '?intro=true' // Query param to force the intro screen to be displayed

test.describe('Landing Page', () => {
  test('shows landing page when no user state exists', async ({ page }) => {
    await page.goto(`/${UNCONNECTED_USER_PARAM}`)
    await expect(page.getByTestId(TestID.LandingPage)).toBeVisible()
  })

  test('shows landing page when intro is forced', async ({ page }) => {
    await page.goto(`/${FORCE_INTRO_PARAM}`)
    await expect(page.getByTestId(TestID.LandingPage)).toBeVisible()
  })

  test('allows navigation to pool', async ({ page }) => {
    await page.goto(`/swap${UNCONNECTED_USER_PARAM}`)
    await page.getByRole('link', { name: 'Pool' }).click()
    await expect(page).toHaveURL('/positions')
  })

  test('allows navigation to pool on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT)
    await page.goto(`/swap${UNCONNECTED_USER_PARAM}`)
    await page.getByTestId(TestID.NavCompanyMenu).click()
    await expect(page.getByTestId(TestID.CompanyMenuMobileDrawer)).toBeVisible()
    await page.getByRole('link', { name: 'Pool' }).click()
    await expect(page).toHaveURL('/positions')
  })

  test('does not render landing page when / path is blocked', async ({ page }) => {
    await page.route('/', async (route) => {
      const response = await route.fetch()
      const body = (await response.text()).replace(
        '</head>',
        `<meta property="x:blocked-paths" content="/,/buy"></head>`,
      )
      await route.fulfill({ status: response.status(), headers: response.headers(), body })
    })

    await page.goto('/')
    await expect(page.getByTestId(TestID.LandingPage)).not.toBeVisible()
    await expect(page.getByTestId(TestID.BuyFiatButton)).not.toBeVisible()
    await expect(page).toHaveURL('/swap')
  })

  test.describe('UK compliance banner', () => {
    test.afterEach(async ({ page }) => {
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    })
    test('renders UK compliance banner in UK', async ({ page }) => {
      await page.route(/(?:interface|beta).gateway.uniswap.org\/v1\/amplitude-proxy/, async (route) => {
        const requestBody = JSON.stringify(await route.request().postDataJSON())
        const originalResponse = await route.fetch()
        const byteSize = new Blob([requestBody]).size
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { ...originalResponse.headers(), 'origin-country': 'GB' },
          body: JSON.stringify({
            code: 200,
            server_upload_time: Date.now(),
            payload_size_bytes: byteSize,
            events_ingested: (await route.request().postDataJSON()).events.length,
          }),
        })
      })

      await page.goto(`/swap${UNCONNECTED_USER_PARAM}`)
      await page.getByText('Read more').click()
      await expect(page.getByText('Disclaimer for UK residents')).toBeVisible()
    })

    test('does not render UK compliance banner in US', async ({ page }) => {
      await page.goto(`/swap${UNCONNECTED_USER_PARAM}`)
      await expect(page.getByTestId(TestID.UKDisclaimer)).not.toBeVisible()
    })
  })

  test.describe('Visual Regression - Desktop', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(DESKTOP_VIEWPORT)
    })

    test('should match baseline screenshot in light mode', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Light"')
        localStorage.setItem('crossChainSwapsOverride', 'true')
      })

      await page.goto(`/${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('landing-page-desktop-light.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('should match baseline screenshot in dark mode', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Dark"')
        localStorage.setItem('crossChainSwapsOverride', 'true')
      })

      await page.goto(`/${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('landing-page-desktop-dark.png', {
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
        localStorage.setItem('crossChainSwapsOverride', 'true')
      })

      await page.goto(`/${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('landing-page-tablet-light.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('should match baseline screenshot in dark mode - tablet', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Dark"')
        localStorage.setItem('crossChainSwapsOverride', 'true')
      })

      await page.goto(`/${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      await expect(page).toHaveScreenshot('landing-page-tablet-dark.png', {
        fullPage: true,
        animations: 'disabled',
        maxDiffPixels: 500, // Allow small pixel differences due to animation timing
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
        localStorage.setItem('crossChainSwapsOverride', 'true')
      })

      await page.goto(`/${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('landing-page-mobile-light.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })

    test('should match baseline screenshot in dark mode - mobile', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Dark"')
        localStorage.setItem('crossChainSwapsOverride', 'true')
      })

      await page.goto(`/${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('landing-page-mobile-dark.png', {
        fullPage: true,
        animations: 'disabled',
      })
    })
  })

  test.describe('Coin Bubble Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(DESKTOP_VIEWPORT)
      await page.addInitScript(() => {
        localStorage.setItem('interface_color_theme', '"Light"')
        localStorage.setItem('crossChainSwapsOverride', 'true')
      })
    })

    // Above the wave bubbles
    test('Bitcoin Chain bubble navigates to BTC->cBTC swap', async ({ page }) => {
      await page.goto(`/${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.getByAltText('Bitcoin Chain').click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      await expect(page).toHaveURL(/.*inputCurrency=BTC.*outputCurrency=cBTC.*/)
      await expect(page).toHaveScreenshot('bubble-btc-chain-swap.png', { animations: 'disabled' })
    })

    test('Bitcoin Lightning bubble navigates to lnBTC->cBTC swap', async ({ page }) => {
      await page.goto(`/${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.getByAltText('Bitcoin Lightning').click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      await expect(page).toHaveURL(/.*inputCurrency=lnBTC.*outputCurrency=cBTC.*/)
      await expect(page).toHaveScreenshot('bubble-btc-lightning-swap.png', { animations: 'disabled' })
    })

    test('Tether+Polygon bubble navigates to USDT->JUSD swap', async ({ page }) => {
      await page.goto(`/${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.getByAltText('Tether+Polygon').click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      await expect(page).toHaveURL(/.*chain=polygon.*inputCurrency=USDT.*outputCurrency=JUSD.*/)
      await expect(page).toHaveScreenshot('bubble-tether-polygon-swap.png', { animations: 'disabled' })
    })

    test('wBTC+ETH bubble navigates to WBTC->WBTC.e swap', async ({ page }) => {
      await page.goto(`/${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.getByAltText('wBTC+ETH').click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      await expect(page).toHaveURL(/.*chain=ethereum.*inputCurrency=WBTC.*outputCurrency=WBTC\.e.*/)
      await expect(page).toHaveScreenshot('bubble-wbtc-eth-swap.png', { animations: 'disabled' })
    })

    test('Tether+ETH bubble navigates to USDT->JUSD swap on Ethereum', async ({ page }) => {
      await page.goto(`/${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.getByAltText('Tether+ETH').click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      await expect(page).toHaveURL(/.*chain=ethereum.*inputCurrency=USDT.*outputCurrency=JUSD.*/)
      await expect(page).toHaveScreenshot('bubble-tether-eth-swap.png', { animations: 'disabled' })
    })

    test('USDC bubble navigates to USDC->JUSD swap', async ({ page }) => {
      await page.goto(`/${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.getByAltText('USDC').click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      await expect(page).toHaveURL(/.*chain=ethereum.*inputCurrency=USDC.*outputCurrency=JUSD.*/)
      await expect(page).toHaveScreenshot('bubble-usdc-swap.png', { animations: 'disabled' })
    })

    // Inside the wave bubbles
    test('cBTC large bubble navigates to BTC->cBTC swap', async ({ page }) => {
      await page.goto(`/${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.getByAltText('cBTC').first().click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      await expect(page).toHaveURL(/.*inputCurrency=BTC.*outputCurrency=cBTC.*/)
      await expect(page).toHaveScreenshot('bubble-cbtc-large-swap.png', { animations: 'disabled' })
    })

    test('cBTC small bubble navigates to BTC->cBTC swap', async ({ page }) => {
      await page.goto(`/${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.getByAltText('cBTC').nth(1).click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      await expect(page).toHaveURL(/.*inputCurrency=BTC.*outputCurrency=cBTC.*/)
      await expect(page).toHaveScreenshot('bubble-cbtc-small-swap.png', { animations: 'disabled' })
    })

    test('wBTC+Citrea bubble navigates to WBTC->WBTC.e swap', async ({ page }) => {
      await page.goto(`/${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.getByAltText('wBTC+Citrea').click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      await expect(page).toHaveURL(/.*chain=ethereum.*inputCurrency=WBTC.*outputCurrency=WBTC\.e.*/)
      await expect(page).toHaveScreenshot('bubble-wbtc-citrea-swap.png', { animations: 'disabled' })
    })

    test('Juice bubble navigates to cBTC->JUICE swap', async ({ page }) => {
      await page.goto(`/${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.getByAltText('Juice').click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      await expect(page).toHaveURL(/.*chain=citrea.*inputCurrency=cBTC.*outputCurrency=JUICE.*/)
      await expect(page).toHaveScreenshot('bubble-juice-swap.png', { animations: 'disabled' })
    })

    test('JUSD small bubble navigates to cBTC->JUSD swap', async ({ page }) => {
      await page.goto(`/${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.getByAltText('JUSD').first().click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      await expect(page).toHaveURL(/.*chain=citrea.*inputCurrency=cBTC.*outputCurrency=JUSD.*/)
      await expect(page).toHaveScreenshot('bubble-jusd-small-swap.png', { animations: 'disabled' })
    })

    test('JUSD large bubble navigates to cBTC->JUSD swap', async ({ page }) => {
      await page.goto(`/${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')
      await page.getByAltText('JUSD').nth(1).click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
      await expect(page).toHaveURL(/.*chain=citrea.*inputCurrency=cBTC.*outputCurrency=JUSD.*/)
      await expect(page).toHaveScreenshot('bubble-jusd-large-swap.png', { animations: 'disabled' })
    })
  })
})
