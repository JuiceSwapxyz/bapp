import { TFunction } from 'i18next'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import {
  FIAT_LOSS_CRITICAL_PERCENT,
  computeFiatLossPercent,
} from 'uniswap/src/features/transactions/swap/constants/fiatLoss'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'

export function getFiatLossWarning({
  t,
  formatPercent,
  derivedSwapInfo,
}: {
  t: TFunction
  formatPercent: LocalizationContextState['formatPercent']
  derivedSwapInfo: DerivedSwapInfo
}): Warning | undefined {
  const lossPercent = computeFiatLossPercent(derivedSwapInfo)
  if (lossPercent === undefined || lossPercent <= FIAT_LOSS_CRITICAL_PERCENT) {
    return undefined
  }

  const lossValue = formatPercent(lossPercent.toFixed(2))
  const inputCurrencySymbol = derivedSwapInfo.currencies[CurrencyField.INPUT]?.currency.symbol ?? ''
  const outputCurrencySymbol = derivedSwapInfo.currencies[CurrencyField.OUTPUT]?.currency.symbol ?? ''

  return {
    type: WarningLabel.FiatLossHigh,
    severity: WarningSeverity.High,
    action: WarningAction.WarnBeforeSubmit,
    title: t('swap.warning.fiatLoss.title', { lossValue }),
    message: t('swap.warning.fiatLoss.message', {
      inputCurrencySymbol,
      outputCurrencySymbol,
    }),
  }
}
