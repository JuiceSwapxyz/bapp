import { useMemo } from 'react'
import { ColorTokens } from 'ui/src'
import {
  FIAT_LOSS_CRITICAL_PERCENT,
  FIAT_LOSS_WARN_PERCENT,
} from 'uniswap/src/features/transactions/swap/constants/fiatLoss'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { getPriceImpact } from 'uniswap/src/features/transactions/swap/utils/getPriceImpact'
import { CurrencyField } from 'uniswap/src/types/currency'

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
  const inputPrice = derivedSwapInfo?.currencyAmountsUSDValue[CurrencyField.INPUT]?.toFixed()
  const outputPrice = derivedSwapInfo?.currencyAmountsUSDValue[CurrencyField.OUTPUT]?.toFixed()

  return useMemo(() => {
    if (!derivedSwapInfo) {
      return { showPriceDifferenceWarning: false }
    }

    const priceDifferencePercentage =
      outputPrice !== undefined && inputPrice !== undefined
        ? ((+outputPrice - +inputPrice) / +inputPrice) * 100
        : +(getPriceImpact(derivedSwapInfo)?.toFixed() || 0)

    // Handle NaN cases - return early without warning if calculation is invalid
    if (isNaN(priceDifferencePercentage)) {
      return { showPriceDifferenceWarning: false }
    }

    const showPriceDifferenceWarning =
      !!priceDifferencePercentage && priceDifferencePercentage * -1 > FIAT_LOSS_WARN_PERCENT

    if (showPriceDifferenceWarning) {
      return {
        priceDifferencePercentage,
        showPriceDifferenceWarning,
        priceDifferenceColor:
          priceDifferencePercentage * -1 > FIAT_LOSS_CRITICAL_PERCENT ? '$statusCritical' : '$statusWarning',
      }
    }

    return { priceDifferencePercentage, showPriceDifferenceWarning }
  }, [derivedSwapInfo, inputPrice, outputPrice])
}
