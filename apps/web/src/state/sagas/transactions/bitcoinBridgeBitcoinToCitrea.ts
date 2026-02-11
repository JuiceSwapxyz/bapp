import BigNumber from 'bignumber.js'
import { popupRegistry } from 'components/Popups/registry'
import { BitcoinBridgeDirection, LdsBridgeStatus, PopupType } from 'components/Popups/types'
import { JuiceswapAuthFunctions } from 'state/sagas/transactions/swapSaga'
import { call } from 'typed-redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { LdsSwapStatus, btcToSat, getLdsBridgeManager } from 'uniswap/src/features/lds-bridge'
import { TransactionStepFailedError } from 'uniswap/src/features/transactions/errors'
import {
  BitcoinBridgeBitcoinToCitreaStep,
  BtcToCitreaSubStep,
} from 'uniswap/src/features/transactions/swap/steps/bitcoinBridge'
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
  auth: JuiceswapAuthFunctions
}

export function* handleBitcoinBridgeBitcoinToCitrea(params: HandleBitcoinBridgeBitcoinToCitreaParams) {
  const { step, setCurrentStep, trade, account, onSuccess, auth } = params

  const userLockAmount = btcToSat(new BigNumber(trade.inputAmount.toExact())).toNumber()
  const ldsBridge = getLdsBridgeManager()
  const claimAddress = account.address
  const citreaChainId = trade.outputAmount.currency.chainId as UniverseChainId

  // --- Auth check ---
  setCurrentStep({
    step: { ...step, subStep: BtcToCitreaSubStep.CheckingAuth },
    accepted: false,
  })

  const isAuthenticated = auth.getIsAuthenticated(account.address)

  if (!isAuthenticated) {
    setCurrentStep({
      step: { ...step, subStep: BtcToCitreaSubStep.WaitingForAuth },
      accepted: false,
    })

    setCurrentStep({
      step: { ...step, subStep: BtcToCitreaSubStep.Authenticating },
      accepted: false,
    })

    const authResult = yield* call(auth.handleAuthenticate)
    if (!authResult) {
      throw new TransactionStepFailedError({
        message: 'Authentication failed. Please sign the message to continue.',
        step,
        originalError: new Error('Authentication rejected'),
      })
    }
  }

  // --- Invoice ---
  setCurrentStep({
    step: { ...step, subStep: BtcToCitreaSubStep.ShowingInvoice },
    accepted: false,
  })

  const chainSwapResponse = yield* call([ldsBridge, ldsBridge.createChainSwap], {
    from: 'BTC',
    to: 'cBTC',
    claimAddress,
    userLockAmount,
    chainId: citreaChainId,
    userId: account.address,
  })

  step.backendAccepted = true
  step.bip21 = chainSwapResponse.lockupDetails.bip21
  setCurrentStep({ step: { ...step, subStep: BtcToCitreaSubStep.ShowingInvoice }, accepted: true })

  // --- Wait for mempool (Lock) ---
  yield* call([ldsBridge, ldsBridge.waitForSwapUntilState], chainSwapResponse.id, LdsSwapStatus.TransactionMempool)

  setCurrentStep({
    step: { ...step, subStep: BtcToCitreaSubStep.WaitingForMempool },
    accepted: true,
  })

  popupRegistry.addPopup(
    {
      type: PopupType.BitcoinBridge,
      id: chainSwapResponse.id,
      status: LdsBridgeStatus.Pending,
      direction: BitcoinBridgeDirection.BitcoinToCitrea,
      url: '/bridge-swaps',
    },
    chainSwapResponse.id,
  )

  // --- Claim ---
  yield* call([ldsBridge, ldsBridge.waitForSwapUntilState], chainSwapResponse.id, LdsSwapStatus.TransactionConfirmed)

  setCurrentStep({
    step: { ...step, subStep: BtcToCitreaSubStep.Claiming },
    accepted: true,
  })

  const { claimTx: txHash } = yield* call([ldsBridge, ldsBridge.autoClaimSwap], chainSwapResponse.id)

  setCurrentStep({
    step: { ...step, subStep: BtcToCitreaSubStep.Complete },
    accepted: true,
  })

  popupRegistry.addPopup(
    {
      type: PopupType.BitcoinBridge,
      id: txHash!,
      status: LdsBridgeStatus.Confirmed,
      direction: BitcoinBridgeDirection.BitcoinToCitrea,
      url: '/bridge-swaps',
    },
    txHash!,
  )

  if (onSuccess) {
    yield* call(onSuccess)
  }
}
