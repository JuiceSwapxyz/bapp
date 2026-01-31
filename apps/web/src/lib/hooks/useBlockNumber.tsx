/* eslint-disable import/no-unused-modules */
// TODO(WEB-4448): for multichain, refactored our custom useBlockNumber in favor of wagmi's hook. Remove this provider
import { RPC_PROVIDERS } from 'constants/providers'
import { useAccount } from 'hooks/useAccount'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { atom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ALL_EVM_CHAIN_IDS } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useBlockNumber as useWagmiBlockNumber } from 'wagmi'

// MulticallUpdater is outside of the SwapAndLimitContext but we still want to use the swap context chainId for swap-related multicalls
export const multicallUpdaterSwapChainIdAtom = atom<UniverseChainId | undefined>(undefined)

const MISSING_PROVIDER = Symbol()

export const BlockNumberContext = createContext<
  | {
      fastForward(block: number): void
      block?: number
      mainnetBlock?: number
    }
  | typeof MISSING_PROVIDER
>(MISSING_PROVIDER)
function useBlockNumberContext() {
  const blockNumber = useContext(BlockNumberContext)
  if (blockNumber === MISSING_PROVIDER) {
    throw new Error('BlockNumber hooks must be wrapped in a <BlockNumberProvider>')
  }
  return blockNumber
}
export function useFastForwardBlockNumber(): (block: number) => void {
  return useBlockNumberContext().fastForward
}
/** Requires that BlockUpdater be installed in the DOM tree. */
export default function useBlockNumber(): number | undefined {
  return useBlockNumberContext().block
}
export function useMainnetBlockNumber(): number | undefined {
  return useBlockNumberContext().mainnetBlock
}
export function BlockNumberProvider({ children }: PropsWithChildren) {
  const account = useAccount()
  const multicallUpdaterSwapChainId = useAtomValue(multicallUpdaterSwapChainIdAtom)
  const multicallChainId = multicallUpdaterSwapChainId ?? account.chainId
  const [{ chainId, block, mainnetBlock }, setChainBlock] = useState<{
    chainId?: number
    block?: number
    mainnetBlock?: number
  }>({})
  const activeBlock = chainId === multicallChainId ? block : undefined
  const onChainBlock = useCallback((chainId: number | undefined, block: number) => {
    setChainBlock((chainBlock) => {
      if (chainBlock.chainId === chainId) {
        if (!chainBlock.block || chainBlock.block < block) {
          const mainnetBlock = chainId === UniverseChainId.Mainnet ? block : chainBlock.mainnetBlock
          return { chainId, block, mainnetBlock }
        }
      } else if (chainId === UniverseChainId.Mainnet) {
        if (!chainBlock.mainnetBlock || chainBlock.mainnetBlock < block) {
          return { ...chainBlock, mainnetBlock: block }
        }
      }
      return chainBlock
    })
  }, [])
  // Use wagmi's useBlockNumber which properly polls via viem's transport
  // Only use wagmi for EVM chains - non-EVM chains (like Lightning Network) are not supported
  const windowVisible = useIsWindowVisible()
  const isEvmChain = multicallChainId !== undefined && ALL_EVM_CHAIN_IDS.includes(multicallChainId)
  const { data: wagmiBlockNumber } = useWagmiBlockNumber({
    chainId: isEvmChain ? (multicallChainId as number) : undefined,
    watch: windowVisible,
  })
  // Update state when wagmi's block number changes
  useEffect(() => {
    if (wagmiBlockNumber && multicallChainId) {
      // Reset chainId tracking when chain changes
      setChainBlock((chainBlock) => {
        if (chainBlock.chainId !== multicallChainId) {
          return { chainId: multicallChainId, mainnetBlock: chainBlock.mainnetBlock }
        }
        return chainBlock
      })
      onChainBlock(multicallChainId, Number(wagmiBlockNumber))
    }
  }, [wagmiBlockNumber, multicallChainId, onChainBlock])
  // Poll once for the mainnet block number using the network provider.
  useEffect(() => {
    RPC_PROVIDERS[UniverseChainId.Mainnet]
      .getBlockNumber()
      .then((block) => onChainBlock(UniverseChainId.Mainnet, block))
      // swallow errors - it's ok if this fails, as we'll try again if we activate mainnet
      .catch(() => undefined)
  }, [onChainBlock])
  const value = useMemo(
    () => ({
      fastForward: (update: number) => {
        if (multicallChainId) {
          onChainBlock(multicallChainId, update)
        }
      },
      block: activeBlock,
      mainnetBlock,
    }),
    [activeBlock, mainnetBlock, multicallChainId, onChainBlock],
  )
  return <BlockNumberContext.Provider value={value}>{children}</BlockNumberContext.Provider>
}
