/**
 * JuiceSwap API implementation for fetching NFTs
 */

import { NetworkStatus } from '@apollo/client'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import type { Address } from 'viem'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { NFTItem } from 'uniswap/src/features/nfts/types'

interface JuiceSwapNFTItem {
  contractAddress: string
  tokenId: string
  chainId: number
  name?: string
  imageUrl?: string
  description?: string
  collectionName?: string
}

interface JuiceSwapPortfolioResponse {
  portfolio: {
    tokens: any[]
    nfts?: JuiceSwapNFTItem[]
  }
}

export type NFTDataResult = {
  data?: NFTItem[]
  loading: boolean
  networkStatus: NetworkStatus
  refetch: () => void
  error?: Error
}

async function fetchJuiceSwapNFTs(address: string, chainId: number): Promise<NFTItem[]> {
  const url = `${uniswapUrls.tradingApiUrl}/v1/portfolio/${address}?chainId=${chainId}&includeNfts=true`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch NFTs: ${response.statusText}`)
  }

  const data: JuiceSwapPortfolioResponse = await response.json()

  // Transform JuiceSwap NFT response to NFTItem format
  const nfts: NFTItem[] = []

  if (data.portfolio.nfts) {
    data.portfolio.nfts.forEach((nft) => {
      const nftItem: NFTItem = {
        contractAddress: nft.contractAddress,
        tokenId: nft.tokenId,
        chainId: nft.chainId,
        name: nft.name,
        description: nft.description,
        imageUrl: nft.imageUrl,
        collectionName: nft.collectionName,
      }

      nfts.push(nftItem)
    })
  }

  return nfts
}

export function useJuiceSwapNFTData({
  address,
  pollInterval,
  onCompleted,
  skip,
}: {
  address?: Address
  pollInterval?: PollingInterval
  onCompleted?: () => void
  skip?: boolean
}): NFTDataResult {
  // Default to Citrea Testnet
  const chainId = UniverseChainId.CitreaTestnet

  const {
    data,
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery<NFTItem[], Error>({
    queryKey: ['juiceswap-nfts', address, chainId],
    queryFn: () => {
      if (!address) {
        return Promise.resolve([])
      }
      return fetchJuiceSwapNFTs(address, chainId)
    },
    enabled: Boolean(address) && !skip,
    refetchInterval: pollInterval,
    staleTime: 60_000, // Consider data fresh for 60 seconds (NFTs change less frequently)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Call onCompleted when data is available
  const prevDataRef = useRef<NFTItem[] | undefined>()
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
