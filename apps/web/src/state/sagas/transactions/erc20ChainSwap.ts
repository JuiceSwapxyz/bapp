import { ADDRESS } from '@juicedollar/jusd'
import { popupRegistry } from 'components/Popups/registry'
import { LdsBridgeStatus, PopupType } from 'components/Popups/types'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'
import { clientToProvider } from 'hooks/useEthersProvider'
import { JuiceswapAuthFunctions } from 'state/sagas/transactions/swapSaga'
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
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import type { Chain, Client, Transport } from 'viem'
import { getAccount, getConnectorClient } from 'wagmi/actions'

async function getConnectorClientForChain(chainId: UniverseChainId): Promise<Client<Transport, Chain> | undefined> {
  try {
    return (await getConnectorClient(wagmiConfig, { chainId: chainId as any })) as Client<Transport, Chain> | undefined
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      tags: { file: 'erc20ChainSwap', function: 'getConnectorClientForChain' },
      extra: { chainId },
    })
    throw error
  }
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
export const SWAP_CONTRACTS = {
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

/**
 * Convert from Boltz 8-decimal format to native token decimals
 * This is used to convert server-provided amounts (like lockupDetails.amount)
 * back to the native token precision for on-chain transactions
 */
function boltzToNativeDecimals(boltzAmount: number, tokenDecimals: number): bigint {
  if (tokenDecimals === BOLTZ_DECIMALS) {
    return BigInt(boltzAmount)
  } else if (tokenDecimals > BOLTZ_DECIMALS) {
    // e.g., 8 decimals -> 18 decimals: multiply by 10^10
    const multiplier = 10n ** BigInt(tokenDecimals - BOLTZ_DECIMALS)
    return BigInt(boltzAmount) * multiplier
  } else {
    // e.g., 8 decimals -> 6 decimals: divide by 10^2
    const divisor = 10n ** BigInt(BOLTZ_DECIMALS - tokenDecimals)
    return BigInt(boltzAmount) / divisor
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
  auth: JuiceswapAuthFunctions
}

export function* handleErc20ChainSwap(params: HandleErc20ChainSwapParams) {
  const { step, setCurrentStep, trade, account, selectChain, onTransactionHash, onSuccess, auth } = params
  const isPolygonToCitrea = step.direction === Erc20ChainSwapDirection.PolygonToCitrea
  const isEthereumToCitrea = step.direction === Erc20ChainSwapDirection.EthereumToCitrea
  const isCitreaToPolygon = step.direction === Erc20ChainSwapDirection.CitreaToPolygon
  const isCitreaToEthereum = step.direction === Erc20ChainSwapDirection.CitreaToEthereum

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
    userId: account.address,
  }

  const isAuthenticated = auth.getIsAuthenticated(account.address)

  if (!isAuthenticated) {
    const authResult = yield* call(auth.handleAuthenticate)
    setCurrentStep({
      step: { ...step, subStep: Erc20ChainSwapSubStep.WaitingForAuth },
      accepted: false,
    })
    if (!authResult) {
      throw new TransactionStepFailedError({
        message: 'Authentication failed. Please sign the message to continue.',
        step,
        originalError: new Error('Authentication rejected'),
      })
    }
  }

  // Set initial substep immediately so UI shows progress
  setCurrentStep({
    step: { ...step, subStep: Erc20ChainSwapSubStep.CheckingAllowance },
    accepted: false,
  })

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

  step.backendAccepted = true

  // Update step to show swap creation is complete, now waiting for lockup
  setCurrentStep({ step, accepted: false })

  // 2. Lock on source chain - switch chain first, then get signer
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
  let sourceClient
  try {
    sourceClient = yield* call(getConnectorClientForChain, sourceChainId)
  } catch (error) {
    throw new TransactionStepFailedError({
      message: `Failed to get connector client for chain ${sourceChainId}: ${error instanceof Error ? error.message : String(error)}`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  const sourceProvider = clientToProvider(sourceClient, sourceChainId)
  if (!sourceProvider) {
    throw new TransactionStepFailedError({
      message: `Failed to get provider for chain ${sourceChainId}`,
      step,
    })
  }

  const sourceSigner = sourceProvider.getSigner(account.address)

  // Get the correct swap contract address (dynamic for Citrea based on mainnet/testnet)
  const swapContractAddress =
    sourceChain === 'citrea'
      ? getCitreaSwapContract(citreaChainId)
      : SWAP_CONTRACTS[sourceChain as 'ethereum' | 'polygon']

  const tokenAddress = TOKEN_CONFIGS[from].address
  const amountBigInt = BigInt(inputAmount)

  // Check allowance (substep already set at start of saga)
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
      extra: { step: 'checkAllowance' },
    })
    throw new TransactionStepFailedError({
      message: `Failed to check token allowance: ${error instanceof Error ? error.message : String(error)}`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  // 2. Approve if needed
  if (needsApproval) {
    setCurrentStep({
      step: { ...step, subStep: Erc20ChainSwapSubStep.WaitingForApproval },
      accepted: false,
    })

    try {
      const approveResult = yield* call(approveErc20ForLdsBridge, {
        signer: sourceSigner,
        contractAddress: swapContractAddress,
        tokenAddress,
        amount: amountBigInt,
      })

      setCurrentStep({
        step: { ...step, subStep: Erc20ChainSwapSubStep.ApprovingToken },
        accepted: false,
      })

      // Wait for approval confirmation
      yield* call([approveResult.tx, approveResult.tx.wait])
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), {
        tags: { file: 'erc20ChainSwap', function: 'handleErc20ChainSwap' },
        extra: { step: 'approval' },
      })
      throw new TransactionStepFailedError({
        message: `Failed to approve token: ${error instanceof Error ? error.message : String(error)}`,
        step,
        originalError: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  // 3. Lock tokens - show waiting for wallet confirmation
  setCurrentStep({
    step: { ...step, subStep: Erc20ChainSwapSubStep.WaitingForLock },
    accepted: false,
  })

  // Convert server lockup amount from Boltz 8-decimal format to native token decimals
  // IMPORTANT: The server returns lockupDetails.amount in Boltz 8-decimal format,
  // but the on-chain lockup requires the amount in native token decimals
  const lockupAmountNative = boltzToNativeDecimals(chainSwap.lockupDetails.amount, sourceDecimals)

  let lockResult
  try {
    lockResult = yield* call(buildErc20LockupTx, {
      signer: sourceSigner,
      contractAddress: swapContractAddress,
      tokenAddress,
      preimageHash: chainSwap.preimageHash,
      amount: lockupAmountNative,
      claimAddress: chainSwap.lockupDetails.claimAddress!,
      timelock: chainSwap.lockupDetails.timeoutBlockHeight,
    })
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      tags: { file: 'erc20ChainSwap', function: 'handleErc20ChainSwap' },
      extra: { step: 'lockup' },
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

  // Update step to show lockup transaction is submitted, waiting for confirmation
  setCurrentStep({
    step: { ...step, subStep: Erc20ChainSwapSubStep.LockingTokens, txHash: lockResult.hash },
    accepted: false,
  })

  // 4. Wait for Boltz to lock on target chain
  setCurrentStep({
    step: { ...step, subStep: Erc20ChainSwapSubStep.WaitingForBridge, txHash: lockResult.hash },
    accepted: false,
  })

  try {
    yield* call([ldsBridge, ldsBridge.waitForSwapUntilState], chainSwap.id, LdsSwapStatus.TransactionConfirmed)
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

  // 5. Auto-claim for both directions (USDT ↔ JUSD)
  setCurrentStep({
    step: { ...step, subStep: Erc20ChainSwapSubStep.ClaimingTokens, txHash: lockResult.hash },
    accepted: false,
  })

  // Show claim in progress popup
  popupRegistry.addPopup(
    {
      type: PopupType.ClaimInProgress,
      count: 1,
    },
    `claim-in-progress-${chainSwap.id}`,
    DEFAULT_TXN_DISMISS_MS,
  )

  let claimedSwap
  try {
    claimedSwap = yield* call([ldsBridge, ldsBridge.autoClaimSwap], chainSwap)

    // Remove claim in progress popup
    popupRegistry.removePopup(`claim-in-progress-${chainSwap.id}`)

    setCurrentStep({
      step: { ...step, subStep: Erc20ChainSwapSubStep.Complete },
      accepted: true,
    })
  } catch (error) {
    // Remove claim in progress popup on error
    popupRegistry.removePopup(`claim-in-progress-${chainSwap.id}`)

    logger.error(error instanceof Error ? error : new Error(String(error)), {
      tags: { file: 'erc20ChainSwap', function: 'handleErc20ChainSwap' },
      extra: { swapId: chainSwap.id, step: 'autoClaimSwapById' },
    })
    throw new TransactionStepFailedError({
      message: `Auto-claim failed: ${error instanceof Error ? error.message : String(error)}`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  // Show success popup with explorer link
  if (claimedSwap.claimTx) {
    const fromChainId = TOKEN_CONFIGS[from].chainId
    const toChainId = TOKEN_CONFIGS[to].chainId

    const explorerUrl = getExplorerLink({
      chainId: toChainId,
      data: claimedSwap.claimTx,
      type: ExplorerDataType.TRANSACTION,
    })

    popupRegistry.addPopup(
      {
        type: PopupType.Erc20ChainSwap,
        id: claimedSwap.claimTx,
        fromChainId,
        toChainId,
        fromAsset: from,
        toAsset: to,
        status: LdsBridgeStatus.Confirmed,
        url: explorerUrl,
      },
      claimedSwap.claimTx,
    )
  }

  if (onSuccess) {
    yield* call(onSuccess)
  }
}
