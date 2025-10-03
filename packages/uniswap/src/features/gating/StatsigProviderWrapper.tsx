import { ReactNode, useEffect } from 'react'
import {
  StatsigProvider,
  StatsigUser,
  StorageProvider,
  useClientAsyncInit,
} from 'uniswap/src/features/gating/sdk/statsig'
import { logger } from 'utilities/src/logger/logger'

type StatsigProviderWrapperProps = {
  user: StatsigUser
  children: ReactNode
  onInit?: () => void
  options?: Partial<StatsigUser>
  storageProvider?: StorageProvider
}

export function StatsigProviderWrapper({
  children,
  options: _options,
  user: _user,
  storageProvider: _storageProvider,
  onInit,
}: StatsigProviderWrapperProps): ReactNode {
  // Statsig disabled for JuiceSwap - no initialization required

  const { client, isLoading: isStatsigLoading } = useClientAsyncInit()

  useEffect(() => {
    if (isStatsigLoading) {
      return
    }

    onInit?.()
  }, [isStatsigLoading, onInit])

  useEffect(() => {
    const errorHandler = (event: unknown): void => {
      logger.error('StatsigProviderWrapper', {
        tags: { file: 'StatsigProviderWrapper', function: 'error' },
        extra: {
          event,
        },
      })
    }
    client.on('error', errorHandler)
    client.on('initialization_failure', errorHandler)
    return () => {
      client.off('error', errorHandler)
      client.off('initialization_failure', errorHandler)
    }
  }, [client])

  return <StatsigProvider client={client}>{children}</StatsigProvider>
}
