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
