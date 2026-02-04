import { BigNumber } from 'bignumber.js'
import { address, networks, Transaction } from 'bitcoinjs-lib'
import { constructClaimTransaction } from 'boltz-core'
import { Buffer } from 'buffer'
import { popupRegistry } from 'components/Popups/registry'
import { BitcoinBridgeDirection, LdsBridgeStatus, PopupType } from 'components/Popups/types'
import { ensureCorrectChain } from 'state/sagas/transactions/chainSwitchUtils'
import { getSigner } from 'state/sagas/transactions/utils'
import { call } from 'typed-redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  broadcastChainSwap,
  btcToSat,
  buildClaimDetails,
  buildEvmLockupTx,
  fetchChainTransactionsBySwapId,
  getLdsBridgeManager,
  LdsSwapStatus,
  prepareClaimMusig,
} from 'uniswap/src/features/lds-bridge'
import { BitcoinBridgeCitreaToBitcoinStep } from 'uniswap/src/features/transactions/swap/steps/bitcoinBridge'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'

interface HandleBitcoinBridgeCitreaToBitcoinParams {
  step: BitcoinBridgeCitreaToBitcoinStep
  setCurrentStep: SetCurrentStepFn
  trade: Trade
  account: AccountDetails
  destinationAddress?: string
  selectChain: (chainId: UniverseChainId) => Promise<boolean>
  onTransactionHash?: (hash: string) => void
  onSuccess?: () => void
}

export function* handleBitcoinBridgeCitreaToBitcoin(params: HandleBitcoinBridgeCitreaToBitcoinParams) {
  const { step, destinationAddress: claimAddress, trade, account, selectChain, onSuccess, onTransactionHash } = params

  if (!claimAddress) {
    throw new Error('Claim address is required for Bitcoin bridge swap')
  }

  const ldsBridge = getLdsBridgeManager()
  const userLockAmount = btcToSat(new BigNumber(trade.inputAmount.toExact())).toNumber()
  const citreaChainId = trade.inputAmount.currency.chainId as UniverseChainId

  const chainSwap = yield* call([ldsBridge, ldsBridge.createChainSwap], {
    from: 'cBTC',
    to: 'BTC',
    claimAddress,
    userLockAmount,
    chainId: citreaChainId,
  })

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
    contractAddress: chainSwap.lockupDetails.lockupAddress,
    preimageHash: chainSwap.preimageHash,
    claimAddress: chainSwap.lockupDetails.claimAddress,
    timeoutBlockHeight: chainSwap.lockupDetails.timeoutBlockHeight,
    amountSatoshis: chainSwap.lockupDetails.amount,
  })

  if (onTransactionHash && evmTxResult.hash) {
    onTransactionHash(evmTxResult.hash)
  }

  popupRegistry.addPopup(
    {
      type: PopupType.BitcoinBridge,
      id: chainSwap.id,
      status: LdsBridgeStatus.Pending,
      direction: BitcoinBridgeDirection.CitreaToBitcoin,
      url: '/bridge-swaps',
    },
    chainSwap.id,
  )

  yield* call([ldsBridge, ldsBridge.waitForSwapUntilState], chainSwap.id, LdsSwapStatus.TransactionServerMempool)

  const chainTransactionsResponse = yield* call(fetchChainTransactionsBySwapId, chainSwap.id)

  if (onSuccess) {
    yield* call(onSuccess)
  }

  const lockupTxHex = chainTransactionsResponse.serverLock?.transaction.hex
  const lockupTx = Transaction.fromHex(lockupTxHex as string)

  const { claimKeyPair } = yield* call([ldsBridge, ldsBridge.getKeysForSwap], chainSwap.id)
  const {
    musig: ourClaimMusig,
    tweakedKey,
    swapTree: claimTree,
  } = yield* call(prepareClaimMusig, claimKeyPair, chainSwap)

  const details = buildClaimDetails({
    tweakedKey,
    lockupTx,
    swapTree: claimTree,
    claimKeyPair,
    musig: ourClaimMusig,
    preimage: Buffer.from(chainSwap.preimage, 'hex'),
    cooperative: false,
  })

  const decodedAddress = Buffer.from(address.toOutputScript(claimAddress, networks.bitcoin))
  const expectedAmount = btcToSat(new BigNumber(trade.outputAmount.toExact())).toNumber()
  const feeBudget = details.value - expectedAmount
  const claimTx = constructClaimTransaction([details], decodedAddress, feeBudget, false)

  //
  // // TODO: Re-enable when LDS accept zero conf claims for this chain swap
  // const postClaimChainSwapResponse = yield* call(postClaimChainSwap, chainSwap.id, {
  // preimage: chainSwap.preimage,
  // toSign: {
  //     index: 0,
  //     transaction: claimTx.toHex(),
  //     pubNonce: Buffer.from(ourClaimMusig.getPublicNonce()).toString('hex'),
  // },
  // })
  //
  // const aggregatedSignature = completeCollaborativeSigning({
  // musig: ourClaimMusig,
  // serverPubNonce: Buffer.from(postClaimChainSwapResponse.pubNonce, 'hex'),
  // serverPartialSignature: Buffer.from(postClaimChainSwapResponse.partialSignature, 'hex'),
  // claimDetails: [details],
  // claimTx,
  // inputIndex: 0,
  // })
  // claimTx.ins[0].witness = [aggregatedSignature]
  //

  const { id: txHash } = yield* call(broadcastChainSwap, claimTx.toHex())
  yield* call(ldsBridge.updateSwapClaimTx, chainSwap.id, txHash)

  popupRegistry.removePopup(chainSwap.id)

  const explorerUrl = getExplorerLink({
    chainId: UniverseChainId.Bitcoin,
    data: txHash,
    type: ExplorerDataType.TRANSACTION,
  })

  popupRegistry.addPopup(
    {
      type: PopupType.BitcoinBridge,
      id: txHash,
      status: LdsBridgeStatus.Confirmed,
      direction: BitcoinBridgeDirection.CitreaToBitcoin,
      url: explorerUrl,
    },
    txHash,
  )
}
