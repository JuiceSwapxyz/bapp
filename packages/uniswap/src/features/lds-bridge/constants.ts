import { UniverseChainId } from 'uniswap/src/features/chains/types'

// LDS (Lightning.Space) contract address that holds bridge liquidity
// Used to check on-chain balances for Citrea, Ethereum, and Polygon tokens
export const LDS_ADDRESS = '0xDDA7efc856833960694cb26cb583e0CCCA497b87' as const

// WBTCe (LayerZero bridged WBTC) token addresses on Citrea chains
export const WBTC_E_ADDRESSES: Partial<Record<UniverseChainId, string>> = {
  [UniverseChainId.CitreaTestnet]: '0xDF240DC08B0FdaD1d93b74d5048871232f6BEA3d',
}
