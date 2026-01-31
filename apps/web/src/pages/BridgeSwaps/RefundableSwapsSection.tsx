import { useEvmRefund } from 'hooks/useEvmRefund'
import { EvmRefundableLockup } from 'hooks/useEvmRefundableSwaps'
import { AddressInput, RefundButton, RefundableSection, RefundableSwapCard } from 'pages/BridgeSwaps/styles'
import { formatSatoshiAmount } from 'pages/BridgeSwaps/utils'
import { useCallback, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { refundSwap } from 'state/sagas/transactions/bridgeRefundSaga'
import { Flex, Text } from 'ui/src'
import { AlertCircleFilled } from 'ui/src/components/icons/AlertCircleFilled'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { useValidateBitcoinAddress } from 'uniswap/src/data/apiClients/tradingApi/useValidateBitcoinAddress'
import { SomeSwap } from 'uniswap/src/features/lds-bridge/lds-types/storage'
import { prefix0x } from 'uniswap/src/features/lds-bridge/utils/hex'
import { logger } from 'utilities/src/logger/logger'
import { formatUnits } from 'viem'

interface RefundableSwapsSectionProps {
  refundableSwaps: (SomeSwap & { id: string })[]
  evmRefundableSwaps: EvmRefundableLockup[]
  evmLockedSwaps: EvmRefundableLockup[]
  allSwaps: (SomeSwap & { id: string })[]
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
          {formatSatoshiAmount(swap.sendAmount)} {swap.assetSend} → {formatSatoshiAmount(swap.receiveAmount)}{' '}
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

interface EvmRefundableSwapCardItemProps {
  lockup: EvmRefundableLockup
  allSwaps: (SomeSwap & { id: string })[]
  isRefunding: boolean
  onRefund: () => void
}

function EvmRefundableSwapCardItem({
  lockup,
  allSwaps,
  isRefunding,
  onRefund,
}: EvmRefundableSwapCardItemProps): JSX.Element {
  const amount = formatUnits(BigInt(lockup.amount), 18)

  const getTokenInfo = () => {
    // Try to find the swap by preimageHash in local storage
    const localSwap = allSwaps.find((swap) => prefix0x(swap.preimageHash) === prefix0x(lockup.preimageHash))

    if (localSwap) {
      // Use the asset from local swap history
      return { symbol: localSwap.assetSend, name: localSwap.assetSend }
    }

    // Fallback to token address logic if not found in local swaps
    if (!lockup.tokenAddress) {
      return { symbol: 'cBTC', name: 'Native Token' }
    }
    const tokenAddr = lockup.tokenAddress.toLowerCase()
    if (tokenAddr === '0x0000000000000000000000000000000000000000') {
      return { symbol: 'cBTC', name: 'Native Token' }
    }
    // Common token mappings - can be extended
    const tokenMap: Record<string, { symbol: string; name: string }> = {
      '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', name: 'Tether USD' },
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', name: 'USD Coin' },
    }
    if (tokenAddr in tokenMap) {
      return tokenMap[tokenAddr]
    }
    return { symbol: 'ERC20', name: 'Token' }
  }

  const tokenInfo = getTokenInfo()
  const timelock = new Date(Number(lockup.timelock) * 1000).toLocaleString()
  const chainName = lockup.chainId === '5115' ? 'Citrea' : `Chain ${lockup.chainId}`

  // Add a 5-minute buffer to account for block timestamp differences
  const BUFFER_SECONDS = 300 // 5 minutes
  const timelockTimestamp = Number(lockup.timelock)
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const isExpired = timelockTimestamp + BUFFER_SECONDS < currentTimestamp

  const timeRemaining = timelockTimestamp - currentTimestamp
  const hoursRemaining = Math.floor(timeRemaining / 3600)
  const minutesRemaining = Math.floor((timeRemaining % 3600) / 60)

  return (
    <RefundableSwapCard highlighted>
      <Flex gap="$spacing8">
        <Flex flexDirection="row" alignItems="center" justifyContent="space-between">
          <Text variant="body3" color="$neutral1" fontWeight="600">
            {amount} {tokenInfo.symbol}
          </Text>
          <Flex
            backgroundColor={isExpired ? '$statusSuccess' : '$surface3'}
            paddingHorizontal="$spacing6"
            paddingVertical="$spacing2"
            borderRadius="$rounded8"
          >
            <Text variant="body4" color={isExpired ? '$white' : '$neutral2'} fontWeight="600" fontSize={11}>
              {isExpired ? 'Refundable' : 'Locked'}
            </Text>
          </Flex>
        </Flex>

        <Flex gap="$spacing2">
          <Flex flexDirection="row" justifyContent="space-between">
            <Text variant="body4" color="$neutral2" fontSize={12}>
              Chain:
            </Text>
            <Text variant="body4" color="$neutral1" fontSize={12}>
              {chainName}
            </Text>
          </Flex>
          <Flex flexDirection="row" justifyContent="space-between">
            <Text variant="body4" color="$neutral2" fontSize={12}>
              Token:
            </Text>
            <Text variant="body4" color="$neutral1" fontSize={12}>
              {tokenInfo.name}
            </Text>
          </Flex>
          <Flex flexDirection="row" justifyContent="space-between">
            <Text variant="body4" color="$neutral2" fontSize={12}>
              Timelock:
            </Text>
            <Text variant="body4" color="$neutral1" fontSize={12}>
              {timelock}
            </Text>
          </Flex>
          {!isExpired && timeRemaining > 0 && (
            <Flex flexDirection="row" justifyContent="space-between">
              <Text variant="body4" color="$neutral2" fontSize={12}>
                Time Remaining:
              </Text>
              <Text variant="body4" color="$statusCritical" fontWeight="600" fontSize={12}>
                {hoursRemaining > 0 ? `${hoursRemaining}h ${minutesRemaining}m` : `${minutesRemaining}m`}
              </Text>
            </Flex>
          )}
          <Flex flexDirection="row" justifyContent="space-between">
            <Text variant="body4" color="$neutral2" fontSize={12}>
              Hash:
            </Text>
            <Text variant="body4" color="$neutral3" fontFamily="$mono" fontSize={10}>
              {lockup.preimageHash.slice(0, 10)}...{lockup.preimageHash.slice(-8)}
            </Text>
          </Flex>
        </Flex>
      </Flex>

      <RefundButton onPress={onRefund} disabled={isRefunding || !isExpired}>
        <Text variant="buttonLabel4" color="$neutral1" fontSize={13}>
          {isRefunding ? 'Refunding...' : 'Refund'}
        </Text>
      </RefundButton>
    </RefundableSwapCard>
  )
}

export function RefundableSwapsSection({
  refundableSwaps,
  evmRefundableSwaps,
  evmLockedSwaps,
  allSwaps,
  isLoading,
  onRefetch,
}: RefundableSwapsSectionProps): JSX.Element | null {
  const dispatch = useDispatch()
  const { executeRefund } = useEvmRefund()
  const [refundingSwaps, setRefundingSwaps] = useState<Set<string>>(new Set())
  const [refundingEvmSwaps, setRefundingEvmSwaps] = useState<Set<string>>(new Set())
  const [destinationAddresses, setDestinationAddresses] = useState<Record<string, string>>({})

  const handleAddressChange = useCallback((swapId: string, address: string) => {
    setDestinationAddresses((prev) => ({ ...prev, [swapId]: address }))
  }, [])

  const handleRefund = useCallback(
    async (swapId: string) => {
      const destinationAddress = destinationAddresses[swapId]

      if (!destinationAddress.trim()) {
        logger.warn('RefundableSwapsSection', 'handleRefund', 'Destination address is required')
        return
      }

      setRefundingSwaps((prev) => new Set(prev).add(swapId))
      try {
        dispatch(refundSwap(swapId, destinationAddress))
        await onRefetch()
      } catch (error) {
        logger.error(error, { tags: { file: 'RefundableSwapsSection', function: 'handleRefund' } })
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

  const handleEvmRefund = useCallback(
    async (lockup: EvmRefundableLockup) => {
      setRefundingEvmSwaps((prev) => new Set(prev).add(lockup.preimageHash))
      try {
        const txHash = await executeRefund(lockup)
        logger.info('RefundableSwapsSection', 'handleEvmRefund', `Refund successful: ${txHash}`)
        await onRefetch()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)

        // Check for specific error messages
        if (errorMessage.includes('swap has not timed out yet')) {
          logger.warn(
            'RefundableSwapsSection',
            'handleEvmRefund',
            'Swap has not timed out yet. Please wait a bit longer.',
          )
        } else if (errorMessage.includes('user rejected')) {
          logger.warn('RefundableSwapsSection', 'handleEvmRefund', 'Transaction rejected by user')
        } else {
          logger.error(error, { tags: { file: 'RefundableSwapsSection', function: 'handleEvmRefund' } })
        }
      } finally {
        setRefundingEvmSwaps((prev) => {
          const next = new Set(prev)
          next.delete(lockup.preimageHash)
          return next
        })
      }
    },
    [executeRefund, onRefetch],
  )

  if (isLoading || (refundableSwaps.length === 0 && evmRefundableSwaps.length === 0 && evmLockedSwaps.length === 0)) {
    return null
  }

  const totalRefundable = refundableSwaps.length + evmRefundableSwaps.length

  return (
    <>
      {(refundableSwaps.length > 0 || evmRefundableSwaps.length > 0) && (
        <RefundableSection>
          <Flex flexDirection="row" alignItems="center" gap="$spacing8">
            <AlertTriangleFilled size="$icon.20" color="$DEP_accentWarning" />
            <Text variant="heading3" color="$neutral1" fontWeight="600">
              Swaps Available for Refund ({totalRefundable})
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
            {evmRefundableSwaps.map((lockup) => (
              <EvmRefundableSwapCardItem
                key={lockup.preimageHash}
                lockup={lockup}
                allSwaps={allSwaps}
                isRefunding={refundingEvmSwaps.has(lockup.preimageHash)}
                onRefund={() => handleEvmRefund(lockup)}
              />
            ))}
          </Flex>
        </RefundableSection>
      )}

      {evmLockedSwaps.length > 0 && (
        <RefundableSection>
          <Flex flexDirection="row" alignItems="center" gap="$spacing8">
            <AlertCircleFilled size="$icon.20" color="$neutral2" />
            <Text variant="heading3" color="$neutral1" fontWeight="600">
              Locked Swaps - Timelock Not Reached ({evmLockedSwaps.length})
            </Text>
          </Flex>
          <Text variant="body3" color="$neutral2">
            These swaps haven&apos;t reached their timelock yet. You&apos;ll be able to refund them once the timelock
            expires.
          </Text>
          <Flex gap="$spacing12">
            {evmLockedSwaps.map((lockup) => (
              <EvmRefundableSwapCardItem
                key={lockup.preimageHash}
                lockup={lockup}
                allSwaps={allSwaps}
                isRefunding={false}
                onRefund={() => {}}
              />
            ))}
          </Flex>
        </RefundableSection>
      )}
    </>
  )
}
