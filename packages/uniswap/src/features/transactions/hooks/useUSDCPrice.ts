import { Currency, CurrencyAmount, Price, Token, TradeType } from '@juiceswapxyz/sdk-core'
import { useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPrimaryStablecoin, isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { useTrade } from 'uniswap/src/features/transactions/swap/hooks/useTrade'
import { isClassic, isGatewayJusd } from 'uniswap/src/features/transactions/swap/utils/routing'
import { areCurrencyIdsEqual, currencyId } from 'uniswap/src/utils/currencyId'

const DEFAULT_STABLECOIN_AMOUNT_OUT = 0.0001
function getStablecoinAmountOut(chainId: UniverseChainId): CurrencyAmount<Token> {
  const chainInfo = getChainInfo(chainId)

  if (chainInfo.spotPriceStablecoinAmountOverride) {
    return chainInfo.spotPriceStablecoinAmountOverride
  }

  const primaryStablecoin = getPrimaryStablecoin(chainId)
  const coefficient = primaryStablecoin.decimals === 18 ? 0.000001 : 1
  const amount = DEFAULT_STABLECOIN_AMOUNT_OUT * coefficient * Math.pow(10, primaryStablecoin.decimals)
  return CurrencyAmount.fromRawAmount(primaryStablecoin, amount)
}

// Citrea Gateway doesn't support EXACT_OUTPUT, so we need to use EXACT_INPUT
// and calculate the price from the output amount
function shouldUseExactInput(chainId: UniverseChainId | undefined): boolean {
  return chainId === UniverseChainId.CitreaMainnet || chainId === UniverseChainId.CitreaTestnet
}

// Small amount for EXACT_INPUT quotes (0.0001 of the currency, adjusted for 18 decimals)
const EXACT_INPUT_QUOTE_AMOUNT = '100000000000000' // 0.0001 * 10^18 = 1e14

/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export function useUSDCPrice(
  currency?: Currency,
  pollInterval: PollingInterval = PollingInterval.Fast,
): {
  price: Price<Currency, Currency> | undefined
  isLoading: boolean
} {
  const chainId = currency?.chainId
  const useExactInput = shouldUseExactInput(isUniverseChainId(chainId) ? chainId : undefined)

  const stablecoinAmount = useMemo(
    () => (isUniverseChainId(chainId) ? getStablecoinAmountOut(chainId) : undefined),
    [chainId],
  )
  const stablecoin = stablecoinAmount?.currency

  // For EXACT_INPUT mode, create a small amount of the input currency
  const currencyInputAmount = useMemo(() => {
    if (!useExactInput || !currency) {
      return undefined
    }
    return CurrencyAmount.fromRawAmount(currency, EXACT_INPUT_QUOTE_AMOUNT)
  }, [useExactInput, currency])

  // avoid requesting quotes for stablecoin input
  const currencyIsStablecoin = Boolean(
    stablecoin && currency && areCurrencyIdsEqual(currencyId(currency), currencyId(stablecoin)),
  )

  // For EXACT_INPUT: amountSpecified is the currency amount, otherCurrency is stablecoin
  // For EXACT_OUTPUT: amountSpecified is the stablecoin amount, otherCurrency is currency
  const amountSpecified = currencyIsStablecoin
    ? undefined
    : useExactInput
      ? currencyInputAmount
      : stablecoinAmount
  const otherCurrency = useExactInput ? stablecoin : currency
  const tradeType = useExactInput ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT

  const { trade, isLoading } = useTrade({
    amountSpecified,
    otherCurrency,
    tradeType,
    pollInterval,
    isUSDQuote: true,
  })

  return useMemo(() => {
    if (!stablecoin) {
      return { price: undefined, isLoading: false }
    }

    if (currencyIsStablecoin) {
      // handle stablecoin
      return { price: new Price(stablecoin, stablecoin, '1', '1'), isLoading: false }
    }

    if (!trade || !currency) {
      return { price: undefined, isLoading }
    }

    // Handle Gateway trades (GATEWAY_JUSD, GATEWAY_JUICE_IN, GATEWAY_JUICE_OUT)
    // These have executionPrice directly instead of routes with midPrice
    if (isGatewayJusd(trade)) {
      return { price: trade.executionPrice, isLoading }
    }

    if (!isClassic(trade) || !trade.routes[0]) {
      return { price: undefined, isLoading }
    }

    const { numerator, denominator } = trade.routes[0].midPrice
    return { price: new Price(currency, stablecoin, denominator, numerator), isLoading }
  }, [currency, stablecoin, currencyIsStablecoin, trade, isLoading])
}

export function useUSDCValue(
  currencyAmount: CurrencyAmount<Currency> | undefined | null,
  pollInterval: PollingInterval = PollingInterval.Fast,
): CurrencyAmount<Currency> | null {
  const { price } = useUSDCPrice(currencyAmount?.currency, pollInterval)

  return useMemo(() => {
    if (!price || !currencyAmount) {
      return null
    }
    try {
      return price.quote(currencyAmount)
    } catch (error) {
      return null
    }
  }, [currencyAmount, price])
}

/**
 * @param currencyAmount
 * @returns Returns fiat value of the currency amount, and loading status of the currency<->stable quote
 */
export function useUSDCValueWithStatus(currencyAmount: CurrencyAmount<Currency> | undefined | null): {
  value: CurrencyAmount<Currency> | null
  isLoading: boolean
} {
  const { price, isLoading } = useUSDCPrice(currencyAmount?.currency)

  return useMemo(() => {
    if (!price || !currencyAmount) {
      return { value: null, isLoading }
    }
    try {
      return { value: price.quote(currencyAmount), isLoading }
    } catch (error) {
      return {
        value: null,
        isLoading: false,
      }
    }
  }, [currencyAmount, isLoading, price])
}
