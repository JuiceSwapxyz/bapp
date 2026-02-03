import { memo } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { BridgeIcon, SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { OnSelectCurrency } from 'uniswap/src/components/TokenSelector/types'
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
        backgroundColor="$surface2"
        hoverStyle={{ backgroundColor: '$surface1Hovered' }}
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
        <Text color="$neutral1" variant="buttonLabel3">
          {label}
        </Text>
      </Flex>
    </TouchableArea>
  )
}

export const BridgePairCard = memo(_BridgePairCard)
