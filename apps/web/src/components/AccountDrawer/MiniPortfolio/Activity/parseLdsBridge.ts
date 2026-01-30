import { Activity, ActivityMap } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { inferChainIdFromSwap } from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
import { TransactionType } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SomeSwap } from 'uniswap/src/features/lds-bridge/lds-types/storage'
import { LdsSwapStatus } from 'uniswap/src/features/lds-bridge/lds-types/websocket'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'

export const LDS_ACTIVITY_PREFIX = 'lds-'

function ldsStatusToTransactionStatus(status?: LdsSwapStatus): TransactionStatus {
  if (!status) {
    return TransactionStatus.Pending
  }

  if (status === LdsSwapStatus.InvoiceSettled || status === LdsSwapStatus.TransactionClaimed) {
    return TransactionStatus.Success
  }

  if (
    status === LdsSwapStatus.SwapExpired ||
    status === LdsSwapStatus.SwapRefunded ||
    status === LdsSwapStatus.InvoiceFailedToPay ||
    status === LdsSwapStatus.TransactionFailed
  ) {
    return TransactionStatus.Failed
  }

  return TransactionStatus.Pending
}

export function swapToActivity(swap: SomeSwap & { id: string }): Activity {
  const status = ldsStatusToTransactionStatus(swap.status)

  const inferredChainId = swap.chainId ?? inferChainIdFromSwap(swap)
  const sourceChain = inferredChainId
    ? inferredChainId
    : swap.assetSend === 'cBTC'
      ? UniverseChainId.CitreaMainnet
      : UniverseChainId.LightningNetwork
  const destChain =
    swap.assetReceive === 'BTC' ? UniverseChainId.LightningNetwork : inferredChainId ?? UniverseChainId.CitreaMainnet

  const descriptor = `${swap.sendAmount} ${swap.assetSend} → ${swap.receiveAmount} ${swap.assetReceive}`

  const titleMap: Partial<Record<TransactionStatus, string>> = {
    [TransactionStatus.Pending]: 'Bridge pending',
    [TransactionStatus.Success]: 'Bridged',
    [TransactionStatus.Failed]: 'Bridge failed',
  }

  return {
    hash: `${LDS_ACTIVITY_PREFIX}${swap.id}`,
    chainId: sourceChain,
    outputChainId: destChain,
    status,
    timestamp: swap.date / 1000,
    title: titleMap[status] || 'Bridge',
    descriptor,
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
