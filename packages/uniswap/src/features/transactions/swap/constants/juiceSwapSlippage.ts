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
