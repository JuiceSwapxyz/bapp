import { randomBytes } from '@ethersproject/random'
import { crypto } from 'bitcoinjs-lib'
import { Buffer } from 'buffer'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  createChainSwap,
  createReverseSwap,
  createSubmarineSwap,
  fetchChainPairs,
  fetchChainTransactionsBySwapId,
  fetchReversePairs,
  fetchSubmarinePairs,
  fetchSubmarineTransactionsBySwapId,
  fetchSwapCurrentStatus,
  helpMeClaim,
} from 'uniswap/src/features/lds-bridge/api/client'
import { fetchBlockTipHeight } from 'uniswap/src/features/lds-bridge/api/mempool'
import { createLdsSocketClient } from 'uniswap/src/features/lds-bridge/api/socket'
import { ChainSwapKeys, generateChainSwapKeys } from 'uniswap/src/features/lds-bridge/keys/chainSwapKeys'
import type {
  ChainPairsResponse,
  LightningBridgeReverseGetResponse,
  LightningBridgeSubmarineGetResponse,
} from 'uniswap/src/features/lds-bridge/lds-types/api'
import {
  ChainSwap,
  ReverseSwap,
  SomeSwap,
  SubmarineSwap,
  SwapType,
} from 'uniswap/src/features/lds-bridge/lds-types/storage'
import type { SwapUpdateEvent } from 'uniswap/src/features/lds-bridge/lds-types/websocket'
import {
  LdsSwapStatus,
  hasReachedStatus,
  swapStatusFinal,
  swapStatusPending,
} from 'uniswap/src/features/lds-bridge/lds-types/websocket'
import { StorageManager } from 'uniswap/src/features/lds-bridge/storage/StorageManager'
import { prefix0x } from 'uniswap/src/features/lds-bridge/utils/hex'
import { pollForLockupConfirmation } from 'uniswap/src/features/lds-bridge/utils/polling'
import { applyMigrationV4 } from './utils/migrations'

export const ASSET_CHAIN_ID_MAP: Record<string, UniverseChainId> = {
  'cBTC': UniverseChainId.CitreaMainnet,
  'USDT_ETH': UniverseChainId.Mainnet,
  'USDT_POLYGON': UniverseChainId.Polygon,
  'USDC_ETH': UniverseChainId.Mainnet,
  'USDC_POLYGON': UniverseChainId.Polygon,
  'JUSD_CITREA': UniverseChainId.CitreaMainnet,
  'BTC': UniverseChainId.Bitcoin,
  'WBTC_ETH': UniverseChainId.Mainnet,
}

/* eslint-disable max-params, @typescript-eslint/no-non-null-assertion, consistent-return, @typescript-eslint/explicit-function-return-type, max-lines */
class LdsBridgeManager {
  private socketClient: ReturnType<typeof createLdsSocketClient>
  private storageManager: StorageManager
  private submarinePairs: LightningBridgeSubmarineGetResponse | null = null
  private reversePairs: LightningBridgeReverseGetResponse | null = null
  private chainPairs: ChainPairsResponse | null = null
  constructor() {
    this.socketClient = createLdsSocketClient()
    this.storageManager = new StorageManager()
  }

  getSubmarinePairs = async (): Promise<LightningBridgeSubmarineGetResponse> => {
    if (!this.submarinePairs) {
      this.submarinePairs = await fetchSubmarinePairs()
    }
    return this.submarinePairs
  }

  getReversePairs = async (): Promise<LightningBridgeReverseGetResponse> => {
    if (!this.reversePairs) {
      this.reversePairs = await fetchReversePairs()
    }
    return this.reversePairs
  }

  getChainPairs = async (): Promise<ChainPairsResponse> => {
    if (!this.chainPairs) {
      this.chainPairs = await fetchChainPairs()
    }
    return this.chainPairs
  }

  createReverseSwap = async (params: {
    invoiceAmount: number
    claimAddress: string
    chainId?: UniverseChainId,
    userId: string
  }): Promise<ReverseSwap> => {
    const reversePairs = await this.getReversePairs()
    const pairHash = reversePairs.BTC?.cBTC?.hash
    if (!pairHash) {
      throw new Error('Pair hash not found')
    }

    const { invoiceAmount, claimAddress, chainId, userId } = params
    const { preimageHash, preimage, keyIndex, preimageSeed } = generateChainSwapKeys()

    const reverseInvoiceResponse = await createReverseSwap({
      from: 'BTC',
      to: 'cBTC',
      pairHash,
      invoiceAmount,
      preimageHash,
      claimAddress,
    })

    const reverseSwap: ReverseSwap = {
      userId: userId.toLowerCase(),
      type: SwapType.Reverse,
      version: 4,
      status: LdsSwapStatus.SwapCreated,
      assetSend: 'BTC',
      assetReceive: 'cBTC',
      sendAmount: invoiceAmount,
      receiveAmount: reverseInvoiceResponse.onchainAmount,
      date: Date.now(),
      preimage,
      preimageHash,
      claimAddress,
      claimPrivateKeyIndex: keyIndex,
      preimageSeed,
      keyIndex,
      chainId,
      ...reverseInvoiceResponse,
    }

    await this.storageManager.setSwap(reverseInvoiceResponse.id, reverseSwap)

    this._subscribeToSwapUpdates(reverseInvoiceResponse.id)
    await this.waitForSwapUntilState(reverseInvoiceResponse.id, LdsSwapStatus.SwapCreated)
    return reverseSwap
  }

  createSubmarineSwap = async (params: { invoice: string; chainId?: UniverseChainId; userId: string }): Promise<SubmarineSwap> => {
    const submarinePairs = await this.getSubmarinePairs()
    const pairHash = submarinePairs.cBTC?.BTC?.hash
    if (!pairHash) {
      throw new Error('Pair hash not found')
    }
    const { invoice, chainId, userId } = params
    const { preimageHash, claimPublicKey, preimage, keyIndex, preimageSeed } = generateChainSwapKeys()
    const lockupResponse = await createSubmarineSwap({
      from: 'cBTC',
      to: 'BTC',
      invoice,
      pairHash,
      referralId: 'boltz_webapp_desktop',
      refundPublicKey: claimPublicKey,
    })
    const submarineSwap: SubmarineSwap = {
      userId: userId.toLowerCase(),
      type: SwapType.Submarine,
      version: 4,
      status: LdsSwapStatus.InvoiceSet,
      assetSend: 'cBTC',
      assetReceive: 'BTC',
      sendAmount: lockupResponse.expectedAmount,
      receiveAmount: lockupResponse.expectedAmount,
      date: Date.now(),
      invoice,
      preimageHash,
      preimage,
      refundPrivateKeyIndex: keyIndex,
      preimageSeed,
      keyIndex,
      chainId,
      ...lockupResponse,
    }

    await this.storageManager.setSwap(lockupResponse.id, submarineSwap)
    this._subscribeToSwapUpdates(lockupResponse.id)
    await this.waitForSwapUntilState(lockupResponse.id, LdsSwapStatus.InvoiceSet)
    return submarineSwap
  }

  createChainSwap = async (params: {
    from: string
    to: string
    claimAddress: string
    userLockAmount: number
    chainId?: UniverseChainId,
    userId: string
  }): Promise<ChainSwap> => {
    const chainPairs = await this.getChainPairs()
    const pairHash = chainPairs[params.from]?.[params.to]?.hash
    if (!pairHash) {
      throw new Error('Pair hash not found')
    }

    const { from, to, claimAddress, userLockAmount, chainId, userId } = params
    const {
      preimageHash: preimageHashFromKey,
      claimPublicKey: publicKey,
      preimage: preimageFromKey,
      keyIndex,
      preimageSeed,
    } = generateChainSwapKeys()

    const randomPreimage = Buffer.from(randomBytes(32))
    const claimPublicKey = params.from === 'cBTC' ? publicKey : undefined
    const preimage = params.from === 'cBTC' ? randomPreimage.toString('hex') : preimageFromKey
    const preimageHash = params.from === 'cBTC' ? crypto.sha256(randomPreimage).toString('hex') : preimageHashFromKey
    const refundPublicKey = params.from === 'BTC' ? publicKey : undefined

    const chainSwapResponse = await createChainSwap({
      from,
      to,
      pairHash,
      referralId: 'boltz_webapp_desktop',
      claimPublicKey,
      refundPublicKey,
      userLockAmount,
      preimageHash,
      claimAddress,
    })

    const chainSwap: ChainSwap = {
      userId: userId.toLowerCase(),
      type: SwapType.Chain,
      version: 4,
      status: LdsSwapStatus.SwapCreated,
      assetSend: params.from,
      assetReceive: params.to,
      sendAmount: chainSwapResponse.lockupDetails.amount,
      receiveAmount: chainSwapResponse.lockupDetails.amount,
      date: Date.now(),
      preimageHash,
      preimage,
      claimAddress,
      claimPrivateKeyIndex: keyIndex,
      refundPrivateKeyIndex: keyIndex,
      preimageSeed,
      keyIndex,
      chainId,
      ...chainSwapResponse,
    }

    await this.storageManager.setSwap(chainSwapResponse.id, chainSwap)

    this._subscribeToSwapUpdates(chainSwapResponse.id)
    await this.waitForSwapUntilState(chainSwapResponse.id, LdsSwapStatus.SwapCreated)
    return chainSwap
  }

  autoClaimSwap = async (swap: SomeSwap): Promise<SomeSwap> => {
    const chainId = ASSET_CHAIN_ID_MAP[swap.assetReceive]
    if (!chainId) {
      throw new Error('Chain ID not found')
    }

    const { promise: ponderPromise, cancel: cancelPonderPolling } = pollForLockupConfirmation(swap.preimageHash, chainId)
    await ponderPromise
    cancelPonderPolling()

    if (!swap.preimage) {
      throw new Error('Swap preimage not found')
    }

    const { txHash } = await helpMeClaim({
      preimage: swap.preimage,
      preimageHash: prefix0x(swap.preimageHash),
      chainId
    })

    swap.claimTx = txHash
    swap.status = LdsSwapStatus.TransactionClaimed
    await this.storageManager.setSwap(swap.id, swap)
    return swap
  }

  updateSwapRefundTx = async (swapId: string, refundTxId: string): Promise<void> => {
    const swap = await this.storageManager.getSwap(swapId)
    if (!swap) {
      throw new Error('Swap not found')
    }

    this.socketClient.unsubscribeFromSwapById(swapId)

    swap.refundTx = refundTxId
    swap.status = LdsSwapStatus.UserRefunded
    await this.storageManager.setSwap(swapId, swap)
  }

  updateSwapClaimTx = async (swapId: string, claimTxId: string): Promise<void> => {
    const swap = await this.storageManager.getSwap(swapId)
    if (!swap) {
      throw new Error('Swap not found')
    }

    this.socketClient.unsubscribeFromSwapById(swapId)

    swap.claimTx = claimTxId
    swap.status = LdsSwapStatus.UserClaimed
    await this.storageManager.setSwap(swapId, swap)
  }

  _subscribeToSwapUpdates = (swapId: string): void => {
    const updateCallback = async (event: SwapUpdateEvent): Promise<void> => {
      const swap = await this.storageManager.getSwap(swapId)
      if (!swap) {
        this.socketClient.unsubscribeFromSwapUpdates(updateCallback)
        return
      }
      swap.status = event.status
      await this.storageManager.setSwap(swapId, swap)
    }
    this.socketClient.subscribeToSwapUpdates(swapId, updateCallback)
  }

  getKeysForSwap = async (swapId: string): Promise<ChainSwapKeys> => {
    const swap = await this.storageManager.getSwap(swapId)
    if (!swap || !swap.preimageSeed || !swap.keyIndex) {
      throw new Error('Swap not found')
    }
    return generateChainSwapKeys(swap.preimageSeed, swap.keyIndex)
  }

  waitForSwapUntilState = async (swapId: string, state: LdsSwapStatus, timeoutMs = 120000): Promise<void> => {
    const swap = await this.storageManager.getSwap(swapId)
    if (!swap) {
      throw new Error('Swap not found')
    }

    // Check if we've already reached or passed the target state
    if (swap.status && hasReachedStatus(swap.status, state)) {
      return
    }

    if (swapStatusFinal.includes(swap.status!) && !hasReachedStatus(swap.status!, state)) {
      throw new Error(`Swap is in state: ${swap.status}, click below to see more details.`)
    }

    const abortController = new AbortController()
    const { signal } = abortController

    try {
      await Promise.race([
        this.waitViaWebSocket(swapId, state, signal),
        this.pollUntilState(swapId, state, signal),
      ])
    } finally {
      abortController.abort()
    }
  }

  private waitViaWebSocket(swapId: string, state: LdsSwapStatus, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const callback = (event: SwapUpdateEvent) => {
        if (hasReachedStatus(event.status, state)) {
          resolve()
        } else if (event.failureReason) {
          reject(new Error(event.failureReason))
        } else if (swapStatusFinal.includes(event.status)) {
          reject(new Error(`Swap reached state ${event.status}, click below to see more details.`))
        }
      }

      this.socketClient.subscribeToSwapUpdates(swapId, callback)
      signal.addEventListener('abort', () => {
        this.socketClient.unsubscribeFromSwapUpdates(callback)
      })
    })
  }

  private async pollUntilState(swapId: string, state: LdsSwapStatus, signal: AbortSignal): Promise<void> {
    while (!signal.aborted) {
      await new Promise((r) => setTimeout(r, 15000))
      if (signal.aborted) {
        break
      }

      try {
        const status = await fetchSwapCurrentStatus(swapId)
        if (hasReachedStatus(status.status, state)) {
          return
        }
        if (swapStatusFinal.includes(status.status)) {
          throw new Error(`Swap reached final state ${status.status} before ${state}`)
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[LdsBridgeManager] Error polling status:', error)
      }
    }
  }

  /**
   * @deprecated Only for backwards compatibility
   */
  getLocalStorageSwaps = async (): Promise<Record<string, SomeSwap>> => {
    return await this.storageManager.getSwaps()
  }

  getLockupTransactions = async (
    swap: SomeSwap,
  ): Promise<{ id: string; hex: string; timeoutBlockHeight: number; timeoutEta?: number }> => {
    switch (swap.type) {
      case SwapType.Chain: {
        const chainTransactionsResponse = await fetchChainTransactionsBySwapId(swap.id)
        const userLock = chainTransactionsResponse.userLock
        if (!userLock?.transaction.id || !userLock.transaction.hex || !userLock.timeout.blockHeight) {
          throw new Error('Missing required transaction data')
        }
        return {
          id: userLock.transaction.id,
          hex: userLock.transaction.hex,
          timeoutBlockHeight: userLock.timeout.blockHeight,
          timeoutEta: userLock.timeout.eta,
        }
      }
      case SwapType.Submarine:
        return fetchSubmarineTransactionsBySwapId(swap.id)
      default:
        throw new Error('Swap type not supported')
    }
  }

  applyMigrations = async (): Promise<void> => {
    const swaps = await this.getLocalStorageSwaps()
    const migratedSwaps = applyMigrationV4(swaps)
    await this.storageManager.saveBulkSwaps(migratedSwaps)
  }
}

let ldsBridgeManager: LdsBridgeManager | null = null
export const getLdsBridgeManager = (): LdsBridgeManager => {
  if (!ldsBridgeManager) {
    ldsBridgeManager = new LdsBridgeManager()
  }
  return ldsBridgeManager
}