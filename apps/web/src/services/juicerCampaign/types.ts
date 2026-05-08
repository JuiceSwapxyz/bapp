import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Juicer NFT eligibility — 3 sequential conditions (in display order):
 *
 *   1. JP_BALANCE     — trade `JUICER_JP_COST` Juice Points (must be done first)
 *   2. TWITTER_FOLLOW — follow @JuiceSwap_com on X (verified via backend)
 *   3. DISCORD_JOIN   — join the JuiceSwap Discord and pick up the Juicer role
 *
 * After all three are completed the user can claim the on-chain NFT
 * via `JuicerNFT.claim(signature)` using a backend-issued signature.
 *
 * Hard dependency: the JP system itself ships in
 *   - JuiceSwapxyz/ponder#138 (fixes /points 500 errors)
 *   - JuiceSwapxyz/bapp#740   (frontend always hits the real API)
 * This Juicer flow cannot ship before both of those land.
 */
export const JUICER_JP_COST = 5000

export enum ConditionType {
  JP_BALANCE = 'jp_balance',
  TWITTER_FOLLOW = 'twitter_follow',
  DISCORD_JOIN = 'discord_join',
}

export enum ConditionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

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

export interface JuicerProgress {
  walletAddress: string
  chainId: UniverseChainId

  // JP economics (from API; available = totalEarnedJp - spentJp)
  availableJp: number
  totalEarnedJp: number
  spentJp: number
  cost: number

  // Conditions in display order: JP first, then social
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

export interface NFTClaimRequest {
  walletAddress: string
  chainId: UniverseChainId
  signature?: string
}
