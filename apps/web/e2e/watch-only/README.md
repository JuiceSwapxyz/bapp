# Watch-only debugging harness

A reproducible setup for debugging the web app against the **live** Trading API with a **watch-only Rabby wallet** — no private keys, no signed transactions, no test fixtures.

Designed for the class of bug that:

- Only shows up with a real connected wallet (e.g. the swap-review screen)
- Depends on real Quote/Swap API responses, real token decimals, real routing
- Cannot be hit by the existing `apps/web/e2e/metamask/` suite, which uses a seeded test wallet against Anvil + mocked endpoints

## When to use this

- "Loading quote…" sticks forever for some token pair / amount and you need to see the actual `/v1/quote` and `/v1/swap` traffic
- A wallet balance / approval state on Citrea Mainnet matters and Anvil-fixtures don't reproduce it
- You want to drive the **same address** another user is reporting issues with — without holding their private key

## When NOT to use this

- For CI-stable test suites. The harness depends on the live backend; failures are not always reproducible.
- For anything that requires signing — watch-only addresses cannot.
- For tests that need to assert deterministic on-chain state — use Anvil fixtures instead.

## Why a separate Chrome

Stable Google Chrome 130+ **silently rejects `--load-extension`** in non-developer builds. The exact log line from Chrome is:

```
WARNING:chrome/browser/extensions/extension_service.cc] --load-extension is not allowed in Google Chrome, ignoring.
```

This harness uses **Chrome for Testing** (the variant Puppeteer ships with `puppeteer-core`), which still honours `--load-extension`. The binary lives under `~/.cache/puppeteer/chrome/mac_arm-<version>/chrome-mac-arm64/`.

`chrome-devtools-mcp` (Chrome DevTools MCP server) launches Chrome with `--disable-extensions` as a default Puppeteer arg and also filters `chrome-extension://` pages out of `list_pages`, so it cannot drive Rabby's UI directly. We attach **playwright-core via CDP** to a Chrome instance we launch ourselves.

## Prerequisites

- macOS arm64 (the scripts assume this; trivial to adapt)
- A working `puppeteer-core` install in the repo — it carries Chrome for Testing in its cache
- An on-chain address you want to *observe* — e.g. one from a bug report

A short-lived `chrome-rabby-profile` is created under `~/.cache/`. It is disposable; delete it to reset Rabby.

## Setup (one-time)

```bash
# 1. Make sure puppeteer cache has Chrome for Testing
yarn install

# 2. Fetch + extract the latest Rabby release
apps/web/e2e/watch-only/scripts/fetch-rabby.sh

# 3. Onboard Rabby (creates a throwaway HD wallet + adds your watch-only address)
WATCH_ADDR=0xYourAddressHere apps/web/e2e/watch-only/scripts/onboard.sh
```

`fetch-rabby.sh` downloads the Rabby release zip from GitHub and unpacks it to
`~/.cache/chrome-extensions/rabby/`. `onboard.sh` launches Chrome for Testing,
walks Rabby through its first-run flow, and adds your address as a watch-only
account. The profile persists at `~/.cache/chrome-rabby-profile`.

## Run a debug session

```bash
# Tab 1: dev server
yarn web dev    # serves on http://localhost:3001 (or 3000)

# Tab 2: launch Chrome for Testing with the prepared profile + Rabby
apps/web/e2e/watch-only/scripts/launch-chrome.sh

# Tab 3: drive Rabby + the app
node apps/web/e2e/watch-only/examples/swap-flow.mjs
```

The example navigates to the swap page, connects Rabby (auto-dismissing the
risk-warning popup), switches to Citrea Mainnet, types in an amount, clicks
Review, and dumps the submit-button label + a network log of the relevant
endpoints.

Use it as a template: copy `examples/swap-flow.mjs`, change the URL / amounts /
assertions for whatever bug you're chasing.

## How it works under the hood

| Layer | What it does | File |
|---|---|---|
| `launch-chrome.sh` | Starts Chrome for Testing with `--load-extension=…rabby` and `--remote-debugging-port=9223` against the persistent profile | `scripts/launch-chrome.sh` |
| `onboard.sh` | Resets `chrome.storage`, walks the welcome → create-seed → password → success flow, then jumps to `#/import/watch-address` and registers the watch-only address | `scripts/onboard.sh` |
| `helpers/rabby.mjs` | Reusable `connectOverCDP` + popup handlers (auto-click `Verbinden` / `Alle ignorieren` / `Bestätigen`) | `helpers/rabby.mjs` |
| Example | Imports the helpers, drives one user-visible flow, asserts on visible button text | `examples/swap-flow.mjs` |

## Caveats

- **Rabby's UI strings are locale-dependent.** The shipped scripts target the
  German UI (`Verbinden`, `Alle ignorieren`, `Bestätigen`) because Chrome
  inherits the system locale. If you're on a different system locale, replace
  the labels in `helpers/rabby.mjs` — there's a single map at the top.
- **The "Loading quote…" / "Approve and swap" labels** are i18n keys defined in
  `packages/uniswap/src/i18n/locales/source/en-US.json`. Your assertions
  should match whichever locale `Accept-Language` was using for the page.
- **Rate limits.** The live Quote API rate-limits aggressive polling.
  Don't loop your tests at >1Hz.
- **Watch-only signing.** Any `eth_sendTransaction` / `eth_signTypedData_v4`
  call from the page will be rejected by Rabby. That's the point — debugging
  ends one step before the wallet popup.
- **Chain switching.** Citrea Mainnet (chainId 4114) is not in the default
  wallet's chain list. The example calls
  `window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x1012' }] })`
  after connect; Rabby's popup auto-accepts it via the helper.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `--load-extension is not allowed in Google Chrome, ignoring.` in stderr | You're using stable Chrome, not Chrome for Testing | Run `launch-chrome.sh` which picks the puppeteer binary, not `/Applications/Google Chrome.app` |
| Rabby modal in the app only shows WalletConnect + Coinbase | The page loaded before Rabby announced via EIP-6963 | Hard-reload the page after Rabby loads; the dispatched `eip6963:announceProvider` events are not buffered |
| Connection popup hangs at "Bitte bearbeiten Sie zuerst den Risiko-Hinweis" | Rabby's risk-warning row was not dismissed | The helper clicks `Alle ignorieren` before `Verbinden`; check that label is correct for your locale |
| `window.ethereum` is undefined when probed via `chrome-devtools-mcp` | MCP runs scripts in the isolated world; injected providers live in the main world | Probe via `playwright-core` `page.evaluate(…)` instead — it executes in the main world |
| `[ ]` returned from `/json/list` on port 9223 | Chrome for Testing has no open tabs; the harness needs at least one | Open one with `curl -X PUT "http://localhost:9223/json/new?http://localhost:3001/"` or use `playwright` to create it |
