import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { SharedQueryClient } from 'uniswap/src/data/apiClients/SharedQueryClient'
import { StatsigProviderWrapper } from 'uniswap/src/features/gating/StatsigProviderWrapper'
import { StatsigCustomAppValue } from 'uniswap/src/features/gating/constants'
import { StatsigUser } from 'uniswap/src/features/gating/sdk/statsig'
import { initializeDatadog } from 'uniswap/src/utils/datadog'
import { uniqueIdQuery } from 'utilities/src/device/uniqueIdQuery'

function makeStatsigUser(userID: string): StatsigUser {
  return {
    userID,
    appVersion: process.env.VERSION,
    custom: {
      app: StatsigCustomAppValue.Extension,
    },
  }
}

export function ExtensionStatsigProvider({
  children,
  appName,
}: {
  children: React.ReactNode
  appName: string
}): JSX.Element {
  const { data: uniqueId } = useQuery(uniqueIdQuery(), SharedQueryClient)
  const [initFinished, setInitFinished] = useState(false)
  const [user, setUser] = useState<StatsigUser>({
    userID: undefined,
    custom: {
      app: StatsigCustomAppValue.Extension,
    },
    appVersion: process.env.VERSION,
  })

  useEffect(() => {
    if (uniqueId && initFinished) {
      setUser(makeStatsigUser(uniqueId))
    }
  }, [uniqueId, initFinished])

  const onStatsigInit = (): void => {
    setInitFinished(true)
    initializeDatadog(appName).catch(() => undefined)
  }

  return (
    <StatsigProviderWrapper user={user} onInit={onStatsigInit}>
      {children}
    </StatsigProviderWrapper>
  )
}

export async function initStatSigForBrowserScripts(): Promise<void> {
  // Statsig disabled for JuiceSwap - no initialization
  return
}
