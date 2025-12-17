import { BigNumber } from 'bignumber.js'
import { popupRegistry } from 'components/Popups/registry'
import { LightningBridgeStatus, PopupType } from 'components/Popups/types'
import { buildEvmLockupTx } from 'state/sagas/transactions/buildEvmLockupTx'
import { generateChainSwapKeys } from 'state/sagas/transactions/chainSwapKeys'
import { pollForClaimablePreimage } from 'state/sagas/transactions/lightningBridgePolling'
import { getSigner } from 'state/sagas/transactions/utils'
import { btcToSat } from 'state/sagas/utils/lightningUtils'
import { call } from 'typed-redux-saga'
import {
  createSubmarineSwap,
  fetchSubmarinePairs,
} from 'uniswap/src/data/apiClients/lightningBridge/LightningBridgeApiClient'
import { fetchLightningInvoice } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { LightningBridgeDirection } from 'uniswap/src/data/tradingApi/types'
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
  onTransactionHash?: (hash: string) => void
  onSuccess?: () => void
}

export function* handleLightningBridgeSubmarine(params: HandleLightningBridgeSubmarineParams) {
  const { step, setCurrentStep, trade, account, destinationAddress, onTransactionHash, onSuccess } = params

  const submarineResponse = yield* call(fetchSubmarinePairs)
  const pairHash = submarineResponse.cBTC.BTC.hash
  const outputAmountBTC = new BigNumber(trade.outputAmount.toExact())

  const invoiceResponse = yield* call(fetchLightningInvoice, {
    amount: btcToSat(outputAmountBTC).toString(),
    lnLikeAddress: destinationAddress || '',
  })

  const {
    invoice: { paymentRequest: invoice, paymentHash: preimageHash },
  } = invoiceResponse

  const { claimPublicKey: refundPublicKey } = generateChainSwapKeys()

  const lockupResponse = yield* call(createSubmarineSwap, {
    from: 'cBTC',
    to: 'BTC',
    invoice,
    pairHash,
    referralId: 'boltz_webapp_desktop',
    refundPublicKey,
  })

  const signer = yield* call(getSigner, account.address)

  const evmTxResult = yield* call(buildEvmLockupTx, {
    signer,
    contractAddress: lockupResponse.address,
    preimageHash,
    claimAddress: lockupResponse.claimAddress,
    timeoutBlockHeight: lockupResponse.timeoutBlockHeight,
    amountSatoshis: lockupResponse.expectedAmount,
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
      status: LightningBridgeStatus.Pending,
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
      status: LightningBridgeStatus.Confirmed,
    },
    preimageHash,
  )
}
