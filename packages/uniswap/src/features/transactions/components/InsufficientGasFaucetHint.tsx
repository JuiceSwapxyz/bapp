import { useTranslation } from 'react-i18next'
import { Anchor, Flex, Text, useMedia } from 'ui/src'
import { AlertTriangle } from 'ui/src/components/icons/AlertTriangle'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSwapFormButtonText } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useSwapFormButtonText'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

export function InsufficientGasFaucetHint(): JSX.Element | null {
  const { t } = useTranslation()
  const chainId = useSwapFormStore((s) => s.derivedSwapInfo.chainId)
  const buttonText = useSwapFormButtonText()
  const isShort = useMedia().short

  // Get chain info for faucet URL
  const chainInfo = chainId === UniverseChainId.CitreaTestnet ? getChainInfo(chainId) : null
  const faucetUrl = chainInfo?.faucetUrl

  // Get native currency symbol from chain info
  const nativeCurrencySymbol = chainInfo?.nativeCurrency.symbol ?? 'cBTC'
  const expectedButtonText = t('common.insufficientTokenBalance.error.simple', {
    tokenSymbol: nativeCurrencySymbol,
  })

  // Show component if:
  // - On Citrea testnet AND
  // - Button shows "Not enough cBTC" (insufficient gas funds) AND
  // - Has faucet URL available
  const shouldShow = chainId === UniverseChainId.CitreaTestnet && buttonText === expectedButtonText && faucetUrl

  if (!shouldShow) {
    return null
  }

  const finalFaucetUrl = faucetUrl

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
            currencySymbol: 'cBTC',
          })}
        </Text>
        <Anchor href={finalFaucetUrl} target="_blank" rel="noopener noreferrer" textDecorationLine="none">
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
