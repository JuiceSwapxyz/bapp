/**
 * Boltz / LDS bridge on-chain swap contract addresses (EtherSwap + ERC20Swap deployments).
 * Single source of truth for sagas, hooks, and debug tooling.
 */
export const LDS_BRIDGE_ERC20_SWAP_ADDRESS_ETHEREUM_POLYGON = '0x2E21F58Da58c391F110467c7484EdfA849C1CB9B'

export const LDS_BRIDGE_ERC20_SWAP_ADDRESS_CITREA_MAINNET = '0x7397F25F230f7d5A83c18e1B68b32511bf35F860'

export const LDS_BRIDGE_ERC20_SWAP_ADDRESS_CITREA_TESTNET = '0xf2e019a371e5Fd32dB2fC564Ad9eAE9E433133cc'

export const LDS_BRIDGE_COIN_SWAP_ADDRESS_CITREA_MAINNET = '0xFD92F846fe6E7d08d28D6A88676BB875E5D906ab'

export const LDS_BRIDGE_COIN_SWAP_ADDRESS_CITREA_TESTNET = '0xd02731fD8c5FDD53B613A699234FAd5EE8851B65'

/** ERC20 swap addresses keyed for saga flows (Ethereum / Polygon share one deployment). */
export const SWAP_CONTRACTS = {
  ethereum: LDS_BRIDGE_ERC20_SWAP_ADDRESS_ETHEREUM_POLYGON,
  polygon: LDS_BRIDGE_ERC20_SWAP_ADDRESS_ETHEREUM_POLYGON,
  citreaMainnet: LDS_BRIDGE_ERC20_SWAP_ADDRESS_CITREA_MAINNET,
  citreaTestnet: LDS_BRIDGE_ERC20_SWAP_ADDRESS_CITREA_TESTNET,
} as const

export interface LdsBridgeLockupContracts {
  coinSwap?: string
  erc20Swap: string
}

/** Claim / refund / lockup debug: keyed by EVM chain id */
export const LDS_BRIDGE_LOCKUP_CONTRACTS_BY_CHAIN_ID: Partial<Record<number, LdsBridgeLockupContracts>> = {
  4114: {
    coinSwap: LDS_BRIDGE_COIN_SWAP_ADDRESS_CITREA_MAINNET,
    erc20Swap: LDS_BRIDGE_ERC20_SWAP_ADDRESS_CITREA_MAINNET,
  },
  5115: {
    coinSwap: LDS_BRIDGE_COIN_SWAP_ADDRESS_CITREA_TESTNET,
    erc20Swap: LDS_BRIDGE_ERC20_SWAP_ADDRESS_CITREA_TESTNET,
  },
  137: {
    erc20Swap: LDS_BRIDGE_ERC20_SWAP_ADDRESS_ETHEREUM_POLYGON,
  },
  80002: {
    erc20Swap: LDS_BRIDGE_ERC20_SWAP_ADDRESS_ETHEREUM_POLYGON,
  },
  1: {
    erc20Swap: LDS_BRIDGE_ERC20_SWAP_ADDRESS_ETHEREUM_POLYGON,
  },
}
