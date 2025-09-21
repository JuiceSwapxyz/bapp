import { BigNumber } from '@ethersproject/bignumber'
import { GasFeeResult } from 'uniswap/src/features/gas/types'

export function sumGasFees(gasFees: (string | undefined)[]): string | undefined {
  if (gasFees.length === 0) {
    return undefined
  }

  // Check if any value contains a decimal point (USD values)
  const hasDecimalValues = gasFees.some((fee) => fee && fee.includes('.'))

  if (hasDecimalValues) {
    // Handle as USD values - sum as floats
    const sum = gasFees.reduce((acc, gasFee) => {
      if (!gasFee) {
        return acc
      }
      return acc + parseFloat(gasFee)
    }, 0)
    return sum.toString()
  } else {
    // Handle as Wei values - use BigNumber
    return gasFees.reduce((acc, gasFee) => {
      if (!gasFee) {
        return acc
      }
      return BigNumber.from(acc).add(BigNumber.from(gasFee)).toString()
    }, '0')
  }
}

/**
 * Merges multiple GasFeeResult objects into a single result by combining their values and preserving error/loading states
 *
 * @param gasFeeResults - Array of GasFeeResult objects to merge
 * @returns {GasFeeResult} A single merged GasFeeResult where:
 *   - error: First encountered error or null if no errors
 *   - isLoading: true if any result is loading
 *   - value: Sum of all values (undefined if any result has error or missing value)
 *   - displayValue: Sum of all display values (undefined if any result has error or missing value)
 */
export function mergeGasFeeResults(...gasFeeResults: GasFeeResult[]): GasFeeResult {
  const error = gasFeeResults.map((g) => g.error).find((e) => !!e) ?? null
  const isLoading = gasFeeResults.some((r) => r.isLoading)

  const expectedValueMissing = gasFeeResults.some((r) => r.value === undefined)
  if (expectedValueMissing || error) {
    return { value: undefined, displayValue: undefined, error, isLoading }
  }

  const value = sumGasFees(gasFeeResults.map((r) => r.value))
  const displayValue = sumGasFees(gasFeeResults.map((r) => r.displayValue))
  return { value, displayValue, error, isLoading }
}
