# JUSD liquidity migration: redeem svJUSD → JUSD, seed a JUSD/WCBTC pool

**Status (verified on-chain, 2026-07-02):** selling JUSD on Citrea Mainnet is broken. This document
explains why, why the fix requires converting the existing svJUSD liquidity back into raw JUSD and
seeding a **new JUSD/WCBTC pool**, and how PR
[#775](https://github.com/JuiceSwapxyz/bapp/pull/775) resolves every resulting problem once that
pool exists.

## 1. What is broken, exactly

The quote API (`/v1/quote`) special-cases the JUSD token address and always routes it through the
JuiceSwap Gateway, regardless of the `protocols` the client requests:

```
sell JUSD:  JUSD --Savings.save()--> svJUSD --V3 pool--> cBTC     ← reverts
buy  JUSD:  cBTC --V3 pool--> svJUSD --withdraw()--> JUSD         ← still works
```

The savings interest rate is currently **0%** (`SavingsGateway.currentRatePPM() == 0` at
`0x22FE239892eBC8805DA8f05eD3bc6aF75332b60b`, re-verified 2026-07-02). At a 0% rate the vault's
deposit leg (`Savings.save()` / `SavingsVaultJUSD._deposit()`) reverts with `ModuleDisabled()`.
Since every JUSD *sell* must first wrap JUSD into svJUSD through that exact leg, **selling JUSD is
impossible** — the API returns `GATEWAY_*_DISABLED` and the app shows a dead end. Buying JUSD keeps
working because the redeem/withdraw leg of the vault is not gated on the rate.

Two structural facts follow from this:

1. **All on-chain JUSD liquidity is in the wrong token.** The only existing pool is
   **svJUSD/cBTC**. That pool is only reachable *through* the Gateway wrap — the exact component
   that is paused. For a JUSD seller, that liquidity might as well not exist.
2. **No Gateway-free trading route exists.** There is no raw JUSD/WCBTC pool at any fee tier
   (factory `getPool` returns the zero address for 0.05%, 0.3% and 1% — re-verified 2026-07-02).

## 2. Why svJUSD must become JUSD again

svJUSD is an ERC-4626 vault share, not money: it can only be created and redeemed through the
Gateway. Holding LP liquidity as svJUSD made sense while the savings rate was positive (LPs earned
the rate on top of fees) and the Gateway wrapped every trade transparently. Both premises are gone:

- **The yield is 0%.** `currentRatePPM() == 0` — svJUSD earns nothing over raw JUSD.
- **The wrapper is the single point of failure.** Every JUSD trade dies in `save()`. As long as the
  tradeable pool is denominated in svJUSD, JUSD trading is coupled to the Gateway's pause state.
  Denominating the pool in raw JUSD removes that coupling permanently: the pool keeps working at a
  0% rate, at a positive rate, and during any future Gateway pause.
- **Redemption is open.** Only the deposit leg is disabled; `redeem()` works. The vault currently
  holds **≈ 2,721.4 JUSD** backing **≈ 2,641.7 svJUSD** (1 svJUSD ≈ 1.0302 JUSD), so the seed
  liquidity is sitting right there and can be unwrapped today.

In short: svJUSD → JUSD is not a workaround, it is the correction. The savings vault goes back to
being what it is (an optional yield product), and trading liquidity goes where it belongs (a plain
V3 pool).

## 3. Why a new pool is required

The client-side fallback shipped in #775 trades **raw JUSD ↔ WCBTC directly against a JuiceSwap V3
pool via SwapRouter02** (`0x565eD3D57fe40f78A46f348C220121AE093c3cF8`), with zero dependency on the
API or the Gateway. That route needs a funded JUSD/WCBTC pool — and none exists. Until one is
seeded, the fallback deliberately stays inert (`getJusdDirectPoolQuote` resolves to `null`) and
users see an honest "JUSD swaps temporarily paused" message instead of the old generic error.

Creating the pool is a one-time, permissionless operation. `scripts/seed-jusd-wcbtc-pool.mjs`
performs the full migration in one run.

## 4. Runbook: seeding the pool

> The script moves real funds. Review every step; never commit or paste the private key anywhere.

1. **Fund a wallet** with the svJUSD (or raw JUSD) earmarked as liquidity, WCBTC (wrap native cBTC
   beforehand if needed), and a little cBTC for gas.
2. **Dry-run** — prints the computed price, ticks and amounts, sends nothing:

   ```bash
   PRIVATE_KEY=0x... \
   JUSD_AMOUNT=1000 \
   WCBTC_AMOUNT=0.017 \
   FEE_TIER=3000 \
   CBTC_PRICE_USD=<current cBTC/USD price> \
   node scripts/seed-jusd-wcbtc-pool.mjs --dry-run
   ```

   `JUSD_AMOUNT / WCBTC_AMOUNT` must match `CBTC_PRICE_USD` (e.g. 1000 JUSD ↔ 1000 / price WCBTC),
   otherwise the pool opens off-market and gets arbitraged immediately.
3. **Execute** (drop `--dry-run`). The script then:
   1. redeems the wallet's entire svJUSD balance back to raw JUSD (`redeem()` on the vault) — this
      is the svJUSD → JUSD conversion from section 2;
   2. approves the position manager;
   3. creates and initializes the JUSD/WCBTC pool at the chosen fee tier if it doesn't exist;
   4. mints a full-range liquidity position to the wallet.
4. **Verify**: factory `getPool(JUSD, WCBTC, 3000)` returns a non-zero address with non-zero
   liquidity. No app deployment or config change is needed — the fallback detects the pool on the
   next quote poll and activates itself.

## 5. What #775 fixes once the pool exists

| Problem today | After #775 + seeded pool |
|---|---|
| Selling JUSD is impossible (Gateway `save()` reverts `ModuleDisabled`) | JUSD sells route through the JUSD/WCBTC pool via SwapRouter02 — no Gateway, no API involved |
| Generic "This trade cannot be completed" dead end | Until the pool exists: honest "JUSD swaps temporarily paused" message with the API's real reason |
| JUSD trading fully coupled to api.juiceswap.com and the Gateway pause state | Quote is computed from on-chain pool state; calldata is built locally against the verified SwapRouter02 ABI |
| Any future Gateway pause breaks JUSD sells again | Fallback engages automatically on any `GATEWAY_*_DISABLED` quote error — permanent safety net |
| Risk of displayed vs. executed slippage diverging | Single slippage source: the displayed "minimum received" is byte-identical to the on-chain `amountOutMinimum` |

Deliberately unchanged: buying JUSD (works today, keeps its route), all non-JUSD pairs, and all
other quote errors (rate limits, amount-too-small, transient failures surface exactly as before —
the fallback never masks them).

Seeding the pool and merging the PR are independent — either order works, the feature simply
activates when both are live.
