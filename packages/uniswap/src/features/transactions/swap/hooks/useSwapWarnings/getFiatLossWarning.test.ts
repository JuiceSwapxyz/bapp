import { CurrencyAmount } from '@juiceswapxyz/sdk-core'
import i18next from 'i18next'
import { WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { USDC } from 'uniswap/src/constants/tokens'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import {
  FIAT_LOSS_HARD_BLOCK_THRESHOLD,
  getFiatLossWarning,
} from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getFiatLossWarning'
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
    // 100 USDC in -> 75 USDC out = 25% loss, just under the 30% threshold
    expect(
      getFiatLossWarning({ t, formatPercent, derivedSwapInfo: buildDerivedSwapInfo('100000000', '75000000') }),
    ).toBeUndefined()
  })

  it('blocks the swap when loss exceeds threshold', () => {
    // 100 USDC in -> 50 USDC out = 50% loss
    const result = getFiatLossWarning({
      t,
      formatPercent,
      derivedSwapInfo: buildDerivedSwapInfo('100000000', '50000000'),
    })
    expect(result).toMatchObject({
      type: WarningLabel.FiatLossHigh,
      severity: WarningSeverity.Blocked,
      action: WarningAction.DisableReview,
    })
  })

  it('blocks catastrophic mispricing (≈99.99% loss)', () => {
    // $122,259 in -> $8.73 out = ~99.99% loss; e.g. dry-pool quote
    const result = getFiatLossWarning({
      t,
      formatPercent,
      derivedSwapInfo: buildDerivedSwapInfo('122259000000', '8730000'),
    })
    expect(result?.action).toBe(WarningAction.DisableReview)
    expect(result?.type).toBe(WarningLabel.FiatLossHigh)
  })

  it('does not block favorable trades (output > input USD)', () => {
    expect(
      getFiatLossWarning({ t, formatPercent, derivedSwapInfo: buildDerivedSwapInfo('100000000', '101000000') }),
    ).toBeUndefined()
  })

  it('threshold is set conservatively above visual critical (10%)', () => {
    expect(FIAT_LOSS_HARD_BLOCK_THRESHOLD).toBeGreaterThan(10)
  })
})
