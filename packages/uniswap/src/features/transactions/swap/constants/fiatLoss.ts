import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'

// Single source of truth for USD-value-loss thresholds (output USD vs. input USD).
//
// Two tiers, both purely about "the dollar value going out is materially less
// than the dollar value going in":
//
//   - WARN: orange-tinted UI signal on the swap form ("you are losing some value")
//   - CRITICAL: red-tinted UI signal AND a confirm-popup before submit
//                ("you are losing a lot of value — confirm or back out")
//
// At CRITICAL the user is never blocked — they can always confirm and proceed.
export const FIAT_LOSS_WARN_PERCENT = 5
export const FIAT_LOSS_CRITICAL_PERCENT = 10

/**
 * Computes the user's fiat-value loss as a positive percentage:
 * `((inputUsd - outputUsd) / inputUsd) * 100`
 *
 * Returns `undefined` when the loss cannot be computed reliably — either USD
 * value missing, non-finite, or non-positive input. Both the visual colour
 * tier (`usePriceDifference`) and the confirm-before-submit warning
 * (`getFiatLossWarning`) call this so they can never disagree on whether or
 * by how much the user is losing value.
 */
export function computeFiatLossPercent(derivedSwapInfo: DerivedSwapInfo): number | undefined {
  const inputUsd = derivedSwapInfo.currencyAmountsUSDValue[CurrencyField.INPUT]
  const outputUsd = derivedSwapInfo.currencyAmountsUSDValue[CurrencyField.OUTPUT]
  if (!inputUsd || !outputUsd) {
    return undefined
  }
  const inputNum = Number(inputUsd.toExact())
  const outputNum = Number(outputUsd.toExact())
  if (!Number.isFinite(inputNum) || !Number.isFinite(outputNum) || inputNum <= 0) {
    return undefined
  }
  return ((inputNum - outputNum) / inputNum) * 100
}
