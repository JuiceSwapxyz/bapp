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
  return match?.balance !== undefined ? match.balance * 1e8 : undefined
}

export function getBoltzBalanceForSide(items: BoltzBalanceItem[], side: BridgeSide): number | undefined {
  const { chainId, symbol } = side
  if (chainId === UniverseChainId.Bitcoin && (symbol === 'BTC' || symbol === 'btc')) {
    return findBalance(items, 'bitcoin', 'BTC')
  }
  if (chainId === UniverseChainId.LightningNetwork && (symbol === 'lnBTC' || symbol === 'BTC')) {
    return findBalance(items, 'lightning', 'BTC')
  }
  if (isCitreaChainId(chainId) && (symbol === 'cBTC' || symbol === 'WBTCe')) {
    return symbol === 'cBTC' ? findBalance(items, 'citrea', 'cBTC') : findBalance(items, 'citrea', 'WBTCe')
  }
  if (chainId === UniverseChainId.Mainnet) {
    if (symbol === 'WBTC') return findBalance(items, 'ethereum', 'WBTC')
    if (symbol === 'USDT') return findBalance(items, 'ethereum', 'USDT')
    if (symbol === 'USDC') return findBalance(items, 'ethereum', 'USDC')
  }
  if (chainId === UniverseChainId.Polygon && symbol === 'USDT') {
    return findBalance(items, 'polygon', 'USDT')
  }
  if (isCitreaChainId(chainId) && symbol === 'JUSD') {
    return findBalance(items, 'citrea', 'JUSD')
  }
  return undefined
}

export function getBoltzAvailableBalance(
  items: BoltzBalanceItem[],
  currencyIn: BridgeSide,
  _currencyOut: BridgeSide,
): number | undefined {
  return getBoltzBalanceForSide(items, currencyIn)
}
