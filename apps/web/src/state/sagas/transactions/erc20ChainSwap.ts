import { Web3Provider } from '@ethersproject/providers'
import { getAccount, getConnectorClient } from 'wagmi/actions'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { clientToProvider } from 'hooks/useEthersProvider'
import type { Chain, Client, Transport } from 'viem'
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
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionStepFailedError } from 'uniswap/src/features/transactions/errors'

async function getConnectorClientForChain(chainId: UniverseChainId): Promise<Client<Transport, Chain> | undefined> {
  try {
    return (await getConnectorClient(wagmiConfig, { chainId: chainId as any })) as Client<Transport, Chain> | undefined
  } catch (error) {
    console.error('[ERC20 Chain Swap] Failed to get connector client:', { chainId, error })
    throw error
  }
}

async function waitForNetwork(targetChainId: number, timeout = 30000): Promise<void> {
  const startTime = Date.now()
  
  // Check if already on correct network using wagmi
  const account = getAccount(wagmiConfig)
  if (account.chainId === targetChainId) {
    return
  }

  // Wait for network change by polling wagmi's account
  return new Promise((resolve, reject) => {
    const pollInterval = setInterval(() => {
      try {
        const currentAccount = getAccount(wagmiConfig)
        if (currentAccount.chainId === targetChainId) {
          clearInterval(pollInterval)
          resolve()
        } else if (Date.now() - startTime > timeout) {
          clearInterval(pollInterval)
          reject(new Error(`Timeout waiting for network switch to chain ${targetChainId}. Current chain: ${currentAccount.chainId}`))
        }
      } catch (error) {
        clearInterval(pollInterval)
        reject(error)
      }
    }, 500)
  })
}

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
  selectChain: (chainId: UniverseChainId) => Promise<boolean>
  onTransactionHash?: (hash: string) => void
  onSuccess?: () => void
}

export function* handleErc20ChainSwap(params: HandleErc20ChainSwapParams) {
  const { step, setCurrentStep, trade, account, selectChain, onTransactionHash, onSuccess } = params
  const isPolygonToCitrea = step.direction === Erc20ChainSwapDirection.PolygonToCitrea

  const from = isPolygonToCitrea ? 'USDT_POLYGON' : 'JUSD_CITREA'
  const to = isPolygonToCitrea ? 'JUSD_CITREA' : 'USDT_POLYGON'
  const sourceChain = isPolygonToCitrea ? 'polygon' : 'citrea'
  const targetChain = isPolygonToCitrea ? 'citrea' : 'polygon'
  const sourceChainId = isPolygonToCitrea ? UniverseChainId.Polygon : UniverseChainId.CitreaTestnet
  const targetChainId = isPolygonToCitrea ? UniverseChainId.CitreaTestnet : UniverseChainId.Polygon

  const ldsBridge = getLdsBridgeManager()

  // 1. Create swap (convert 6→8 decimals for API)
  const inputAmount = trade.inputAmount.quotient.toString()
  const userLockAmount = Number(inputAmount) * 100 // 6 → 8 decimals

  const createChainSwapParams = {
    from,
    to,
    claimAddress: account.address,
    userLockAmount,
  }

  console.error('[ERC20 Chain Swap] Creating chain swap:', createChainSwapParams)
  let chainSwap
  try {
    chainSwap = yield* call([ldsBridge, ldsBridge.createChainSwap], createChainSwapParams)
    console.error('[ERC20 Chain Swap] Chain swap created:', { id: chainSwap.id, preimageHash: chainSwap.preimageHash })
  } catch (error) {
    console.error('[ERC20 Chain Swap] Failed to create chain swap:', error)
    throw new TransactionStepFailedError({
      message: `Failed to create chain swap: ${error instanceof Error ? error.message : String(error)}`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  setCurrentStep({ step, accepted: true })

  // 2. Lock on source chain - switch chain first, then get signer
  console.error('[ERC20 Chain Swap] Switching to source chain:', { sourceChainId })
  try {
    const chainSwitched = yield* call(selectChain, sourceChainId)
    if (chainSwitched) {
      // Wait for network switch if successful
      yield* call(waitForNetwork, sourceChainId)
      console.error('[ERC20 Chain Swap] Network switched to source chain')
    } else {
      // If switch failed, wait anyway - user may have manually switched
      console.error('[ERC20 Chain Swap] Chain switch returned false, waiting for network switch anyway...')
      yield* call(waitForNetwork, sourceChainId)
      console.error('[ERC20 Chain Swap] Network switched to source chain')
    }
  } catch (error) {
    console.error('[ERC20 Chain Swap] Chain switch error, waiting for network switch:', error)
    // Wait for network switch even if selectChain threw
    yield* call(waitForNetwork, sourceChainId)
    console.error('[ERC20 Chain Swap] Network switched to source chain')
  }

  // Get signer for source chain (now that we're on the correct chain)
  console.error('[ERC20 Chain Swap] Getting signer for source chain:', { sourceChainId, sourceChain })
  let sourceClient
  try {
    // Get client for the target chain now that we've switched
    sourceClient = yield* call(getConnectorClientForChain, sourceChainId)
  } catch (error) {
    console.error('[ERC20 Chain Swap] Failed to get source client:', error)
    throw new TransactionStepFailedError({
      message: `Failed to get connector client for chain ${sourceChainId}: ${error instanceof Error ? error.message : String(error)}`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  const sourceProvider = clientToProvider(sourceClient, sourceChainId)
  if (!sourceProvider) {
    console.error('[ERC20 Chain Swap] Failed to create source provider:', { sourceChainId, sourceClient })
    throw new TransactionStepFailedError({
      message: `Failed to get provider for chain ${sourceChainId}`,
      step,
    })
  }

  const sourceSigner = sourceProvider.getSigner(account.address)

  console.error('[ERC20 Chain Swap] Building lockup transaction:', {
    contractAddress: CONTRACTS[sourceChain].swap,
    tokenAddress: CONTRACTS[sourceChain].token,
    amount: inputAmount,
  })
  let lockResult
  try {
    lockResult = yield* call(buildErc20LockupTx, {
      signer: sourceSigner,
      contractAddress: CONTRACTS[sourceChain].swap,
      tokenAddress: CONTRACTS[sourceChain].token,
      preimageHash: chainSwap.preimageHash,
      amount: BigInt(inputAmount), // 6 decimals for contract
      claimAddress: chainSwap.lockupDetails.claimAddress!,
      timelock: chainSwap.lockupDetails.timeoutBlockHeight,
    })
    console.error('[ERC20 Chain Swap] Lockup transaction submitted:', { hash: lockResult.hash })
  } catch (error) {
    console.error('[ERC20 Chain Swap] Failed to build/submit lockup transaction:', error)
    throw new TransactionStepFailedError({
      message: `Failed to lock tokens: ${error instanceof Error ? error.message : String(error)}`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  if (onTransactionHash) {
    onTransactionHash(lockResult.hash)
  }

  // 3. Wait for Boltz to lock on target chain
  console.error('[ERC20 Chain Swap] Waiting for Boltz lock:', { swapId: chainSwap.id })
  try {
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
    console.error('[ERC20 Chain Swap] Boltz lock confirmed')
  } catch (error) {
    console.error('[ERC20 Chain Swap] Failed waiting for Boltz lock:', error)
    throw new TransactionStepFailedError({
      message: `Failed waiting for Boltz lock: ${error instanceof Error ? error.message : String(error)}`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  // 4. Claim on target chain (convert 8→6 decimals for contract)
  console.error('[ERC20 Chain Swap] Switching to target chain:', { targetChainId })
  try {
    const chainSwitched = yield* call(selectChain, targetChainId)
    if (chainSwitched) {
      yield* call(waitForNetwork, targetChainId)
      console.error('[ERC20 Chain Swap] Network switched to target chain')
    } else {
      // If switch failed, wait anyway - user may have manually switched
      console.error('[ERC20 Chain Swap] Chain switch returned false, waiting for network switch anyway...')
      yield* call(waitForNetwork, targetChainId)
      console.error('[ERC20 Chain Swap] Network switched to target chain')
    }
  } catch (error) {
    console.error('[ERC20 Chain Swap] Chain switch error, waiting for network switch:', error)
    // Wait for network switch even if selectChain threw
    yield* call(waitForNetwork, targetChainId)
    console.error('[ERC20 Chain Swap] Network switched to target chain')
  }

  // Get signer for target chain (now that we're on the correct chain)
  console.error('[ERC20 Chain Swap] Getting signer for target chain:', { targetChainId, targetChain })
  let targetClient
  try {
    // Get client for the target chain now that we've switched
    targetClient = yield* call(getConnectorClientForChain, targetChainId)
  } catch (error) {
    console.error('[ERC20 Chain Swap] Failed to get target client:', error)
    throw new TransactionStepFailedError({
      message: `Failed to get connector client for chain ${targetChainId}: ${error instanceof Error ? error.message : String(error)}`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  const targetProvider = clientToProvider(targetClient, targetChainId)
  if (!targetProvider) {
    console.error('[ERC20 Chain Swap] Failed to create target provider:', { targetChainId, targetClient })
    throw new TransactionStepFailedError({
      message: `Failed to get provider for chain ${targetChainId}`,
      step,
    })
  }

  const targetSigner = targetProvider.getSigner(account.address)
  const claimAmount = BigInt(chainSwap.claimDetails.amount) / 100n // 8 → 6 decimals

  console.error('[ERC20 Chain Swap] Claiming tokens:', {
    contractAddress: CONTRACTS[targetChain].swap,
    tokenAddress: CONTRACTS[targetChain].token,
    amount: claimAmount.toString(),
  })
  try {
    yield* call(claimErc20Swap, {
      signer: targetSigner,
      contractAddress: CONTRACTS[targetChain].swap,
      tokenAddress: CONTRACTS[targetChain].token,
      preimage: chainSwap.preimage,
      amount: claimAmount,
      refundAddress: chainSwap.claimDetails.refundAddress!,
      timelock: chainSwap.claimDetails.timeoutBlockHeight,
    })
    console.error('[ERC20 Chain Swap] Claim transaction submitted')
  } catch (error) {
    console.error('[ERC20 Chain Swap] Failed to claim tokens:', error)
    throw new TransactionStepFailedError({
      message: `Failed to claim tokens: ${error instanceof Error ? error.message : String(error)}`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  if (onSuccess) {
    yield* call(onSuccess)
  }
}
