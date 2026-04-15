import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getLdsBridgeManager, minimumBalanceForSponsoredClaim } from 'uniswap/src/features/lds-bridge'
import { useOnChainNativeCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import {
  isBitcoinBridge,
  isErc20ChainSwap,
  isLightningBridge,
  isWbtcBridge,
} from 'uniswap/src/features/transactions/swap/utils/routing'
import type { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isWeb } from 'utilities/src/platform'

function isBridgeWithEvmOutput(derivedSwapInfo: DerivedSwapInfo): UniverseChainId | undefined {
  const trade = derivedSwapInfo.trade.trade
  if (!trade) {
    return undefined
  }

  const isBridge =
    isLightningBridge(trade) || isBitcoinBridge(trade) || isErc20ChainSwap(trade) || isWbtcBridge(trade)
  if (!isBridge) {
    return undefined
  }

  const outputChainId = derivedSwapInfo.currencies[CurrencyField.OUTPUT]?.currency.chainId as
    | UniverseChainId
    | undefined
  if (
    outputChainId === undefined ||
    outputChainId === UniverseChainId.Bitcoin ||
    outputChainId === UniverseChainId.LightningNetwork
  ) {
    return undefined
  }

  return outputChainId
}

export function useSponsoredClaimWarning({
  account,
  derivedSwapInfo,
}: {
  account?: AccountDetails
  derivedSwapInfo: DerivedSwapInfo
}): Warning | undefined {
  const { t } = useTranslation()
  const outputChainId = isBridgeWithEvmOutput(derivedSwapInfo)
  const enabled = outputChainId !== undefined
  const { data: isSponsorEligible, isSuccess: sponsorQueryResolved } = useQuery({
    queryKey: ['sponsored-claim-eligibility', outputChainId],
    queryFn: () => getLdsBridgeManager().isSponsoredClaimWalletEligible(outputChainId!),
    enabled,
  })

  const sponsorCanCoverFee = sponsorQueryResolved && isSponsorEligible

  const { balance: userNativeBalance } = useOnChainNativeCurrencyBalance(
    outputChainId ?? UniverseChainId.Mainnet,
    enabled ? account?.address : undefined,
  )

  const minimumFee = outputChainId !== undefined ? minimumBalanceForSponsoredClaim[outputChainId] : undefined
  const userCanCoverFee =
    minimumFee !== undefined &&
    userNativeBalance !== undefined &&
    Number(userNativeBalance.toExact()) >= minimumFee

  return useMemo(() => {
    if (!enabled || sponsorCanCoverFee || userCanCoverFee) {
      return undefined
    }

    const nativeSymbol = userNativeBalance?.currency.symbol ?? ''

    return {
      type: WarningLabel.InsufficientGasFunds,
      severity: WarningSeverity.Medium,
      action: WarningAction.DisableSubmit,
      title: t('swap.warning.insufficientGas.title', { currencySymbol: nativeSymbol }),
      buttonText: isWeb
        ? t('swap.warning.insufficientGas.button', { currencySymbol: nativeSymbol })
        : undefined,
    }
  }, [enabled, sponsorCanCoverFee, userCanCoverFee, userNativeBalance?.currency.symbol, t])
}
