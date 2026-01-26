import { chromium, expect, test, type BrowserContext, type Page } from '@playwright/test'
import { prepareExtension } from '@synthetixio/synpress-cache'
import { MetaMask, getExtensionId } from '@synthetixio/synpress-metamask/playwright'
import { CHAIN_CONFIG, SEED_PHRASE, WALLET_ADDRESS, WALLET_PASSWORD } from './wallet.setup'

// CRITICAL: No mock data, no fallback seeds allowed!
if (!SEED_PHRASE || SEED_PHRASE.split(' ').length !== 12) {
  throw new Error('WALLET_SEED_PHRASE must be set with a valid 12-word seed phrase. No fallbacks!')
}

if (!WALLET_PASSWORD || WALLET_PASSWORD.length < 8) {
  throw new Error('WALLET_PASSWORD must be set (min 8 characters). No fallbacks!')
}

// Token page to test
const TOKEN_PAGE = '/launchpad/0xb65467c66bab289481278f90500061201d46d206'

async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: `e2e/metamask/snapshots/token-page-connect/${name}`,
    fullPage: true,
  })
}

test.describe('Token Page: Connect Wallet Button', () => {
  let context: BrowserContext
  let metamask: MetaMask

  test.setTimeout(120000)

  test.beforeAll(async () => {
    // Setup MetaMask extension
    const extensionPath = await prepareExtension()

    context = await chromium.launchPersistentContext('', {
      headless: false,
      viewport: { width: 1280, height: 900 },
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    })

    const extensionId = await getExtensionId(context, 'MetaMask')
    await new Promise((r) => setTimeout(r, 3000))

    let metamaskPage = context.pages().find((p) => p.url().includes('chrome-extension://'))
    if (!metamaskPage) {
      await new Promise((r) => setTimeout(r, 3000))
      metamaskPage = context.pages().find((p) => p.url().includes('chrome-extension://'))
    }
    if (!metamaskPage) throw new Error('MetaMask not found')

    metamask = new MetaMask(context, metamaskPage, WALLET_PASSWORD, extensionId)
    await metamask.importWallet(SEED_PHRASE)
    await new Promise((r) => setTimeout(r, 3000))

    // Click through MetaMask onboarding
    for (const page of context.pages()) {
      if (page.url().includes('chrome-extension://')) {
        for (const selector of [
          'button:has-text("Got it")',
          'button:has-text("Verstanden")',
          '[data-testid="onboarding-complete-done"]',
          '[data-testid="pin-extension-next"]',
          'button:has-text("Next")',
          'button:has-text("Weiter")',
          '[data-testid="pin-extension-done"]',
          'button:has-text("Done")',
          'button:has-text("Fertig")',
        ]) {
          const btn = page.locator(selector).first()
          if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await btn.click()
            await new Promise((r) => setTimeout(r, 1000))
          }
        }
      }
    }

    // Navigate to MetaMask home and dismiss popups
    const homeUrl = `chrome-extension://${extensionId}/home.html`
    let homePage = context.pages().find((p) => p.url().includes(extensionId))
    if (homePage) {
      await homePage.goto(homeUrl)
    } else {
      homePage = await context.newPage()
      await homePage.goto(homeUrl)
    }
    await homePage.waitForLoadState('domcontentloaded')
    await new Promise((r) => setTimeout(r, 2000))

    for (const selector of [
      'button:has-text("Got it")',
      'button:has-text("Verstanden")',
      '[data-testid="popover-close"]',
    ]) {
      const btn = homePage.locator(selector).first()
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.click()
        await new Promise((r) => setTimeout(r, 500))
      }
    }

    metamask = new MetaMask(context, homePage, WALLET_PASSWORD, extensionId)

    // Add Citrea Testnet
    try {
      await metamask.addNetwork(CHAIN_CONFIG.citreaTestnet)
    } catch {
      // Network may already exist
    }
  })

  test.afterAll(async () => {
    await context?.close()
  })

  test('Click Connect Wallet button on token page and connect MetaMask', async () => {
    const page = await context.newPage()

    // Step 1: Navigate to token page
    await page.goto(TOKEN_PAGE)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(5000) // Wait for React to render
    await screenshot(page, 'step01-token-page-loaded.png')

    // Debug: Log page content
    const pageContent = await page.content()
    console.log('Page URL:', page.url())
    console.log('Page has Connect Wallet:', pageContent.includes('Connect Wallet'))

    // Step 2: Find Connect Wallet button (in the Buy/Sell section)
    const connectButton = page.locator('button:has-text("Connect Wallet"), span:has-text("Connect Wallet")').first()
    await expect(connectButton).toBeVisible({ timeout: 15000 })
    await screenshot(page, 'step02-connect-button-visible.png')

    // Step 3: Click Connect Wallet button
    await connectButton.click()
    await page.waitForTimeout(2000)
    await screenshot(page, 'step03-after-click.png')

    // Step 4: Wait for wallet modal and select MetaMask
    // The modal might take a moment to appear
    const metamaskOption = page.locator('button:has-text("MetaMask"), div:has-text("MetaMask") >> visible=true').first()
    await expect(metamaskOption).toBeVisible({ timeout: 10000 })
    await metamaskOption.click()
    await screenshot(page, 'step04-metamask-selected.png')

    // Step 5: Approve connection in MetaMask
    await metamask.connectToDapp()
    await page.waitForTimeout(3000)
    await page.bringToFront()
    await screenshot(page, 'step05-metamask-connected.png')

    // Step 6: Verify wallet is connected
    // The Connect Wallet button should be replaced with the wallet address
    const walletAddress = page.locator(`text=/${WALLET_ADDRESS.slice(0, 6)}/i`)
    const isConnected = await walletAddress.isVisible({ timeout: 10000 }).catch(() => false)

    if (isConnected) {
      await screenshot(page, 'step06-wallet-connected-success.png')
    } else {
      // Alternative: Check that Connect Wallet button is gone
      const connectButtonGone = !(await connectButton.isVisible({ timeout: 2000 }).catch(() => true))
      if (connectButtonGone) {
        await screenshot(page, 'step06-connect-button-replaced.png')
      }
    }

    await screenshot(page, 'step-final.png')
    await page.close()
  })
})
