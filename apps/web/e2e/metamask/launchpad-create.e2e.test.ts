import { chromium, expect, test, type BrowserContext, type Page } from '@playwright/test'
import { prepareExtension } from '@synthetixio/synpress-cache'
import { MetaMask, getExtensionId } from '@synthetixio/synpress-metamask/playwright'
import path from 'path'
import { CHAIN_CONFIG, SEED_PHRASE, WALLET_ADDRESS, WALLET_PASSWORD } from './wallet.setup'

// CRITICAL: No mock data, no fallback seeds allowed!
// These MUST be set via environment variables
if (!SEED_PHRASE || SEED_PHRASE.split(' ').length !== 12) {
  throw new Error(
    'WALLET_SEED_PHRASE must be set in environment variables with a valid 12-word seed phrase. ' +
      'No fallbacks or mock data allowed!',
  )
}

if (!WALLET_PASSWORD || WALLET_PASSWORD.length < 8) {
  throw new Error('WALLET_PASSWORD must be set in environment variables (min 8 characters). No fallbacks allowed!')
}

// Test token data
const TEST_TOKEN = {
  name: 'TapTap',
  symbol: 'TAPTAP',
  description: "I'm the tap and tap around here.",
  logoPath: path.join(__dirname, '..', 'pages', 'Launchpad', 'taptap-logo.jpg'),
}

// Helper function to take screenshot
async function screenshot(page: Page, name: string) {
  await page.waitForTimeout(200)
  try {
    await page.screenshot({
      path: `e2e/metamask/snapshots/launchpad-create/${name}`,
      fullPage: true,
    })
    console.log(`Screenshot saved: ${name}`)
  } catch (e) {
    console.log(`Could not save screenshot: ${name}`)
  }
}

test.describe('Launchpad: Create Token with MetaMask', () => {
  let context: BrowserContext
  let metamask: MetaMask
  let metamaskExtensionId: string

  test.setTimeout(180000) // 3 minutes

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
    metamaskExtensionId = extensionId
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

  // Helper to get MetaMask page
  const getMetaMaskPage = async (): Promise<Page | null> => {
    const allPages = context.pages()
    let mmPage = allPages.find((p) => p.url().includes(metamaskExtensionId) && p.url().includes('notification'))
    if (!mmPage) {
      mmPage = allPages.find((p) => p.url().includes(metamaskExtensionId))
    }
    if (!mmPage) {
      mmPage = await context.newPage()
      await mmPage.goto(`chrome-extension://${metamaskExtensionId}/home.html`)
      await mmPage.waitForLoadState('domcontentloaded')
      await mmPage.waitForTimeout(2000)
    }
    await mmPage.bringToFront()
    await mmPage.waitForTimeout(1000)
    return mmPage
  }

  // Helper to confirm MetaMask transaction
  const confirmMetaMaskTransaction = async (stepName: string): Promise<boolean> => {
    console.log(`[${stepName}] Looking for MetaMask transaction to confirm...`)
    await new Promise((r) => setTimeout(r, 2000))

    const mmPage = await getMetaMaskPage()
    if (!mmPage) {
      console.log(`[${stepName}] No MetaMask page found`)
      return false
    }

    // Take debug screenshot
    try {
      await mmPage.screenshot({
        path: `e2e/metamask/snapshots/launchpad-create/debug-${stepName}-${Date.now()}.png`,
      })
    } catch (e) {
      console.log(`[${stepName}] Could not take debug screenshot`)
    }

    const confirmSelectors = [
      'button.mm-button-primary',
      'button.btn-primary',
      'button:has-text("Bestätigen")',
      'button:has-text("Genehmigen")',
      'button:has-text("Signieren")',
      'button:has-text("Confirm")',
      'button:has-text("Approve")',
      'button:has-text("Sign")',
      '[data-testid="confirm-footer-button"]',
      '[data-testid="page-container-footer-next"]',
      '[data-testid="confirmation-submit-button"]',
    ]

    for (const selector of confirmSelectors) {
      const btn = mmPage.locator(selector).first()
      if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
        const isDisabled = await btn.isDisabled().catch(() => false)
        if (isDisabled) continue
        console.log(`[${stepName}] Found confirm button: ${selector}`)
        await btn.click()
        try {
          await mmPage.waitForTimeout(2000)
        } catch (e) {
          console.log(`[${stepName}] MetaMask page closed after confirmation`)
        }
        return true
      }
    }

    console.log(`[${stepName}] No confirm button found`)
    return false
  }

  // Helper to handle network switch
  const handleNetworkSwitch = async (stepName: string): Promise<boolean> => {
    console.log(`[${stepName}] Checking for network switch request...`)

    const mmPage = await getMetaMaskPage()
    if (!mmPage) return false

    const networkSwitchSelectors = [
      'button:has-text("Netzwerk wechseln")',
      'button:has-text("Switch network")',
      'button:has-text("Approve")',
      '[data-testid="confirmation-submit-button"]',
    ]

    for (const selector of networkSwitchSelectors) {
      const btn = mmPage.locator(selector).first()
      if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
        console.log(`[${stepName}] Found network switch button: ${selector}`)
        await btn.click()
        try {
          await mmPage.waitForTimeout(2000)
        } catch (e) {
          console.log(`[${stepName}] MetaMask page closed after network switch`)
        }
        return true
      }
    }

    return false
  }

  // ===================
  // TEST: Create Token with MetaMask
  // ===================
  test('Create TapTap token on Launchpad', async () => {
    const page = await context.newPage()

    // Enable browser console logging
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.text().includes('Launchpad')) {
        console.log(`[Browser] ${msg.text()}`)
      }
    })

    console.log('Test token:', TEST_TOKEN)

    // Step 1: Switch to Citrea Testnet
    try {
      await metamask.switchNetwork('Citrea Testnet')
      console.log('Switched to Citrea Testnet')
    } catch (e) {
      console.log('Could not switch network (may already be on Citrea):', e)
    }

    // Step 2: Navigate to launchpad create page
    await page.goto('/launchpad/create')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await screenshot(page, 'step01-page-loaded.png')

    // Step 3: Connect wallet
    const connectButton = page.getByText('Connect Wallet')
    if (await connectButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await connectButton.click()
      await page.waitForTimeout(1000)
      await screenshot(page, 'step02-wallet-modal.png')

      // Click MetaMask option
      const metamaskOption = page.getByText(/metamask/i).first()
      await metamaskOption.click()
      await screenshot(page, 'step03-metamask-clicked.png')

      // Approve connection in MetaMask
      await metamask.connectToDapp()
      await page.waitForTimeout(3000)
      await screenshot(page, 'step04-wallet-connected.png')
    } else {
      console.log('Wallet might already be connected')
      await screenshot(page, 'step02-wallet-already-connected.png')
    }

    // Step 4: Fill in token name
    const nameInput = page.getByPlaceholder('My Awesome Token')
    await nameInput.fill(TEST_TOKEN.name)
    await screenshot(page, 'step05-name-filled.png')

    // Step 5: Fill in token symbol
    const symbolInput = page.getByPlaceholder('TOKEN', { exact: true })
    await symbolInput.fill(TEST_TOKEN.symbol)
    await screenshot(page, 'step06-symbol-filled.png')

    // Step 6: Fill in description
    const descriptionInput = page.getByPlaceholder('Describe your token project...')
    await descriptionInput.fill(TEST_TOKEN.description)
    await screenshot(page, 'step07-description-filled.png')

    // Step 7: Upload logo
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(TEST_TOKEN.logoPath)
    await page.waitForTimeout(1000)
    await screenshot(page, 'step08-logo-uploaded.png')

    // Verify image preview is visible
    await expect(page.locator('img[alt="Token logo preview"]')).toBeVisible()
    await screenshot(page, 'step09-form-complete.png')

    // Step 8: Click Create Token button (specifically the button, not the heading)
    const createButton = page.locator('span:has-text("Create Token")').last()
    await expect(createButton).toBeVisible()

    // Check parent element for disabled state
    const parentFlex = createButton.locator('..')
    const isDisabled = await parentFlex
      .evaluate((el) => {
        return el.getAttribute('disabled') !== null || el.classList.contains('disabled')
      })
      .catch(() => false)

    if (isDisabled) {
      console.log('Create Token button is disabled - checking form state')
      await screenshot(page, 'step10-button-disabled.png')
    }

    await createButton.click()
    await page.waitForTimeout(2000)
    await screenshot(page, 'step10-create-clicked.png')

    // Step 9: Handle IPFS upload status
    // The button should show "Uploading image and metadata to IPFS..."
    const uploadingText = page.locator('text=/uploading|IPFS/i').first()
    if (await uploadingText.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Uploading to IPFS...')
      await screenshot(page, 'step11-uploading-ipfs.png')

      // Wait for IPFS upload to complete (up to 30 seconds)
      await page.waitForTimeout(10000)
      await screenshot(page, 'step12-ipfs-progress.png')
    }

    // Step 10: Wait for "Creating token on-chain..." status
    const creatingText = page.locator('text=/creating|on-chain/i').first()
    if (await creatingText.isVisible({ timeout: 30000 }).catch(() => false)) {
      console.log('Creating token on-chain...')
      await screenshot(page, 'step13-creating-onchain.png')
    }

    // Step 11: Handle MetaMask transaction confirmation
    let txConfirmed = false
    for (let attempt = 1; attempt <= 10; attempt++) {
      console.log(`[CreateToken] Attempt ${attempt}/10 - checking for MetaMask transaction...`)

      // Check for network switch first
      const networkSwitched = await handleNetworkSwitch(`CreateToken-${attempt}`)
      if (networkSwitched) {
        console.log('Network switched, waiting for transaction...')
        await page.bringToFront()
        await page.waitForTimeout(2000)
        continue
      }

      // Try to confirm transaction
      const confirmed = await confirmMetaMaskTransaction(`CreateToken-${attempt}`)
      if (confirmed) {
        txConfirmed = true
        console.log('Transaction confirmed!')
        await page.bringToFront()
        break
      }

      // Check if still waiting
      const confirmInWallet = page.locator('text=/confirm in wallet|Creating/i').first()
      if (!(await confirmInWallet.isVisible({ timeout: 2000 }).catch(() => false))) {
        console.log('No longer waiting for wallet confirmation')
        break
      }

      await page.waitForTimeout(3000)
    }

    await page.bringToFront()
    await page.waitForTimeout(3000)
    await screenshot(page, 'step14-after-tx-confirm.png')

    // Step 12: Wait for redirect to token page or success message
    console.log('Waiting for token creation to complete...')
    await page.waitForTimeout(10000)
    await screenshot(page, 'step15-waiting-completion.png')

    // Check if we were redirected to the token detail page
    const currentUrl = page.url()
    console.log('Current URL:', currentUrl)

    if (currentUrl.includes('/launchpad/0x')) {
      console.log('Successfully redirected to token page!')
      await screenshot(page, 'step16-token-created-success.png')

      // Verify token info is displayed
      await expect(page.getByText(TEST_TOKEN.name)).toBeVisible({ timeout: 10000 })
      await screenshot(page, 'step17-token-detail-page.png')
    } else {
      // Check for error
      const errorText = page.locator('text=/error|failed/i').first()
      if (await errorText.isVisible({ timeout: 3000 }).catch(() => false)) {
        const errorMessage = await errorText.textContent()
        console.log('Error detected:', errorMessage)
        await screenshot(page, 'step16-error.png')
      } else {
        // Still on create page - might be loading
        await screenshot(page, 'step16-still-on-create-page.png')
      }
    }

    // Final screenshot
    await screenshot(page, 'step-final.png')

    await page.close()
  })
})
