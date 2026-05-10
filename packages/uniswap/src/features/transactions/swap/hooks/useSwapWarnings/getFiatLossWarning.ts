import { TFunction } from 'i18next'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { FIAT_LOSS_CRITICAL_PERCENT } from 'uniswap/src/features/transactions/swap/constants/fiatLoss'
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
  const inputUsd = derivedSwapInfo.currencyAmountsUSDValue[CurrencyField.INPUT]
  const outputUsd = derivedSwapInfo.currencyAmountsUSDValue[CurrencyField.OUTPUT]

  // Only block when both USD values are reliably available; otherwise let the
  // pool-based price-impact warning handle it.
  if (!inputUsd || !outputUsd) {
    return undefined
  }

  const inputNum = Number(inputUsd.toExact())
  const outputNum = Number(outputUsd.toExact())

  if (!Number.isFinite(inputNum) || !Number.isFinite(outputNum) || inputNum <= 0) {
    return undefined
  }

  const lossPercent = ((inputNum - outputNum) / inputNum) * 100
  if (lossPercent <= FIAT_LOSS_CRITICAL_PERCENT) {
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
