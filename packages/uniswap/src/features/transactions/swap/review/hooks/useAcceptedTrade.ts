import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { requireAcceptNewTrade } from 'uniswap/src/features/transactions/swap/utils/trade'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { interruptTransactionFlow } from 'uniswap/src/utils/saga'
import { isInterface } from 'utilities/src/platform'

export function useAcceptedTrade({
  derivedSwapInfo,
  isSubmitting,
}: {
  derivedSwapInfo?: DerivedSwapInfo
  isSubmitting: boolean
}): {
  onAcceptTrade: () => undefined
  acceptedDerivedSwapInfo?: DerivedSwapInfo
  newTradeRequiresAcceptance: boolean
} {
  const [acceptedDerivedSwapInfo, setAcceptedDerivedSwapInfo] = useState<DerivedSwapInfo>()
  const dispatch = useDispatch()

  const { trade, indicativeTrade } = derivedSwapInfo?.trade ?? {}
  const acceptedTrade = acceptedDerivedSwapInfo?.trade.trade
  const isWrap = derivedSwapInfo?.wrapType !== WrapType.NotApplicable

  // In wallet, once swap is clicked / submission is in progress, it is too late to prompt user to accept new trade.
  // On interface, we can prompt the user to accept a new trade mid-flow.
  const avoidPromptingUserToAcceptNewTrade = isSubmitting && !isInterface

  // Avoid prompting user to accept new trade if submission is in progress
  const newTradeRequiresAcceptance = !avoidPromptingUserToAcceptNewTrade && requireAcceptNewTrade(acceptedTrade, trade)

  useEffect(() => {
    // For wraps, always accept since there's no trade to compare
    if (isWrap && derivedSwapInfo) {
      setAcceptedDerivedSwapInfo(derivedSwapInfo)
      return
    }

    if ((!trade && !indicativeTrade) || trade === acceptedTrade) {
      return
    }

    // auto-accept: 1) first valid trade for the user or 2) new trade if price movement is below threshold
    if (!acceptedTrade || !newTradeRequiresAcceptance) {
      setAcceptedDerivedSwapInfo(derivedSwapInfo)
    }

    // If a new trade requires acceptance, interrupt interface's transaction flow
    if (isInterface && newTradeRequiresAcceptance) {
      dispatch(interruptTransactionFlow())
    }
  }, [trade, acceptedTrade, indicativeTrade, newTradeRequiresAcceptance, derivedSwapInfo, dispatch, isWrap])

  const onAcceptTrade = (): undefined => {
    if (!trade) {
      return
    }

    setAcceptedDerivedSwapInfo(derivedSwapInfo)
  }

  return {
    onAcceptTrade,
    acceptedDerivedSwapInfo,
    newTradeRequiresAcceptance,
  }
}
