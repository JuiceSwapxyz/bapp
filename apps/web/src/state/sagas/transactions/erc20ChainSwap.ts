import { Web3Provider } from '@ethersproject/providers'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { clientToProvider } from 'hooks/useEthersProvider'
import { call } from 'typed-redux-saga'
import { Erc20ChainSwapDirection } from 'uniswap/src/data/apiClients/tradingApi/utils/isBitcoinBridge'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { LdsSwapStatus, buildErc20LockupTx, claimErc20Swap, getLdsBridgeManager } from 'uniswap/src/features/lds-bridge'
import { TransactionStepFailedError } from 'uniswap/src/features/transactions/errors'
import { Erc20ChainSwapStep } from 'uniswap/src/features/transactions/swap/steps/erc20ChainSwap'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
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

interface WaitForProviderChainParams {
  targetChainId: number
  provider: Web3Provider
  timeout?: number
}

async function waitForProviderChain(params: WaitForProviderChainParams): Promise<void> {
  const { targetChainId, provider, timeout = 30000 } = params
  const startTime = Date.now()

  try {
    const network = await provider.getNetwork()
    if (network.chainId === targetChainId) {
      return
    }
  } catch (error) {
    logger.debug('erc20ChainSwap', 'waitForProviderChain', 'Failed to get provider network', error)
  }

  await new Promise<void>((resolve, reject) => {
    const pollInterval = setInterval(async () => {
      try {
        const network = await provider.getNetwork()
        if (network.chainId === targetChainId) {
          clearInterval(pollInterval)
          resolve()
        } else if (Date.now() - startTime > timeout) {
          clearInterval(pollInterval)
          reject(
            new Error(
              `Timeout waiting for provider to switch to chain ${targetChainId}. Current chain: ${network.chainId}`,
            ),
          )
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
    decimals: 6, // USDT on Polygon has 6 decimals
  },
  citrea: {
    swap: '0xf2e019a371e5Fd32dB2fC564Ad9eAE9E433133cc',
    token: '0xFdB0a83d94CD65151148a131167Eb499Cb85d015',
    decimals: 18, // JUSD on Citrea has 18 decimals
  },
  ethereum: {
    swap: '0x2E21F58Da58c391F110467c7484EdfA849C1CB9B',
    token: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6, // USDT on Ethereum has 6 decimals
  },
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
 * Convert from Boltz 8-decimal format to token decimals
 */
function boltzToTokenDecimals(boltzAmount: bigint, tokenDecimals: number): bigint {
  if (tokenDecimals === BOLTZ_DECIMALS) {
    return boltzAmount
  } else if (tokenDecimals > BOLTZ_DECIMALS) {
    // e.g., 8 decimals -> 18 decimals: multiply by 10^10
    const multiplier = 10n ** BigInt(tokenDecimals - BOLTZ_DECIMALS)
    return boltzAmount * multiplier
  } else {
    // e.g., 8 decimals -> 6 decimals: divide by 10^2
    const divisor = 10n ** BigInt(BOLTZ_DECIMALS - tokenDecimals)
    return boltzAmount / divisor
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

  const from = isPolygonToCitrea ? 'USDT_POLYGON' : isEthereumToCitrea ? 'USDT_ETH' : 'JUSD_CITREA'
  const to = isPolygonToCitrea || isEthereumToCitrea ? 'JUSD_CITREA' : isCitreaToPolygon ? 'USDT_POLYGON' : 'USDT_ETH'
  const sourceChain = isPolygonToCitrea ? 'polygon' : isEthereumToCitrea ? 'ethereum' : 'citrea'
  const targetChain = isPolygonToCitrea || isEthereumToCitrea ? 'citrea' : isCitreaToPolygon ? 'polygon' : 'ethereum'
  const sourceChainId = isPolygonToCitrea
    ? UniverseChainId.Polygon
    : isEthereumToCitrea
      ? UniverseChainId.Mainnet
      : UniverseChainId.CitreaTestnet
  const targetChainId =
    isPolygonToCitrea || isEthereumToCitrea
      ? UniverseChainId.CitreaTestnet
      : isCitreaToPolygon
        ? UniverseChainId.Polygon
        : UniverseChainId.Mainnet

  const ldsBridge = getLdsBridgeManager()

  // Get token decimals for source and target chains
  const sourceDecimals = CONTRACTS[sourceChain].decimals
  const targetDecimals = CONTRACTS[targetChain].decimals

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

  let lockResult
  try {
    lockResult = yield* call(buildErc20LockupTx, {
      signer: sourceSigner,
      contractAddress: CONTRACTS[sourceChain].swap,
      tokenAddress: CONTRACTS[sourceChain].token,
      preimageHash: chainSwap.preimageHash,
      amount: BigInt(inputAmount),
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
  setCurrentStep({ step, accepted: false })

  // 3. Wait for Boltz to lock on target chain
  try {
    yield* call([ldsBridge, ldsBridge.waitForSwapUntilState], chainSwap.id, LdsSwapStatus.TransactionConfirmed)
    setCurrentStep({ step, accepted: false })
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

  const currentAccount = getAccount(wagmiConfig)
  if (currentAccount.chainId !== targetChainId) {
    try {
      yield* call(selectChain, targetChainId)
      yield* call(waitForNetwork, targetChainId)
    } catch (_error) {
      yield* call(waitForNetwork, targetChainId)
    }
  }

  // Get signer for target chain (now that we're on the correct chain)
  let targetClient
  try {
    targetClient = yield* call(getConnectorClientForChain, targetChainId)
  } catch (error) {
    throw new TransactionStepFailedError({
      message: `Failed to get connector client for chain ${targetChainId}: ${error instanceof Error ? error.message : String(error)}`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  const targetProvider = clientToProvider(targetClient, targetChainId)
  if (!targetProvider) {
    throw new TransactionStepFailedError({
      message: `Failed to get provider for chain ${targetChainId}`,
      step,
    })
  }

  try {
    yield* call(waitForProviderChain, { targetChainId, provider: targetProvider })
  } catch (error) {
    const chainName =
      targetChainId === UniverseChainId.CitreaTestnet
        ? 'Citrea Testnet'
        : targetChainId === UniverseChainId.Polygon
          ? 'Polygon'
          : 'Ethereum'
    throw new TransactionStepFailedError({
      message: `Failed to switch to ${chainName} network. Please manually switch to ${chainName} in MetaMask and try again.`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  const targetSigner = targetProvider.getSigner(account.address)

  // Convert from Boltz 8 decimals to target token decimals
  const boltzAmount8Decimals = BigInt(chainSwap.claimDetails.amount)
  const claimAmount = boltzToTokenDecimals(boltzAmount8Decimals, targetDecimals)

  // Update step to show we're claiming (user may need to approve in wallet)
  setCurrentStep({ step, accepted: false })

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

    // Update step to show claim is complete
    setCurrentStep({ step, accepted: true })
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      tags: { file: 'erc20ChainSwap', function: 'handleErc20ChainSwap' },
      extra: { step: 'claim', targetChain },
    })
    throw new TransactionStepFailedError({
      message: `Failed to claim tokens: ${error instanceof Error ? error.message : String(error)}. Please ensure Boltz has locked tokens on ${targetChain} and try again.`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  if (onSuccess) {
    yield* call(onSuccess)
  }
}
