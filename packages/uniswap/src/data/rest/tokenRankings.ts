import { PartialMessage } from '@bufbuild/protobuf'
import { ConnectError } from '@connectrpc/connect'
import { useQuery } from '@connectrpc/connect-query'
import { UseQueryResult } from '@tanstack/react-query'
import { tokenRankings } from '@uniswap/client-explore/dist/uniswap/explore/v1/service-ExploreStatsService_connectquery'
import {
  TokenRankingsRequest,
  TokenRankingsResponse,
  TokenRankingsStat,
} from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'

import { uniswapGetTransport } from 'uniswap/src/data/rest/base'
import { parseProtectionInfo, parseSafetyLevel } from 'uniswap/src/data/rest/utils'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'

/**
 * JuiceSwap: Token Rankings API is disabled
 * The Uniswap REST BE service TokenRankings endpoint is not available on JuiceSwap backend.
 * This hook returns empty data to disable the Explore rankings feature.
 */
export function useTokenRankingsQuery(
  input?: PartialMessage<TokenRankingsRequest>,
  _enabled = true,
): UseQueryResult<TokenRankingsResponse, ConnectError> {
  // Disabled: JuiceSwap does not have a token rankings endpoint
  return useQuery(tokenRankings, input, { transport: uniswapGetTransport, enabled: false })
}

export function tokenRankingsStatToCurrencyInfo(tokenRankingsStat: TokenRankingsStat): CurrencyInfo | null {
  const { chain, address, symbol, name, logo, decimals, feeData } = tokenRankingsStat
  const chainId = fromGraphQLChain(chain)
  const protectionInfo = parseProtectionInfo(tokenRankingsStat.protectionInfo)
  const safetyLevel = parseSafetyLevel(tokenRankingsStat.safetyLevel)

  if (!chainId || !symbol || !name) {
    return null
  }

  const currency = buildCurrency({
    chainId,
    address,
    decimals,
    symbol,
    name,
    buyFeeBps: feeData?.buyFeeBps,
    sellFeeBps: feeData?.sellFeeBps,
  })

  if (!currency) {
    return null
  }

  return buildCurrencyInfo({
    currency,
    currencyId: currencyId(currency),
    logoUrl: logo,
    safetyInfo: getCurrencySafetyInfo(safetyLevel, protectionInfo),
  })
}
