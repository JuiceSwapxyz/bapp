import { useCallback, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { refundSwap } from 'state/sagas/transactions/bridgeRefundSaga'
import { Flex, Text } from 'ui/src'
import { AlertCircleFilled } from 'ui/src/components/icons/AlertCircleFilled'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { useValidateBitcoinAddress } from 'uniswap/src/data/apiClients/tradingApi/useValidateBitcoinAddress'
import { SomeSwap } from 'uniswap/src/features/lds-bridge/lds-types/storage'
import { AddressInput, RefundButton, RefundableSection, RefundableSwapCard } from './styles'

interface RefundableSwapsSectionProps {
  refundableSwaps: (SomeSwap & { id: string })[]
  isLoading: boolean
  onRefetch: () => Promise<void>
}

interface RefundableSwapCardItemProps {
  swap: SomeSwap & { id: string }
  address: string
  isRefunding: boolean
  onAddressChange: (address: string) => void
  onRefund: () => void
}

function RefundableSwapCardItem({
  swap,
  address,
  isRefunding,
  onAddressChange,
  onRefund,
}: RefundableSwapCardItemProps): JSX.Element {
  const { data: validationData, isError } = useValidateBitcoinAddress({
    bitcoinAddress: address,
  })

  const isValid = useMemo(() => {
    if (!address.trim()) {
      return null
    }
    return !isError && validationData?.validated === true
  }, [address, isError, validationData])

  const showError = address.trim() && isValid === false
  const showSuccess = address.trim() && isValid === true

  return (
    <RefundableSwapCard>
      <Flex gap="$spacing4">
        <Text variant="body2" color="$neutral1" fontWeight="600">
          {swap.sendAmount.toLocaleString()} {swap.assetSend} → {swap.receiveAmount.toLocaleString()}{' '}
          {swap.assetReceive}
        </Text>
        <Text variant="body4" color="$neutral2">
          {new Date(swap.date).toLocaleString()}
        </Text>
      </Flex>
      <Flex gap="$spacing4">
        <Flex flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text variant="body4" color="$neutral2">
            Refund Destination Address
          </Text>
          {showSuccess && (
            <Flex flexDirection="row" alignItems="center" gap="$spacing4">
              <CheckCircleFilled size="$icon.16" color="$statusSuccess" />
              <Text variant="body4" color="$statusSuccess">
                Valid
              </Text>
            </Flex>
          )}
          {showError && (
            <Flex flexDirection="row" alignItems="center" gap="$spacing4">
              <AlertCircleFilled size="$icon.16" color="$statusCritical" />
              <Text variant="body4" color="$statusCritical">
                Invalid address
              </Text>
            </Flex>
          )}
        </Flex>
        <AddressInput
          placeholder="Enter Bitcoin address for refund"
          value={address}
          onChangeText={onAddressChange}
          placeholderTextColor="$neutral3"
          autoComplete="off"
          autoCorrect={false}
          spellCheck={false}
        />
      </Flex>
      <RefundButton onPress={onRefund} disabled={isRefunding || !isValid}>
        <Text variant="buttonLabel4" color="$neutral1">
          {isRefunding ? 'Refunding...' : 'Refund'}
        </Text>
      </RefundButton>
    </RefundableSwapCard>
  )
}

export function RefundableSwapsSection({
  refundableSwaps,
  isLoading,
  onRefetch,
}: RefundableSwapsSectionProps): JSX.Element | null {
  const dispatch = useDispatch()
  const [refundingSwaps, setRefundingSwaps] = useState<Set<string>>(new Set())
  const [destinationAddresses, setDestinationAddresses] = useState<Record<string, string>>({})

  const handleAddressChange = useCallback((swapId: string, address: string) => {
    setDestinationAddresses((prev) => ({ ...prev, [swapId]: address }))
  }, [])

  const handleRefund = useCallback(
    async (swapId: string) => {
      const destinationAddress = destinationAddresses[swapId]

      if (!destinationAddress?.trim()) {
        console.error('Destination address is required')
        return
      }

      setRefundingSwaps((prev) => new Set(prev).add(swapId))
      try {
        dispatch(refundSwap(swapId, destinationAddress))
        await onRefetch()
      } catch (error) {
        console.error('Failed to refund swap:', error)
      } finally {
        setRefundingSwaps((prev) => {
          const next = new Set(prev)
          next.delete(swapId)
          return next
        })
      }
    },
    [dispatch, onRefetch, destinationAddresses],
  )

  if (isLoading || refundableSwaps.length === 0) {
    return null
  }

  return (
    <RefundableSection>
      <Flex flexDirection="row" alignItems="center" gap="$spacing8">
        <AlertTriangleFilled size="$icon.20" color="$DEP_accentWarning" />
        <Text variant="heading3" color="$neutral1" fontWeight="600">
          Swaps Available for Refund ({refundableSwaps.length})
        </Text>
      </Flex>
      <Text variant="body3" color="$neutral2">
        These swaps have timed out and can be refunded to recover your funds.
      </Text>
      <Flex gap="$spacing12">
        {refundableSwaps.map((swap) => (
          <RefundableSwapCardItem
            key={swap.id}
            swap={swap}
            address={destinationAddresses[swap.id] || ''}
            isRefunding={refundingSwaps.has(swap.id)}
            onAddressChange={(address) => handleAddressChange(swap.id, address)}
            onRefund={() => handleRefund(swap.id)}
          />
        ))}
      </Flex>
    </RefundableSection>
  )
}
