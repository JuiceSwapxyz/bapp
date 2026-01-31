import useSelectChain from 'hooks/useSelectChain'
import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { Flex } from 'ui/src'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useIsSupportedChainIdCallback } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'

type ChainSelectorProps = {
  hideArrow?: boolean
}

export const ChainSelector = ({ hideArrow }: ChainSelectorProps) => {
  const { chainId, setSelectedChainId } = useMultichainContext()

  const isSupportedChain = useIsSupportedChainIdCallback()
  const selectChain = useSelectChain()
  const [searchParams, setSearchParams] = useSearchParams()

  const { chains, defaultChainId } = useEnabledChains({ platform: Platform.EVM })

  // Use defaultChainId as fallback when chainId is undefined or not supported
  // This ensures Citrea Mainnet is always shown as the default, even when wallet is connected to an unsupported chain
  const effectiveChainId = chainId && isSupportedChain(chainId) ? chainId : defaultChainId

  const onSelectChain = useCallback(
    async (targetChainId: UniverseChainId | null) => {
      if (!targetChainId) {
        setSelectedChainId(targetChainId)
      } else {
        await selectChain(targetChainId)
      }
      searchParams.delete('inputCurrency')
      searchParams.delete('outputCurrency')
      searchParams.delete('value')
      searchParams.delete('field')
      targetChainId && searchParams.set('chain', getChainInfo(targetChainId).interfaceName)
      setSearchParams(searchParams)
    },
    [setSelectedChainId, selectChain, searchParams, setSearchParams],
  )

  return (
    <Flex px="$spacing8">
      <NetworkFilter
        selectedChain={effectiveChainId}
        onPressChain={onSelectChain}
        hideArrow={hideArrow}
        chainIds={chains}
        styles={{
          sticky: true,
        }}
      />
    </Flex>
  )
}
