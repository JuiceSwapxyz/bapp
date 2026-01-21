import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCommonBase } from 'uniswap/src/constants/routing'
import { createPonderApiClient } from 'uniswap/src/data/apiClients/ponderApi/PonderApi'
import { useTokenQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { fetchTokenDataDirectly } from 'uniswap/src/data/rest/searchTokensAndPools'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import {
  currencyIdToApiContract,
  currencyIdToContractInput,
} from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { gqlTokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils/gqlTokenToCurrencyInfo'
import { isSvJusdAddress, transformSvJusdCurrencyInfo } from 'uniswap/src/features/tokens/jusdAbstraction'
import { useLocalCurrencyInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/hooks/useLocalCurrencyInfo'
import {
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyId,
  currencyIdToAddress,
  currencyIdToChain,
} from 'uniswap/src/utils/currencyId'

const PonderApiClient = createPonderApiClient()

function useCurrencyInfoQuery(
  _currencyId?: string,
  options?: { refetch?: boolean; skip?: boolean },
): { currencyInfo: Maybe<CurrencyInfo>; loading: boolean; error?: Error } {
  const queryResult = useTokenQuery({
    variables: currencyIdToContractInput(_currencyId ?? ''),
    skip: true, // TODO: re-enable
    fetchPolicy: options?.refetch ? 'cache-and-network' : 'cache-first',
  })

  let variables: { tokenAddress: string; chainId: UniverseChainId } | undefined
  try {
    variables = {
      tokenAddress: currencyIdToAddress(_currencyId ?? ''),
      chainId: currencyIdToChain(_currencyId ?? '') as UniverseChainId,
    }
  } catch (error) {
    variables = undefined
  }

  const tokenData = useQuery({
    queryKey: ['searchTokens-custom', variables],
    queryFn: async () => {
      const token = await fetchTokenDataDirectly(
        variables?.tokenAddress ?? '',
        variables?.chainId ?? UniverseChainId.Mainnet,
      )
      return token
    },
    enabled: variables !== undefined || options?.skip,
  })

  const currencyInfo = useMemo(() => {
    if (!_currencyId) {
      return undefined
    }

    const chainId = currencyIdToChain(_currencyId)
    let address: Address | undefined
    try {
      address = currencyIdToAddress(_currencyId)
    } catch (error) {
      return undefined
    }
    if (chainId && address) {
      const commonBase = getCommonBase(chainId, address)
      if (commonBase) {
        // Creating new object to avoid error "Cannot assign to read only property"
        const copyCommonBase = { ...commonBase }
        // Related to TODO(WEB-5111)
        // Some common base images are broken so this'll ensure we read from uniswap images
        if (queryResult.data?.token?.project?.logoUrl) {
          copyCommonBase.logoUrl = queryResult.data.token.project.logoUrl
        }
        copyCommonBase.currencyId = _currencyId
        return copyCommonBase
      }
    }

    if (tokenData.data) {
      const currency = buildCurrency({
        chainId: tokenData.data.chainId,
        address: tokenData.data.address,
        decimals: tokenData.data.decimals,
        symbol: tokenData.data.symbol,
        name: tokenData.data.name,
      })

      if (!currency) {
        return undefined
      }

      return buildCurrencyInfo({
        currency,
        currencyId: _currencyId,
        logoUrl: tokenData.data.logoUrl,
      })
    }

    return queryResult.data?.token && gqlTokenToCurrencyInfo(queryResult.data.token)
  }, [_currencyId, queryResult.data?.token, tokenData.data])

  return {
    currencyInfo,
    loading: queryResult.loading,
    error: queryResult.error,
  }
}

export function useCurrencyInfo(
  currencyId?: string,
  options?: { refetch?: boolean; skip?: boolean },
): Maybe<CurrencyInfo> {
  const localCurrencyInfo = useLocalCurrencyInfo(currencyId)
  const { currencyInfo } = useCurrencyInfoQuery(currencyId, options)

  // Transform svJUSD to JUSD for user-facing display
  const result = localCurrencyInfo || currencyInfo
  if (result && currencyId) {
    const chainId = currencyIdToChain(currencyId) as UniverseChainId
    const address = currencyIdToAddress(currencyId)
    if (address && isSvJusdAddress(chainId, address)) {
      return transformSvJusdCurrencyInfo(result, chainId)
    }
  }

  return result
}

export function useCurrencyInfoWithLoading(
  _currencyId?: string,
  options?: { refetch?: boolean; skip?: boolean },
): {
  currencyInfo: Maybe<CurrencyInfo>
  loading: boolean
  error?: Error
} {
  const queryResult = useCurrencyInfoQuery(_currencyId, options)

  const transformedCurrencyInfo = useMemo(() => {
    if (queryResult.currencyInfo && _currencyId) {
      try {
        const chainId = currencyIdToChain(_currencyId) as UniverseChainId
        const address = currencyIdToAddress(_currencyId)
        if (address && isSvJusdAddress(chainId, address)) {
          return transformSvJusdCurrencyInfo(queryResult.currencyInfo, chainId)
        }
      } catch {
        // Address parsing failed, return original
      }
    }
    return queryResult.currencyInfo
  }, [queryResult.currencyInfo, _currencyId])

  return {
    currencyInfo: transformedCurrencyInfo,
    loading: queryResult.loading,
    error: queryResult.error,
  }
}

const fetchTokens = (contracts: { chainId: UniverseChainId; address: Address }[]): Promise<{ tokens: unknown[] }> => {
  return PonderApiClient.post<{ tokens: unknown[] }>('/tokens/byAddresses', {
    body: JSON.stringify({ contracts }),
  })
}

export function useCurrencyInfos(
  _currencyIds: string[],
  options?: { refetch?: boolean; skip?: boolean },
): Maybe<CurrencyInfo>[] {
  const { data } = useQuery({
    queryKey: ['tokens', _currencyIds],
    queryFn: () => fetchTokens(_currencyIds.map(currencyIdToApiContract)),
    enabled: !options?.skip,
  })

  return useMemo(() => {
    if (!data?.tokens) {
      return []
    }
    return data.tokens.map((token, index) => {
      const currencyId = _currencyIds[index]
      let chainId: UniverseChainId | undefined
      let address: string | undefined

      // Parse chainId and address upfront for fallback logic
      if (currencyId) {
        try {
          chainId = currencyIdToChain(currencyId) as UniverseChainId
          address = currencyIdToAddress(currencyId)
        } catch {
          // Address parsing failed
        }
      }

      // If Ponder API returned null, try getCommonBase fallback
      if (!token) {
        if (chainId && address) {
          const commonBase = getCommonBase(chainId, address)
          if (commonBase) {
            return commonBase
          }
        }
        return null
      }

      const currencyInfo = gqlTokenToCurrencyInfo(token as never)

      // If gqlTokenToCurrencyInfo failed, try getCommonBase fallback
      if (!currencyInfo) {
        if (chainId && address) {
          const commonBase = getCommonBase(chainId, address)
          if (commonBase) {
            return commonBase
          }
        }
        return null
      }

      // Transform svJUSD to JUSD for user-facing display
      if (address && chainId && isSvJusdAddress(chainId, address)) {
        return transformSvJusdCurrencyInfo(currencyInfo, chainId)
      }

      return currencyInfo
    })
  }, [data, _currencyIds])
}

export function useNativeCurrencyInfo(chainId: UniverseChainId): Maybe<CurrencyInfo> {
  const nativeCurrencyId = buildNativeCurrencyId(chainId)
  return useCurrencyInfo(nativeCurrencyId)
}

export function useWrappedNativeCurrencyInfo(chainId: UniverseChainId): Maybe<CurrencyInfo> {
  const wrappedCurrencyId = buildWrappedNativeCurrencyId(chainId)
  return useCurrencyInfo(wrappedCurrencyId)
}
