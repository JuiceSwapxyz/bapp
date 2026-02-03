import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { extractBaseUrl } from 'utilities/src/format/urls'

export interface BridgePairDisplay {
  label: string
  fromSymbol: string
  fromChain: UniverseChainId
  fromAddress?: string
  toSymbol: string
  toChain: UniverseChainId
  toAddress?: string
  url: string
}

export const BRIDGE_PAIR_DISPLAYS: BridgePairDisplay[] = [
  {
    label: 'BTC ⇄ cBTC',
    fromSymbol: 'BTC',
    fromChain: UniverseChainId.Bitcoin,
    toSymbol: 'cBTC',
    toChain: UniverseChainId.CitreaMainnet,
    url: '/swap?inputCurrency=BTC&outputCurrency=cBTC',
  },
  {
    label: 'lnBTC ⇄ cBTC',
    fromSymbol: 'lnBTC',
    fromChain: UniverseChainId.LightningNetwork,
    toSymbol: 'cBTC',
    toChain: UniverseChainId.CitreaMainnet,
    url: '/swap?inputCurrency=lnBTC&outputCurrency=cBTC',
  },
  {
    label: 'cBTC ⇄ lnBTC',
    fromSymbol: 'cBTC',
    fromChain: UniverseChainId.CitreaMainnet,
    toSymbol: 'lnBTC',
    toChain: UniverseChainId.LightningNetwork,
    url: '/swap?inputCurrency=cBTC&outputCurrency=lnBTC',
  },
  {
    label: 'WBTC ⇄ cBTC',
    fromSymbol: 'WBTC',
    fromChain: UniverseChainId.Mainnet,
    fromAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    toSymbol: 'cBTC',
    toChain: UniverseChainId.CitreaMainnet,
    url: '/swap?chain=ethereum&inputCurrency=WBTC&outputCurrency=cBTC',
  },
  {
    label: 'USDT (Ethereum) ⇄ JUSD',
    fromSymbol: 'USDT',
    fromChain: UniverseChainId.Mainnet,
    fromAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    toSymbol: 'JUSD',
    toChain: UniverseChainId.CitreaMainnet,
    url: '/swap?chain=ethereum&inputCurrency=USDT&outputCurrency=JUSD&outputChain=citrea',
  },
  {
    label: 'USDT (Polygon) ⇄ JUSD',
    fromSymbol: 'USDT',
    fromChain: UniverseChainId.Polygon,
    fromAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    toSymbol: 'JUSD',
    toChain: UniverseChainId.CitreaMainnet,
    url: '/swap?chain=polygon&inputCurrency=USDT&outputCurrency=JUSD&outputChain=citrea',
  },
  {
    label: 'USDC ⇄ JUSD',
    fromSymbol: 'USDC',
    fromChain: UniverseChainId.Mainnet,
    fromAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    toSymbol: 'JUSD',
    toChain: UniverseChainId.CitreaMainnet,
    url: '/swap?chain=ethereum&inputCurrency=USDC&outputCurrency=JUSD&outputChain=citrea',
  },
  {
    label: 'cBTC ⇄ JUSD',
    fromSymbol: 'cBTC',
    fromChain: UniverseChainId.CitreaMainnet,
    toSymbol: 'JUSD',
    toChain: UniverseChainId.CitreaMainnet,
    url: '/swap?chain=citrea&inputCurrency=cBTC&outputCurrency=JUSD',
  },
  {
    label: 'cBTC ⇄ JUICE',
    fromSymbol: 'cBTC',
    fromChain: UniverseChainId.CitreaMainnet,
    toSymbol: 'JUICE',
    toChain: UniverseChainId.CitreaMainnet,
    url: '/swap?chain=citrea&inputCurrency=cBTC&outputCurrency=JUICE',
  },
]

/*
 * Common bridging dapp urls
 */
const ACROSS_DAPP_URL = 'https://app.across.to'
const BUNGEE_DAPP_URL = 'https://www.bungee.exchange'
const JUMPER_DAPP_URL = 'https://jumper.exchange'
const RANGO_DAPP_URL = 'https://app.rango.exchange'
const DEBRIDGE_DAPP_URL = 'https://app.debridge.finance'
const SUPERBRIDGE_DAPP_URL = 'https://superbridge.app'
const BRIDGG_DAPP_URL = 'https://www.brid.gg'
const STARGATE_DAPP_URL = 'https://stargate.finance'
const CCTP_DAPP_URL = 'https://www.cctp.io'
const ORBITER_DAPP_URL = 'https://www.orbiter.finance'
const SYNAPSE_DAPP_URL = 'https://synapseprotocol.com'
const POLYGON_DAPP_URL = 'https://portal.polygon.technology'
const ARBITRUM_DAPP_URL = 'https://bridge.arbitrum.io'
const ZKSYNC_DAPP_URL = 'https://portal.zksync.io'
const HOP_DAPP_URL = 'https://app.hop.exchange'
const ZKBRIDGE_DAPP_URL = 'https://www.zkbridge.com'
const ALLBRIDGE_DAPP_URL = 'https://core.allbridge.io'
const CROSSCURVE_DAPP_URL = 'https://app.crosscurve.fi'
const SQUID_DAPP_URL = 'https://app.squidrouter.com'
const RHINO_DAPP_URL = 'https://app.rhino.fi'
const ROUTERNITRO_DAPP_URL = 'https://app.routernitro.com'
const CONNEXT_DAPP_URL = 'https://bridge.connext.network'
const SATELLITE_DAPP_URL = 'https://satellite.money'
const OWLTO_DAPP_URL = 'https://owlto.finance'
const XY_DAPP_URL = 'https://app.xy.finance'
const CELER_DAPP_URL = 'https://cbridge.celer.network'
const PORTAL_DAPP_URL = 'https://portalbridge.com'

export const BRIDGING_DAPP_URLS = [
  ACROSS_DAPP_URL,
  BUNGEE_DAPP_URL,
  JUMPER_DAPP_URL,
  RANGO_DAPP_URL,
  DEBRIDGE_DAPP_URL,
  SUPERBRIDGE_DAPP_URL,
  BRIDGG_DAPP_URL,
  STARGATE_DAPP_URL,
  CCTP_DAPP_URL,
  ORBITER_DAPP_URL,
  SYNAPSE_DAPP_URL,
  POLYGON_DAPP_URL,
  ARBITRUM_DAPP_URL,
  ZKSYNC_DAPP_URL,
  HOP_DAPP_URL,
  ZKBRIDGE_DAPP_URL,
  ALLBRIDGE_DAPP_URL,
  CROSSCURVE_DAPP_URL,
  SQUID_DAPP_URL,
  RHINO_DAPP_URL,
  ROUTERNITRO_DAPP_URL,
  CONNEXT_DAPP_URL,
  SATELLITE_DAPP_URL,
  OWLTO_DAPP_URL,
  XY_DAPP_URL,
  CELER_DAPP_URL,
  PORTAL_DAPP_URL,
]

export function getCanonicalBridgingDappUrls(chainIds: UniverseChainId[]): string[] {
  const canonicalUrls = chainIds
    .map((chainId) => {
      const chainInfo = getChainInfo(chainId)
      return chainInfo.bridge ? extractBaseUrl(chainInfo.bridge) : undefined
    })
    .filter((url): url is string => url !== undefined)

  return [...new Set(canonicalUrls)] // Remove duplicates
}

/*
 * Combines both canonical and non-canonical bridging dapp urls
 */
export function getBridgingDappUrls(chainIds: UniverseChainId[]): string[] {
  const canonicalUrls = getCanonicalBridgingDappUrls(chainIds)
  const nonCanonicalUrls = BRIDGING_DAPP_URLS.filter((url) => !canonicalUrls.includes(url))
  return [...canonicalUrls, ...nonCanonicalUrls]
}
