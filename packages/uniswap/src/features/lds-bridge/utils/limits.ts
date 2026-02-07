/**
Calculate the effective maximum for a bridge swap by taking the minimum of:
This ensures users cannot swap more than the actual liquidity available on either side.
returns: The effective maximum amount that can be swapped (in sats)
 */
export function calculateEffectiveBridgeMax(
  pairMaximal: number,
  balanceIn?: number,
  balanceOut?: number,
): number {
  const balances = [balanceIn, balanceOut].filter((b): b is number => b !== undefined)
  return balances.length > 0 ? Math.min(pairMaximal, ...balances) : pairMaximal
}
