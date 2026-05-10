import { useMemo } from 'react'
import { ColorTokens } from 'ui/src'
import {
  computeFiatLossPercent,
  FIAT_LOSS_CRITICAL_PERCENT,
  FIAT_LOSS_WARN_PERCENT,
} from 'uniswap/src/features/transactions/swap/constants/fiatLoss'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { getPriceImpact } from 'uniswap/src/features/transactions/swap/utils/getPriceImpact'

export type UsePriceDifferenceReturnType =
  | {
      priceDifferencePercentage?: number
      showPriceDifferenceWarning: false
      priceDifferenceColor: undefined
    }
  | {
      priceDifferencePercentage: number
      showPriceDifferenceWarning: true
      priceDifferenceColor: ColorTokens
    }

export function usePriceDifference(derivedSwapInfo?: DerivedSwapInfo): UsePriceDifferenceReturnType {
  return useMemo(() => {
    if (!derivedSwapInfo) {
      return { showPriceDifferenceWarning: false }
    }

    // Convention: priceDifferencePercentage is negative when the user is
    // losing value. computeFiatLossPercent returns positive-for-loss, so we
    // negate it. Falls back to the pool-curve impact when USD values are
    // unavailable.
    const fiatLoss = computeFiatLossPercent(derivedSwapInfo)
    const priceDifferencePercentage =
      fiatLoss !== undefined ? -fiatLoss : +(getPriceImpact(derivedSwapInfo)?.toFixed() || 0)

    if (isNaN(priceDifferencePercentage)) {
      return { showPriceDifferenceWarning: false }
    }

    const lossPercent = -priceDifferencePercentage
    const showPriceDifferenceWarning = !!priceDifferencePercentage && lossPercent > FIAT_LOSS_WARN_PERCENT

    if (showPriceDifferenceWarning) {
      return {
        priceDifferencePercentage,
        showPriceDifferenceWarning,
        priceDifferenceColor: lossPercent > FIAT_LOSS_CRITICAL_PERCENT ? '$statusCritical' : '$statusWarning',
      }
    }

    return { priceDifferencePercentage, showPriceDifferenceWarning }
  }, [derivedSwapInfo])
}
