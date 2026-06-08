/**
 * Default max-slippage (in percent) that JuiceSwap submits to the `/v1/swap`
 * endpoint for its own routing types (Gateway/JUSD and pool fallback) when the
 * user has not set a custom tolerance.
 *
 * Shared by the swap builders and the slippage display so the value shown in
 * the UI can never differ from the slippage actually encoded in the signed
 * swap (issue #764).
 */
export const JUICESWAP_DEFAULT_SLIPPAGE = 5

/**
 * Resolves the slippage tolerance (as the string the `/v1/swap` body expects)
 * for JuiceSwap's routing types: the user's custom tolerance when set,
 * otherwise the shared default. Keeping this in one place guarantees the
 * submit paths and the slippage display agree (issue #764).
 */
export function resolveJuiceSwapSlippageTolerance(customSlippageTolerance?: number): string {
  return customSlippageTolerance?.toString() ?? JUICESWAP_DEFAULT_SLIPPAGE.toString()
}
