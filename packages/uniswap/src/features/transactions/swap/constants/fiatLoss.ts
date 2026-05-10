// Single source of truth for USD-value-loss thresholds (output USD vs. input USD).
//
// Two tiers, both purely about "the dollar value going out is materially less
// than the dollar value going in":
//
//   - WARN: orange-tinted UI signal on the swap form ("you are losing some value")
//   - CRITICAL: red-tinted UI signal AND a confirm-popup before submit
//                ("you are losing a lot of value — confirm or back out")
//
// At CRITICAL the user is never blocked — they can always confirm and proceed.
export const FIAT_LOSS_WARN_PERCENT = 5
export const FIAT_LOSS_CRITICAL_PERCENT = 10
