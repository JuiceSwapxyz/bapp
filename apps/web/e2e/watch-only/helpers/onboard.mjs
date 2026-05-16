// Walk a fresh Rabby installation through its first-run flow and register the
// caller-provided watch-only address.
//
// Reads:
//   WATCH_ADDR   required, the address to add (0x…)
//   PASSWORD     optional, defaults to TestPass123!
//   DEBUG_PORT   optional, defaults to 9223
//
// Idempotency: if Rabby is already past the welcome screens (e.g. you ran this
// before), the script jumps straight to #/import/watch-address and just adds
// the address. Re-running with the same address is a no-op (Rabby refuses
// duplicates but the navigation still succeeds).

import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolve playwright-core relative to this file, not the caller's CWD.
const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const playwrightCore = require(path.resolve(__dirname, '../../../../../node_modules/playwright-core'))
const { chromium } = playwrightCore

const WATCH_ADDR = process.env.WATCH_ADDR
const PASSWORD = process.env.PASSWORD ?? 'TestPass123!'
const DEBUG_PORT = process.env.DEBUG_PORT ?? '9223'
const RABBY_ID = 'acmacodkjbdgmoleebolmdjonilkdbch'

if (!WATCH_ADDR || !/^0x[a-fA-F0-9]{40}$/.test(WATCH_ADDR)) {
  console.error('ERROR: WATCH_ADDR env must be a 0x-prefixed 40-hex address')
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.connectOverCDP(`http://localhost:${DEBUG_PORT}`)
const ctx = browser.contexts()[0]

let page = ctx.pages().find((p) => p.url().includes(RABBY_ID) && !p.url().includes('offscreen'))
if (!page) {
  page = await ctx.newPage()
  await page.goto(`chrome-extension://${RABBY_ID}/index.html#/welcome`, { waitUntil: 'domcontentloaded' })
}
await page.bringToFront()

const clickByText = async (label) => {
  const loc = page.locator(`text="${label}"`).first()
  if ((await loc.count()) === 0) return false
  try {
    await loc.click({ force: true, timeout: 3000 })
    return true
  } catch {
    return false
  }
}

// Detect whether Rabby is already past initial setup
const isSetUp = async () => {
  const result = await page.evaluate(
    () => new Promise((res) => chrome.storage.local.get(['keyringState'], (r) => res(!!r.keyringState))),
  )
  return result
}

if (!(await isSetUp())) {
  console.log('Rabby is fresh — running first-time setup')

  // Reset to a known starting point
  await page.evaluate(
    async () => await new Promise((r) => chrome.storage.local.clear(() => chrome.storage.session.clear(() => r()))),
  )
  await page.goto(`chrome-extension://${RABBY_ID}/index.html#/new-user/guide`, { waitUntil: 'domcontentloaded' })
  await sleep(2000)

  // The first-time guide insists on a seed-bearing first wallet; create a throwaway HD wallet.
  // It only exists in this disposable profile and never sees real value.
  if (!(await clickByText('Erstellen Sie eine neue Adresse'))) {
    if (!(await clickByText('Create a new address'))) {
      throw new Error('could not find "Create new address" button — wrong locale?')
    }
  }
  await sleep(2000)

  // Set the password (used to unlock the keystore on each session; we keep it predictable)
  const pwInputs = await page.$$('input[type=password]')
  for (const inp of pwInputs) {
    await inp.fill(PASSWORD)
  }
  await sleep(500)
  if (!(await clickByText('Bestätigen')) && !(await clickByText('Confirm'))) {
    throw new Error('could not find password Confirm button')
  }
  await sleep(2500)

  console.log('✓ throwaway HD wallet created')
}

// Add the watch-only address
console.log(`Adding watch-only address ${WATCH_ADDR}`)
await page.goto(`chrome-extension://${RABBY_ID}/index.html#/import/watch-address`, { waitUntil: 'domcontentloaded' })
await sleep(2000)

const addrInputs = await page.$$('input[type=text], textarea')
if (addrInputs.length === 0) {
  throw new Error('watch-address page has no text input — Rabby UI changed?')
}
await addrInputs[0].fill(WATCH_ADDR)
await sleep(800)

if (!(await clickByText('Bestätigen')) && !(await clickByText('Confirm'))) {
  throw new Error('could not find Confirm button on watch-address page')
}
await sleep(2500)

const finalText = await page.evaluate(() => document.body.innerText)
if (/erfolgreich|added|hinzugefügt|success/i.test(finalText)) {
  console.log('✓ watch-only address added')
} else {
  console.warn('⚠ Rabby did not confirm success. Last page text:')
  console.warn(finalText.replace(/\s+/g, ' ').slice(0, 400))
}

await browser.close().catch(() => {})
