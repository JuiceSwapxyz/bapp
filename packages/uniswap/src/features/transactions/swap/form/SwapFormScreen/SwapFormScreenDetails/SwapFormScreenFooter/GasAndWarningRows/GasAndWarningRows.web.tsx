import { Flex } from 'ui/src'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { InsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/InsufficientNativeTokenWarning'
import { BlockedAddressWarning } from 'uniswap/src/features/transactions/modals/BlockedAddressWarning'
import { TradeInfoRow } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/TradeInfoRow'
import { useDebouncedGasInfo } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/useDebouncedGasInfo'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'

export function GasAndWarningRows(): JSX.Element | null {
  const { evmAccount } = useWallet()
  const { isBlocked } = useIsBlocked(evmAccount?.address)
  const { formScreenWarning, warnings } = useParsedSwapWarnings()
  const debouncedGasInfo = useDebouncedGasInfo()

  const inlineWarning = formScreenWarning?.displayedInline && !isBlocked ? formScreenWarning.warning : undefined
  const hasGasInfo = Boolean(debouncedGasInfo.fiatPriceFormatted)
  const hasInsufficientFundsWarning = warnings.some((w) => w.type === WarningLabel.InsufficientFunds)
  const hasInsufficientGasWarning = warnings.some(
    (w) => w.type === WarningLabel.InsufficientGasFunds || (w.type === WarningLabel.InsufficientFunds && w.currency?.isNative)
  )

  // Don't render empty container
  if (!isBlocked && !hasGasInfo && !hasInsufficientGasWarning) {
    return null
  }

  return (
    <Flex gap="$spacing12">
      {isBlocked && (
        <BlockedAddressWarning
          row
          alignItems="center"
          alignSelf="stretch"
          backgroundColor="$surface2"
          borderBottomLeftRadius="$rounded16"
          borderBottomRightRadius="$rounded16"
          flexGrow={1}
          px="$spacing16"
          py="$spacing12"
        />
      )}

      {!hasInsufficientFundsWarning && hasGasInfo && (
        <Flex gap="$spacing8" px="$spacing8" py="$spacing4">
          <TradeInfoRow gasInfo={debouncedGasInfo} warning={inlineWarning} />
        </Flex>
      )}

      <InsufficientNativeTokenWarning flow="swap" gasFee={debouncedGasInfo.gasFee} warnings={warnings} />
    </Flex>
  )
}
