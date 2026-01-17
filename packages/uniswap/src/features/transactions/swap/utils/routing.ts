import { ADDRESS_ZERO } from '@juiceswapxyz/v3-sdk'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'

// GATEWAY_JUSD is a custom routing type for JuiceSwap Gateway that's not in the generated Routing enum
export const GATEWAY_JUSD_ROUTING = 'GATEWAY_JUSD' as const
export type GatewayJusdRouting = typeof GATEWAY_JUSD_ROUTING

// TradeRouting encompasses all routing types including custom ones not in the Routing enum
export type TradeRouting = Routing | GatewayJusdRouting

export const UNISWAPX_ROUTING_VARIANTS = [
  Routing.DUTCH_V2,
  Routing.DUTCH_V3,
  Routing.DUTCH_LIMIT,
  Routing.PRIORITY,
] as const
type UniswapXRouting = (typeof UNISWAPX_ROUTING_VARIANTS)[number]

export function isUniswapX<T extends { routing: TradeRouting }>(obj: T): obj is T & { routing: UniswapXRouting } {
  return UNISWAPX_ROUTING_VARIANTS.includes(obj.routing as UniswapXRouting)
}

export function isClassic<T extends { routing: TradeRouting }>(obj: T): obj is T & { routing: Routing.CLASSIC } {
  return obj.routing === Routing.CLASSIC
}

export function isGatewayJusd<T extends { routing: TradeRouting }>(obj: T): obj is T & { routing: GatewayJusdRouting } {
  return obj.routing === GATEWAY_JUSD_ROUTING
}

export function isBridge<T extends { routing: TradeRouting }>(obj: T): obj is T & { routing: Routing.BRIDGE } {
  return obj.routing === Routing.BRIDGE
}

export function isBitcoinBridge<T extends { routing: TradeRouting }>(
  obj: T,
): obj is T & { routing: Routing.BITCOIN_BRIDGE } {
  return obj.routing === Routing.BITCOIN_BRIDGE
}

export function isLightningBridge<T extends { routing: TradeRouting }>(obj: T): obj is T & { routing: Routing.LN_BRIDGE } {
  return obj.routing === Routing.LN_BRIDGE
}

export function isWrap<T extends { routing: TradeRouting }>(obj: T): obj is T & { routing: Routing.WRAP | Routing.UNWRAP } {
  return obj.routing === Routing.WRAP || obj.routing === Routing.UNWRAP
}

// Returns the first EVM txRequest in a SwapTxAndGasInfo object if it exists, otherwise undefined
export function getEVMTxRequest(swapTxContext: SwapTxAndGasInfo): ValidatedTransactionRequest | undefined {
  if (isUniswapX(swapTxContext)) {
    return undefined
  }
  return swapTxContext.txRequests?.[0]
}

export const ACROSS_DAPP_INFO = {
  name: 'Across API',
  address: ADDRESS_ZERO,
  icon: 'https://protocol-icons.s3.amazonaws.com/icons/across.jpg',
}
