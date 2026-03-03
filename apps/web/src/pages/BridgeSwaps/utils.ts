const SATOSHI_DIVISOR = 100_000_000

/** LDS assets are like 'WBTC_ETH', 'JUSD_CITREA'. Return token-only symbol for UI. */
export function formatAssetSymbol(asset: string): string {
  return asset.split('_')[0]
}

export function formatSatoshiAmount(satoshis: number): string {
  const btcAmount = satoshis / SATOSHI_DIVISOR
  // Remove trailing zeros but keep at least reasonable precision
  if (btcAmount === 0) {
    return '0'
  }
  // Use up to 8 decimal places, but remove trailing zeros
  const formatted = btcAmount.toFixed(8)
  return formatted.replace(/\.?0+$/, '')
}
