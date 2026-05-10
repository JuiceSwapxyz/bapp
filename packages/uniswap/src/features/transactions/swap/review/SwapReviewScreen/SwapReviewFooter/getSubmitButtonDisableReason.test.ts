import {
  WarningAction,
  WarningLabel,
  WarningSeverity,
  type Warning,
} from 'uniswap/src/components/modals/WarningModal/types'
import type { SubmitButtonDisabledInput } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/getIsSubmitButtonDisabled'
import { getSubmitButtonDisableReason } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/getSubmitButtonDisableReason'

/**
 * Regression suite for the *silent disable* bug.
 *
 * Observed on dev.juiceswap.com Citrea Mainnet: an "Approve and swap" button
 * rendered as a normal-looking dark button but was not clickable, with no
 * inline message, tooltip, or warning. The user could not tell whether they
 * were waiting on something, had an unmet precondition, or had hit a bug.
 *
 * Contract these tests lock in: whenever the submit button is disabled, the
 * code path that disables it must produce a structured *reason*. The UI then
 * has the information it needs to render an explanation. A boolean
 * `disabled = true` with no reason is the bug.
 *
 * These tests are currently RED — `getSubmitButtonDisableReason` is a stub.
 * Implementing the function (and wiring its result into the button UI) is the
 * fix.
 */

const enabledBase: SubmitButtonDisabledInput = {
  isValidSwap: true,
  isWrap: false,
  blockingWarning: undefined,
  newTradeRequiresAcceptance: false,
  isSubmitting: false,
  shouldDisplayTokenWarningCard: false,
  tokenWarningChecked: false,
  shouldValidateLightningAddress: false,
  validatedLightningAddress: undefined,
  shouldValidateBitcoinAddress: false,
  validatedBitcoinAddress: undefined,
}

const insufficientFundsWarning: Warning = {
  type: WarningLabel.InsufficientFunds,
  severity: WarningSeverity.None,
  action: WarningAction.DisableReview,
}

describe(getSubmitButtonDisableReason, () => {
  describe('enabled cases — must return null', () => {
    it('returns null for the happy path', () => {
      expect(getSubmitButtonDisableReason(enabledBase)).toBeNull()
    })

    it('returns null for a wrap even when the swap-tx context is not valid', () => {
      expect(
        getSubmitButtonDisableReason({
          ...enabledBase,
          isValidSwap: false,
          isWrap: true,
        }),
      ).toBeNull()
    })
  })

  describe('disabled cases — must return a structured reason so the UI can explain', () => {
    it('returns invalid_swap when the swap-tx context is not valid (no wrap)', () => {
      const reason = getSubmitButtonDisableReason({
        ...enabledBase,
        isValidSwap: false,
        isWrap: false,
      })
      expect(reason).toEqual({ kind: 'invalid_swap' })
    })

    it('returns blocking_warning carrying the offending warning', () => {
      const reason = getSubmitButtonDisableReason({
        ...enabledBase,
        blockingWarning: insufficientFundsWarning,
      })
      expect(reason).toEqual({ kind: 'blocking_warning', warning: insufficientFundsWarning })
    })

    it('returns new_trade_requires_acceptance when the quote drifted', () => {
      const reason = getSubmitButtonDisableReason({
        ...enabledBase,
        newTradeRequiresAcceptance: true,
      })
      expect(reason).toEqual({ kind: 'new_trade_requires_acceptance' })
    })

    it('returns is_submitting while a submission is in flight', () => {
      const reason = getSubmitButtonDisableReason({
        ...enabledBase,
        isSubmitting: true,
      })
      expect(reason).toEqual({ kind: 'is_submitting' })
    })

    it('returns token_warning_unchecked when the user has not acknowledged the token-protection card', () => {
      const reason = getSubmitButtonDisableReason({
        ...enabledBase,
        shouldDisplayTokenWarningCard: true,
        tokenWarningChecked: false,
      })
      expect(reason).toEqual({ kind: 'token_warning_unchecked' })
    })

    it('returns lightning_address_invalid while a Lightning address has not been validated', () => {
      const reason = getSubmitButtonDisableReason({
        ...enabledBase,
        shouldValidateLightningAddress: true,
        validatedLightningAddress: undefined,
      })
      expect(reason).toEqual({ kind: 'lightning_address_invalid' })
    })

    it('returns bitcoin_address_invalid while a Bitcoin address has not been validated', () => {
      const reason = getSubmitButtonDisableReason({
        ...enabledBase,
        shouldValidateBitcoinAddress: true,
        validatedBitcoinAddress: undefined,
      })
      expect(reason).toEqual({ kind: 'bitcoin_address_invalid' })
    })
  })

  describe('contract: no silent disable', () => {
    it('returns a non-null reason for every input that getIsSubmitButtonDisabled flags as disabled', () => {
      // For each individual disable input, the reason function must produce
      // *some* structured reason — never just null while the boolean version
      // says disabled. This is the heart of the regression: any new
      // disable-reason added in the future without a matching reason here
      // recreates the silent-disable bug.
      const disablingInputs: Array<Partial<SubmitButtonDisabledInput>> = [
        { isValidSwap: false, isWrap: false },
        { blockingWarning: insufficientFundsWarning },
        { newTradeRequiresAcceptance: true },
        { isSubmitting: true },
        { shouldDisplayTokenWarningCard: true, tokenWarningChecked: false },
        { shouldValidateLightningAddress: true, validatedLightningAddress: undefined },
        { shouldValidateBitcoinAddress: true, validatedBitcoinAddress: undefined },
      ]

      for (const override of disablingInputs) {
        const reason = getSubmitButtonDisableReason({ ...enabledBase, ...override })
        expect(reason).not.toBeNull()
        expect(reason).toHaveProperty('kind')
      }
    })
  })

  describe('precedence', () => {
    it('reports the most fundamental reason first when several apply', () => {
      // If we have both an invalid swap AND a pending acceptance, the user
      // needs to hear the more fundamental issue (no quote) — there is no
      // point telling them to "accept the new price" of a quote that did not
      // resolve.
      const reason = getSubmitButtonDisableReason({
        ...enabledBase,
        isValidSwap: false,
        newTradeRequiresAcceptance: true,
      })
      expect(reason).toEqual({ kind: 'invalid_swap' })
    })

    it('reports a blocking warning over a token-warning acknowledgement', () => {
      const reason = getSubmitButtonDisableReason({
        ...enabledBase,
        blockingWarning: insufficientFundsWarning,
        shouldDisplayTokenWarningCard: true,
        tokenWarningChecked: false,
      })
      expect(reason).toMatchObject({ kind: 'blocking_warning' })
    })
  })
})
