/**
 * JuiceSwap Gas Estimation Configuration
 *
 * We use client-side gas estimation via provider.estimateGas() for all chains.
 * The Uniswap Gateway Gas API (gateway.uniswap.org/v1/gas-fee) is NOT used.
 * - Calculates gas using the connected provider directly
 */

// Empty array - no chains use the Uniswap Gas API
export const UNISWAP_GAS_API_SUPPORTED_CHAINS = [] as const

/**
 * Type representing a chain ID supported by the Uniswap Gas API
 * Since we don't use it, this is 'never'
 */
export type UniswapGasApiSupportedChain = never

/**
 * Always returns false - JuiceSwap uses client-side gas estimation for all chains.
 *
 * When this returns false, the gas estimation falls back to provider.estimateGas()
 * which is implemented in:
 * - apps/web/src/hooks/useTransactionGasFee.ts (tryClientSideFallback)
 * - packages/uniswap/src/data/apiClients/uniswapApi/UniswapApiClient.ts
 *
 * @param _chainId - The chain ID (unused)
 * @returns false - always uses client-side estimation
 */
export function isUniswapGasApiSupportedChain(_chainId: number | undefined): boolean {
  return false
}
