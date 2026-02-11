import { BigNumber } from 'bignumber.js'
import { popupRegistry } from 'components/Popups/registry'
import { LdsBridgeStatus, PopupType } from 'components/Popups/types'
import { ensureCorrectChain } from 'state/sagas/transactions/chainSwitchUtils'
import { JuiceswapAuthFunctions } from 'state/sagas/transactions/swapSaga'
import { getSigner } from 'state/sagas/transactions/utils'
import { call } from 'typed-redux-saga'
import { fetchLightningInvoice } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { LightningBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  btcToSat,
  buildEvmLockupTx,
  getLdsBridgeManager,
  pollForClaimablePreimage,
} from 'uniswap/src/features/lds-bridge'
import { ASSET_CHAIN_ID_MAP } from 'uniswap/src/features/lds-bridge/LdsBridgeManager'
import { TransactionStepFailedError } from 'uniswap/src/features/transactions/errors'
import {
  LightningBridgeSubmarineStep,
  LnSubmarineSubStep,
} from 'uniswap/src/features/transactions/swap/steps/lightningBridge'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'

interface HandleLightningBridgeSubmarineParams {
  step: LightningBridgeSubmarineStep
  setCurrentStep: SetCurrentStepFn
  trade: Trade
  account: AccountDetails
  destinationAddress?: string
  selectChain: (chainId: UniverseChainId) => Promise<boolean>
  onTransactionHash?: (hash: string) => void
  onSuccess?: () => void
  auth: JuiceswapAuthFunctions
}

export function* handleLightningBridgeSubmarine(params: HandleLightningBridgeSubmarineParams) {
  const { step, setCurrentStep, trade, account, destinationAddress, selectChain, onTransactionHash, onSuccess, auth } =
    params

  // --- Auth check ---
  setCurrentStep({
    step: { ...step, subStep: LnSubmarineSubStep.CheckingAuth },
    accepted: false,
  })

  const isAuthenticated = auth.getIsAuthenticated(account.address)

  if (!isAuthenticated) {
    setCurrentStep({
      step: { ...step, subStep: LnSubmarineSubStep.WaitingForAuth },
      accepted: false,
    })

    setCurrentStep({
      step: { ...step, subStep: LnSubmarineSubStep.Authenticating },
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

  // --- Lock ---
  setCurrentStep({
    step: { ...step, subStep: LnSubmarineSubStep.LockingTokens },
    accepted: false,
  })

  const outputAmountBTC = new BigNumber(trade.outputAmount.toExact())

  const invoiceResponse = yield* call(fetchLightningInvoice, {
    amount: btcToSat(outputAmountBTC).toString(),
    lnLikeAddress: destinationAddress || '',
  })

  const {
    invoice: { paymentRequest: invoice, paymentHash: preimageHash },
  } = invoiceResponse

  const ldsBridge = getLdsBridgeManager()
  const citreaChainId = trade.inputAmount.currency.chainId as UniverseChainId
  const submarineSwap = yield* call([ldsBridge, ldsBridge.createSubmarineSwap], {
    invoice,
    chainId: citreaChainId,
    userId: account.address,
  })

  step.backendAccepted = true

  // Ensure wallet is on Citrea before signing the lockup transaction
  yield* call(ensureCorrectChain, {
    targetChainId: citreaChainId,
    selectChain,
    step,
    chainDisplayName: 'Citrea',
  })

  const signer = yield* call(getSigner, account.address)
  const evmTxResult = yield* call(buildEvmLockupTx, {
    signer,
    contractAddress: submarineSwap.address,
    preimageHash,
    claimAddress: submarineSwap.claimAddress,
    timeoutBlockHeight: submarineSwap.timeoutBlockHeight,
    amountSatoshis: submarineSwap.expectedAmount,
  })

  if (onTransactionHash) {
    onTransactionHash(evmTxResult.hash)
  }

  setCurrentStep({ step: { ...step, subStep: LnSubmarineSubStep.LockingTokens }, accepted: true })

  popupRegistry.addPopup(
    {
      type: PopupType.LightningBridge,
      id: evmTxResult.hash,
      direction: LightningBridgeDirection.Submarine,
      status: LdsBridgeStatus.Pending,
    },
    evmTxResult.hash,
  )

  // --- Bridge ---
  setCurrentStep({
    step: { ...step, subStep: LnSubmarineSubStep.WaitingForBridge },
    accepted: true,
  })

  const chainId = ASSET_CHAIN_ID_MAP[submarineSwap.assetReceive]
  yield* call(pollForClaimablePreimage, preimageHash, chainId)

  // --- Complete ---
  setCurrentStep({
    step: { ...step, subStep: LnSubmarineSubStep.Complete },
    accepted: true,
  })

  popupRegistry.removePopup(evmTxResult.hash)

  popupRegistry.addPopup(
    {
      type: PopupType.LightningBridge,
      id: preimageHash,
      direction: LightningBridgeDirection.Submarine,
      status: LdsBridgeStatus.Confirmed,
    },
    preimageHash,
  )

  if (onSuccess) {
    yield* call(onSuccess)
  }
}
