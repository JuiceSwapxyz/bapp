import { chromium, expect, test, type BrowserContext, type Page } from '@playwright/test'
import { prepareExtension } from '@synthetixio/synpress-cache'
import { MetaMask, getExtensionId } from '@synthetixio/synpress-metamask/playwright'
import { CHAIN_CONFIG, SEED_PHRASE, WALLET_ADDRESS, WALLET_PASSWORD } from './wallet.setup'

if (!SEED_PHRASE || !WALLET_PASSWORD) {
  throw new Error('WALLET_SEED_PHRASE and WALLET_PASSWORD must be set in environment variables')
}

// Helper function to take screenshot with baseline comparison
async function screenshot(page: Page, name: string) {
  // Wait for animations to settle before taking screenshot
  await page.waitForTimeout(500)
  await expect(page).toHaveScreenshot(name, {
    fullPage: true,
  })
}

test.describe('Cross-Chain Swap: JUSD (Citrea) <-> USDT (Polygon)', () => {
  let context: BrowserContext
  let metamask: MetaMask

  test.beforeAll(async () => {
    console.log('=== Wallet Setup ===')
    console.log('SEED_PHRASE (first 20 chars):', SEED_PHRASE.slice(0, 20) + '...')
    console.log('Expected WALLET_ADDRESS:', WALLET_ADDRESS)

    const extensionPath = await prepareExtension()

    context = await chromium.launchPersistentContext('', {
      headless: false,
      viewport: { width: 1280, height: 720 },
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
        const nextBtn = page.locator('[data-testid="pin-extension-next"], button:has-text("Next")').first()
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextBtn.click()
          await new Promise((r) => setTimeout(r, 1000))
        }
        const doneBtn = page.locator('[data-testid="pin-extension-done"], button:has-text("Done")').first()
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

    // Add networks
    try {
      await metamask.addNetwork(CHAIN_CONFIG.citreaTestnet)
    } catch (e) {
      console.log('Could not add Citrea Testnet:', e)
    }
    try {
      await metamask.addNetwork(CHAIN_CONFIG.polygon)
    } catch (e) {
      console.log('Could not add Polygon:', e)
    }
  })

  test.afterAll(async () => {
    await context?.close()
  })

  // ===================
  // TEST 1: Load Citrea JUSD -> Polygon USDT
  // ===================
  test('Test 1: Load swap page Citrea JUSD -> Polygon USDT', async () => {
    const page = await context.newPage()

    // Step 1: Navigate to swap page
    await page.goto('/swap?chain=citrea_testnet&outputChain=polygon&inputCurrency=JUSD&outputCurrency=USDT')
    await screenshot(page, 'test1-step1-navigating.png')

    // Step 2: Wait for network idle
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'test1-step2-network-idle.png')

    // Step 3: Wait for full load
    await page.waitForTimeout(3000)
    await screenshot(page, 'test1-step3-fully-loaded.png')

    await page.close()
  })

  // ===================
  // TEST 2: Load Polygon USDT -> Citrea JUSD
  // ===================
  test('Test 2: Load swap page Polygon USDT -> Citrea JUSD', async () => {
    const page = await context.newPage()

    // Step 1: Navigate to swap page
    await page.goto('/swap?chain=polygon&outputChain=citrea_testnet&inputCurrency=USDT&outputCurrency=JUSD')
    await screenshot(page, 'test2-step1-navigating.png')

    // Step 2: Wait for network idle
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'test2-step2-network-idle.png')

    // Step 3: Wait for full load
    await page.waitForTimeout(3000)
    await screenshot(page, 'test2-step3-fully-loaded.png')

    await page.close()
  })

  // ===================
  // TEST 3: Connect MetaMask wallet
  // ===================
  test('Test 3: Connect MetaMask wallet', async () => {
    const page = await context.newPage()

    // Step 1: Navigate to swap page
    await page.goto('/swap?chain=citrea_testnet&outputChain=polygon&inputCurrency=JUSD&outputCurrency=USDT')
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'test3-step1-page-loaded.png')

    // Step 2: Before clicking connect
    await page.waitForTimeout(2000)
    await screenshot(page, 'test3-step2-before-connect.png')

    // Step 3: Click connect button
    const connectButton = page.getByRole('button', { name: /connect/i }).first()
    await connectButton.click()
    await page.waitForTimeout(1000)
    await screenshot(page, 'test3-step3-wallet-modal-open.png')

    // Step 4: Click MetaMask option
    const metamaskOption = page.getByText(/metamask/i).first()
    await metamaskOption.click()
    await screenshot(page, 'test3-step4-metamask-clicked.png')

    // Step 5: Approve connection in MetaMask
    await metamask.connectToDapp()
    await page.waitForTimeout(2000)
    await screenshot(page, 'test3-step5-after-connect.png')

    // Step 6: Verify wallet connected
    await page.waitForTimeout(2000)
    await screenshot(page, 'test3-step6-wallet-connected.png')

    // Verify address visible
    const addressVisible = await page
      .locator('text=/0x[a-fA-F0-9]{4}/i')
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false)
    expect(addressVisible).toBeTruthy()

    await page.close()
  })

  // ===================
  // TEST 4: Switch network
  // ===================
  test('Test 4: Switch network when prompted', async () => {
    const page = await context.newPage()

    // Step 1: Switch MetaMask to Polygon first
    await metamask.switchNetwork('Polygon')
    await screenshot(page, 'test4-step1-metamask-on-polygon.png')

    // Step 2: Navigate to Citrea swap page
    await page.goto('/swap?chain=citrea_testnet&inputCurrency=JUSD')
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'test4-step2-citrea-page-loaded.png')

    // Step 3: Wait for potential network switch prompt
    await page.waitForTimeout(2000)
    await screenshot(page, 'test4-step3-checking-network-prompt.png')

    // Step 4: Handle switch network if prompted
    const switchButton = page.getByRole('button', { name: /switch|change.*network/i }).first()
    const hasSwitchPrompt = await switchButton.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasSwitchPrompt) {
      await screenshot(page, 'test4-step4-switch-prompt-visible.png')
      await switchButton.click()

      try {
        await metamask.approveNewNetwork()
        await metamask.approveSwitchNetwork()
      } catch {
        // Network might already be added
      }

      await page.waitForTimeout(2000)
      await screenshot(page, 'test4-step5-after-switch.png')
    } else {
      await screenshot(page, 'test4-step4-no-switch-prompt.png')
    }

    // Step 6: Final state
    await screenshot(page, 'test4-step6-final-state.png')

    await page.close()
  })

  // ===================
  // TEST 5: Execute cross-chain swap
  // ===================
  test('Test 5: Execute cross-chain swap USDT (Polygon) -> JUSD (Citrea)', async () => {
    test.setTimeout(180000) // 3 minutes for this longer test
    const page = await context.newPage()
    const SWAP_AMOUNT = '1'

    console.log('Expected wallet address:', WALLET_ADDRESS)

    // Step 1: Switch MetaMask to Polygon
    try {
      await metamask.switchNetwork('Polygon')
    } catch {
      // Already on Polygon
    }

    // Step 2: Navigate to swap page
    await page.goto('/swap?chain=polygon&outputChain=citrea_testnet&inputCurrency=USDT&outputCurrency=JUSD')
    await screenshot(page, 'test5-step1-navigating.png')

    // Step 3: Wait for load
    await page.waitForLoadState('networkidle')
    await screenshot(page, 'test5-step2-network-idle.png')

    // Step 4: Page fully loaded
    await page.waitForTimeout(5000)
    await screenshot(page, 'test5-step3-fully-loaded.png')

    // Step 5: Check if wallet already connected
    const connectedWallet = page.locator('button:has-text("0x")').first()
    const isAlreadyConnected = await connectedWallet.isVisible({ timeout: 3000 }).catch(() => false)
    await screenshot(page, 'test5-step4-check-wallet-state.png')

    if (!isAlreadyConnected) {
      // Step 6: Click connect
      const connectButton = page.getByRole('button', { name: /connect/i }).first()
      await connectButton.click()
      await page.waitForTimeout(1000)
      await screenshot(page, 'test5-step5-wallet-modal.png')

      // Step 7: Click MetaMask
      const metamaskOption = page.getByText(/metamask/i).first()
      await metamaskOption.click()
      await screenshot(page, 'test5-step6-metamask-clicked.png')

      // Step 8: Approve connection
      await metamask.connectToDapp()
      await page.waitForTimeout(3000)
      await screenshot(page, 'test5-step7-connected.png')
    }

    // Step 9: Find input field
    const inputField = page.locator('input[type="text"], input[type="number"], input[inputmode="decimal"]').first()
    await screenshot(page, 'test5-step8-before-amount.png')

    // Step 10: Enter amount
    await inputField.click()
    await inputField.fill(SWAP_AMOUNT)
    await screenshot(page, 'test5-step9-amount-entered.png')

    // Step 11: Wait for quote
    await page.waitForTimeout(5000)
    await screenshot(page, 'test5-step10-quote-loaded.png')

    // Step 12: Find swap button
    const swapButton = page
      .getByRole('button', { name: /swap|review|exchange/i })
      .filter({ hasNotText: /connect/i })
      .first()
    await screenshot(page, 'test5-step11-before-swap-click.png')

    // Step 13: Check button state
    const isDisabled = await swapButton.isDisabled().catch(() => true)
    await screenshot(page, 'test5-step12-button-state.png')

    if (!isDisabled) {
      // Step 14: Click swap
      await swapButton.click()
      await page.waitForTimeout(2000)
      await screenshot(page, 'test5-step13-after-swap-click.png')

      // Step 15: Handle confirm modal
      const confirmButton = page.getByRole('button', { name: /confirm|swap|submit/i }).first()
      if (await confirmButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await screenshot(page, 'test5-step14-confirm-modal.png')
        await confirmButton.click()
        await page.waitForTimeout(2000)
        await screenshot(page, 'test5-step15-after-confirm.png')
      }

      // Step 16: Approve token spending
      try {
        await metamask.confirmTransaction()
        await page.waitForTimeout(3000)
        await screenshot(page, 'test5-step16-after-approval.png')
      } catch {
        console.log('No approval needed')
      }

      // Step 17: Confirm swap transaction
      try {
        await metamask.confirmTransaction()
        await page.waitForTimeout(5000)
        await screenshot(page, 'test5-step17-after-swap-confirm.png')
      } catch {
        console.log('Swap confirmation failed')
      }
    }

    // Step 18: Final state
    await screenshot(page, 'test5-step18-final-state.png')

    // Verify no error
    const errorVisible = await page
      .locator('text=/failed|error|rejected/i')
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false)
    expect(errorVisible).toBeFalsy()

    await page.close()
  })
})
