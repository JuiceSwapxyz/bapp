import { ADDRESS, ChainAddress } from '@juicedollar/jusd/exports/address.config'
import { ChainId } from '@juiceswapxyz/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { logger } from 'utilities/src/logger/logger'

const TOKEN_METADATA: Record<string, {
  symbol: string
  name: string
  decimals: number
  logoUrl: string
  displayInUI?: boolean
}> = {
  juiceDollar: {
    symbol: 'JUSD',
    name: 'Juice Dollar',
    decimals: 18,
    logoUrl: 'https://docs.juiceswap.com/media/icons/jusd.png',
    displayInUI: true,
  },
  equity: {
    symbol: 'JUICE',
    name: 'JUICE Equity',
    decimals: 18,
    logoUrl: 'https://docs.juiceswap.com/media/icons/juice.png',
    displayInUI: true,
  },
  savingsVaultJUSD: {
    symbol: 'svJUSD',
    name: 'Savings Vault JUSD',
    decimals: 18,
    logoUrl: 'https://docs.juiceswap.com/media/icons/jusd.png',
    displayInUI: false,
  },
  startUSD: {
    symbol: 'SUSD',
    name: 'StartUSD',
    decimals: 18,
    logoUrl: 'https://docs.juiceswap.com/media/icons/susd.png',
    displayInUI: false,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoUrl: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
    displayInUI: true,
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoUrl: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
    displayInUI: true,
  },
  CTUSD: {
    symbol: 'CTUSD',
    name: 'Citrus USD',
    decimals: 18,
    logoUrl: 'https://docs.juiceswap.com/media/icons/cusd.png',
    displayInUI: true,
  },
}

const CONTRACT_KEYS = new Set<keyof ChainAddress>([
  'frontendGateway',
  'savingsGateway',
  'mintingHubGateway',
  'roller',
  'positionFactoryV2',
  'genesisPosition',
  'bridgeStartUSD',
  'bridgeUSDC',
  'bridgeUSDT',
  'bridgeCTUSD',
])

function getNumericChainId(chainId: UniverseChainId): number | null {
  switch (chainId) {
    case UniverseChainId.CitreaTestnet:
      return ChainId.CITREA_TESTNET
    case UniverseChainId.CitreaMainnet:
      return ChainId.CITREA_MAINNET
    default:
      return null
  }
}

function isTokenKey(key: string): boolean {
  return !CONTRACT_KEYS.has(key as keyof ChainAddress)
}

export function loadAllPackageTokens(chainId: UniverseChainId): CurrencyInfo[] {
  const numericChainId = getNumericChainId(chainId)
  if (!numericChainId) {
    return []
  }

  const chainAddresses = ADDRESS[numericChainId]
  if (!chainAddresses) {
    return []
  }

  const tokens: CurrencyInfo[] = []

  for (const [key, address] of Object.entries(chainAddresses)) {
    if (!isTokenKey(key) || !address) {
      continue
    }

    const metadata = TOKEN_METADATA[key]
    if (!metadata || metadata.displayInUI === false) {
      continue
    }

    try {
      const currency = buildCurrency({
        chainId,
        address,
        decimals: metadata.decimals,
        symbol: metadata.symbol,
        name: metadata.name,
      })

      if (currency) {
        tokens.push({
          currency,
          currencyId: `${chainId}-${address}`,
          logoUrl: metadata.logoUrl,
        })
      }
    } catch (error) {
      logger.error(error as Error, {
        tags: { file: 'npmPackageTokens', function: 'loadAllPackageTokens' },
        extra: { key, address },
      })
    }
  }

  return tokens
}
