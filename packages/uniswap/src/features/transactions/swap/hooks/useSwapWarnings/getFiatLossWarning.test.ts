import { CurrencyAmount } from '@juiceswapxyz/sdk-core'
import i18next from 'i18next'
import { WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { USDC } from 'uniswap/src/constants/tokens'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FIAT_LOSS_CRITICAL_PERCENT } from 'uniswap/src/features/transactions/swap/constants/fiatLoss'
import { getFiatLossWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getFiatLossWarning'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'

describe(getFiatLossWarning, () => {
  const t = i18next.t.bind(i18next)
  const formatPercent = (value: Maybe<string | number>): string => `${value}-mocked%`

  function buildDerivedSwapInfo(inputUsd: string | undefined, outputUsd: string | undefined): DerivedSwapInfo {
    return {
      currencyAmountsUSDValue: {
        [CurrencyField.INPUT]: inputUsd ? CurrencyAmount.fromRawAmount(USDC, inputUsd) : undefined,
        [CurrencyField.OUTPUT]: outputUsd ? CurrencyAmount.fromRawAmount(USDC, outputUsd) : undefined,
      },
      currencies: {
        [CurrencyField.INPUT]: { currency: { symbol: 'USDC' }, currencyId: 'USDC' } as CurrencyInfo,
        [CurrencyField.OUTPUT]: { currency: { symbol: 'ctUSD' }, currencyId: 'ctUSD' } as CurrencyInfo,
      },
    } as unknown as DerivedSwapInfo
  }

  it('returns undefined when no USD values present', () => {
    expect(
      getFiatLossWarning({ t, formatPercent, derivedSwapInfo: buildDerivedSwapInfo(undefined, undefined) }),
    ).toBeUndefined()
  })

  it('returns undefined when only input USD value present', () => {
    expect(
      getFiatLossWarning({ t, formatPercent, derivedSwapInfo: buildDerivedSwapInfo('1000000000', undefined) }),
    ).toBeUndefined()
  })

  it('returns undefined when loss is below threshold', () => {
    // 100 USDC in -> 95 USDC out = 5% loss, below the 10% critical threshold
    expect(
      getFiatLossWarning({ t, formatPercent, derivedSwapInfo: buildDerivedSwapInfo('100000000', '95000000') }),
    ).toBeUndefined()
  })

  it('does not fire exactly at the threshold (matches usePriceDifference boundary)', () => {
    // 100 USDC in -> 90 USDC out = exactly 10% loss; usePriceDifference also
    // uses strict-greater-than so red color and popup share the same boundary.
    expect(
      getFiatLossWarning({ t, formatPercent, derivedSwapInfo: buildDerivedSwapInfo('100000000', '90000000') }),
    ).toBeUndefined()
  })

  it('fires just above the threshold', () => {
    // 100 USDC in -> 89.9 USDC out = 10.1% loss, just above the boundary
    const result = getFiatLossWarning({
      t,
      formatPercent,
      derivedSwapInfo: buildDerivedSwapInfo('100000000', '89900000'),
    })
    expect(result?.action).toBe(WarningAction.WarnBeforeSubmit)
  })

  it('warns before submit when loss exceeds critical threshold', () => {
    // 100 USDC in -> 80 USDC out = 20% loss, above 10% critical threshold
    const result = getFiatLossWarning({
      t,
      formatPercent,
      derivedSwapInfo: buildDerivedSwapInfo('100000000', '80000000'),
    })
    expect(result).toMatchObject({
      type: WarningLabel.FiatLossHigh,
      severity: WarningSeverity.High,
      action: WarningAction.WarnBeforeSubmit,
    })
  })

  it('warns on catastrophic mispricing (≈99.99% loss)', () => {
    // $122,259 in -> $8.73 out = ~99.99% loss; e.g. dry-pool quote
    const result = getFiatLossWarning({
      t,
      formatPercent,
      derivedSwapInfo: buildDerivedSwapInfo('122259000000', '8730000'),
    })
    expect(result?.action).toBe(WarningAction.WarnBeforeSubmit)
    expect(result?.type).toBe(WarningLabel.FiatLossHigh)
  })

  it('never returns a blocking action — user must always be able to confirm', () => {
    const result = getFiatLossWarning({
      t,
      formatPercent,
      derivedSwapInfo: buildDerivedSwapInfo('100000000', '1'),
    })
    expect(result?.action).not.toBe(WarningAction.DisableReview)
    expect(result?.action).not.toBe(WarningAction.DisableSubmit)
  })

  it('does not warn on favorable trades (output > input USD)', () => {
    expect(
      getFiatLossWarning({ t, formatPercent, derivedSwapInfo: buildDerivedSwapInfo('100000000', '101000000') }),
    ).toBeUndefined()
  })

  it('uses the same threshold as the visual critical tier', () => {
    // Both the red color (usePriceDifference) and the popup trigger fire at
    // FIAT_LOSS_CRITICAL_PERCENT — single source of truth.
    expect(FIAT_LOSS_CRITICAL_PERCENT).toBe(10)
  })
})
