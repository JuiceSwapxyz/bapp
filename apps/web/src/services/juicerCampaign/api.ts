import {
  CampaignCondition,
  ConditionStatus,
  ConditionType,
  JUICER_JP_COST,
  JuicerProgress,
} from 'services/juicerCampaign/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

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

interface ProgressApiResponse {
  walletAddress: string
  chainId: UniverseChainId
  availableJp: number
  totalEarnedJp: number
  spentJp: number
  cost?: number
  isEligibleForNFT: boolean
  nftMinted: boolean
  nftTokenId?: string
  nftTxHash?: string
  nftMintedAt?: string
}

interface SpendApiResponse {
  signature: string
  spentJp: number
  remainingJp: number
}

class JuicerCampaignAPI {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  /**
   * Read the wallet's Juicer progress.
   * Backend computes `availableJp = totalEarnedJp - spentJp` server-side
   * and is the source of truth.
   */
  async getProgress(walletAddress: string, chainId: UniverseChainId): Promise<JuicerProgress> {
    const url = `${this.baseUrl}/v1/campaigns/juicer/progress?walletAddress=${encodeURIComponent(
      walletAddress,
    )}&chainId=${chainId}`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`getProgress failed: HTTP ${res.status}`)
    }
    const raw = (await res.json()) as ProgressApiResponse
    return rawToProgress(raw)
  }

  /**
   * Atomically spend `JUICER_JP_COST` JP from this wallet's balance and
   * receive a backend signature to claim the NFT. The spend is recorded
   * server-side BEFORE the signature is returned, so a successful
   * response guarantees the JP has been deducted regardless of whether
   * the on-chain claim ultimately succeeds. The backend should not
   * issue a second signature for the same wallet.
   */
  async spendJpForMint(
    walletAddress: string,
    chainId: UniverseChainId,
  ): Promise<SpendApiResponse> {
    const res = await fetch(`${this.baseUrl}/v1/campaigns/juicer/spend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, chainId }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`spendJpForMint failed: HTTP ${res.status} ${detail}`)
    }
    return (await res.json()) as SpendApiResponse
  }
}

function rawToProgress(raw: ProgressApiResponse): JuicerProgress {
  const cost = raw.cost ?? JUICER_JP_COST
  const eligible = raw.isEligibleForNFT && raw.availableJp >= cost
  const condition: CampaignCondition = {
    id: 1,
    type: ConditionType.JP_BALANCE,
    name: `Hold at least ${cost.toLocaleString()} JP`,
    description: `Trade ${cost.toLocaleString()} Juice Points for the right to mint the Juicer NFT.`,
    status:
      raw.availableJp >= cost ? ConditionStatus.COMPLETED : ConditionStatus.PENDING,
    completedAt: undefined,
  }
  const completed = condition.status === ConditionStatus.COMPLETED ? 1 : 0
  return {
    walletAddress: raw.walletAddress,
    chainId: raw.chainId,
    availableJp: raw.availableJp,
    totalEarnedJp: raw.totalEarnedJp,
    spentJp: raw.spentJp,
    cost,
    conditions: [condition],
    totalConditions: 1,
    completedConditions: completed,
    progress: completed * 100,
    isEligibleForNFT: eligible,
    nftMinted: raw.nftMinted,
    nftTokenId: raw.nftTokenId,
    nftTxHash: raw.nftTxHash,
    nftMintedAt: raw.nftMintedAt,
  }
}

export const juicerCampaignAPI = new JuicerCampaignAPI()
