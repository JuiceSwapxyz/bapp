import { address, networks, Transaction } from 'bitcoinjs-lib'
import { constructRefundTransaction, targetFee } from 'boltz-core'
import { popupRegistry } from 'components/Popups/registry'
import { LdsBridgeStatus, PopupType } from 'components/Popups/types'
import { call, takeEvery } from 'typed-redux-saga'
import { BitcoinBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import {
  broadcastChainSwap,
  buildRefundDetails,
  ChainSwap,
  fetchChainFee,
  prepareRefundMusig,
  SwapType,
} from 'uniswap/src/features/lds-bridge'
import { getLdsBridgeManager } from 'uniswap/src/features/lds-bridge/LdsBridgeManager'

export interface RefundSwapAction {
  type: 'bridge/refundSwap'
  payload: {
    swapId: string
    refundAddress: string
  }
}

export const refundSwap = (swapId: string, refundAddress: string): RefundSwapAction => ({
  type: 'bridge/refundSwap',
  payload: { swapId, refundAddress },
})

function* refundSwapSaga(action: RefundSwapAction) {
  const { swapId, refundAddress } = action.payload
  const ldsBridgeManager = getLdsBridgeManager()

  const { hex, timeoutBlockHeight } = yield* call([ldsBridgeManager, ldsBridgeManager.getLockupTransactions], swapId)

  const swap = yield* call([ldsBridgeManager, ldsBridgeManager.getSwap], swapId)
  if (!swap || swap.type !== SwapType.Chain) {
    throw new Error('Swap not found')
  }

  const chainSwap = swap as ChainSwap
  const { claimKeyPair } = yield* call([ldsBridgeManager, ldsBridgeManager.getKeysForSwap], swapId)

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

  yield* call([ldsBridgeManager, ldsBridgeManager.updateSwapRefundTx], swapId, txId)

  popupRegistry.addPopup(
    {
      type: PopupType.BitcoinBridge,
      id: txId,
      status: LdsBridgeStatus.Confirmed,
      direction: BitcoinBridgeDirection.CitreaToBitcoin,
    },
    txId,
  )
}

export function* watchRefundSwap() {
  yield* takeEvery('bridge/refundSwap', refundSwapSaga)
}
