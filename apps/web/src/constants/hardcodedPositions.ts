import { V3PositionInfo } from 'components/Liquidity/types'

// Note: All testnet-only positions (TFC, cUSD, NUSD, USDC pools) have been removed

export function getHardcodedPositionsForWallet(_walletAddress: string | undefined): V3PositionInfo[] {
  return []
}
