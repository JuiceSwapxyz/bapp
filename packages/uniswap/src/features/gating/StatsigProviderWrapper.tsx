import { ReactNode, useEffect, useMemo } from 'react'
import { config } from 'uniswap/src/config'
import {
  StatsigOptions,
  StatsigProvider,
  StatsigUser,
  StorageProvider,
  createDummyStatsigClient,
  isStatsigDisabled,
  useClientAsyncInit,
} from 'uniswap/src/features/gating/sdk/statsig'
import { statsigBaseConfig } from 'uniswap/src/features/gating/statsigBaseConfig'
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
  options,
  user,
  storageProvider,
  onInit,
}: StatsigProviderWrapperProps): ReactNode {
  // Check if Statsig is disabled (no API key or dummy key)
  const isDisabled = !config.statsigApiKey || isStatsigDisabled()

  // Create dummy client at top level to avoid conditional hook calls
  const dummyClient = useMemo(() => createDummyStatsigClient(), [])

  const statsigOptions: StatsigOptions = {
    ...statsigBaseConfig,
    storageProvider,
    ...options,
  }

  // Initialize real client (will only be used if not disabled)
  const { client: realClient, isLoading: isStatsigLoading } = useClientAsyncInit(
    config.statsigApiKey || 'dummy-disabled-key',
    user,
    statsigOptions,
  )

  // Select which client to use
  const client = isDisabled ? dummyClient : realClient

  // Handle dummy client initialization
  useEffect(() => {
    if (isDisabled) {
      logger.debug('StatsigProviderWrapper', 'init', 'Statsig is disabled - using dummy client')
      // Call onInit immediately since dummy client has no loading state
      onInit?.()
    }
  }, [isDisabled, onInit])

  // Handle real client initialization
  useEffect(() => {
    if (!isDisabled && !isStatsigLoading) {
      onInit?.()
    }
  }, [isDisabled, isStatsigLoading, onInit])

  // Handle real client errors
  useEffect(() => {
    if (isDisabled) {
      return
    }

    const errorHandler = (event: unknown): void => {
      logger.error('StatsigProviderWrapper', {
        tags: { file: 'StatsigProviderWrapper', function: 'error' },
        extra: {
          event,
        },
      })
    }
    realClient.on('error', errorHandler)
    realClient.on('initialization_failure', errorHandler)
    return () => {
      realClient.off('error', errorHandler)
      realClient.off('initialization_failure', errorHandler)
    }
  }, [isDisabled, realClient])

  return <StatsigProvider client={client}>{children}</StatsigProvider>
}
