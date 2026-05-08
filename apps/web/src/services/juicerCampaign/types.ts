import { UniverseChainId } from 'uniswap/src/features/chains/types'

// Campaign condition types
//
// Juicer NFT eligibility requires:
//   1) MIN_SWAPS:    at least 10 swaps on JuiceSwap
//   2) JUSD_SAVINGS: > $5 deposited in JUSD savings
//   3) JUSD_LENDING: > $5 active lending position in JUSD
//
// All three checks happen server-side against the ponder indexer + the
// JUSD savings/lending contracts; the frontend only renders status.
export enum ConditionType {
  MIN_SWAPS = 'min_swaps',
  JUSD_SAVINGS = 'jusd_savings',
  JUSD_LENDING = 'jusd_lending',
}

export const JUICER_MIN_SWAPS = 10
export const JUICER_JUSD_SAVINGS_MIN_USD = 5
export const JUICER_JUSD_LENDING_MIN_USD = 5

export enum ConditionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Single condition
export interface CampaignCondition {
  id: number
  type: ConditionType
  name: string
  description: string
  status: ConditionStatus
  completedAt?: string
  ctaText?: string
  ctaUrl?: string
  icon?: string
}

// Overall campaign progress
export interface JuicerProgress {
  walletAddress: string
  chainId: UniverseChainId
  conditions: CampaignCondition[]
  totalConditions: number
  completedConditions: number
  progress: number // 0-100
  isEligibleForNFT: boolean
  nftMinted: boolean
  nftTokenId?: string
  nftTxHash?: string
  nftMintedAt?: string
}

// NFT Claim request
export interface NFTClaimRequest {
  walletAddress: string
  chainId: UniverseChainId
  signature?: string
}

// Note: SocialVerificationRequest and SocialVerificationResponse types removed
// as they were unused. Twitter uses OAuth redirect flow, Discord uses manual verification.
