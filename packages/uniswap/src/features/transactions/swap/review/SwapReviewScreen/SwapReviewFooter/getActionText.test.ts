import {
  WarningAction,
  WarningLabel,
  WarningSeverity,
  type Warning,
} from 'uniswap/src/components/modals/WarningModal/types'
import { getActionText } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/SubmitSwapButton'
import type { SubmitButtonDisableReason } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/getSubmitButtonDisableReason'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import i18n from 'uniswap/src/i18n'

/**
 * Tests for the label rendered on the swap-review submit button.
 *
 * `getActionText` is the join point between:
 *   - the standard action label ("Swap", "Wrap", "Approve and swap", …)
 *   - the warning override label ("Swap anyways" when a High-severity
 *     warning is present), and
 *   - the disable-reason label introduced by the silent-disable fix
 *     ("Loading quote...", "Accept the new price", …).
 *
 * The pure-function tests for `getIsSubmitButtonDisabled` and
 * `getSubmitButtonDisableReason` already lock in *when* the button is
 * disabled and *which* reason it carries. This file locks in the third leg
 * of the contract: that the chosen reason actually maps to a non-empty,
 * translated string — so a deleted i18n key, a forgotten switch branch in
 * `getDisableReasonText`, or a regression in `getActionText` itself all
 * fail loudly here instead of shipping as a silent grey button.
 */

const t = i18n.t.bind(i18n)

describe(getActionText, () => {
  describe('standard action labels (no disableReason)', () => {
    it('returns the wrap label for a wrap action', () => {
      expect(getActionText({ t, wrapType: WrapType.Wrap })).toBe('Wrap')
    })

    it('returns the unwrap label for an unwrap action', () => {
      expect(getActionText({ t, wrapType: WrapType.Unwrap })).toBe('Unwrap')
    })

    it('returns the generic swap label when no special path applies', () => {
      expect(getActionText({ t, wrapType: WrapType.NotApplicable })).toBe('Swap')
    })

    it('returns the swap-anyways label when a High-severity warning is present', () => {
      const warning: Warning = {
        type: WarningLabel.FiatLossHigh,
        severity: WarningSeverity.High,
        action: WarningAction.WarnBeforeSubmit,
      }
      expect(getActionText({ t, wrapType: WrapType.NotApplicable, warning })).toBe('Swap anyways')
    })

    it('uses the authenticated variant when isAuthenticated is true', () => {
      // Confirms the existing isAuthenticated branching still works after the
      // disableReason override was wired in.
      expect(getActionText({ t, wrapType: WrapType.NotApplicable, isAuthenticated: true })).toBe('Confirm swap')
    })
  })

  describe('disableReason overrides (silent-disable fix)', () => {
    it('returns "Loading quote..." for invalid_swap', () => {
      const disableReason: SubmitButtonDisableReason = { kind: 'invalid_swap' }
      expect(getActionText({ t, wrapType: WrapType.NotApplicable, disableReason })).toBe('Loading quote...')
    })

    it('returns "Accept the new price" for new_trade_requires_acceptance', () => {
      const disableReason: SubmitButtonDisableReason = { kind: 'new_trade_requires_acceptance' }
      expect(getActionText({ t, wrapType: WrapType.NotApplicable, disableReason })).toBe('Accept the new price')
    })

    it('returns "Acknowledge token warning" for token_warning_unchecked', () => {
      const disableReason: SubmitButtonDisableReason = { kind: 'token_warning_unchecked' }
      expect(getActionText({ t, wrapType: WrapType.NotApplicable, disableReason })).toBe('Acknowledge token warning')
    })

    it('returns "Enter a valid Lightning address" for lightning_address_invalid', () => {
      const disableReason: SubmitButtonDisableReason = { kind: 'lightning_address_invalid' }
      expect(getActionText({ t, wrapType: WrapType.NotApplicable, disableReason })).toBe(
        'Enter a valid Lightning address',
      )
    })

    it('returns "Enter a valid Bitcoin address" for bitcoin_address_invalid', () => {
      const disableReason: SubmitButtonDisableReason = { kind: 'bitcoin_address_invalid' }
      expect(getActionText({ t, wrapType: WrapType.NotApplicable, disableReason })).toBe(
        'Enter a valid Bitcoin address',
      )
    })

    it('falls through to the standard action for is_submitting (loading state owns the button)', () => {
      // `is_submitting` is rendered by the dedicated loading case in the
      // SubmitSwapButton switch; getActionText must not overwrite the label
      // there or the loading UI would suddenly say "Approve and swap" again.
      const disableReason: SubmitButtonDisableReason = { kind: 'is_submitting' }
      expect(getActionText({ t, wrapType: WrapType.NotApplicable, disableReason })).toBe('Swap')
    })
  })

  describe('blocking_warning fallback chain', () => {
    function blockingWarning(opts: { buttonText?: string; title?: string }): SubmitButtonDisableReason {
      return {
        kind: 'blocking_warning',
        warning: {
          type: WarningLabel.InsufficientFunds,
          severity: WarningSeverity.Medium,
          action: WarningAction.DisableReview,
          ...opts,
        },
      }
    }

    it('uses the warning buttonText when present', () => {
      // Mirrors getBalanceWarning on web ("Insufficient USDC.e balance").
      const disableReason = blockingWarning({
        buttonText: 'Insufficient USDC.e balance',
        title: 'Insufficient balance',
      })
      expect(getActionText({ t, wrapType: WrapType.NotApplicable, disableReason })).toBe('Insufficient USDC.e balance')
    })

    it('falls back to the warning title when no buttonText is set', () => {
      // Mirrors mobile getBalanceWarning, or any error-path warning that ships
      // only a title.
      const disableReason = blockingWarning({ title: 'Insufficient balance' })
      expect(getActionText({ t, wrapType: WrapType.NotApplicable, disableReason })).toBe('Insufficient balance')
    })

    it('falls back to a generic "Cannot proceed" when neither buttonText nor title is set', () => {
      // Last-resort fallback: any warning emitter that forgets both fields
      // would otherwise re-introduce the silent-disable bug. Should never
      // happen in production today, but locks the contract in.
      const disableReason = blockingWarning({})
      expect(getActionText({ t, wrapType: WrapType.NotApplicable, disableReason })).toBe('Cannot proceed')
    })
  })

  describe('i18n key existence — every disabled.* key resolves to a real translation', () => {
    // If a key is deleted from en-US.json or accidentally renamed, i18next
    // returns the key string itself as the value. This test guards against
    // that class of regression for every key the silent-disable fix added.
    const expectedKeys = [
      'swap.button.disabled.loadingQuote',
      'swap.button.disabled.acceptNewPrice',
      'swap.button.disabled.acknowledgeTokenWarning',
      'swap.button.disabled.enterValidLightningAddress',
      'swap.button.disabled.enterValidBitcoinAddress',
      'swap.button.disabled.cannotProceed',
    ]

    it.each(expectedKeys)('"%s" resolves to a non-key translation', (key) => {
      const value = t(key)
      expect(value).not.toBe(key)
      expect(value.length).toBeGreaterThan(0)
    })
  })
})
