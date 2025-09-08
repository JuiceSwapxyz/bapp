import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

/**
 * Filters out CITREA_TESTNET from an array of GraphQL chains.
 * This is needed because Citrea Testnet is not yet supported by the backend.
 *
 * @param chains - Array of GraphQL chain identifiers
 * @returns Filtered array without CITREA_TESTNET, properly typed
 */
export function filterCitreaTestnet<T extends Chain>(chains: readonly T[]): T[] {
  // Type assertion is safe here because we know the filtered result
  // will still be a valid subset of the original chain type
  return chains.filter((chain): chain is T => chain !== ('CITREA_TESTNET' as any))
}

/**
 * Type guard to check if a chain is not CITREA_TESTNET
 * @param chain - GraphQL chain identifier
 * @returns true if the chain is not CITREA_TESTNET
 */
export function isNotCitreaTestnet(chain: Chain | string): boolean {
  return chain !== 'CITREA_TESTNET'
}

/**
 * Returns a GraphQL chain or undefined if it's CITREA_TESTNET
 * @param chain - GraphQL chain identifier
 * @returns The chain if not CITREA_TESTNET, otherwise undefined
 */
export function getChainOrUndefined(chain: Chain | string): Chain | undefined {
  if (chain === 'CITREA_TESTNET') {
    return undefined
  }
  return chain as Chain
}
