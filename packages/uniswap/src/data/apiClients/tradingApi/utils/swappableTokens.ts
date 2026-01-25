import { ADDRESS } from '@juicedollar/jusd'
import { ChainId, GetSwappableTokensResponse, SafetyLevel } from 'uniswap/src/data/tradingApi/__generated__'

// Temporal mapping of swappable tokens for bridges (Citrea, Bitcoin, Lightning Network)
// TODO: remove this once the backend API is updated

const USE_SWAPPABLE_TOKENS_MAPPING = true

const JUSD_CITREA_TESTNET = ADDRESS[5115]!.juiceDollar
const USDT_POLYGON = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
const USDT_ETHEREUM = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const USDC_ETHEREUM = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

export const swappableTokensData: Partial<Record<ChainId, Record<string, GetSwappableTokensResponse['tokens']>>> = {
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
    [JUSD_CITREA_TESTNET]: [
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
      {
        address: USDT_ETHEREUM,
        chainId: ChainId._1,
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
      {
        address: USDC_ETHEREUM,
        chainId: ChainId._1,
        name: 'USD Coin',
        project: {
          logo: {
            url: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
          },
          safetyLevel: SafetyLevel.VERIFIED,
          isSpam: false,
        },
        symbol: 'USDC',
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
  [ChainId._137]: {
    [USDT_POLYGON]: [
      {
        address: JUSD_CITREA_TESTNET,
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
        decimals: 18,
      },
    ],
  },
  [ChainId._1]: {
    [USDT_ETHEREUM]: [
      {
        address: JUSD_CITREA_TESTNET,
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
        decimals: 18,
      },
    ],
    [USDC_ETHEREUM]: [
      {
        address: JUSD_CITREA_TESTNET,
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
        decimals: 18,
      },
    ],
  },
}

export const swappableTokensMappping: Partial<Record<ChainId, Record<string, GetSwappableTokensResponse['tokens']>>> =
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  USE_SWAPPABLE_TOKENS_MAPPING ? swappableTokensData : {}
