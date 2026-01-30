import { BigNumber } from 'bignumber.js'
import { popupRegistry } from 'components/Popups/registry'
import { LdsBridgeStatus, PopupType } from 'components/Popups/types'
import { ensureCorrectChain } from 'state/sagas/transactions/chainSwitchUtils'
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
import { LightningBridgeSubmarineStep } from 'uniswap/src/features/transactions/swap/steps/lightningBridge'
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
}

export function* handleLightningBridgeSubmarine(params: HandleLightningBridgeSubmarineParams) {
  const { step, setCurrentStep, trade, account, destinationAddress, selectChain, onTransactionHash, onSuccess } = params

  const outputAmountBTC = new BigNumber(trade.outputAmount.toExact())

  const invoiceResponse = yield* call(fetchLightningInvoice, {
    amount: btcToSat(outputAmountBTC).toString(),
    lnLikeAddress: destinationAddress || '',
  })

  const {
    invoice: { paymentRequest: invoice, paymentHash: preimageHash },
  } = invoiceResponse

  const ldsBridge = getLdsBridgeManager()
  const submarineSwap = yield* call([ldsBridge, ldsBridge.createSubmarineSwap], {
    invoice,
  })

  // Ensure wallet is on Citrea before signing the lockup transaction
  const citreaChainId = trade.inputAmount.currency.chainId as UniverseChainId
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

  setCurrentStep({ step, accepted: true })

  popupRegistry.addPopup(
    {
      type: PopupType.LightningBridge,
      id: evmTxResult.hash,
      direction: LightningBridgeDirection.Submarine,
      status: LdsBridgeStatus.Pending,
    },
    evmTxResult.hash,
  )

  if (onSuccess) {
    yield* call(onSuccess)
  }

  yield* call(pollForClaimablePreimage, preimageHash)

  popupRegistry.addPopup(
    {
      type: PopupType.LightningBridge,
      id: preimageHash,
      direction: LightningBridgeDirection.Submarine,
      status: LdsBridgeStatus.Confirmed,
    },
    preimageHash,
  )
}
