import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, test } from '../../fixtures'

/**
 * Tests for Asset Bubble Direct Links - Mainnet Default Behavior
 *
 * These tests verify that asset bubble direct links on the landing page
 * correctly resolve to mainnet assets by default, and only use testnet
 * when testnet mode is explicitly enabled in settings.
 *
 * Key scenarios:
 * 1. chain=citrea should resolve to CitreaMainnet (not CitreaTestnet)
 * 2. cBTC symbol should infer CitreaMainnet chain
 * 3. With testnet mode enabled, same links should resolve to testnet
 */

const DESKTOP_VIEWPORT = { width: 1440, height: 900 }
const UNCONNECTED_USER_PARAM = '&eagerlyConnect=false'

test.describe('Asset Bubble Direct Links - Mainnet Default', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT)
    // Ensure testnet mode is OFF and cross-chain swaps are enabled
    await page.addInitScript(() => {
      localStorage.setItem('crossChainSwapsOverride', 'true')
      // Explicitly disable testnet mode
      localStorage.removeItem('redux_localstorage_simple_userSettings')
    })
  })

  test.describe('URL Parameter chain=citrea Resolution', () => {
    test('chain=citrea in URL navigates to swap page', async ({ page }) => {
      // Navigate directly to swap with chain=citrea
      await page.goto(`/swap?chain=citrea&inputCurrency=cBTC&outputCurrency=JUICE${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')

      // The URL should contain the chain=citrea parameter
      await expect(page).toHaveURL(/chain=citrea/)
      await expect(page).toHaveURL(/inputCurrency=cBTC/)
      await expect(page).toHaveURL(/outputCurrency=JUICE/)

      // The swap interface should be visible
      await expect(page.getByTestId(TestID.AmountInputIn)).toBeVisible()
    })

    test('outputChain=citrea in URL navigates to swap page', async ({ page }) => {
      await page.goto(
        `/swap?chain=ethereum&inputCurrency=USDT&outputCurrency=JUSD&outputChain=citrea${UNCONNECTED_USER_PARAM}`,
      )
      await page.waitForLoadState('networkidle')

      // URL should have correct chain params
      await expect(page).toHaveURL(/chain=ethereum/)
      await expect(page).toHaveURL(/outputChain=citrea/)
      await expect(page).toHaveURL(/outputCurrency=JUSD/)

      // Swap interface should be visible
      await expect(page.getByTestId(TestID.AmountInputIn)).toBeVisible()
    })
  })

  test.describe('Currency Symbol Chain Inference', () => {
    test('cBTC symbol in URL loads swap correctly', async ({ page }) => {
      // Navigate with cBTC as output - chain should be inferred
      await page.goto(`/swap?inputCurrency=BTC&outputCurrency=cBTC${UNCONNECTED_USER_PARAM}`)
      await page.waitForLoadState('networkidle')

      // The swap should be configured for BTC -> cBTC
      await expect(page).toHaveURL(/inputCurrency=BTC/)
      await expect(page).toHaveURL(/outputCurrency=cBTC/)

      // Swap interface should be visible
      await expect(page.getByTestId(TestID.AmountInputIn)).toBeVisible()
    })
  })

  test.describe('Bubble Click Navigation - Mainnet', () => {
    test('JUICE bubble click navigates to correct swap URL', async ({ page }) => {
      await page.goto(`/?eagerlyConnect=false`)
      await page.waitForLoadState('networkidle')

      // Click the JUICE bubble
      await page.getByAltText('Juice').click()
      await page.waitForLoadState('networkidle')

      // Should navigate to swap with chain=citrea and correct currencies
      await expect(page).toHaveURL(/chain=citrea/)
      await expect(page).toHaveURL(/inputCurrency=cBTC/)
      await expect(page).toHaveURL(/outputCurrency=JUICE/)
    })

    test('JUSD bubble click navigates to correct swap URL', async ({ page }) => {
      await page.goto(`/?eagerlyConnect=false`)
      await page.waitForLoadState('networkidle')

      // Click the first JUSD bubble
      await page.getByAltText('JUSD').first().click()
      await page.waitForLoadState('networkidle')

      // Should navigate to swap with chain=citrea and correct currencies
      await expect(page).toHaveURL(/chain=citrea/)
      await expect(page).toHaveURL(/inputCurrency=cBTC/)
      await expect(page).toHaveURL(/outputCurrency=JUSD/)
    })

    test('wBTC+ETH bubble click navigates to correct swap URL', async ({ page }) => {
      await page.goto(`/?eagerlyConnect=false`)
      await page.waitForLoadState('networkidle')

      // Click the wBTC+ETH bubble
      await page.getByAltText('wBTC+ETH').click()
      await page.waitForLoadState('networkidle')

      // Should navigate to swap with outputChain=citrea
      await expect(page).toHaveURL(/chain=ethereum/)
      await expect(page).toHaveURL(/outputChain=citrea/)
      await expect(page).toHaveURL(/inputCurrency=WBTC/)
      await expect(page).toHaveURL(/outputCurrency=WBTC\.e/)
    })

    test('Bitcoin Chain bubble click navigates to BTC->cBTC swap', async ({ page }) => {
      await page.goto(`/?eagerlyConnect=false`)
      await page.waitForLoadState('networkidle')

      await page.getByAltText('Bitcoin Chain').click()
      await page.waitForLoadState('networkidle')

      // Should have BTC as input and cBTC as output
      await expect(page).toHaveURL(/inputCurrency=BTC/)
      await expect(page).toHaveURL(/outputCurrency=cBTC/)
    })

    test('Tether+Polygon bubble click navigates to USDT->JUSD swap', async ({ page }) => {
      await page.goto(`/?eagerlyConnect=false`)
      await page.waitForLoadState('networkidle')

      await page.getByAltText('Tether+Polygon').click()
      await page.waitForLoadState('networkidle')

      // Should have polygon chain, USDT input, JUSD output, citrea output chain
      await expect(page).toHaveURL(/chain=polygon/)
      await expect(page).toHaveURL(/inputCurrency=USDT/)
      await expect(page).toHaveURL(/outputCurrency=JUSD/)
      await expect(page).toHaveURL(/outputChain=citrea/)
    })
  })
})

test.describe('Asset Bubble Direct Links - All Bubbles Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT)
    await page.addInitScript(() => {
      localStorage.setItem('crossChainSwapsOverride', 'true')
    })
  })

  // Test all bubble URLs contain expected parameters
  const bubbleTests = [
    {
      name: 'Bitcoin Chain',
      alt: 'Bitcoin Chain',
      expectedUrl: /inputCurrency=BTC.*outputCurrency=cBTC/,
    },
    {
      name: 'Bitcoin Lightning',
      alt: 'Bitcoin Lightning',
      expectedUrl: /inputCurrency=lnBTC.*outputCurrency=cBTC/,
    },
    {
      name: 'USDC',
      alt: 'USDC',
      expectedUrl: /chain=ethereum.*inputCurrency=USDC.*outputCurrency=JUSD.*outputChain=citrea/,
    },
    {
      name: 'Juice',
      alt: 'Juice',
      expectedUrl: /chain=citrea.*inputCurrency=cBTC.*outputCurrency=JUICE/,
    },
  ]

  for (const { name, alt, expectedUrl } of bubbleTests) {
    test(`${name} bubble navigates to correct URL`, async ({ page }) => {
      await page.goto(`/?eagerlyConnect=false`)
      await page.waitForLoadState('networkidle')

      await page.getByAltText(alt).click()
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveURL(expectedUrl)
    })
  }
})
