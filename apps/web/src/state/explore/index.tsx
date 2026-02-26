import { ExploreStatsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { createContext, useMemo } from 'react'
import { useExploreStatsQuery } from 'uniswap/src/data/rest/exploreStats'
import {
  JuiceswapProtocolStatsResponse,
  useJuiceswapProtocolStatsQuery,
} from 'uniswap/src/data/rest/juiceswapProtocolStats'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ALWAYS_ENABLED_CHAIN_IDS } from 'uniswap/src/features/chains/utils'

interface QueryResult<T> {
  data?: T
  isLoading: boolean
  error: boolean
}

/**
 * ExploreContextType
 * @property exploreStatsData - Data for the Explore Tokens and Pools table
 * @property protocolStatsData - Data for the Protocol Stats Graphs
 */
interface ExploreContextType {
  exploreStats: QueryResult<ExploreStatsResponse>
  protocolStats: QueryResult<JuiceswapProtocolStatsResponse>
}

export const giveExploreStatDefaultValue = (value: number | undefined, defaultValue = 0): number => {
  return value ?? defaultValue
}

export const ExploreContext = createContext<ExploreContextType>({
  exploreStats: {
    data: undefined,
    isLoading: false,
    error: false,
  },
  protocolStats: {
    data: undefined,
    isLoading: false,
    error: false,
  },
})

export const TABLE_PAGE_SIZE = 20

export function ExploreContextProvider({
  chainId,
  children,
}: {
  chainId?: UniverseChainId
  children: React.ReactNode
}) {
  const isExploreChain = chainId !== undefined && ALWAYS_ENABLED_CHAIN_IDS.includes(chainId)

  const {
    data: exploreStatsData,
    isLoading: exploreStatsLoading,
    error: exploreStatsError,
  } = useExploreStatsQuery<ExploreStatsResponse>({
    chainId: isExploreChain ? chainId : undefined,
    enabled: isExploreChain,
  })

  const {
    data: protocolStatsData,
    isLoading: protocolStatsLoading,
    error: protocolStatsError,
  } = useJuiceswapProtocolStatsQuery(isExploreChain ? chainId : UniverseChainId.CitreaMainnet, isExploreChain)

  const exploreContext = useMemo(() => {
    return {
      exploreStats: {
        data: exploreStatsData,
        isLoading: exploreStatsLoading,
        error: !!exploreStatsError,
      },
      protocolStats: {
        data: protocolStatsData,
        isLoading: protocolStatsLoading,
        error: !!protocolStatsError,
      },
    }
  }, [
    exploreStatsData,
    exploreStatsError,
    exploreStatsLoading,
    protocolStatsData,
    protocolStatsError,
    protocolStatsLoading,
  ])
  return <ExploreContext.Provider value={exploreContext}>{children}</ExploreContext.Provider>
}
