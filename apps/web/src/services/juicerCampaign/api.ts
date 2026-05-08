import {
  CampaignCondition,
  ConditionStatus,
  ConditionType,
  JUICER_JP_COST,
  JuicerProgress,
} from 'services/juicerCampaign/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Sentinel error thrown when the backend has not yet enabled the campaign
 * (404 from /progress). Surfaces as an empty preview, not a scary error.
 */
export class JuicerCampaignNotReadyError extends Error {
  constructor() {
    super('Juicer campaign endpoint not available yet')
    this.name = 'JuicerCampaignNotReadyError'
  }
}

const API_BASE_URL =
  process.env.REACT_APP_TRADING_API_URL_OVERRIDE ||
  process.env.REACT_APP_UNISWAP_GATEWAY_DNS ||
  'https://api.juiceswap.com'

/**
 * Minimal ABI for `JuicerNFT.sol` (signature-based claim, mirror of
 * FirstSqueezerNFT). Only the surface the frontend touches is included.
 */
export const JUICER_NFT_ABI = [
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

/**
 * Backend response for GET /v1/campaigns/juicer/progress
 * The backend builds the canonical condition list; we surface it as-is
 * but supplement with sane defaults if a field is missing.
 */
interface ProgressApiResponse {
  walletAddress: string
  chainId: UniverseChainId
  availableJp: number
  totalEarnedJp: number
  spentJp: number
  cost?: number
  jpSpent: boolean
  twitterVerified: boolean
  twitterVerifiedAt?: string | null
  discordVerified: boolean
  discordVerifiedAt?: string | null
  isEligibleForNFT: boolean
  nftMinted: boolean
  nftTokenId?: string
  nftTxHash?: string
  nftMintedAt?: string
}

interface SpendApiResponse {
  spentJp: number
  remainingJp: number
}

interface SignatureApiResponse {
  signature: string
  contractAddress: string
}

class JuicerCampaignAPI {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  /** Read full Juicer progress (JP economics + social verification + claim state). */
  async getProgress(walletAddress: string, chainId: UniverseChainId): Promise<JuicerProgress> {
    const url = `${this.baseUrl}/v1/campaigns/juicer/progress?walletAddress=${encodeURIComponent(
      walletAddress,
    )}&chainId=${chainId}`
    const res = await fetch(url)
    if (res.status === 404) {
      throw new JuicerCampaignNotReadyError()
    }
    if (!res.ok) {
      throw new Error(`getProgress failed: HTTP ${res.status}`)
    }
    const raw = (await res.json()) as ProgressApiResponse
    return rawToProgress(raw)
  }

  /**
   * Step 1: trade JUICER_JP_COST JP for the right to claim.
   * Atomic and idempotent: a retried POST returns the original spend record
   * without deducting JP twice. Until /spend has been called, /signature
   * will refuse to issue a signature even with the social conditions met.
   */
  async spendJp(walletAddress: string, chainId: UniverseChainId): Promise<SpendApiResponse> {
    const res = await fetch(`${this.baseUrl}/v1/campaigns/juicer/spend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, chainId }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`spendJp failed: HTTP ${res.status} ${detail}`)
    }
    return (await res.json()) as SpendApiResponse
  }

  /** Step 2: opens the X follow intent (handled in the hook) and asks the backend to mark this wallet as Twitter-verified. */
  async markTwitterFollowed(walletAddress: string): Promise<{ success: boolean; verifiedAt: string }> {
    const res = await fetch(
      `${this.baseUrl}/v1/campaigns/juicer/twitter/mark-followed?walletAddress=${encodeURIComponent(walletAddress)}`,
      { method: 'POST' },
    )
    if (!res.ok) {
      throw new Error(`Failed to mark Twitter follow: ${res.statusText}`)
    }
    return res.json()
  }

  /** Step 3a: kicks off the Discord OAuth (frontend redirects to authUrl). */
  async startDiscordOAuth(walletAddress: string): Promise<{ authUrl: string; state: string }> {
    const res = await fetch(
      `${this.baseUrl}/v1/campaigns/juicer/discord/start?walletAddress=${encodeURIComponent(walletAddress)}`,
    )
    if (!res.ok) {
      throw new Error(`Failed to start Discord OAuth: ${res.statusText}`)
    }
    return res.json()
  }

  /**
   * Final step: returns the on-chain claim signature. The backend
   * only honours this once all three conditions are satisfied.
   */
  async getNftSignature(walletAddress: string): Promise<SignatureApiResponse> {
    const res = await fetch(
      `${this.baseUrl}/v1/campaigns/juicer/nft/signature?walletAddress=${encodeURIComponent(walletAddress)}`,
    )
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`getNftSignature failed: HTTP ${res.status} ${detail}`)
    }
    return (await res.json()) as SignatureApiResponse
  }
}

function buildConditions(
  cost: number,
  state: {
    availableJp: number
    jpSpent: boolean
    twitterVerified: boolean
    twitterVerifiedAt?: string | null
    discordVerified: boolean
    discordVerifiedAt?: string | null
  },
): CampaignCondition[] {
  return [
    {
      id: 1,
      type: ConditionType.JP_BALANCE,
      name: `Trade ${cost.toLocaleString()} JP`,
      description: `Spend ${cost.toLocaleString()} Juice Points for the right to mint the Juicer NFT.`,
      status: state.jpSpent
        ? ConditionStatus.COMPLETED
        : state.availableJp >= cost
          ? ConditionStatus.IN_PROGRESS
          : ConditionStatus.PENDING,
      ctaText: state.jpSpent ? undefined : `Trade ${cost.toLocaleString()} JP`,
      completedAt: undefined,
    },
    {
      id: 2,
      type: ConditionType.TWITTER_FOLLOW,
      name: 'Follow @JuiceSwap_com on X',
      description: 'Follow the official JuiceSwap account on X (Twitter).',
      status: state.twitterVerified ? ConditionStatus.COMPLETED : ConditionStatus.PENDING,
      ctaText: state.twitterVerified ? undefined : 'Follow on X',
      completedAt: state.twitterVerifiedAt ?? undefined,
    },
    {
      id: 3,
      type: ConditionType.DISCORD_JOIN,
      name: 'Join the JuiceSwap Discord',
      description: 'Join the JuiceSwap Discord server and pick up the Juicer role.',
      status: state.discordVerified ? ConditionStatus.COMPLETED : ConditionStatus.PENDING,
      ctaText: state.discordVerified ? undefined : 'Verify on Discord',
      completedAt: state.discordVerifiedAt ?? undefined,
    },
  ]
}

function rawToProgress(raw: ProgressApiResponse): JuicerProgress {
  const cost = raw.cost ?? JUICER_JP_COST
  const conditions = buildConditions(cost, {
    availableJp: raw.availableJp,
    jpSpent: raw.jpSpent,
    twitterVerified: raw.twitterVerified,
    twitterVerifiedAt: raw.twitterVerifiedAt,
    discordVerified: raw.discordVerified,
    discordVerifiedAt: raw.discordVerifiedAt,
  })
  const completed = conditions.filter((c) => c.status === ConditionStatus.COMPLETED).length

  return {
    walletAddress: raw.walletAddress,
    chainId: raw.chainId,
    availableJp: raw.availableJp,
    totalEarnedJp: raw.totalEarnedJp,
    spentJp: raw.spentJp,
    cost,
    conditions,
    totalConditions: conditions.length,
    completedConditions: completed,
    progress: Math.round((completed / conditions.length) * 100),
    isEligibleForNFT: raw.isEligibleForNFT,
    nftMinted: raw.nftMinted,
    nftTokenId: raw.nftTokenId,
    nftTxHash: raw.nftTxHash,
    nftMintedAt: raw.nftMintedAt,
  }
}

/**
 * Empty preview state used before wallet connect or when the backend is
 * not yet serving the campaign. All counters at 0, all conditions pending.
 */
export function buildEmptyJuicerProgress(walletAddress: string, chainId: UniverseChainId): JuicerProgress {
  const cost = JUICER_JP_COST
  const conditions = buildConditions(cost, {
    availableJp: 0,
    jpSpent: false,
    twitterVerified: false,
    discordVerified: false,
  })
  return {
    walletAddress,
    chainId,
    availableJp: 0,
    totalEarnedJp: 0,
    spentJp: 0,
    cost,
    conditions,
    totalConditions: conditions.length,
    completedConditions: 0,
    progress: 0,
    isEligibleForNFT: false,
    nftMinted: false,
  }
}

export const juicerCampaignAPI = new JuicerCampaignAPI()
