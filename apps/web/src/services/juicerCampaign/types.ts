import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Juicer NFT eligibility — 4 conditions (in display order):
 *
 *   1. JP_BALANCE         — trade `JUICER_JP_COST` Juice Points (do this first)
 *   2. MEME_TOKEN_CREATED — create a meme token on JuiceSwap launchpad
 *                           (Citrea Mainnet only; one-time 500 JP bonus
 *                           toward JUICER_JP_COST)
 *   3. TWITTER_FOLLOW     — follow @JuiceSwap_com on X (verified via backend)
 *   4. DISCORD_JOIN       — join the JuiceSwap Discord and pick up the Juicer role
 *
 * After all four are completed the user can claim the on-chain NFT
 * via `JuicerNFT.claim(signature)` using a backend-issued signature.
 *
 * Hard dependency: the JP system itself ships in
 *   - JuiceSwapxyz/ponder#139 (correctness fixes + meme-token bonus)
 *   - JuiceSwapxyz/api        (campaign backend exposes memeTokenCreated)
 * This Juicer flow cannot ship before both of those land.
 */
export const JUICER_JP_COST = 10_000

export enum ConditionType {
  JP_BALANCE = 'jp_balance',
  MEME_TOKEN_CREATED = 'meme_token_created',
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
