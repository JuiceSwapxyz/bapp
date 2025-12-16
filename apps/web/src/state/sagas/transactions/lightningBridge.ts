import { BigNumber } from 'bignumber.js'
import { popupRegistry } from 'components/Popups/registry'
import { LightningBridgeStatus, PopupType } from 'components/Popups/types'
import { retry, RetryableError } from 'state/activity/polling/retry'
import { buildEvmLockupTx, prefix0x } from 'state/sagas/transactions/buildEvmLockupTx'
import { generateChainSwapKeys } from 'state/sagas/transactions/chainSwapKeys'
import { getSigner } from 'state/sagas/transactions/utils'
import { btcToSat } from 'state/sagas/utils/lightningUtils'
import { call, put, race } from 'typed-redux-saga'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import {
  LightningBridgeReverseGetResponse,
  LightningBridgeSubmarineGetResponse,
  LightningBridgeSubmarineLockResponse,
} from 'uniswap/src/data/apiClients/tradingApi/utils/lightningBridge'
import { LdsSwapStatus, createLdsSocketClient } from 'uniswap/src/data/socketClients/ldsSocket'
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
  onSuccess?: () => void
}

const tradingApiClient = createApiClient({
  baseUrl: uniswapUrls.tradingApiUrl,
})

const lightningBridgeApiClient = createApiClient({
  baseUrl: `${process.env.REACT_APP_LDS_API_URL}/swap/v2`,
})

const ponderClaim = createApiClient({
  baseUrl: 'http://localhost:42069',
})

const pollPonderForLockup = (preimageHash: string) => {
  return retry(async () => {
    const response = await ponderClaim.post<{ data: { lockups: { preimageHash: string }[] } }>('/', {
      body: JSON.stringify({
        operationName: 'LockupQuery',
        query: `query LockupQuery {
          lockups(preimageHash: "${prefix0x(preimageHash)}") {
            preimageHash
          }
        }`,
      }),
    })
    
    if (!response?.data?.lockups) {
      throw new RetryableError('Lockup not found yet, retrying...')
    }
    
    return response.data.lockups
  }, {
    n: 100,
    minWait: 7000,
    medWait: 7000,
    maxWait: 7000,
  })
} 

export function* handleLightningBridge(params: HandleLightningBridgeParams) {
  const direction = (params.trade.quote.quote as BridgeQuote).direction

  if (direction === LightningBridgeDirection.Submarine) {
    yield* call(handleLightningBridgeSubmarine, params)
  } else {
    yield* call(handleLightningBridgeReverse, params)
  }
}

export function* handleLightningBridgeSubmarine(params: HandleLightningBridgeParams) {
  const { step, setCurrentStep, trade, account, destinationAddress, onTransactionHash, onSuccess } = params

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
    onTransactionHash(evmTxResult.hash)
  }

  setCurrentStep({ step, accepted: true })

  popupRegistry.addPopup(
    {
      type: PopupType.LightningBridge,
      id: evmTxResult.hash,
      direction: LightningBridgeDirection.Submarine,
      status: LightningBridgeStatus.Pending
    },
    evmTxResult.hash,
  )

  if (onSuccess) {
    yield* call(onSuccess)
  }
}

export function* handleLightningBridgeReverse(params: HandleLightningBridgeParams) {
  const { step, setCurrentStep, trade, account, onSuccess } = params

  const reverseResponse = yield* call(lightningBridgeApiClient.get<LightningBridgeReverseGetResponse>, '/swap/reverse')

  const pairHash = reverseResponse.BTC.cBTC.hash
  const invoiceAmount = Number(btcToSat(new BigNumber(trade.inputAmount.toExact())))
  const { preimageHash, preimage } = generateChainSwapKeys()
  const claimAddress = account.address

  const reverseInvoiceResponse = yield* call(
    lightningBridgeApiClient.post<{ invoice: string; id: string }>,
    '/swap/reverse',
    {
      body: JSON.stringify({
        from: 'BTC',
        to: 'cBTC',
        pairHash,
        preimageHash,
        claimAddress,
        invoiceAmount,
      }),
    },
  )

  const ldsSocket = createLdsSocketClient()
  yield* call(ldsSocket.subscribeToSwapUntil, reverseInvoiceResponse.id, LdsSwapStatus.SwapCreated)
  step.invoice = reverseInvoiceResponse.invoice as string
  setCurrentStep({ step, accepted: true })

  const { promise: ponderPromise, cancel: cancelPonderPolling } = pollPonderForLockup(preimageHash)

  yield* race({
    transactionConfirmed: call(ldsSocket.subscribeToSwapUntil, reverseInvoiceResponse.id, LdsSwapStatus.TransactionConfirmed),
    ponderConfirmed: call(() => ponderPromise),
  })

  popupRegistry.addPopup(
    {
      type: PopupType.LightningBridge,
      id: reverseInvoiceResponse.id,
      direction: LightningBridgeDirection.Reverse,
      status: LightningBridgeStatus.Pending
    },
    reverseInvoiceResponse.id,
  )

  if (onSuccess) {
    yield* call(onSuccess)
  }

  ldsSocket.disconnect()

  yield* call(() => ponderPromise)
  cancelPonderPolling()

  // this returns {txHash: string} that we can use later
  yield* call(() => ponderClaim.post<{ preimage: string; preimageHash: string }>('/help-me-claim', {
    body: JSON.stringify({
      preimage,
      preimageHash: prefix0x(preimageHash),
    }),
  }))
}
