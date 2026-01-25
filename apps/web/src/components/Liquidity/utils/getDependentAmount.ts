import { Currency, CurrencyAmount } from '@juiceswapxyz/sdk-core'
import { Pair } from '@juiceswapxyz/v2-sdk'
import { Pool as V3Pool, Position as V3Position } from '@juiceswapxyz/v3-sdk'
import { Pool as V4Pool, Position as V4Position } from '@juiceswapxyz/v4-sdk'
import JSBI from 'jsbi'
import { PositionField } from 'types/position'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  DEFAULT_SHARE_PRICE,
  getJusdTokenInPair,
  isJusdPool,
  jusdToSvJusd,
  svJusdToJusd,
} from 'uniswap/src/features/tokens/jusdAbstraction'

export function getDependentAmountFromV2Pair({
  independentAmount,
  otherAmount,
  pair,
  exactField,
  token0,
  token1,
  dependentToken,
}: {
  independentAmount?: CurrencyAmount<Currency>
  otherAmount?: CurrencyAmount<Currency>
  pair?: Pair
  exactField: PositionField
  token0: Maybe<Currency>
  token1: Maybe<Currency>
  dependentToken: Maybe<Currency>
}): CurrencyAmount<Currency> | undefined {
  const [token0Wrapped, token1Wrapped] = [token0?.wrapped, token1?.wrapped]
  if (!token0Wrapped || !token1Wrapped || !independentAmount || !pair) {
    return undefined
  }

  try {
    const dependentTokenAmount =
      exactField === PositionField.TOKEN0
        ? pair.priceOf(token0Wrapped).quote(independentAmount.wrapped)
        : pair.priceOf(token1Wrapped).quote(independentAmount.wrapped)

    return dependentToken
      ? dependentToken.isNative
        ? CurrencyAmount.fromRawAmount(dependentToken, dependentTokenAmount.quotient)
        : dependentTokenAmount
      : undefined
  } catch (e) {
    // in some cases there can be an initialized pool but there is no liquidity in which case
    // the user can enter whatever they want for the dependent amount and that pool will be created
    return otherAmount
  }
}

export function getDependentAmountFromV3Position({
  independentAmount,
  pool,
  tickLower,
  tickUpper,
}: {
  independentAmount: CurrencyAmount<Currency>
  pool: V3Pool
  tickLower: number
  tickUpper: number
}): CurrencyAmount<Currency> {
  const wrappedIndependentAmount = independentAmount.wrapped
  const independentTokenIsFirstToken = wrappedIndependentAmount.currency.equals(pool.token0)

  if (independentTokenIsFirstToken) {
    return V3Position.fromAmount0({
      pool,
      tickLower,
      tickUpper,
      amount0: wrappedIndependentAmount.quotient,
      useFullPrecision: true,
    }).amount1
  }

  return V3Position.fromAmount1({
    pool,
    tickLower,
    tickUpper,
    amount1: wrappedIndependentAmount.quotient,
  }).amount0
}

export function getDependentAmountFromV4Position({
  independentAmount,
  pool,
  tickLower,
  tickUpper,
}: {
  independentAmount: CurrencyAmount<Currency>
  pool: V4Pool
  tickLower: number
  tickUpper: number
}): CurrencyAmount<Currency> {
  const independentTokenIsFirstToken = independentAmount.currency.equals(pool.token0)

  if (independentTokenIsFirstToken) {
    return V4Position.fromAmount0({
      pool,
      tickLower,
      tickUpper,
      amount0: independentAmount.quotient,
      useFullPrecision: true,
    }).amount1
  }

  return V4Position.fromAmount1({
    pool,
    tickLower,
    tickUpper,
    amount1: independentAmount.quotient,
  }).amount0
}

/**
 * Get dependent amount from V3 position with svJUSD share price adjustment.
 *
 * When a pool involves JUSD, the actual on-chain pool uses svJUSD (the yield-bearing vault token).
 * The svJUSD share price (JUSD per svJUSD) increases over time as interest accrues.
 *
 * This function:
 * 1. Converts JUSD independent amount to svJUSD equivalent for position calculation
 * 2. Calculates the dependent amount using the pool math
 * 3. Converts svJUSD dependent amount back to JUSD for display
 *
 * This ensures the UI shows accurate JUSD amounts that match what the API will calculate.
 *
 * @param independentAmount - The user-entered amount
 * @param pool - The V3 pool (uses svJUSD internally for JUSD pairs)
 * @param tickLower - Lower tick boundary
 * @param tickUpper - Upper tick boundary
 * @param chainId - Chain ID for JUSD detection
 * @param sharePrice - svJUSD share price (18 decimals), e.g., "1020000000000000000" = 1.02
 * @returns Dependent amount adjusted for JUSD display
 */
export function getDependentAmountFromV3PositionWithJusdAdjustment({
  independentAmount,
  pool,
  tickLower,
  tickUpper,
  chainId,
  sharePrice,
}: {
  independentAmount: CurrencyAmount<Currency>
  pool: V3Pool
  tickLower: number
  tickUpper: number
  chainId?: UniverseChainId
  sharePrice?: string
}): CurrencyAmount<Currency> {
  const wrappedIndependentAmount = independentAmount.wrapped
  const independentTokenIsFirstToken = wrappedIndependentAmount.currency.equals(pool.token0)

  // Check if this is a JUSD pool and we have share price info
  const token0Address = pool.token0.address
  const token1Address = pool.token1.address
  const effectiveSharePrice = sharePrice || DEFAULT_SHARE_PRICE

  const isJusdPairFlag = chainId ? isJusdPool(chainId, token0Address, token1Address) : false
  const jusdToken = chainId ? getJusdTokenInPair(chainId, token0Address, token1Address) : null

  // If not a JUSD pair or no share price adjustment needed, use standard calculation
  if (!isJusdPairFlag || !jusdToken || effectiveSharePrice === DEFAULT_SHARE_PRICE) {
    return getDependentAmountFromV3Position({ independentAmount, pool, tickLower, tickUpper })
  }

  const isIndependentJusd =
    (independentTokenIsFirstToken && jusdToken === 'TOKEN_0') ||
    (!independentTokenIsFirstToken && jusdToken === 'TOKEN_1')

  // Convert independent amount from JUSD to svJUSD if needed
  let internalIndependentAmount = wrappedIndependentAmount.quotient.toString()
  if (isIndependentJusd) {
    internalIndependentAmount = jusdToSvJusd(internalIndependentAmount, effectiveSharePrice)
  }

  // Calculate dependent amount using pool math
  let dependentAmount: CurrencyAmount<Currency>
  if (independentTokenIsFirstToken) {
    dependentAmount = V3Position.fromAmount0({
      pool,
      tickLower,
      tickUpper,
      amount0: JSBI.BigInt(internalIndependentAmount),
      useFullPrecision: true,
    }).amount1
  } else {
    dependentAmount = V3Position.fromAmount1({
      pool,
      tickLower,
      tickUpper,
      amount1: JSBI.BigInt(internalIndependentAmount),
    }).amount0
  }

  // Convert dependent amount from svJUSD back to JUSD if needed
  const isDependentJusd =
    (independentTokenIsFirstToken && jusdToken === 'TOKEN_1') ||
    (!independentTokenIsFirstToken && jusdToken === 'TOKEN_0')

  if (isDependentJusd) {
    const adjustedDependentAmount = svJusdToJusd(dependentAmount.quotient.toString(), effectiveSharePrice)
    return CurrencyAmount.fromRawAmount(dependentAmount.currency, adjustedDependentAmount)
  }

  return dependentAmount
}
