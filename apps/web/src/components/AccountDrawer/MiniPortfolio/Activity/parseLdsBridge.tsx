import bitcoinLogo from 'assets/images/coins/bitcoin.png'
import { Activity, ActivityMap } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { inferChainIdFromSwap } from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
import { formatSatoshiAmount } from 'pages/BridgeSwaps/utils'
import { Flex, Text, styled } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { TransactionType } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SomeSwap } from 'uniswap/src/features/lds-bridge/lds-types/storage'
import { LdsSwapStatus, getSwapStatusCategory } from 'uniswap/src/features/lds-bridge/lds-types/websocket'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'

export const LDS_ACTIVITY_PREFIX = 'lds-'

// ============================================================================
// LDS Asset Metadata
// ============================================================================
// Maps LDS API asset names to chain and logo information.
// These asset names come from the LDS bridge API (e.g., 'USDT_POLYGON', 'JUSD_CITREA')
// and differ from standard token symbols.

interface LdsAssetMetadata {
  chainId: UniverseChainId
  logoUrl: string
  symbol: string // Clean display symbol (e.g., 'USDT' instead of 'USDT_POLYGON')
}

/**
 * Unified metadata for all LDS bridge assets.
 * Logo URLs are consistent with tokenRegistry.ts and TokenLogo.tsx.
 */
const LDS_ASSET_METADATA: Partial<Record<string, LdsAssetMetadata>> = {
  // Bitcoin variants
  cBTC: {
    chainId: UniverseChainId.CitreaMainnet,
    logoUrl: 'https://docs.juiceswap.com/media/icons/cbtc.png',
    symbol: 'cBTC',
  },
  BTC: {
    chainId: UniverseChainId.LightningNetwork,
    logoUrl: bitcoinLogo,
    symbol: 'BTC',
  },
  // Citrea tokens
  JUSD_CITREA: {
    chainId: UniverseChainId.CitreaMainnet,
    logoUrl: 'https://docs.juiceswap.com/media/icons/jusd.png',
    symbol: 'JUSD',
  },
  // Ethereum mainnet tokens
  USDT_ETH: {
    chainId: UniverseChainId.Mainnet,
    logoUrl: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
    symbol: 'USDT',
  },
  USDC_ETH: {
    chainId: UniverseChainId.Mainnet,
    logoUrl: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
    symbol: 'USDC',
  },
  // Polygon tokens
  USDT_POLYGON: {
    chainId: UniverseChainId.Polygon,
    logoUrl: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
    symbol: 'USDT',
  },
}

/**
 * Get the chain ID for an LDS asset.
 * Falls back to CitreaMainnet for unknown assets (safe default for Citrea-centric bridge).
 */
function getAssetChainId(asset: string): UniverseChainId {
  return LDS_ASSET_METADATA[asset]?.chainId ?? UniverseChainId.CitreaMainnet
}

/**
 * Determine the chain ID to use for activity filtering.
 * For bridge swaps, we want to show the activity if either the source
 * or destination is on an enabled chain. This function prefers Citrea
 * chains since they are the primary enabled chains.
 */
function getActivityChainId(swap: SomeSwap): UniverseChainId {
  // 1. Use persisted chainId if available
  if (swap.chainId) {
    return swap.chainId
  }

  // 2. Try to infer from contract address
  const inferredChainId = inferChainIdFromSwap(swap)
  if (inferredChainId) {
    return inferredChainId
  }

  // 3. Smart fallback: prefer Citrea chains for filtering purposes
  const sendChainId = getAssetChainId(swap.assetSend)
  const receiveChainId = getAssetChainId(swap.assetReceive)

  // Prefer Citrea chains (they're the enabled chains)
  if (receiveChainId === UniverseChainId.CitreaMainnet || receiveChainId === UniverseChainId.CitreaTestnet) {
    return receiveChainId
  }
  if (sendChainId === UniverseChainId.CitreaMainnet || sendChainId === UniverseChainId.CitreaTestnet) {
    return sendChainId
  }

  // Final fallback
  return receiveChainId
}

/**
 * Get the logo URL for an LDS asset.
 * Returns undefined for unknown assets (allows fallback rendering).
 */
function getAssetLogo(asset: string): string | undefined {
  return LDS_ASSET_METADATA[asset]?.logoUrl
}

/**
 * Get the clean display symbol for an LDS asset.
 * Falls back to the raw asset name if not found.
 */
function getAssetDisplaySymbol(asset: string): string {
  return LDS_ASSET_METADATA[asset]?.symbol ?? asset
}

// ============================================================================
// Bridge Descriptor Component
// ============================================================================

const StyledBridgeAmountText = styled(Text, {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  variant: 'body2',
})

/**
 * Creates a visual bridge descriptor with chain logos.
 * Shows: [SourceChainLogo] amount SYMBOL → [DestChainLogo] amount SYMBOL
 */
function getLdsBridgeDescriptor({
  sourceChain,
  destChain,
  sendAmount,
  receiveAmount,
  assetSend,
  assetReceive,
}: {
  sourceChain: UniverseChainId
  destChain: UniverseChainId
  sendAmount: string
  receiveAmount: string
  assetSend: string
  assetReceive: string
}): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$spacing4">
      <NetworkLogo chainId={sourceChain} size={iconSizes.icon16} borderRadius={6} />
      <StyledBridgeAmountText>
        {sendAmount}&nbsp;{getAssetDisplaySymbol(assetSend)}
      </StyledBridgeAmountText>
      <Arrow direction="e" color="$neutral3" size={iconSizes.icon16} />
      <NetworkLogo chainId={destChain} size={iconSizes.icon16} borderRadius={6} />
      <StyledBridgeAmountText>
        {receiveAmount}&nbsp;{getAssetDisplaySymbol(assetReceive)}
      </StyledBridgeAmountText>
    </Flex>
  )
}

/**
 * Convert LDS swap status to TransactionStatus for UI display.
 * Also considers claimTx as evidence of success - if claim transaction exists,
 * the swap is complete regardless of backend status (which may lag behind).
 */
function ldsStatusToTransactionStatus(status?: LdsSwapStatus, claimTx?: string): TransactionStatus {
  // If we have a claim transaction, the swap is successful regardless of backend status
  // This handles cases where the backend status hasn't updated to 'transaction.claimed' yet
  if (claimTx) {
    return TransactionStatus.Success
  }

  const category = getSwapStatusCategory(status)
  if (category === 'success') {
    return TransactionStatus.Success
  }
  if (category === 'failed') {
    return TransactionStatus.Failed
  }
  return TransactionStatus.Pending
}

export function swapToActivity(swap: SomeSwap & { id: string }): Activity {
  const status = ldsStatusToTransactionStatus(swap.status, swap.claimTx)

  // For filtering: use smart heuristic that prefers Citrea chains.
  // This ensures the activity passes chain filtering (must be Citrea-related).
  const activityChainId = getActivityChainId(swap)

  // For display: use actual asset chains to show correct source/dest logos
  const displaySourceChain = getAssetChainId(swap.assetSend)
  const displayDestChain = getAssetChainId(swap.assetReceive)

  const descriptor = getLdsBridgeDescriptor({
    sourceChain: displaySourceChain,
    destChain: displayDestChain,
    sendAmount: formatSatoshiAmount(swap.sendAmount),
    receiveAmount: formatSatoshiAmount(swap.receiveAmount),
    assetSend: swap.assetSend,
    assetReceive: swap.assetReceive,
  })

  const titleMap: Partial<Record<TransactionStatus, string>> = {
    [TransactionStatus.Pending]: 'Bridge pending',
    [TransactionStatus.Success]: 'Bridged',
    [TransactionStatus.Failed]: 'Bridge failed',
  }

  return {
    hash: `${LDS_ACTIVITY_PREFIX}${swap.id}`,
    chainId: activityChainId,
    outputChainId: displayDestChain,
    status,
    timestamp: swap.date / 1000,
    title: titleMap[status] || 'Bridge',
    descriptor,
    logos: [getAssetLogo(swap.assetSend), getAssetLogo(swap.assetReceive)],
    from: swap.claimAddress,
    type: TransactionType.Bridging,
  }
}

export function swapsToActivityMap(swaps: Record<string, SomeSwap>): ActivityMap {
  const activityMap: ActivityMap = {}

  for (const [id, swap] of Object.entries(swaps)) {
    activityMap[`${LDS_ACTIVITY_PREFIX}${id}`] = swapToActivity({ ...swap, id })
  }

  return activityMap
}
