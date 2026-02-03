import { memo } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { BridgeArrow } from 'ui/src/components/icons/BridgeArrow'
import { iconSizes } from 'ui/src/theme'
import { BridgeIcon, SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { OnSelectCurrency } from 'uniswap/src/components/TokenSelector/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { BridgePairOption } from 'uniswap/src/components/lists/items/types'

function _BridgePairCard({
  onSelectCurrency,
  bridgePair,
  index,
  section,
}: {
  onSelectCurrency: OnSelectCurrency
  bridgePair: BridgePairOption
  index: number
  section: OnchainItemSection<BridgePairOption>
}): JSX.Element {
  const { fromCurrencyInfo, toCurrencyInfo, label } = bridgePair

  const onPress = (): void => {
    onSelectCurrency(fromCurrencyInfo, section, index)
  }

  const parts = label.split(' ⇄ ')
  const fromLabel = parts[0]
  const toLabel = parts[1]

  const showChainBadge =
    fromCurrencyInfo.currency.chainId === UniverseChainId.Mainnet ||
    fromCurrencyInfo.currency.chainId === UniverseChainId.Polygon

  return (
    <TouchableArea
      hoverable
      borderRadius="$roundedFull"
      testID={`bridge-pair-option-${label}`}
      onPress={onPress}
    >
      <Flex
        row
        alignItems="center"
        borderRadius="$rounded16"
        px="$spacing12"
        py="$spacing8"
        gap="$spacing8"
      >
        <SplitLogo
          inputCurrencyInfo={fromCurrencyInfo}
          outputCurrencyInfo={toCurrencyInfo}
          size={iconSizes.icon40}
          chainId={fromCurrencyInfo.currency.chainId}
          customIcon={BridgeIcon}
        />
        <Flex row alignItems="center" gap="$spacing4">
          <Flex row alignItems="center" gap="$spacing4">
            {showChainBadge && (
              <NetworkLogo chainId={fromCurrencyInfo.currency.chainId} size={iconSizes.icon12} />
            )}
            <Text color="$neutral1" variant="buttonLabel3">
              {fromLabel}
            </Text>
          </Flex>
          <BridgeArrow />
          <Text color="$neutral1" variant="buttonLabel3">
            {toLabel}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}

export const BridgePairCard = memo(_BridgePairCard)
