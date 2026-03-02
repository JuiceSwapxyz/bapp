import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'
import { useEvmClaim } from 'hooks/useEvmClaim'
import { ClaimButton, ClaimableSection, ClaimableSwapCard } from 'pages/BridgeSwaps/styles'
import { formatAssetSymbol } from 'pages/BridgeSwaps/utils'
import { useCallback, useState } from 'react'
import { Flex, Text } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { getChainLabel, isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { EvmLockup } from 'uniswap/src/features/lds-bridge'
import { SomeSwap } from 'uniswap/src/features/lds-bridge/lds-types/storage'
import { prefix0x } from 'uniswap/src/features/lds-bridge/utils/hex'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { formatUnits } from 'viem'

interface ClaimableSwapsSectionProps {
  evmClaimableSwaps: EvmLockup[]
  allSwaps: (SomeSwap & { id: string })[]
  isLoading: boolean
  onRefetch: () => Promise<void>
}

interface EvmClaimableSwapCardItemProps {
  lockup: EvmLockup
  allSwaps: (SomeSwap & { id: string })[]
  isClaiming: boolean
  onClaim: () => void
}

const decimalsByAddress: Partial<Record<string, number>> = {
  '0x0987d3720d38847ac6dbb9d025b9de892a3ca35c': 18,
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 6,
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 6,
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 6,
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 8,
}

function EvmClaimableSwapCardItem({
  lockup,
  allSwaps,
  isClaiming,
  onClaim,
}: EvmClaimableSwapCardItemProps): JSX.Element {
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
      // Use the asset from local swap history (display symbol only, e.g. WBTC not WBTC_ETH)
      return { symbol: formatAssetSymbol(localSwap.assetReceive), name: formatAssetSymbol(localSwap.assetReceive) }
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
    <ClaimableSwapCard highlighted>
      <Flex gap="$spacing8">
        <Flex flexDirection="row" alignItems="center" justifyContent="space-between">
          <Text variant="body3" color="$neutral1" fontWeight="600">
            {amount} {tokenInfo.symbol}
          </Text>
          <Flex
            backgroundColor="$statusSuccess"
            paddingHorizontal="$spacing6"
            paddingVertical="$spacing2"
            borderRadius="$rounded8"
          >
            <Text variant="body4" color="$white" fontWeight="600" fontSize={11}>
              Claimable
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

      <ClaimButton onPress={onClaim} disabled={isClaiming}>
        <Text variant="buttonLabel4" color="$neutral1" fontSize={13}>
          {isClaiming ? 'Claiming...' : 'Claim'}
        </Text>
      </ClaimButton>
    </ClaimableSwapCard>
  )
}

export function ClaimableSwapsSection({
  evmClaimableSwaps,
  allSwaps,
  isLoading,
  onRefetch,
}: ClaimableSwapsSectionProps): JSX.Element | null {
  const { executeClaim } = useEvmClaim()
  const [claimingEvmSwaps, setClaimingEvmSwaps] = useState<Set<string>>(new Set())

  const handleEvmClaim = useCallback(
    async (lockup: EvmLockup) => {
      setClaimingEvmSwaps((prev) => new Set(prev).add(lockup.preimageHash))
      try {
        const txHash = await executeClaim(lockup)
        logger.info('ClaimableSwapsSection', 'handleEvmClaim', `Claim successful: ${txHash}`)

        // Show success popup with explorer link
        const decimals = decimalsByAddress[(lockup.tokenAddress || '').toLowerCase()] ?? 18
        const amount = formatUnits(BigInt(lockup.amount), decimals)

        // Get token info for display
        const localSwap = allSwaps.find((swap) => prefix0x(swap.preimageHash) === prefix0x(lockup.preimageHash))
        let tokenSymbol = 'cBTC'
        if (localSwap) {
          tokenSymbol = formatAssetSymbol(localSwap.assetReceive)
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
            type: PopupType.EvmClaimSuccess,
            chainId: Number(lockup.chainId),
            txHash,
            amount,
            tokenSymbol,
          },
          `evm-claim-success-${txHash}`,
          DEFAULT_TXN_DISMISS_MS,
        )

        await onRefetch()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)

        // Check for specific error messages
        if (errorMessage.includes('user rejected')) {
          logger.warn('ClaimableSwapsSection', 'handleEvmClaim', 'Transaction rejected by user')
        } else {
          logger.error(error, { tags: { file: 'ClaimableSwapsSection', function: 'handleEvmClaim' } })
        }
      } finally {
        setClaimingEvmSwaps((prev) => {
          const next = new Set(prev)
          next.delete(lockup.preimageHash)
          return next
        })
      }
    },
    [executeClaim, onRefetch, allSwaps],
  )

  if (isLoading || evmClaimableSwaps.length === 0) {
    return null
  }

  return (
    <>
      {evmClaimableSwaps.length > 0 && (
        <ClaimableSection>
          <Flex flexDirection="row" alignItems="center" gap="$spacing8">
            <CheckCircleFilled size="$icon.20" color="$statusSuccess" />
            <Text variant="heading3" color="$neutral1" fontWeight="600">
              Swaps Available for Claiming ({evmClaimableSwaps.length})
            </Text>
          </Flex>
          <Text variant="body3" color="$neutral2">
            These swaps are ready to be claimed. Click the Claim button to receive your funds.
          </Text>
          <Flex gap="$spacing12">
            {evmClaimableSwaps.map((lockup) => (
              <EvmClaimableSwapCardItem
                key={lockup.preimageHash}
                lockup={lockup}
                allSwaps={allSwaps}
                isClaiming={claimingEvmSwaps.has(lockup.preimageHash)}
                onClaim={() => handleEvmClaim(lockup)}
              />
            ))}
          </Flex>
        </ClaimableSection>
      )}
    </>
  )
}
