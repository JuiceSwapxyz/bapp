import { Token } from '@juiceswapxyz/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

// Export tokens for Citrea testnet
export const WCBTC = new Token(
  UniverseChainId.CitreaTestnet,
  '0x4370e27F7d91D9341bFf232d7Ee8bdfE3a9933a0',
  18,
  'WCBTC',
  'Wrapped cBTC',
)

export const TFC = new Token(
  UniverseChainId.CitreaTestnet,
  '0x7c6e99a637fbc887c067ba2f3a2b76499f3a0eaa',  // This address needs to be updated
  18,
  'TFC',
  'TaprootFreakCoin',
)

export const cUSD = new Token(
  UniverseChainId.CitreaTestnet,
  '0xb3fc1ddbd87cac45301d0d2e99e5f8f5218c8e33',
  18,
  'cUSD',
  'cUSD',
)

export const NUSD = new Token(
  UniverseChainId.CitreaTestnet,
  '0x1234567890abcdef1234567890abcdef12345678',  // This address needs to be updated
  18,
  'NUSD',
  'Nectra USD',
)

export const USDC = new Token(
  UniverseChainId.CitreaTestnet,
  '0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0',
  6,
  'USDC',
  'USDC',
)

// Hardcoded Citrea pool addresses that should always be shown
export const HARDCODED_CITREA_POOLS = [
  {
    id: '0x21180B20134C8913bfA6dc866e43A114c026169e',
    token0: WCBTC,
    token1: TFC,
    feeTier: 3000,
    tvlUSD: 30000,
    volume24hUSD: 5000,
    apr: 25.5,
  },
  {
    id: '0xA69De906B9A830Deb64edB97B2eb0848139306d2',
    token0: WCBTC,
    token1: cUSD,
    feeTier: 3000,
    tvlUSD: 45000,
    volume24hUSD: 7500,
    apr: 28.3,
  },
  {
    id: '0xD8C7604176475eB8D350bC1EE452dA4442637C09',
    token0: WCBTC,
    token1: USDC,
    feeTier: 3000,
    tvlUSD: 60000,
    volume24hUSD: 10000,
    apr: 32.7,
  },
  {
    id: '0x6006797369E2A595D31Df4ab3691044038AAa7FE',
    token0: WCBTC,
    token1: NUSD,
    feeTier: 3000,
    tvlUSD: 36000,
    volume24hUSD: 6000,
    apr: 26.8,
  },
]