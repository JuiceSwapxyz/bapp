import { useQuery } from '@tanstack/react-query'
import { RPC_PROVIDERS } from 'constants/providers'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fetchBlockTipHeight } from 'uniswap/src/features/lds-bridge'

export function useChainTipBlockNumber(chainId: number, enabled: boolean) {
  const isBitcoinNetwork = chainId === UniverseChainId.Bitcoin
  return useQuery({
    queryKey: ['chain-tip-block-number', chainId],
    queryFn: async () => {
      if (isBitcoinNetwork) {
        return BigInt(await fetchBlockTipHeight())
      }
      const providerKey = chainId as keyof typeof RPC_PROVIDERS
      const provider = RPC_PROVIDERS[providerKey]
      const blockNumber = await provider.getBlockNumber()
      return BigInt(blockNumber)
    },
    enabled,
    refetchInterval: isBitcoinNetwork ? 60000 : 12000,
  })
}
