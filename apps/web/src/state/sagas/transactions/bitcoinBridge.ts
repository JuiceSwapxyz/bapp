import { randomBytes } from '@ethersproject/random'
import { BigNumber } from 'bignumber.js'
import { address, crypto, networks, Transaction } from 'bitcoinjs-lib'
import {
  ClaimDetails,
  constructClaimTransaction,
  detectSwap,
  OutputType,
  SwapTreeSerializer,
  TaprootUtils,
} from 'boltz-core'
import { hashForWitnessV1 } from 'boltz-core/dist/lib/swap/TaprootUtils'
import { Buffer } from 'buffer'
import { popupRegistry } from 'components/Popups/registry'
import { BitcoinBridgeDirection, LdsBridgeStatus, PopupType } from 'components/Popups/types'
import { generateChainSwapKeys } from 'state/sagas/transactions/chainSwapKeys'
import { getSigner } from 'state/sagas/transactions/utils'
import { createMusig } from 'state/sagas/utils/buildChainSwapClaim'
import { buildEvmLockupTx } from 'state/sagas/utils/buildEvmLockupTx'
import { btcToSat } from 'state/sagas/utils/lightningUtils'
import { call } from 'typed-redux-saga'
import {
  broadcastChainSwap,
  createChainSwap,
  fetchChainPairs,
  fetchChainTransactionsBySwapId,
  postClaimChainSwap,
} from 'uniswap/src/data/apiClients/LdsApi/LdsApiClient'
import { createLdsSocketClient, LdsSwapStatus } from 'uniswap/src/data/socketClients/ldsSocket'
import { BitcoinBridgeLockTransactionStep } from 'uniswap/src/features/transactions/swap/steps/bitcoinBridge'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'

interface HandleBitcoinBridgeLockTransactionStepParams {
  step: BitcoinBridgeLockTransactionStep
  setCurrentStep: SetCurrentStepFn
  trade: Trade
  account: AccountDetails
  destinationAddress?: string
  onTransactionHash?: (hash: string) => void
  onSuccess?: () => void
}

export function* handleBitcoinBridgeLockTransactionStep(params: HandleBitcoinBridgeLockTransactionStepParams) {
  const { destinationAddress: claimAddress, trade, account, onSuccess, onTransactionHash } = params

  if (!claimAddress) {
    throw new Error('Claim address is required for Bitcoin bridge swap')
  }

  const { claimPublicKey, claimKeyPair } = generateChainSwapKeys(undefined, 2)

  const preimage = randomBytes(32)
  const preimageHash = crypto.sha256(Buffer.from(preimage)).toString('hex')
  const chainPairs = yield* call(fetchChainPairs)
  const pairHash = chainPairs.cBTC.BTC.hash
  const userLockAmount = btcToSat(new BigNumber(trade.inputAmount.toExact())).toNumber()

  const chainSwapResponse = yield* call(createChainSwap, {
    from: 'cBTC',
    to: 'BTC',
    preimageHash,
    claimPublicKey,
    claimAddress,
    pairHash,
    referralId: 'boltz_webapp_desktop',
    userLockAmount,
  })

  const ldsSocket = createLdsSocketClient()
  yield* call(ldsSocket.subscribeToSwapUntil, chainSwapResponse.id, LdsSwapStatus.SwapCreated)

  const signer = yield* call(getSigner, account.address)

  const evmTxResult = yield* call(buildEvmLockupTx, {
    signer,
    contractAddress: chainSwapResponse.lockupDetails.lockupAddress,
    preimageHash,
    claimAddress: chainSwapResponse.lockupDetails.claimAddress,
    timeoutBlockHeight: chainSwapResponse.lockupDetails.timeoutBlockHeight,
    amountSatoshis: chainSwapResponse.lockupDetails.amount,
  })

  yield* call(ldsSocket.subscribeToSwapUntil, chainSwapResponse.id, LdsSwapStatus.TransactionServerMempool)

  if (onTransactionHash) {
    onTransactionHash(evmTxResult.hash)
  }

  popupRegistry.addPopup(
    {
      type: PopupType.BitcoinBridge,
      id: chainSwapResponse.id,
      status: LdsBridgeStatus.Pending,
      direction: BitcoinBridgeDirection.CitreaToBitcoin,
    },
    chainSwapResponse.id,
  )

  if (onSuccess) {
    yield* call(onSuccess)
  }

  const chainTransactionsResponse = yield* call(fetchChainTransactionsBySwapId, chainSwapResponse.id)

  const { claimDetails } = chainSwapResponse
  const lockupTxHex = chainTransactionsResponse.serverLock?.transaction.hex
  const boltzRefundPublicKey = Buffer.from(Buffer.from(claimDetails.serverPublicKey, 'hex'))
  const ourClaimMusig = yield* call(createMusig, claimKeyPair, boltzRefundPublicKey)
  const claimTree = SwapTreeSerializer.deserializeSwapTree(claimDetails.swapTree)
  const tweakedKey = TaprootUtils.tweakMusig(ourClaimMusig, claimTree.tree)
  const lockupTx = Transaction.fromHex(lockupTxHex as string)
  const swapOutput = detectSwap(tweakedKey, lockupTx as any)

  const details: ClaimDetails = {
    ...swapOutput,
    cooperative: true,
    swapTree: claimTree,
    keys: claimKeyPair,
    type: OutputType.Taproot,
    txHash: lockupTx.getHash(),
    internalKey: ourClaimMusig.getAggregatedPublicKey(),
    preimage,
  } as any

  const decodedAddress = Buffer.from(address.toOutputScript(claimAddress, networks.bitcoin))
  const expectedAmount = btcToSat(new BigNumber(trade.outputAmount.toExact())).toNumber()
  const feeBudget = details.value - expectedAmount
  const claimTx = constructClaimTransaction([details], decodedAddress, feeBudget, true)

  const postClaimChainSwapResponse = yield* call(postClaimChainSwap, chainSwapResponse.id, {
    preimage: Buffer.from(preimage).toString('hex'),
    toSign: {
      index: 0,
      transaction: claimTx.toHex(),
      pubNonce: Buffer.from(ourClaimMusig.getPublicNonce()).toString('hex'),
    },
  })

  const theirPublicNonce = Buffer.from(Buffer.from(postClaimChainSwapResponse.pubNonce, 'hex'))
  ourClaimMusig.aggregateNoncesOrdered([theirPublicNonce, ourClaimMusig.getPublicNonce()])
  ourClaimMusig.initializeSession(hashForWitnessV1([details], claimTx, 0))
  ourClaimMusig.addPartial(0, Buffer.from(postClaimChainSwapResponse.partialSignature, 'hex'))
  ourClaimMusig.signPartial()
  claimTx.ins[0].witness = [ourClaimMusig.aggregatePartials()]

  yield* call(broadcastChainSwap, claimTx.toHex())

  ldsSocket.disconnect()
}
