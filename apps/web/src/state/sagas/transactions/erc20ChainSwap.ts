import { ADDRESS } from '@juicedollar/jusd'
import { popupRegistry } from 'components/Popups/registry'
import { LdsBridgeStatus, PopupType } from 'components/Popups/types'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'
import { clientToProvider } from 'hooks/useEthersProvider'
import { waitForNetwork } from 'state/sagas/transactions/chainSwitchUtils'
import { call } from 'typed-redux-saga'
import { FetchError } from 'uniswap/src/data/apiClients/FetchError'
import { Erc20ChainSwapDirection } from 'uniswap/src/data/apiClients/tradingApi/utils/isBitcoinBridge'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { LdsSwapStatus, buildErc20LockupTx, getLdsBridgeManager } from 'uniswap/src/features/lds-bridge'
import { TransactionStepFailedError } from 'uniswap/src/features/transactions/errors'
import { Erc20ChainSwapStep } from 'uniswap/src/features/transactions/swap/steps/erc20ChainSwap'
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

  // Chain display names for user-facing messages
  const CHAIN_DISPLAY_NAMES: Record<string, string> = {
    polygon: 'Polygon',
    ethereum: 'Ethereum',
    citrea: 'Citrea',
  }

  // 1. FIRST: Switch to source chain (BEFORE creating swap on server)
  // This ensures user is on correct network before we commit to the swap
  const currentAccount = getAccount(wagmiConfig)
  const chainName = CHAIN_DISPLAY_NAMES[sourceChain]

  logger.info('erc20ChainSwap', 'handleErc20ChainSwap', 'Chain check', {
    currentChainId: currentAccount.chainId,
    requiredChainId: sourceChainId,
    needsSwitch: currentAccount.chainId !== sourceChainId,
  })

  if (currentAccount.chainId !== sourceChainId) {
    // Trigger chain switch request (fire and forget - non-blocking)
    // This sends wallet_switchEthereumChain to the wallet which should show a dialog
    // We don't await this because some wallets don't show the dialog or it's not visible
    logger.info('erc20ChainSwap', 'handleErc20ChainSwap', `Requesting chain switch to ${chainName}`)

    void selectChain(sourceChainId).catch((error) => {
      // Log the error but don't throw - we'll detect success/failure via waitForNetwork
      logger.warn('erc20ChainSwap', 'handleErc20ChainSwap', 'Chain switch request failed', { error })
    })

    // Wait for the user to switch networks (either via wallet dialog or manually)
    // This polls the current chain every 200ms until it matches or times out
    // Using 30 seconds timeout for hardware wallet compatibility
    try {
      yield* call(waitForNetwork, sourceChainId, 30000)
      logger.info('erc20ChainSwap', 'handleErc20ChainSwap', `Successfully switched to ${chainName}`)
    } catch (error) {
      throw new TransactionStepFailedError({
        message: `Please switch your wallet to ${chainName} network and try again.`,
        step,
        originalError: error instanceof Error ? error : undefined,
      })
    }
  }

  // 2. NOW create swap on server (user is on correct chain)
  // NOTE: For ERC20 chain swaps, the API expects amounts in the native token's decimal format
  // (e.g., 6 decimals for USDT, 18 for JUSD), NOT in Boltz 8-decimal format.
  // The Boltz conversion is only needed for Bitcoin-based swaps.
  const inputAmount = trade.inputAmount.quotient.toString()
  const userLockAmount = Number(inputAmount)

  const createChainSwapParams = {
    from,
    to,
    claimAddress: account.address,
    userLockAmount,
    chainId: citreaChainId,
  }

  let chainSwap
  try {
    chainSwap = yield* call([ldsBridge, ldsBridge.createChainSwap], createChainSwapParams)
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      tags: { file: 'erc20ChainSwap', function: 'handleErc20ChainSwap' },
      extra: { createChainSwapParams },
    })

    // Extract the actual error message from FetchError.data.error if available
    let errorMessage = error instanceof Error ? error.message : String(error)
    // Check for FetchError (either by instanceof or by duck typing for cases where instanceof fails)
    const isFetchError =
      error instanceof FetchError || (error && typeof error === 'object' && 'data' in error && 'response' in error)
    if (isFetchError && (error as FetchError).data?.error) {
      errorMessage = (error as FetchError).data.error
    }

    throw new TransactionStepFailedError({
      message: errorMessage,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  // Update step to show swap creation is complete, now waiting for lockup
  setCurrentStep({ step, accepted: false })

  // 3. Lock on source chain - get signer (user already on correct chain from step 1)
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

  let lockResult
  try {
    lockResult = yield* call(buildErc20LockupTx, {
      signer: sourceSigner,
      contractAddress: swapContractAddress,
      tokenAddress: TOKEN_CONFIGS[from].address,
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

  // 4. Auto-claim for both directions (USDT ↔ JUSD)
  setCurrentStep({ step, accepted: false })

  if (onSuccess) {
    yield* call(onSuccess)
  }
  // Show claim in progress notification
  popupRegistry.addPopup(
    {
      type: PopupType.ClaimInProgress,
      count: 1,
    },
    `claim-in-progress-${chainSwap.id}`,
    DEFAULT_TXN_DISMISS_MS,
  )

  try {
    const claimedSwap = yield* call([ldsBridge, ldsBridge.autoClaimSwap], chainSwap.id)
    setCurrentStep({ step, accepted: true })

    // Remove claim in progress popup
    popupRegistry.removePopup(`claim-in-progress-${chainSwap.id}`)

    // Determine from and to chain IDs based on swap direction
    const fromChainId = sourceChainId
    const toChainId = isPolygonToCitrea
      ? citreaChainId
      : isEthereumToCitrea
        ? citreaChainId
        : isCitreaToPolygon
          ? UniverseChainId.Polygon
          : UniverseChainId.Mainnet

    if (claimedSwap.claimTx) {
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
  } catch (error) {
    popupRegistry.removePopup(`claim-in-progress-${chainSwap.id}`)
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
}
