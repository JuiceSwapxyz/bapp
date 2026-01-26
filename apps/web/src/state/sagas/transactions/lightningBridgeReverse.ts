import { BigNumber } from 'bignumber.js'
import { popupRegistry } from 'components/Popups/registry'
import { LdsBridgeStatus, PopupType } from 'components/Popups/types'
import { call } from 'typed-redux-saga'
import { LightningBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { LdsSwapStatus, btcToSat, getLdsBridgeManager } from 'uniswap/src/features/lds-bridge'
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

  const invoiceAmount = Number(btcToSat(new BigNumber(trade.inputAmount.toExact())))
  const claimAddress = account.address

  const ldsBridge = getLdsBridgeManager()
  const reverseSwap = yield* call([ldsBridge, ldsBridge.createReverseSwap], {
    invoiceAmount,
    claimAddress,
  })

  step.invoice = reverseSwap.invoice as string
  setCurrentStep({ step, accepted: true })

  yield* call([ldsBridge, ldsBridge.waitForSwapUntilState], reverseSwap.id, LdsSwapStatus.TransactionConfirmed)

  popupRegistry.addPopup(
    {
      type: PopupType.LightningBridge,
      id: reverseSwap.id,
      direction: LightningBridgeDirection.Reverse,
      status: LdsBridgeStatus.Pending,
    },
    reverseSwap.id,
  )

  if (onSuccess) {
    yield* call(onSuccess)
  }

  const { claimTx: txHash } = yield* call([ldsBridge, ldsBridge.autoClaimSwap], reverseSwap.id)

  popupRegistry.addPopup(
    {
      type: PopupType.LightningBridge,
      id: txHash!,
      direction: LightningBridgeDirection.Reverse,
      status: LdsBridgeStatus.Confirmed,
    },
    txHash!,
  )
}
