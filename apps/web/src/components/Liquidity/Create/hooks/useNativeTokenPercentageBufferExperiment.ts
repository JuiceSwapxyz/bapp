import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Experiments, NativeTokenPercentageBufferProperties } from 'uniswap/src/features/gating/experiments'
import { useExperimentValue } from 'uniswap/src/features/gating/hooks'

// Chains where percentage-based buffer doesn't make sense (cheap gas, fixed costs)
const CHAINS_WITHOUT_PERCENTAGE_BUFFER: UniverseChainId[] = [UniverseChainId.CitreaTestnet]

export function useNativeTokenPercentageBufferExperiment(chainId?: UniverseChainId): number {
  const bufferSize = useExperimentValue({
    experiment: Experiments.NativeTokenPercentageBuffer,
    param: NativeTokenPercentageBufferProperties.BufferSize,
    defaultValue: 1,
  })

  // For chains with cheap gas, the fixed gas reserve in useMaxAmountSpend is sufficient
  if (chainId && CHAINS_WITHOUT_PERCENTAGE_BUFFER.includes(chainId)) {
    return 0
  }

  return bufferSize
}
