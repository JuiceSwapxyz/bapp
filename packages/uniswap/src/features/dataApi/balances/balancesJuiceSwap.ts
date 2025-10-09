/**
 * JuiceSwap API implementation for fetching portfolio balances
 */

import { NetworkStatus } from '@apollo/client'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { uniswapUrls } from 'uniswap/src/constants/urls'
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
  chainId: number
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
  // Default to Citrea Testnet
  const chainId = UniverseChainId.CitreaTestnet

  const {
    data,
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery<Record<CurrencyId, PortfolioBalance>, Error>({
    queryKey: ['juiceswap-portfolio', address, chainId],
    queryFn: () => {
      if (!address) {
        return Promise.resolve({})
      }
      return fetchJuiceSwapPortfolio(address, chainId)
    },
    enabled: Boolean(address) && !skip,
    refetchInterval: pollInterval,
    staleTime: 30_000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (renamed from cacheTime)
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff: 1s, 2s, 4s, max 30s
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
