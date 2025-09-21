import { AccountType } from 'uniswap/src/features/accounts/types'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useInterfaceWrap } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useInterfaceWrap'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { CurrencyField } from 'uniswap/src/types/currency'

const useIsReviewButtonDisabled = (): boolean => {
  const isSubmitting = useSwapFormStore((s) => s.isSubmitting)
  const { trade, wrapType, currencyAmounts } = useSwapFormStoreDerivedSwapInfo((s) => ({
    trade: s.trade,
    wrapType: s.wrapType,
    currencyAmounts: s.currencyAmounts,
  }))

  // For wraps, we don't need a trade - just valid currency amounts
  const isWrap = wrapType !== WrapType.NotApplicable
  const hasValidAmounts = currencyAmounts[CurrencyField.INPUT] && currencyAmounts[CurrencyField.OUTPUT]
  const isTradeMissing = !trade.trade && !isWrap
  const isWrapMissingAmounts = isWrap && !hasValidAmounts

  const activeAccount = useWallet().evmAccount
  const { blockingWarning } = useParsedSwapWarnings()
  const { isBlocked: isBlockedAccount, isBlockedLoading: isBlockedAccountLoading } = useIsBlocked(
    activeAccount?.address,
  )
  const { walletNeedsRestore } = useTransactionModalContext()

  const { isInterfaceWrap, onInterfaceWrap } = useInterfaceWrap()
  const isWrapDisabled = isInterfaceWrap && !onInterfaceWrap && false // Temporarily disable this check

  return (
    !!blockingWarning ||
    isBlockedAccount ||
    isBlockedAccountLoading ||
    walletNeedsRestore ||
    isSubmitting ||
    isTradeMissing ||
    isWrapMissingAmounts ||
    isWrapDisabled
  )
}

// TODO(WEB-5090): Simplify logic, deduplicate disabled vs isReviewButtonDisabled
export const useIsSwapButtonDisabled = (): boolean => {
  const isReviewButtonDisabled = useIsReviewButtonDisabled()
  const { swapRedirectCallback } = useTransactionModalContext()
  const activeAccount = useWallet().evmAccount

  const isViewOnlyWallet = activeAccount?.accountType === AccountType.Readonly

  return !!activeAccount && isReviewButtonDisabled && !isViewOnlyWallet && !swapRedirectCallback
}
