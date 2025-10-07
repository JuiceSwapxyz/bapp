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

// Social verification request
export interface SocialVerificationRequest {
  walletAddress: string
  type: 'twitter' | 'discord'
  code?: string // OAuth code
  state?: string // OAuth state
}

// Social verification response
export interface SocialVerificationResponse {
  success: boolean
  verified: boolean
  username?: string
  error?: string
}
