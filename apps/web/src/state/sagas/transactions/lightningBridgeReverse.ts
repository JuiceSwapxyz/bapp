import { BigNumber } from 'bignumber.js'
import { popupRegistry } from 'components/Popups/registry'
import { LightningBridgeStatus, PopupType } from 'components/Popups/types'
import { prefix0x } from 'state/sagas/transactions/buildEvmLockupTx'
import { generateChainSwapKeys } from 'state/sagas/transactions/chainSwapKeys'
import { pollForLockupConfirmation } from 'state/sagas/transactions/lightningBridgePolling'
import { btcToSat } from 'state/sagas/utils/lightningUtils'
import { call, race } from 'typed-redux-saga'
import { createReverseSwap, fetchReversePairs, helpMeClaim } from 'uniswap/src/data/apiClients/LdsApi/LdsApiClient'
import { LdsSwapStatus, createLdsSocketClient } from 'uniswap/src/data/socketClients/ldsSocket'
import { LightningBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { LightningBridgeReverseStep } from 'uniswap/src/features/transactions/swap/steps/lightningBridge'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'

interface HandleLightningBridgeReverseParams {
  step: LightningBridgeReverseStep
  setCurrentStep: SetCurrentStepFn
  trade: Trade
  account: AccountDetails
  destinationAddress?: string
  onTransactionHash?: (hash: string) => void
  onSuccess?: () => void
}

export function* handleLightningBridgeReverse(params: HandleLightningBridgeReverseParams) {
  const { step, setCurrentStep, trade, account, onSuccess } = params

  const reverseResponse = yield* call(fetchReversePairs)

  const pairHash = reverseResponse.BTC.cBTC.hash
  const invoiceAmount = Number(btcToSat(new BigNumber(trade.inputAmount.toExact())))
  const { preimageHash, preimage } = generateChainSwapKeys()
  const claimAddress = account.address

  const reverseInvoiceResponse = yield* call(createReverseSwap, {
    from: 'BTC',
    to: 'cBTC',
    pairHash,
    preimageHash,
    claimAddress,
    invoiceAmount,
  })

  const ldsSocket = createLdsSocketClient()
  yield* call(ldsSocket.subscribeToSwapUntil, reverseInvoiceResponse.id, LdsSwapStatus.SwapCreated)
  step.invoice = reverseInvoiceResponse.invoice as string
  setCurrentStep({ step, accepted: true })

  const { promise: ponderPromise, cancel: cancelPonderPolling } = pollForLockupConfirmation(preimageHash)

  yield* race({
    transactionConfirmed: call(
      ldsSocket.subscribeToSwapUntil,
      reverseInvoiceResponse.id,
      LdsSwapStatus.TransactionConfirmed,
    ),
    ponderConfirmed: call(() => ponderPromise),
  })

  popupRegistry.addPopup(
    {
      type: PopupType.LightningBridge,
      id: reverseInvoiceResponse.id,
      direction: LightningBridgeDirection.Reverse,
      status: LightningBridgeStatus.Pending,
    },
    reverseInvoiceResponse.id,
  )

  if (onSuccess) {
    yield* call(onSuccess)
  }

  ldsSocket.disconnect()

  yield* call(() => ponderPromise)
  cancelPonderPolling()

  const { txHash } = yield* call(helpMeClaim, {
    preimage,
    preimageHash: prefix0x(preimageHash),
  })

  popupRegistry.addPopup(
    {
      type: PopupType.LightningBridge,
      id: txHash,
      direction: LightningBridgeDirection.Reverse,
      status: LightningBridgeStatus.Confirmed,
    },
    txHash,
  )
}
