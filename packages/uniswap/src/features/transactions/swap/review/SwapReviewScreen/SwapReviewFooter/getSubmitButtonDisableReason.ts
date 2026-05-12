import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import type { SubmitButtonDisabledInput } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/getIsSubmitButtonDisabled'

/**
 * Discriminated reason the submit button is disabled. Whichever branch fires
 * here, the UI must surface a corresponding user-facing message — a silent
 * grey button with no explanation is a UX bug.
 */
export type SubmitButtonDisableReason =
  | { kind: 'invalid_swap' }
  | { kind: 'blocking_warning'; warning: Warning }
  | { kind: 'new_trade_requires_acceptance' }
  | { kind: 'is_submitting' }
  | { kind: 'token_warning_unchecked' }
  | { kind: 'lightning_address_invalid' }
  | { kind: 'bitcoin_address_invalid' }

/**
 * Returns the *reason* the submit button is disabled, or `null` when it is
 * enabled. Mirrors the same checks as `getIsSubmitButtonDisabled`, but exposes
 * a structured reason so the UI can render an explanation alongside the
 * disabled button.
 *
 * Order of precedence: technical impossibilities first (no quote, blocking
 * warning, in-flight submission), then user actions still required. Higher
 * branches win because they would render any later message confusing —
 * e.g. "Accept new price" makes no sense while the quote itself is still
 * loading.
 */
export function getSubmitButtonDisableReason(input: SubmitButtonDisabledInput): SubmitButtonDisableReason | null {
  const {
    isValidSwap,
    isWrap,
    blockingWarning,
    newTradeRequiresAcceptance,
    isSubmitting,
    shouldDisplayTokenWarningCard,
    tokenWarningChecked,
    shouldValidateLightningAddress,
    validatedLightningAddress,
    shouldValidateBitcoinAddress,
    validatedBitcoinAddress,
  } = input

  if (!isValidSwap && !isWrap) {
    return { kind: 'invalid_swap' }
  }
  if (blockingWarning) {
    return { kind: 'blocking_warning', warning: blockingWarning }
  }
  if (isSubmitting) {
    return { kind: 'is_submitting' }
  }
  if (newTradeRequiresAcceptance) {
    return { kind: 'new_trade_requires_acceptance' }
  }
  if (shouldDisplayTokenWarningCard && !tokenWarningChecked) {
    return { kind: 'token_warning_unchecked' }
  }
  if (shouldValidateLightningAddress && !validatedLightningAddress?.validated) {
    return { kind: 'lightning_address_invalid' }
  }
  if (shouldValidateBitcoinAddress && !validatedBitcoinAddress?.validated) {
    return { kind: 'bitcoin_address_invalid' }
  }
  return null
}
