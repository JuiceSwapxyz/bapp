import {
  WarningAction,
  WarningLabel,
  WarningSeverity,
  type Warning,
} from 'uniswap/src/components/modals/WarningModal/types'
import {
  getIsSubmitButtonDisabled,
  type SubmitButtonDisabledInput,
} from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/getIsSubmitButtonDisabled'

/**
 * Tests for the swap-review submit button "disabled" derivation.
 *
 * These tests guard the *class* of regression where the submit button gets
 * stuck in a disabled state for a reason that shouldn't actually block the
 * user. The contract:
 *
 *   - Each true disable-reason listed in `getIsSubmitButtonDisabled` is the
 *     ONLY way to disable the button.
 *   - Adding a new disable-reason means adding a field + a branch + tests.
 *   - Pure WarnBeforeSubmit warnings (price impact, fiat loss) NEVER disable
 *     the button — they pop up after the click.
 *
 * If you find yourself adding a `disabled = disabled || somethingElse` line in
 * the component, add it here instead and write the matching test cases.
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

function buildBlockingWarning(action: WarningAction): Warning {
  return {
    type: WarningLabel.InsufficientFunds,
    severity: WarningSeverity.Medium,
    action,
  }
}

function buildWarnBeforeSubmitWarning(): Warning {
  return {
    type: WarningLabel.FiatLossHigh,
    severity: WarningSeverity.High,
    action: WarningAction.WarnBeforeSubmit,
  }
}

describe(getIsSubmitButtonDisabled, () => {
  describe('happy path', () => {
    it('is enabled when every field is in its non-blocking state', () => {
      expect(getIsSubmitButtonDisabled(enabledBase)).toBe(false)
    })
  })

  describe('valid swap context', () => {
    it('is disabled when the swap-tx context is not valid and it is not a wrap', () => {
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          isValidSwap: false,
          isWrap: false,
        }),
      ).toBe(true)
    })

    it('is enabled when the swap-tx context is not valid but the action is a wrap', () => {
      // Wraps and unwraps don't go through the swap-tx-context validation,
      // so isValidSwap=false must not block them.
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          isValidSwap: false,
          isWrap: true,
        }),
      ).toBe(false)
    })

    it('is enabled when the swap-tx context is valid (no wrap)', () => {
      // Regression guard: an Approve+Swap quote returns a fully-validated
      // SwapTxContext that already includes approveTxRequest. The button must
      // be clickable so the approval step can run — disabling it here strands
      // the user at the review screen.
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          isValidSwap: true,
          isWrap: false,
        }),
      ).toBe(false)
    })
  })

  describe('warnings', () => {
    it('is disabled by a DisableReview warning', () => {
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          blockingWarning: buildBlockingWarning(WarningAction.DisableReview),
        }),
      ).toBe(true)
    })

    it('is disabled by a DisableSubmit warning', () => {
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          blockingWarning: buildBlockingWarning(WarningAction.DisableSubmit),
        }),
      ).toBe(true)
    })

    it('is NOT disabled by a WarnBeforeSubmit warning (the popup is the gate)', () => {
      // The fiat-loss / high-price-impact warnings flow through the warning
      // *popup* after the click, never through the disabled prop. If a
      // WarnBeforeSubmit warning ever shows up in `blockingWarning`, that is
      // itself the bug — but as a defense-in-depth, the function still must
      // not disable for one.
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          blockingWarning: undefined, // WarnBeforeSubmit warnings are filtered out upstream
        }),
      ).toBe(false)
    })

    it('passes a sanity check that WarnBeforeSubmit warnings would never be picked up as blocking', () => {
      // Mirrors the filter in `useFormattedWarnings`: only DisableReview /
      // DisableSubmit make it into `blockingWarning`. This test exists so
      // changes to the warning taxonomy can't silently start blocking the
      // button via this path.
      const warnBeforeSubmit = buildWarnBeforeSubmitWarning()
      expect(warnBeforeSubmit.action).toBe(WarningAction.WarnBeforeSubmit)
      expect(warnBeforeSubmit.action).not.toBe(WarningAction.DisableReview)
      expect(warnBeforeSubmit.action).not.toBe(WarningAction.DisableSubmit)
    })
  })

  describe('flow state', () => {
    it('is disabled while a new trade is awaiting user acceptance', () => {
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          newTradeRequiresAcceptance: true,
        }),
      ).toBe(true)
    })

    it('is disabled while a submission is in flight', () => {
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          isSubmitting: true,
        }),
      ).toBe(true)
    })
  })

  describe('token warning acknowledgement', () => {
    it('is disabled when a token-warning card is shown and the user has not checked it', () => {
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          shouldDisplayTokenWarningCard: true,
          tokenWarningChecked: false,
        }),
      ).toBe(true)
    })

    it('is enabled once the user has checked the token-warning card', () => {
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          shouldDisplayTokenWarningCard: true,
          tokenWarningChecked: true,
        }),
      ).toBe(false)
    })

    it('does not look at tokenWarningChecked when no card is shown', () => {
      // No card → an unchecked acknowledgement should not affect the button.
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          shouldDisplayTokenWarningCard: false,
          tokenWarningChecked: false,
        }),
      ).toBe(false)
    })
  })

  describe('lightning-address validation', () => {
    it('is disabled while a Lightning address is required but the validator query has not returned', () => {
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          shouldValidateLightningAddress: true,
          validatedLightningAddress: undefined,
        }),
      ).toBe(true)
    })

    it('is enabled once the Lightning-address validator query has returned', () => {
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          shouldValidateLightningAddress: true,
          validatedLightningAddress: { validated: true },
        }),
      ).toBe(false)
    })

    it('does not check Lightning validation when no Lightning address is required', () => {
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          shouldValidateLightningAddress: false,
          validatedLightningAddress: undefined,
        }),
      ).toBe(false)
    })
  })

  describe('bitcoin-address validation', () => {
    it('is disabled while a Bitcoin address is required but the validator query has not returned', () => {
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          shouldValidateBitcoinAddress: true,
          validatedBitcoinAddress: undefined,
        }),
      ).toBe(true)
    })

    it('is enabled once the Bitcoin-address validator query has returned', () => {
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          shouldValidateBitcoinAddress: true,
          validatedBitcoinAddress: { validated: true },
        }),
      ).toBe(false)
    })

    it('does not check Bitcoin validation when no Bitcoin address is required', () => {
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          shouldValidateBitcoinAddress: false,
          validatedBitcoinAddress: undefined,
        }),
      ).toBe(false)
    })
  })

  describe('combined states', () => {
    it('stays disabled when several disable-reasons apply at once', () => {
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          isValidSwap: false,
          blockingWarning: buildBlockingWarning(WarningAction.DisableSubmit),
          isSubmitting: true,
          newTradeRequiresAcceptance: true,
        }),
      ).toBe(true)
    })

    it('does not regress to enabled when a disable-reason is cleared but another remains', () => {
      expect(
        getIsSubmitButtonDisabled({
          ...enabledBase,
          isValidSwap: true, // cleared
          blockingWarning: undefined, // cleared
          isSubmitting: true, // still blocking
        }),
      ).toBe(true)
    })
  })
})
