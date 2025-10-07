import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  ConditionStatus,
  ConditionType,
  FirstSqueezerProgress,
  NFTClaimRequest,
  NFTClaimResponse,
  SocialVerificationRequest,
  SocialVerificationResponse,
} from './types'

// API base URL - will be configured later
const API_BASE_URL = process.env.REACT_APP_JUICESWAP_API_URL || 'https://dev.api.juiceswap.com'

// LocalStorage keys for temporary verification status
const STORAGE_KEYS = {
  TWITTER_VERIFIED: 'first_squeezer_twitter_verified',
  DISCORD_VERIFIED: 'first_squeezer_discord_verified',
  NFT_CLAIMED: 'first_squeezer_nft_claimed',
} as const

class FirstSqueezerCampaignAPI {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  /**
   * Get campaign progress for a wallet address
   * Currently uses localStorage + bApps progress check
   * Will be replaced with actual API call later
   */
  async getProgress(walletAddress: string, chainId: UniverseChainId): Promise<FirstSqueezerProgress> {
    // For now, return mock data with localStorage state
    // TODO: Replace with actual API call when backend is ready
    const twitterVerified = this.getLocalVerification('twitter')
    const discordVerified = this.getLocalVerification('discord')
    const nftClaimed = this.getLocalNFTStatus()

    // We'll check bApps completion in the hook layer
    const conditions = [
      {
        id: 1,
        type: ConditionType.BAPPS_COMPLETED,
        name: 'Complete ₿apps Campaign',
        description: 'Complete all 3 swap tasks in the Citrea ₿apps Campaign',
        status: ConditionStatus.PENDING, // Will be updated by hook
        ctaText: 'View Campaign',
        ctaUrl: '/bapps',
      },
      {
        id: 2,
        type: ConditionType.TWITTER_FOLLOW,
        name: 'Follow JuiceSwap on X',
        description: 'Follow @JuiceSwap on X (Twitter)',
        status: twitterVerified ? ConditionStatus.COMPLETED : ConditionStatus.PENDING,
        completedAt: twitterVerified ? new Date().toISOString() : undefined,
        ctaText: 'Follow on X',
        ctaUrl: 'https://x.com/JuiceSwap',
        icon: '🐦',
      },
      {
        id: 3,
        type: ConditionType.DISCORD_JOIN,
        name: 'Join JuiceSwap Discord',
        description: 'Join the JuiceSwap Discord community',
        status: discordVerified ? ConditionStatus.COMPLETED : ConditionStatus.PENDING,
        completedAt: discordVerified ? new Date().toISOString() : undefined,
        ctaText: 'Join Discord',
        ctaUrl: 'https://discord.gg/juiceswap',
        icon: '💬',
      },
    ]

    const completedConditions = conditions.filter((c) => c.status === ConditionStatus.COMPLETED).length
    const progress = (completedConditions / conditions.length) * 100
    const isEligibleForNFT = completedConditions === conditions.length && !nftClaimed

    return {
      walletAddress,
      chainId,
      conditions,
      totalConditions: conditions.length,
      completedConditions,
      progress,
      isEligibleForNFT,
      nftMinted: nftClaimed,
      nftTokenId: nftClaimed ? this.getLocalNFTTokenId() : undefined,
      nftTxHash: nftClaimed ? this.getLocalNFTTxHash() : undefined,
    }
  }

  /**
   * Verify social media connection
   * Currently uses localStorage for mock verification
   * TODO: Replace with OAuth flow when backend is ready
   */
  async verifySocial(request: SocialVerificationRequest): Promise<SocialVerificationResponse> {
    // Mock verification - just store in localStorage
    // TODO: Replace with actual API call + OAuth
    const { walletAddress, type } = request

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Store verification
      this.storeLocalVerification(type, walletAddress)

      return {
        success: true,
        verified: true,
        username: type === 'twitter' ? '@JuiceSwapUser' : 'DiscordUser#1234',
      }
    } catch (error) {
      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      }
    }
  }

  /**
   * Claim NFT
   * Currently uses localStorage for mock claim
   * TODO: Replace with actual contract interaction when backend is ready
   */
  async claimNFT(request: NFTClaimRequest): Promise<NFTClaimResponse> {
    // Mock NFT claim
    // TODO: Replace with actual NFT minting transaction
    const { walletAddress } = request

    try {
      // Simulate transaction delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate mock transaction hash and token ID
      const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`
      const mockTokenId = Math.floor(Math.random() * 10000).toString()

      // Store in localStorage
      this.storeLocalNFTClaim(walletAddress, mockTxHash, mockTokenId)

      return {
        success: true,
        txHash: mockTxHash,
        tokenId: mockTokenId,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'NFT claim failed',
      }
    }
  }

  /**
   * Manual verification (for now)
   * User clicks "I've followed/joined" button
   */
  manualVerify(type: 'twitter' | 'discord', walletAddress: string): void {
    this.storeLocalVerification(type, walletAddress)
  }

  /**
   * Clear all local progress (for testing)
   */
  clearLocalProgress(walletAddress: string): void {
    localStorage.removeItem(`${STORAGE_KEYS.TWITTER_VERIFIED}_${walletAddress}`)
    localStorage.removeItem(`${STORAGE_KEYS.DISCORD_VERIFIED}_${walletAddress}`)
    localStorage.removeItem(`${STORAGE_KEYS.NFT_CLAIMED}_${walletAddress}`)
  }

  // Private helper methods for localStorage
  private getLocalVerification(type: 'twitter' | 'discord'): boolean {
    const key = type === 'twitter' ? STORAGE_KEYS.TWITTER_VERIFIED : STORAGE_KEYS.DISCORD_VERIFIED
    return localStorage.getItem(key) === 'true'
  }

  private storeLocalVerification(type: 'twitter' | 'discord', walletAddress: string): void {
    const key = type === 'twitter' ? STORAGE_KEYS.TWITTER_VERIFIED : STORAGE_KEYS.DISCORD_VERIFIED
    localStorage.setItem(key, 'true')
    localStorage.setItem(`${key}_address`, walletAddress)
    localStorage.setItem(`${key}_timestamp`, new Date().toISOString())
  }

  private getLocalNFTStatus(): boolean {
    return localStorage.getItem(STORAGE_KEYS.NFT_CLAIMED) === 'true'
  }

  private getLocalNFTTokenId(): string | undefined {
    return localStorage.getItem(`${STORAGE_KEYS.NFT_CLAIMED}_tokenId`) || undefined
  }

  private getLocalNFTTxHash(): string | undefined {
    return localStorage.getItem(`${STORAGE_KEYS.NFT_CLAIMED}_txHash`) || undefined
  }

  private storeLocalNFTClaim(walletAddress: string, txHash: string, tokenId: string): void {
    localStorage.setItem(STORAGE_KEYS.NFT_CLAIMED, 'true')
    localStorage.setItem(`${STORAGE_KEYS.NFT_CLAIMED}_address`, walletAddress)
    localStorage.setItem(`${STORAGE_KEYS.NFT_CLAIMED}_txHash`, txHash)
    localStorage.setItem(`${STORAGE_KEYS.NFT_CLAIMED}_tokenId`, tokenId)
    localStorage.setItem(`${STORAGE_KEYS.NFT_CLAIMED}_timestamp`, new Date().toISOString())
  }
}

// Export singleton instance
export const firstSqueezerCampaignAPI = new FirstSqueezerCampaignAPI()
