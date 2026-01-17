import { call } from 'typed-redux-saga'
import {
  buildErc20LockupTx,
  claimErc20Swap,
  getLdsBridgeManager,
  LdsSwapStatus,
} from 'uniswap/src/features/lds-bridge'
import { Erc20ChainSwapDirection } from 'uniswap/src/data/apiClients/tradingApi/utils/isBitcoinBridge'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { Erc20ChainSwapStep } from 'uniswap/src/features/transactions/swap/steps/erc20ChainSwap'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { getSigner } from 'state/sagas/transactions/utils'

const CONTRACTS = {
  polygon: {
    swap: '0x2E21F58Da58c391F110467c7484EdfA849C1CB9B',
    token: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  },
  citrea: {
    swap: '0xf2e019a371e5Fd32dB2fC564Ad9eAE9E433133cc',
    token: '0xFdB0a83d94CD65151148a131167Eb499Cb85d015',
  },
}

interface HandleErc20ChainSwapParams {
  step: Erc20ChainSwapStep
  setCurrentStep: SetCurrentStepFn
  trade: Trade
  account: AccountDetails
  onTransactionHash?: (hash: string) => void
  onSuccess?: () => void
}

export function* handleErc20ChainSwap(params: HandleErc20ChainSwapParams) {
  const { step, setCurrentStep, trade, account, onTransactionHash, onSuccess } = params
  const isPolygonToCitrea = step.direction === Erc20ChainSwapDirection.PolygonToCitrea

  const from = isPolygonToCitrea ? 'USDT_POLYGON' : 'JUSD_CITREA'
  const to = isPolygonToCitrea ? 'JUSD_CITREA' : 'USDT_POLYGON'
  const sourceChain = isPolygonToCitrea ? 'polygon' : 'citrea'
  const targetChain = isPolygonToCitrea ? 'citrea' : 'polygon'

  const ldsBridge = getLdsBridgeManager()

  // 1. Create swap (convert 6→8 decimals for API)
  const inputAmount = trade.inputAmount.quotient.toString()
  const userLockAmount = Number(inputAmount) * 100 // 6 → 8 decimals

  const chainSwap = yield* call([ldsBridge, ldsBridge.createChainSwap], {
    from,
    to,
    claimAddress: account.address,
    userLockAmount,
  })

  setCurrentStep({ step, accepted: true })

  // 2. Lock on source chain
  const sourceSigner = yield* call(getSigner, account.address)

  const lockResult = yield* call(buildErc20LockupTx, {
    signer: sourceSigner,
    contractAddress: CONTRACTS[sourceChain].swap,
    tokenAddress: CONTRACTS[sourceChain].token,
    preimageHash: chainSwap.preimageHash,
    amount: BigInt(inputAmount), // 6 decimals for contract
    claimAddress: chainSwap.lockupDetails.claimAddress!,
    timelock: chainSwap.lockupDetails.timeoutBlockHeight,
  })

  if (onTransactionHash) {
    onTransactionHash(lockResult.hash)
  }

  // 3. Wait for Boltz to lock on target chain
  yield* call(
    [ldsBridge, ldsBridge.waitForSwapUntilState],
    chainSwap.id,
    LdsSwapStatus.TransactionServerMempool,
  )

  yield* call(
    [ldsBridge, ldsBridge.waitForSwapUntilState],
    chainSwap.id,
    LdsSwapStatus.TransactionConfirmed,
  )

  // 4. Claim on target chain (convert 8→6 decimals for contract)
  const targetSigner = yield* call(getSigner, account.address)
  const claimAmount = BigInt(chainSwap.claimDetails.amount) / 100n // 8 → 6 decimals

  yield* call(claimErc20Swap, {
    signer: targetSigner,
    contractAddress: CONTRACTS[targetChain].swap,
    tokenAddress: CONTRACTS[targetChain].token,
    preimage: chainSwap.preimage,
    amount: claimAmount,
    refundAddress: chainSwap.claimDetails.refundAddress!,
    timelock: chainSwap.claimDetails.timeoutBlockHeight,
  })

  if (onSuccess) {
    yield* call(onSuccess)
  }
}
