import type { TFunction } from 'i18next'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'

export function getExceedsLimitWarning(t: TFunction, derivedSwapInfo: DerivedSwapInfo): Warning | undefined {
  const { currencyAmounts, limits } = derivedSwapInfo
  const inputAmount = currencyAmounts[CurrencyField.INPUT]
  const maxLimit = limits?.[CurrencyField.INPUT]?.max

  if (!inputAmount || !maxLimit || !inputAmount.greaterThan(maxLimit)) {
    return undefined
  }

  return {
    type: WarningLabel.ExceedsLimit,
    severity: WarningSeverity.None,
    action: WarningAction.DisableReview,
    buttonText: t('swap.warning.exceedsLimit.title'),
  }
}
