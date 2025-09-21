import { Token } from '@juiceswapxyz/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

// Citrea testnet tokens (same as in hardcodedPools.ts)
export const WCBTC_TOKEN = new Token(
  UniverseChainId.CitreaTestnet,
  '0x4370e27F7d91D9341bFf232d7Ee8bdfE3a9933a0',
  18,
  'WCBTC',
  'Wrapped cBTC',
)

export const TFC_TOKEN = new Token(
  UniverseChainId.CitreaTestnet,
  '0x7c6e99a637fbc887c067ba2f3a2b76499f3a0eaa',
  18,
  'TFC',
  'TaprootFreakCoin',
)

export const CUSD_TOKEN = new Token(
  UniverseChainId.CitreaTestnet,
  '0xb3fc1ddbd87cac45301d0d2e99e5f8f5218c8e33',
  18,
  'cUSD',
  'cUSD',
)

export const NUSD_TOKEN = new Token(
  UniverseChainId.CitreaTestnet,
  '0x1234567890abcdef1234567890abcdef12345678',
  18,
  'NUSD',
  'Nectra USD',
)

export const USDC_TOKEN = new Token(
  UniverseChainId.CitreaTestnet,
  '0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0',
  6,
  'USDC',
  'USDC',
)

// Hardcoded Citrea tokens for the explore page
export const HARDCODED_CITREA_TOKENS = [
  {
    id: WCBTC_TOKEN.address,
    chain: UniverseChainId.CitreaTestnet,
    address: WCBTC_TOKEN.address,
    symbol: WCBTC_TOKEN.symbol,
    name: WCBTC_TOKEN.name,
    decimals: WCBTC_TOKEN.decimals,
    project: { name: WCBTC_TOKEN.name },
    price: 95000,
    pricePercentChange1Hour: 0.5,
    pricePercentChange1Day: 2.3,
    volume1Day: { value: 150000 },
    marketCap: { value: 1900000000 },
  },
  {
    id: TFC_TOKEN.address,
    chain: UniverseChainId.CitreaTestnet,
    address: TFC_TOKEN.address,
    symbol: TFC_TOKEN.symbol,
    name: TFC_TOKEN.name,
    decimals: TFC_TOKEN.decimals,
    project: { name: TFC_TOKEN.name },
    price: 3.2,
    pricePercentChange1Hour: -0.8,
    pricePercentChange1Day: 5.7,
    volume1Day: { value: 45000 },
    marketCap: { value: 32000000 },
  },
  {
    id: CUSD_TOKEN.address,
    chain: UniverseChainId.CitreaTestnet,
    address: CUSD_TOKEN.address,
    symbol: CUSD_TOKEN.symbol,
    name: CUSD_TOKEN.name,
    decimals: CUSD_TOKEN.decimals,
    project: { name: CUSD_TOKEN.name },
    price: 0.999,
    pricePercentChange1Hour: 0.01,
    pricePercentChange1Day: -0.05,
    volume1Day: { value: 85000 },
    marketCap: { value: 85000000 },
  },
  {
    id: NUSD_TOKEN.address,
    chain: UniverseChainId.CitreaTestnet,
    address: NUSD_TOKEN.address,
    symbol: NUSD_TOKEN.symbol,
    name: NUSD_TOKEN.name,
    decimals: NUSD_TOKEN.decimals,
    project: { name: NUSD_TOKEN.name },
    price: 1.001,
    pricePercentChange1Hour: 0.02,
    pricePercentChange1Day: 0.1,
    volume1Day: { value: 62000 },
    marketCap: { value: 62000000 },
  },
  {
    id: USDC_TOKEN.address,
    chain: UniverseChainId.CitreaTestnet,
    address: USDC_TOKEN.address,
    symbol: USDC_TOKEN.symbol,
    name: USDC_TOKEN.name,
    decimals: USDC_TOKEN.decimals,
    project: { name: USDC_TOKEN.name },
    price: 1.0,
    pricePercentChange1Hour: 0.0,
    pricePercentChange1Day: 0.01,
    volume1Day: { value: 120000 },
    marketCap: { value: 120000000 },
  },
]