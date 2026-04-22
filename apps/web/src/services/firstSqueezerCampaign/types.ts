import { UniverseChainId } from 'uniswap/src/features/chains/types'

// Campaign condition types
export enum ConditionType {
  BAPPS_COMPLETED = 'bapps_completed',
  TWITTER_FOLLOW = 'twitter_follow',
  DISCORD_JOIN = 'discord_join',
}

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
export interface FirstSqueezerProgress {
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
  // Gate for mainnet claim: only wallets that ran claim() on the testnet
  // First Squeezer NFT are eligible. `null` = couldn't verify (backend 503);
  // UI treats null as "unknown — show no banner, let backend 403 on claim".
  eligibleForMainnet: boolean | null
}

// NFT Claim request
export interface NFTClaimRequest {
  walletAddress: string
  chainId: UniverseChainId
  signature?: string
}

// NFT Claim response
export interface NFTClaimResponse {
  success: boolean
  txHash?: string
  tokenId?: string
  error?: string
}

// Note: SocialVerificationRequest and SocialVerificationResponse types removed
// as they were unused. Twitter uses OAuth redirect flow, Discord uses manual verification.
