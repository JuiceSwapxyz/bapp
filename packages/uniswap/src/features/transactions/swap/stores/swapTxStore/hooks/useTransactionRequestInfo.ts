import { useEffect, useMemo, useRef } from 'react'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { useTradingApiSwapQuery } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwapQuery'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import { Routing, type NullablePermit } from 'uniswap/src/data/tradingApi/__generated__'
import { useActiveGasStrategy } from 'uniswap/src/features/gas/hooks'
import { DynamicConfigs, SwapConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { useAllTransactionSettings } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { FALLBACK_SWAP_REQUEST_POLL_INTERVAL_MS } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/constants'
import { getCustomSwapTokenData } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapInstructionsService'
import { processUniswapXResponse } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/uniswapx/utils'
import type { TransactionRequestInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import {
  createLogSwapRequestErrors,
  createPrepareSwapRequestParams,
  createProcessSwapResponse,
  getShouldSkipSwapRequest,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import { usePermit2SignatureWithData } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/hooks/usePermit2Signature'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { ClassicTrade, TokenApprovalInfo } from 'uniswap/src/features/transactions/swap/types/trade'
import { ApprovalAction } from 'uniswap/src/features/transactions/swap/types/trade'
import {
  isBitcoinBridge,
  isBridge,
  isClassic,
  isGatewayJusd,
  isUniswapX,
  isWrap,
} from 'uniswap/src/features/transactions/swap/utils/routing'
import { isInterface } from 'utilities/src/platform'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

function useSwapTransactionRequestInfo({
  derivedSwapInfo,
  tokenApprovalInfo,
}: {
  derivedSwapInfo: DerivedSwapInfo
  tokenApprovalInfo: TokenApprovalInfo | undefined
}): TransactionRequestInfo {
  const trace = useTrace()
  const gasStrategy = useActiveGasStrategy(derivedSwapInfo.chainId, 'general')
  const transactionSettings = useAllTransactionSettings()

  const permitData = derivedSwapInfo.trade.trade?.quote.permitData
  // On interface, we do not fetch signature until after swap is clicked, as it requires user interaction.
  const { data: signature } = usePermit2SignatureWithData({ permitData, skip: isInterface })

  const swapQuoteResponse = useMemo(() => {
    const quote = derivedSwapInfo.trade.trade?.quote
    // Gateway JUSD quotes use a separate request params path (see gatewaySwapRequestParams below)
    if (quote && (isClassic(quote) || isBridge(quote) || isBitcoinBridge(quote) || isWrap(quote))) {
      return quote
    }
    return undefined
  }, [derivedSwapInfo.trade.trade?.quote])

  // Separate handling for Gateway JUSD quotes which have a different structure
  const gatewayQuoteResponse = useMemo(() => {
    const quote = derivedSwapInfo.trade.trade?.quote
    if (quote && isGatewayJusd(quote)) {
      return quote
    }
    return undefined
  }, [derivedSwapInfo.trade.trade?.quote])

  const swapQuote = swapQuoteResponse?.quote

  const swapDelegationInfo = useUniswapContextSelector((ctx) => ctx.getSwapDelegationInfo?.(derivedSwapInfo.chainId))
  const overrideSimulation = !!swapDelegationInfo?.delegationAddress

  const prepareSwapRequestParams = useMemo(() => createPrepareSwapRequestParams({ gasStrategy }), [gasStrategy])

  const standardSwapRequestParams = useMemo(() => {
    if (!swapQuoteResponse) {
      return undefined
    }

    const alreadyApproved = tokenApprovalInfo?.action === ApprovalAction.None && !swapQuoteResponse.permitTransaction

    return {
      ...prepareSwapRequestParams({
        swapQuoteResponse,
        signature: signature ?? undefined,
        transactionSettings,
        alreadyApproved,
        overrideSimulation,
      }),
      customSwapData: getCustomSwapTokenData(derivedSwapInfo.trade.trade as ClassicTrade, transactionSettings),
    }
  }, [
    swapQuoteResponse,
    tokenApprovalInfo?.action,
    prepareSwapRequestParams,
    signature,
    transactionSettings,
    overrideSimulation,
    derivedSwapInfo.trade.trade,
  ])

  // Gateway JUSD quotes use a simpler request params structure
  // fetchSwap detects Gateway quotes by checking for input/output without route
  const gatewaySwapRequestParams = useMemo(() => {
    if (!gatewayQuoteResponse) {
      return undefined
    }

    const deadline = getTradeSettingsDeadline(transactionSettings.customDeadline)

    return {
      quote: gatewayQuoteResponse.quote,
      deadline,
      simulateTransaction: false,
      refreshGasPrice: true,
      gasStrategies: [gasStrategy],
      customSwapData: getCustomSwapTokenData(derivedSwapInfo.trade.trade as ClassicTrade, transactionSettings),
    }
  }, [gatewayQuoteResponse, transactionSettings, gasStrategy, derivedSwapInfo.trade.trade])

  // Use either standard or gateway swap request params
  const swapRequestParams = standardSwapRequestParams || gatewaySwapRequestParams

  const canBatchTransactions = useUniswapContextSelector((ctx) =>
    ctx.getCanBatchTransactions?.(derivedSwapInfo.chainId),
  )

  const permitsDontNeedSignature = !!canBatchTransactions
  const isBitcoinBridgeSwap = derivedSwapInfo.trade.trade?.routing === Routing.BITCOIN_BRIDGE
  const isLightningBridgeSwap = derivedSwapInfo.trade.trade?.routing === Routing.LN_BRIDGE
  const isErc20ChainSwapTrade = derivedSwapInfo.trade.trade?.routing === Routing.ERC20_CHAIN_SWAP
  // Gateway JUSD trades now use the standard swap flow (fetchSwap handles Gateway quotes)
  const shouldSkipSwapRequest =
    isBitcoinBridgeSwap ||
    isLightningBridgeSwap ||
    isErc20ChainSwapTrade ||
    getShouldSkipSwapRequest({
      derivedSwapInfo,
      tokenApprovalInfo,
      signature: signature ?? undefined,
      permitsDontNeedSignature,
    })

  const tradingApiSwapRequestMs = useDynamicConfigValue({
    config: DynamicConfigs.Swap,
    key: SwapConfigKey.TradingApiSwapRequestMs,
    defaultValue: FALLBACK_SWAP_REQUEST_POLL_INTERVAL_MS,
  })

  const {
    data,
    error,
    isLoading: isSwapLoading,
  } = useTradingApiSwapQuery(
    {
      params: shouldSkipSwapRequest ? undefined : swapRequestParams,
      refetchInterval: tradingApiSwapRequestMs,
      staleTime: tradingApiSwapRequestMs,
      // We add a small buffer in case connection is too slow
      immediateGcTime: tradingApiSwapRequestMs + ONE_SECOND_MS * 5,
    },
    {
      canBatchTransactions,
      swapDelegationAddress: swapDelegationInfo?.delegationAddress,
      includesDelegation: swapDelegationInfo?.delegationInclusion,
    },
  )

  const processSwapResponse = useMemo(() => createProcessSwapResponse({ gasStrategy }), [gasStrategy])

  const result = useMemo(() => {
    // Bitcoin, Lightning bridges and ERC20 chain swaps don't use Trading API swap endpoint, return mock gas fee
    if (isBitcoinBridgeSwap || isLightningBridgeSwap || isErc20ChainSwapTrade) {
      return {
        gasFeeResult: {
          value: '0',
          displayValue: '0',
          isLoading: false,
          error: null,
        },
        txRequests: undefined,
        permitData: null,
        gasEstimate: {
          swapEstimate: undefined,
        },
        includesDelegation: undefined,
        swapRequestArgs: undefined,
      }
    }

    return processSwapResponse({
      response: data,
      error,
      swapQuote,
      isSwapLoading,
      permitData,
      swapRequestParams,
      isRevokeNeeded: tokenApprovalInfo?.action === ApprovalAction.RevokeAndPermit2Approve,
      permitsDontNeedSignature,
    })
  }, [
    isBitcoinBridgeSwap,
    isLightningBridgeSwap,
    isErc20ChainSwapTrade,
    data,
    error,
    isSwapLoading,
    permitData,
    swapQuote,
    swapRequestParams,
    processSwapResponse,
    tokenApprovalInfo?.action,
    permitsDontNeedSignature,
  ])

  // Only log analytics events once per request
  const previousRequestIdRef = useRef(swapQuoteResponse?.requestId)
  const logSwapRequestErrors = useMemo(() => createLogSwapRequestErrors({ trace }), [trace])

  useEffect(() => {
    logSwapRequestErrors({
      txRequest: result.txRequests?.[0],
      gasFeeResult: result.gasFeeResult,
      derivedSwapInfo,
      transactionSettings,
      previousRequestId: previousRequestIdRef.current,
    })

    if (swapQuoteResponse) {
      previousRequestIdRef.current = swapQuoteResponse.requestId
    }
  }, [logSwapRequestErrors, result, derivedSwapInfo, transactionSettings, swapQuoteResponse])

  return result
}

function useUniswapXTransactionRequestInfo(permitData: NullablePermit | undefined): TransactionRequestInfo {
  return useMemo(
    () =>
      processUniswapXResponse({
        permitData,
      }),
    [permitData],
  )
}

export function useTransactionRequestInfo({
  derivedSwapInfo,
  tokenApprovalInfo,
}: {
  derivedSwapInfo: DerivedSwapInfo
  tokenApprovalInfo: TokenApprovalInfo | undefined
}): TransactionRequestInfo {
  const uniswapXTransactionRequestInfo = useUniswapXTransactionRequestInfo(
    derivedSwapInfo.trade.trade?.quote.permitData,
  )
  const swapTransactionRequestInfo = useSwapTransactionRequestInfo({ derivedSwapInfo, tokenApprovalInfo })

  if (derivedSwapInfo.trade.trade && isUniswapX(derivedSwapInfo.trade.trade)) {
    return uniswapXTransactionRequestInfo
  }

  return swapTransactionRequestInfo
}
