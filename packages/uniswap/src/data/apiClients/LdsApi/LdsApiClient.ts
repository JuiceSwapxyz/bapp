import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import {
  LightningBridgeReverseGetResponse,
  LightningBridgeSubmarineGetResponse,
  LightningBridgeSubmarineLockResponse,
} from 'uniswap/src/data/apiClients/tradingApi/utils/lightningBridge'

const LdsApiClient = createApiClient({
  baseUrl: `${process.env.REACT_APP_LDS_API_URL}`,
})

export interface LockupCheckResponse {
  lockups: {
    amount: string
    claimAddress: string
    claimTxHash: string
    claimed: boolean
    preimageHash: string
    preimage: string
    refundAddress: string
    refundTxHash: string
    refunded: boolean
    timelock: number
  } | null
}

export interface ClaimCheckResponse {
  lockup?: {
    preimageHash: string
    preimage: string
  } | null
}

export interface HelpMeClaimRequest {
  preimage: string
  preimageHash: string
}

export interface HelpMeClaimResponse {
  txHash: string
}

export interface CreateSubmarineSwapRequest {
  from: string
  to: string
  invoice: string
  pairHash: string
  referralId: string
  refundPublicKey: string
}

export interface CreateReverseSwapRequest {
  from: string
  to: string
  pairHash: string
  preimageHash: string
  claimAddress: string
  invoiceAmount: number
}

export interface CreateReverseSwapResponse {
  invoice: string
  id: string
}

export interface ChainPairInfo {
  hash: string
  rate: number
  limits: {
    maximal: number
    minimal: number
    maximalZeroConf: number
  }
  fees: {
    percentage: number
    minerFees: {
      server: number
      user: {
        claim: number
        lockup: number
      }
    }
  }
}

export interface CreateChainSwapRequest {
  from: string
  to: string
  preimageHash: string
  claimPublicKey: string
  claimAddress: string
  pairHash: string
  referralId: string
  userLockAmount: number
}

export interface CreateChainSwapResponse {
  id: string
  referralId: string
  claimDetails: {
    serverPublicKey: string
    amount: number
    lockupAddress: string
    timeoutBlockHeight: number
    swapTree: {
      claimLeaf: {
        version: number
        output: string
      }
      refundLeaf: {
        version: number
        output: string
      }
    }
  }
  lockupDetails: {
    claimAddress: string
    amount: number
    lockupAddress: string
    timeoutBlockHeight: number
  }
}

export interface ChainTransactionsResponse {
  userLock?: {
    transaction: {
      id: string
    }
    timeout: {
      eta: number
      blockHeight: number
    }
  }
  serverLock?: {
    transaction: {
      hex: string
      id: string
    }
    timeout: {
      eta: number
      blockHeight: number
    }
  }
}
export interface ClaimChainSwapRequest {
  preimage: string
  toSign: {
    index: number
    transaction: string
    pubNonce: string
  }
}
export interface ClaimChainSwapResponse {
  pubNonce: string
  partialSignature: string
}

export type ChainPairsResponse = Record<string, Record<string, ChainPairInfo>>

export interface PostClaimChainSwapRequest {
  preimage: string
  toSign: {
    index: number
    transaction: string
    pubNonce: string
  }
}

export interface PostClaimChainSwapResponse {
  pubNonce: string
  partialSignature: string
}
export async function fetchSubmarinePairs(): Promise<LightningBridgeSubmarineGetResponse> {
  return await LdsApiClient.get<LightningBridgeSubmarineGetResponse>('/swap/v2/swap/submarine')
}

export async function fetchReversePairs(): Promise<LightningBridgeReverseGetResponse> {
  return await LdsApiClient.get<LightningBridgeReverseGetResponse>('/swap/v2/swap/reverse')
}

export async function createSubmarineSwap(
  params: CreateSubmarineSwapRequest,
): Promise<LightningBridgeSubmarineLockResponse> {
  return await LdsApiClient.post<LightningBridgeSubmarineLockResponse>('/swap/v2/swap/submarine', {
    body: JSON.stringify(params),
  })
}

export async function createReverseSwap(params: CreateReverseSwapRequest): Promise<CreateReverseSwapResponse> {
  return await LdsApiClient.post<CreateReverseSwapResponse>('/swap/v2/swap/reverse', {
    body: JSON.stringify(params),
  })
}

export async function checkPreimageHashForLockup(preimageHash: string): Promise<LockupCheckResponse> {
  return await LdsApiClient.get<LockupCheckResponse>(`/claim/check-preimagehash?preimageHash=${preimageHash}`)
}

export async function checkPreimageHashForClaim(preimageHash: string): Promise<ClaimCheckResponse> {
  return await LdsApiClient.get<ClaimCheckResponse>(`/claim/check-preimagehash?preimageHash=${preimageHash}`)
}

export async function helpMeClaim(params: HelpMeClaimRequest): Promise<HelpMeClaimResponse> {
  return await LdsApiClient.post<HelpMeClaimResponse>('/claim/help-me-claim', {
    body: JSON.stringify(params),
  })
}

export async function getLockup(preimageHash: string): Promise<{ data: LockupCheckResponse }> {
  return await LdsApiClient.post<{ data: LockupCheckResponse }>(`/claim/graphql`, {
    body: JSON.stringify({
      operationName: 'LockupQuery',
      query: `query LockupQuery {
          lockups(preimageHash: "0x${preimageHash}") {
            amount
            claimAddress
            claimTxHash
            claimed
            preimage
            refundAddress
            refundTxHash
            refunded
            timelock
          }
        }`,
    }),
  })
}

export async function fetchChainPairs(): Promise<ChainPairsResponse> {
  return await LdsApiClient.get<ChainPairsResponse>(`/swap/v2/swap/chain/`)
}

export async function createChainSwap(params: CreateChainSwapRequest): Promise<CreateChainSwapResponse> {
  return await LdsApiClient.post<CreateChainSwapResponse>(`/swap/v2/swap/chain/`, {
    body: JSON.stringify(params),
  })
}

export async function fetchChainTransactionsBySwapId(swapId: string): Promise<ChainTransactionsResponse> {
  return await LdsApiClient.get<ChainTransactionsResponse>(`/swap/v2/swap/chain/${swapId}/transactions`)
}

export async function claimChainSwap(swapId: string, params: ClaimChainSwapRequest): Promise<ClaimChainSwapResponse> {
  return await LdsApiClient.post<ClaimChainSwapResponse>(`/swap/v2/swap/chain/${swapId}/claim`, {
    body: JSON.stringify(params),
  })
}

export async function postClaimChainSwap(
  swapId: string,
  params: ClaimChainSwapRequest,
): Promise<ClaimChainSwapResponse> {
  return await LdsApiClient.post<ClaimChainSwapResponse>(`/swap/v2/swap/chain/${swapId}/claim`, {
    body: JSON.stringify(params),
  })
}

export async function broadcastChainSwap(hex: string): Promise<{ id: string }> {
  return await LdsApiClient.post<{ id: string }>(`/swap/v2/chain/BTC/transaction`, {
    body: JSON.stringify({ hex }),
  })
}
