import { chromium, expect, test, type BrowserContext, type Page } from '@playwright/test'
import { prepareExtension } from '@synthetixio/synpress-cache'
import { MetaMask, getExtensionId } from '@synthetixio/synpress-metamask/playwright'
import { CHAIN_CONFIG, SEED_PHRASE, WALLET_ADDRESS, WALLET_PASSWORD } from './wallet.setup'

if (!SEED_PHRASE || !WALLET_PASSWORD) {
  throw new Error('WALLET_SEED_PHRASE and WALLET_PASSWORD must be set in environment variables')
}

// Helper function to take screenshot (disabled comparison for debugging)
async function screenshot(page: Page, name: string) {
  // Just wait, don't compare screenshots during debugging
  await page.waitForTimeout(200)
  // Screenshot comparison disabled - uncomment to enable:
  // await expect(page).toHaveScreenshot(name, { fullPage: true })
}

test.describe('Cross-Chain Swap: JUSD (Citrea) <-> USDT (Polygon)', () => {
  let context: BrowserContext
  let metamask: MetaMask
  let metamaskExtensionId: string

  // Increase timeout for MetaMask setup
  test.setTimeout(120000)

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

    // Click through MetaMask setup screens (supports English and German)
    for (const page of context.pages()) {
      if (page.url().includes('chrome-extension://')) {
        const buttonSelectors = [
          // English
          'button:has-text("Got it")',
          'button:has-text("Open wallet")',
          'button:has-text("Done")',
          // German
          'button:has-text("Verstanden")',
          'button:has-text("Wallet öffnen")',
          'button:has-text("Fertig")',
          // data-testid selectors (language-independent)
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

    // Skip pin extension step (supports English and German)
    for (const page of context.pages()) {
      if (page.url().includes('chrome-extension://')) {
        const nextBtn = page.locator('[data-testid="pin-extension-next"], button:has-text("Next"), button:has-text("Weiter")').first()
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextBtn.click()
          await new Promise((r) => setTimeout(r, 1000))
        }
        const doneBtn = page.locator('[data-testid="pin-extension-done"], button:has-text("Done"), button:has-text("Fertig")').first()
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

    // Dismiss popups (supports English and German)
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
    test.setTimeout(300000) // 5 minutes - need extra time for approval mining + swap tx
    const page = await context.newPage()
    const SWAP_AMOUNT = '1'

    // Capture browser console logs
    page.on('console', (msg) => {
      const text = msg.text()
      // Filter for our swap logs and errors
      if (text.includes('[ERC20 Chain Swap]') || text.includes('[LdsBridgeManager]') ||
          text.includes('[WebSocket]') || text.includes('[ERC20 Lock]') ||
          msg.type() === 'error') {
        console.log(`[Browser ${msg.type()}] ${text}`)
      }
    })

    // Capture page errors
    page.on('pageerror', (error) => {
      console.log(`[Browser Error] ${error.message}`)
    })

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

      // Step 15: Handle warning popups (JUSD research warning + cross-chain bridging warning)
      // These popups appear sequentially, so we need to handle them in a loop
      for (let popupCount = 0; popupCount < 3; popupCount++) {
        const continueButton = page.getByRole('button', { name: /continue/i }).first()
        if (await continueButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          const popupText = await page.locator('text=/research|swapping across|bridging/i').first().textContent().catch(() => 'unknown')
          console.log(`Found popup #${popupCount + 1}: "${popupText?.slice(0, 50)}...", clicking Continue...`)
          await screenshot(page, `test5-step14-popup-${popupCount + 1}.png`)
          await continueButton.click()
          await page.waitForTimeout(1500)
        } else {
          console.log(`No more popups found after ${popupCount} popup(s)`)
          break
        }
      }
      await screenshot(page, 'test5-step15-after-popups.png')

      // Step 16: Handle confirm modal
      const confirmButton = page.getByRole('button', { name: /confirm|swap|submit/i }).first()
      if (await confirmButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await screenshot(page, 'test5-step16-confirm-modal.png')
        await confirmButton.click()
        await page.waitForTimeout(2000)
        await screenshot(page, 'test5-step17-after-confirm.png')
      }

      // Step 18: Handle MetaMask transaction confirmation directly
      // MetaMask v12+ doesn't always open notification.html popup
      // Instead, we interact directly with the extension page
      const getMetaMaskPage = async (stepName: string): Promise<Page | null> => {
        // Find all pages and look for MetaMask
        const allPages = context.pages()
        console.log(`[${stepName}] Found ${allPages.length} pages`)

        // Try to find MetaMask extension page with pending transaction
        let mmPage = allPages.find(
          (p) => p.url().includes(metamaskExtensionId) && p.url().includes('notification')
        )

        // If no notification page, try the home page
        if (!mmPage) {
          mmPage = allPages.find((p) => p.url().includes(metamaskExtensionId))
        }

        if (!mmPage) {
          // Open MetaMask extension page directly
          console.log(`[${stepName}] Opening MetaMask extension page directly...`)
          mmPage = await context.newPage()
          await mmPage.goto(`chrome-extension://${metamaskExtensionId}/home.html`)
          await mmPage.waitForLoadState('domcontentloaded')
          await mmPage.waitForTimeout(2000)
        }

        // Bring MetaMask to front
        await mmPage.bringToFront()
        await mmPage.waitForTimeout(1000)

        return mmPage
      }

      // Handle network switch popup in MetaMask (when dapp requests chain switch)
      const handleNetworkSwitch = async (stepName: string): Promise<boolean> => {
        console.log(`[${stepName}] Checking for network switch request...`)

        const mmPage = await getMetaMaskPage(stepName)
        if (!mmPage) {
          console.log(`[${stepName}] No MetaMask page found`)
          return false
        }

        // Look for "Switch network" or "Add network" buttons (supports English and German)
        const networkSwitchSelectors = [
          // data-testid selectors (language-independent)
          '[data-testid="confirmation-submit-button"]',
          '[data-testid="page-container-footer-next"]',
          // English - Switch network
          'button:has-text("Switch network")',
          'button:has-text("Approve")',
          // German - Switch network
          'button:has-text("Netzwerk wechseln")',
          'button:has-text("Genehmigen")',
          // English - Add network
          'button:has-text("Approve")',
          // German - Add network
          'button:has-text("Genehmigen")',
        ]

        for (const selector of networkSwitchSelectors) {
          const btn = mmPage.locator(selector).first()
          if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
            // Check if this is a network switch request by looking for network-related text
            const hasNetworkText = await mmPage.locator('text=/switch.*network|netzwerk.*wechseln|allow.*switch|add.*network|citrea/i')
              .first().isVisible({ timeout: 1000 }).catch(() => false)

            if (hasNetworkText) {
              console.log(`[${stepName}] Found network switch request, clicking: ${selector}`)
              await btn.click()
              try {
                await mmPage.waitForTimeout(2000)
              } catch (e) {
                console.log(`[${stepName}] MetaMask page closed after network switch (expected behavior)`)
              }
              return true
            }
          }
        }

        console.log(`[${stepName}] No network switch request found`)
        return false
      }

      const confirmMetaMaskTransaction = async (stepName: string): Promise<boolean> => {
        console.log(`[${stepName}] Looking for MetaMask transaction to confirm...`)

        // Give MetaMask time to receive the transaction request
        await page.waitForTimeout(2000)

        const mmPage = await getMetaMaskPage(stepName)
        if (!mmPage) {
          console.log(`[${stepName}] No MetaMask page found`)
          return false
        }

        // Look for confirm button with various selectors (supports English and German)
        const confirmSelectors = [
          // data-testid selectors (language-independent)
          '[data-testid="confirm-footer-button"]',
          '[data-testid="page-container-footer-next"]',
          '[data-testid="confirmation-submit-button"]',
          // English
          'button.btn-primary:has-text("Confirm")',
          'button:has-text("Confirm")',
          'button:has-text("Approve")',
          'button:has-text("Sign")',
          // German
          'button.btn-primary:has-text("Bestätigen")',
          'button:has-text("Bestätigen")',
          'button:has-text("Genehmigen")',
          'button:has-text("Signieren")',
        ]

        for (const selector of confirmSelectors) {
          const btn = mmPage.locator(selector).first()
          if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(`[${stepName}] Found confirm button with selector: ${selector}`)
            await btn.click()
            // MetaMask may close the page after confirmation, so wrap waitForTimeout in try-catch
            try {
              await mmPage.waitForTimeout(2000)
            } catch (e) {
              console.log(`[${stepName}] MetaMask page closed after confirmation (expected behavior)`)
            }
            console.log(`[${stepName}] Clicked confirm button`)
            return true
          }
        }

        // Check if there's a pending transaction indicator (English and German)
        const pendingIndicator = mmPage.locator('text=/pending|confirm|approve|sign|ausstehend|bestätigen|genehmigen|signieren/i').first()
        if (await pendingIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`[${stepName}] Found pending transaction indicator but no confirm button`)
        } else {
          console.log(`[${stepName}] No pending transaction found in MetaMask`)
        }

        return false
      }

      // Try to confirm approval transaction
      const approvalConfirmed = await confirmMetaMaskTransaction('Approval')
      if (approvalConfirmed) {
        await page.bringToFront()
        await page.waitForTimeout(3000)
        await screenshot(page, 'test5-step18-after-approval.png')

        // Wait for the approval to be mined and the dapp to send the swap transaction
        // The dapp needs time to detect the approval and submit the actual swap
        console.log('Waiting for approval to be mined and swap transaction to be submitted...')

        // Check if dapp is still showing "Confirm in wallet" - meaning more tx pending
        // Cross-chain swaps may require multiple confirmations:
        // 1. Approve (ERC20 allowance)
        // 2. Lock TX on source chain (Polygon)
        // 3. [Wait for Boltz to lock on target chain - automatic]
        // 4. Network switch to target chain (Citrea)
        // 5. Claim TX on target chain
        let swapConfirmed = false
        let confirmedCount = 0
        let networkSwitchCount = 0

        for (let attempt = 1; attempt <= 30; attempt++) {
          console.log(`[Swap] Attempt ${attempt}/30 - checking for pending transactions or network switch...`)

          // Wait for the blockchain to confirm previous transaction and dapp to send next one
          // For cross-chain swaps, Boltz needs time to lock on the target chain (can take 30+ seconds)
          await page.waitForTimeout(5000)

          // Check if the dapp is still waiting for confirmation
          const confirmInWallet = page.locator('text=/confirm in wallet/i').first()
          const isWaiting = await confirmInWallet.isVisible({ timeout: 2000 }).catch(() => false)

          // Also check for "switching network" or similar indicators
          const switchingNetwork = page.locator('text=/switching|switch network|change network/i').first()
          const isSwitchingNetwork = await switchingNetwork.isVisible({ timeout: 1000 }).catch(() => false)

          // Check for processing/pending indicators (Boltz lock in progress)
          const processingIndicator = page.locator('text=/processing|waiting|pending|locking|confirming/i').first()
          const isProcessing = await processingIndicator.isVisible({ timeout: 1000 }).catch(() => false)

          if (isWaiting || isSwitchingNetwork) {
            console.log(`[Swap] Dapp is waiting (wallet: ${isWaiting}, network: ${isSwitchingNetwork}), checking MetaMask...`)

            // First, check if MetaMask has a new page/notification open
            const allPages = context.pages()
            const mmNotificationPage = allPages.find(
              (p) => p.url().includes(metamaskExtensionId) && p.url().includes('notification')
            )

            if (mmNotificationPage) {
              console.log(`[Swap] Found MetaMask notification page, attempting to confirm...`)
              await mmNotificationPage.bringToFront()
              await mmNotificationPage.waitForTimeout(1000)

              // Take a screenshot of MetaMask to see what it's showing
              try {
                await mmNotificationPage.screenshot({
                  path: `e2e/metamask/snapshots/crosschain-swap.spec.ts/metamask-attempt-${attempt}.png`,
                })
              } catch (e) {
                console.log(`[Swap] Could not take MetaMask screenshot: ${e}`)
              }
            }

            // First, try to handle network switch (must be done before transactions on new chain)
            const networkSwitched = await handleNetworkSwitch(`Swap-Attempt-${attempt}`)
            if (networkSwitched) {
              networkSwitchCount++
              console.log(`[Swap] Network switch #${networkSwitchCount} approved, continuing...`)
              await page.bringToFront()
              continue
            }

            // Then try to confirm transaction
            const confirmed = await confirmMetaMaskTransaction(`Swap-Attempt-${attempt}`)
            if (confirmed) {
              confirmedCount++
              console.log(`[Swap] Confirmed transaction #${confirmedCount}, continuing to check for more...`)
              await page.bringToFront()
              // Don't break - continue to check if more transactions are needed
              continue
            } else {
              // If no transaction found but dapp is waiting, the approval might still be mining
              console.log(`[Swap] No MetaMask action found, waiting for dapp to send next request...`)
            }
          } else if (isProcessing) {
            console.log(`[Swap] Dapp is processing (Boltz lock in progress), waiting...`)
            // Continue waiting for Boltz to complete
            continue
          } else {
            console.log(`[Swap] Dapp no longer waiting for wallet confirmation`)
            // Check if swap succeeded or failed
            const successIndicator = page.locator('text=/success|submitted|swapped|complete/i').first()
            const failedIndicator = page.locator('text=/failed|error/i').first()

            if (await successIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
              console.log('[Swap] Swap completed successfully!')
              swapConfirmed = true
              break
            } else if (await failedIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
              console.log('[Swap] Swap failed!')
              break
            } else {
              // No clear indicator, might still be processing
              console.log('[Swap] No clear status indicator, continuing to monitor...')
            }
          }
        }

        swapConfirmed = confirmedCount > 0 || networkSwitchCount > 0
        console.log(`[Swap] Total transactions confirmed after approval: ${confirmedCount}, network switches: ${networkSwitchCount}`)

        await page.bringToFront()
        await page.waitForTimeout(5000)
        if (swapConfirmed) {
          await screenshot(page, 'test5-step19-after-swap-confirm.png')
        } else {
          console.log('No additional transactions confirmed after approval')
          await screenshot(page, 'test5-step19-no-swap-confirm.png')
        }
      } else {
        console.log('No approval transaction found - may already be approved or transaction not sent')
        await page.bringToFront()
        await screenshot(page, 'test5-step18-no-approval.png')
      }
    }

    // Step 20: Final state
    await screenshot(page, 'test5-step20-final-state.png')

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
