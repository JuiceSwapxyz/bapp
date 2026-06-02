/**
 * Launchpad constants - re-exported from @juiceswapxyz/launchpad package
 */
import {
  ADDRESS,
  BondingCurveTokenABI,
  DEAD_ADDRESS,
  GRADUATION_ECONOMICS,
  LAUNCHPAD_CONSTANTS,
  TokenFactoryABI,
  getAddresses,
  isChainSupported,
  type LaunchpadAddresses,
} from '@juiceswapxyz/launchpad'

export {
  LAUNCHPAD_CONSTANTS as BONDING_CURVE_CONSTANTS,
  DEAD_ADDRESS,
  GRADUATION_ECONOMICS,
  ADDRESS as LAUNCHPAD_ADDRESSES,
  getAddresses as getLaunchpadAddresses,
  isChainSupported as isLaunchpadChainSupported,
  type LaunchpadAddresses,
}

const TOKEN_FACTORY_DEV_BUY_ABI = [
  {
    type: 'function',
    name: 'createTokenWithDevBuyPermit',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'metadataURI', type: 'string' },
      { name: 'devBuyBaseIn', type: 'uint256' },
      { name: 'minTokensOut', type: 'uint256' },
      {
        name: 'permitSingle',
        type: 'tuple',
        components: [
          {
            name: 'details',
            type: 'tuple',
            components: [
              { name: 'token', type: 'address' },
              { name: 'amount', type: 'uint160' },
              { name: 'expiration', type: 'uint48' },
              { name: 'nonce', type: 'uint48' },
            ],
          },
          { name: 'spender', type: 'address' },
          { name: 'sigDeadline', type: 'uint256' },
        ],
      },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [
      { name: 'token', type: 'address' },
      { name: 'tokensOut', type: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'DevBuyExecuted',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'token', type: 'address' },
      { indexed: true, name: 'creator', type: 'address' },
      { indexed: false, name: 'baseIn', type: 'uint256' },
      { indexed: false, name: 'tokensOut', type: 'uint256' },
    ],
  },
] as const

const BONDING_CURVE_DEV_BUY_ABI = [
  {
    type: 'function',
    name: 'launchFinalized',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'devBuyExecuted',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'event',
    name: 'DevBuy',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'buyer', type: 'address' },
      { indexed: false, name: 'baseIn', type: 'uint256' },
      { indexed: false, name: 'tokensOut', type: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'LaunchFinalized',
    anonymous: false,
    inputs: [],
  },
] as const

// Keep the local app compatible while the package rollout propagates through all repos.
export const TOKEN_FACTORY_ABI = [...TokenFactoryABI, ...TOKEN_FACTORY_DEV_BUY_ABI] as const
export const BONDING_CURVE_TOKEN_ABI = [...BondingCurveTokenABI, ...BONDING_CURVE_DEV_BUY_ABI] as const

export type RuntimeLaunchpadAddresses = LaunchpadAddresses & {
  permit2?: `0x${string}`
  supportsDevBuy: boolean
}

function isAddress(value: string | undefined): value is `0x${string}` {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value))
}

function getFactoryOverride(chainId: number): `0x${string}` | undefined {
  if (chainId === 5115 && isAddress(process.env.REACT_APP_LAUNCHPAD_5115_FACTORY)) {
    return process.env.REACT_APP_LAUNCHPAD_5115_FACTORY
  }
  if (chainId === 4114 && isAddress(process.env.REACT_APP_LAUNCHPAD_4114_FACTORY)) {
    return process.env.REACT_APP_LAUNCHPAD_4114_FACTORY
  }
  return undefined
}

export function getRuntimeLaunchpadAddresses(chainId: number): RuntimeLaunchpadAddresses | undefined {
  const addresses = getAddresses(chainId)
  const factory = getFactoryOverride(chainId)

  if (!addresses) {
    return undefined
  }

  return { ...addresses, ...(factory ? { factory } : {}), supportsDevBuy: Boolean(factory) }
}

/**
 * Default slippage for launchpad trades (1%)
 */
export const DEFAULT_LAUNCHPAD_SLIPPAGE_BPS = 100

/**
 * Maximum dev buy (20% of bonding-curve supply)
 */
export const MAX_DEV_BUY_BPS = 2_000
