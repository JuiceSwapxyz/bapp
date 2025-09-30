import { StatsigClient } from '@statsig/react-bindings'
import { LocalOverrideAdapterWrapper } from 'uniswap/src/features/gating/LocalOverrideAdapterWrapper'

export { StatsigClient, StatsigOptions, StatsigUser, StorageProvider, TypedReturn } from '@statsig/react-bindings'

export {
  StatsigContext,
  StatsigProvider,
  Storage,
  useClientAsyncInit,
  useDynamicConfig,
  useExperiment,
  useFeatureGate,
  useGateValue,
  useLayer,
  useStatsigClient,
  useStatsigUser,
} from '@statsig/react-bindings'

// Use statsigApiKey from environment variables directly to avoid node dependency errors in cloudflare deploys
// Which happens when importing uniswap/src/config in this file
// A dummy key is used in test env b/c the wallet/mobile tests use this file instead of the statsig.native file
// TODO: Re-enable Statsig once properly configured
const statsigApiKey: string =
  process.env.NODE_ENV === 'test'
    ? 'dummy-test-key'
    : process.env.REACT_APP_STATSIG_API_KEY ?? process.env.STATSIG_API_KEY ?? 'dummy-disabled-key'

// if (!statsigApiKey) {
//   throw new Error('STATSIG_API_KEY is not set')
// }

let localOverrideAdapter: LocalOverrideAdapterWrapper | undefined

export const getOverrideAdapter = (): LocalOverrideAdapterWrapper => {
  if (!localOverrideAdapter) {
    localOverrideAdapter = new LocalOverrideAdapterWrapper(statsigApiKey)
  }
  return localOverrideAdapter
}
export const getStatsigClient = (): StatsigClient => StatsigClient.instance(statsigApiKey)

/**
 * Creates a dummy Statsig client that doesn't make network requests.
 * Used when Statsig is disabled (API key is dummy or missing).
 * All feature flags return false, all configs return default values.
 */
export function createDummyStatsigClient(): StatsigClient {
  const dummyClient = StatsigClient.instance('dummy-disabled-key')

  // Override methods to prevent network requests and return safe defaults
  const originalCheckGate = dummyClient.checkGate.bind(dummyClient)
  dummyClient.checkGate = function() {
    return false
  }

  const originalGetExperiment = dummyClient.getExperiment.bind(dummyClient)
  dummyClient.getExperiment = function(experimentName: string) {
    return {
      get: (_key: string, defaultValue: any) => defaultValue,
      getValue: (_key: string, defaultValue: any) => defaultValue,
      getGroupName: () => null,
      getRuleID: () => '',
      getEvaluationDetails: () => ({ reason: 'Disabled' }),
    } as any
  }

  const originalGetDynamicConfig = dummyClient.getDynamicConfig.bind(dummyClient)
  dummyClient.getDynamicConfig = function(configName: string) {
    return {
      get: (_key: string, defaultValue: any) => defaultValue,
      getValue: (_key: string, defaultValue: any) => defaultValue,
      getRuleID: () => '',
      getEvaluationDetails: () => ({ reason: 'Disabled' }),
    } as any
  }

  const originalGetLayer = dummyClient.getLayer.bind(dummyClient)
  dummyClient.getLayer = function(layerName: string) {
    return {
      get: (_key: string, defaultValue: any) => defaultValue,
      getValue: (_key: string, defaultValue: any) => defaultValue,
      getRuleID: () => '',
      getEvaluationDetails: () => ({ reason: 'Disabled' }),
    } as any
  }

  return dummyClient
}

/**
 * Check if Statsig is disabled based on the API key.
 */
export function isStatsigDisabled(): boolean {
  return !statsigApiKey ||
         statsigApiKey === 'dummy-disabled-key' ||
         statsigApiKey === 'dummy-test-key' ||
         statsigApiKey.includes('dummy')
}
