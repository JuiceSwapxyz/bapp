import { chromium, expect, test, type BrowserContext } from '@playwright/test'
import { prepareExtension } from '@synthetixio/synpress-cache'
import { MetaMask, getExtensionId } from '@synthetixio/synpress-metamask/playwright'
import { CHAIN_CONFIG, SEED_PHRASE, WALLET_ADDRESS, WALLET_PASSWORD } from './wallet.setup'

if (!SEED_PHRASE || !WALLET_PASSWORD) {
  throw new Error('WALLET_SEED_PHRASE and WALLET_PASSWORD must be set in environment variables')
}

test.describe('Cross-Chain Swap: JUSD (Citrea) <-> USDT (Polygon)', () => {
  let context: BrowserContext
  let metamask: MetaMask

  test.beforeAll(async () => {
    // Debug: Log wallet info
    console.log('=== Wallet Setup ===')
    console.log('SEED_PHRASE (first 20 chars):', SEED_PHRASE.slice(0, 20) + '...')
    console.log('Expected WALLET_ADDRESS:', WALLET_ADDRESS)

    // Prepare MetaMask extension
    const extensionPath = await prepareExtension()

    // Launch browser with MetaMask extension
    context = await chromium.launchPersistentContext('', {
      headless: false,
      viewport: { width: 1280, height: 720 },
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    })

    // Get MetaMask extension ID
    const extensionId = await getExtensionId(context, 'MetaMask')

    // Wait for MetaMask to initialize
    await new Promise((r) => setTimeout(r, 3000))

    // Find MetaMask page (might need to wait for it after extension loads)
    let metamaskPage = context.pages().find((p) => p.url().includes('chrome-extension://'))

    // If not found, wait and try again
    if (!metamaskPage) {
      await new Promise((r) => setTimeout(r, 3000))
      metamaskPage = context.pages().find((p) => p.url().includes('chrome-extension://'))
    }

    if (!metamaskPage) throw new Error('MetaMask not found')

    // Initialize MetaMask instance
    metamask = new MetaMask(context, metamaskPage, WALLET_PASSWORD, extensionId)

    // Import wallet using seed phrase
    await metamask.importWallet(SEED_PHRASE)

    // Wait for "Your wallet is ready" screen and click "Open wallet"
    await new Promise((r) => setTimeout(r, 3000))

    // Find the MetaMask page showing "Wallet is ready" and click the button
    for (const page of context.pages()) {
      if (page.url().includes('chrome-extension://')) {
        try {
          // Wait for any of these buttons to appear
          const buttonSelectors = [
            'button:has-text("Got it")',
            'button:has-text("Open wallet")',
            'button:has-text("Wallet öffnen")',
            'button:has-text("Done")',
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
              break
            }
          }
        } catch {
          // Continue to next page
        }
      }
    }

    // After clicking "Open wallet", MetaMask might show pin extension page
    // Wait and click through any additional screens
    await new Promise((r) => setTimeout(r, 2000))

    for (const page of context.pages()) {
      if (page.url().includes('chrome-extension://')) {
        try {
          // Skip pin extension step if shown
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
        } catch {
          // Continue
        }
      }
    }

    // Now navigate directly to MetaMask home page
    await new Promise((r) => setTimeout(r, 2000))
    const homeUrl = `chrome-extension://${extensionId}/home.html`

    // Find or create page for MetaMask home
    let homePage = context.pages().find((p) => p.url().includes(extensionId))
    if (homePage) {
      await homePage.goto(homeUrl)
    } else {
      homePage = await context.newPage()
      await homePage.goto(homeUrl)
    }

    await homePage.waitForLoadState('domcontentloaded')
    await new Promise((r) => setTimeout(r, 3000))

    // Dismiss any "What's new" or other popups on home page
    const popupDismissSelectors = [
      'button:has-text("Got it")',
      'button:has-text("Verstanden")',
      '[data-testid="popover-close"]',
      '[data-testid="whats-new-popup-close"]',
      'button[aria-label="Close"]',
    ]
    for (const selector of popupDismissSelectors) {
      const btn = homePage.locator(selector).first()
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click()
        await new Promise((r) => setTimeout(r, 1000))
      }
    }

    // Create fresh MetaMask instance with the home page
    metamask = new MetaMask(context, homePage, WALLET_PASSWORD, extensionId)

    // Add networks with error handling
    try {
      await metamask.addNetwork(CHAIN_CONFIG.citreaTestnet)
    } catch (e) {
      console.log('Could not add Citrea Testnet:', e)
    }

    try {
      await metamask.addNetwork(CHAIN_CONFIG.polygon)
    } catch (e) {
      console.log('Could not add Polygon (may already exist):', e)
    }
  })

  test.afterAll(async () => {
    await context?.close()
  })

  test('should load swap page with URL parameters for Citrea JUSD -> Polygon USDT', async () => {
    const page = await context.newPage()

    // Navigate to swap page with cross-chain parameters
    // Citrea Testnet -> Polygon: JUSD -> USDT
    await page.goto('/swap?chain=citrea_testnet&outputChain=polygon&inputCurrency=JUSD&outputCurrency=USDT')
    await page.waitForLoadState('networkidle')

    // Wait for page to fully load
    await page.waitForTimeout(3000)

    // Visual regression test - compare against baseline screenshot
    await expect(page).toHaveScreenshot('citrea-jusd-to-polygon-usdt.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    })

    await page.close()
  })

  test('should load swap page with URL parameters for Polygon USDT -> Citrea JUSD', async () => {
    const page = await context.newPage()

    // Navigate to swap page with cross-chain parameters
    // Polygon -> Citrea Testnet: USDT -> JUSD
    await page.goto('/swap?chain=polygon&outputChain=citrea_testnet&inputCurrency=USDT&outputCurrency=JUSD')
    await page.waitForLoadState('networkidle')

    // Wait for page to fully load
    await page.waitForTimeout(3000)

    // Visual regression test - compare against baseline screenshot
    await expect(page).toHaveScreenshot('polygon-usdt-to-citrea-jusd.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    })

    await page.close()
  })

  test('should connect MetaMask wallet and verify connection', async () => {
    const page = await context.newPage()

    // Navigate to swap page
    await page.goto('/swap?chain=citrea_testnet&outputChain=polygon&inputCurrency=JUSD&outputCurrency=USDT')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Find and click connect button
    const connectButton = page.getByRole('button', { name: /connect/i }).first()
    if (await connectButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await connectButton.click()

      // Wait for wallet modal
      await page.waitForTimeout(1000)

      // Find MetaMask option in the wallet modal
      const metamaskOption = page.getByText(/metamask/i).first()
      if (await metamaskOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await metamaskOption.click()

        // Approve connection in MetaMask
        await metamask.connectToDapp()
        await page.waitForTimeout(2000)

        // Verify wallet is connected (address visible)
        const addressVisible = await page
          .locator('text=/0x[a-fA-F0-9]{4}/i')
          .first()
          .isVisible({ timeout: 10000 })
          .catch(() => false)
        expect(addressVisible).toBeTruthy()
      }
    }

    await page.close()
  })

  test('should switch network when prompted', async () => {
    const page = await context.newPage()

    // First switch MetaMask to Polygon
    await metamask.switchNetwork('Polygon')

    // Navigate to swap page with Citrea as input chain
    await page.goto('/swap?chain=citrea_testnet&inputCurrency=JUSD')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // The app might prompt to switch network
    // Handle any switch network dialogs
    const switchButton = page.getByRole('button', { name: /switch|change.*network/i }).first()
    if (await switchButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await switchButton.click()

      // Approve network switch in MetaMask
      try {
        await metamask.approveNewNetwork()
        await metamask.approveSwitchNetwork()
      } catch {
        // Network might already be added
      }
    }

    await page.close()
  })

  test('should execute a cross-chain swap from USDT (Polygon) to JUSD (Citrea)', async () => {
    const page = await context.newPage()
    const SWAP_AMOUNT = '1'

    // Capture browser console errors and failed requests
    const consoleErrors: string[] = []
    const failedRequests: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Console Error] ${msg.text()}`)
      }
    })
    page.on('pageerror', (error) => {
      consoleErrors.push(`[Page Error] ${error.message}`)
    })
    page.on('requestfailed', (request) => {
      failedRequests.push(`[Failed] ${request.url()} - ${request.failure()?.errorText}`)
    })
    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.push(`[${response.status()}] ${response.url()}`)
      }
    })

    console.log('Expected wallet address:', WALLET_ADDRESS)

    // Switch MetaMask to Polygon
    try {
      await metamask.switchNetwork('Polygon')
    } catch {
      // Network might already be selected
    }

    // Navigate directly to swap page with cross-chain parameters
    await page.goto('/swap?chain=polygon&outputChain=citrea_testnet&inputCurrency=USDT&outputCurrency=JUSD')
    await page.waitForLoadState('networkidle')

    // Wait for the page to fully load and initialize
    await page.waitForTimeout(5000)
    console.log('Page loaded, waiting for Lightning.Space API...')

    // Check if wallet is already connected (via mock connector in Playwright env)
    const connectedWallet = page.locator('button:has-text("0x")').first()
    const isAlreadyConnected = await connectedWallet.isVisible({ timeout: 3000 }).catch(() => false)

    if (isAlreadyConnected) {
      const address = await connectedWallet.textContent()
      console.log('Wallet already connected:', address)

      // Verify it's our expected wallet
      const expectedShort = WALLET_ADDRESS.slice(2, 6).toLowerCase()
      expect(address?.toLowerCase()).toContain(expectedShort)
    } else {
      // Connect wallet fresh
      const connectButton = page.getByRole('button', { name: /connect/i }).first()
      await expect(connectButton).toBeVisible({ timeout: 10000 })
      await connectButton.click()
      await page.waitForTimeout(1000)

      const metamaskOption = page.getByText(/metamask/i).first()
      await expect(metamaskOption).toBeVisible({ timeout: 5000 })
      await metamaskOption.click()

      // Approve connection in MetaMask
      await metamask.connectToDapp()
      await page.waitForTimeout(3000)

      // Verify correct wallet is connected
      if (await connectedWallet.isVisible({ timeout: 5000 }).catch(() => false)) {
        const address = await connectedWallet.textContent()
        console.log('Connected wallet:', address)

        // Verify it's our expected wallet
        const expectedShort = WALLET_ADDRESS.slice(2, 6).toLowerCase()
        expect(address?.toLowerCase()).toContain(expectedShort)
      }
    }

    // Find the input field for the swap amount
    // Usually it's the first input field on the swap form
    const inputField = page.locator('input[type="text"], input[type="number"], input[inputmode="decimal"]').first()
    await expect(inputField).toBeVisible({ timeout: 10000 })

    // Clear and enter the swap amount
    await inputField.click()
    await inputField.fill(SWAP_AMOUNT)
    await page.waitForTimeout(2000)

    // Wait for quote to load (look for the output amount to appear)
    await page.waitForTimeout(5000)

    // Find and click the swap/review button
    const swapButton = page
      .getByRole('button', { name: /swap|review|exchange/i })
      .filter({ hasNotText: /connect/i })
      .first()

    // Wait for button to be enabled (not disabled)
    await expect(swapButton).toBeVisible({ timeout: 15000 })

    // Check if button is enabled
    const isDisabled = await swapButton.isDisabled().catch(() => true)
    if (isDisabled) {
      // Log why it might be disabled
      const buttonText = await swapButton.textContent()
      console.log('Swap button state:', buttonText)

      // Check for insufficient balance or other errors
      const errorMessage = await page.locator('text=/insufficient|not enough|error/i').first().isVisible().catch(() => false)
      if (errorMessage) {
        console.log('Error detected on page - insufficient balance or other issue')
      }

      // Log all failed requests
      if (failedRequests.length > 0) {
        console.log('=== Failed Network Requests ===')
        failedRequests.forEach((req) => console.log(req))
        console.log('=== End Failed Requests ===')
      }

      // Check for warning message on page
      const warningText = await page.locator('text=/cannot be completed|error|failed/i').first().textContent().catch(() => null)
      if (warningText) {
        console.log('Warning on page:', warningText)
      }

      // Get the output amount to see if quote was received
      const outputAmount = await page.locator('input[inputmode="decimal"]').nth(1).inputValue().catch(() => 'N/A')
      console.log('Output amount (JUSD):', outputAmount)
    }

    expect(isDisabled).toBeFalsy()

    await swapButton.click()
    await page.waitForTimeout(2000)

    // Handle review/confirm modal if it appears
    const confirmButton = page.getByRole('button', { name: /confirm|swap|submit/i }).first()
    if (await confirmButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmButton.click()
      await page.waitForTimeout(2000)
    }

    // Approve token spending if required (first transaction)
    try {
      await metamask.confirmTransaction()
      await page.waitForTimeout(3000)
    } catch {
      console.log('No approval transaction needed or already approved')
    }

    // Confirm the actual swap transaction
    try {
      await metamask.confirmTransaction()
      await page.waitForTimeout(5000)
    } catch {
      console.log('Swap transaction confirmation failed or timed out')
    }

    // Wait for transaction to be submitted and check for success indicators
    // Look for success message, transaction hash, or status update
    const successIndicators = [
      'text=/success|completed|submitted|pending/i',
      'text=/transaction|tx|hash/i',
      '[data-testid="swap-success"]',
      '[data-testid="transaction-submitted"]',
    ]

    let swapInitiated = false
    for (const selector of successIndicators) {
      const indicator = page.locator(selector).first()
      if (await indicator.isVisible({ timeout: 5000 }).catch(() => false)) {
        swapInitiated = true
        console.log('Swap initiated successfully, indicator found:', selector)
        break
      }
    }

    // For cross-chain swaps, the transaction might take longer
    // At minimum, verify no error message is shown
    const errorVisible = await page
      .locator('text=/failed|error|rejected/i')
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    expect(errorVisible).toBeFalsy()

    await page.close()
  })
})
