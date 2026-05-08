import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Juicer NFT eligibility model
 * ----------------------------
 *
 * The user trades **JUICER_JP_COST** Juice Points for the right to mint
 * the Juicer NFT. There is exactly one condition (JP balance), so the
 * UI surfaces a single "Trade 5000 JP" interaction rather than a list
 * of unrelated tasks.
 *
 * Flow:
 *  1) Frontend reads `available_jp` from the API
 *     (= total earned JP − previously spent JP, tracked server-side).
 *  2) If `available_jp >= JUICER_JP_COST`, the "Trade" button is enabled.
 *  3) On press, the API atomically records a 5000-JP spend for this
 *     wallet and returns a backend signature. Until that succeeds, no
 *     JP is deducted.
 *  4) Frontend submits the signature to `JuicerNFT.claim(...)`.
 *  5) After confirmation, the API's recorded spend persists, so the
 *     wallet's JP balance shown in the drawer / leaderboard reflects
 *     the deduction going forward.
 *
 * Hard dependency: the JP system itself ships in
 *   - JuiceSwapxyz/ponder#138  (fixes /points 500 errors)
 *   - JuiceSwapxyz/bapp#740    (frontend always hits the real API)
 * This Juicer flow cannot ship before both of those land.
 */
export const JUICER_JP_COST = 5000

export enum ConditionType {
  JP_BALANCE = 'jp_balance',
}

export enum ConditionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Single condition (kept as an array for forward-compat with the
// FirstSqueezer-shaped UI; today there is exactly one entry).
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

  // JP economics
  availableJp: number
  totalEarnedJp: number
  spentJp: number
  cost: number // = JUICER_JP_COST, surfaced here so the API can override per-campaign

  // Eligibility / claim state
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
