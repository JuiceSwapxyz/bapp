import { address, networks, Transaction } from 'bitcoinjs-lib'
import { constructRefundTransaction, targetFee } from 'boltz-core'
import { popupRegistry } from 'components/Popups/registry'
import { LdsBridgeStatus, PopupType } from 'components/Popups/types'
import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'
import { call, takeEvery } from 'typed-redux-saga'
import { BitcoinBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import {
  broadcastChainSwap,
  buildRefundDetails,
  ChainSwap,
  fetchChainFee,
  prepareRefundMusig,
  SomeSwap,
  SwapType,
} from 'uniswap/src/features/lds-bridge'
import { getLdsBridgeManager } from 'uniswap/src/features/lds-bridge/LdsBridgeManager'

export interface RefundSwapAction {
  type: 'bridge/refundSwap'
  payload: {
    swap: SomeSwap
    refundAddress: string
  }
}

export const refundSwap = (swap: SomeSwap, refundAddress: string): RefundSwapAction => ({
  type: 'bridge/refundSwap',
  payload: { swap, refundAddress },
})

function* refundSwapSaga(action: RefundSwapAction) {
  const { swap, refundAddress } = action.payload
  const ldsBridgeManager = getLdsBridgeManager()

  popupRegistry.addPopup(
    {
      type: PopupType.RefundsInProgress,
      count: 1,
    },
    `refund-in-progress-${swap.id}`,
    DEFAULT_TXN_DISMISS_MS,
  )

  try {
    const { hex, timeoutBlockHeight } = yield* call([ldsBridgeManager, ldsBridgeManager.getLockupTransactions], swap)

    if (!hex || !timeoutBlockHeight) {
      throw new Error('Missing required transaction data')
    }

    if (swap.type !== SwapType.Chain) {
      throw new Error('Swap not found')
    }

    const chainSwap = swap as ChainSwap
    const { claimKeyPair } = yield* call([ldsBridgeManager, ldsBridgeManager.getKeysForSwap], swap.id)

    const { musig, tweakedKey, swapTree } = yield* call(prepareRefundMusig, claimKeyPair, chainSwap)
    const lockupTx = Transaction.fromHex(hex)

    const details = buildRefundDetails({
      tweakedKey,
      lockupTx,
      swapTree,
      claimKeyPair,
      musig,
      swap: chainSwap,
    })

    const decodedAddress = Buffer.from(address.toOutputScript(refundAddress, networks.bitcoin))

    const { BTC: serverFeePerVbyte } = yield* call(fetchChainFee)

    const refundTx = targetFee(serverFeePerVbyte, (fee) =>
      constructRefundTransaction([details] as any, decodedAddress, timeoutBlockHeight, fee, true),
    )

    const { id: txId } = yield* call(broadcastChainSwap, refundTx.toHex())

    yield* call([ldsBridgeManager, ldsBridgeManager.updateSwapRefundTx], swap.id, txId)

    popupRegistry.removePopup(`refund-in-progress-${swap.id}`)

    popupRegistry.addPopup(
      {
        type: PopupType.RefundsCompleted,
        count: 1,
      },
      `refund-completed-${swap.id}`,
      DEFAULT_TXN_DISMISS_MS,
    )

    popupRegistry.addPopup(
      {
        type: PopupType.BitcoinBridge,
        id: txId,
        status: LdsBridgeStatus.Confirmed,
        direction: BitcoinBridgeDirection.CitreaToBitcoin,
        url: '/bridge-swaps',
      },
      txId,
    )
  } catch (error) {
    popupRegistry.removePopup(`refund-in-progress-${swap.id}`)
    throw error
  }
}

export function* watchRefundSwap() {
  yield* takeEvery('bridge/refundSwap', refundSwapSaga)
}
