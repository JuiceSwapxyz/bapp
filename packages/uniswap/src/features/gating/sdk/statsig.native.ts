import { StatsigClient } from '@statsig/react-bindings'
import { LocalOverrideAdapterWrapper } from 'uniswap/src/features/gating/LocalOverrideAdapterWrapper'

export {
  StatsigClient,
  StatsigOptions,
  StatsigUser,
  StorageProvider,
  TypedReturn,
} from '@statsig/react-native-bindings'

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
} from '@statsig/react-native-bindings'

let localOverrideAdapter: LocalOverrideAdapterWrapper | undefined

export const getOverrideAdapter = (): LocalOverrideAdapterWrapper => {
  if (!localOverrideAdapter) {
    localOverrideAdapter = new LocalOverrideAdapterWrapper('dummy-disabled-key')
  }
  return localOverrideAdapter
}

let statsigClient: StatsigClient | undefined
export const getStatsigClient = (): StatsigClient => {
  if (!statsigClient) {
    statsigClient = new StatsigClient(
      'dummy-disabled-key',
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
