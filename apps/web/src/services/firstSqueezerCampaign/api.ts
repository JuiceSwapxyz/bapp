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
   * Get campaign progress for a wallet address from API
   */
  async getProgress(walletAddress: string, chainId: UniverseChainId): Promise<FirstSqueezerProgress> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/campaign/first-squeezer/progress?address=${walletAddress}&chainId=${chainId}`,
      )

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to fetch campaign progress:', error)
      // Fallback to mock data for development
      return this.getMockProgress(walletAddress, chainId)
    }
  }

  /**
   * Fallback mock data (for development when API is unavailable)
   */
  private getMockProgress(walletAddress: string, chainId: UniverseChainId): FirstSqueezerProgress {
    const twitterVerified = this.getLocalVerification('twitter')
    const discordVerified = this.getLocalVerification('discord')
    const nftClaimed = this.getLocalNFTStatus()

    const conditions = [
      {
        id: 1,
        type: ConditionType.BAPPS_COMPLETED,
        name: 'Complete ₿apps Campaign',
        description: 'Complete all 3 swap tasks in the Citrea ₿apps Campaign',
        status: ConditionStatus.PENDING,
        ctaText: 'View Campaign',
        ctaUrl: '/bapps',
      },
      {
        id: 2,
        type: ConditionType.TWITTER_FOLLOW,
        name: 'Follow JuiceSwap on X',
        description: 'Follow @JuiceSwap_com on X (Twitter)',
        status: twitterVerified ? ConditionStatus.COMPLETED : ConditionStatus.PENDING,
        completedAt: twitterVerified ? new Date().toISOString() : undefined,
        ctaText: 'Follow on X',
        ctaUrl: 'https://x.com/JuiceSwap_com',
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
   * Start Twitter OAuth flow - redirects user to Twitter for authorization
   */
  async startTwitterOAuth(walletAddress: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/campaign/first-squeezer/twitter/auth?address=${walletAddress}`)

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }

      const { url, state } = await response.json()

      // Store state for verification
      localStorage.setItem('twitter_oauth_state', state)
      localStorage.setItem('twitter_oauth_address', walletAddress)

      // Redirect to Twitter OAuth
      window.location.href = url
    } catch (error) {
      console.error('Failed to start Twitter OAuth:', error)
      throw new Error('Failed to initiate Twitter verification')
    }
  }

  /**
   * Complete Twitter OAuth flow after callback
   * Should be called from the callback page/component
   */
  async completeTwitterOAuth(code: string, state: string, walletAddress: string): Promise<SocialVerificationResponse> {
    try {
      // Verify state matches stored state
      const storedState = localStorage.getItem('twitter_oauth_state')
      const storedAddress = localStorage.getItem('twitter_oauth_address')

      if (storedState !== state || storedAddress !== walletAddress) {
        throw new Error('OAuth state mismatch')
      }

      // Call backend to complete OAuth
      const response = await fetch(`${this.baseUrl}/v1/campaign/first-squeezer/verify/twitter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: walletAddress,
          code,
          state,
        }),
      })

      const data = await response.json()

      // Clean up stored OAuth data
      localStorage.removeItem('twitter_oauth_state')
      localStorage.removeItem('twitter_oauth_address')

      if (!data.success || !data.verified) {
        return {
          success: false,
          verified: false,
          error: data.error || 'You must follow @JuiceSwap_com to complete this task',
        }
      }

      return {
        success: true,
        verified: true,
        username: data.user?.username,
      }
    } catch (error) {
      console.error('Failed to complete Twitter OAuth:', error)
      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      }
    }
  }

  /**
   * Verify social media connection
   * For Twitter: Starts OAuth flow
   * For Discord: TODO - implement Discord OAuth
   */
  async verifySocial(request: SocialVerificationRequest): Promise<SocialVerificationResponse> {
    const { walletAddress, type, code, state } = request

    if (type === 'twitter') {
      // If we have a code and state, we're completing the OAuth flow
      if (code && state) {
        return this.completeTwitterOAuth(code, state, walletAddress)
      }

      // Otherwise, start the OAuth flow
      await this.startTwitterOAuth(walletAddress)

      // Return pending status (user will be redirected)
      return {
        success: true,
        verified: false,
        error: 'Redirecting to Twitter...',
      }
    }

    // Discord - fallback to mock for now
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      this.storeLocalVerification(type, walletAddress)

      return {
        success: true,
        verified: true,
        username: 'DiscordUser#1234',
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
   * Manual verification
   * For Twitter: Starts OAuth flow
   * For Discord: Stores local verification (OAuth not yet implemented)
   */
  async manualVerify(type: 'twitter' | 'discord', walletAddress: string): Promise<void> {
    if (type === 'twitter') {
      // Start Twitter OAuth flow
      await this.startTwitterOAuth(walletAddress)
    } else {
      // Discord - fallback to localStorage for now
      this.storeLocalVerification(type, walletAddress)
    }
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
