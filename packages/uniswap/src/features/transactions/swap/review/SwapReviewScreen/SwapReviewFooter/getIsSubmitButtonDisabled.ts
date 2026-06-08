import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { getSubmitButtonDisableReason } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/getSubmitButtonDisableReason'

/**
 * Pure inputs that decide whether the swap review submit button is disabled.
 *
 * Kept as a flat record (instead of pulling from stores directly) so the rule
 * can be unit-tested in isolation. Whatever the screen renders must derive its
 * `disabled` prop from this function — adding a new disable-reason means adding
 * a field here and a branch in `getIsSubmitButtonDisabled`, plus the matching
 * test cases.
 */
export interface SubmitButtonDisabledInput {
  /** Result of `isValidSwapTxContext(swapTxContext)`. */
  isValidSwap: boolean
  /** Whether the current action is a wrap/unwrap (those skip swap-tx validation). */
  isWrap: boolean
  /** Warning whose `action` is `DisableReview` or `DisableSubmit`. */
  blockingWarning: Warning | undefined
  /** True when the displayed quote drifted enough that the user must re-accept it. */
  newTradeRequiresAcceptance: boolean
  /** True after the user has clicked submit and the flow is in flight. */
  isSubmitting: boolean
  /** Whether a token-protection card with High severity is currently shown. */
  shouldDisplayTokenWarningCard: boolean
  /** Whether the user has acknowledged the token-protection card. */
  tokenWarningChecked: boolean
  /** Whether a Lightning address must be validated before submitting. */
  shouldValidateLightningAddress: boolean
  /** Result of the Lightning-address validation query (undefined while loading). */
  validatedLightningAddress: { validated: boolean } | undefined
  /** Whether a Bitcoin address must be validated before submitting. */
  shouldValidateBitcoinAddress: boolean
  /** Result of the Bitcoin-address validation query (undefined while loading). */
  validatedBitcoinAddress: { validated: boolean } | undefined
}

/**
 * Returns true when the swap review submit button should be disabled.
 *
 * Important contract for this function: a `WarnBeforeSubmit` warning is *not*
 * a disable reason — the user must always be able to click through so the
 * confirm-popup can show. Only `DisableReview` / `DisableSubmit` warnings show
 * up here via `blockingWarning`.
 *
 * Delegates to `getSubmitButtonDisableReason` so the boolean rule and the
 * structured-reason rule can never disagree — adding a new disable cause in
 * one place updates both.
 */
export function getIsSubmitButtonDisabled(input: SubmitButtonDisabledInput): boolean {
  return getSubmitButtonDisableReason(input) !== null
}
