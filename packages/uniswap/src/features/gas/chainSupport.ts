/**
 * Chains supported by the Uniswap Gateway Gas Fee API
 * https://interface.gateway.uniswap.org/v1/gas-fee
 *
 * These chain IDs are the only ones accepted by the Uniswap gas service.
 * For other chains, we fall back to client-side gas estimation using provider.estimateGas()
 *
 * Source: Based on validation error message from the API
 */
export const UNISWAP_GAS_API_SUPPORTED_CHAINS = [
  1, // Ethereum Mainnet
  5, // Goerli (deprecated but still in API)
  10, // Optimism
  56, // BNB Chain
  130, // Unichain Mainnet
  137, // Polygon
  324, // zkSync
  480, // World Chain
  1301, // Soneium Mainnet
  1868, // Unichain Sepolia
  7777777, // Zora
  8453, // Base
  10143, // Arbitrum Sepolia
  42161, // Arbitrum One
  42220, // Celo
  43114, // Avalanche
  80001, // Mumbai (deprecated but still in API)
  81457, // Blast
  84532, // Base Sepolia
  11155111, // Sepolia
] as const

/**
 * Type representing a chain ID supported by the Uniswap Gas API
 */
export type UniswapGasApiSupportedChain = (typeof UNISWAP_GAS_API_SUPPORTED_CHAINS)[number]

/**
 * Checks if a chain is supported by the Uniswap Gateway Gas Fee API.
 *
 * For unsupported chains (like Citrea Testnet), the gas estimation will
 * fall back to client-side estimation using provider.estimateGas()
 *
 * @param chainId - The chain ID to check
 * @returns true if the chain is supported by the Uniswap Gas API, false otherwise
 */
export function isUniswapGasApiSupportedChain(chainId: number | undefined): boolean {
  if (!chainId) {
    return false
  }
  return (UNISWAP_GAS_API_SUPPORTED_CHAINS as readonly number[]).includes(chainId)
}
