import type { ContractTransaction } from '@ethersproject/contracts'
import type { ExternalProvider } from '@ethersproject/providers'
import { Web3Provider } from '@ethersproject/providers'
import { ADDRESS } from '@juicedollar/jusd'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { call } from 'typed-redux-saga'
import { Erc20ChainSwapDirection } from 'uniswap/src/data/apiClients/tradingApi/utils/isBitcoinBridge'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  LdsSwapStatus,
  approveErc20ForLdsBridge,
  buildErc20LockupTx,
  checkErc20Allowance,
  getLdsBridgeManager,
} from 'uniswap/src/features/lds-bridge'
import { TransactionStepFailedError } from 'uniswap/src/features/transactions/errors'
import { Erc20ChainSwapStep, Erc20ChainSwapSubStep } from 'uniswap/src/features/transactions/swap/steps/erc20ChainSwap'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { logger } from 'utilities/src/logger/logger'
import { getAccount, getConnectorClient } from 'wagmi/actions'

const MAX_SIGNER_RETRIES = 5

/**
 * Get a fresh signer for cross-chain swaps.
 * This creates a new provider without caching to ensure we have the correct chain context
 * after a chain switch. The shared getSigner/clientToProvider uses WeakMap caching which
 * can return stale providers after chain switches.
 *
 * Uses retry logic because there can be a race condition between:
 * - waitForNetwork() confirming the chain switch (wagmi account state)
 * - getConnectorClient() returning the updated client
 *
 * @param account - The account address to get the signer for
 * @param chainId - The target chain ID to ensure we get the correct signer
 */
async function getFreshSigner(account: string, chainId: number): Promise<ReturnType<Web3Provider['getSigner']>> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt < MAX_SIGNER_RETRIES; attempt++) {
    try {
      // Request client for the SPECIFIC chain
      const client = await getConnectorClient(wagmiConfig, { chainId })
      const { chain } = client

      // Verify we got the correct chain
      if (chain.id !== chainId) {
        throw new Error(`Chain mismatch: expected ${chainId}, got ${chain.id}`)
      }

      // Create provider WITHOUT caching to ensure fresh chain context
      // Convert viem client to EIP-1193 provider for ethers Web3Provider compatibility
      const eip1193Provider = {
        request: client.request.bind(client),
      } as ExternalProvider
      const provider = new Web3Provider(eip1193Provider, {
        chainId: chain.id,
        name: chain.name,
      })

      return provider.getSigner(account)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      // Wait before retry, increasing delay each attempt
      if (attempt < MAX_SIGNER_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)))
      }
    }
  }

  throw lastError ?? new Error(`Failed to get signer for chain ${chainId} after ${MAX_SIGNER_RETRIES} attempts`)
}

async function waitForNetwork(targetChainId: number, timeout = 60000): Promise<void> {
  const startTime = Date.now()

  const account = getAccount(wagmiConfig)
  if (account.chainId === targetChainId) {
    return
  }

  await new Promise<void>((resolve, reject) => {
    const pollInterval = setInterval(() => {
      try {
        const currentAccount = getAccount(wagmiConfig)
        if (currentAccount.chainId === targetChainId) {
          clearInterval(pollInterval)
          resolve()
        } else if (Date.now() - startTime > timeout) {
          clearInterval(pollInterval)
          reject(
            new Error(
              `Timeout waiting for network switch to chain ${targetChainId}. Current chain: ${currentAccount.chainId}`,
            ),
          )
        }
      } catch (error) {
        clearInterval(pollInterval)
        reject(error)
      }
    }, 200)
  })
}

// Token addresses
const USDC_ETHEREUM_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDT_ETHEREUM_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const USDT_POLYGON_ADDRESS = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const JUSD_CITREA_MAINNET = ADDRESS[4114]!.juiceDollar
const JUSD_CITREA_TESTNET = ADDRESS[5115]!.juiceDollar

// Swap contract addresses (same contract handles multiple tokens on each chain)
const SWAP_CONTRACTS = {
  ethereum: '0x2E21F58Da58c391F110467c7484EdfA849C1CB9B',
  polygon: '0x2E21F58Da58c391F110467c7484EdfA849C1CB9B',
  citreaMainnet: '0x7397f25f230f7d5a83c18e1b68b32511bf35f860',
  citreaTestnet: '0xf2e019a371e5Fd32dB2fC564Ad9eAE9E433133cc',
}

// Token configurations by API symbol - mainnet
const TOKEN_CONFIGS_MAINNET: Record<string, { address: string; decimals: number; chainId: UniverseChainId }> = {
  USDT_ETH: { address: USDT_ETHEREUM_ADDRESS, decimals: 6, chainId: UniverseChainId.Mainnet },
  USDC_ETH: { address: USDC_ETHEREUM_ADDRESS, decimals: 6, chainId: UniverseChainId.Mainnet },
  USDT_POLYGON: { address: USDT_POLYGON_ADDRESS, decimals: 6, chainId: UniverseChainId.Polygon },
  JUSD_CITREA: { address: JUSD_CITREA_MAINNET, decimals: 18, chainId: UniverseChainId.CitreaMainnet },
}

// Token configurations by API symbol - testnet
const TOKEN_CONFIGS_TESTNET: Record<string, { address: string; decimals: number; chainId: UniverseChainId }> = {
  USDT_ETH: { address: USDT_ETHEREUM_ADDRESS, decimals: 6, chainId: UniverseChainId.Mainnet },
  USDC_ETH: { address: USDC_ETHEREUM_ADDRESS, decimals: 6, chainId: UniverseChainId.Mainnet },
  USDT_POLYGON: { address: USDT_POLYGON_ADDRESS, decimals: 6, chainId: UniverseChainId.Polygon },
  JUSD_CITREA: { address: JUSD_CITREA_TESTNET, decimals: 18, chainId: UniverseChainId.CitreaTestnet },
}

// Helper to get the right config based on trade's Citrea chain
function getTokenConfigs(
  citreaChainId: UniverseChainId,
): Record<string, { address: string; decimals: number; chainId: UniverseChainId }> {
  return citreaChainId === UniverseChainId.CitreaTestnet ? TOKEN_CONFIGS_TESTNET : TOKEN_CONFIGS_MAINNET
}

function getCitreaSwapContract(citreaChainId: UniverseChainId): string {
  return citreaChainId === UniverseChainId.CitreaTestnet ? SWAP_CONTRACTS.citreaTestnet : SWAP_CONTRACTS.citreaMainnet
}

const BOLTZ_DECIMALS = 8 // Boltz uses 8 decimals internally

/**
 * Convert from token decimals to Boltz 8-decimal format
 */
function tokenToBoltzDecimals(amount: bigint, tokenDecimals: number): number {
  if (tokenDecimals === BOLTZ_DECIMALS) {
    return Number(amount)
  } else if (tokenDecimals > BOLTZ_DECIMALS) {
    // e.g., 18 decimals -> 8 decimals: divide by 10^10
    const divisor = 10n ** BigInt(tokenDecimals - BOLTZ_DECIMALS)
    return Number(amount / divisor)
  } else {
    // e.g., 6 decimals -> 8 decimals: multiply by 10^2
    const multiplier = 10n ** BigInt(BOLTZ_DECIMALS - tokenDecimals)
    return Number(amount * multiplier)
  }
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
  const isEthereumToCitrea = step.direction === Erc20ChainSwapDirection.EthereumToCitrea
  const isCitreaToPolygon = step.direction === Erc20ChainSwapDirection.CitreaToPolygon
  const isCitreaToEthereum = step.direction === Erc20ChainSwapDirection.CitreaToEthereum

  // Helper to update step with subStep
  const updateSubStep = (subStep: Erc20ChainSwapSubStep, txHash?: string): void => {
    setCurrentStep({
      step: { ...step, subStep, txHash: txHash ?? step.txHash },
      accepted: subStep === Erc20ChainSwapSubStep.Complete,
    })
  }

  // Set initial subStep immediately so UI shows progress
  updateSubStep(Erc20ChainSwapSubStep.CheckingAllowance)

  // Determine Citrea chain ID from the trade (input for Citrea→X, output for X→Citrea)
  const citreaChainId =
    isCitreaToPolygon || isCitreaToEthereum
      ? (trade.inputAmount.currency.chainId as UniverseChainId)
      : (trade.outputAmount.currency.chainId as UniverseChainId)
  const TOKEN_CONFIGS = getTokenConfigs(citreaChainId)

  // Detect if input token is USDC (for Ethereum direction)
  const inputTokenAddress = trade.inputAmount.currency.isToken
    ? trade.inputAmount.currency.address.toLowerCase()
    : undefined
  const isUsdcInput = inputTokenAddress === USDC_ETHEREUM_ADDRESS.toLowerCase()

  // For Citrea → Ethereum, we need to detect if output is USDC
  const outputTokenAddress = trade.outputAmount.currency.isToken
    ? trade.outputAmount.currency.address.toLowerCase()
    : undefined
  const isUsdcOutput = outputTokenAddress === USDC_ETHEREUM_ADDRESS.toLowerCase()

  // Determine API symbols based on direction and token type
  let from: string
  let to: string
  if (isPolygonToCitrea) {
    from = 'USDT_POLYGON'
    to = 'JUSD_CITREA'
  } else if (isEthereumToCitrea) {
    from = isUsdcInput ? 'USDC_ETH' : 'USDT_ETH'
    to = 'JUSD_CITREA'
  } else if (isCitreaToPolygon) {
    from = 'JUSD_CITREA'
    to = 'USDT_POLYGON'
  } else if (isCitreaToEthereum) {
    from = 'JUSD_CITREA'
    to = isUsdcOutput ? 'USDC_ETH' : 'USDT_ETH'
  } else {
    // Fallback (should not be reached if all directions are handled)
    from = 'JUSD_CITREA'
    to = 'USDT_ETH'
  }

  const sourceChain = isPolygonToCitrea ? 'polygon' : isEthereumToCitrea ? 'ethereum' : 'citrea'
  const sourceChainId = isPolygonToCitrea
    ? UniverseChainId.Polygon
    : isEthereumToCitrea
      ? UniverseChainId.Mainnet
      : citreaChainId

  const ldsBridge = getLdsBridgeManager()

  // Get token decimals for source token from TOKEN_CONFIGS
  const sourceDecimals = TOKEN_CONFIGS[from].decimals

  // 1. Create swap (convert source token decimals → Boltz 8 decimals for API)
  const inputAmount = trade.inputAmount.quotient.toString()
  const userLockAmount = tokenToBoltzDecimals(BigInt(inputAmount), sourceDecimals)

  const createChainSwapParams = {
    from,
    to,
    claimAddress: account.address,
    userLockAmount,
  }

  let chainSwap
  try {
    chainSwap = yield* call([ldsBridge, ldsBridge.createChainSwap], createChainSwapParams)
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      tags: { file: 'erc20ChainSwap', function: 'handleErc20ChainSwap' },
      extra: { createChainSwapParams },
    })
    throw new TransactionStepFailedError({
      message: `Failed to create chain swap: ${error instanceof Error ? error.message : String(error)}`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  // 2. Switch to source chain (with UI feedback)
  try {
    const chainSwitched = yield* call(selectChain, sourceChainId)
    if (chainSwitched) {
      yield* call(waitForNetwork, sourceChainId)
    } else {
      yield* call(waitForNetwork, sourceChainId)
    }
  } catch (_error) {
    // Wait for network switch even if selectChain threw
    yield* call(waitForNetwork, sourceChainId)
  }

  // Get signer for source chain (now that we're on the correct chain)
  // Use getFreshSigner with explicit chainId to avoid cached provider issues after chain switch
  let sourceSigner
  try {
    sourceSigner = yield* call(getFreshSigner, account.address, sourceChainId)
  } catch (error) {
    throw new TransactionStepFailedError({
      message: `Failed to get signer for chain ${sourceChainId}: ${error instanceof Error ? error.message : String(error)}`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  // Get the correct swap contract address (dynamic for Citrea based on mainnet/testnet)
  const swapContractAddress =
    sourceChain === 'citrea'
      ? getCitreaSwapContract(citreaChainId)
      : SWAP_CONTRACTS[sourceChain as 'ethereum' | 'polygon']

  const tokenAddress = TOKEN_CONFIGS[from].address
  const amountBigInt = BigInt(inputAmount)

  // 3. Check allowance
  updateSubStep(Erc20ChainSwapSubStep.CheckingAllowance)
  let needsApproval = false
  try {
    const allowanceResult = yield* call(checkErc20Allowance, {
      signer: sourceSigner,
      contractAddress: swapContractAddress,
      tokenAddress,
      amount: amountBigInt,
    })
    needsApproval = allowanceResult.needsApproval
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      tags: { file: 'erc20ChainSwap', function: 'handleErc20ChainSwap' },
      extra: { step: 'checkAllowance', message: 'Allowance check failed' },
    })
    // Assume approval is needed if check fails
    needsApproval = true
  }

  // 4. If approval needed, request and wait
  if (needsApproval) {
    updateSubStep(Erc20ChainSwapSubStep.WaitingForApproval)

    try {
      const approvalResultUntyped = yield* call(approveErc20ForLdsBridge, {
        signer: sourceSigner,
        contractAddress: swapContractAddress,
        tokenAddress,
        amount: amountBigInt,
      })
      const approveTx = (approvalResultUntyped as { tx: ContractTransaction; hash: string }).tx

      // Wait for approval confirmation
      updateSubStep(Erc20ChainSwapSubStep.ApprovingToken)
      yield* call([approveTx, approveTx.wait])
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), {
        tags: { file: 'erc20ChainSwap', function: 'handleErc20ChainSwap' },
        extra: { step: 'approval', message: 'Token approval failed' },
      })
      throw new TransactionStepFailedError({
        message: `Token approval failed: ${error instanceof Error ? error.message : String(error)}`,
        step,
        originalError: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  // 5. Lock tokens
  updateSubStep(Erc20ChainSwapSubStep.WaitingForLock)

  let lockResult
  try {
    lockResult = yield* call(buildErc20LockupTx, {
      signer: sourceSigner,
      contractAddress: swapContractAddress,
      tokenAddress,
      preimageHash: chainSwap.preimageHash,
      amount: amountBigInt,
      claimAddress: chainSwap.lockupDetails.claimAddress!,
      timelock: chainSwap.lockupDetails.timeoutBlockHeight,
    })
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      tags: { file: 'erc20ChainSwap', function: 'handleErc20ChainSwap' },
      extra: { step: 'lockup', message: 'Lock TX failed' },
    })
    throw new TransactionStepFailedError({
      message: `Failed to lock tokens: ${error instanceof Error ? error.message : String(error)}`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  if (onTransactionHash) {
    onTransactionHash(lockResult.hash)
  }

  // Update to locking state with tx hash
  updateSubStep(Erc20ChainSwapSubStep.LockingTokens, lockResult.hash)

  // 6. Wait for Boltz to lock on target chain
  try {
    yield* call([ldsBridge, ldsBridge.waitForSwapUntilState], chainSwap.id, LdsSwapStatus.TransactionConfirmed)
    updateSubStep(Erc20ChainSwapSubStep.WaitingForBridge, lockResult.hash)
    yield* call([ldsBridge, ldsBridge.waitForSwapUntilState], chainSwap.id, LdsSwapStatus.TransactionServerMempool)
    yield* call([ldsBridge, ldsBridge.waitForSwapUntilState], chainSwap.id, LdsSwapStatus.TransactionServerConfirmed)
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      tags: { file: 'erc20ChainSwap', function: 'handleErc20ChainSwap' },
      extra: { swapId: chainSwap.id, step: 'waitForBoltzLock' },
    })
    throw new TransactionStepFailedError({
      message: `Failed waiting for Boltz lock: ${error instanceof Error ? error.message : String(error)}. The swap may still be processing. Please check the swap status.`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  // 7. Auto-claim
  updateSubStep(Erc20ChainSwapSubStep.ClaimingTokens, lockResult.hash)

  try {
    yield* call([ldsBridge, ldsBridge.autoClaimSwap], chainSwap.id)
    updateSubStep(Erc20ChainSwapSubStep.Complete, lockResult.hash)
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      tags: { file: 'erc20ChainSwap', function: 'handleErc20ChainSwap' },
      extra: { swapId: chainSwap.id, step: 'autoClaimSwap' },
    })
    throw new TransactionStepFailedError({
      message: `Auto-claim failed: ${error instanceof Error ? error.message : String(error)}`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  if (onSuccess) {
    yield* call(onSuccess)
  }
}
