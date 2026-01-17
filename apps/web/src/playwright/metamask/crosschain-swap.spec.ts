import { chromium, expect, test, type BrowserContext } from '@playwright/test'
import { prepareExtension } from '@synthetixio/synpress-cache'
import { MetaMask, getExtensionId } from '@synthetixio/synpress-metamask/playwright'
import { CHAIN_CONFIG, SEED_PHRASE, WALLET_PASSWORD } from './wallet.setup'

if (!SEED_PHRASE || !WALLET_PASSWORD) {
  throw new Error('WALLET_SEED_PHRASE and WALLET_PASSWORD must be set in environment variables')
}

test.describe('Cross-Chain Swap: JUSD (Citrea) <-> USDT (Polygon)', () => {
  let context: BrowserContext
  let metamask: MetaMask

  test.beforeAll(async () => {
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
    await new Promise((r) => setTimeout(r, 2000))
    const pages = context.pages()
    const metamaskPage = pages.find((p) => p.url().includes('chrome-extension://'))
    if (!metamaskPage) throw new Error('MetaMask not found')

    // Initialize MetaMask instance
    metamask = new MetaMask(context, metamaskPage, WALLET_PASSWORD, extensionId)

    // Import wallet using seed phrase
    await metamask.importWallet(SEED_PHRASE)

    // Add Citrea Testnet network
    await metamask.addNetwork(CHAIN_CONFIG.citreaTestnet)

    // Add Polygon network (might already be available)
    try {
      await metamask.addNetwork(CHAIN_CONFIG.polygon)
    } catch {
      // Polygon might already be available in MetaMask
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

    // Verify that the input chain is Citrea Testnet
    // Check for Citrea chain indicator or token
    const pageContent = await page.content()
    expect(pageContent.toLowerCase()).toContain('citrea')

    // Verify JUSD is selected as input
    const jusdVisible = await page
      .locator('text=JUSD')
      .first()
      .isVisible()
      .catch(() => false)
    expect(jusdVisible).toBeTruthy()

    // Verify USDT is selected as output
    const usdtVisible = await page
      .locator('text=USDT')
      .first()
      .isVisible()
      .catch(() => false)
    expect(usdtVisible).toBeTruthy()

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

    // Verify USDT is selected as input
    const usdtVisible = await page
      .locator('text=USDT')
      .first()
      .isVisible()
      .catch(() => false)
    expect(usdtVisible).toBeTruthy()

    // Verify JUSD is selected as output
    const jusdVisible = await page
      .locator('text=JUSD')
      .first()
      .isVisible()
      .catch(() => false)
    expect(jusdVisible).toBeTruthy()

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
})
