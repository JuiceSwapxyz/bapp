import { useMemo } from 'react'
import { ColorTokens, Flex, Text } from 'ui/src'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { useValidateLightningAddress } from 'uniswap/src/data/apiClients/tradingApi/useValidateLightningAddress'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

export const SwapEnterBitcoinLikeAddress = (): JSX.Element => {
  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)

  const bitcoinDestinationAddress = useSwapFormStore((s) => s.bitcoinDestinationAddress)

  const {
    data: validated,
    isLoading,
    error,
  } = useValidateLightningAddress({ lnLikeAddress: bitcoinDestinationAddress ?? '' })

  const borderColor = useMemo((): ColorTokens => {
    if (error) {
      return '$statusCritical'
    }
    if (validated) {
      return '$neutral1'
    }
    if (isLoading) {
      return '$neutral3'
    }
    return '$surface3'
  }, [validated, error, isLoading])

  return (
    <Flex gap="$spacing8">
      <Text color="$neutral2" variant="body2" ml="$spacing12" mr="$spacing12">
        Destination address
      </Text>
      <TextInput
        value={bitcoinDestinationAddress}
        placeholder="Enter a BOLT12, LNURL, or Bitcoin address"
        borderWidth={1}
        borderColor={borderColor}
        fontWeight="$book"
        hoverStyle={{
          borderWidth: 1,
          borderColor,
          outlineWidth: 0,
        }}
        focusStyle={{
          borderWidth: 1,
          borderColor,
          outlineWidth: 0,
        }}
        onChangeText={(text) => {
          updateSwapForm({ bitcoinDestinationAddress: text })
        }}
      />
      {error && (
        <Text color="$statusCritical" variant="body4" ml="$spacing12" mr="$spacing12">
          Invalid Lightning address or LNURL format
        </Text>
      )}
    </Flex>
  )
}
