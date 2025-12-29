/* eslint-disable max-lines */
import { Protocol } from '@juiceswapxyz/router-sdk'
import { parseUnits } from 'ethers/lib/utils'
import { config } from 'uniswap/src/config'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import { FetchError } from 'uniswap/src/data/apiClients/FetchError'
import { SwappableTokensParams } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwappableTokensQuery'
import {
  isBitcoinBridgeQuote,
  isLnBitcoinBridgeQuote,
} from 'uniswap/src/data/apiClients/tradingApi/utils/isBitcoinBridge'
import {
  LightningBridgeReverseGetResponse,
  LightningBridgeSubmarineGetResponse,
} from 'uniswap/src/data/apiClients/tradingApi/utils/lightningBridge'
import { swappableTokensMappping } from 'uniswap/src/data/apiClients/tradingApi/utils/swappableTokens'
import {
  ApprovalRequest,
  ApprovalResponse,
  BridgeQuote,
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
  Err404,
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
  WalletCheckDelegationRequestBody,
  WalletCheckDelegationResponseBody,
  WalletEncode7702RequestBody,
  WrapUnwrapQuote,
} from 'uniswap/src/data/tradingApi/__generated__'
import { FeeType, LightningBridgeDirection, LightningInvoice } from 'uniswap/src/data/tradingApi/types'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { getSpenderAddress } from 'uniswap/src/utils/approvalCalldata'

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
  routing: Routing.BRIDGE | Routing.BITCOIN_BRIDGE | Routing.LN_BRIDGE
}

export type WrapQuoteResponse<T extends Routing.WRAP | Routing.UNWRAP> = QuoteResponse & {
  quote: WrapUnwrapQuote
  routing: T
}

type TokenApprovalResponse = {
  to: string
  value: string
  from: string
  data: string
  gasLimit: string
  chainId: ChainId
  maxFeePerGas: string
  maxPriorityFeePerGas: string
}

const TradingApiClient = createApiClient({
  baseUrl: uniswapUrls.tradingApiUrl,
  additionalHeaders: {
    'x-api-key': config.tradingApiKey,
  },
})

// Custom quote client for selective endpoint override
const CustomQuoteApiClient = createApiClient({
  baseUrl: uniswapUrls.tradingApiUrl,
  additionalHeaders: {
    'x-api-key': config.tradingApiKey,
  },
})

const LightningBridgeApiClient = createApiClient({
  baseUrl: `${process.env.REACT_APP_LDS_API_URL}/swap/v2`,
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

const getBitcoinCrossChainQuote = async (params: QuoteRequest): Promise<DiscriminatedQuoteResponse> => {
  // TODO: It is one to one in this hardcoded mapping, but we need to request the actual quote from boltz
  const inputAmount = params.amount

  // Get decimals from chain info for native tokens
  const inputChainInfo = getChainInfo(params.tokenInChainId as number)
  const outputChainInfo = getChainInfo(params.tokenOutChainId as number)
  const inputDecimals = inputChainInfo.nativeCurrency.decimals
  const outputDecimals = outputChainInfo.nativeCurrency.decimals

  // Adjust output amount based on decimal difference
  // If input has 8 decimals and output has 18, multiply by 10^10
  // If input has 18 decimals and output has 8, divide by 10^10
  const decimalDifference = outputDecimals - inputDecimals
  const adjustedAmount =
    decimalDifference === 0
      ? inputAmount
      : decimalDifference > 0
        ? (BigInt(inputAmount) * BigInt(10 ** decimalDifference)).toString()
        : (BigInt(inputAmount) / BigInt(10 ** Math.abs(decimalDifference))).toString()

  // Apply 0.1% discount to output amount, then subtract 1 (smallest unit)
  const outputAmount = ((BigInt(adjustedAmount) * BigInt(999)) / BigInt(1000) - BigInt(1)).toString()

  const bridgeQuote: BridgeQuote = {
    quoteId: `bitcoin-bridge-${Date.now()}`,
    chainId: params.tokenInChainId,
    destinationChainId: params.tokenOutChainId,
    swapper: params.swapper,
    input: {
      amount: inputAmount,
      token: params.tokenIn,
    },
    output: {
      amount: outputAmount,
      token: params.tokenOut,
    },
    tradeType: params.type,
    gasUseEstimate: '21000',
    estimatedFillTimeMs: 300000,
  }

  const routing = isLnBitcoinBridgeQuote(params) ? Routing.LN_BRIDGE : Routing.BITCOIN_BRIDGE

  const response: BridgeQuoteResponse = {
    requestId: `bitcoin-bridge-${Date.now()}`,
    quote: bridgeQuote,
    routing,
    permitData: null,
  }

  return response
}

const submarineResponse = await LightningBridgeApiClient.get<LightningBridgeSubmarineGetResponse>('/swap/submarine')

if (!submarineResponse.cBTC?.BTC) {
  throw new Error('No BTC pair found')
}

const getLightningBridgeDirection = (params: QuoteRequest): LightningBridgeDirection => {
  if (params.tokenInChainId === ChainId._5115 && params.tokenOutChainId === ChainId._21_000_001) {
    return LightningBridgeDirection.Submarine
  }
  if (params.tokenInChainId === ChainId._21_000_001 && params.tokenOutChainId === ChainId._5115) {
    return LightningBridgeDirection.Reverse
  }
  throw new Error('Invalid lightning bridge direction')
}

export type LightningBridgeStateParams = {
  fees: {
    percentage: number
    minerFees: number
  }
  limits: {
    maximal: number
    minimal: number
  }
}

const getLightningBridgeStateParams = async (
  direction: LightningBridgeDirection,
): Promise<LightningBridgeStateParams> => {
  switch (direction) {
    case LightningBridgeDirection.Submarine: {
      const submarineResp = await LightningBridgeApiClient.get<LightningBridgeSubmarineGetResponse>('/swap/submarine')
      if (!submarineResp.cBTC?.BTC) {
        throw new Error('Pair not found')
      }
      const { fees, limits } = submarineResp.cBTC.BTC
      return { fees, limits }
    }

    case LightningBridgeDirection.Reverse: {
      const reverseResp = await LightningBridgeApiClient.get<LightningBridgeReverseGetResponse>('/swap/reverse')
      if (!reverseResp.BTC?.cBTC) {
        throw new Error('Pair not found')
      }
      const { fees, limits } = reverseResp.BTC.cBTC
      const {
        percentage,
        minerFees: { claim, lockup },
      } = fees
      return { fees: { percentage, minerFees: claim + lockup }, limits }
    }

    default:
      throw new Error('Invalid lightning bridge direction')
  }
}

const adjustAmountForDecimals = (params: { amount: string; inputDecimals: number; outputDecimals: number }): bigint => {
  const { amount, inputDecimals, outputDecimals } = params
  const decimalDifference = outputDecimals - inputDecimals
  return decimalDifference === 0
    ? BigInt(amount)
    : decimalDifference > 0
      ? BigInt(amount) * BigInt(10 ** decimalDifference)
      : BigInt(amount) / BigInt(10 ** Math.abs(decimalDifference))
}

const getLightningBridgeQuote = async (params: QuoteRequest): Promise<DiscriminatedQuoteResponse> => {
  const direction = getLightningBridgeDirection(params)
  const { fees, limits } = await getLightningBridgeStateParams(direction)
  const { percentage, minerFees } = fees

  const inputAmount = params.amount
  const inputChainInfo = getChainInfo(params.tokenInChainId as number)
  const outputChainInfo = getChainInfo(params.tokenOutChainId as number)
  const inputDecimals = inputChainInfo.nativeCurrency.decimals
  const outputDecimals = outputChainInfo.nativeCurrency.decimals

  const adjustedAmount = adjustAmountForDecimals({ amount: inputAmount, inputDecimals, outputDecimals })
  const precision = 1000000
  const percentageScale = precision * 100
  const percentageFactor = BigInt(percentage * precision)
  const feePercentage = (BigInt(adjustedAmount) * percentageFactor) / BigInt(percentageScale)
  const feeMiner = BigInt(minerFees)
  const outputAmount = (BigInt(adjustedAmount) - feePercentage - feeMiner).toString()

  const inputAmountInSats =
    direction === LightningBridgeDirection.Submarine
      ? adjustAmountForDecimals({ amount: outputAmount, inputDecimals: outputDecimals, outputDecimals: 8 })
      : adjustAmountForDecimals({ amount: inputAmount, inputDecimals, outputDecimals: 8 })

  if (inputAmountInSats < limits.minimal) {
    throw new FetchError({
      response: new Response(null, { status: 404 }),
      data: {
        errorCode: Err404.errorCode.QUOTE_AMOUNT_TOO_LOW_ERROR,
        detail: `Amount is below minimum limit of ${limits.minimal} sats`,
      },
    })
  }

  if (inputAmountInSats > limits.maximal) {
    throw new FetchError({
      response: new Response(null, { status: 404 }),
      data: {
        errorCode: Err404.errorCode.QUOTE_AMOUNT_TOO_HIGH,
        detail: `Amount exceeds maximum limit of ${limits.maximal} sats`,
      },
    })
  }

  const bridgeQuote: BridgeQuote = {
    quoteId: `lightning-bridge-${Date.now()}`,
    chainId: params.tokenInChainId,
    destinationChainId: params.tokenOutChainId,
    direction,
    swapper: params.swapper,
    input: {
      amount: params.amount,
      token: params.tokenIn,
    },
    output: {
      amount: outputAmount,
      token: params.tokenOut,
    },
    tradeType: params.type,
    gasUseEstimate: '21000',
    estimatedFillTimeMs: 300000,
  }

  const routing = Routing.LN_BRIDGE

  const response: BridgeQuoteResponse = {
    requestId: `lightning-bridge-${Date.now()}`,
    quote: bridgeQuote,
    routing,
    permitData: null,
  }

  return response
}

export const swapQuote = async (params: QuoteRequest): Promise<DiscriminatedQuoteResponse> => {
  return CustomQuoteApiClient.post<DiscriminatedQuoteResponse>(uniswapUrls.tradingApiPaths.quote, {
    body: JSON.stringify({
      ...params,
      type: 'EXACT_INPUT', // TODO: Remove this once the backend is updated
      protocols: params.protocols ?? [Protocol.V3, Protocol.V2],
    }),
    headers: {
      ...V4_HEADERS,
      ...getFeatureFlaggedHeaders(),
    },
  })
}

export type FetchQuote = (params: QuoteRequest & { isUSDQuote?: boolean }) => Promise<DiscriminatedQuoteResponse>

export async function fetchQuote({
  isUSDQuote: _isUSDQuote,
  ...params
}: QuoteRequest & { isUSDQuote?: boolean }): Promise<DiscriminatedQuoteResponse> {
  if (isBitcoinBridgeQuote(params)) {
    return await getBitcoinCrossChainQuote(params)
  }

  if (isLnBitcoinBridgeQuote(params)) {
    return await getLightningBridgeQuote(params)
  }

  return await swapQuote(params)
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

export async function fetchSwap({ ...params }: CreateSwapRequest): Promise<CreateSwapResponse> {
  const quote = params.quote
  const route = (quote as ClassicQuote).route?.[0]
  const tokenIn = route?.[0]?.tokenIn
  const tokenOut = route?.[route.length - 1]?.tokenOut
  const connectedWallet = quote.swapper

  const body = {
    tokenOutAddress: tokenOut?.address,
    tokenOutDecimals: parseInt(tokenOut?.decimals || '18', 10),
    tokenInChainId: tokenIn?.chainId,
    tokenInAddress: tokenIn?.address,
    tokenInDecimals: parseInt(tokenIn?.decimals || '18', 10),
    tokenOutChainId: tokenOut?.chainId,
    amount: (quote as { amount: string }).amount,
    type: 'exactIn',
    recipient: connectedWallet,
    from: connectedWallet,
    slippageTolerance: '5',
    deadline: params.deadline || '1800',
    chainId: tokenIn?.chainId,
    protocols: ['V3', 'V2'],
    ...params.customSwapData,
  }

  const response = await CustomQuoteApiClient.post<{
    data: string
    to: string
    value: string
    swap: {
      chainId: number
      data: string
      from: string
      to: string
      value: string
    }
  }>(uniswapUrls.tradingApiPaths.swap, {
    body: JSON.stringify(body),
    headers: {
      ...V4_HEADERS,
      ...getFeatureFlaggedHeaders(),
    },
  })

  if (params.customSwapData?.type === Routing.WRAP || params.customSwapData?.type === Routing.UNWRAP) {
    return {
      requestId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      ...response,
    }
  }

  return {
    requestId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    swap: {
      chainId: tokenIn?.chainId ?? ChainId._5115,
      data: response.data,
      from: connectedWallet ?? '',
      to: response.to,
      value: response.value,
    },
  }
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
  if (params.token === ZERO_ADDRESS) {
    return {
      requestId: '',
      approval: null,
      cancel: null,
    } as unknown as ApprovalResponse
  }

  const { Contract } = require('ethers')
  const ERC20_ABI = require('uniswap/src/abis/erc20.json')
  const { createEthersProvider } = require('uniswap/src/features/providers/createEthersProvider')
  const { tradingApiToUniverseChainId } = require('uniswap/src/features/transactions/swap/utils/tradingApi')

  const spenderAddress = getSpenderAddress(tradingApiToUniverseChainId(params.chainId))

  try {
    const universeChainId = tradingApiToUniverseChainId(params.chainId)
    if (!universeChainId) {
      throw new Error('Unsupported chain ID')
    }

    const provider = createEthersProvider({ chainId: universeChainId })
    if (!provider) {
      throw new Error('Failed to create provider')
    }
    const tokenContract = new Contract(params.token, ERC20_ABI, provider)
    const currentAllowance = await tokenContract.callStatic.allowance(params.walletAddress, spenderAddress)

    // Convert params.amount to BigNumber with proper decimals
    // params.amount is likely already in wei format, so we use parseUnits with 0 decimals
    const requiredAmount = parseUnits(params.amount, 0)

    // If current allowance is greater than or equal to the required amount, no approval needed
    if (currentAllowance.gte(requiredAmount)) {
      return {
        requestId: '',
        approval: null,
        cancel: null,
      } as unknown as ApprovalResponse
    }
  } catch (error) {}

  const result = await CustomQuoteApiClient.post<{
    gasFee: string
    tokenApproval: TokenApprovalResponse
    requestId: string
  }>('/v1/swap/approve', {
    body: JSON.stringify({
      tokenIn: params.token,
      walletAddress: params.walletAddress,
      chainId: params.chainId,
      spenderAddress,
    }),
    headers: {
      ...getFeatureFlaggedHeaders(),
    },
  })

  const gasStrategy = (params as ApprovalRequest & { gasStrategies?: unknown[] }).gasStrategies?.[0] || {
    limitInflationFactor: 1.2,
    displayLimitInflationFactor: 1.2,
    priceInflationFactor: 1.1,
    percentileThresholdFor1559Fee: 50,
    thresholdToInflateLastBlockBaseFee: 0.5,
    baseFeeMultiplier: 1,
    baseFeeHistoryWindow: 20,
    minPriorityFeeRatioOfBaseFee: 0.1,
    minPriorityFeeGwei: 0.5,
    maxPriorityFeeGwei: 3,
  }

  const gasEstimate = {
    type: FeeType.EIP1559 as const,
    strategy: gasStrategy,
    gasLimit: result.tokenApproval.gasLimit,
    gasFee: result.gasFee,
    maxFeePerGas: result.tokenApproval.maxFeePerGas,
    maxPriorityFeePerGas: result.tokenApproval.maxPriorityFeePerGas,
  }

  const response: ApprovalResponse = {
    requestId: result.requestId,
    approval: result.tokenApproval,
    cancel: result.tokenApproval,
    gasFee: result.gasFee,
    cancelGasFee: '0',
    gasEstimates: [gasEstimate],
  }

  return response
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
  const { tokenIn, tokenInChainId } = params
  const tokens = swappableTokensMappping[tokenInChainId]?.[tokenIn] ?? []

  return {
    requestId: Math.random().toString(36).substring(2, 15),
    tokens,
  }
}

export async function createLpPosition(params: CreateLPPositionRequest): Promise<CreateLPPositionResponse> {
  return await CustomQuoteApiClient.post<CreateLPPositionResponse>(uniswapUrls.tradingApiPaths.createLp, {
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
  return await CustomQuoteApiClient.post<CheckApprovalLPResponse>(uniswapUrls.tradingApiPaths.lpApproval, {
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
  return await CustomQuoteApiClient.get<GetSwapsResponse>(uniswapUrls.tradingApiPaths.swaps, {
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

export async function fetchLightningInvoice(params: {
  amount: string
  lnLikeAddress: string
}): Promise<LightningInvoice> {
  return await TradingApiClient.post<LightningInvoice>('/v1/lightning/invoice', {
    body: JSON.stringify({
      amount: params.amount,
      lnLikeAddress: params.lnLikeAddress,
    }),
  })
}

// Default maximum amount of combinations wallet<>chainId per check delegation request
const DEFAULT_CHECK_VALIDATIONS_BATCH_THRESHOLD = 140

/*
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
*/

export async function checkWalletDelegationWithoutBatching(
  _params: WalletCheckDelegationRequestBody,
): Promise<WalletCheckDelegationResponseBody> {
  // DISABLED: Endpoint /v1/wallet/check_delegation does not exist in backend API
  return {
    requestId: '',
    delegationDetails: {},
  }

  // return await TradingApiClient.post<WalletCheckDelegationResponseBody>(
  //   uniswapUrls.tradingApiPaths.wallet.checkDelegation,
  //   {
  //     body: JSON.stringify({
  //       ..._params,
  //     }),
  //     headers: {
  //       ...getFeatureFlaggedHeaders(),
  //     },
  //   },
  // )
}

/*
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
*/

export type CheckWalletDelegation = (
  params: WalletCheckDelegationRequestBody,
) => Promise<WalletCheckDelegationResponseBody>

export async function checkWalletDelegation(
  params: WalletCheckDelegationRequestBody,
  _batchThreshold: number = DEFAULT_CHECK_VALIDATIONS_BATCH_THRESHOLD,
): Promise<WalletCheckDelegationResponseBody> {
  const { walletAddresses } = params

  // If no wallet addresses provided, no need to make a call to backend
  if (!walletAddresses || walletAddresses.length === 0) {
    return {
      requestId: '',
      delegationDetails: {},
    }
  }

  // Batching disabled - always make a single request
  return await checkWalletDelegationWithoutBatching(params)

  /*
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
  */
}

export async function validateLightningAddress(params: { lnLikeAddress: string }): Promise<{ validated: boolean }> {
  return await TradingApiClient.post<{ validated: boolean }>('/v1/lightning/validate', {
    body: JSON.stringify({
      ...params,
    }),
  })
}
