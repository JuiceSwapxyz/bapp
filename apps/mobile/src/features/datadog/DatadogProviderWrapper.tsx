import { DatadogProvider, DdRum } from '@datadog/mobile-react-native'
import { PropsWithChildren, default as React, useEffect, useState } from 'react'
import { DatadogContext } from 'src/features/datadog/DatadogContext'
import { config } from 'uniswap/src/config'
import { datadogEnabledBuild, isJestRun } from 'utilities/src/environment/constants'
import { logger } from 'utilities/src/logger/logger'

// In case Statsig is not available
export const MOBILE_DEFAULT_DATADOG_SESSION_SAMPLE_RATE = 10 // percent

// Configuration for Datadog's automatic monitoring features:
// - Error tracking: Captures and reports application errors
// - User interactions: Monitors user events and actions
// - Resource tracking: Traces network requests and API calls
// Note: Can buffer up to 100 RUM events before SDK initialization
// https://docs.datadoghq.com/real_user_monitoring/mobile_and_tv_monitoring/react_native/advanced_configuration/#delaying-the-initialization
const datadogAutoInstrumentation = {
  trackErrors: datadogEnabledBuild,
  trackInteractions: datadogEnabledBuild,
  trackResources: datadogEnabledBuild,
}

async function initializeDatadog(_sessionSamplingRate: number): Promise<void> {
  // Datadog disabled for JuiceSwap - no initialization
  return
}

/**
 * Wrapper component to provide Datadog to the app with our mobile app's
 * specific configuration.
 */
export function DatadogProviderWrapper({
  children,
  sessionSampleRate,
}: PropsWithChildren<{ sessionSampleRate: number | undefined }>): JSX.Element {
  const [isInitialized, setInitialized] = useState(false)

  useEffect(() => {
    if ((datadogEnabledBuild || config.isE2ETest) && sessionSampleRate !== undefined) {
      initializeDatadog(sessionSampleRate).catch(() => undefined)
    }
  }, [sessionSampleRate])

  if (isJestRun) {
    return <>{children}</>
  }
  logger.setDatadogEnabled(true)
  return (
    <DatadogContext.Provider value={{ isInitialized, setInitialized }}>
      <DatadogProvider
        configuration={datadogAutoInstrumentation}
        onInitialization={async () => {
          const sessionId = await DdRum.getCurrentSessionId()
          // we do not want to log anything if session is not sampled
          logger.setDatadogEnabled(sessionId !== undefined)
          setInitialized(true)
        }}
      >
        {children}
      </DatadogProvider>
    </DatadogContext.Provider>
  )
}
