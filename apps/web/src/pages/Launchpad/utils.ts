/**
 * Utility functions for the Launchpad feature
 */

import { LAUNCHPAD_TOKEN_TOTAL_SUPPLY } from 'pages/Launchpad/constants'

interface Reserves {
  virtualBase: bigint
  virtualToken: bigint
  realBase: bigint
  realToken: bigint
}

/**
 * Calculate market cap from bonding curve reserves
 * Market cap = current price × total supply
 */
export function formatMarketCap(reserves: Reserves | null | undefined): string {
  if (!reserves || reserves.virtualToken === 0n) {
    return '0'
  }
  const price = Number(reserves.virtualBase) / Number(reserves.virtualToken)
  const cap = price * LAUNCHPAD_TOKEN_TOTAL_SUPPLY
  return cap.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

interface V2PriceParams {
  tokenAddress: string
  baseAssetAddress: string
  reserve0: bigint
  reserve1: bigint
}

/**
 * Calculate price from V2 pair reserves.
 * V2 pairs sort tokens by address (lowercase hex comparison).
 *
 * @param params.tokenAddress - The launchpad token address
 * @param params.baseAssetAddress - The base asset (JUSD) address
 * @param params.reserve0 - Reserve of token0 (lower address)
 * @param params.reserve1 - Reserve of token1 (higher address)
 * @returns Price in base asset terms, or null if calculation fails
 */
export function calculatePriceFromV2Reserves(params: V2PriceParams): number | null {
  const { tokenAddress, baseAssetAddress, reserve0, reserve1 } = params
  // V2 pairs sort tokens by address - lower address is token0
  const isToken0 = tokenAddress.toLowerCase() < baseAssetAddress.toLowerCase()
  const tokenReserve = isToken0 ? reserve0 : reserve1
  const baseReserve = isToken0 ? reserve1 : reserve0

  // Avoid division by zero
  if (tokenReserve === 0n) {
    return null
  }

  return Number(baseReserve) / Number(tokenReserve)
}
