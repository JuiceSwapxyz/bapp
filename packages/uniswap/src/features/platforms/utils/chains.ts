import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId, UniverseChainIdByPlatform } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'

export function chainIdToPlatform(chainId: UniverseChainId): Platform {
  return getChainInfo(chainId).platform
}

function createPlatformChecker<T extends Platform>(platform: T) {
  return (chainId: UniverseChainId): chainId is UniverseChainIdByPlatform<T> => {
    return getChainInfo(chainId).platform === platform
  }
}

export const isEVMChain = createPlatformChecker(Platform.EVM)
