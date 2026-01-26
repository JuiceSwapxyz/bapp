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
  isSvJusdAddress,
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

  // Check if this pool uses svJUSD tokens (real on-chain pool)
  // Mock pools use JUSD tokens directly and don't need adjustment
  const token0Address = pool.token0.address
  const token1Address = pool.token1.address
  const effectiveSharePrice = sharePrice || DEFAULT_SHARE_PRICE

  // Only apply adjustment if pool uses svJUSD tokens (real on-chain pool)
  // Mock pools created for new positions use JUSD tokens and JUSD prices,
  // so no conversion is needed - the calculation is already in JUSD terms
  const token0IsSvJusd = chainId ? isSvJusdAddress(chainId, token0Address) : false
  const token1IsSvJusd = chainId ? isSvJusdAddress(chainId, token1Address) : false
  const poolUsesSvJusd = token0IsSvJusd || token1IsSvJusd

  // If pool doesn't use svJUSD or no share price adjustment needed, use standard calculation
  if (!poolUsesSvJusd || effectiveSharePrice === DEFAULT_SHARE_PRICE) {
    return getDependentAmountFromV3Position({ independentAmount, pool, tickLower, tickUpper })
  }

  // Determine which token position is svJUSD for conversion logic
  const jusdToken = getJusdTokenInPair(chainId!, token0Address, token1Address)
  if (!jusdToken) {
    // Safety check - should not happen if poolUsesSvJusd is true
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
