import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ConditionStatus, ConditionType, FirstSqueezerProgress, NFTClaimRequest, NFTClaimResponse } from './types'

// API base URL - same as routing/swap API
const API_BASE_URL =
  process.env.REACT_APP_TRADING_API_URL_OVERRIDE ||
  process.env.REACT_APP_UNISWAP_GATEWAY_DNS ||
  'https://api.juiceswap.xyz'

// Citrea Testnet Chain ID
const CITREA_TESTNET_CHAIN_ID = 5115

// First Squeezer NFT Contract ABI (minimal - only claim function)
const FIRST_SQUEEZER_NFT_ABI = [
  {
    inputs: [{ internalType: 'bytes', name: 'signature', type: 'bytes' }],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'hasClaimed',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'claimer', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'NFTClaimed',
    type: 'event',
  },
] as const

class FirstSqueezerCampaignAPI {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  /**
   * Get campaign progress for a wallet address
   * Fetches all verification statuses from API endpoints only
   */
  async getProgress(walletAddress: string, chainId: UniverseChainId): Promise<FirstSqueezerProgress> {
    // Fetch all statuses in parallel from API
    const [twitterStatus, discordStatus, bAppsStatus] = await Promise.allSettled([
      this.getTwitterStatus(walletAddress),
      this.getDiscordStatus(walletAddress),
      this.getBAppsStatus(walletAddress),
    ])

    // Extract Twitter status
    const twitterData = twitterStatus.status === 'fulfilled' ? twitterStatus.value : null
    const twitterVerified = twitterData?.verified || false
    const twitterUsername = twitterData?.username || null
    const twitterVerifiedAt = twitterData?.verifiedAt || undefined

    // Extract Discord status
    const discordData = discordStatus.status === 'fulfilled' ? discordStatus.value : null
    const discordVerified = discordData?.verified || false
    const discordUsername = discordData?.username || null
    const discordVerifiedAt = discordData?.verifiedAt || undefined

    // Extract bApps status
    const bAppsData = bAppsStatus.status === 'fulfilled' ? bAppsStatus.value : null
    const bAppsCompleted = bAppsData?.completedTasks === 3
    const nftClaimed = bAppsData?.nftClaimed || false
    const nftTxHash = bAppsData?.claimTxHash || undefined

    // Log any errors
    if (twitterStatus.status === 'rejected') {
      console.warn('Failed to fetch Twitter status:', twitterStatus.reason)
    }
    if (discordStatus.status === 'rejected') {
      console.warn('Failed to fetch Discord status:', discordStatus.reason)
    }
    if (bAppsStatus.status === 'rejected') {
      console.warn('Failed to fetch bApps status:', bAppsStatus.reason)
    }

    // Build conditions
    const conditions = [
      {
        id: 1,
        type: ConditionType.BAPPS_COMPLETED,
        name: 'Complete ₿apps Campaign',
        description: 'Complete all 3 swap tasks in the Citrea ₿apps Campaign',
        status: bAppsCompleted ? ConditionStatus.COMPLETED : ConditionStatus.PENDING,
        completedAt: bAppsCompleted && bAppsData?.tasks?.[2]?.completedAt ? bAppsData.tasks[2].completedAt : undefined,
        ctaText: 'View Campaign',
        ctaUrl: '/bapps',
      },
      {
        id: 2,
        type: ConditionType.TWITTER_FOLLOW,
        name: 'Follow @JuiceSwap_com on X',
        description:
          twitterVerified && twitterUsername
            ? `Verified as @${twitterUsername}`
            : 'Sign in with Twitter and follow @JuiceSwap_com',
        status: twitterVerified ? ConditionStatus.COMPLETED : ConditionStatus.PENDING,
        completedAt: twitterVerifiedAt,
        ctaText: twitterVerified ? 'Verified' : 'Verify with Twitter',
        icon: '🐦',
      },
      {
        id: 3,
        type: ConditionType.DISCORD_JOIN,
        name: 'Verify Discord Account',
        description:
          discordVerified && discordUsername
            ? `Verified as ${discordUsername}`
            : 'Sign in with Discord to verify your account',
        status: discordVerified ? ConditionStatus.COMPLETED : ConditionStatus.PENDING,
        completedAt: discordVerifiedAt,
        ctaText: discordVerified ? 'Verified' : 'Verify with Discord',
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
      nftTokenId: undefined, // Token ID will be extracted from event after claiming
      nftTxHash,
    }
  }

  /**
   * Start Twitter OAuth flow
   * Returns authorization URL to open in popup
   */
  async startTwitterOAuth(walletAddress: string): Promise<{ authUrl: string; state: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/campaigns/first-squeezer/twitter/start?walletAddress=${encodeURIComponent(walletAddress)}`,
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
        `${this.baseUrl}/v1/campaigns/first-squeezer/twitter/status?walletAddress=${encodeURIComponent(walletAddress)}`,
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
   * Start Discord OAuth flow
   * Returns authorization URL to redirect to
   */
  async startDiscordOAuth(walletAddress: string): Promise<{ authUrl: string; state: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/campaigns/first-squeezer/discord/start?walletAddress=${encodeURIComponent(walletAddress)}`,
      )

      if (!response.ok) {
        throw new Error(`Failed to start Discord OAuth: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to start Discord OAuth')
    }
  }

  /**
   * Get Discord verification status
   * Returns whether wallet has verified Discord and username
   */
  async getDiscordStatus(walletAddress: string): Promise<{
    verified: boolean
    username: string | null
    verifiedAt: string | null
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/campaigns/first-squeezer/discord/status?walletAddress=${encodeURIComponent(walletAddress)}`,
      )

      if (!response.ok) {
        throw new Error(`Failed to get Discord status: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get Discord status')
    }
  }

  /**
   * Get bApps campaign completion status
   * Returns swap progress and NFT claim status from Ponder (via API proxy)
   */
  async getBAppsStatus(walletAddress: string): Promise<{
    walletAddress: string
    chainId: number
    tasks: Array<{
      id: number
      name: string
      description: string
      completed: boolean
      completedAt: string | null
      txHash: string | null
    }>
    totalTasks: number
    completedTasks: number
    progress: number
    nftClaimed: boolean
    claimTxHash: string | null
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/campaigns/first-squeezer/bapps/status?walletAddress=${encodeURIComponent(walletAddress)}`,
      )

      if (!response.ok) {
        throw new Error(`Failed to get bApps status: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get bApps status')
    }
  }

  /**
   * Get NFT claim signature
   * Returns signature that can be used to claim NFT on-chain
   * Only succeeds if all campaign requirements are met
   */
  async getNFTSignature(walletAddress: string): Promise<{
    signature: string
    contractAddress: string
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/campaigns/first-squeezer/nft/signature?walletAddress=${encodeURIComponent(walletAddress)}`,
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to get NFT signature: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get NFT signature')
    }
  }

  /**
   * Claim NFT on-chain
   * Uses backend signature and calls smart contract via wagmi
   */
  async claimNFT(
    request: NFTClaimRequest,
    contractInteraction: (signature: string, contractAddress: string) => Promise<string>,
  ): Promise<NFTClaimResponse> {
    const { walletAddress } = request

    try {
      // Step 1: Get signature from backend API
      const { signature, contractAddress } = await this.getNFTSignature(walletAddress)

      // Step 2: Call smart contract via wagmi (passed from hook)
      const txHash = await contractInteraction(signature, contractAddress)

      // Step 3: Return success (Ponder will index the NFTClaimed event)
      return {
        success: true,
        txHash,
        tokenId: undefined, // Will be available after indexing
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'NFT claim failed',
      }
    }
  }
}

// Export singleton instance
export const firstSqueezerCampaignAPI = new FirstSqueezerCampaignAPI()

// Export contract ABI for use in hooks
export { FIRST_SQUEEZER_NFT_ABI }
