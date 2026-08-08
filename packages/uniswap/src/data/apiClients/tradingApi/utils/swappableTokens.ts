import { ADDRESS } from '@juicedollar/jusd'
import { ChainId, GetSwappableTokensResponse, SafetyLevel } from 'uniswap/src/data/tradingApi/__generated__'
import { WBTC_ETHEREUM_ADDRESS } from 'uniswap/src/data/apiClients/tradingApi/utils/isBitcoinBridge'

const JUSD_CITREA_MAINNET = ADDRESS[4114]!.juiceDollar
const JUSD_CITREA_TESTNET = ADDRESS[5115]!.juiceDollar
const USDT_POLYGON = '0xc2132d05d31c914a87c6611c10748aeb04b58e8f'
const USDT_ETHEREUM = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const USDC_ETHEREUM = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

export const swappableTokensData: Partial<Record<ChainId, Record<string, GetSwappableTokensResponse['tokens']>>> = {
  [ChainId._4114]: {
    '0x0000000000000000000000000000000000000000': [
      {
        address: '0x0000000000000000000000000000000000000000',
        chainId: ChainId._21_000_000,
        name: 'Bitcoin',
        project: {
          logo: {
            url: 'https://docs.juiceswap.com/media/icons/cbtc.png',
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
            url: 'https://docs.juiceswap.com/media/icons/cbtc.png',
          },
          safetyLevel: SafetyLevel.VERIFIED,
          isSpam: false,
        },
        symbol: 'lnBTC',
        decimals: 18,
      },
      {
        address: WBTC_ETHEREUM_ADDRESS,
        chainId: ChainId._1,
        name: 'Wrapped BTC',
        project: {
          logo: {
            url: 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png',
          },
          safetyLevel: SafetyLevel.VERIFIED,
          isSpam: false,
        },
        symbol: 'WBTC',
        decimals: 8,
      },
    ],
    [JUSD_CITREA_MAINNET]: [
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
  // Citrea Testnet
  [ChainId._5115]: {
    '0x0000000000000000000000000000000000000000': [
      {
        address: '0x0000000000000000000000000000000000000000',
        chainId: ChainId._21_000_000,
        name: 'Bitcoin',
        project: {
          logo: {
            url: 'https://docs.juiceswap.com/media/icons/cbtc.png',
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
            url: 'https://docs.juiceswap.com/media/icons/cbtc.png',
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
        chainId: ChainId._4114,
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
        chainId: ChainId._4114,
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
        address: JUSD_CITREA_MAINNET,
        chainId: ChainId._4114,
        name: 'JuiceDollar',
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
      {
        address: JUSD_CITREA_TESTNET,
        chainId: ChainId._5115,
        name: 'JuiceDollar',
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
    [WBTC_ETHEREUM_ADDRESS]: [
      {
        address: '0x0000000000000000000000000000000000000000',
        chainId: ChainId._4114,
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
    [USDT_ETHEREUM]: [
      {
        address: JUSD_CITREA_MAINNET,
        chainId: ChainId._4114,
        name: 'JuiceDollar',
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
      {
        address: JUSD_CITREA_TESTNET,
        chainId: ChainId._5115,
        name: 'JuiceDollar',
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
        address: JUSD_CITREA_MAINNET,
        chainId: ChainId._4114,
        name: 'JuiceDollar',
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
      {
        address: JUSD_CITREA_TESTNET,
        chainId: ChainId._5115,
        name: 'JuiceDollar',
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

export const swappableTokensMappping: Partial<Record<ChainId, Record<string, GetSwappableTokensResponse['tokens']>>> = swappableTokensData

/**
 * Returns all unique swappable tokens across all chains and input tokens.
 * Used to display all available cross-chain swap options regardless of selected input token.
 */
export function getAllSwappableTokens(): GetSwappableTokensResponse['tokens'] {
  const allTokens: GetSwappableTokensResponse['tokens'] = []
  const seenTokens = new Set<string>()

  for (const chainTokens of Object.values(swappableTokensData)) {
    for (const tokens of Object.values(chainTokens)) {
      for (const token of tokens) {
        // Create unique key based on address + chainId
        const key = `${token.address.toLowerCase()}-${token.chainId}`
        if (!seenTokens.has(key)) {
          seenTokens.add(key)
          allTokens.push(token)
        }
      }
    }
  }

  return allTokens
}
