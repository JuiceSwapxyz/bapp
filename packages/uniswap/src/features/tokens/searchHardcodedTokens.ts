import { ProtectionResult } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { hardcodedCommonBaseCurrencies } from 'uniswap/src/features/tokens/hardcodedTokens'

/**
 * Searches through hardcoded tokens by symbol, name, or address
 * @param searchQuery - The search query string
 * @param chainFilter - Optional chain filter to limit results
 * @returns Array of matching CurrencyInfo objects
 */
export function searchHardcodedTokens(searchQuery: string | null, chainFilter: UniverseChainId | null): CurrencyInfo[] {
  if (!searchQuery) {
    return []
  }

  const query = searchQuery.toLowerCase().trim()

  return hardcodedCommonBaseCurrencies.filter((token) => {
    // Chain filter check
    if (chainFilter && token.currency.chainId !== chainFilter) {
      return false
    }

    // Search by symbol (exact or contains)
    if (token.currency.symbol?.toLowerCase().includes(query)) {
      return true
    }

    // Search by name (contains)
    if (token.currency.name?.toLowerCase().includes(query)) {
      return true
    }

    // Search by address (full or partial)
    if ('address' in token.currency && token.currency.address) {
      const address = token.currency.address.toLowerCase()
      // Remove 0x prefix for comparison if present in query
      const cleanQuery = query.startsWith('0x') ? query.slice(2) : query
      const cleanAddress = address.startsWith('0x') ? address.slice(2) : address

      if (cleanAddress.includes(cleanQuery) || address === query) {
        return true
      }
    }

    return false
  })
}

/**
 * Enriches hardcoded tokens with safety information to mark them as verified
 * @param token - The CurrencyInfo to enrich
 * @returns CurrencyInfo with safety information
 */
export function enrichHardcodedTokenWithSafety(token: CurrencyInfo): CurrencyInfo {
  return {
    ...token,
    safetyInfo: {
      tokenList: TokenList.Default,
      protectionResult: ProtectionResult.Benign,
      attackType: undefined,
      blockaidFees: undefined,
    },
  }
}

/**
 * Simple cache for search results to improve performance
 */
class HardcodedTokensSearchCache {
  private cache = new Map<string, CurrencyInfo[]>()
  private cacheTimeout = 60000 // 1 minute
  private timers = new Map<string, NodeJS.Timeout>()

  getCached(query: string, chainFilter: UniverseChainId | null): CurrencyInfo[] | null {
    const key = `${query}-${chainFilter}`
    return this.cache.get(key) || null
  }

  setCached(params: { query: string; chainFilter: UniverseChainId | null; results: CurrencyInfo[] }): void {
    const key = `${params.query}-${params.chainFilter}`

    // Clear existing timer if present
    const existingTimer = this.timers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    this.cache.set(key, params.results)

    // Set new timer to clear cache
    const timer = setTimeout(() => {
      this.cache.delete(key)
      this.timers.delete(key)
    }, this.cacheTimeout)

    this.timers.set(key, timer)
  }

  clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer))
    this.cache.clear()
    this.timers.clear()
  }
}

export const hardcodedTokensSearchCache = new HardcodedTokensSearchCache()
