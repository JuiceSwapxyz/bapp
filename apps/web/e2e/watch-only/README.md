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

## Platform support

**Tier 1 (tested):** macOS arm64.

The launch script picks a Chrome for Testing build from `~/.cache/puppeteer/chrome/mac_arm-*/chrome-mac-arm64/Google Chrome for Testing.app/…`. For other platforms you need to change:

- `scripts/launch-chrome.sh` — the `mac_arm-*` glob and the `chrome-mac-arm64` subdirectory
- Possibly the binary name (`Google Chrome for Testing` vs `chrome` vs `chrome.exe`)

Everything else (Rabby unpack, profile layout, helpers) is platform-independent. PRs welcome.

## Prerequisites

System tools — install once:

```bash
# macOS
brew install gh node     # gh is needed by fetch-rabby.sh, node for everything
xcode-select --install   # for unzip + dev tools (usually already present)
```

Repo tooling:

```bash
yarn install             # MUST succeed — populates ~/.cache/puppeteer/chrome
```

If `~/.cache/puppeteer/chrome/mac_arm-*` is empty after `yarn install`, puppeteer skipped its postinstall. Re-run with `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=` (no value) explicitly, or trigger a manual download:

```bash
node -e "require('puppeteer-core/internal/node/Browser').install({ browser: 'chrome' })"
```

GitHub auth (for `fetch-rabby.sh`):

```bash
gh auth status           # if not authenticated:
gh auth login
```

A short-lived `chrome-rabby-profile` is created under `~/.cache/`. It is disposable; delete it to reset Rabby (see [Reset / cleanup](#reset--cleanup)).

## Why a separate Chrome

Stable Google Chrome 130+ **silently rejects `--load-extension`** in non-developer builds. The exact log line from Chrome is:

```
WARNING:chrome/browser/extensions/extension_service.cc] --load-extension is not allowed in Google Chrome, ignoring.
```

This harness uses **Chrome for Testing** (the variant Puppeteer ships with `puppeteer-core`), which still honours `--load-extension`. The binary lives under `~/.cache/puppeteer/chrome/mac_arm-<version>/chrome-mac-arm64/`.

`chrome-devtools-mcp` (Chrome DevTools MCP server) launches Chrome with `--disable-extensions` as a default Puppeteer arg and also filters `chrome-extension://` pages out of `list_pages`, so it cannot drive Rabby's UI directly. We attach **playwright-core via CDP** to a Chrome instance we launch ourselves.

## The Rabby extension ID

You'll see `acmacodkjbdgmoleebolmdjonilkdbch` hardcoded in the helpers. That's the Chrome Web Store ID for Rabby Wallet — every signed Chrome extension has one, derived from the developer's public key in the manifest. You can verify the same ID at <https://chromewebstore.google.com/detail/rabby-wallet/acmacodkjbdgmoleebolmdjonilkdbch>.

The unsigned `.zip` from GitHub releases ships the same `key` field in its manifest, so when loaded unpacked it ends up at the same extension ID. That's why `chrome.storage.local` and Rabby's internal URLs are stable across re-installs.

## First-time setup (copy-paste-able)

Three commands, from the repo root:

```bash
# 1. Make sure puppeteer cache has Chrome for Testing
yarn install

# 2. Fetch + extract the latest Rabby release into ~/.cache/chrome-extensions/rabby/
apps/web/e2e/watch-only/scripts/fetch-rabby.sh
# Expected last line: ✓ Rabby unpacked at /Users/<you>/.cache/chrome-extensions/rabby
#                     Version: 0.93.x

# 3. Onboard Rabby (creates a throwaway HD wallet + adds your watch-only address)
WATCH_ADDR=0xYourAddressHere apps/web/e2e/watch-only/scripts/onboard.sh
# Expected last line: ✓ watch-only address added
```

What `onboard.sh` does:

- launches Chrome for Testing if it isn't already up
- opens Rabby's welcome page
- clears `chrome.storage.local` to guarantee a clean first-run
- creates a throwaway HD wallet (the seed phrase never leaves the disposable profile)
- sets a predictable password (`TestPass123!`, override via `PASSWORD=…`)
- jumps to `#/import/watch-address` and adds your address

> **Why a throwaway HD wallet?** Rabby's first-run flow refuses to proceed without a "real" first account. Watch-only is only available *after* a seed/private-key/hardware wallet exists. The throwaway wallet exists only in `~/.cache/chrome-rabby-profile/` and has no balance anywhere; we never touch it again.

After step 3, both wallets are visible in Rabby. The watch-only one is selected by default when the dApp calls `eth_requestAccounts` (the order it was added in).

## Run a debug session

```bash
# Tab 1: dev server
yarn web dev    # serves on http://localhost:3001 (or 3000)

# Tab 2: launch Chrome for Testing with the prepared profile + Rabby
apps/web/e2e/watch-only/scripts/launch-chrome.sh
# Expected: ✓ CDP up at http://localhost:9223

# Tab 3: drive Rabby + the app
node apps/web/e2e/watch-only/examples/swap-flow.mjs
```

The example navigates to the swap page, connects Rabby (auto-dismissing the
risk-warning popup), switches to Citrea Mainnet, types in an amount, clicks
Review, and dumps the submit-button label + a network log of the relevant
endpoints.

Use it as a template: copy `examples/swap-flow.mjs`, change the URL / amounts /
assertions for whatever bug you're chasing.

## What you should see

On a successful first run, a Chrome for Testing window opens (yellow Chrome-for-Testing logo, not the regular blue one), with two tabs:

1. The dApp at `localhost:3001/swap?…`
2. Rabby's UI (`chrome-extension://acmaco…/index.html`)

The Rabby toolbar icon shows the throwaway-wallet address by default. After running `connectRabby` and accepting the popup, the dApp's header shows the **watch-only** address (`0xb126…` in the example) along with whatever balance the chain returns. The chainId in the wallet status badge should be `4114 (Citrea)` after the example runs.

If the dApp's wallet modal only shows WalletConnect + Coinbase (no "Rabby Wallet Detected"), Rabby announced its provider too late and the dApp didn't see it. Hard-reload the page; the dApp re-broadcasts `eip6963:requestProvider` on mount.

## How it works under the hood

| Layer | What it does | File |
|---|---|---|
| `launch-chrome.sh` | Starts Chrome for Testing with `--load-extension=…rabby` and `--remote-debugging-port=9223` against the persistent profile | `scripts/launch-chrome.sh` |
| `onboard.sh` / `onboard.mjs` | Resets `chrome.storage`, walks welcome → create-seed → password → success, then jumps to `#/import/watch-address` and registers the watch-only address | `scripts/onboard.sh` + `helpers/onboard.mjs` |
| `helpers/rabby.mjs` | Reusable `connectOverCDP` + popup handlers (auto-click `Verbinden` / `Alle ignorieren` / `Bestätigen`) | `helpers/rabby.mjs` |
| Example | Imports the helpers, drives one user-visible flow, asserts on visible button text | `examples/swap-flow.mjs` |

## Changing the UI locale

The shipped scripts target Rabby's **German** UI because that's the system locale we developed against (Chrome inherits the OS locale). If your machine is in English, French, etc., you'll see different button labels and the helpers will fail to find them.

Two files contain locale-specific strings:

- `helpers/rabby.mjs` → top of the file, the `LABELS` object
- `helpers/onboard.mjs` → the literal strings inside `clickByText('…')` calls (welcome flow + password step)

Replace them with the labels Rabby shows on your machine. Inspect Rabby with:

```bash
# After launch-chrome.sh, open the Rabby UI tab and check the buttons:
open -a "Google Chrome for Testing" chrome-extension://acmacodkjbdgmoleebolmdjonilkdbch/index.html
```

Common mappings (English ↔ German):

| English | German |
|---|---|
| `Connect` | `Verbinden` |
| `Confirm` | `Bestätigen` |
| `Ignore all` | `Alle ignorieren` |
| `Switch` | `Wechseln` |
| `Allow` | `Erlauben` |
| `Done` | `Erledigt` |
| `Create a new address` | `Erstellen Sie eine neue Adresse` |

## Reset / cleanup

To start with a completely fresh Rabby (forgets all wallets, password, settings):

```bash
# stop Chrome for Testing
pkill -f "chrome-rabby-profile"

# nuke the profile
rm -rf ~/.cache/chrome-rabby-profile

# re-onboard
WATCH_ADDR=0x… apps/web/e2e/watch-only/scripts/onboard.sh
```

To update Rabby to the latest release (keeping the existing wallets):

```bash
apps/web/e2e/watch-only/scripts/fetch-rabby.sh   # downloads new version
pkill -f "chrome-rabby-profile"                  # so the launch script reloads it
apps/web/e2e/watch-only/scripts/launch-chrome.sh # ← picks up the new extension
```

Rabby auto-migrates `chrome.storage.local` across versions; your throwaway wallet and watch-only address survive.

To remove everything this harness created:

```bash
pkill -f "chrome-rabby-profile"
rm -rf ~/.cache/chrome-rabby-profile
rm -rf ~/.cache/chrome-extensions/rabby
rm -f  /tmp/chrome-rabby.log
```

The puppeteer-cached Chrome for Testing under `~/.cache/puppeteer/chrome/` is shared with other repo tooling — leave it.

## Manual fallback (if automation breaks)

If a Rabby UI change makes `onboard.mjs` fail, you can drive the first-run by hand:

1. `apps/web/e2e/watch-only/scripts/launch-chrome.sh`
2. In the Chrome window, click the Rabby toolbar icon (yellow Rabby dog)
3. Welcome → "Get Started" → "Create a new address" → set any password
4. Once the dashboard appears, click the wallet selector (top-left) → "Add Address" → "Watch-only Address" → paste the address → "Confirm"

The persistent profile remembers the state, so subsequent `launch-chrome.sh` runs skip onboarding.

## Caveats

- **Locale dependency** — see [Changing the UI locale](#changing-the-ui-locale) above.
- **The "Loading quote…" / "Approve and swap" labels** are i18n keys defined in `packages/uniswap/src/i18n/locales/source/en-US.json`. Your assertions should match whichever locale `Accept-Language` was using for the page.
- **Rate limits** — the live Quote API rate-limits aggressive polling. Don't loop your tests at >1Hz.
- **Watch-only signing** — any `eth_sendTransaction` / `eth_signTypedData_v4` call from the page will be rejected by Rabby. That's the point — debugging ends one step before the wallet popup.
- **Chain switching** — Citrea Mainnet (chainId 4114) is not in the default wallet's chain list. The example calls `window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x1012' }] })` after connect; Rabby's popup auto-accepts it via the helper.
- **Chrome for Testing window is visible by default.** Add `--headless=new` to the Chrome args in `launch-chrome.sh` if you want it invisible — but headless Chrome 130+ blocks extensions even harder, so you might need to keep it windowed.
- **`/tmp/chrome-rabby.log`** captures Chrome stdout/stderr. If something looks off (extension didn't load, etc.) check `tail -50 /tmp/chrome-rabby.log` first.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `--load-extension is not allowed in Google Chrome, ignoring.` in `/tmp/chrome-rabby.log` | You're using stable Chrome, not Chrome for Testing | Run `launch-chrome.sh` which picks the puppeteer binary, not `/Applications/Google Chrome.app` |
| `ERROR: puppeteer cache not found at …` from `launch-chrome.sh` | `yarn install` didn't run or skipped chromium download | See [Prerequisites](#prerequisites) — re-run `yarn install` or trigger the manual download command |
| Rabby modal in the app only shows WalletConnect + Coinbase | The page loaded before Rabby announced via EIP-6963 | Hard-reload the page after Rabby loads; the dispatched `eip6963:announceProvider` events are not buffered |
| Connection popup hangs at "Bitte bearbeiten Sie zuerst den Risiko-Hinweis" | Rabby's risk-warning row was not dismissed | The helper clicks `Alle ignorieren` before `Verbinden`; check that label is correct for your locale (see [Changing the UI locale](#changing-the-ui-locale)) |
| `window.ethereum` is undefined when probed via `chrome-devtools-mcp` | MCP runs scripts in the isolated world; injected providers live in the main world | Probe via `playwright-core` `page.evaluate(…)` instead — it executes in the main world |
| `[ ]` returned from `/json/list` on port 9223 | Chrome for Testing has no open tabs; the harness needs at least one | Open one with `curl -X PUT "http://localhost:9223/json/new?http://localhost:3001/"` or use `playwright` to create it |
| `onboard.mjs` throws `could not find … button — wrong locale?` | Rabby UI is not in German | Update the label strings in `helpers/onboard.mjs`; see [Changing the UI locale](#changing-the-ui-locale) |
| `gh: command not found` from `fetch-rabby.sh` | GitHub CLI missing | `brew install gh` then `gh auth login` |
| `Port 9223 is busy. Killing existing…` then nothing connects | A previous Chrome instance is wedged on the port | `pkill -9 -f chrome-rabby-profile`; if that fails, reboot Chrome state with `rm -rf ~/.cache/chrome-rabby-profile/SingletonLock` |
| Helpers attach but `app` is `null` | No `http://localhost:3001/…` tab is open | Open the dApp manually first, or call `ctx.newPage()` and `goto()` it (see `examples/swap-flow.mjs`) |
