/**
 * JuiceDollar Token Abstraction
 *
 * This module provides utilities for abstracting svJUSD (internal yield-bearing token)
 * to JUSD (user-facing stablecoin). Users interact with JUSD, but internally all pools
 * use svJUSD to earn savings interest on LP positions.
 *
 * All addresses are imported from canonical source packages:
 * - @juicedollar/jusd: JUSD, svJUSD, JUICE token addresses
 * - @juiceswapxyz/sdk-core: Gateway address
 */

import { ADDRESS } from '@juicedollar/jusd'
import { CHAIN_TO_ADDRESSES_MAP, ChainId } from '@juiceswapxyz/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

// Map UniverseChainId to numeric chainId for package lookups
const CHAIN_ID_MAP: Partial<Record<UniverseChainId, number>> = {
  [UniverseChainId.CitreaTestnet]: ChainId.CITREA_TESTNET,
}

// Build address maps from canonical packages
function buildAddressMap(
  getter: (chainAddresses: (typeof ADDRESS)[number]) => string,
): Partial<Record<UniverseChainId, string>> {
  const result: Partial<Record<UniverseChainId, string>> = {}
  for (const [universeChainId, numericChainId] of Object.entries(CHAIN_ID_MAP)) {
    const chainAddresses = ADDRESS[numericChainId as unknown as number]
    if (chainAddresses) {
      result[Number(universeChainId) as UniverseChainId] = getter(chainAddresses)
    }
  }
  return result
}

// JuiceDollar token addresses by chain - imported from @juicedollar/jusd
export const JUSD_ADDRESSES: Partial<Record<UniverseChainId, string>> = buildAddressMap((a) => a.juiceDollar)

export const SV_JUSD_ADDRESSES: Partial<Record<UniverseChainId, string>> = buildAddressMap((a) => a.savingsVaultJUSD)

export const JUICE_ADDRESSES: Partial<Record<UniverseChainId, string>> = buildAddressMap((a) => a.equity)

// Gateway address from @juiceswapxyz/sdk-core CHAIN_TO_ADDRESSES_MAP
// Type assertion needed as juiceSwapGatewayAddress may not be in older sdk-core types
type ExtendedChainAddresses = { juiceSwapGatewayAddress?: string }
const citreaAddresses = CHAIN_TO_ADDRESSES_MAP[ChainId.CITREA_TESTNET] as ExtendedChainAddresses | undefined
export const JUICE_SWAP_GATEWAY_ADDRESSES: Partial<Record<UniverseChainId, string>> = {
  [UniverseChainId.CitreaTestnet]: citreaAddresses?.juiceSwapGatewayAddress ?? '',
}

/**
 * Check if an address is the svJUSD token on a given chain
 */
export function isSvJusdAddress(chainId: UniverseChainId, address: string): boolean {
  const svJusdAddress = SV_JUSD_ADDRESSES[chainId]
  if (!svJusdAddress) {
    return false
  }
  return address.toLowerCase() === svJusdAddress.toLowerCase()
}

/**
 * Check if an address is the JUSD token on a given chain
 */
export function isJusdAddress(chainId: UniverseChainId, address: string): boolean {
  const jusdAddress = JUSD_ADDRESSES[chainId]
  if (!jusdAddress) {
    return false
  }
  return address.toLowerCase() === jusdAddress.toLowerCase()
}

/**
 * Check if an address is the JUICE token on a given chain
 */
export function isJuiceAddress(chainId: UniverseChainId, address: string): boolean {
  const juiceAddress = JUICE_ADDRESSES[chainId]
  if (!juiceAddress) {
    return false
  }
  return address.toLowerCase() === juiceAddress.toLowerCase()
}

/**
 * Check if a chain has JuiceDollar integration
 */
export function hasJuiceDollarIntegration(chainId: UniverseChainId): boolean {
  return Boolean(JUSD_ADDRESSES[chainId])
}

/**
 * Get the JUSD address for a chain (to use when transforming svJUSD)
 */
export function getJusdAddress(chainId: UniverseChainId): string | undefined {
  return JUSD_ADDRESSES[chainId]
}

/**
 * Get the svJUSD address for a chain
 */
export function getSvJusdAddress(chainId: UniverseChainId): string | undefined {
  return SV_JUSD_ADDRESSES[chainId]
}

/**
 * Get the JUICE address for a chain
 */
export function getJuiceAddress(chainId: UniverseChainId): string | undefined {
  return JUICE_ADDRESSES[chainId]
}
