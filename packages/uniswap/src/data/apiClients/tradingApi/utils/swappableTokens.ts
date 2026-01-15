import { ChainId, GetSwappableTokensResponse, SafetyLevel } from 'uniswap/src/data/tradingApi/__generated__'

// Temporal mapping of swappable tokens for bridges (Citrea, Bitcoin, Lightning Network)
// TODO: remove this once the backend API is updated

const USE_SWAPPABLE_TOKENS_MAPPING = process.env.USE_SWAPPABLE_TOKENS_MAPPING === 'true'

// Token addresses for ERC20 chain swaps
const JUSD_CITREA = '0xFdB0a83d94CD65151148a131167Eb499Cb85d015'
const USDT_POLYGON = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'

const swappableTokensData: Partial<Record<ChainId, Record<string, GetSwappableTokensResponse['tokens']>>> = {
  [ChainId._5115]: {
    '0x0000000000000000000000000000000000000000': [
      {
        address: '0x0000000000000000000000000000000000000000',
        chainId: ChainId._21_000_000,
        name: 'Bitcoin',
        project: {
          logo: {
            url: 'https://docs.juiceswap.com/media/icons/cbtc.png', // TODO: add logo
          },
          safetyLevel: SafetyLevel.VERIFIED,
          isSpam: false,
        },
        symbol: 'BTC',
        decimals: 18,
      },
      {
        address: '0x0000000000000000000000000000000000000000',
        chainId: ChainId._21_000_001,
        name: 'Lightning BTC',
        project: {
          logo: {
            url: 'https://docs.juiceswap.com/media/icons/lightning.png', // TODO: add logo
          },
          safetyLevel: SafetyLevel.VERIFIED,
          isSpam: false,
        },
        symbol: 'lnBTC',
        decimals: 18,
      },
    ],
    // JUSD (Citrea) → USDT (Polygon)
    [JUSD_CITREA]: [
      {
        address: USDT_POLYGON,
        chainId: ChainId._137,
        name: 'Tether USD',
        project: {
          logo: {
            url: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
          },
          safetyLevel: SafetyLevel.VERIFIED,
          isSpam: false,
        },
        symbol: 'USDT',
        decimals: 6,
      },
    ],
  },
  // USDT (Polygon) → JUSD (Citrea)
  [ChainId._137]: {
    [USDT_POLYGON]: [
      {
        address: JUSD_CITREA,
        chainId: ChainId._5115,
        name: 'JuiceSwap USD',
        project: {
          logo: {
            url: 'https://docs.juiceswap.com/media/icons/jusd.png',
          },
          safetyLevel: SafetyLevel.VERIFIED,
          isSpam: false,
        },
        symbol: 'JUSD',
        decimals: 6,
      },
    ],
  },
  [ChainId._21_000_000]: {
    '0x0000000000000000000000000000000000000000': [
      {
        address: '0x0000000000000000000000000000000000000000',
        chainId: ChainId._5115,
        name: 'Citrea BTC',
        project: {
          logo: {
            url: 'https://docs.juiceswap.com/media/icons/cbtc.png',
          },
          safetyLevel: SafetyLevel.VERIFIED,
          isSpam: false,
        },
        symbol: 'cBTC',
        decimals: 18,
      },
    ],
  },
  [ChainId._21_000_001]: {
    '0x0000000000000000000000000000000000000000': [
      {
        address: '0x0000000000000000000000000000000000000000',
        chainId: ChainId._5115,
        name: 'Citrea BTC',
        project: {
          logo: {
            url: 'https://docs.juiceswap.com/media/icons/cbtc.png',
          },
          safetyLevel: SafetyLevel.VERIFIED,
          isSpam: false,
        },
        symbol: 'cBTC',
        decimals: 18,
      },
    ],
  },
}

export const swappableTokensMappping: Partial<Record<ChainId, Record<string, GetSwappableTokensResponse['tokens']>>> =
  USE_SWAPPABLE_TOKENS_MAPPING ? swappableTokensData : {}
