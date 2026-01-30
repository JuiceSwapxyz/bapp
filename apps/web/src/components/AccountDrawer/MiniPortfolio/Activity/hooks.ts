import { useAssetActivity } from 'appGraphql/data/apollo/AssetActivityProvider'
import { swapsToActivityMap } from 'components/AccountDrawer/MiniPortfolio/Activity/parseLdsBridge'
import { useLocalActivities } from 'components/AccountDrawer/MiniPortfolio/Activity/parseLocal'
import { parseRemoteActivities } from 'components/AccountDrawer/MiniPortfolio/Activity/parseRemote'
import { Activity, ActivityMap } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { useCreateCancelTransactionRequest } from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
import { GasFeeResult, GasSpeed, useTransactionGasFee } from 'hooks/useTransactionGasFee'
import { useEffect, useMemo, useState } from 'react'
import { usePendingOrders } from 'state/signatures/hooks'
import { SignatureType, UniswapXOrderDetails } from 'state/signatures/types'
import { usePendingTransactions, useTransactionCanceller } from 'state/transactions/hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getLdsBridgeManager } from 'uniswap/src/features/lds-bridge/LdsBridgeManager'
import { SomeSwap } from 'uniswap/src/features/lds-bridge/lds-types/storage'
import { swapStatusFinal } from 'uniswap/src/features/lds-bridge/lds-types/websocket'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'

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

/** Deduplicates local and remote activities */
function combineActivities({
  localMap = {},
  remoteMap = {},
  bridgeMap = {},
}: {
  localMap?: ActivityMap
  remoteMap?: ActivityMap
  bridgeMap?: ActivityMap
}): Array<Activity> {
  const txHashes = [...new Set([...Object.keys(localMap), ...Object.keys(remoteMap), ...Object.keys(bridgeMap)])]

  return txHashes.reduce((acc: Array<Activity>, hash) => {
    const localActivity = (localMap[hash] ?? {}) as Activity
    const remoteActivity = (remoteMap[hash] ?? {}) as Activity
    const bridgeActivity = (bridgeMap[hash] ?? {}) as Activity

    if (bridgeActivity.hash) {
      acc.push(bridgeActivity)
      return acc
    }

    if (localActivity.cancelled) {
      // Hides misleading activities caused by cross-chain nonce collisions previously being incorrectly labelled as cancelled txs in redux
      // If there is no remote activity fallback to local activity
      if (localActivity.chainId !== remoteActivity.chainId) {
        acc.push(remoteActivity)
        return acc
      }
      // Remote data only contains data of the cancel tx, rather than the original tx, so we prefer local data here
      acc.push(localActivity)
    } else {
      // Prefer remote values for most fields (e.g., on-chain amounts are more accurate)
      // BUT prefer local status if it's finalized, since local status is updated by on-chain polling
      // while remote GraphQL cache may be stale
      const mergedActivity = { ...localActivity, ...remoteActivity }

      // If local has finalized status but remote still shows pending, use local status
      if (
        (localActivity.status === TransactionStatus.Success || localActivity.status === TransactionStatus.Failed) &&
        remoteActivity.status === TransactionStatus.Pending
      ) {
        mergedActivity.status = localActivity.status
      }

      acc.push(mergedActivity as Activity)
    }

    return acc
  }, [])
}

export function useAllActivities(account: string) {
  const { formatNumberOrString } = useLocalizationContext()
  const { activities, loading: remoteLoading } = useAssetActivity()

  const { data: localMap, isLoading: localLoading } = useLocalActivities(account)
  const remoteMap = useMemo(
    () => parseRemoteActivities(activities, account, formatNumberOrString),
    [account, activities, formatNumberOrString],
  )

  const [bridgeMap, setBridgeMap] = useState<ActivityMap>({})

  useEffect(() => {
    const ldsBridgeManager = getLdsBridgeManager()

    const loadBridgeSwaps = async () => {
      try {
        const swaps = await ldsBridgeManager.getSwaps()
        setBridgeMap(swapsToActivityMap(swaps))
      } catch (error) {
        logger.error(error, { tags: { file: 'Activity/hooks', function: 'loadBridgeSwaps' } })
      }
    }

    const handleSwapChange = (swaps: Record<string, SomeSwap>) => {
      setBridgeMap(swapsToActivityMap(swaps))
    }

    void loadBridgeSwaps()
    ldsBridgeManager.addSwapChangeListener(handleSwapChange)

    return () => {
      ldsBridgeManager.removeSwapChangeListener(handleSwapChange)
    }
  }, [])

  const updateCancelledTx = useTransactionCanceller()

  /* Updates locally stored pendings tx's when remote data contains a conflicting cancellation tx */
  useEffect(() => {
    if (!remoteMap) {
      return
    }

    Object.values(localMap).forEach((localActivity) => {
      if (!localActivity) {
        return
      }

      const cancelHash = findCancelTx({ localActivity, remoteMap, account })

      if (cancelHash) {
        updateCancelledTx(localActivity.hash, localActivity.chainId, cancelHash)
      }
    })
  }, [account, localMap, remoteMap, updateCancelledTx])

  const combinedActivities = useMemo(
    () => combineActivities({ localMap, remoteMap: remoteMap ?? {}, bridgeMap }),
    [localMap, remoteMap, bridgeMap],
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

export function usePendingBridgeActivities(): { bridgeSwaps: SomeSwap[]; loading: boolean } {
  const [bridgeSwaps, setBridgeSwaps] = useState<SomeSwap[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ldsBridgeManager = getLdsBridgeManager()

    const loadInitialSwaps = async (): Promise<void> => {
      try {
        await ldsBridgeManager.suscribeAllPendingSwaps()
        const swaps = await ldsBridgeManager.getSwaps()
        const pendingSwaps = Object.values(swaps).filter(
          (swap) => swap.status && !swapStatusFinal.includes(swap.status),
        )
        setBridgeSwaps(pendingSwaps)
        setLoading(false)
      } catch (error) {
        logger.error(error, { tags: { file: 'Activity/hooks', function: 'loadInitialSwaps' } })
        setLoading(false)
      }
    }

    const handleSwapChange = (swaps: Record<string, SomeSwap>): void => {
      const pendingSwaps = Object.values(swaps).filter((swap) => swap.status && !swapStatusFinal.includes(swap.status))
      setBridgeSwaps(pendingSwaps)
    }

    void loadInitialSwaps()
    ldsBridgeManager.addSwapChangeListener(handleSwapChange)

    return () => {
      ldsBridgeManager.removeSwapChangeListener(handleSwapChange)
    }
  }, [])

  return { bridgeSwaps, loading }
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
