import { CurrencyAmount } from '@juiceswapxyz/sdk-core'
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { FeeData } from 'components/Liquidity/Create/types'
import { V3PositionInfo } from 'components/Liquidity/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { WCBTC, TFC, cUSD, NUSD, USDC } from './hardcodedPools'

const feeTierData: FeeData = {
  isDynamic: false,
  feeAmount: 3000,
  tickSpacing: 60,
}

// Hardcoded Citrea positions for wallet address that owns the NFTs
const HARDCODED_CITREA_POSITIONS: Record<string, V3PositionInfo[]> = {
  // Wallet address that owns the NFT positions - normalized to lowercase
  '0xc89e49490020fc4e8ee681553a2354234fc3f1d4': [
    {
      // NFT Token ID 1 - Pool address 0x21180B20134C8913bfA6dc866e43A114c026169e
      poolId: '0x21180B20134C8913bfA6dc866e43A114c026169e',
      tokenId: '1', // NFT token ID from the Position Manager
      chainId: UniverseChainId.CitreaTestnet,
      status: PositionStatus.IN_RANGE,
      version: ProtocolVersion.V3,
      feeTier: feeTierData,
      currency0Amount: CurrencyAmount.fromRawAmount(WCBTC, '500000000000000000'), // 0.5 WCBTC
      currency1Amount: CurrencyAmount.fromRawAmount(TFC, '15000000000000000000000'), // 15000 TFC
      liquidityAmount: CurrencyAmount.fromRawAmount(TFC, '1000000000000000000000000'), // liquidity amount
      apr: 25.5,
      v4hook: undefined,
      isHidden: false,
      owner: '0xc89E49490020fc4e8eE681553A2354234Fc3F1D4',
    } as V3PositionInfo,
    {
      // NFT Token ID 2 - Pool address 0xA69De906B9A830Deb64edB97B2eb0848139306d2
      poolId: '0xA69De906B9A830Deb64edB97B2eb0848139306d2',
      tokenId: '2', // NFT token ID from the Position Manager
      chainId: UniverseChainId.CitreaTestnet,
      status: PositionStatus.IN_RANGE,
      version: ProtocolVersion.V3,
      feeTier: feeTierData,
      currency0Amount: CurrencyAmount.fromRawAmount(WCBTC, '750000000000000000'), // 0.75 WCBTC
      currency1Amount: CurrencyAmount.fromRawAmount(cUSD, '22500000000000000000000'), // 22500 cUSD
      liquidityAmount: CurrencyAmount.fromRawAmount(cUSD, '1500000000000000000000000'), // liquidity amount
      apr: 28.3,
      v4hook: undefined,
      isHidden: false,
      owner: '0xc89E49490020fc4e8eE681553A2354234Fc3F1D4',
    } as V3PositionInfo,
    {
      // NFT Token ID 3 - Pool address 0xD8C7604176475eB8D350bC1EE452dA4442637C09
      poolId: '0xD8C7604176475eB8D350bC1EE452dA4442637C09',
      tokenId: '3', // NFT token ID from the Position Manager
      chainId: UniverseChainId.CitreaTestnet,
      status: PositionStatus.IN_RANGE,
      version: ProtocolVersion.V3,
      feeTier: feeTierData,
      currency0Amount: CurrencyAmount.fromRawAmount(WCBTC, '1000000000000000000'), // 1 WCBTC
      currency1Amount: CurrencyAmount.fromRawAmount(USDC, '30000000000'), // 30000 USDC (6 decimals)
      liquidityAmount: CurrencyAmount.fromRawAmount(USDC, '2000000000000'), // liquidity amount
      apr: 32.7,
      v4hook: undefined,
      isHidden: false,
      owner: '0xc89E49490020fc4e8eE681553A2354234Fc3F1D4',
    } as V3PositionInfo,
    {
      // NFT Token ID 4 - Pool address 0x6006797369E2A595D31Df4ab3691044038AAa7FE
      poolId: '0x6006797369E2A595D31Df4ab3691044038AAa7FE',
      tokenId: '4', // NFT token ID from the Position Manager
      chainId: UniverseChainId.CitreaTestnet,
      status: PositionStatus.IN_RANGE,
      version: ProtocolVersion.V3,
      feeTier: feeTierData,
      currency0Amount: CurrencyAmount.fromRawAmount(WCBTC, '600000000000000000'), // 0.6 WCBTC
      currency1Amount: CurrencyAmount.fromRawAmount(NUSD, '18000000000000000000000'), // 18000 NUSD
      liquidityAmount: CurrencyAmount.fromRawAmount(NUSD, '1200000000000000000000000'), // liquidity amount
      apr: 26.8,
      v4hook: undefined,
      isHidden: false,
      owner: '0xc89E49490020fc4e8eE681553A2354234Fc3F1D4',
    } as V3PositionInfo,
  ],
}

export function getHardcodedPositionsForWallet(walletAddress: string | undefined): V3PositionInfo[] {
  if (!walletAddress) {
    return []
  }

  // Normalize address to lowercase for comparison
  const normalizedAddress = walletAddress.toLowerCase()
  return HARDCODED_CITREA_POSITIONS[normalizedAddress] || []
}
