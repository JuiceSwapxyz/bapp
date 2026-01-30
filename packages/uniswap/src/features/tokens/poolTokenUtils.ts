import { PoolToken } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { fromSdkCoreChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { getHiddenTokenSymbols, getTokenLogoFromRegistry } from 'uniswap/src/features/tokens/tokenRegistry'

// Derive hidden tokens from TOKEN_METADATA (single source of truth)
export const HIDDEN_TOKEN_SYMBOLS = getHiddenTokenSymbols()
export const POOL_TOKENS_STALE_TIME_MS = 5 * 60 * 1000 // 5 minutes

export function poolTokenToCurrencyInfo(token: PoolToken): CurrencyInfo | null {
  const universeChainId = fromSdkCoreChainId(token.chainId)
  if (!universeChainId) {
    return null
  }

  const currency = buildCurrency({
    chainId: universeChainId,
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name,
  })

  if (!currency) {
    return null
  }

  return {
    currency,
    currencyId: `${universeChainId}-${token.address}`,
    logoUrl: getTokenLogoFromRegistry(universeChainId, token.address) || token.logoURI || '',
  }
}
