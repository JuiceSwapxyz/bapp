import { SwapRouter } from '@uniswap/router-sdk'
import { CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { Pool as V3Pool, Route as V3Route, Trade as V3Trade } from '@uniswap/v3-sdk'
import { config } from 'uniswap/src/config'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import { SwappableTokensParams } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwappableTokensQuery'
import {
  Address,
  ApprovalRequest,
  ApprovalResponse,
  BridgeQuote,
  ChainDelegationMap,
  ChainId,
  CheckApprovalLPRequest,
  CheckApprovalLPResponse,
  ClaimLPFeesRequest,
  ClaimLPFeesResponse,
  ClaimLPRewardsRequest,
  ClaimLPRewardsResponse,
  ClassicQuote,
  CreateLPPositionRequest,
  CreateLPPositionResponse,
  CreateSwap5792Request,
  CreateSwap5792Response,
  CreateSwap7702Request,
  CreateSwap7702Response,
  CreateSwapRequest,
  CreateSwapResponse,
  DecreaseLPPositionRequest,
  DecreaseLPPositionResponse,
  DutchQuoteV2,
  DutchQuoteV3,
  Encode7702ResponseBody,
  GetOrdersResponse,
  GetSwappableTokensResponse,
  GetSwapsResponse,
  IncreaseLPPositionRequest,
  IncreaseLPPositionResponse,
  MigrateLPPositionRequest,
  MigrateLPPositionResponse,
  OrderRequest,
  OrderResponse,
  OrderStatus,
  PriorityQuote,
  QuoteRequest,
  QuoteResponse,
  Routing,
  RoutingPreference,
  TradeType,
  TransactionHash,
  UniversalRouterVersion,
  V3PoolInRoute,
  WalletCheckDelegationRequestBody,
  WalletCheckDelegationResponseBody,
  WalletEncode7702RequestBody,
  WrapUnwrapQuote,
} from 'uniswap/src/data/tradingApi/__generated__'
import { FeeType } from 'uniswap/src/data/tradingApi/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { logger } from 'utilities/src/logger/logger'

// TradingAPI team is looking into updating type generation to produce the following types for it's current QuoteResponse type:
// See: https://linear.app/uniswap/issue/API-236/explore-changing-the-quote-schema-to-pull-out-a-basequoteresponse
export type DiscriminatedQuoteResponse =
  | ClassicQuoteResponse
  | DutchQuoteResponse
  | DutchV3QuoteResponse
  | PriorityQuoteResponse
  | BridgeQuoteResponse
  | WrapQuoteResponse<Routing.WRAP>
  | WrapQuoteResponse<Routing.UNWRAP>

export type DutchV3QuoteResponse = QuoteResponse & {
  quote: DutchQuoteV3
  routing: Routing.DUTCH_V3
}

export type DutchQuoteResponse = QuoteResponse & {
  quote: DutchQuoteV2
  routing: Routing.DUTCH_V2
}

export type PriorityQuoteResponse = QuoteResponse & {
  quote: PriorityQuote
  routing: Routing.PRIORITY
}

export type ClassicQuoteResponse = QuoteResponse & {
  quote: ClassicQuote
  routing: Routing.CLASSIC
}

export type BridgeQuoteResponse = QuoteResponse & {
  quote: BridgeQuote
  routing: Routing.BRIDGE
}

export type WrapQuoteResponse<T extends Routing.WRAP | Routing.UNWRAP> = QuoteResponse & {
  quote: WrapUnwrapQuote
  routing: T
}

const TradingApiClient = createApiClient({
  baseUrl: uniswapUrls.tradingApiUrl,
  additionalHeaders: {
    'x-api-key': config.tradingApiKey,
  },
})

// Custom quote client for selective endpoint override
const CustomQuoteApiClient = createApiClient({
  baseUrl: process.env.REACT_APP_CUSTOM_QUOTE_API_URL || uniswapUrls.tradingApiUrl,
  additionalHeaders: {
    'x-api-key': config.tradingApiKey,
  },
})

const V4_HEADERS = {
  'x-universal-router-version': UniversalRouterVersion._2_0,
}

export const getFeatureFlaggedHeaders = (): Record<string, string> => {
  const uniquoteEnabled = getFeatureFlag(FeatureFlags.UniquoteEnabled)
  const viemProviderEnabled = getFeatureFlag(FeatureFlags.ViemProviderEnabled)

  return {
    'x-uniquote-enabled': uniquoteEnabled ? 'true' : 'false',
    'x-viem-provider-enabled': viemProviderEnabled ? 'true' : 'false',
  }
}

export type FetchQuote = (params: QuoteRequest & { isUSDQuote?: boolean }) => Promise<DiscriminatedQuoteResponse>

export async function fetchQuote({
  isUSDQuote: _isUSDQuote,
  ...params
}: QuoteRequest & { isUSDQuote?: boolean }): Promise<DiscriminatedQuoteResponse> {
  return await CustomQuoteApiClient.post<DiscriminatedQuoteResponse>(uniswapUrls.tradingApiPaths.quote, {
    body: JSON.stringify(params),
    headers: {
      ...V4_HEADERS,
      ...getFeatureFlaggedHeaders(),
    },
    on404: () => {
      logger.warn('TradingApiClient', 'fetchQuote', 'Quote 404', {
        chainIdIn: params.tokenInChainId,
        chainIdOut: params.tokenOutChainId,
        tradeType: params.type,
        isBridging: params.tokenInChainId !== params.tokenOutChainId,
      })
    },
  })
}

// min parameters needed for indicative quotes
export interface IndicativeQuoteRequest {
  type: TradeType
  amount: string
  tokenInChainId: number
  tokenOutChainId: number
  tokenIn: string
  tokenOut: string
  swapper: string
}

export type FetchIndicativeQuote = (params: IndicativeQuoteRequest) => Promise<DiscriminatedQuoteResponse>

/**
 * Fetches an indicative quote - a faster quote with FASTEST routing preference
 * Used to show approximate pricing while the full quote is being fetched
 */
export async function fetchIndicativeQuote(params: IndicativeQuoteRequest): Promise<DiscriminatedQuoteResponse> {
  // convert minimal params to full QuoteRequest with FASTEST routing
  const quoteRequest: QuoteRequest = {
    ...params,
    routingPreference: RoutingPreference.FASTEST,
  }

  return fetchQuote(quoteRequest)
}

// Helper function to build V3 transaction using SDK
function buildV3Transaction(quote: ClassicQuote): CreateSwapResponse | undefined {
  try {
    // Only build transaction for quotes with route data
    if (!quote.route || quote.route.length === 0) {
      return undefined
    }

    // Find V3 pools in the route
    const v3Pools: V3PoolInRoute[] = []

    for (const routePath of quote.route) {
      for (const pool of routePath) {
        if (pool.type === 'v3-pool') {
          v3Pools.push(pool as V3PoolInRoute)
        }
      }
    }

    if (v3Pools.length === 0) {
      return undefined
    }

    // Create V3 pools from route data
    const v3PoolsData = v3Pools.map((pool) => {
      if (!pool.tokenIn || !pool.tokenOut || !pool.fee || !pool.sqrtRatioX96 || !pool.liquidity || !pool.tickCurrent) {
        throw new Error('Incomplete V3 pool data')
      }

      // Create Token objects for V3 SDK
      const tokenIn = new Token(
        1, // chainId - this should be extracted from quote
        pool.tokenIn.address || '0x0000000000000000000000000000000000000000',
        parseInt(pool.tokenIn.decimals || '18', 10),
        pool.tokenIn.symbol || 'UNKNOWN',
        pool.tokenIn.symbol || 'Unknown Token',
      )

      const tokenOut = new Token(
        1, // chainId - this should be extracted from quote
        pool.tokenOut.address || '0x0000000000000000000000000000000000000000',
        parseInt(pool.tokenOut.decimals || '18', 10),
        pool.tokenOut.symbol || 'UNKNOWN',
        pool.tokenOut.symbol || 'Unknown Token',
      )

      // Create V3 Pool
      const v3Pool = new V3Pool(
        tokenIn,
        tokenOut,
        typeof pool.fee === 'string' ? parseInt(pool.fee, 10) : pool.fee,
        pool.sqrtRatioX96,
        pool.liquidity,
        typeof pool.tickCurrent === 'string' ? parseInt(pool.tickCurrent, 10) : pool.tickCurrent,
      )

      return {
        pool: v3Pool,
        amountIn: pool.amountIn,
        amountOut: pool.amountOut,
        originalPool: pool,
      }
    })

    // Create route from pools
    const firstPool = v3PoolsData[0]?.pool
    const lastPool = v3PoolsData[v3PoolsData.length - 1]?.pool

    if (!firstPool || !lastPool) {
      throw new Error('Invalid pool data for route creation')
    }

    const route = new V3Route(
      v3PoolsData.map((p) => p.pool),
      firstPool.token0,
      lastPool.token1,
    )

    // Create trade
    const amountIn = CurrencyAmount.fromRawAmount(firstPool.token0, quote.input?.amount || '0')

    const trade = V3Trade.createUncheckedTrade({
      route,
      inputAmount: amountIn,
      outputAmount: CurrencyAmount.fromRawAmount(lastPool.token1, quote.output?.amount || '0'),
      tradeType: 0, // EXACT_INPUT
    })

    // Build swap parameters using SwapRouter
    const swapOptions = {
      slippageTolerance: new Percent(50, 10_000), // 0.5% slippage
      deadline: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
      recipient: quote.swapper || '0x0000000000000000000000000000000000000000',
    }

    const { calldata, value } = SwapRouter.swapCallParameters(trade, swapOptions)

    return {
      requestId: Math.random().toString(36).substring(2, 15),
      swap: {
        chainId: ChainId._11155111,
        data: calldata,
        value: value.toString(),
        to: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // V3 SwapRouter address
        from: quote.swapper || '0x0000000000000000000000000000000000000000',
      },
    }
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'TradingApiClient',
        function: 'buildV3Transaction',
      },
    })
    return undefined
  }
}

export async function fetchSwap({ ...params }: CreateSwapRequest): Promise<CreateSwapResponse> {
  // Build V3 transaction if it's a classic quote
  if ('route' in params.quote) {
    const v3Result = buildV3Transaction(params.quote as ClassicQuote)
    if (v3Result) {
      return v3Result
    }
  }

  return await TradingApiClient.post<CreateSwapResponse>(uniswapUrls.tradingApiPaths.swap, {
    body: JSON.stringify(params),
    headers: {
      ...V4_HEADERS,
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function fetchSwap5792({ ...params }: CreateSwap5792Request): Promise<CreateSwap5792Response> {
  return await TradingApiClient.post<CreateSwap5792Response>(uniswapUrls.tradingApiPaths.swap5792, {
    body: JSON.stringify(params),
    headers: {
      ...V4_HEADERS,
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function fetchSwap7702({ ...params }: CreateSwap7702Request): Promise<CreateSwap7702Response> {
  return await TradingApiClient.post<CreateSwap7702Response>(uniswapUrls.tradingApiPaths.swap7702, {
    body: JSON.stringify(params),
    headers: {
      ...V4_HEADERS,
      ...getFeatureFlaggedHeaders(),
    },
  })
}

/**
 * Computes approval transaction locally using our calldata construction utilities
 * and proper gas estimation
 */
async function computeApprovalTransaction(params: ApprovalRequest): Promise<ApprovalResponse> {
  const {
    constructUnlimitedERC20ApproveCalldata,
    getClassicSwapSpenderAddress,
  } = require('uniswap/src/utils/approvalCalldata')
  const { createFetchGasFee } = require('uniswap/src/data/apiClients/uniswapApi/UniswapApiClient')

  // Get the spender address (Permit2 for classic swaps)
  const spenderAddress = getClassicSwapSpenderAddress(params.chainId)

  // Construct the approval calldata
  const calldata = constructUnlimitedERC20ApproveCalldata(spenderAddress)

  // Generate a request ID
  const requestId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  const baseTransaction = {
    to: params.token, // Token contract address
    value: '0x00', // No ETH value for ERC20 approvals
    from: params.walletAddress, // User's wallet address
    data: calldata, // Constructed approve calldata
    chainId: params.chainId,
  }

  const gasStrategy = params.gasStrategies?.[0] || {
    limitInflationFactor: 1.15,
    displayLimitInflationFactor: 1.15,
    priceInflationFactor: 1.5,
    percentileThresholdFor1559Fee: 75,
    thresholdToInflateLastBlockBaseFee: 0.75,
    baseFeeMultiplier: 1,
    baseFeeHistoryWindow: 20,
    minPriorityFeeRatioOfBaseFee: 0.2,
    minPriorityFeeGwei: 2,
    maxPriorityFeeGwei: 9,
  }

  const fetchGasFee = createFetchGasFee({ gasStrategy })

  try {
    const gasResult = await fetchGasFee({
      tx: baseTransaction,
      fallbackGasLimit: 65008,
    })

    // Handle case where gasResult.params might be undefined (client-side fallback)
    const gasParams = gasResult.params || {
      maxFeePerGas: '387366539',
      maxPriorityFeePerGas: '387335562',
      gasLimit: '65008',
    }

    const approvalTransaction = {
      ...baseTransaction,
      maxFeePerGas: gasParams.maxFeePerGas,
      maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
      gasLimit: gasParams.gasLimit,
    }

    const gasEstimate = {
      type: FeeType.EIP1559 as const,
      strategy: gasStrategy,
      gasLimit: gasParams.gasLimit,
      gasFee: gasResult.value,
      maxFeePerGas: gasParams.maxFeePerGas,
      maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
    }

    const response: ApprovalResponse = {
      requestId,
      approval: approvalTransaction,
      cancel: approvalTransaction,
      gasFee: gasResult.value,
      cancelGasFee: gasResult.value, // Same gas fee for cancel transaction
      gasEstimates: [gasEstimate],
    }

    return response
  } catch (error) {
    const approvalTransaction = {
      ...baseTransaction,
      maxFeePerGas: '387366539',
      maxPriorityFeePerGas: '387335562',
      gasLimit: '65008',
    }

    const gasEstimate = {
      type: FeeType.EIP1559 as const,
      strategy: gasStrategy,
      gasLimit: '65008',
      gasFee: '25181923967312',
      maxFeePerGas: '387366539',
      maxPriorityFeePerGas: '387335562',
    }

    const response: ApprovalResponse = {
      requestId,
      approval: approvalTransaction,
      cancel: approvalTransaction,
      gasFee: '25181923967312',
      cancelGasFee: '25181923967312', // Same gas fee for cancel transaction
      gasEstimates: [gasEstimate],
    }

    return response
  }
}

export async function fetchCheckApproval(params: ApprovalRequest): Promise<ApprovalResponse> {
  const computedResponse = await computeApprovalTransaction(params)
  return computedResponse
}

export async function submitOrder(params: OrderRequest): Promise<OrderResponse> {
  return await TradingApiClient.post<OrderResponse>(uniswapUrls.tradingApiPaths.order, {
    body: JSON.stringify(params),
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function fetchOrders({ orderIds }: { orderIds: string[] }): Promise<GetOrdersResponse> {
  return await TradingApiClient.get<GetOrdersResponse>(uniswapUrls.tradingApiPaths.orders, {
    params: {
      orderIds: orderIds.join(','),
    },
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function fetchOrdersWithoutIds({
  swapper,
  limit = 1,
  orderStatus,
}: {
  swapper: string
  limit: number
  orderStatus: OrderStatus
}): Promise<GetOrdersResponse> {
  return await TradingApiClient.get<GetOrdersResponse>(uniswapUrls.tradingApiPaths.orders, {
    params: {
      swapper,
      limit,
      orderStatus,
    },
  })
}

export async function fetchSwappableTokens(params: SwappableTokensParams): Promise<GetSwappableTokensResponse> {
  return await TradingApiClient.get<GetSwappableTokensResponse>(uniswapUrls.tradingApiPaths.swappableTokens, {
    params: {
      tokenIn: params.tokenIn,
      tokenInChainId: params.tokenInChainId,
    },
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function createLpPosition(params: CreateLPPositionRequest): Promise<CreateLPPositionResponse> {
  return await TradingApiClient.post<CreateLPPositionResponse>(uniswapUrls.tradingApiPaths.createLp, {
    body: JSON.stringify({
      ...params,
    }),
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}
export async function decreaseLpPosition(params: DecreaseLPPositionRequest): Promise<DecreaseLPPositionResponse> {
  return await TradingApiClient.post<DecreaseLPPositionResponse>(uniswapUrls.tradingApiPaths.decreaseLp, {
    body: JSON.stringify({
      ...params,
    }),
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}
export async function increaseLpPosition(params: IncreaseLPPositionRequest): Promise<IncreaseLPPositionResponse> {
  return await TradingApiClient.post<IncreaseLPPositionResponse>(uniswapUrls.tradingApiPaths.increaseLp, {
    body: JSON.stringify({
      ...params,
    }),
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}
export async function checkLpApproval(
  params: CheckApprovalLPRequest,
  headers?: Record<string, string>,
): Promise<CheckApprovalLPResponse> {
  return await TradingApiClient.post<CheckApprovalLPResponse>(uniswapUrls.tradingApiPaths.lpApproval, {
    body: JSON.stringify({
      ...params,
    }),
    headers: {
      ...getFeatureFlaggedHeaders(),
      ...headers,
    },
  })
}

export async function claimLpFees(params: ClaimLPFeesRequest): Promise<ClaimLPFeesResponse> {
  return await TradingApiClient.post<ClaimLPFeesResponse>(uniswapUrls.tradingApiPaths.claimLpFees, {
    body: JSON.stringify({
      ...params,
    }),
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function fetchSwaps(params: { txHashes: TransactionHash[]; chainId: ChainId }): Promise<GetSwapsResponse> {
  return await TradingApiClient.get<GetSwapsResponse>(uniswapUrls.tradingApiPaths.swaps, {
    params: {
      txHashes: params.txHashes.join(','),
      chainId: params.chainId,
    },
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function migrateLpPosition(params: MigrateLPPositionRequest): Promise<MigrateLPPositionResponse> {
  return await TradingApiClient.post<MigrateLPPositionResponse>(uniswapUrls.tradingApiPaths.migrate, {
    body: JSON.stringify({
      ...params,
    }),
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function fetchClaimLpIncentiveRewards(params: ClaimLPRewardsRequest): Promise<ClaimLPRewardsResponse> {
  return await TradingApiClient.post<ClaimLPRewardsResponse>(uniswapUrls.tradingApiPaths.claimRewards, {
    body: JSON.stringify({
      ...params,
    }),
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export async function fetchWalletEncoding7702(params: WalletEncode7702RequestBody): Promise<Encode7702ResponseBody> {
  return await TradingApiClient.post<Encode7702ResponseBody>(uniswapUrls.tradingApiPaths.wallet.encode7702, {
    body: JSON.stringify({
      ...params,
    }),
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })
}

// Default maximum amount of combinations wallet<>chainId per check delegation request
const DEFAULT_CHECK_VALIDATIONS_BATCH_THRESHOLD = 140

// Utility function to chunk wallet addresses for batching
function chunkWalletAddresses(params: {
  walletAddresses: Address[]
  chainIds: ChainId[]
  batchThreshold: number
}): Address[][] {
  const { walletAddresses, chainIds, batchThreshold } = params
  const totalCombinations = walletAddresses.length * chainIds.length

  if (totalCombinations <= batchThreshold) {
    return [walletAddresses]
  }

  const maxWalletsPerBatch = Math.floor(batchThreshold / chainIds.length)
  const chunks: Address[][] = []

  for (let i = 0; i < walletAddresses.length; i += maxWalletsPerBatch) {
    chunks.push(walletAddresses.slice(i, i + maxWalletsPerBatch))
  }

  return chunks
}

export async function checkWalletDelegationWithoutBatching(
  params: WalletCheckDelegationRequestBody,
): Promise<WalletCheckDelegationResponseBody> {
  return await TradingApiClient.post<WalletCheckDelegationResponseBody>(
    uniswapUrls.tradingApiPaths.wallet.checkDelegation,
    {
      body: JSON.stringify({
        ...params,
      }),
      headers: {
        ...getFeatureFlaggedHeaders(),
      },
    },
  )
}

function mergeDelegationResponses(responses: WalletCheckDelegationResponseBody[]): WalletCheckDelegationResponseBody {
  if (responses.length === 0) {
    throw new Error('No responses to merge')
  }

  const firstResponse = responses[0]
  if (!firstResponse) {
    throw new Error('First response is undefined')
  }

  if (responses.length === 1) {
    return firstResponse
  }

  const mergedDelegationDetails: Record<string, ChainDelegationMap> = {}

  for (const response of responses) {
    for (const [walletAddress, chainDelegationMap] of Object.entries(response.delegationDetails)) {
      mergedDelegationDetails[walletAddress] = chainDelegationMap
    }
  }

  return {
    requestId: firstResponse.requestId,
    delegationDetails: mergedDelegationDetails,
  }
}

export type CheckWalletDelegation = (
  params: WalletCheckDelegationRequestBody,
) => Promise<WalletCheckDelegationResponseBody>

export async function checkWalletDelegation(
  params: WalletCheckDelegationRequestBody,
  batchThreshold: number = DEFAULT_CHECK_VALIDATIONS_BATCH_THRESHOLD,
): Promise<WalletCheckDelegationResponseBody> {
  const { walletAddresses, chainIds } = params

  // If no wallet addresses provided, no need to make a call to backend
  if (!walletAddresses || walletAddresses.length === 0) {
    return {
      requestId: '',
      delegationDetails: {},
    }
  }

  // Ensure batchThreshold is at least the number of chain IDs
  const effectiveBatchThreshold = Math.max(batchThreshold, chainIds.length)

  const totalCombinations = walletAddresses.length * chainIds.length

  // If under threshold, make a single request
  if (totalCombinations <= effectiveBatchThreshold) {
    return await checkWalletDelegationWithoutBatching(params)
  }

  // Split into batches
  const walletChunks = chunkWalletAddresses({ walletAddresses, chainIds, batchThreshold: effectiveBatchThreshold })

  // Make batched requests
  const batchPromises = walletChunks.map((chunk) =>
    checkWalletDelegationWithoutBatching({
      walletAddresses: chunk,
      chainIds,
    }),
  )

  const responses = await Promise.all(batchPromises)

  // Merge all responses
  return mergeDelegationResponses(responses)
}
