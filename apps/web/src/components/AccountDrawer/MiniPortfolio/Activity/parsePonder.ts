/**
 * Ponder Activity Parser - Converts Ponder swap and launchpad trade data into Activity format
 *
 * Ponder only indexes CONFIRMED on-chain events, so all activities from Ponder have status: Success.
 */
import { Activity, ActivityMap } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import {
  PonderActivityResponse,
  PonderLaunchpadTradeData,
  PonderSwapData,
} from 'uniswap/src/data/apiClients/ponderApi/types'
import { TransactionType } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { getTokenLogoFromRegistry } from 'uniswap/src/features/tokens/tokenRegistry'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { NumberType } from 'utilities/src/format/types'
import { formatUnits } from 'viem'

type FormatNumberFunctionType = (options: { value: number | string; type: NumberType }) => string

// Launchpad trade types don't exist in GraphQL TransactionType enum,
// so we use Swap for display purposes. The title and descriptor will indicate
// whether it's a buy or sell.

// Base asset for launchpad trades is always cBTC (native currency)
const CBTC_DECIMALS = 18
const CBTC_SYMBOL = 'cBTC'
const CBTC_LOGO = 'https://docs.juiceswap.com/media/icons/cbtc.png'

/**
 * Convert Ponder chainId to UniverseChainId
 */
function ponderChainIdToUniverseChainId(chainId: number): UniverseChainId {
  // Ponder uses numeric chain IDs
  // 5115 = Citrea Testnet, 5116 = Citrea Mainnet (pending)
  if (chainId === 5115) {
    return UniverseChainId.CitreaTestnet
  }
  if (chainId === 5116) {
    return UniverseChainId.CitreaMainnet
  }
  // Default to testnet for unknown chains
  return UniverseChainId.CitreaTestnet
}

/**
 * Resolve token logo from registry with fallback to undefined
 */
function resolveTokenLogo(chainId: UniverseChainId, address: string): string | undefined {
  return getTokenLogoFromRegistry(chainId, address)
}

/**
 * Convert a Ponder DEX swap to Activity format
 */
export function ponderSwapToActivity(swap: PonderSwapData, formatNumber: FormatNumberFunctionType): Activity {
  const chainId = ponderChainIdToUniverseChainId(swap.chainId)

  // Build currencies for display
  const tokenInCurrency = buildCurrency({
    chainId,
    address: swap.tokenIn,
    decimals: swap.tokenInDecimals ?? 18,
    symbol: swap.tokenInSymbol ?? undefined,
    name: swap.tokenInName ?? undefined,
  })
  const tokenOutCurrency = buildCurrency({
    chainId,
    address: swap.tokenOut,
    decimals: swap.tokenOutDecimals ?? 18,
    symbol: swap.tokenOutSymbol ?? undefined,
    name: swap.tokenOutName ?? undefined,
  })

  // Format amounts
  const amountIn = formatUnits(BigInt(swap.amountIn), swap.tokenInDecimals ?? 18)
  const amountOut = formatUnits(BigInt(swap.amountOut), swap.tokenOutDecimals ?? 18)

  const formattedAmountIn = formatNumber({
    value: parseFloat(amountIn),
    type: NumberType.TokenNonTx,
  })
  const formattedAmountOut = formatNumber({
    value: parseFloat(amountOut),
    type: NumberType.TokenNonTx,
  })

  const tokenInSymbol = swap.tokenInSymbol ?? 'Unknown'
  const tokenOutSymbol = swap.tokenOutSymbol ?? 'Unknown'

  // Use same descriptor format as parseLocal.ts
  const descriptor = i18n.t('activity.transaction.swap.descriptor', {
    amountWithSymbolA: `${formattedAmountIn} ${tokenInSymbol}`,
    amountWithSymbolB: `${formattedAmountOut} ${tokenOutSymbol}`,
  })

  return {
    hash: swap.txHash,
    chainId,
    status: TransactionStatus.Success, // Ponder only indexes confirmed transactions
    timestamp: Number(swap.blockTimestamp),
    title: i18n.t('transaction.status.swap.success'), // "Swapped"
    descriptor,
    logos: [resolveTokenLogo(chainId, swap.tokenIn), resolveTokenLogo(chainId, swap.tokenOut)],
    currencies: [tokenInCurrency, tokenOutCurrency],
    from: swap.swapperAddress,
    type: TransactionType.Swap,
  }
}

/**
 * Convert a Ponder launchpad trade to Activity format
 */
export function ponderLaunchpadTradeToActivity(
  trade: PonderLaunchpadTradeData,
  formatNumber: FormatNumberFunctionType,
): Activity {
  const chainId = ponderChainIdToUniverseChainId(trade.chainId)

  // Launchpad trades have a fixed decimals of 18 for the token
  const tokenDecimals = 18
  const tokenSymbol = trade.tokenSymbol ?? 'Unknown'

  // Format amounts
  const tokenAmount = formatUnits(BigInt(trade.tokenAmount), tokenDecimals)

  const formattedTokenAmount = formatNumber({
    value: parseFloat(tokenAmount),
    type: NumberType.TokenNonTx,
  })

  // Create descriptor similar to how BuySellPanel.tsx does it
  // "Bought 100 TOKEN" or "Sold 100 TOKEN"
  const descriptor = trade.isBuy
    ? `Bought ${formattedTokenAmount} ${tokenSymbol}`
    : `Sold ${formattedTokenAmount} ${tokenSymbol}`

  const title = trade.isBuy ? i18n.t('common.bought') : i18n.t('common.sold')

  // Build currencies - for launchpad trades, it's token <-> cBTC
  const tokenCurrency = buildCurrency({
    chainId,
    address: trade.tokenAddress,
    decimals: tokenDecimals,
    symbol: tokenSymbol,
    name: trade.tokenName ?? undefined,
  })

  // The native currency (cBTC) is the base asset
  const baseCurrency = buildCurrency({
    chainId,
    address: undefined, // Native currency
    decimals: CBTC_DECIMALS,
    symbol: CBTC_SYMBOL,
    name: 'cBTC',
  })

  // Logos: show token logo and cBTC logo
  // For buys: cBTC -> Token, for sells: Token -> cBTC
  const tokenLogo = resolveTokenLogo(chainId, trade.tokenAddress)
  const logos = trade.isBuy ? [CBTC_LOGO, tokenLogo] : [tokenLogo, CBTC_LOGO]
  const currencies = trade.isBuy ? [baseCurrency, tokenCurrency] : [tokenCurrency, baseCurrency]

  // Use txHash + log index as the hash key for launchpad trades
  // The id format from Ponder is "txHash-logIndex"
  return {
    hash: trade.id, // Using the full id which includes log index for uniqueness
    chainId,
    status: TransactionStatus.Success, // Ponder only indexes confirmed transactions
    timestamp: Number(trade.timestamp),
    title,
    descriptor,
    logos,
    currencies,
    from: trade.trader,
    // Note: Launchpad trades don't use the `type` field since LaunchpadBuy/LaunchpadSell
    // don't exist in the GraphQL TransactionType enum. The title distinguishes buy vs sell.
  }
}

/**
 * Parse Ponder activity response into ActivityMap format
 */
export function parsePonderActivities(
  response: PonderActivityResponse | undefined,
  formatNumber: FormatNumberFunctionType,
): ActivityMap {
  if (!response) {
    return {}
  }

  const activityMap: ActivityMap = {}

  // Process DEX swaps
  for (const swap of response.swaps) {
    const activity = ponderSwapToActivity(swap, formatNumber)
    activityMap[activity.hash] = activity
  }

  // Process launchpad trades
  for (const trade of response.launchpadTrades) {
    const activity = ponderLaunchpadTradeToActivity(trade, formatNumber)
    activityMap[activity.hash] = activity
  }

  return activityMap
}
