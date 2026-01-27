/**
 * JuiceSwap API implementation for fetching portfolio balances
 */

import { NetworkStatus } from '@apollo/client'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { CurrencyId } from 'uniswap/src/types/currency'
import { currencyId } from 'uniswap/src/utils/currencyId'

interface JuiceSwapTokenBalance {
  address: string
  chainId: number
  decimals: number
  name: string
  symbol: string
  logoURI?: string
  balance: string
  balanceFormatted: string
}

interface JuiceSwapPortfolioResponse {
  portfolio: {
    balances: JuiceSwapTokenBalance[]
  }
}

export type PortfolioDataResult = {
  data?: Record<CurrencyId, PortfolioBalance>
  loading: boolean
  networkStatus: NetworkStatus
  refetch: () => void
  error?: Error
}

async function fetchJuiceSwapPortfolio(
  address: string,
  chainId: number,
): Promise<Record<CurrencyId, PortfolioBalance>> {
  const url = `${uniswapUrls.tradingApiUrl}/v1/portfolio/${address}?chainId=${chainId}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio: ${response.statusText}`)
  }

  const data: JuiceSwapPortfolioResponse = await response.json()

  // Transform JuiceSwap response to PortfolioBalance format
  const balancesById: Record<CurrencyId, PortfolioBalance> = {}

  data.portfolio.balances.forEach((balance) => {
    const currency = buildCurrency({
      chainId: balance.chainId as UniverseChainId,
      address: balance.address,
      decimals: balance.decimals,
      symbol: balance.symbol,
      name: balance.name,
    })

    if (!currency) {
      return
    }

    const id = currencyId(currency)

    const currencyInfo = buildCurrencyInfo({
      currency,
      currencyId: id,
      logoUrl: balance.logoURI,
      isSpam: false,
    })

    // Convert balance string to number for USD value (we don't have price data yet, so null)
    const quantity = parseFloat(balance.balanceFormatted) || 0

    const portfolioBalance: PortfolioBalance = {
      id: `balance_${balance.chainId}_${address}_${balance.address}`,
      cacheId: `balance_${balance.chainId}_${address}_${balance.address}`,
      quantity,
      balanceUSD: null, // Price data not available yet
      currencyInfo,
      relativeChange24: null,
      isHidden: false,
    }

    balancesById[id] = portfolioBalance
  })

  return balancesById
}

async function fetchMultiChainPortfolio(
  address: string,
  chainIds: UniverseChainId[],
): Promise<Record<CurrencyId, PortfolioBalance>> {
  const results = await Promise.allSettled(chainIds.map((chainId) => fetchJuiceSwapPortfolio(address, chainId)))

  const merged: Record<CurrencyId, PortfolioBalance> = {}
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      Object.assign(merged, result.value)
    }
  })
  return merged
}

export function useJuiceSwapPortfolioData({
  address,
  pollInterval,
  onCompleted,
  skip,
}: {
  address?: Address
  pollInterval?: PollingInterval
  onCompleted?: () => void
  skip?: boolean
}): PortfolioDataResult {
  const { isTestnetModeEnabled } = useEnabledChains()

  // Dynamically determine which chain IDs to fetch based on testnet mode
  const chainIds = useMemo(() => {
    if (isTestnetModeEnabled) {
      return [UniverseChainId.CitreaTestnet]
    }
    return [UniverseChainId.CitreaMainnet]
  }, [isTestnetModeEnabled])

  const {
    data,
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery<Record<CurrencyId, PortfolioBalance>, Error>({
    queryKey: ['juiceswap-portfolio', address, chainIds],
    queryFn: () => {
      if (!address) {
        return Promise.resolve({})
      }
      return fetchMultiChainPortfolio(address, chainIds)
    },
    enabled: Boolean(address) && !skip,
    refetchInterval: pollInterval,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Call onCompleted when data is available
  const prevDataRef = useRef<Record<CurrencyId, PortfolioBalance> | undefined>()
  useEffect(() => {
    if (data && data !== prevDataRef.current && onCompleted) {
      onCompleted()
      prevDataRef.current = data
    }
  }, [data, onCompleted])

  const refetch = useCallback(() => {
    queryRefetch().catch(() => {
      // Silently handle refetch failures - React Query will retry automatically
    })
  }, [queryRefetch])

  return {
    data,
    loading: isLoading,
    networkStatus: isLoading ? NetworkStatus.loading : NetworkStatus.ready,
    refetch,
    error: error as Error | undefined,
  }
}
