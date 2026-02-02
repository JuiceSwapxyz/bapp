import { Routing, CreateSwapRequest } from "uniswap/src/data/tradingApi/__generated__/index"
import { GasEstimate } from "uniswap/src/data/tradingApi/types"
import { GasFeeResult, ValidatedGasFeeResult, validateGasFeeResult } from "uniswap/src/features/gas/types"
import { BridgeTrade, BitcoinBridgeTrade, LightningBridgeTrade, ClassicTrade, GatewayJusdTrade, UniswapXTrade, UnwrapTrade, WrapTrade } from "uniswap/src/features/transactions/swap/types/trade"
import { isBridge, isBitcoinBridge, isErc20ChainSwap, isLightningBridge, isClassic, isGatewayJusd, isUniswapX, isWrap, isWbtcBridge, GatewayJusdRouting } from "uniswap/src/features/transactions/swap/utils/routing"
import { isInterface } from "utilities/src/platform"
import { Prettify } from "viem"
import { ValidatedPermit } from "uniswap/src/features/transactions/swap/utils/trade"
import { PopulatedTransactionRequestArray, ValidatedTransactionRequest } from "uniswap/src/features/transactions/types/transactionRequests"

export type SwapTxAndGasInfo = ClassicSwapTxAndGasInfo | GatewayJusdSwapTxAndGasInfo | UniswapXSwapTxAndGasInfo | BridgeSwapTxAndGasInfo | BitcoinBridgeSwapTxAndGasInfo | LightningBridgeSwapTxAndGasInfo | WrapSwapTxAndGasInfo
export type ValidatedSwapTxContext = ValidatedClassicSwapTxAndGasInfo | ValidatedGatewayJusdSwapTxAndGasInfo | ValidatedUniswapXSwapTxAndGasInfo | ValidatedBridgeSwapTxAndGasInfo | ValidatedBitcoinBridgeSwapTxAndGasInfo | ValidatedLightningBridgeSwapTxAndGasInfo | ValidatedWrapSwapTxAndGasInfo

export function isValidSwapTxContext(swapTxContext: SwapTxAndGasInfo): swapTxContext is ValidatedSwapTxContext {
  // Validation fn prevents/future-proofs typeguard against illicit casts
  return validateSwapTxContext(swapTxContext) !== undefined
}

export type SwapGasFeeEstimation = {
  swapEstimate?: GasEstimate
  approvalEstimate?: GasEstimate
  wrapEstimate?: GasEstimate
}

export type UniswapXGasBreakdown = {
  classicGasUseEstimateUSD?: string
  approvalCost?: string
  inputTokenSymbol?: string
}

export interface BaseSwapTxAndGasInfo {
  routing: Routing
  trade?: ClassicTrade | GatewayJusdTrade | UniswapXTrade | BridgeTrade | BitcoinBridgeTrade | LightningBridgeTrade | WrapTrade | UnwrapTrade
  approveTxRequest: ValidatedTransactionRequest | undefined
  revocationTxRequest: ValidatedTransactionRequest | undefined
  gasFee: GasFeeResult
  gasFeeEstimation: SwapGasFeeEstimation
  includesDelegation?: boolean
}

export enum PermitMethod {
  Transaction = 'Transaction',
  TypedData = 'TypedData',
}

export type PermitTransaction = {
  method: PermitMethod.Transaction
  txRequest: ValidatedTransactionRequest
}

export type PermitTypedData = {
  method: PermitMethod.TypedData
  typedData: ValidatedPermit
}

export interface ClassicSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: Routing.CLASSIC
  trade?: ClassicTrade
  permit: PermitTransaction | PermitTypedData | undefined
  swapRequestArgs: CreateSwapRequest | undefined
  /**
   * `unsigned` is true if `txRequest` is undefined due to a permit signature needing to be signed first.
   * This occurs on interface where the user must be prompted to sign a permit before txRequest can be fetched.
  */
  unsigned: boolean
  txRequests: PopulatedTransactionRequestArray | undefined
}

/**
 * Gateway JUSD swaps route through JuiceSwapGateway contract for JUSD/svJUSD abstraction and JUICE equity swaps.
 * These behave like classic swaps but use custom Gateway routing types.
 */
export interface GatewayJusdSwapTxAndGasInfo extends Omit<BaseSwapTxAndGasInfo, 'routing'> {
  routing: GatewayJusdRouting
  trade?: GatewayJusdTrade
  permit: PermitTransaction | PermitTypedData | undefined
  swapRequestArgs: CreateSwapRequest | undefined
  unsigned: boolean
  txRequests: PopulatedTransactionRequestArray | undefined
}

export interface WrapSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: Routing.WRAP | Routing.UNWRAP
  trade: WrapTrade | UnwrapTrade
  txRequests: PopulatedTransactionRequestArray | undefined
}

export interface UniswapXSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: Routing.DUTCH_V2 | Routing.DUTCH_V3 | Routing.PRIORITY
  trade: UniswapXTrade
  permit: PermitTypedData | undefined
  gasFeeBreakdown: UniswapXGasBreakdown
}

export interface BridgeSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: Routing.BRIDGE | Routing.ERC20_CHAIN_SWAP | Routing.WBTC_BRIDGE
  trade: BridgeTrade
  txRequests: PopulatedTransactionRequestArray | undefined
}

export interface BitcoinBridgeSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: Routing.BITCOIN_BRIDGE
  trade: BitcoinBridgeTrade
  txRequests: PopulatedTransactionRequestArray | undefined
  destinationAddress?: string
}

export interface LightningBridgeSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: Routing.LN_BRIDGE
  trade: LightningBridgeTrade
  txRequests: PopulatedTransactionRequestArray | undefined
  destinationAddress?: string
}

interface BaseRequiredSwapTxContextFields {
  gasFee: ValidatedGasFeeResult
}

export type ValidatedClassicSwapTxAndGasInfo =  Prettify<Required<Omit<ClassicSwapTxAndGasInfo, 'includesDelegation'>> & BaseRequiredSwapTxContextFields & ({
  unsigned: true
  permit: PermitTypedData
  txRequests: undefined
} | {
  unsigned: false
  permit: PermitTransaction | undefined
  txRequests: PopulatedTransactionRequestArray
}) & Pick<ClassicSwapTxAndGasInfo, 'includesDelegation'>>

export type ValidatedGatewayJusdSwapTxAndGasInfo = Prettify<Required<Omit<GatewayJusdSwapTxAndGasInfo, 'includesDelegation'>> & BaseRequiredSwapTxContextFields & ({
  unsigned: true
  permit: PermitTypedData
  txRequests: undefined
} | {
  unsigned: false
  permit: PermitTransaction | undefined
  txRequests: PopulatedTransactionRequestArray
}) & Pick<GatewayJusdSwapTxAndGasInfo, 'includesDelegation'>>

export type ValidatedWrapSwapTxAndGasInfo =  Prettify<Required<Omit<WrapSwapTxAndGasInfo, 'includesDelegation'>> & BaseRequiredSwapTxContextFields & {
  txRequests: PopulatedTransactionRequestArray
} & Pick<WrapSwapTxAndGasInfo, 'includesDelegation'>>

export type ValidatedBridgeSwapTxAndGasInfo =  Prettify<Required<Omit<BridgeSwapTxAndGasInfo, 'includesDelegation' | 'txRequests'>> & BaseRequiredSwapTxContextFields & ({
  txRequests: PopulatedTransactionRequestArray | undefined
}) & Pick<BridgeSwapTxAndGasInfo, 'includesDelegation'>>

export type ValidatedBitcoinBridgeSwapTxAndGasInfo = Prettify<Required<Omit<BitcoinBridgeSwapTxAndGasInfo, 'includesDelegation' | 'txRequests' | 'destinationAddress'>> & BaseRequiredSwapTxContextFields & ({
  txRequests: PopulatedTransactionRequestArray | undefined
  destinationAddress: string | undefined
}) & Pick<BitcoinBridgeSwapTxAndGasInfo, 'includesDelegation'>>

export type ValidatedLightningBridgeSwapTxAndGasInfo = Prettify<Required<Omit<LightningBridgeSwapTxAndGasInfo, 'includesDelegation' | 'txRequests' | 'destinationAddress'>> & BaseRequiredSwapTxContextFields & ({
  txRequests: PopulatedTransactionRequestArray | undefined
  destinationAddress: string | undefined
}) & Pick<LightningBridgeSwapTxAndGasInfo, 'includesDelegation'>>

export type ValidatedUniswapXSwapTxAndGasInfo =  Prettify<Required<Omit<UniswapXSwapTxAndGasInfo, 'includesDelegation'>> & BaseRequiredSwapTxContextFields & {
  // Permit should always be defined for UniswapX orders
  permit: PermitTypedData
} & Pick<UniswapXSwapTxAndGasInfo, 'includesDelegation'>>

/** Helper to validate Classic-style swaps (Classic and Gateway both use this pattern) */
function validateClassicStyleSwap<T extends ClassicSwapTxAndGasInfo | GatewayJusdSwapTxAndGasInfo, V>(params: {
  swapTxContext: SwapTxAndGasInfo
  context: T
  gasFee: ValidatedGasFeeResult
}): V | undefined {
  const { swapTxContext, context, gasFee } = params
  const { trade, unsigned, permit, txRequests, includesDelegation } = context
  if (unsigned) {
    // SwapTxContext should only ever be unsigned / still require a signature on interface.
    if (!isInterface || !permit || permit.method !== PermitMethod.TypedData) {
      return undefined
    }
    return { ...swapTxContext, trade, gasFee, unsigned, txRequests: undefined, permit, includesDelegation } as V
  } else if (txRequests) {
    return { ...swapTxContext, trade, gasFee, unsigned, txRequests, permit: undefined, includesDelegation } as V
  }
  return undefined
}

/**
 * Validates a SwapTxAndGasInfo object without any casting and returns a ValidatedSwapTxContext object if the object is valid.
 * @param swapTxContext - The SwapTxAndGasInfo object to validate.
 * @returns A ValidatedSwapTxContext object if the object is valid, otherwise undefined.
 */
function validateSwapTxContext(swapTxContext: SwapTxAndGasInfo): ValidatedSwapTxContext | undefined {
  const gasFee = validateGasFeeResult(swapTxContext.gasFee)
  if (!gasFee) {
    return undefined
  }
  // Main validation logic
  if (swapTxContext.trade) {
    // Gateway JUSD trades are validated like Classic trades (require txRequests)
    if (isClassic(swapTxContext)) {
      return validateClassicStyleSwap<ClassicSwapTxAndGasInfo, ValidatedClassicSwapTxAndGasInfo>({
        swapTxContext, context: swapTxContext, gasFee
      })
    } else if (isGatewayJusd(swapTxContext)) {
      return validateClassicStyleSwap<GatewayJusdSwapTxAndGasInfo, ValidatedGatewayJusdSwapTxAndGasInfo>({
        swapTxContext, context: swapTxContext as GatewayJusdSwapTxAndGasInfo, gasFee
      })
    } else if (isBitcoinBridge(swapTxContext)) {
      const { trade, txRequests, includesDelegation, destinationAddress } = swapTxContext
        return { ...swapTxContext, trade, gasFee, txRequests, includesDelegation, destinationAddress }
    } else if (isLightningBridge(swapTxContext)) {
      const { trade, txRequests, includesDelegation, destinationAddress } = swapTxContext
      return { ...swapTxContext, trade, gasFee, txRequests, includesDelegation, destinationAddress }
    } else if (isBridge(swapTxContext)) {
      const { trade, txRequests, includesDelegation } = swapTxContext

      // ERC20 chain swaps and WBTC bridge don't require txRequests since Boltz handles the swap
      if (isErc20ChainSwap(swapTxContext) || isWbtcBridge(swapTxContext)) {
        return {
          ...swapTxContext,
          trade,
          gasFee,
          txRequests: txRequests as PopulatedTransactionRequestArray | undefined,
          includesDelegation,
        } as ValidatedBridgeSwapTxAndGasInfo
      }

      if (txRequests) {
        return { ...swapTxContext, trade, gasFee, txRequests, includesDelegation }
      }
      return undefined
    } else if (isUniswapX(swapTxContext) && swapTxContext.permit) {
      const { trade, permit } = swapTxContext
      return { ...swapTxContext, trade, gasFee, permit, includesDelegation: false }
    } else if (isWrap(swapTxContext)) {
      const { trade, txRequests } = swapTxContext
      if (txRequests) {
        return { ...swapTxContext, trade, gasFee, txRequests, includesDelegation: false }
      } else {
        return undefined
      }
    } else {
      return undefined
    }
  } else {
    return undefined
  }
}

/**
 * Returns the first EVM txRequest in a SwapTxAndGasInfo object if it exists.
 * Moved here from routing.ts to avoid circular dependency.
 */
export function getEVMTxRequest(swapTxContext: SwapTxAndGasInfo): ValidatedTransactionRequest | undefined {
  if (isUniswapX(swapTxContext)) {
    return undefined
  }
  return (swapTxContext as ClassicSwapTxAndGasInfo | GatewayJusdSwapTxAndGasInfo | WrapSwapTxAndGasInfo | BridgeSwapTxAndGasInfo).txRequests?.[0]
}
