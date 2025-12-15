/**
 * Launchpad constants - re-exported from @juiceswapxyz/launchpad package
 */

// Address configuration
export {
  ADDRESS as LAUNCHPAD_ADDRESSES,
  getAddresses as getLaunchpadAddresses,
  isChainSupported as isLaunchpadChainSupported,
  type LaunchpadAddresses,
} from '@juiceswapxyz/launchpad'

// ABIs
export { BondingCurveTokenABI as BONDING_CURVE_TOKEN_ABI } from '@juiceswapxyz/launchpad'
export { TokenFactoryABI as TOKEN_FACTORY_ABI } from '@juiceswapxyz/launchpad'

// Protocol constants
export {
  LAUNCHPAD_CONSTANTS as BONDING_CURVE_CONSTANTS,
  GRADUATION_ECONOMICS,
  DEAD_ADDRESS,
} from '@juiceswapxyz/launchpad'

/**
 * Default slippage for launchpad trades (1%)
 */
export const DEFAULT_LAUNCHPAD_SLIPPAGE_BPS = 100
