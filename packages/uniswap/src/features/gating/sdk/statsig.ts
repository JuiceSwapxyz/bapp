import { StatsigClient } from '@statsig/react-bindings'
import { LocalOverrideAdapterWrapper } from 'uniswap/src/features/gating/LocalOverrideAdapterWrapper'

export { StatsigClient, StatsigOptions, StatsigUser, StorageProvider, TypedReturn } from '@statsig/react-bindings'

export {
  StatsigContext,
  StatsigProvider,
  Storage,
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

let statsigClient: StatsigClient | undefined
export const getStatsigClient = (): StatsigClient => {
  if (!statsigClient) {
    statsigClient = new StatsigClient(
      statsigApiKey,
      {},
      {
        networkConfig: {
          networkOverrideFunc: async (_url: string, _args: unknown): Promise<Response> => {
            return new Response(null, { status: 200 })
          },
        },
      },
    )
  }
  return statsigClient
}

export const useClientAsyncInit = (): {
  isLoading: boolean
  client: StatsigClient
} => {
  return { isLoading: false, client: getStatsigClient() }
}
