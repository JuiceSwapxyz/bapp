import BigNumber from 'bignumber.js'
import { popupRegistry } from 'components/Popups/registry'
import { BitcoinBridgeDirection, LdsBridgeStatus, PopupType } from 'components/Popups/types'
import { generateChainSwapKeys } from 'state/sagas/transactions/chainSwapKeys'
import { pollForLockupConfirmation } from 'state/sagas/transactions/lightningBridgePolling'
import { prefix0x } from 'state/sagas/utils/buildEvmLockupTx'
import { btcToSat } from 'state/sagas/utils/lightningUtils'
import { call } from 'typed-redux-saga'
import { createChainSwap, fetchChainPairs, helpMeClaim } from 'uniswap/src/data/apiClients/LdsApi/LdsApiClient'
import { LdsSwapStatus, createLdsSocketClient } from 'uniswap/src/data/socketClients/ldsSocket'
import { BitcoinBridgeBitcoinToCitreaStep } from 'uniswap/src/features/transactions/swap/steps/bitcoinBridge'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'

interface HandleBitcoinBridgeBitcoinToCitreaParams {
  step: BitcoinBridgeBitcoinToCitreaStep
  setCurrentStep: SetCurrentStepFn
  trade: Trade
  account: AccountDetails
  destinationAddress?: string
  onTransactionHash?: (hash: string) => void
  onSuccess?: () => void
}

export function* handleBitcoinBridgeBitcoinToCitrea(params: HandleBitcoinBridgeBitcoinToCitreaParams) {
  const { step, setCurrentStep, trade, account, onSuccess } = params

  const { claimPublicKey: refundPublicKey, preimage, preimageHash } = generateChainSwapKeys()

  const chainPairs = yield* call(fetchChainPairs)
  const pairHash = chainPairs.BTC.cBTC.hash
  const userLockAmount = btcToSat(new BigNumber(trade.inputAmount.toExact())).toNumber()
  const claimAddress = account.address

  const chainSwapResponse = yield* call(createChainSwap, {
    from: 'BTC',
    to: 'cBTC',
    preimageHash,
    claimAddress,
    refundPublicKey,
    pairHash,
    referralId: 'boltz_webapp_desktop',
    userLockAmount,
  })

  const ldsSocket = createLdsSocketClient()
  yield* call(ldsSocket.subscribeToSwapUntil, chainSwapResponse.id, LdsSwapStatus.SwapCreated)

  step.bip21 = chainSwapResponse.lockupDetails.bip21
  setCurrentStep({ step, accepted: true })

  yield* call(ldsSocket.subscribeToSwapUntil, chainSwapResponse.id, LdsSwapStatus.TransactionMempool)

  if (onSuccess) {
    yield* call(onSuccess)
  }

  popupRegistry.addPopup(
    {
      type: PopupType.BitcoinBridge,
      id: chainSwapResponse.id,
      status: LdsBridgeStatus.Pending,
      direction: BitcoinBridgeDirection.BitcoinToCitrea,
    },
    chainSwapResponse.id,
  )

  yield* call(ldsSocket.subscribeToSwapUntil, chainSwapResponse.id, LdsSwapStatus.TransactionConfirmed)
  ldsSocket.disconnect()

  const { promise: ponderPromise, cancel: cancelPonderPolling } = pollForLockupConfirmation(preimageHash)
  yield* call(() => ponderPromise)
  cancelPonderPolling()

  const { txHash } = yield* call(helpMeClaim, {
    preimage,
    preimageHash: prefix0x(preimageHash),
  })

  popupRegistry.addPopup(
    {
      type: PopupType.BitcoinBridge,
      id: txHash,
      status: LdsBridgeStatus.Confirmed,
      direction: BitcoinBridgeDirection.BitcoinToCitrea,
    },
    txHash,
  )
}
