import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'
import { useEvmRefund } from 'hooks/useEvmRefund'
import { AddressInput, RefundButton, RefundableSection, RefundableSwapCard } from 'pages/BridgeSwaps/styles'
import { formatSatoshiAmount } from 'pages/BridgeSwaps/utils'
import { useCallback, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { refundSwap } from 'state/sagas/transactions/bridgeRefundSaga'
import { Flex, Text } from 'ui/src'
import { AlertCircleFilled } from 'ui/src/components/icons/AlertCircleFilled'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useValidateBitcoinAddress } from 'uniswap/src/data/apiClients/tradingApi/useValidateBitcoinAddress'
import { getChainLabel, isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { EvmRefundableLockup } from 'uniswap/src/features/lds-bridge'
import { SomeSwap } from 'uniswap/src/features/lds-bridge/lds-types/storage'
import { prefix0x } from 'uniswap/src/features/lds-bridge/utils/hex'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { formatUnits } from 'viem'

interface RefundableSwapsSectionProps {
  refundableSwaps: (SomeSwap & { id: string })[]
  evmRefundableSwaps: EvmRefundableLockup[]
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

  const showError = !!address.trim() && isValid === false
  const showSuccess = !!address.trim() && isValid === true

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
  isRefundable: boolean // Whether this lockup is in the refundable category
}

const decimalsByAddress: Partial<Record<string, number>> = {
  '0x0987d3720d38847ac6dbb9d025b9de892a3ca35c': 18,
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 6,
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 6,
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 6,
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 8,
}

function EvmRefundableSwapCardItem({
  lockup,
  allSwaps,
  isRefunding,
  onRefund,
  isRefundable,
}: EvmRefundableSwapCardItemProps): JSX.Element {
  const numericChainId = Number(lockup.chainId)
  const tokenAddr = lockup.tokenAddress ? lockup.tokenAddress.toLowerCase() : undefined
  const hasErc20Token = !!tokenAddr && tokenAddr !== ZERO_ADDRESS && isUniverseChainId(numericChainId)
  const currencyInfo = useCurrencyInfo(hasErc20Token ? buildCurrencyId(numericChainId, tokenAddr) : undefined)
  const decimals = currencyInfo?.currency.decimals ?? decimalsByAddress[(lockup.tokenAddress || '').toLowerCase()] ?? 18
  const amount = formatUnits(BigInt(lockup.amount), decimals)

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
    const tokenAddress = lockup.tokenAddress.toLowerCase()
    if (tokenAddress === '0x0000000000000000000000000000000000000000') {
      return { symbol: 'cBTC', name: 'Native Token' }
    }
    // Common token mappings - can be extended
    const tokenMap: Record<string, { symbol: string; name: string }> = {
      '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', name: 'Tether USD' },
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', name: 'USD Coin' },
      '0x0987d3720d38847ac6dbb9d025b9de892a3ca35c': { symbol: 'JUSD', name: 'Juice Dollar' },
      '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { symbol: 'USDT', name: 'Tether USD' },
    }
    if (tokenAddress in tokenMap) {
      return tokenMap[tokenAddress]
    }
    return { symbol: 'ERC20', name: 'Token' }
  }

  const tokenInfo = getTokenInfo()
  const timelockBlock = lockup.timelock
  const chainName = isUniverseChainId(numericChainId) ? getChainLabel(numericChainId) : `Chain ${lockup.chainId}`

  return (
    <RefundableSwapCard highlighted>
      <Flex gap="$spacing8">
        <Flex flexDirection="row" alignItems="center" justifyContent="space-between">
          <Text variant="body3" color="$neutral1" fontWeight="600">
            {amount} {tokenInfo.symbol}
          </Text>
          <Flex
            backgroundColor={isRefundable ? '$statusSuccess' : '$surface3'}
            paddingHorizontal="$spacing6"
            paddingVertical="$spacing2"
            borderRadius="$rounded8"
          >
            <Text variant="body4" color={isRefundable ? '$white' : '$neutral2'} fontWeight="600" fontSize={11}>
              {isRefundable ? 'Refundable' : 'Locked'}
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
              Timelock Block:
            </Text>
            <Text variant="body4" color="$neutral1" fontSize={12}>
              {timelockBlock}
            </Text>
          </Flex>
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

      <RefundButton onPress={onRefund} disabled={isRefunding || !isRefundable}>
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
    async (swap: SomeSwap & { id: string }) => {
      const destinationAddress = destinationAddresses[swap.id]

      if (!destinationAddress.trim()) {
        logger.warn('RefundableSwapsSection', 'handleRefund', 'Destination address is required')
        return
      }

      setRefundingSwaps((prev) => new Set(prev).add(swap.id))
      try {
        dispatch(refundSwap(swap, destinationAddress))
        await onRefetch()
      } catch (error) {
        logger.error(error, { tags: { file: 'RefundableSwapsSection', function: 'handleRefund' } })
      } finally {
        setRefundingSwaps((prev) => {
          const next = new Set(prev)
          next.delete(swap.id)
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

        // Show success popup with explorer link
        const decimals = decimalsByAddress[(lockup.tokenAddress || '').toLowerCase()] ?? 18
        const amount = formatUnits(BigInt(lockup.amount), decimals)

        // Get token info for display
        const localSwap = allSwaps.find((swap) => prefix0x(swap.preimageHash) === prefix0x(lockup.preimageHash))
        let tokenSymbol = 'cBTC'
        if (localSwap) {
          tokenSymbol = localSwap.assetSend
        } else if (lockup.tokenAddress && lockup.tokenAddress !== '0x0000000000000000000000000000000000000000') {
          const tokenAddr = lockup.tokenAddress.toLowerCase()
          const tokenMap: Record<string, string> = {
            '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT',
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
            '0x0987d3720d38847ac6dbb9d025b9de892a3ca35c': 'JUSD',
            '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 'USDT',
          }
          tokenSymbol = tokenMap[tokenAddr] || 'ERC20'
        }

        popupRegistry.addPopup(
          {
            type: PopupType.EvmRefundSuccess,
            chainId: Number(lockup.chainId),
            txHash,
            amount,
            tokenSymbol,
          },
          `evm-refund-success-${txHash}`,
          DEFAULT_TXN_DISMISS_MS,
        )
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
        await onRefetch()
      }
    },
    [executeRefund, onRefetch, allSwaps],
  )

  if (isLoading || (refundableSwaps.length === 0 && evmRefundableSwaps.length === 0)) {
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
                onRefund={() => handleRefund(swap)}
              />
            ))}
            {evmRefundableSwaps.map((lockup) => (
              <EvmRefundableSwapCardItem
                key={lockup.preimageHash}
                lockup={lockup}
                allSwaps={allSwaps}
                isRefunding={refundingEvmSwaps.has(lockup.preimageHash)}
                onRefund={() => handleEvmRefund(lockup)}
                isRefundable={true}
              />
            ))}
          </Flex>
        </RefundableSection>
      )}
    </>
  )
}
