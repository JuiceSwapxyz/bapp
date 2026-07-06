import { Percent } from '@juiceswapxyz/sdk-core'
import type { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isGatewayJusd, isSatsuma } from 'uniswap/src/features/transactions/swap/utils/routing'

/**
 * JuiceSwap Price Impact.
 *
 * JuiceSwap routes stable swaps either through the Gateway/JUSD 1:1 PSM
 * conversion or, when bridge liquidity is depleted, through a JuiceSwap pool.
 * Pool fallbacks can carry a large price impact that the JuiceSwap Quote API
 * reports on the quote, but the custom trade classes previously dropped it,
 * leaving the UI without a price-impact warning (issue #764).
 *
 * `parseJuiceSwapPriceImpact` converts the API's percentage value (e.g. the
 * string `"0.05"` meaning 0.05 %, or `"41.51"` meaning 41.51 %) into a
 * `Percent`, mirroring the canonical conversion used by Classic trades.
 */
export function parseJuiceSwapPriceImpact(value: string | number | undefined): Percent | undefined {
  if (value === undefined || value === '') {
    return undefined
  }

  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    return undefined
  }

  // Value is already expressed as a percentage; scale to Percent's basis points.
  return new Percent(Math.round(numeric * 100), 10_000)
}

/**
 * Returns the JuiceSwap Price Impact for JuiceSwap's own routing types.
 *
 * - Pool fallback routes expose the API-reported impact via `trade.priceImpact`.
 * - Gateway/JUSD is a 1:1 PSM conversion and carries no API price impact;
 *   `undefined` is returned so the USD-value-loss guard remains the safety net.
 */
export function getJuiceSwapPriceImpact(trade: Trade): Percent | undefined {
  if (isSatsuma(trade) || isGatewayJusd(trade)) {
    return trade.priceImpact
  }

  return undefined
}
