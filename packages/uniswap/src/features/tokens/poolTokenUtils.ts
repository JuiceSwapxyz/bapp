import { PoolToken } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { getTokenLogoFromRegistry } from 'uniswap/src/features/tokens/tokenRegistry'

export const HIDDEN_TOKEN_SYMBOLS = new Set(['svJUSD', 'startUSD', 'SUSD'])
export const POOL_TOKENS_STALE_TIME_MS = 5 * 60 * 1000 // 5 minutes

const CHAIN_ID_MAP: Record<number, UniverseChainId> = {
  4114: UniverseChainId.CitreaMainnet,
  5115: UniverseChainId.CitreaTestnet,
}

export const REVERSE_CHAIN_ID_MAP: Partial<Record<UniverseChainId, number>> = {
  [UniverseChainId.CitreaMainnet]: 4114,
  [UniverseChainId.CitreaTestnet]: 5115,
}

export function poolTokenToCurrencyInfo(token: PoolToken): CurrencyInfo | null {
  const universeChainId = CHAIN_ID_MAP[token.chainId]
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
