import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import type {
  ChainPairsResponse,
  ChainTransactionsResponse,
  ClaimChainSwapRequest,
  ClaimChainSwapResponse,
  CreateChainSwapRequest,
  CreateChainSwapResponse,
  CreateReverseSwapRequest,
  CreateReverseSwapResponse,
  CreateSubmarineSwapRequest,
  HelpMeClaimRequest,
  HelpMeClaimResponse,
  LightningBridgeReverseGetResponse,
  LightningBridgeSubmarineGetResponse,
  LightningBridgeSubmarineLockResponse,
  LockupCheckResponse,
} from 'uniswap/src/features/lds-bridge/lds-types/api'
import { LdsSwapStatus } from 'uniswap/src/features/lds-bridge/lds-types/websocket'

export type {
  ChainPairsResponse,
  ChainTransactionsResponse,
  ClaimChainSwapRequest,
  ClaimChainSwapResponse,
  CreateChainSwapRequest,
  CreateChainSwapResponse,
  CreateReverseSwapRequest,
  CreateReverseSwapResponse,
  CreateSubmarineSwapRequest,
  HelpMeClaimRequest,
  HelpMeClaimResponse,
  LightningBridgeReverseGetResponse,
  LightningBridgeSubmarineGetResponse,
  LightningBridgeSubmarineLockResponse,
  LockupCheckResponse,
}

const LdsApiClient = createApiClient({
  baseUrl: `${process.env.REACT_APP_LDS_API_URL}`,
})

const PonderApiClient = createApiClient({
  baseUrl: `${process.env.REACT_APP_PONDER_JUICESWAP_URL}`,
})

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

export async function fetchSwapCurrentStatus(swapId: string): Promise<{ status: LdsSwapStatus }> {
  return await LdsApiClient.get<{ status: LdsSwapStatus }>(`/swap/v2/swap/${swapId}`)
}

export async function fetchSubmarineTransactionsBySwapId(
  swapId: string,
): Promise<{ id: string; hex: string; timeoutBlockHeight: number; timeoutEta?: number }> {
  return await LdsApiClient.get<{ id: string; hex: string; timeoutBlockHeight: number; timeoutEta?: number }>(
    `/swap/v2/swap/submarine/${swapId}/transactions`,
  )
}

export async function fetchChainFee(): Promise<{ BTC: number }> {
  return await LdsApiClient.get<{ BTC: number }>(`/swap/v2/chain/fees`)
}
