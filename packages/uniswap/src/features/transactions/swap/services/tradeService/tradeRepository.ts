import { isRateLimitFetchError } from 'uniswap/src/data/apiClients/FetchError'
import { DiscriminatedQuoteResponse, type FetchQuote } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { TradeType } from 'uniswap/src/data/tradingApi/__generated__'
import { logSwapQuoteFetch } from 'uniswap/src/features/transactions/swap/analytics'
import { type Logger } from 'utilities/src/logger/logger'

// Minimal parameters needed for indicative quotes
export interface IndicativeQuoteRequest {
  type: TradeType
  amount: string
  tokenInChainId: number
  tokenOutChainId: number
  tokenIn: string
  tokenOut: string
  swapper: string
}

// Type for the indicative quote fetcher function
export type FetchIndicativeQuote = (params: IndicativeQuoteRequest) => Promise<DiscriminatedQuoteResponse>

export interface TradeRepository {
  fetchQuote: FetchQuote
  fetchIndicativeQuote: FetchIndicativeQuote
  isRateLimited: () => boolean
}

export function createTradeRepository(ctx: {
  fetchQuote: FetchQuote
  fetchIndicativeQuote: FetchIndicativeQuote
  logger?: Logger
}): TradeRepository {
  return {
    isRateLimited: (): boolean => {
      // Check if we're still within the rate limit period
      const rateLimitEndTime = globalThis.__RATE_LIMIT_END_TIME__
      if (rateLimitEndTime && Date.now() < rateLimitEndTime) {
        return true
      }
      return false
    },
    fetchQuote: async ({ isUSDQuote, ...params }): Promise<DiscriminatedQuoteResponse> => {
      // Block quote fetching during rate limit period
      if (globalThis.__RATE_LIMIT_END_TIME__ && Date.now() < globalThis.__RATE_LIMIT_END_TIME__) {
        throw new Error('Rate limit active - please wait before trying again')
      }

      logSwapQuoteFetch({ chainId: params.tokenInChainId, isUSDQuote })

      // Skip latency logging for USD quotes
      const startTime = ctx.logger && !isUSDQuote ? Date.now() : undefined

      let result: DiscriminatedQuoteResponse
      try {
        result = await ctx.fetchQuote(params)
      } catch (error) {
        // Check if this is a rate limit error
        if (isRateLimitFetchError(error)) {
          // Extract retryAfter duration from error (default to 60 seconds if not provided)
          const retryAfterSeconds = (error as { retryAfter?: number }).retryAfter ?? 60
          // Set global rate limit end time
          globalThis.__RATE_LIMIT_END_TIME__ = Date.now() + retryAfterSeconds * 1000
          globalThis.__RATE_LIMIT_DURATION__ = retryAfterSeconds
          // Trigger the rate limit modal via global handler
          globalThis.__RATE_LIMIT_TRIGGER__?.()
        }
        throw error
      }

      // Log if API returned an empty quote response
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- checking for empty quote outside type expectations
      if (ctx.logger && !result.quote) {
        ctx.logger.error(new Error('Unexpected empty Trading API response'), {
          tags: { file: 'tradeRepository', function: 'fetchQuote' },
          extra: {
            params,
            routing: result.routing,
            requestId: result.requestId,
          },
        })
      }

      // Log latency when not a USD quote
      if (startTime && ctx.logger) {
        // keep the log name details the same for historical reasons
        ctx.logger.info('useTrade', 'useTrade', 'Quote Latency', {
          quoteLatency: Date.now() - startTime,
          chainIdIn: params.tokenInChainId,
          chainIdOut: params.tokenOutChainId,
          isBridging: isBridging(params.tokenInChainId, params.tokenOutChainId),
        })
      }

      return result
    },
    fetchIndicativeQuote: async (params): Promise<DiscriminatedQuoteResponse> => {
      // Block quote fetching during rate limit period
      if (globalThis.__RATE_LIMIT_END_TIME__ && Date.now() < globalThis.__RATE_LIMIT_END_TIME__) {
        throw new Error('Rate limit active - please wait before trying again')
      }

      logSwapQuoteFetch({ chainId: params.tokenInChainId, isQuickRoute: true })

      const startTime = ctx.logger ? Date.now() : undefined

      let result: DiscriminatedQuoteResponse
      try {
        result = await ctx.fetchIndicativeQuote(params)
      } catch (error) {
        // Check if this is a rate limit error
        if (isRateLimitFetchError(error)) {
          // Extract retryAfter duration from error (default to 60 seconds if not provided)
          const retryAfterSeconds = (error as { retryAfter?: number }).retryAfter ?? 60
          // Set global rate limit end time
          globalThis.__RATE_LIMIT_END_TIME__ = Date.now() + retryAfterSeconds * 1000
          globalThis.__RATE_LIMIT_DURATION__ = retryAfterSeconds
          // Trigger the rate limit modal via global handler
          globalThis.__RATE_LIMIT_TRIGGER__?.()
        }
        throw error
      }

      // log latency for indicative quotes
      if (startTime && ctx.logger) {
        ctx.logger.info('tradeRepository', 'fetchIndicativeQuote', 'Indicative Quote Latency', {
          quoteLatency: Date.now() - startTime,
          chainIdIn: params.tokenInChainId,
          chainIdOut: params.tokenOutChainId,
          isBridging: isBridging(params.tokenInChainId, params.tokenOutChainId),
        })
      }

      return result
    },
  }
}

function isBridging(tokenInChainId?: number, tokenOutChainId?: number): boolean {
  return Boolean(tokenInChainId && tokenOutChainId && tokenInChainId !== tokenOutChainId)
}
