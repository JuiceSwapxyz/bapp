import { BigNumber } from 'bignumber.js'
import { popupRegistry } from 'components/Popups/registry'
import { LdsBridgeStatus, PopupType } from 'components/Popups/types'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { clientToProvider } from 'hooks/useEthersProvider'
import { JuiceswapAuthFunctions } from 'state/sagas/transactions/swapSaga'
import { call } from 'typed-redux-saga'
import { LightningBridgeDirection } from 'uniswap/src/data/tradingApi/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  LdsSwapStatus,
  btcToSat,
  claimCoinSwap,
  getLdsBridgeManager,
  satoshiToWei,
} from 'uniswap/src/features/lds-bridge'
import { TransactionStepFailedError } from 'uniswap/src/features/transactions/errors'
import {
  LightningBridgeReverseStep,
  LnReverseSubStep,
} from 'uniswap/src/features/transactions/swap/steps/lightningBridge'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import type { Chain, Client, Transport } from 'viem'
import { getConnectorClient, switchChain } from 'wagmi/actions'

interface HandleLightningBridgeReverseParams {
  step: LightningBridgeReverseStep
  setCurrentStep: SetCurrentStepFn
  trade: Trade
  account: AccountDetails
  destinationAddress?: string
  onTransactionHash?: (hash: string) => void
  onSuccess?: () => void
  auth: JuiceswapAuthFunctions
}

export function* handleLightningBridgeReverse(params: HandleLightningBridgeReverseParams) {
  const { step, setCurrentStep, trade, account, onSuccess, auth } = params

  const invoiceAmount = Number(btcToSat(new BigNumber(trade.inputAmount.toExact())))
  const claimAddress = account.address
  const citreaChainId = trade.outputAmount.currency.chainId as UniverseChainId

  // --- Auth check ---
  setCurrentStep({
    step: { ...step, subStep: LnReverseSubStep.CheckingAuth },
    accepted: false,
  })

  const isAuthenticated = auth.getIsAuthenticated(account.address)

  if (!isAuthenticated) {
    setCurrentStep({
      step: { ...step, subStep: LnReverseSubStep.WaitingForAuth },
      accepted: false,
    })

    setCurrentStep({
      step: { ...step, subStep: LnReverseSubStep.Authenticating },
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
    step: { ...step, subStep: LnReverseSubStep.ShowingInvoice },
    accepted: false,
  })

  const ldsBridge = getLdsBridgeManager()
  const reverseSwap = yield* call([ldsBridge, ldsBridge.createReverseSwap], {
    invoiceAmount,
    claimAddress,
    chainId: citreaChainId,
    userId: account.address,
  })

  step.invoice = reverseSwap.invoice as string
  step.backendAccepted = true

  setCurrentStep({ step: { ...step, subStep: LnReverseSubStep.ShowingInvoice }, accepted: true })

  // --- Claim ---
  yield* call([ldsBridge, ldsBridge.waitForSwapUntilState], reverseSwap.id, LdsSwapStatus.TransactionConfirmed)

  setCurrentStep({
    step: { ...step, subStep: LnReverseSubStep.Claiming },
    accepted: true,
  })

  const isSponsoredAvailable = yield* call([ldsBridge, ldsBridge.isSponsoredClaimWalletEligible], citreaChainId)

  let claimTxHash: string | undefined

  if (isSponsoredAvailable) {
    const claimResponse = yield* call([ldsBridge, ldsBridge.autoClaimSwap], reverseSwap)

    if (claimResponse.pending) {
      setCurrentStep({
        step: { ...step, subStep: LnReverseSubStep.ClaimPending, txHash: claimResponse.txHash },
        accepted: false,
      })
    }
    if (claimResponse.txHash && claimResponse.success) {
      claimTxHash = claimResponse.txHash
    }
  } else {
    yield* call(async () => switchChain(wagmiConfig, { chainId: citreaChainId as any }).catch(() => {}))

    const client = (yield* call(async () => getConnectorClient(wagmiConfig, { chainId: citreaChainId as any }))) as
      | Client<Transport, Chain>
      | undefined
    const provider = clientToProvider(client, citreaChainId)
    if (!provider) {
      throw new TransactionStepFailedError({ message: 'Failed to get provider for claim', step })
    }
    const signer = provider.getSigner(account.address)

    claimTxHash = yield* call(claimCoinSwap, {
      signer,
      contractAddress: reverseSwap.lockupAddress,
      preimage: reverseSwap.preimage,
      amount: satoshiToWei(reverseSwap.onchainAmount),
      refundAddress: reverseSwap.refundAddress,
      timelock: reverseSwap.timeoutBlockHeight,
    })
  }

  if (claimTxHash) {
    setCurrentStep({
      step: { ...step, subStep: LnReverseSubStep.Complete },
      accepted: true,
    })

    const explorerUrl = getExplorerLink({
      chainId: citreaChainId,
      data: claimTxHash,
      type: ExplorerDataType.TRANSACTION,
    })

    if (explorerUrl) {
      popupRegistry.addPopup(
        {
          type: PopupType.LightningBridge,
          id: claimTxHash,
          direction: LightningBridgeDirection.Reverse,
          status: LdsBridgeStatus.Confirmed,
          url: explorerUrl,
        },
        claimTxHash,
      )
    }

    if (onSuccess) {
      yield* call(onSuccess)
    }
  }
}
