// Web-specific feature flags for enabling/disabling features.
// Named WebFeatureFlags to avoid collision with the Statsig-backed
// `FeatureFlags` enum exported from uniswap/src/features/gating/flags.
export const WebFeatureFlags = {
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
  // Set REACT_APP_CROSS_CHAIN_SWAPS=false in .env to disable
  // Or use ?cross-chain-swaps=false in URL to disable temporarily
  CROSS_CHAIN_SWAPS: process.env.REACT_APP_CROSS_CHAIN_SWAPS !== 'false', // Default to true unless explicitly disabled

  // Enable/disable Juice Points program (Points UI, Leaderboard route, header
  // points ticker). Default ON so users can collect and see their points.
  // Set REACT_APP_JUICE_POINTS_PROGRAM=false in .env to disable.
  // Re-enablement checklist (incl. public discovery surfaces): see issue #748
  JUICE_POINTS_PROGRAM: process.env.REACT_APP_JUICE_POINTS_PROGRAM !== 'false', // Default to true unless explicitly disabled

  // Enable/disable the NFT acquisition surfaces that ride on top of the points
  // program: the Juicer NFT page + nav tab, the Juicer/First Squeezer NFT
  // claim/mint sections, and NFT-as-profile-picture. Kept OFF so people only
  // collect points while the NFT stays hidden until it is manually unlocked.
  // Set REACT_APP_JUICE_POINTS_NFT=true in .env to reveal.
  JUICE_POINTS_NFT: process.env.REACT_APP_JUICE_POINTS_NFT === 'true', // Default to false unless explicitly enabled
} as const
