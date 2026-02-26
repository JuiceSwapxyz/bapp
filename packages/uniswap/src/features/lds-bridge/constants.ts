import { UniverseChainId } from 'uniswap/src/features/chains/types'

// LDS (Lightning.Space) contract address that holds bridge liquidity
// Used to check on-chain balances for Citrea, Ethereum, and Polygon tokens
export const LDS_ADDRESS = '0xDDA7efc856833960694cb26cb583e0CCCA497b87' as const

// WBTCe (LayerZero bridged WBTC) token addresses on Citrea chains
export const WBTC_E_ADDRESSES: Partial<Record<UniverseChainId, string>> = {
  [UniverseChainId.CitreaTestnet]: '0xDF240DC08B0FdaD1d93b74d5048871232f6BEA3d',
}

// Swap contract addresses by chain ID for direct on-chain claims and refunds
export const SWAP_CONTRACT_ADDRESSES: Record<number, { coinSwap?: string; erc20Swap: string }> = {
  4114: {
    // Citrea Mainnet
    coinSwap: '0xFD92F846fe6E7d08d28D6A88676BB875E5D906ab',
    erc20Swap: '0x7397F25F230f7d5A83c18e1B68b32511bf35F860',
  },
  5115: {
    // Citrea Testnet
    coinSwap: '0xd02731fD8c5FDD53B613A699234FAd5EE8851B65',
    erc20Swap: '0xf2e019a371e5Fd32dB2fC564Ad9eAE9E433133cc',
  },
  137: {
    // Polygon Mainnet
    erc20Swap: '0x2E21F58Da58c391F110467c7484EdfA849C1CB9B',
  },
  80002: {
    // Polygon Testnet (Amoy)
    erc20Swap: '0x2E21F58Da58c391F110467c7484EdfA849C1CB9B',
  },
  1: {
    // Ethereum Mainnet
    erc20Swap: '0x2E21F58Da58c391F110467c7484EdfA849C1CB9B',
  },
}
