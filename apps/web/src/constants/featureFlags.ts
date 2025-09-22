// Feature flags for enabling/disabling features
export const FeatureFlags = {
  // Enable/disable Citrea bApps Campaign integration
  // Set REACT_APP_CITREA_BAPPS_CAMPAIGN=false in .env to disable
  CITREA_BAPPS_CAMPAIGN: process.env.REACT_APP_CITREA_BAPPS_CAMPAIGN !== 'false', // Default to true unless explicitly disabled
} as const
