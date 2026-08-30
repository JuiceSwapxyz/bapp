import { ADDRESS_ZERO } from '@juiceswapxyz/v3-sdk'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'

// Gateway routing types for JuiceSwap Gateway (JUSD abstraction and JUICE equity swaps)
// These are custom routing types not in the generated Routing enum
export const GATEWAY_JUSD_ROUTING = 'GATEWAY_JUSD' as const
export const GATEWAY_JUICE_IN_ROUTING = 'GATEWAY_JUICE_IN' as const
export const GATEWAY_JUICE_OUT_ROUTING = 'GATEWAY_JUICE_OUT' as const

// Satsuma direct routing — used when the JuiceSwap Quote API picks the
// Satsuma USDC.e/ctUSD pool over the thin JuiceSwap V3 Classic pool.
export const SATSUMA_ROUTING = 'SATSUMA' as const

// Direct-pool routing — client-side fallback for selling JUSD when the JuiceSwap Gateway is
// paused (savings rate 0%). The quote and swap calldata are computed locally against a real
// on-chain JUSD/WCBTC V3 pool, bypassing the remote quote API entirely.
// See utils/jusdDirectPool.ts.
export const DIRECT_POOL_ROUTING = 'DIRECT_POOL' as const

export type GatewayJusdRouting =
  | typeof GATEWAY_JUSD_ROUTING
  | typeof GATEWAY_JUICE_IN_ROUTING
  | typeof GATEWAY_JUICE_OUT_ROUTING

export type SatsumaRouting = typeof SATSUMA_ROUTING

export type DirectPoolRouting = typeof DIRECT_POOL_ROUTING

// All Gateway routing variants
// Note: SUSD is routed through Gateway via registerBridgedToken() - no separate routing type needed
export const GATEWAY_ROUTING_VARIANTS = [
  GATEWAY_JUSD_ROUTING,
  GATEWAY_JUICE_IN_ROUTING,
  GATEWAY_JUICE_OUT_ROUTING,
] as const

// TradeRouting encompasses all routing types including custom ones not in the Routing enum
export type TradeRouting = Routing | GatewayJusdRouting | SatsumaRouting | DirectPoolRouting

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
  return GATEWAY_ROUTING_VARIANTS.includes(obj.routing as GatewayJusdRouting)
}

export function isSatsuma<T extends { routing: TradeRouting }>(obj: T): obj is T & { routing: SatsumaRouting } {
  return obj.routing === SATSUMA_ROUTING
}

export function isJusdDirectPool<T extends { routing: TradeRouting }>(
  obj: T,
): obj is T & { routing: DirectPoolRouting } {
  return obj.routing === DIRECT_POOL_ROUTING
}

export function isBridge<T extends { routing: TradeRouting }>(
  obj: T,
): obj is T & { routing: Routing.BRIDGE | Routing.ERC20_CHAIN_SWAP | Routing.WBTC_BRIDGE } {
  return (
    obj.routing === Routing.BRIDGE || obj.routing === Routing.ERC20_CHAIN_SWAP || obj.routing === Routing.WBTC_BRIDGE
  )
}

export function isBitcoinBridge<T extends { routing: TradeRouting }>(
  obj: T,
): obj is T & { routing: Routing.BITCOIN_BRIDGE } {
  return obj.routing === Routing.BITCOIN_BRIDGE
}

export function isLightningBridge<T extends { routing: TradeRouting }>(
  obj: T,
): obj is T & { routing: Routing.LN_BRIDGE } {
  return obj.routing === Routing.LN_BRIDGE
}

export function isErc20ChainSwap<T extends { routing: TradeRouting }>(
  obj: T,
): obj is T & { routing: Routing.ERC20_CHAIN_SWAP } {
  return obj.routing === Routing.ERC20_CHAIN_SWAP
}

export function isWbtcBridge<T extends { routing: TradeRouting }>(obj: T): obj is T & { routing: Routing.WBTC_BRIDGE } {
  return obj.routing === Routing.WBTC_BRIDGE
}

export function isWrap<T extends { routing: TradeRouting }>(
  obj: T,
): obj is T & { routing: Routing.WRAP | Routing.UNWRAP } {
  return obj.routing === Routing.WRAP || obj.routing === Routing.UNWRAP
}

export const ACROSS_DAPP_INFO = {
  name: 'Across API',
  address: ADDRESS_ZERO,
  icon: 'https://protocol-icons.s3.amazonaws.com/icons/across.jpg',
}
