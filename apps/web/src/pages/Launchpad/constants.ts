/**
 * Constants for the Launchpad feature
 */

import type { LaunchpadFilterType, LaunchpadSortType } from 'hooks/useLaunchpadTokens'

// All launchpad tokens have a fixed total supply of 1 billion tokens
export const LAUNCHPAD_TOKEN_TOTAL_SUPPLY = 1_000_000_000

export const FILTER_OPTIONS: { value: LaunchpadFilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'graduating', label: 'Graduating Soon' },
  { value: 'graduated', label: 'Graduated' },
]

export const SORT_OPTIONS: { value: LaunchpadSortType; label: string }[] = [
  { value: 'volume', label: 'Volume' },
  { value: 'newest', label: 'Newest' },
  { value: 'trades', label: 'Trades' },
]
