import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { getParsedWarnings } from 'uniswap/src/features/transactions/hooks/useParsedTransactionWarnings'

const insufficientFundsWarning: Warning = {
  type: WarningLabel.InsufficientFunds,
  severity: WarningSeverity.Medium,
  action: WarningAction.DisableReview,
  title: 'Not enough USDC.e',
}

const highPriceImpactWarning: Warning = {
  type: WarningLabel.PriceImpactHigh,
  severity: WarningSeverity.High,
  action: WarningAction.WarnBeforeSubmit,
  title: 'High price impact',
}

const fiatLossWarning: Warning = {
  type: WarningLabel.FiatLossHigh,
  severity: WarningSeverity.High,
  action: WarningAction.WarnBeforeSubmit,
  title: 'Output value too low',
}

describe(getParsedWarnings, () => {
  it('keeps a critical price-impact warning inline even when funds are insufficient (#764)', () => {
    const parsed = getParsedWarnings([insufficientFundsWarning, highPriceImpactWarning])

    // The inline slot surfaces the critical loss warning, not the funds message...
    expect(parsed.formScreenWarning?.warning.type).toBe(WarningLabel.PriceImpactHigh)
    expect(parsed.formScreenWarning?.displayedInline).toBe(true)
    // ...while the insufficient-funds warning is still exposed for the review button.
    expect(parsed.insufficientBalanceWarning?.type).toBe(WarningLabel.InsufficientFunds)
  })

  it('keeps a critical fiat-loss warning inline even when funds are insufficient (#764)', () => {
    const parsed = getParsedWarnings([insufficientFundsWarning, fiatLossWarning])

    expect(parsed.formScreenWarning?.warning.type).toBe(WarningLabel.FiatLossHigh)
    expect(parsed.formScreenWarning?.displayedInline).toBe(true)
  })

  it('hides the inline slot for a lone insufficient-funds warning', () => {
    const parsed = getParsedWarnings([insufficientFundsWarning])

    expect(parsed.formScreenWarning?.warning.type).toBe(WarningLabel.InsufficientFunds)
    expect(parsed.formScreenWarning?.displayedInline).toBe(false)
  })
})
