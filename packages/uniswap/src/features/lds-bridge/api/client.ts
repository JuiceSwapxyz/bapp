import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import type {
  BoltzBalanceItem,
  ChainPairsResponse,
  ChainTransactionsResponse,
  ClaimChainSwapRequest,
  ClaimChainSwapResponse,
  CreateChainSwapRequest,
  CreateChainSwapResponse,
  CreateReverseSwapRequest,
  CreateReverseSwapResponse,
  CreateSubmarineSwapRequest,
  EvmLockup,
  HelpMeClaimRequest,
  HelpMeClaimResponse,
  LightningBridgeReverseGetResponse,
  LightningBridgeSubmarineGetResponse,
  LightningBridgeSubmarineLockResponse,
  LockupCheckResponse,
  LockupsResponse,
  RegisterPreimageRequest,
  RegisterPreimageResponse,
  UserClaimsAndRefunds,
  UserClaimsAndRefundsResponse,
} from 'uniswap/src/features/lds-bridge/lds-types/api'
import { LdsSwapStatus } from 'uniswap/src/features/lds-bridge/lds-types/websocket'
import { prefix0x } from '..'

export type {
  BoltzBalanceItem,
  ChainPairsResponse,
  ChainTransactionsResponse,
  ClaimChainSwapRequest,
  ClaimChainSwapResponse,
  CreateChainSwapRequest,
  CreateChainSwapResponse,
  CreateReverseSwapRequest,
  CreateReverseSwapResponse,
  CreateSubmarineSwapRequest,
  EvmLockup as EvmRefundableLockup,
  HelpMeClaimRequest,
  HelpMeClaimResponse,
  LightningBridgeReverseGetResponse,
  LightningBridgeSubmarineGetResponse,
  LightningBridgeSubmarineLockResponse,
  LockupCheckResponse,
  RegisterPreimageRequest,
  RegisterPreimageResponse,
  UserClaimsAndRefunds,
}

const LdsApiClient = createApiClient({
  baseUrl: `${process.env.REACT_APP_LDS_API_URL}`,
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

export async function registerPreimage(params: RegisterPreimageRequest): Promise<RegisterPreimageResponse> {
  return await LdsApiClient.post<RegisterPreimageResponse>('/claim/register-preimage', {
    body: JSON.stringify(params),
  })
}

export async function getLockup(preimageHash: string, chainId: number): Promise<{ data: LockupCheckResponse }> {
  return await LdsApiClient.post<{ data: LockupCheckResponse }>(`/claim/graphql`, {
    body: JSON.stringify({
      operationName: 'LockupQuery',
      query: `query LockupQuery {
          lockups(id: "${chainId}:0x${preimageHash}") {
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

export async function fetchSwapCurrentStatus(swapId: string): Promise<{ status: LdsSwapStatus, failureReason?: string }> {
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

export async function fetchBoltzBalance(): Promise<BoltzBalanceItem[]> {
  return await LdsApiClient.get<BoltzBalanceItem[]>('/boltz/balance')
}

export async function fetchEvmRefundableAndClaimableLockups(address: string): Promise<{ refundable: EvmLockup[]; claimable: EvmLockup[] }> {
  if (!address) {
    return { refundable: [], claimable: [] }
  }

  const response = await LdsApiClient.post<LockupsResponse>('/claim/graphql', {
    body: JSON.stringify({
      query: `
        query ClaimableAndRefundable($address: String = "${address.toLowerCase()}") {
          refundable: lockupss(
            where: { refundAddress: $address, refundTxHash: null, claimed: false }
            orderBy: "timelock"
            orderDirection: "asc"
            limit: 1000
          ) {
            items {
              preimageHash
              chainId
              amount
              claimAddress
              refundAddress
              timelock
              tokenAddress
              swapType
              claimed
              refunded
              claimTxHash
              refundTxHash
            }
          }
          claimable: lockupss(
            where: { claimAddress: $address, claimTxHash: null, claimed: false, refunded: false }
            orderBy: "timelock"
            orderDirection: "asc"
            limit: 1000
          ) {
            items {
              preimageHash
              chainId
              amount
              claimAddress
              refundAddress
              timelock
              tokenAddress
              swapType
              claimed
              refunded
              claimTxHash
              refundTxHash
            }
          }
        }
      `,
    }),
  })

  return {
    refundable: response.data.refundable?.items || [],
    claimable: response.data.claimable?.items || [],
  }
}

export async function fetchUserClaimsAndRefunds(address: string): Promise<UserClaimsAndRefunds> {
  if (!address) {
    return { claims: [], refunds: [] }
  }

  const response = await LdsApiClient.post<UserClaimsAndRefundsResponse>('/claim/graphql', {
    body: JSON.stringify({
      query: `{
        myClaims: lockupss(
          where: {
            claimAddress: "${address.toLowerCase()}"
          }
          limit: 1000
        ) {
          items {
            preimageHash
            claimTxHash
          }
        }
        myRefunds: lockupss(
          where: {
            refundAddress: "${address.toLowerCase()}"
          }
          limit: 1000
        ) {
          items {
            preimageHash
            refundTxHash
          }
        }
      }`,
    }),
  })

  return {
    claims: response.data.myClaims.items.filter((item) => item.claimTxHash != null),
    refunds: response.data.myRefunds.items.filter((item) => item.refundTxHash != null),
  }
}

export async function fetchLockupsByPreimageHashes(preimageHashes: string[]): Promise<{ data: { lockupss: { items: EvmLockup[] | null } } }> {
  return await LdsApiClient.post<{ data: { lockupss: { items: EvmLockup[] | null } } }>('/claim/graphql', {
    body: JSON.stringify({
      query: `{
        lockupss(
          where: {
            preimageHash_in: [${preimageHashes.map((hash) => `"${prefix0x(hash)}"`).join(',')}]
          }
          limit: 1000
        ) {
          items {
            id
            preimageHash
            chainId
            amount
            claimAddress
            refundAddress
            timelock
            tokenAddress
            swapType
            claimed
            refunded
            claimTxHash
            refundTxHash
            lockupTxHash
          }
        }
      }`,
    }),
  })
}