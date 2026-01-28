import type { PropsWithChildren } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { TransactionFailureReason } from 'uniswap/src/data/tradingApi/__generated__'
import { getRelevantTokenWarningSeverity } from 'uniswap/src/features/transactions/TransactionDetails/utils/getRelevantTokenWarningSeverity'
import { useFeeOnTransferAmounts } from 'uniswap/src/features/transactions/swap/hooks/useFeeOnTransferAmount'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import { SwapReviewTransactionStoreContext } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/SwapReviewTransactionStoreContext'
import type { SwapReviewTransactionState } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/createSwapReviewTransactionStore'
import { createSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/createSwapReviewTransactionStore'
import {
  isBitcoinBridge,
  isClassic,
  isErc20ChainSwap as isErc20ChainSwapFn,
  isGatewayJusd,
  isLightningBridge,
  isUniswapX,
} from 'uniswap/src/features/transactions/swap/utils/routing'
import { isWrapAction } from 'uniswap/src/features/transactions/swap/utils/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useHasValueChanged } from 'utilities/src/react/useHasValueChanged'

export const SwapReviewTransactionStoreContextProvider = ({
  children,
  derivedSwapInfo,
  swapTxContext,
  acceptedDerivedSwapInfo,
  newTradeRequiresAcceptance,
}: PropsWithChildren<
  Pick<
    SwapReviewTransactionState,
    'derivedSwapInfo' | 'swapTxContext' | 'acceptedDerivedSwapInfo' | 'newTradeRequiresAcceptance'
  >
>): JSX.Element => {
  const uniswapXGasBreakdown = isUniswapX(swapTxContext)
    ? (swapTxContext as Extract<typeof swapTxContext, { gasFeeBreakdown: unknown }>).gasFeeBreakdown
    : undefined

  const {
    chainId,
    currencies,
    wrapType,
    trade: { trade, indicativeTrade }, // TODO(WEB-5823): rm indicative trade usage from review screen
  } = derivedSwapInfo

  const { blockingWarning, reviewScreenWarning } = useParsedSwapWarnings()
  const isWrap = isWrapAction(wrapType)
  const isLnBridge = Boolean(trade && isLightningBridge(trade))
  const isBtcBridge = Boolean(trade && isBitcoinBridge(trade))
  const isErc20ChainSwap = Boolean(trade && isErc20ChainSwapFn(trade))
  const acceptedTrade = acceptedDerivedSwapInfo?.trade.trade
  const feeOnTransferProps = useFeeOnTransferAmounts(acceptedDerivedSwapInfo)
  const tokenWarningProps = getRelevantTokenWarningSeverity(acceptedDerivedSwapInfo)

  const txSimulationErrors = useMemo(() => {
    if (!trade || (!isClassic(trade) && !isGatewayJusd(trade))) {
      return undefined
    }
    return (trade.quote.quote as { txFailureReasons?: TransactionFailureReason[] }).txFailureReasons
  }, [trade])

  const derivedUpdatedState: SwapReviewTransactionState = useMemo(
    () => ({
      trade: trade ?? undefined,
      indicativeTrade: indicativeTrade ?? undefined,
      acceptedTrade: acceptedTrade ?? undefined,
      swapTxContext,
      gasFee: swapTxContext.gasFee,
      uniswapXGasBreakdown,
      derivedSwapInfo,
      acceptedDerivedSwapInfo,
      isWrap,
      isLnBridge,
      isBtcBridge,
      isErc20ChainSwap,
      blockingWarning,
      reviewScreenWarning,
      txSimulationErrors,
      newTradeRequiresAcceptance,
      feeOnTransferProps,
      tokenWarningProps,
      currencyInInfo: currencies[CurrencyField.INPUT],
      currencyOutInfo: currencies[CurrencyField.OUTPUT],
      chainId,
    }),
    [
      trade,
      indicativeTrade,
      acceptedTrade,
      swapTxContext,
      uniswapXGasBreakdown,
      derivedSwapInfo,
      acceptedDerivedSwapInfo,
      isWrap,
      isLnBridge,
      isBtcBridge,
      isErc20ChainSwap,
      blockingWarning,
      reviewScreenWarning,
      txSimulationErrors,
      newTradeRequiresAcceptance,
      feeOnTransferProps,
      tokenWarningProps,
      currencies,
      chainId,
    ],
  )

  const [store] = useState(() => createSwapReviewTransactionStore(derivedUpdatedState))

  const hasDerivedStateChanged = useHasValueChanged(derivedUpdatedState)

  useEffect(() => {
    if (hasDerivedStateChanged) {
      store.setState(derivedUpdatedState)
    }
  }, [derivedUpdatedState, store, hasDerivedStateChanged])

  return (
    <SwapReviewTransactionStoreContext.Provider value={store}>{children}</SwapReviewTransactionStoreContext.Provider>
  )
}
