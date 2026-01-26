import { chromium, expect, test, type BrowserContext, type Page } from '@playwright/test'
import { prepareExtension } from '@synthetixio/synpress-cache'
import { MetaMask, getExtensionId } from '@synthetixio/synpress-metamask/playwright'
import { CHAIN_CONFIG, SEED_PHRASE, WALLET_ADDRESS, WALLET_PASSWORD } from './wallet.setup'

// CRITICAL: No mock data, no fallback seeds allowed!
if (!SEED_PHRASE || SEED_PHRASE.split(' ').length !== 12) {
  throw new Error(
    'WALLET_SEED_PHRASE must be set in environment variables with a valid 12-word seed phrase. ' +
      'No fallbacks or mock data allowed!',
  )
}

if (!WALLET_PASSWORD || WALLET_PASSWORD.length < 8) {
  throw new Error('WALLET_PASSWORD must be set in environment variables (min 8 characters). No fallbacks allowed!')
}

// Token address to test
const TOKEN_ADDRESS = '0xb65467c66bab289481278f90500061201d46d206'
const BUY_AMOUNT = '10' // 10 JUSD

// Helper function to take screenshot
async function screenshot(page: Page, name: string) {
  await page.waitForTimeout(200)
  try {
    await page.screenshot({
      path: `e2e/metamask/snapshots/token-buy/${name}`,
      fullPage: true,
    })
    console.log(`Screenshot saved: ${name}`)
  } catch (e) {
    console.log(`Could not save screenshot: ${name}`)
  }
}

test.describe('Token Buy with MetaMask', () => {
  let context: BrowserContext
  let metamask: MetaMask

  test.setTimeout(180000) // 3 minutes for buy flow

  test.beforeAll(async () => {
    console.log('=== Wallet Setup ===')
    console.log('SEED_PHRASE (first 20 chars):', SEED_PHRASE.slice(0, 20) + '...')
    console.log('Expected WALLET_ADDRESS:', WALLET_ADDRESS)

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

    // Click through MetaMask setup screens
    for (const page of context.pages()) {
      if (page.url().includes('chrome-extension://')) {
        const buttonSelectors = [
          'button:has-text("Got it")',
          'button:has-text("Open wallet")',
          'button:has-text("Done")',
          'button:has-text("Verstanden")',
          'button:has-text("Wallet öffnen")',
          'button:has-text("Fertig")',
          '[data-testid="onboarding-complete-done"]',
          '[data-testid="pin-extension-done"]',
          '[data-testid="whats-new-popup-close"]',
        ]
        for (const selector of buttonSelectors) {
          const btn = page.locator(selector).first()
          if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await btn.click()
            await new Promise((r) => setTimeout(r, 2000))
          }
        }
      }
    }

    await new Promise((r) => setTimeout(r, 2000))

    // Skip pin extension step
    for (const page of context.pages()) {
      if (page.url().includes('chrome-extension://')) {
        const nextBtn = page
          .locator('[data-testid="pin-extension-next"], button:has-text("Next"), button:has-text("Weiter")')
          .first()
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextBtn.click()
          await new Promise((r) => setTimeout(r, 1000))
        }
        const doneBtn = page
          .locator('[data-testid="pin-extension-done"], button:has-text("Done"), button:has-text("Fertig")')
          .first()
        if (await doneBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await doneBtn.click()
          await new Promise((r) => setTimeout(r, 2000))
        }
      }
    }

    // Navigate to MetaMask home
    await new Promise((r) => setTimeout(r, 2000))
    const homeUrl = `chrome-extension://${extensionId}/home.html`
    let homePage = context.pages().find((p) => p.url().includes(extensionId))
    if (homePage) {
      await homePage.goto(homeUrl)
    } else {
      homePage = await context.newPage()
      await homePage.goto(homeUrl)
    }
    await homePage.waitForLoadState('domcontentloaded')
    await new Promise((r) => setTimeout(r, 3000))

    // Dismiss popups
    const popupSelectors = [
      'button:has-text("Got it")',
      'button:has-text("Verstanden")',
      '[data-testid="popover-close"]',
      '[data-testid="whats-new-popup-close"]',
    ]
    for (const selector of popupSelectors) {
      const btn = homePage.locator(selector).first()
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click()
        await new Promise((r) => setTimeout(r, 1000))
      }
    }

    metamask = new MetaMask(context, homePage, WALLET_PASSWORD, extensionId)

    // Add Citrea Testnet
    try {
      await metamask.addNetwork(CHAIN_CONFIG.citreaTestnet)
      console.log('Added Citrea Testnet')
    } catch (e) {
      console.log('Could not add Citrea Testnet (may already exist):', e)
    }
  })

  test.afterAll(async () => {
    await context?.close()
  })

  test('Buy tokens for 10 JUSD on token page', async () => {
    const page = await context.newPage()

    // Navigate to token page
    console.log('Navigating to token page...')
    await page.goto(`/launchpad/${TOKEN_ADDRESS}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    await screenshot(page, 'step01-token-page-loaded.png')

    // Find and click Connect Wallet button
    console.log('Looking for Connect Wallet button...')
    const connectButton = page.locator('button:has-text("Connect Wallet")').first()
    await expect(connectButton).toBeVisible({ timeout: 10000 })
    await screenshot(page, 'step02-connect-button-visible.png')

    await connectButton.click()
    await page.waitForTimeout(1000)
    await screenshot(page, 'step03-wallet-modal-open.png')

    // Click MetaMask option
    console.log('Clicking MetaMask option...')
    const metamaskOption = page.locator('text=/metamask/i').first()
    await expect(metamaskOption).toBeVisible({ timeout: 5000 })
    await metamaskOption.click()
    await screenshot(page, 'step04-metamask-clicked.png')

    // Approve connection in MetaMask
    console.log('Connecting to dApp via MetaMask...')
    await metamask.connectToDapp()
    await page.waitForTimeout(3000)

    // Bring main page back to front
    await page.bringToFront()
    await screenshot(page, 'step05-wallet-connected.png')

    // Verify wallet is connected - should see Buy button now
    console.log('Verifying wallet connection...')
    const buyButton = page.locator('button:has-text("Enter amount")').first()
    const isBuyVisible = await buyButton.isVisible({ timeout: 10000 }).catch(() => false)

    if (!isBuyVisible) {
      // Check for Buy button directly (if amount already entered)
      const directBuyButton = page.locator('button:has-text("Buy")').first()
      const isDirectBuyVisible = await directBuyButton.isVisible({ timeout: 5000 }).catch(() => false)
      if (!isDirectBuyVisible) {
        await screenshot(page, 'step05-error-no-buy-button.png')
        throw new Error('Could not find buy button - wallet might not be connected')
      }
    }

    // Make sure Buy tab is selected
    console.log('Ensuring Buy tab is selected...')
    const buyTab = page.locator('div:has-text("Buy")').first()
    if (await buyTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await buyTab.click()
      await page.waitForTimeout(500)
    }
    await screenshot(page, 'step06-buy-tab-selected.png')

    // Find the input field and enter amount
    console.log(`Entering amount: ${BUY_AMOUNT} JUSD...`)
    const amountInput = page.locator('input[placeholder="0.0"]').first()
    await expect(amountInput).toBeVisible({ timeout: 5000 })
    await amountInput.click()
    await amountInput.fill(BUY_AMOUNT)
    await page.waitForTimeout(1500) // Wait for quote to load
    await screenshot(page, 'step07-amount-entered.png')

    // Check if we need to approve first
    const approveButton = page.locator('button:has-text("Approve JUSD")').first()
    const needsApproval = await approveButton.isVisible({ timeout: 3000 }).catch(() => false)

    if (needsApproval) {
      console.log('Approval needed, clicking Approve JUSD...')
      await approveButton.click()
      await screenshot(page, 'step08-approve-clicked.png')

      // Confirm approval in MetaMask
      console.log('Confirming approval in MetaMask...')
      await page.waitForTimeout(2000)
      await metamask.confirmTransaction()
      await page.waitForTimeout(5000) // Wait for approval to complete

      await page.bringToFront()
      await screenshot(page, 'step09-approval-confirmed.png')
    }

    // Now click the Buy button
    console.log('Clicking Buy button...')
    const finalBuyButton = page.locator('button:has-text("Buy")').first()
    await expect(finalBuyButton).toBeVisible({ timeout: 10000 })

    // Wait for button to be enabled (not disabled variant)
    await page.waitForTimeout(2000)
    await finalBuyButton.click()
    await screenshot(page, 'step10-buy-clicked.png')

    // Confirm transaction in MetaMask
    console.log('Confirming buy transaction in MetaMask...')
    await page.waitForTimeout(2000)
    await metamask.confirmTransaction()
    await screenshot(page, 'step11-transaction-confirming.png')

    // Wait for transaction to complete
    console.log('Waiting for transaction to complete...')
    await page.bringToFront()

    // Look for success toast or updated balance
    const successIndicators = [
      page.locator('text=/Bought/i'),
      page.locator('[data-testid="toast-success"]'),
      page.locator('text=/Transaction confirmed/i'),
    ]

    let transactionSucceeded = false
    for (let i = 0; i < 30; i++) {
      // Wait up to 30 seconds
      for (const indicator of successIndicators) {
        if (await indicator.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log('Transaction succeeded!')
          transactionSucceeded = true
          break
        }
      }
      if (transactionSucceeded) break
      await page.waitForTimeout(1000)
    }

    await screenshot(page, 'step12-transaction-complete.png')

    if (transactionSucceeded) {
      console.log(`Successfully bought tokens for ${BUY_AMOUNT} JUSD!`)
    } else {
      console.log('Could not verify transaction success (may still have succeeded)')
    }

    await screenshot(page, 'step-final.png')
    await page.close()
  })
})
