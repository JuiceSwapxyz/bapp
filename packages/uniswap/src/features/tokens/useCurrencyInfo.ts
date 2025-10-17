import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getCommonBase } from 'uniswap/src/constants/routing'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
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
import {
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyId,
  currencyIdToAddress,
  currencyIdToChain,
} from 'uniswap/src/utils/currencyId'

const PonderApiClient = createApiClient({
  baseUrl: process.env.REACT_APP_PONDER_JUICESWAP_URL || '',
})

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
  _currencyId?: string,
  options?: { refetch?: boolean; skip?: boolean },
): Maybe<CurrencyInfo> {
  const { currencyInfo } = useCurrencyInfoQuery(_currencyId, options)
  return currencyInfo
}

export function useCurrencyInfoWithLoading(
  _currencyId?: string,
  options?: { refetch?: boolean; skip?: boolean },
): {
  currencyInfo: Maybe<CurrencyInfo>
  loading: boolean
  error?: Error
} {
  return useCurrencyInfoQuery(_currencyId, options)
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
    return data?.tokens.map((token) => (token ? gqlTokenToCurrencyInfo(token as never) : null)) ?? []
  }, [data])
}

export function useNativeCurrencyInfo(chainId: UniverseChainId): Maybe<CurrencyInfo> {
  const nativeCurrencyId = buildNativeCurrencyId(chainId)
  return useCurrencyInfo(nativeCurrencyId)
}

export function useWrappedNativeCurrencyInfo(chainId: UniverseChainId): Maybe<CurrencyInfo> {
  const wrappedCurrencyId = buildWrappedNativeCurrencyId(chainId)
  return useCurrencyInfo(wrappedCurrencyId)
}
