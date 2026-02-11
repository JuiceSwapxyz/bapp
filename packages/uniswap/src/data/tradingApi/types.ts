// These types are used in the gas estimation improvement experiment.
// They are internal to uniswap, so they are not declared in the Trading API public definition.
// Once the experiment is complete, we can remove them easily or add them to the public API definition.

export enum FeeType {
  LEGACY = 'legacy',
  EIP1559 = 'eip1559',
}

export interface GasStrategy {
  limitInflationFactor: number
  displayLimitInflationFactor: number
  priceInflationFactor: number
  percentileThresholdFor1559Fee: number
  thresholdToInflateLastBlockBaseFee?: number | null
  baseFeeMultiplier?: number | null
  baseFeeHistoryWindow?: number | null
  minPriorityFeeRatioOfBaseFee?: number | null
  minPriorityFeeGwei?: number | null
  maxPriorityFeeGwei?: number | null
}

export interface GasEstimateLegacy {
  gasPrice: string
  gasLimit: string
  type: FeeType.LEGACY
  strategy: GasStrategy
  gasFee: string
}

export interface GasEstimateEip1559 {
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  gasLimit: string
  type: FeeType.EIP1559
  strategy: GasStrategy
  gasFee: string
}

export type GasEstimate = GasEstimateLegacy | GasEstimateEip1559

export type CustomSwapDataForRequest = {
  tokenOutAddress: string
  tokenOutDecimals: number
  tokenInChainId: number
  tokenInAddress: string
  tokenInDecimals: number
  tokenOutChainId: number
  chainId: number
  amount?: string
  type?: string
  slippageTolerance?: string
}

export enum LightningBridgeDirection {
  Submarine = 'submarine',
  Reverse = 'reverse',
}

export enum BitcoinBridgeDirection {
  BitcoinToCitrea = 'bitcoin-to-citrea',
  CitreaToBitcoin = 'citrea-to-bitcoin',
}

export enum Erc20ChainSwapDirection {
  PolygonToCitrea = 'PolygonToCitrea',
  CitreaToPolygon = 'CitreaToPolygon',
  EthereumToCitrea = 'EthereumToCitrea',
  CitreaToEthereum = 'CitreaToEthereum',
}

export { WbtcBridgeDirection } from 'uniswap/src/data/apiClients/tradingApi/utils/isBitcoinBridge'

export interface LightningInvoice {
  requestId: string
  invoice: {
    paymentRequest: string
    paymentHash: string
    satoshi: number
    timestamp: number
    expiry: number
    createdDate: string
    expiryDate: string
  }
}

export interface PoolDetailsRequestBody {
  address: string
  chain: string
}

interface TokenInfo {
  id: string
  address: string
  chain: string
  decimals: number
  name: string
  standard: string
  symbol: string
  isBridged: null | unknown
  bridgedWithdrawalInfo: null | unknown
  project: {
    id: string
    isSpam: boolean
    logoUrl: string | null
    name: string
    safetyLevel: string
    markets: unknown[]
    logo: {
      id: string
      url: string
    } | null
  }
  feeData: null | unknown
  protectionInfo: null | unknown
  market: {
    id: string
    price: {
      id: string
      value: number
    }
  }
}

export interface PoolDetailsResponse {
  data: {
    v3Pool: {
      id: string
      protocolVersion: string
      address: string
      feeTier: number
      token0: TokenInfo
      token0Supply: number
      token1: TokenInfo
      token1Supply: number
      txCount: number
      volume24h: {
        value: number
      }
      historicalVolume: Array<{
        value: number
        timestamp: number
      }>
      totalLiquidity: {
        value: number
      }
      totalLiquidityPercentChange24h: {
        value: number
      }
    }
  }
}

export type SwapType = "submarine" | "reverse" | "chain";

/**
 * POST /v1/bridge-swaps
 * Create a new bridge swap record
 */
export interface CreateBridgeSwapRequest {
  id: string;
  userId: string;
  type: SwapType;
  version: number;
  status: string;
  assetSend: string;
  assetReceive: string;
  sendAmount: string | number;
  receiveAmount: string | number;
  date: string | number;
  preimage: string;
  preimageHash: string;
  preimageSeed: string;
  keyIndex: number;
  claimPrivateKeyIndex?: number;
  refundPrivateKeyIndex?: number;
  claimAddress: string;
  address?: string;
  refundAddress?: string;
  lockupAddress?: string;
  claimTx?: string;
  refundTx?: string;
  lockupTx?: string;
  invoice?: string;
  acceptZeroConf?: boolean;
  expectedAmount?: string | number;
  onchainAmount?: string | number;
  timeoutBlockHeight?: number;
  claimDetails?: any;
  lockupDetails?: any;
  referralId?: string;
  chainId?: number;
}

/**
 * POST /v1/bridge-swaps/bulk
 * Create multiple bridge swap records in a single transaction
 */
export interface BulkCreateBridgeSwapRequest {
  swaps: CreateBridgeSwapRequest[];
}

/**
 * GET /v1/bridge-swaps/user/:userId
 * Query parameters for getting bridge swaps by user
 */
export interface GetBridgeSwapsByUserQuery {
  limit?: string | number; // Default: 50, Max: 100
  offset?: string | number; // Default: 0
  status?: string;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Bridge swap record returned from GET endpoints
 */
export interface BridgeSwapResponse {
  id: string;
  userId: string;
  type: SwapType;
  version: number;
  status: string;
  assetSend: string;
  assetReceive: string;
  sendAmount: string; // BigInt as string
  receiveAmount: string; // BigInt as string
  date: string; // Unix timestamp as string
  preimage: string;
  preimageHash: string;
  preimageSeed: string;
  keyIndex: number;
  claimPrivateKeyIndex: number | null;
  refundPrivateKeyIndex: number | null;
  claimAddress: string;
  address: string | null;
  refundAddress: string | null;
  lockupAddress: string | null;
  claimTx: string | null;
  refundTx: string | null;
  lockupTx: string | null;
  invoice: string | null;
  acceptZeroConf: boolean | null;
  expectedAmount: string | null; // BigInt as string
  onchainAmount: string | null; // BigInt as string
  timeoutBlockHeight: number | null;
  claimDetails: any | null;
  lockupDetails: any | null;
  referralId: string | null;
  chainId: number | null;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

/**
 * POST /v1/bridge-swaps
 * Response: 201 Created
 */
export type CreateBridgeSwapResponse = BridgeSwapResponse;

/**
 * POST /v1/bridge-swaps/bulk
 * Response: 201 Created
 */
export interface BulkCreateBridgeSwapResponse {
  count: number; // Number of swaps successfully created
  requested: number; // Number of swaps in the request
  skipped: number; // Number of duplicate swaps skipped
}

/**
 * GET /v1/bridge-swaps/:id
 * Response: 200 OK
 */
export type GetBridgeSwapByIdResponse = BridgeSwapResponse;

/**
 * GET /v1/bridge-swaps/user/:userId
 * Response: 200 OK
 */
export interface GetBridgeSwapsByUserResponse {
  swaps: BridgeSwapResponse[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// Error Response Types
// ============================================================================

export interface ErrorResponse {
  error: string;
  detail: string;
}
