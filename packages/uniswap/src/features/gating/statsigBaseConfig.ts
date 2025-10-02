import { getStatsigEnvName } from 'uniswap/src/features/gating/getStatsigEnvName'
import { StatsigOptions, getOverrideAdapter } from 'uniswap/src/features/gating/sdk/statsig'

export const statsigBaseConfig: StatsigOptions = {
  // Statsig feature flags disabled - using local overrides only
  networkConfig: { api: '' }, // Disabled: uniswapUrls.statsigProxyUrl
  environment: {
    tier: getStatsigEnvName(),
  },
  overrideAdapter: getOverrideAdapter(),
}
