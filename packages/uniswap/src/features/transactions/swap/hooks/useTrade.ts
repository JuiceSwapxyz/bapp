import { Currency } from '@juiceswapxyz/sdk-core'
import { useMemo } from 'react'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import { isBtcBridgingToken } from 'uniswap/src/features/tokens/hardcodedTokens'
import { parseQuoteCurrencies } from 'uniswap/src/features/transactions/swap/hooks/useTrade/parseQuoteCurrencies'
import { useIndicativeTradeQuery } from 'uniswap/src/features/transactions/swap/hooks/useTrade/useIndicativeTradeQuery'
import { useTradeQuery } from 'uniswap/src/features/transactions/swap/hooks/useTrade/useTradeQuery'
import { TradeWithGasEstimates } from 'uniswap/src/features/transactions/swap/services/tradeService/tradeService'
import { BridgeTrade, TradeWithStatus, UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import { currencyAddress } from 'uniswap/src/utils/currencyId'

// error strings hardcoded in @uniswap/unified-routing-api
// https://github.com/Uniswap/unified-routing-api/blob/020ea371a00d4cc25ce9f9906479b00a43c65f2c/lib/util/errors.ts#L4
export const SWAP_QUOTE_ERROR = 'QUOTE_ERROR'

export const API_RATE_LIMIT_ERROR = 'TOO_MANY_REQUESTS'

export function useTrade(params: UseTradeArgs): TradeWithStatus {
  const { currencyIn, currencyOut } = parseQuoteCurrencies(params)

  // Check if this is a BTC bridging token trade (1:1 rate, no quote needed)
  const isBtcBridgingTrade = useMemo(() => {
    if (!currencyIn || !currencyOut) {
      return false
    }
    const inputAddr = currencyAddress(currencyIn)
    const outputAddr = currencyAddress(currencyOut)

    return isBtcBridgingToken(currencyIn.chainId, inputAddr) || isBtcBridgingToken(currencyOut.chainId, outputAddr)
  }, [currencyIn, currencyOut])

  // Create modified params without amount for BTC bridging (to skip query)
  const modifiedParams = useMemo(() => {
    if (isBtcBridgingTrade) {
      return {
        ...params,
        amountSpecified: undefined, // This will cause the query to skip
      }
    }
    return params
  }, [params, isBtcBridgingTrade])

  const { error, data, isLoading: queryIsLoading, isFetching } = useTradeQuery(modifiedParams)
  const isLoading = (params.amountSpecified && params.isDebouncing) || queryIsLoading
  const indicative = useIndicativeTradeQuery(modifiedParams)

  return useMemo(() => {
    // For BTC bridging tokens, create a BridgeTrade with 1:1 rate
    if (isBtcBridgingTrade && currencyIn && currencyOut && params.amountSpecified) {
      try {
        // Create a mock bridge quote for 1:1 exchange
        const inputAmount = params.amountSpecified.quotient.toString()
        const outputAmount = params.amountSpecified.quotient.toString()

        const mockBridgeQuote = {
          routing: Routing.BRIDGE,
          quote: {
            input: {
              amount: inputAmount,
              token: currencyAddress(currencyIn),
            },
            output: {
              amount: outputAmount,
              token: currencyAddress(currencyOut),
            },
          },
          requestId: 'btc-bridge-mock',
          quoteId: 'btc-bridge-mock',
        }

        const bridgeTrade = new BridgeTrade({
          quote: mockBridgeQuote as any,
          currencyIn,
          currencyOut,
          tradeType: params.tradeType,
        })

        return {
          isLoading: false,
          isFetching: false,
          trade: bridgeTrade,
          indicativeTrade: undefined,
          isIndicativeLoading: false,
          error: null,
          gasEstimate: undefined,
        }
      } catch (e) {
        // If bridge trade creation fails, fall through to normal logic
        console.error('Failed to create BTC bridge trade:', e)
      }
    }

    return parseTradeResult({
      data,
      currencyIn,
      currencyOut,
      isLoading,
      isFetching,
      indicative,
      error,
      isDebouncing: params.isDebouncing,
    })
  }, [
    currencyIn,
    currencyOut,
    data,
    error,
    indicative,
    isFetching,
    isLoading,
    params.isDebouncing,
    params.amountSpecified,
    params.tradeType,
    isBtcBridgingTrade,
  ])
}

function parseTradeResult(input: {
  data?: TradeWithGasEstimates
  currencyIn?: Currency
  currencyOut?: Currency
  isLoading: boolean
  isFetching: boolean
  indicative: ReturnType<typeof useIndicativeTradeQuery>
  error: Error | null
  isDebouncing?: boolean
}): TradeWithStatus {
  const { data, currencyIn, currencyOut, isLoading, isFetching, indicative, error, isDebouncing } = input
  if (!data?.trade || !currencyIn || !currencyOut) {
    return {
      isLoading: Boolean(isLoading || isDebouncing),
      isFetching,
      trade: null,
      indicativeTrade: isLoading ? indicative.trade : undefined,
      isIndicativeLoading: indicative.isLoading,
      error,
      gasEstimate: data?.gasEstimate,
    }
  }

  // If `transformTradingApiResponseToTrade` returns a `null` trade, it means we have a non-null quote, but no routes.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (data.trade === null) {
    return {
      isLoading,
      isFetching,
      trade: null,
      indicativeTrade: undefined, // We don't want to show the indicative trade if there is no completable trade
      isIndicativeLoading: false,
      error: new Error('Unable to validate trade'),
      gasEstimate: data.gasEstimate,
    }
  }

  return {
    isLoading: isDebouncing || isLoading,
    isFetching,
    trade: data.trade,
    indicativeTrade: indicative.trade,
    isIndicativeLoading: indicative.isLoading,
    error,
    gasEstimate: data.gasEstimate,
  }
}
