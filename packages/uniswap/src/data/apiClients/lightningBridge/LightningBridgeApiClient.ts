import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import {
  LightningBridgeReverseGetResponse,
  LightningBridgeSubmarineGetResponse,
  LightningBridgeSubmarineLockResponse,
} from 'uniswap/src/data/apiClients/tradingApi/utils/lightningBridge'

const LightningBridgeApiClient = createApiClient({
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

export async function fetchSubmarinePairs(): Promise<LightningBridgeSubmarineGetResponse> {
  return await LightningBridgeApiClient.get<LightningBridgeSubmarineGetResponse>('/swap/v2/swap/submarine')
}

export async function fetchReversePairs(): Promise<LightningBridgeReverseGetResponse> {
  return await LightningBridgeApiClient.get<LightningBridgeReverseGetResponse>('/swap/v2/swap/reverse')
}

export async function createSubmarineSwap(
  params: CreateSubmarineSwapRequest,
): Promise<LightningBridgeSubmarineLockResponse> {
  return await LightningBridgeApiClient.post<LightningBridgeSubmarineLockResponse>('/swap/v2/swap/submarine', {
    body: JSON.stringify(params),
  })
}

export async function createReverseSwap(params: CreateReverseSwapRequest): Promise<CreateReverseSwapResponse> {
  return await LightningBridgeApiClient.post<CreateReverseSwapResponse>('/swap/v2/swap/reverse', {
    body: JSON.stringify(params),
  })
}

export async function checkPreimageHashForLockup(preimageHash: string): Promise<LockupCheckResponse> {
  return await LightningBridgeApiClient.get<LockupCheckResponse>(
    `/claim/check-preimagehash?preimageHash=${preimageHash}`,
  )
}

export async function checkPreimageHashForClaim(preimageHash: string): Promise<ClaimCheckResponse> {
  return await LightningBridgeApiClient.get<ClaimCheckResponse>(
    `/claim/check-preimagehash?preimageHash=${preimageHash}`,
  )
}

export async function helpMeClaim(params: HelpMeClaimRequest): Promise<HelpMeClaimResponse> {
  return await LightningBridgeApiClient.post<HelpMeClaimResponse>('/claim/help-me-claim', {
    body: JSON.stringify(params),
  })
}

export async function getLockup(preimageHash: string): Promise<{ data: LockupCheckResponse }> {
  return await LightningBridgeApiClient.post<{ data: LockupCheckResponse }>(`/claim/graphql`, {
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
