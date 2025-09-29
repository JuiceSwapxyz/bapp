import { GetQuoteArgs, QuoteState, TradeResult, ClassicQuoteData, QuoteMethod } from 'state/routing/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'
import { transformQuoteToTrade } from './utils'

interface CachedQuote {
  quote: TradeResult
  timestamp: number
  key: string
}

// Cache configuration
const CACHE_TTL = 30_000 // 30 seconds - reasonable for testnet
const MAX_CACHE_SIZE = 100 // Prevent memory leaks

// Simple in-memory cache for quotes
class QuoteCache {
  private cache: Map<string, CachedQuote> = new Map()
  private accessOrder: string[] = [] // LRU tracking

  /**
   * Generate a cache key from quote parameters
   * For Citrea campaign, most important params are: tokenIn, tokenOut, amount
   */
  private getCacheKey(args: GetQuoteArgs): string {
    const {
      tokenInAddress,
      tokenOutAddress,
      amount,
      tradeType,
    } = args

    // Create a deterministic key for the quote
    // Ignore account address since quotes should be same for all users with same params
    return `${tokenInAddress}-${tokenOutAddress}-${amount}-${tradeType}`
  }

  /**
   * Check if a cached quote is still valid
   */
  private isQuoteValid(cached: CachedQuote): boolean {
    const age = Date.now() - cached.timestamp
    return age < CACHE_TTL
  }

  /**
   * Clean up expired entries and maintain cache size
   */
  private cleanup(): void {
    // Remove expired entries
    const now = Date.now()
    const expiredKeys: string[] = []

    this.cache.forEach((value, key) => {
      if (now - value.timestamp >= CACHE_TTL) {
        expiredKeys.push(key)
      }
    })

    expiredKeys.forEach(key => {
      this.cache.delete(key)
      const index = this.accessOrder.indexOf(key)
      if (index > -1) {
        this.accessOrder.splice(index, 1)
      }
    })

    // Implement LRU eviction if cache is too large
    while (this.cache.size > MAX_CACHE_SIZE && this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder.shift()
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }
  }

  /**
   * Get a quote from cache if available and valid
   */
  get(args: GetQuoteArgs): TradeResult | null {
    const key = this.getCacheKey(args)
    const cached = this.cache.get(key)

    if (!cached) {
      return null
    }

    if (!this.isQuoteValid(cached)) {
      // Remove expired quote
      this.cache.delete(key)
      const index = this.accessOrder.indexOf(key)
      if (index > -1) {
        this.accessOrder.splice(index, 1)
      }
      return null
    }

    // Update access order for LRU
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    this.accessOrder.push(key)

    logger.info('citreaQuoteCache', 'Cache hit', {
      key,
      age: Date.now() - cached.timestamp
    })

    return cached.quote
  }

  /**
   * Store a quote in the cache
   */
  set(args: GetQuoteArgs, quote: TradeResult): void {
    const key = this.getCacheKey(args)

    // Run cleanup before adding new entry
    this.cleanup()

    this.cache.set(key, {
      quote,
      timestamp: Date.now(),
      key
    })

    // Update access order
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    this.accessOrder.push(key)

    logger.info('citreaQuoteCache', 'Quote cached', {
      key,
      cacheSize: this.cache.size
    })
  }

  /**
   * Clear all cached quotes
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
    logger.info('citreaQuoteCache', 'Cache cleared')
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): { size: number; hits: number; misses: number } {
    return {
      size: this.cache.size,
      hits: 0, // Would need to track this separately
      misses: 0, // Would need to track this separately
    }
  }
}

// Singleton instance
export const citreaQuoteCache = new QuoteCache()

/**
 * Special handling for Citrea testnet quotes with caching
 */
export async function getCitreaQuoteWithCache(
  args: GetQuoteArgs,
  fetchQuote: () => Promise<TradeResult>
): Promise<TradeResult> {
  // Only use cache for Citrea testnet
  if (args.tokenInChainId !== UniverseChainId.CitreaTestnet) {
    return fetchQuote()
  }

  // Check cache first
  const cachedQuote = citreaQuoteCache.get(args)
  if (cachedQuote) {
    return cachedQuote
  }

  try {
    // Fetch fresh quote
    const freshQuote = await fetchQuote()

    // Cache successful quotes
    if (freshQuote.state === QuoteState.SUCCESS && freshQuote.trade) {
      citreaQuoteCache.set(args, freshQuote)
    }

    return freshQuote
  } catch (error) {
    logger.warn('citreaQuoteCache', 'Failed to fetch quote', error)
    return { state: QuoteState.NOT_FOUND }
  }
}

/**
 * For Citrea Campaign: Create hardcoded quotes for known pools
 * This is a fallback when API is unavailable
 */
export function createCitreaHardcodedQuote(args: GetQuoteArgs): TradeResult | null {
  const { tokenOutAddress, amount } = args

  // Campaign pool addresses and expected outputs
  const CAMPAIGN_POOLS: Record<string, { outputAmount: string; poolAddress: string }> = {
    // NUSD
    '0x9B28B690550522608890C3C7e63c0b4A7eBab9AA': {
      outputAmount: '95000000000000000', // ~0.095 NUSD for 0.00001 cBTC
      poolAddress: '0x6006797369E2A595D31Df4ab3691044038AAa7FE',
    },
    // cUSD
    '0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0': {
      outputAmount: '98000000000000000', // ~0.098 cUSD for 0.00001 cBTC
      poolAddress: '0xA69De906B9A830Deb64edB97B2eb0848139306d2',
    },
    // USDC
    '0x36c16eaC6B0Ba6c50f494914ff015fCa95B7835F': {
      outputAmount: '98000', // ~0.098 USDC (6 decimals) for 0.00000000001 cBTC
      poolAddress: '0xD8C7604176475eB8D350bC1EE452dA4442637C09',
    },
  }

  const poolConfig = CAMPAIGN_POOLS[tokenOutAddress.toLowerCase()]
  if (!poolConfig) {
    return null
  }

  // Create a synthetic quote response
  const syntheticQuote: ClassicQuoteData = {
    quoteId: `citrea-static-${Date.now()}`,
    requestId: `citrea-static-${Date.now()}`,
    blockNumber: String(Math.floor(Date.now() / 1000)),
    amount,
    amountDecimals: amount,
    quote: poolConfig.outputAmount,
    quoteDecimals: poolConfig.outputAmount,
    quoteGasAdjusted: poolConfig.outputAmount,
    quoteGasAndPortionAdjusted: poolConfig.outputAmount,
    quoteGasAndPortionAdjustedDecimals: poolConfig.outputAmount,
    gasUseEstimate: '150000',
    gasUseEstimateQuote: '150000',
    gasUseEstimateQuoteDecimals: '150000',
    gasUseEstimateUSD: '0.01',
    gasPrice: '1000000000',
    gasPriceQuote: '1000000000',
    route: [],
    routeString: '',
    priceImpact: undefined,
    portionBips: undefined,
    portionRecipient: undefined,
    portionAmount: undefined,
    portionAmountDecimals: undefined,
  }

  logger.info('citreaQuoteCache', 'Using hardcoded quote for Citrea campaign', {
    tokenOut: tokenOutAddress,
    poolAddress: poolConfig.poolAddress
  })

  return {
    state: QuoteState.SUCCESS,
    trade: {
      quoteMethod: QuoteMethod.CLIENT_SIDE_FALLBACK,
      quote: syntheticQuote,
    } as any, // Type assertion needed due to complex trade types
  }
}