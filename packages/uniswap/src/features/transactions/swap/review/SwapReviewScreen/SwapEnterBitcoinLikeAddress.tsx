import { Flex, Separator, Text } from 'ui/src'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

export const SwapEnterBitcoinLikeAddress = (): JSX.Element => {
  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)
  const bitcoinDestinationAddress = useSwapFormStore((s) => s.bitcoinDestinationAddress)

  return (
    <>
      <Separator my="$spacing8" ml="$spacing12" mr="$spacing12" />
      <Flex gap="$spacing8">
        <Text color="$neutral2" variant="body2" ml="$spacing12" mr="$spacing12">
          Destination address
        </Text>
        <TextInput
          value={bitcoinDestinationAddress}
          placeholder="Enter a BOLT12, LNURL, or Bitcoin address"
          borderWidth={1}
          borderColor="$surface3"
          fontWeight="$book"
          hoverStyle={{
            borderWidth: 1,
            borderColor: '$surface3Hovered',
            outlineWidth: 0,
          }}
          focusStyle={{
            borderWidth: 1,
            borderColor: '$neutral1',
            outlineWidth: 0,
          }}
          onChangeText={(text) => {
            updateSwapForm({ bitcoinDestinationAddress: text })
          }}
        />
      </Flex>
    </>
  )
}
