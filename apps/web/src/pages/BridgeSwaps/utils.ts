const SATOSHI_DIVISOR = 100_000_000

const DECIMALS_BY_ADDRESS: Partial<Record<string, number>> = {
  '0x0987d3720d38847ac6dbb9d025b9de892a3ca35c': 18, // JUSD (Citrea mainnet)
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 6, // USDT (Ethereum)
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 6, // USDT (Polygon)
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 6, // USDC (Ethereum)
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 8, // WBTC (Ethereum)
}

export function getDecimalsForTokenAddress(tokenAddress: string): number {
  return DECIMALS_BY_ADDRESS[tokenAddress.toLowerCase()] ?? 18
}

const ASSET_DISPLAY_SYMBOLS: Partial<Record<string, string>> = {
  WBTC_ETH: 'WBTC',
  USDC_ETH: 'USDC',
  USDT_ETH: 'USDT',
  USDT_POLYGON: 'USDT',
  JUSD_CITREA: 'JUSD',
  cBTC: 'cBTC',
  BTC: 'BTC',
}

export function getAssetDisplaySymbol(asset: string): string {
  return ASSET_DISPLAY_SYMBOLS[asset] ?? asset
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
