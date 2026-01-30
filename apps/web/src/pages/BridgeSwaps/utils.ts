const BOLTZ_DECIMALS = 8
const BOLTZ_DIVISOR = 100_000_000 // 10^8

// Decimals for different assets - used only for ERC20 chain swaps
const ERC20_ASSET_DECIMALS: Record<string, number> = {
  USDT_ETH: 6,
  USDT_POLYGON: 6,
  USDC_ETH: 6,
  USDC_POLYGON: 6,
  JUSD_CITREA: 18,
}

/**
 * Check if asset is an ERC20 token (non-Bitcoin)
 */
function isErc20Asset(asset: string): boolean {
  return asset in ERC20_ASSET_DECIMALS
}

/**
 * Format amount for bridge swaps.
 * - For Bitcoin swaps (BTC, cBTC, lnBTC): amounts are in Boltz 8-decimal format
 * - For ERC20 swaps: amounts are in native token decimals
 */
export function formatAssetAmount(amount: number, asset: string): string {
  // For ERC20 assets, use native decimals
  if (isErc20Asset(asset)) {
    const decimals = ERC20_ASSET_DECIMALS[asset]
    const divisor = Math.pow(10, decimals)
    const formattedAmount = amount / divisor

    if (formattedAmount === 0) {
      return '0'
    }

    // Use reasonable precision (up to 6 decimal places for display)
    const formatted = formattedAmount.toFixed(6)
    return formatted.replace(/\.?0+$/, '')
  }

  // For Bitcoin assets, use Boltz 8-decimal format
  const formattedAmount = amount / BOLTZ_DIVISOR

  if (formattedAmount === 0) {
    return '0'
  }

  const formatted = formattedAmount.toFixed(BOLTZ_DECIMALS)
  return formatted.replace(/\.?0+$/, '')
}
