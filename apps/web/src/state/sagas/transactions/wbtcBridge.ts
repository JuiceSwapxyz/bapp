import { popupRegistry } from 'components/Popups/registry'
import { LdsBridgeStatus, PopupType } from 'components/Popups/types'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'
import { clientToProvider } from 'hooks/useEthersProvider'
import { waitForNetwork } from 'state/sagas/transactions/chainSwitchUtils'
import { call } from 'typed-redux-saga'
import { getFetchErrorMessage } from 'uniswap/src/data/apiClients/FetchError'
import {
  WBTC_ETHEREUM_ADDRESS,
  WbtcBridgeDirection,
} from 'uniswap/src/data/apiClients/tradingApi/utils/isBitcoinBridge'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  LdsSwapStatus,
  approveErc20ForLdsBridge,
  buildErc20LockupTx,
  buildEvmLockupTx,
  checkErc20Allowance,
  getLdsBridgeManager,
} from 'uniswap/src/features/lds-bridge'
import { TransactionStepFailedError } from 'uniswap/src/features/transactions/errors'
import { Erc20ChainSwapSubStep } from 'uniswap/src/features/transactions/swap/steps/erc20ChainSwap'
import { WbtcBridgeStep } from 'uniswap/src/features/transactions/swap/steps/wbtcBridge'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import type { Chain, Client, Transport } from 'viem'
import { getAccount, getConnectorClient } from 'wagmi/actions'

function getErrorMessage(error: unknown): string {
  const fetchErrorMsg = getFetchErrorMessage(error)
  if (fetchErrorMsg) {
    return fetchErrorMsg
  }
  return error instanceof Error ? error.message : String(error)
}

async function getConnectorClientForChain(chainId: UniverseChainId): Promise<Client<Transport, Chain> | undefined> {
  try {
    return (await getConnectorClient(wagmiConfig, { chainId: chainId as any })) as Client<Transport, Chain> | undefined
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      tags: { file: 'wbtcBridge', function: 'getConnectorClientForChain' },
      extra: { chainId },
    })
    throw error
  }
}

// Swap contract addresses
export const SWAP_CONTRACTS = {
  ethereum: '0x2E21F58Da58c391F110467c7484EdfA849C1CB9B',
  citreaMainnet: '0x7397f25f230f7d5a83c18e1b68b32511bf35f860',
  citreaTestnet: '0xf2e019a371e5Fd32dB2fC564Ad9eAE9E433133cc',
}

// Token configurations by API symbol - mainnet
const TOKEN_CONFIGS_MAINNET: Record<string, { address: string; decimals: number; chainId: UniverseChainId }> = {
  WBTC_ETH: { address: WBTC_ETHEREUM_ADDRESS, decimals: 8, chainId: UniverseChainId.Mainnet },
  cBTC: { address: '0x0000000000000000000000000000000000000000', decimals: 18, chainId: UniverseChainId.CitreaMainnet },
}

// Token configurations by API symbol - testnet
const TOKEN_CONFIGS_TESTNET: Record<string, { address: string; decimals: number; chainId: UniverseChainId }> = {
  WBTC_ETH: { address: WBTC_ETHEREUM_ADDRESS, decimals: 8, chainId: UniverseChainId.Mainnet },
  cBTC: { address: '0x0000000000000000000000000000000000000000', decimals: 18, chainId: UniverseChainId.CitreaTestnet },
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

const BOLTZ_DECIMALS = 8 // Boltz uses 8 decimals internally (same as WBTC!)

/**
 * Convert from token decimals to Boltz 8-decimal format
 */
function tokenToBoltzDecimals(amount: bigint, tokenDecimals: number): number {
  if (tokenDecimals === BOLTZ_DECIMALS) {
    return Number(amount)
  } else if (tokenDecimals > BOLTZ_DECIMALS) {
    const divisor = 10n ** BigInt(tokenDecimals - BOLTZ_DECIMALS)
    return Number(amount / divisor)
  } else {
    const multiplier = 10n ** BigInt(BOLTZ_DECIMALS - tokenDecimals)
    return Number(amount * multiplier)
  }
}

interface HandleWbtcBridgeParams {
  step: WbtcBridgeStep
  setCurrentStep: SetCurrentStepFn
  trade: Trade
  account: AccountDetails
  selectChain: (chainId: UniverseChainId) => Promise<boolean>
  onTransactionHash?: (hash: string) => void
  onSuccess?: () => void
}

export function* handleWbtcBridge(params: HandleWbtcBridgeParams) {
  const { step, setCurrentStep, trade, account, selectChain, onTransactionHash, onSuccess } = params
  const isWbtcToCbtc = step.direction === WbtcBridgeDirection.EthereumToCitrea
  const isCbtcToWbtc = step.direction === WbtcBridgeDirection.CitreaToEthereum

  // Determine Citrea chain ID from the trade (input for cBTC→WBTC, output for WBTC→cBTC)
  const citreaChainId = isCbtcToWbtc
    ? (trade.inputAmount.currency.chainId as UniverseChainId)
    : (trade.outputAmount.currency.chainId as UniverseChainId)

  const TOKEN_CONFIGS = getTokenConfigs(citreaChainId)

  // Determine source and destination based on direction
  const from = isWbtcToCbtc ? 'WBTC_ETH' : 'cBTC'
  const to = isWbtcToCbtc ? 'cBTC' : 'WBTC_ETH'

  const sourceChain = isWbtcToCbtc ? 'ethereum' : 'citrea'
  const sourceChainId = isWbtcToCbtc ? UniverseChainId.Mainnet : citreaChainId

  const ldsBridge = getLdsBridgeManager()

  // Get token decimals for source token
  const sourceDecimals = TOKEN_CONFIGS[from].decimals

  // Chain display names
  const CHAIN_DISPLAY_NAMES: Record<string, string> = {
    ethereum: 'Ethereum',
    citrea: 'Citrea',
  }

  // 1. Switch to source chain before creating swap
  const currentAccount = getAccount(wagmiConfig)
  const chainName = CHAIN_DISPLAY_NAMES[sourceChain]

  logger.info('wbtcBridge', 'handleWbtcBridge', 'Chain check', {
    currentChainId: currentAccount.chainId,
    requiredChainId: sourceChainId,
    needsSwitch: currentAccount.chainId !== sourceChainId,
  })

  if (currentAccount.chainId !== sourceChainId) {
    logger.info('wbtcBridge', 'handleWbtcBridge', `Requesting chain switch to ${chainName}`)

    void selectChain(sourceChainId).catch((error) => {
      logger.warn('wbtcBridge', 'handleWbtcBridge', 'Chain switch request failed', { error })
    })

    try {
      yield* call(waitForNetwork, sourceChainId, 30000)
      logger.info('wbtcBridge', 'handleWbtcBridge', `Successfully switched to ${chainName}`)
    } catch (error) {
      throw new TransactionStepFailedError({
        message: `Please switch your wallet to ${chainName} network and try again.`,
        step,
        originalError: error instanceof Error ? error : undefined,
      })
    }
  }

  // 2. Create swap on server
  const inputAmount = trade.inputAmount.quotient.toString()
  const userLockAmount = tokenToBoltzDecimals(BigInt(inputAmount), sourceDecimals)

  const createChainSwapParams = {
    from,
    to,
    claimAddress: account.address,
    userLockAmount,
    chainId: citreaChainId,
    userId: account.address.toLocaleLowerCase(),
  }

  let chainSwap
  try {
    chainSwap = yield* call([ldsBridge, ldsBridge.createChainSwap], createChainSwapParams)
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      tags: { file: 'wbtcBridge', function: 'handleWbtcBridge' },
      extra: { createChainSwapParams },
    })
    throw new TransactionStepFailedError({
      message: `Failed to create WBTC bridge swap: ${getErrorMessage(error)}`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  const setStep = (subStep: Erc20ChainSwapSubStep): void =>
    setCurrentStep({ step: { ...step, subStep }, accepted: false })

  setStep(isWbtcToCbtc ? Erc20ChainSwapSubStep.CheckingAllowance : Erc20ChainSwapSubStep.WaitingForLock)

  // 3. Lock on source chain
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

  const swapContractAddress = isWbtcToCbtc ? SWAP_CONTRACTS.ethereum : getCitreaSwapContract(citreaChainId)
  const tokenAddress = TOKEN_CONFIGS[from].address
  const amountBigInt = BigInt(inputAmount)

  // Check and approve WBTC if needed (only for WBTC → cBTC direction)
  if (isWbtcToCbtc) {
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
        tags: { file: 'wbtcBridge', function: 'handleWbtcBridge' },
        extra: { step: 'checkAllowance' },
      })
      throw new TransactionStepFailedError({
        message: `Failed to check WBTC allowance: ${error instanceof Error ? error.message : String(error)}`,
        step,
        originalError: error instanceof Error ? error : new Error(String(error)),
      })
    }

    if (needsApproval) {
      setStep(Erc20ChainSwapSubStep.WaitingForApproval)
      try {
        const approveResult = yield* call(approveErc20ForLdsBridge, {
          signer: sourceSigner,
          contractAddress: swapContractAddress,
          tokenAddress,
          amount: amountBigInt,
        })

        setStep(Erc20ChainSwapSubStep.ApprovingToken)
        // Wait for approval confirmation
        yield* call([approveResult.tx, approveResult.tx.wait])
      } catch (error) {
        logger.error(error instanceof Error ? error : new Error(String(error)), {
          tags: { file: 'wbtcBridge', function: 'handleWbtcBridge' },
          extra: { step: 'approval' },
        })
        throw new TransactionStepFailedError({
          message: `Failed to approve WBTC: ${error instanceof Error ? error.message : String(error)}`,
          step,
          originalError: error instanceof Error ? error : new Error(String(error)),
        })
      }
    }
    setStep(Erc20ChainSwapSubStep.WaitingForLock)
  }

  setStep(Erc20ChainSwapSubStep.LockingTokens)
  let lockResult
  try {
    if (isWbtcToCbtc) {
      // WBTC → cBTC: WBTC is an ERC20 on Ethereum, use ERC20 lockup
      lockResult = yield* call(buildErc20LockupTx, {
        signer: sourceSigner,
        contractAddress: swapContractAddress,
        tokenAddress,
        preimageHash: chainSwap.preimageHash,
        amount: amountBigInt,
        claimAddress: chainSwap.lockupDetails.claimAddress!,
        timelock: chainSwap.lockupDetails.timeoutBlockHeight,
      })
    } else {
      // cBTC → WBTC: cBTC is native on Citrea, use native coin lockup
      // Note: buildEvmLockupTx expects amountSatoshis from chainSwap.lockupDetails
      lockResult = yield* call(buildEvmLockupTx, {
        signer: sourceSigner,
        contractAddress: chainSwap.lockupDetails.lockupAddress,
        preimageHash: chainSwap.preimageHash,
        claimAddress: chainSwap.lockupDetails.claimAddress,
        timeoutBlockHeight: chainSwap.lockupDetails.timeoutBlockHeight,
        amountSatoshis: chainSwap.lockupDetails.amount,
      })
    }
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      tags: { file: 'wbtcBridge', function: 'handleWbtcBridge' },
      extra: { step: 'lockup', direction: step.direction },
    })
    throw new TransactionStepFailedError({
      message: `Failed to lock ${isWbtcToCbtc ? 'WBTC' : 'cBTC'}: ${error instanceof Error ? error.message : String(error)}`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  if (onTransactionHash) {
    onTransactionHash(lockResult.hash)
  }

  setStep(Erc20ChainSwapSubStep.WaitingForBridge)

  // 4. Wait for Boltz to lock on target chain
  try {
    yield* call([ldsBridge, ldsBridge.waitForSwapUntilState], chainSwap.id, LdsSwapStatus.TransactionConfirmed)
    yield* call([ldsBridge, ldsBridge.waitForSwapUntilState], chainSwap.id, LdsSwapStatus.TransactionServerMempool)
    yield* call([ldsBridge, ldsBridge.waitForSwapUntilState], chainSwap.id, LdsSwapStatus.TransactionServerConfirmed)
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)), {
      tags: { file: 'wbtcBridge', function: 'handleWbtcBridge' },
      extra: { swapId: chainSwap.id, step: 'waitForBoltzLock' },
    })
    throw new TransactionStepFailedError({
      message: `Failed waiting for bridge lock: ${error instanceof Error ? error.message : String(error)}. The swap may still be processing.`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }

  // 5. Auto-claim
  setStep(Erc20ChainSwapSubStep.ClaimingTokens)

  if (onSuccess) {
    yield* call(onSuccess)
  }

  popupRegistry.addPopup(
    {
      type: PopupType.ClaimInProgress,
      count: 1,
    },
    `claim-in-progress-${chainSwap.id}`,
    DEFAULT_TXN_DISMISS_MS,
  )

  try {
    const claimedSwap = yield* call([ldsBridge, ldsBridge.autoClaimSwap], chainSwap)
    setCurrentStep({ step: { ...step, subStep: Erc20ChainSwapSubStep.Complete }, accepted: true })

    popupRegistry.removePopup(`claim-in-progress-${chainSwap.id}`)

    const fromChainId = sourceChainId
    const toChainId = isWbtcToCbtc ? citreaChainId : UniverseChainId.Mainnet

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
      tags: { file: 'wbtcBridge', function: 'handleWbtcBridge' },
      extra: { swapId: chainSwap.id, step: 'autoClaimSwapById' },
    })
    throw new TransactionStepFailedError({
      message: `Auto-claim failed: ${error instanceof Error ? error.message : String(error)}`,
      step,
      originalError: error instanceof Error ? error : new Error(String(error)),
    })
  }
}
