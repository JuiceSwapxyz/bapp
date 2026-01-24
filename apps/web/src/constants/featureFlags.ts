// Feature flags for enabling/disabling features
export const FeatureFlags = {
  // Enable/disable Citrea bApps Campaign integration
  // Set REACT_APP_CITREA_BAPPS_CAMPAIGN=false in .env to disable
  CITREA_BAPPS_CAMPAIGN: process.env.REACT_APP_CITREA_BAPPS_CAMPAIGN !== 'false', // Default to true unless explicitly disabled

  // Enable/disable First Squeezer NFT Campaign
  // Set REACT_APP_FIRST_SQUEEZER_CAMPAIGN=false in .env to disable
  FIRST_SQUEEZER_CAMPAIGN: process.env.REACT_APP_FIRST_SQUEEZER_CAMPAIGN !== 'false', // Default to true unless explicitly disabled

  // Enable/disable CEX transfer providers (Coinbase, etc.) in Receive crypto modal
  // Set REACT_APP_CEX_TRANSFER_ENABLED=true in .env to enable
  CEX_TRANSFER_ENABLED: process.env.REACT_APP_CEX_TRANSFER_ENABLED === 'true', // Default to false unless explicitly enabled

  // Enable/disable Cross-Chain Swaps (Bitcoin, Lightning, ERC20 bridges)
  // Set REACT_APP_CROSS_CHAIN_SWAPS=true in .env to enable
  // Or use ?cross-chain-swaps=true in URL to enable temporarily
  CROSS_CHAIN_SWAPS: process.env.REACT_APP_CROSS_CHAIN_SWAPS === 'true', // Default to false unless explicitly enabled
} as const
