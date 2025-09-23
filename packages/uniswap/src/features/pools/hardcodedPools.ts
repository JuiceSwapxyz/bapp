import { PoolStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

// Hardcoded Citrea pools data for SearchModal fallback when API doesn't support Citrea
// Using partial data since we only need the minimum required fields for display
// Note: Using Ethereum chain as a workaround since Citrea is not in the Chain enum
function createCitreaPoolStats(): PoolStats[] {
  return [
    Object.assign(new PoolStats(), {
      id: '0x21180B20134C8913bfA6dc866e43A114c026169e',
      chain: Chain.Ethereum,
      protocolVersion: 'V3',
      feeTier: 3000,
      token0: {
        chain: Chain.Ethereum,
        address: '0x4370e27F7d91D9341bFf232d7Ee8bdfE3a9933a0',
        symbol: 'WcBTC',
        name: 'Wrapped Citrea BTC',
        decimals: 18,
      },
      token1: {
        chain: Chain.Ethereum,
        address: '0x14ADf6B87096Ef750a956756BA191fc6BE94e473',
        symbol: 'TFC',
        name: 'TaprootFreakCoin',
        decimals: 18,
      },
      totalLiquidity: { value: 30000 },
      volume1Day: { value: 5000 },
    }),
    Object.assign(new PoolStats(), {
      id: '0xA69De906B9A830Deb64edB97B2eb0848139306d2',
      chain: Chain.Ethereum,
      protocolVersion: 'V3',
      feeTier: 3000,
      token0: {
        chain: Chain.Ethereum,
        address: '0x4370e27F7d91D9341bFf232d7Ee8bdfE3a9933a0',
        symbol: 'WcBTC',
        name: 'Wrapped Citrea BTC',
        decimals: 18,
      },
      token1: {
        chain: Chain.Ethereum,
        address: '0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0',
        symbol: 'cUSD',
        name: 'Citrus Dollar',
        decimals: 18,
      },
      totalLiquidity: { value: 45000 },
      volume1Day: { value: 7500 },
    }),
    Object.assign(new PoolStats(), {
      id: '0xD8C7604176475eB8D350bC1EE452dA4442637C09',
      chain: Chain.Ethereum,
      protocolVersion: 'V3',
      feeTier: 3000,
      token0: {
        chain: Chain.Ethereum,
        address: '0x4370e27F7d91D9341bFf232d7Ee8bdfE3a9933a0',
        symbol: 'WcBTC',
        name: 'Wrapped Citrea BTC',
        decimals: 18,
      },
      token1: {
        chain: Chain.Ethereum,
        address: '0x36c16eaC6B0Ba6c50f494914ff015fCa95B7835F',
        symbol: 'USDC',
        name: 'USDC (Satsuma)',
        decimals: 6,
      },
      totalLiquidity: { value: 60000 },
      volume1Day: { value: 10000 },
    }),
    Object.assign(new PoolStats(), {
      id: '0x6006797369E2A595D31Df4ab3691044038AAa7FE',
      chain: Chain.Ethereum,
      protocolVersion: 'V3',
      feeTier: 3000,
      token0: {
        chain: Chain.Ethereum,
        address: '0x4370e27F7d91D9341bFf232d7Ee8bdfE3a9933a0',
        symbol: 'WcBTC',
        name: 'Wrapped Citrea BTC',
        decimals: 18,
      },
      token1: {
        chain: Chain.Ethereum,
        address: '0x9B28B690550522608890C3C7e63c0b4A7eBab9AA',
        symbol: 'NUSD',
        name: 'Nectra USD',
        decimals: 18,
      },
      totalLiquidity: { value: 36000 },
      volume1Day: { value: 6000 },
    }),
  ]
}

export function getHardcodedCitreaPoolsSearchData(): PoolStats[] {
  return createCitreaPoolStats()
}
