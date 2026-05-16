// Reproduces the "Loading quote… sticks forever" investigation we used to
// pin down the Satsuma routing bug fixed in PR #752.
//
// Behaviour: connects Rabby, switches to Citrea Mainnet, drives the swap form
// at a list of input amounts, opens Review, and dumps the submit-button text
// plus a count of `/v1/swap` calls.
//
// Usage:
//   yarn web dev                                                # in a separate terminal
//   apps/web/e2e/watch-only/scripts/launch-chrome.sh            # one-shot
//   node apps/web/e2e/watch-only/examples/swap-flow.mjs

import {
  attach,
  autoApproveRabbyPopups,
  connectRabby,
  recordRequests,
  switchChain,
  walletState,
} from '../helpers/rabby.mjs'

const APP_PREFIX = process.env.APP_PREFIX ?? 'http://localhost:3001'
const CITREA_MAINNET_HEX = '0x1012' // 4114

// USDC.e/ctUSD on Citrea Mainnet — the pair where the original bug was reported.
const CTUSD = '0x8D82c4E3c936C7B5724A382a9c5a4E6Eb7aB6d5D'
const USDC_E = '0xE045e6c36cF77FAA2CfB54466D71A3aEF7bbE839'

const AMOUNTS = process.env.AMOUNTS?.split(',') ?? ['100', '1000', '10000', '50000']

const swapUrl = (inputCurrency, outputCurrency) =>
  `${APP_PREFIX}/swap?chain=citrea_mainnet&inputCurrency=${inputCurrency}&outputCurrency=${outputCurrency}`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const { browser, ctx, app: existingApp } = await attach({ appUrlPrefix: APP_PREFIX })
const app = existingApp ?? (await ctx.newPage())
await app.bringToFront()

autoApproveRabbyPopups(ctx)

// First-time landing
await app.goto(swapUrl(CTUSD, USDC_E), { waitUntil: 'domcontentloaded' })
await sleep(3000)

const accountState = await walletState(app)
if (!accountState.accounts?.length) {
  console.log('Wallet not connected yet, attempting connect…')
  if (!(await connectRabby(app))) {
    console.error('ERROR: Rabby not found in the wallet modal — did you onboard Rabby?')
    process.exit(1)
  }
  await sleep(4000)
}

if ((await walletState(app)).chainId !== CITREA_MAINNET_HEX) {
  console.log('Switching to Citrea Mainnet…')
  await switchChain(app, CITREA_MAINNET_HEX)
}

const final = await walletState(app)
console.log(`Connected: ${final.accounts?.[0]}  chainId=${final.chainId}`)
console.log()

// Sweep amounts
const swapRequests = recordRequests(app, '/v1/swap')

for (const amount of AMOUNTS) {
  await app.goto(swapUrl(CTUSD, USDC_E), { waitUntil: 'domcontentloaded' })
  await sleep(3000)

  const inputs = await app.$$('input')
  if (inputs.length === 0) {
    console.log(`[${amount}]  no inputs on the page — skipping`)
    continue
  }
  await inputs[0].fill(amount)
  await sleep(4000)

  const reviewBtn = app.locator('button[data-testid="review-swap"]').first()
  const reviewText = (await reviewBtn.innerText().catch(() => '?')).replace(/\s+/g, ' ').trim()

  await reviewBtn.click({ force: true }).catch(() => {})
  await sleep(5000)

  const result = await app.evaluate(() => {
    const t = document.body.innerText
    return {
      loadingQuote: t.includes('Loading quote'),
      approveAndSwap: /Approve and [sS]wap/.test(t),
      submit: Array.from(document.querySelectorAll('button'))
        .map((b) => (b.innerText || '').replace(/\s+/g, ' ').trim())
        .find((s) => /Approve|Loading|Acknowledge|Swap|quote|Insufficient/.test(s)),
    }
  })
  const stuck = result.loadingQuote && !result.approveAndSwap
  console.log(
    `[${amount.padStart(8)}]  review="${reviewText.slice(0, 18)}"  submit="${(result.submit || '?').slice(0, 40)}"  ${stuck ? '❌ STUCK' : '✓'}`,
  )
}

console.log()
console.log(`/v1/swap calls observed: ${swapRequests.calls.length}`)
swapRequests.dispose()

await browser.close().catch(() => {})
