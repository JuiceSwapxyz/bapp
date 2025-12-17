const DEFAULT_BOLTZ_BASE_URL = 'https://dev.lightning.space'

type BoltzFetcherMethod = 'GET' | 'POST'

export interface BoltzFetcherOptions<TBody> {
  path: string
  method?: BoltzFetcherMethod
  body?: TBody
  baseUrl?: string
  signal?: AbortSignal
}

interface BoltzErrorPayload {
  message?: string
  error?: string
  code?: string | number
  [key: string]: unknown
}

export class BoltzApiError extends Error {
  status: number
  payload?: BoltzErrorPayload | string

  constructor(status: number, payload?: BoltzErrorPayload | string) {
    const message =
      typeof payload === 'string' ? payload : payload?.message || payload?.error || `Boltz API error (status ${status})`
    super(message)
    this.status = status
    this.payload = payload
  }
}

const normalizePath = (path: string): string => {
  if (!path) {
    throw new Error('Boltz fetcher path is required')
  }
  return path.startsWith('/') ? path : `/${path}`
}

export async function boltzFetcher<TResponse, TBody = unknown>({
  path,
  method = 'GET',
  body,
  baseUrl = DEFAULT_BOLTZ_BASE_URL,
  signal,
}: BoltzFetcherOptions<TBody>): Promise<TResponse> {
  if (method === 'GET' && body !== undefined) {
    throw new Error('GET requests cannot include a request body')
  }

  const sanitizedBaseUrl = baseUrl.replace(/\/$/, '')
  const url = `${sanitizedBaseUrl}${normalizePath(path)}`

  const headers: HeadersInit = {
    Accept: 'application/json',
  }

  const requestInit: RequestInit = {
    method,
    signal,
    headers,
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    requestInit.body = JSON.stringify(body)
  }

  const response = await fetch(url, requestInit)

  if (!response.ok) {
    const errorText = await response.text().catch(() => undefined)
    let errorPayload: BoltzErrorPayload | string | undefined
    if (errorText) {
      try {
        errorPayload = JSON.parse(errorText)
      } catch {
        errorPayload = errorText
      }
    }
    throw new BoltzApiError(response.status, errorPayload)
  }

  try {
    return (await response.json()) as TResponse
  } catch (error) {
    throw new Error(`Failed to parse Boltz API response: ${(error as Error).message}`)
  }
}

export const boltzBaseUrl = DEFAULT_BOLTZ_BASE_URL

// API Response types
interface SwapTreeLeaf {
  version: number
  output: string
}

interface SwapTree {
  claimLeaf: SwapTreeLeaf
  refundLeaf: SwapTreeLeaf
}

interface ClaimDetails {
  serverPublicKey: string
  amount: number
  lockupAddress: string
  timeoutBlockHeight: number
  swapTree: SwapTree
}

interface LockupDetails {
  claimAddress: string
  amount: number
  lockupAddress: string
  timeoutBlockHeight: number
}

export interface ChainSwapPairInfo {
  hash: string
  rate: number
  limits: {
    minimal: number
    maximal: number
  }
}

export interface GetChainSwapInfoResponse {
  [fromCurrency: string]: {
    [toCurrency: string]: ChainSwapPairInfo
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
  referralId: string
  id: string
  claimDetails: ClaimDetails
  lockupDetails: LockupDetails
}

export interface GetSwapStatusResponse {
  status: string
  transaction?: {
    id?: string
    hex?: string
  }
  lockupTransactionId?: string
  claimTransactionId?: string
}

export interface GetSwapTransactionsResponse {
  userLock?: {
    transaction: {
      id: string
      hex: string
    }
  }
  serverLock?: {
    transaction: {
      id: string
      hex: string
    }
  }
}

export interface GetClaimDetailsResponse {
  pubNonce: string
  publicKey: string
  transactionHash: string
}

export interface PostClaimDetailsRequest {
  preimage: string
  signature: {
    pubNonce: string
    partialSignature: string
  }
  toSign: {
    pubNonce: string
    transaction: string
    index: number
  }
}

export interface PostClaimDetailsResponse {
  pubNonce: string
  partialSignature: string
}

export interface BroadcastTransactionRequest {
  hex: string
}

export interface BroadcastTransactionResponse {
  id: string
}

// API methods
export const BoltzApi = {
  /**
   * Get chain swap pair information
   */
  getChainSwapInfo: (baseUrl?: string): Promise<GetChainSwapInfoResponse> => {
    return boltzFetcher<GetChainSwapInfoResponse>({
      path: '/v1/swap/v2/swap/chain',
      baseUrl,
    })
  },

  /**
   * Create a new chain swap
   */
  createChainSwap: (request: CreateChainSwapRequest, baseUrl?: string): Promise<CreateChainSwapResponse> => {
    return boltzFetcher<CreateChainSwapResponse, CreateChainSwapRequest>({
      path: '/v1/swap/v2/swap/chain',
      method: 'POST',
      body: request,
      baseUrl,
    })
  },

  /**
   * Get swap status by ID
   */
  getSwapStatus: (swapId: string, baseUrl?: string): Promise<GetSwapStatusResponse> => {
    return boltzFetcher<GetSwapStatusResponse>({
      path: `/v1/swap/v2/swap/${swapId}`,
      baseUrl,
    })
  },

  /**
   * Get swap transactions (user lock and server lock)
   */
  getSwapTransactions: (swapId: string, baseUrl?: string): Promise<GetSwapTransactionsResponse> => {
    return boltzFetcher<GetSwapTransactionsResponse>({
      path: `/v1/swap/v2/swap/chain/${swapId}/transactions`,
      baseUrl,
    })
  },

  /**
   * Get claim details for cooperative signing
   */
  getClaimDetails: (swapId: string, baseUrl?: string): Promise<GetClaimDetailsResponse> => {
    return boltzFetcher<GetClaimDetailsResponse>({
      path: `/v2/swap/chain/${swapId}/claim`,
      baseUrl,
    })
  },

  /**
   * Post claim details for cooperative signing
   */
  postClaimDetails: (params: {
    swapId: string
    request: PostClaimDetailsRequest
    baseUrl?: string
  }): Promise<PostClaimDetailsResponse> => {
    return boltzFetcher<PostClaimDetailsResponse, PostClaimDetailsRequest>({
      path: `/v2/swap/chain/${params.swapId}/claim`,
      method: 'POST',
      body: params.request,
      baseUrl: params.baseUrl,
    })
  },

  /**
   * Broadcast a transaction to the Bitcoin network
   */
  broadcastTransaction: (params: {
    currency: string
    request: BroadcastTransactionRequest
    baseUrl?: string
  }): Promise<BroadcastTransactionResponse> => {
    return boltzFetcher<BroadcastTransactionResponse, BroadcastTransactionRequest>({
      path: `/v2/chain/${params.currency}/transaction`,
      method: 'POST',
      body: params.request,
      baseUrl: params.baseUrl,
    })
  },
}
