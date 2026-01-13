import { popupRegistry } from 'components/Popups/registry'
import { LdsBridgeStatus, PopupType } from 'components/Popups/types'
import { all, call } from 'typed-redux-saga'
import { BitcoinBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { LdsSwapStatus, SwapType } from 'uniswap/src/features/lds-bridge'
import { getLdsBridgeManager } from 'uniswap/src/features/lds-bridge/LdsBridgeManager'

const claimAndNotify = async (swapId: string) => {
  const ldsBridgeManager = getLdsBridgeManager()
  const { claimTx } = await ldsBridgeManager.autoClaimSwap(swapId)
  popupRegistry.addPopup(
    {
      type: PopupType.BitcoinBridge,
      id: claimTx!,
      status: LdsBridgeStatus.Confirmed,
      direction: BitcoinBridgeDirection.BitcoinToCitrea,
    },
    claimTx!,
  )
}

const awaitUntilClaimAvailable = async (swapId: string) => {
  const ldsBridgeManager = getLdsBridgeManager()
  await ldsBridgeManager.waitForSwapUntilState(swapId, LdsSwapStatus.TransactionServerConfirmed)
  await claimAndNotify(swapId)
}

export function* bridgeResumeSaga() {
  const ldsBridgeManager = getLdsBridgeManager()
  yield* call([ldsBridgeManager, ldsBridgeManager.suscribeAllPendingSwaps])

  const pendingSwaps = yield* call([ldsBridgeManager, ldsBridgeManager.getPendingSwaps])
  const chainPendingSwapsToCitrea = pendingSwaps.filter(
    (swap) => swap.type === SwapType.Chain && swap.assetReceive === 'cBTC' && swap.assetSend === 'BTC',
  )
  const reversePendingSwapsToCitrea = pendingSwaps.filter(
    (swap) => swap.type === SwapType.Reverse && swap.assetReceive === 'cBTC' && swap.assetSend === 'BTC',
  )

  chainPendingSwapsToCitrea
    .filter((swap) => swap.status === LdsSwapStatus.TransactionServerConfirmed)
    .forEach((swap) => {
      claimAndNotify(swap.id)
    })

  reversePendingSwapsToCitrea
    .filter((swap) => swap.status === LdsSwapStatus.TransactionConfirmed)
    .forEach((swap) => {
      claimAndNotify(swap.id)
    })

  const txsInMempool = chainPendingSwapsToCitrea.filter((swap) => swap.status === LdsSwapStatus.TransactionMempool)
  yield* all(txsInMempool.map((swap) => call(awaitUntilClaimAvailable, swap.id)))
}
