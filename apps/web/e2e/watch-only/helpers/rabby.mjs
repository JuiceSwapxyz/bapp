// Helpers for driving Rabby + the JuiceSwap dApp via playwright-core over CDP.
//
// Imported by the example scripts under apps/web/e2e/watch-only/examples/.

import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolve playwright-core relative to this file, not the caller's CWD —
// scripts that source these helpers can run from any directory.
const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const playwrightCore = require(path.resolve(__dirname, '../../../../../node_modules/playwright-core'))
const { chromium } = playwrightCore

export const RABBY_ID = 'acmacodkjbdgmoleebolmdjonilkdbch'

// German UI labels — Chrome for Testing inherits the system locale and the
// onboarding scripts ran in DE. If you're on a different locale, swap these.
export const LABELS = {
  connect: 'Verbinden',
  cancel: 'Abbrechen',
  confirm: 'Bestätigen',
  ignoreRiskWarning: 'Alle ignorieren',
  switchChain: 'Wechseln',
  allow: 'Erlauben',
  done: 'Erledigt',
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Connect to a running Chrome for Testing instance on the given CDP port.
 * Returns { browser, ctx, app } where `app` is the first localhost page.
 */
export async function attach({ port = '9223', appUrlPrefix = 'http://localhost:3001' } = {}) {
  const browser = await chromium.connectOverCDP(`http://localhost:${port}`)
  const ctx = browser.contexts()[0]
  const app = ctx.pages().find((p) => p.url().startsWith(appUrlPrefix))
  return { browser, ctx, app: app ?? null }
}

/**
 * Install a context-level page listener that auto-handles Rabby notification
 * popups (the small popups Rabby spawns for connect / chain-switch / sign).
 *
 * The handler:
 *   1. dismisses the risk-warning row ("Alle ignorieren") if present
 *   2. clicks the primary confirm button ("Verbinden", "Wechseln", "Bestätigen", …)
 *
 * Returns a disposer; call it to remove the listener.
 */
export function autoApproveRabbyPopups(ctx, { labels = LABELS, log = console.log } = {}) {
  const handler = async (popup) => {
    if (!popup.url().includes(RABBY_ID) || !popup.url().includes('notification')) return
    try {
      await popup.waitForLoadState('domcontentloaded')
    } catch {}
    await sleep(1200)

    const tryClick = async (text) => {
      const loc = popup.locator(`text="${text}"`).first()
      if ((await loc.count()) === 0) return false
      try {
        await loc.click({ force: true, timeout: 2000 })
        log(`  ✓ popup: ${text}`)
        return true
      } catch {
        return false
      }
    }

    // Dismiss any risk warnings first; some popups gate the primary action on this.
    await tryClick(labels.ignoreRiskWarning)
    await sleep(500)

    // Click the first matching primary action.
    for (const candidate of [labels.connect, labels.switchChain, labels.confirm, labels.allow]) {
      if (await tryClick(candidate)) break
    }
  }
  ctx.on('page', handler)
  return () => ctx.off('page', handler)
}

/**
 * Click the dApp's "Connect wallet" button and pick Rabby from the wallet modal.
 * Returns true when Rabby is in the modal and was clicked.
 */
export async function connectRabby(app) {
  await app.locator('button[data-testid="navbar-connect-wallet"]').first().click({ force: true })
  await sleep(1500)
  const rabbyOption = app.locator('text=/Rabby/').first()
  if ((await rabbyOption.count()) === 0) return false
  await rabbyOption.click({ force: true })
  return true
}

/**
 * Ask the connected wallet to switch chains. Pair with `autoApproveRabbyPopups`
 * to dismiss the chain-switch popup automatically.
 *
 * Returns the resulting chainId hex.
 */
export async function switchChain(app, chainIdHex) {
  await app.evaluate(async (hex) => {
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hex }] })
    } catch (e) {
      return 'err: ' + e.message
    }
    return 'ok'
  }, chainIdHex)
  await sleep(3000)
  return app.evaluate(() => window.ethereum?.chainId)
}

/**
 * Convenience: return the connected accounts and chainId.
 */
export async function walletState(app) {
  return await app.evaluate(async () => ({
    accounts: await window.ethereum?.request?.({ method: 'eth_accounts' }).catch(() => []),
    chainId: window.ethereum?.chainId,
  }))
}

/**
 * Record every request and matching response to a URL substring. Returns a
 * { calls, dispose } pair. Useful for asserting "did /v1/swap fire?".
 */
export function recordRequests(app, urlSubstring) {
  const calls = []
  const onReq = (req) => {
    if (req.url().includes(urlSubstring)) {
      calls.push({ req, response: null, at: Date.now() })
    }
  }
  const onResp = async (resp) => {
    if (!resp.url().includes(urlSubstring)) return
    const entry = calls.find((c) => c.req === resp.request() && !c.response)
    if (entry) {
      entry.response = { status: resp.status(), body: await resp.text().catch(() => null) }
    }
  }
  app.on('request', onReq)
  app.on('response', onResp)
  return {
    calls,
    dispose: () => {
      app.off('request', onReq)
      app.off('response', onResp)
    },
  }
}
