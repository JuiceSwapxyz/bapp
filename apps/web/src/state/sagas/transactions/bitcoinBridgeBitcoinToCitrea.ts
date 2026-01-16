import BigNumber from 'bignumber.js'
import { popupRegistry } from 'components/Popups/registry'
import { BitcoinBridgeDirection, LdsBridgeStatus, PopupType } from 'components/Popups/types'
import { call } from 'typed-redux-saga'
import { LdsSwapStatus, btcToSat, getLdsBridgeManager } from 'uniswap/src/features/lds-bridge'
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

  const userLockAmount = btcToSat(new BigNumber(trade.inputAmount.toExact())).toNumber()
  const ldsBridge = getLdsBridgeManager()
  const claimAddress = account.address

  const chainSwapResponse = yield* call([ldsBridge, ldsBridge.createChainSwap], {
    from: 'BTC',
    to: 'cBTC',
    claimAddress,
    userLockAmount,
  })
  step.bip21 = chainSwapResponse.lockupDetails.bip21
  setCurrentStep({ step, accepted: true })

  yield* call([ldsBridge, ldsBridge.waitForSwapUntilState], chainSwapResponse.id, LdsSwapStatus.TransactionMempool)

  popupRegistry.addPopup(
    {
      type: PopupType.BitcoinBridge,
      id: chainSwapResponse.id,
      status: LdsBridgeStatus.Pending,
      direction: BitcoinBridgeDirection.BitcoinToCitrea,
    },
    chainSwapResponse.id,
  )

  yield* call([ldsBridge, ldsBridge.waitForSwapUntilState], chainSwapResponse.id, LdsSwapStatus.TransactionConfirmed)
  if (onSuccess) {
    yield* call(onSuccess)
  }
  const { claimTx: txHash } = yield* call([ldsBridge, ldsBridge.autoClaimSwap], chainSwapResponse.id)

  popupRegistry.addPopup(
    {
      type: PopupType.BitcoinBridge,
      id: txHash!,
      status: LdsBridgeStatus.Confirmed,
      direction: BitcoinBridgeDirection.BitcoinToCitrea,
    },
    txHash!,
  )
}
