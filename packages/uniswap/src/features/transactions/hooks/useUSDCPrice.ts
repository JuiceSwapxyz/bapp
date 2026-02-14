import { Currency, CurrencyAmount, Price, Token, TradeType } from '@juiceswapxyz/sdk-core'
import { useMemo } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getStablecoinsForChain, getPrimaryStablecoin, isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { useTrade } from 'uniswap/src/features/transactions/swap/hooks/useTrade'
import { isClassic, isGatewayJusd } from 'uniswap/src/features/transactions/swap/utils/routing'
import { areCurrencyIdsEqual, currencyId } from 'uniswap/src/utils/currencyId'

const DEFAULT_STABLECOIN_AMOUNT_OUT = 0.0001

function normalizeDollarPrice(
  price: Price<Currency, Currency>,
  currency: Currency,
  stablecoin: Token,
): Price<Currency, Currency> {
  if (!currency.isToken) {
    return price
  }
  
  const stablecoins = getStablecoinsForChain(currency.chainId)
  const isUSDStablecoin = stablecoins.some(
    (s) => s.address.toLowerCase() === currency.address.toLowerCase()
  )
  
  if (!isUSDStablecoin) {
    return price
  }
  
  try {
    const oneUnit = CurrencyAmount.fromRawAmount(
      currency, 
      (BigInt(10) ** BigInt(currency.decimals)).toString()
    )
    // parseFloat precision is acceptable for 0.2% threshold
    const priceValue = parseFloat(price.quote(oneUnit).toExact())
    if (Math.abs(priceValue - 1) <= 0.002) {
      return new Price(currency, stablecoin, '1', '1')
    }
  } catch {
    // Intentionally empty - fall through to return original price below
  }
  return price
}

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

// Calculate a small quote amount (0.0001 tokens) adjusted for the currency's decimals
// For tokens with < 4 decimals, uses 1 raw unit as the minimum safe amount
function getExactInputQuoteAmount(decimals: number): string {
  const exponent = Math.max(0, decimals - 4)
  return (BigInt(10) ** BigInt(exponent)).toString()
}

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
    const quoteAmount = getExactInputQuoteAmount(currency.decimals)
    return CurrencyAmount.fromRawAmount(currency, quoteAmount)
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

    // Type guard: isClassic narrows but doesn't guarantee routes in all union types
    if (!isClassic(trade) || !('routes' in trade) || !trade.routes?.[0]) {
      return { price: undefined, isLoading }
    }

    const { numerator, denominator } = trade.routes[0].midPrice
    const price = new Price(currency, stablecoin, denominator, numerator)
    return { price: normalizeDollarPrice(price, currency, stablecoin), isLoading }
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
