import { BigNumber } from 'bignumber.js'
import { buildEvmLockupTx } from 'state/sagas/transactions/buildEvmLockupTx'
import { generateChainSwapKeys } from 'state/sagas/transactions/chainSwapKeys'
import { getSigner } from 'state/sagas/transactions/utils'
import { btcToSat } from 'state/sagas/utils/lightningUtils'
import { call } from 'typed-redux-saga'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import {
  LightningBridgeSubmarineGetResponse,
  LightningBridgeSubmarineLockResponse,
} from 'uniswap/src/data/apiClients/tradingApi/utils/lightningBridge'
import { BridgeQuote } from 'uniswap/src/data/tradingApi/__generated__'
import { LightningBridgeDirection, LightningInvoice } from 'uniswap/src/data/tradingApi/types'
import { LightningBridgeTransactionStep } from 'uniswap/src/features/transactions/swap/steps/lightningBridge'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'

interface HandleLightningBridgeParams {
  step: LightningBridgeTransactionStep
  setCurrentStep: SetCurrentStepFn
  trade: Trade
  account: AccountDetails
  destinationAddress?: string
  onTransactionHash?: (hash: string) => void
}

const tradingApiClient = createApiClient({
  baseUrl: uniswapUrls.tradingApiUrl,
})

const lightningBridgeApiClient = createApiClient({
  baseUrl: `${process.env.REACT_APP_LDS_API_URL}/swap/v2`,
})

export function* handleLightningBridge(params: HandleLightningBridgeParams) {
  const direction = (params.trade.quote.quote as BridgeQuote).direction

  if (direction === LightningBridgeDirection.Submarine) {
    yield* call(handleLightningBridgeSubmarine, params)
  } else {
    yield* call(handleLightningBridgeReverse, params)
  }
}

export function* handleLightningBridgeSubmarine(params: HandleLightningBridgeParams) {
  const { step, setCurrentStep, trade, account, destinationAddress, onTransactionHash } = params

  const submarineResponse = yield* call(
    lightningBridgeApiClient.get<LightningBridgeSubmarineGetResponse>,
    '/swap/submarine',
  )
  const pairHash = submarineResponse.cBTC.BTC.hash
  const outputAmountBTC = new BigNumber(trade.outputAmount.toExact())

  const invoiceResponse: LightningInvoice = yield* call(
    tradingApiClient.post<LightningInvoice>,
    '/v1/lightning/invoice',
    {
      body: JSON.stringify({
        amount: btcToSat(outputAmountBTC).toString(),
        lnLikeAddress: destinationAddress,
      }),
    },
  )
  const {
    invoice: { paymentRequest: invoice, paymentHash: preimageHash },
  } = invoiceResponse
  const { claimPublicKey: refundPublicKey } = generateChainSwapKeys()

  const lockupResponse = yield* call(
    lightningBridgeApiClient.post<LightningBridgeSubmarineLockResponse>,
    '/swap/submarine',
    {
      body: JSON.stringify({
        from: 'cBTC',
        to: 'BTC',
        invoice,
        pairHash,
        referralId: 'boltz_webapp_desktop',
        refundPublicKey,
      }),
    },
  )

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
    yield* call(onTransactionHash, evmTxResult.hash)
  }

  setCurrentStep({ step, accepted: true })
}

export function handleLightningBridgeReverse(_params: HandleLightningBridgeParams): void {
  // TODO: Implement reverse lightning bridge
  throw new Error('Lightning bridge reverse not implemented yet')
}
