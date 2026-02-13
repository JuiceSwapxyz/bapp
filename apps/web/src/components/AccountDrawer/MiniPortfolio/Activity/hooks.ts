import { useAssetActivity } from 'appGraphql/data/apollo/AssetActivityProvider'
import { swapsToActivityMap } from 'components/AccountDrawer/MiniPortfolio/Activity/parseLdsBridge'
import { useLocalActivities } from 'components/AccountDrawer/MiniPortfolio/Activity/parseLocal'
import { parsePonderActivities } from 'components/AccountDrawer/MiniPortfolio/Activity/parsePonder'
import { parseRemoteActivities } from 'components/AccountDrawer/MiniPortfolio/Activity/parseRemote'
import { Activity, ActivityMap } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import {
  keepActivitiesForChains,
  useCreateCancelTransactionRequest,
} from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
import { useBridgeSwaps } from 'hooks/useBridgeSwaps'
import { GasFeeResult, GasSpeed, useTransactionGasFee } from 'hooks/useTransactionGasFee'
import { useEffect, useMemo } from 'react'
import { usePendingOrders } from 'state/signatures/hooks'
import { SignatureType, UniswapXOrderDetails } from 'state/signatures/types'
import { usePendingTransactions, useTransactionCanceller } from 'state/transactions/hooks'
import { usePonderActivitiesQuery } from 'uniswap/src/data/apiClients/ponderApi/PonderApi'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { SomeSwap } from 'uniswap/src/features/lds-bridge/lds-types/storage'
import { LdsSwapStatus, swapStatusPending } from 'uniswap/src/features/lds-bridge/lds-types/websocket'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'

/** Detects transactions from same account with the same nonce and different hash */
function findCancelTx({
  localActivity,
  remoteMap,
  account,
}: {
  localActivity: Activity
  remoteMap: ActivityMap
  account: string
}): string | undefined {
  // handles locally cached tx's that were stored before we started tracking nonces
  if (!localActivity.nonce || localActivity.status !== TransactionStatus.Pending) {
    return undefined
  }

  for (const remoteTx of Object.values(remoteMap)) {
    if (!remoteTx) {
      continue
    }

    // A pending tx is 'cancelled' when another tx with the same account & nonce but different hash makes it on chain
    if (
      remoteTx.nonce === localActivity.nonce &&
      remoteTx.from.toLowerCase() === account.toLowerCase() &&
      remoteTx.hash.toLowerCase() !== localActivity.hash.toLowerCase() &&
      remoteTx.chainId === localActivity.chainId
    ) {
      return remoteTx.hash
    }
  }

  return undefined
}

/** Deduplicates local, remote, bridge, and ponder activities */
function combineActivities({
  localMap = {},
  remoteMap = {},
  bridgeMap = {},
  ponderMap = {},
}: {
  localMap?: ActivityMap
  remoteMap?: ActivityMap
  bridgeMap?: ActivityMap
  ponderMap?: ActivityMap
}): Array<Activity> {
  const txHashes = [
    ...new Set([
      ...Object.keys(localMap),
      ...Object.keys(remoteMap),
      ...Object.keys(bridgeMap),
      ...Object.keys(ponderMap),
    ]),
  ]

  return txHashes.reduce((acc: Array<Activity>, hash) => {
    const localActivity = (localMap[hash] ?? {}) as Activity
    const remoteActivity = (remoteMap[hash] ?? {}) as Activity
    const bridgeActivity = (bridgeMap[hash] ?? {}) as Activity
    const ponderActivity = (ponderMap[hash] ?? {}) as Activity

    // Priority 1: Bridge activities (lds- prefix) are always separate
    if (bridgeActivity.hash) {
      acc.push(bridgeActivity)
      return acc
    }

    // Priority 2: Cancelled transactions
    if (localActivity.cancelled) {
      // Hides misleading activities caused by cross-chain nonce collisions previously being incorrectly labelled as cancelled txs in redux
      // If there is no remote activity fallback to local activity
      if (localActivity.chainId !== remoteActivity.chainId) {
        acc.push(remoteActivity.hash ? remoteActivity : localActivity)
        return acc
      }
      // Remote data only contains data of the cancel tx, rather than the original tx, so we prefer local data here
      acc.push(localActivity)
      return acc
    }

    // Priority 3: Merge all sources
    // Order: local (base) -> remote -> ponder (most authoritative for on-chain data)
    const mergedActivity = { ...localActivity, ...remoteActivity, ...ponderActivity }

    // Status override: local finalized takes precedence over stale remote Pending
    // (Ponder is always Success, so this mainly handles remote staleness)
    if (
      (localActivity.status === TransactionStatus.Success || localActivity.status === TransactionStatus.Failed) &&
      mergedActivity.status === TransactionStatus.Pending
    ) {
      mergedActivity.status = localActivity.status
    }

    if (mergedActivity.hash) {
      acc.push(mergedActivity as Activity)
    }

    return acc
  }, [])
}

export function useAllActivities(account: string) {
  const { formatNumberOrString } = useLocalizationContext()
  const { activities, loading: remoteLoading } = useAssetActivity()
  const { chains, defaultChainId } = useEnabledChains()

  const { data: localMap, isLoading: localLoading } = useLocalActivities(account)
  const remoteMap = useMemo(
    () => parseRemoteActivities(activities, account, formatNumberOrString),
    [account, activities, formatNumberOrString],
  )

  const { data: bridgeSwaps } = useBridgeSwaps()

  const bridgeMap = useMemo(() => {
    if (!bridgeSwaps) {
      return {}
    }
    const activityMap = swapsToActivityMap(bridgeSwaps.swaps)
    return keepActivitiesForChains(activityMap, chains)
  }, [bridgeSwaps, chains])

  // Fetch Ponder activities (DEX swaps + launchpad trades) for Citrea chains
  const { data: ponderResponse } = usePonderActivitiesQuery({
    account,
    chainId: defaultChainId,
  })

  const ponderMap = useMemo(
    () => parsePonderActivities(ponderResponse, formatNumberOrString),
    [ponderResponse, formatNumberOrString],
  )

  const updateCancelledTx = useTransactionCanceller()

  /* Updates locally stored pendings tx's when remote data contains a conflicting cancellation tx */
  useEffect(() => {
    if (!remoteMap) {
      return
    }

    // Check both remoteMap and ponderMap for nonce collision
    const combinedMap = { ...remoteMap, ...ponderMap }

    Object.values(localMap).forEach((localActivity) => {
      if (!localActivity) {
        return
      }

      const cancelHash = findCancelTx({ localActivity, remoteMap: combinedMap, account })

      if (cancelHash) {
        updateCancelledTx(localActivity.hash, localActivity.chainId, cancelHash)
      }
    })
  }, [account, localMap, remoteMap, ponderMap, updateCancelledTx])

  const combinedActivities = useMemo(
    () => combineActivities({ localMap, remoteMap: remoteMap ?? {}, bridgeMap, ponderMap }),
    [localMap, remoteMap, bridgeMap, ponderMap],
  )

  const loading = remoteLoading || localLoading

  return { loading, activities: combinedActivities }
}

export function useOpenLimitOrders(account: string) {
  const { activities, loading } = useAllActivities(account)
  const openLimitOrders = activities.filter(
    (activity) =>
      activity.offchainOrderDetails?.type === SignatureType.SIGN_LIMIT && activity.status === TransactionStatus.Pending,
  )
  return {
    openLimitOrders,
    loading,
  }
}

const pendiingSwapStatuses = Object.values(swapStatusPending).filter((status) => status !== LdsSwapStatus.SwapCreated)
export function usePendingBridgeActivities(): { bridgeSwaps: SomeSwap[]; loading: boolean } {
  const { data: bridgeSwaps, isLoading: loading } = useBridgeSwaps({ statuses: pendiingSwapStatuses })
  return { bridgeSwaps: bridgeSwaps?.swaps ?? ([] as unknown as SomeSwap[]), loading }
}

export function usePendingActivity() {
  const pendingTransactions = usePendingTransactions()
  const pendingOrders = usePendingOrders()
  const { bridgeSwaps } = usePendingBridgeActivities()

  const pendingOrdersWithoutLimits = pendingOrders.filter((order) => order.type !== SignatureType.SIGN_LIMIT)

  const hasPendingActivity =
    pendingTransactions.length > 0 || pendingOrdersWithoutLimits.length > 0 || bridgeSwaps.length > 0
  const pendingActivityCount = pendingTransactions.length + pendingOrdersWithoutLimits.length + bridgeSwaps.length
  const isOnlyUnichainPendingActivity =
    hasPendingActivity &&
    [...pendingTransactions, ...pendingOrdersWithoutLimits].every((tx) =>
      [UniverseChainId.Unichain].includes(tx.chainId),
    )

  return { hasPendingActivity, pendingActivityCount, isOnlyUnichainPendingActivity }
}

export function useCancelOrdersGasEstimate(orders?: UniswapXOrderDetails[]): GasFeeResult {
  const cancelTransactionParams = useMemo(
    () =>
      orders && orders.length > 0
        ? {
            orders: orders.map((order) => {
              return {
                encodedOrder: order.encodedOrder as string,
                type: order.type as SignatureType,
              }
            }),
            chainId: orders[0].chainId,
          }
        : undefined,
    [orders],
  )
  const cancelTransaction = useCreateCancelTransactionRequest(cancelTransactionParams) ?? undefined
  const gasEstimate = useTransactionGasFee(cancelTransaction, GasSpeed.Fast)
  return gasEstimate
}
