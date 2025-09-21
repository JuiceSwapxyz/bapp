// Feature flags for enabling/disabling features
export const FeatureFlags = {
  // Enable/disable Citrea bApps Campaign integration
  CITREA_BAPPS_CAMPAIGN: true,
} as const

export type FeatureFlagKey = keyof typeof FeatureFlags