import { useMemo } from 'react'
import { ColorTokens, Flex, Text } from 'ui/src'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { useValidateBitcoinAddress } from 'uniswap/src/data/apiClients/tradingApi/useValidateBitcoinAddress'
import { useValidateLightningAddress } from 'uniswap/src/data/apiClients/tradingApi/useValidateLightningAddress'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

export enum BitcoinLikeAddressType {
  Lightning = 'lightning',
  Bitcoin = 'bitcoin',
}

export const SwapEnterBitcoinLikeAddress = ({
  type,
  placeholder,
  errorMessage,
}: {
  type: BitcoinLikeAddressType
  placeholder: string
  errorMessage: string
}): JSX.Element => {
  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)

  const bitcoinDestinationAddress = useSwapFormStore((s) => s.bitcoinDestinationAddress)

  const {
    data: validatedLightningAddress,
    error: errorLightningAddress,
    isLoading: isLoadingLightningAddress,
  } = useValidateLightningAddress({ lnLikeAddress: bitcoinDestinationAddress ?? '' })

  const {
    data: validatedBitcoinAddress,
    error: errorBitcoinAddress,
    isLoading: isLoadingBitcoinAddress,
  } = useValidateBitcoinAddress({ bitcoinAddress: bitcoinDestinationAddress ?? '' })

  const isValid =
    type === BitcoinLikeAddressType.Lightning
      ? validatedLightningAddress?.validated
      : validatedBitcoinAddress?.validated
  const error = type === BitcoinLikeAddressType.Lightning ? errorLightningAddress : errorBitcoinAddress
  const isLoading = type === BitcoinLikeAddressType.Lightning ? isLoadingLightningAddress : isLoadingBitcoinAddress

  const borderColor = useMemo((): ColorTokens => {
    if (error) {
      return '$statusCritical'
    }
    if (isValid) {
      return '$neutral1'
    }
    if (isLoading) {
      return '$neutral3'
    }
    return '$surface3'
  }, [isValid, error, isLoading])

  return (
    <Flex gap="$spacing8">
      <Text color="$neutral2" variant="body2" ml="$spacing12" mr="$spacing12">
        Destination address
      </Text>
      <TextInput
        value={bitcoinDestinationAddress}
        placeholder={placeholder}
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
          {errorMessage}
        </Text>
      )}
    </Flex>
  )
}
