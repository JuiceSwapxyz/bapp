import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  ConditionStatus,
  ConditionType,
  FirstSqueezerProgress,
  NFTClaimRequest,
  NFTClaimResponse,
} from './types'

// API base URL - same as routing/swap API
const API_BASE_URL =
  process.env.REACT_APP_TRADING_API_URL_OVERRIDE ||
  process.env.REACT_APP_UNISWAP_GATEWAY_DNS ||
  'https://api.juiceswap.xyz'

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
   * Fetches real Twitter status from backend, uses localStorage for Discord/NFT
   */
  async getProgress(walletAddress: string, chainId: UniverseChainId): Promise<FirstSqueezerProgress> {
    // Fetch Twitter verification status from backend
    let twitterStatus = null
    try {
      twitterStatus = await this.getTwitterStatus(walletAddress)
    } catch (error) {
      console.warn('Failed to fetch Twitter status:', error)
    }

    const twitterVerified = twitterStatus?.verified || false
    const twitterUsername = twitterStatus?.username || null
    const twitterVerifiedAt = twitterStatus?.verifiedAt || undefined

    // Discord still uses localStorage (TODO: implement Discord OAuth)
    const discordVerified = this.getLocalVerification('discord')

    // NFT claim status from localStorage
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
        name: 'Verify Twitter Account',
        description: twitterVerified && twitterUsername
          ? `Verified as @${twitterUsername}`
          : 'Sign in with Twitter to verify your account',
        status: twitterVerified ? ConditionStatus.COMPLETED : ConditionStatus.PENDING,
        completedAt: twitterVerifiedAt,
        ctaText: twitterVerified ? 'Verified' : 'Verify with Twitter',
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
   * Start Twitter OAuth flow
   * Returns authorization URL to open in popup
   */
  async startTwitterOAuth(walletAddress: string): Promise<{ authUrl: string; state: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/campaigns/first-squeezer/twitter/start?walletAddress=${encodeURIComponent(walletAddress)}`
      )

      if (!response.ok) {
        throw new Error(`Failed to start Twitter OAuth: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to start Twitter OAuth')
    }
  }

  /**
   * Get Twitter verification status
   * Returns whether wallet has verified Twitter and username
   */
  async getTwitterStatus(walletAddress: string): Promise<{
    verified: boolean
    username: string | null
    verifiedAt: string | null
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/campaigns/first-squeezer/twitter/status?walletAddress=${encodeURIComponent(walletAddress)}`
      )

      if (!response.ok) {
        throw new Error(`Failed to get Twitter status: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get Twitter status')
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
   * Manual verification for Discord
   * Twitter now uses OAuth flow
   */
  manualVerifyDiscord(walletAddress: string): void {
    this.storeLocalVerification('discord', walletAddress)
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
