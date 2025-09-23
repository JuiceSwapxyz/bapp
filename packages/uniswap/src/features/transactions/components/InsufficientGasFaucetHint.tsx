import { useTranslation } from 'react-i18next'
import { Anchor, Flex, Text, useMedia } from 'ui/src'
import { AlertTriangle } from 'ui/src/components/icons'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

export function InsufficientGasFaucetHint(): JSX.Element | null {
  const { t } = useTranslation()
  const { insufficientGasFundsWarning } = useParsedSwapWarnings()
  const chainId = useSwapFormStore((s) => s.derivedSwapInfo.chainId)
  const isShort = useMedia().short

  // Only show for Citrea testnet when there's an insufficient gas warning with faucet URL
  if (
    !insufficientGasFundsWarning ||
    !insufficientGasFundsWarning.faucetUrl ||
    chainId !== UniverseChainId.CitreaTestnet
  ) {
    return null
  }

  return (
    <Flex
      row
      alignItems="center"
      backgroundColor="$surface2"
      borderRadius="$rounded12"
      gap="$spacing8"
      p="$spacing12"
      mt="$spacing8"
    >
      <AlertTriangle color="$statusWarning" size="$icon.20" />
      <Flex fill gap="$spacing4">
        <Text color="$neutral2" variant="body3">
          {t('swap.warning.insufficientGas.faucet.title', {
            currencySymbol: insufficientGasFundsWarning.currency?.symbol || 'cBTC',
          })}
        </Text>
        <Anchor
          href={insufficientGasFundsWarning.faucetUrl}
          target="_blank"
          rel="noopener noreferrer"
          textDecorationLine="none"
        >
          <Text color="$accent1" variant="buttonLabel4">
            {isShort
              ? t('swap.warning.insufficientGas.faucet.link.short')
              : t('swap.warning.insufficientGas.faucet.link')}
          </Text>
        </Anchor>
      </Flex>
    </Flex>
  )
}
