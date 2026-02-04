import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { BoltzBalanceItem } from '../lds-types/api'

export interface BridgeSide {
  chainId: number
  symbol: string
}

const CITREA_CHAIN_IDS = [UniverseChainId.CitreaMainnet, UniverseChainId.CitreaTestnet]

function isCitreaChainId(chainId: number): boolean {
  return CITREA_CHAIN_IDS.includes(chainId as UniverseChainId)
}

function findBalance(
  items: BoltzBalanceItem[],
  blockchain: string,
  asset: string,
  direction?: 'incoming' | 'outgoing',
): number | undefined {
  const match = items.find(
    (i) =>
      i.blockchain === blockchain &&
      i.asset === asset &&
      (direction === undefined ? i.direction === undefined : i.direction === direction),
  )
  return match?.balance
}

export function getBoltzAvailableBalance(
  items: BoltzBalanceItem[],
  currencyIn: BridgeSide,
  currencyOut: BridgeSide,
): number | undefined {
  const { chainId: chainIdIn, symbol: symbolIn } = currencyIn
  const { chainId: chainIdOut } = currencyOut

  if (chainIdIn === UniverseChainId.Bitcoin && (symbolIn === 'BTC' || symbolIn === 'btc')) {
    return findBalance(items, 'bitcoin', 'BTC')
  }

  if (chainIdIn === UniverseChainId.LightningNetwork && (symbolIn === 'lnBTC' || symbolIn === 'BTC')) {
    if (isCitreaChainId(chainIdOut)) {
      return findBalance(items, 'lightning', 'BTC', 'incoming')
    }
    return findBalance(items, 'lightning', 'BTC')
  }

  if (isCitreaChainId(chainIdIn) && (symbolIn === 'cBTC' || symbolIn === 'WBTCe')) {
    if (symbolIn === 'cBTC') {
      return findBalance(items, 'citrea', 'cBTC')
    }
    return findBalance(items, 'citrea', 'WBTCe')
  }

  if (chainIdIn === UniverseChainId.Mainnet) {
    if (symbolIn === 'WBTC') return findBalance(items, 'ethereum', 'WBTC')
    if (symbolIn === 'USDT') return findBalance(items, 'ethereum', 'USDT')
    if (symbolIn === 'USDC') return findBalance(items, 'ethereum', 'USDC')
  }

  if (chainIdIn === UniverseChainId.Polygon && symbolIn === 'USDT') {
    return findBalance(items, 'polygon', 'USDT')
  }

  if (isCitreaChainId(chainIdIn) && symbolIn === 'JUSD') {
    return findBalance(items, 'citrea', 'JUSD')
  }

  return undefined
}
