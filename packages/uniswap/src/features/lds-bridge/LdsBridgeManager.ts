import { randomBytes } from '@ethersproject/random'
import { crypto } from 'bitcoinjs-lib'
import { Buffer } from 'buffer'
import { getFetchErrorMessage } from 'uniswap/src/data/apiClients/FetchError'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  createChainSwap,
  createReverseSwap,
  createSubmarineSwap,
  fetchChainPairs,
  fetchChainTransactionsBySwapId,
  fetchLockupsByPreimageHashes,
  fetchReversePairs,
  fetchSubmarinePairs,
  fetchSubmarineTransactionsBySwapId,
  fetchSwapCurrentStatus,
  helpMeClaim,
} from 'uniswap/src/features/lds-bridge/api/client'
import { fetchBlockTipHeight, fetchTransactionByAddress } from 'uniswap/src/features/lds-bridge/api/mempool'
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
  isSwapPending,
  localUserFinalStatuses,
  swapStatusFinal,
  swapStatusPending,
} from 'uniswap/src/features/lds-bridge/lds-types/websocket'
import { StorageManager } from 'uniswap/src/features/lds-bridge/storage/StorageManager'
import { SwapEventEmitter } from 'uniswap/src/features/lds-bridge/storage/SwapEventEmitter'
import { prefix0x } from 'uniswap/src/features/lds-bridge/utils/hex'
import { pollForLockupConfirmation } from 'uniswap/src/features/lds-bridge/utils/polling'
import { isBitcoinAddress } from './utils/bitcoinAddress'
import { applyMigrationV4 } from './utils/migrations'

const POLLING_INTERVALS = {
  BACKGROUND_CHECK_MS: 30_000,
  FRESH_SWAP_AGE_MS: 5 * 60_000, // 5 minutes
  FRESH_SWAP_POLL_MS: 30_000, // Poll every 30s for fresh swaps
  MEDIUM_SWAP_AGE_MS: 60 * 60_000, // 1 hour
  MEDIUM_SWAP_POLL_MS: 60_000, // Poll every 60s for medium-age swaps
  OLD_SWAP_POLL_MS: 120_000, // Poll every 2min for old swaps
} as const

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
class LdsBridgeManager extends SwapEventEmitter {
  private socketClient: ReturnType<typeof createLdsSocketClient>
  private storageManager: StorageManager
  private submarinePairs: LightningBridgeSubmarineGetResponse | null = null
  private reversePairs: LightningBridgeReverseGetResponse | null = null
  private chainPairs: ChainPairsResponse | null = null
  private pollingInterval: ReturnType<typeof setInterval> | null = null
  private lastPollTime: number = 0
  private visibilityHandler: (() => void) | null = null
  private wasPollingBeforeHidden: boolean = false

  constructor() {
    super()
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

  startBackgroundPolling = (): void => {
    if (this.pollingInterval) {
      return // Already running
    }

    this.setupVisibilityHandling()

    this.pollingInterval = setInterval(() => {
      this.pollPendingSwapsIfNeeded().catch(() => {
        // Errors are logged inside pollPendingSwapsIfNeeded
      })
    }, POLLING_INTERVALS.BACKGROUND_CHECK_MS)
  }

  stopBackgroundPolling = (): void => {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
  }

  private setupVisibilityHandling = (): void => {
    if (typeof document === 'undefined' || this.visibilityHandler) {
      return
    }

    this.visibilityHandler = () => {
      if (document.hidden) {
        if (this.pollingInterval) {
          this.wasPollingBeforeHidden = true
          this.stopBackgroundPolling()
        }
      } else if (this.wasPollingBeforeHidden) {
        this.wasPollingBeforeHidden = false
        this.startBackgroundPolling()
      }
    }

    document.addEventListener('visibilitychange', this.visibilityHandler)
  }

  private cleanupVisibilityHandling = (): void => {
    if (typeof document === 'undefined' || !this.visibilityHandler) {
      return
    }

    document.removeEventListener('visibilitychange', this.visibilityHandler)
    this.visibilityHandler = null
    this.wasPollingBeforeHidden = false
  }

  private pollPendingSwapsIfNeeded = async (): Promise<void> => {
    const pendingSwaps = await this.getPendingSwaps()

    if (pendingSwaps.length === 0) {
      this.stopBackgroundPolling()
      this.cleanupVisibilityHandling()
      return
    }

    const now = Date.now()
    const oldestSwapAge = Math.max(...pendingSwaps.map((s) => now - s.date))
    const timeSinceLastPoll = now - this.lastPollTime

    // Adaptive polling: more frequent for fresh swaps
    const shouldPoll =
      (oldestSwapAge < POLLING_INTERVALS.FRESH_SWAP_AGE_MS &&
        timeSinceLastPoll >= POLLING_INTERVALS.FRESH_SWAP_POLL_MS) ||
      (oldestSwapAge < POLLING_INTERVALS.MEDIUM_SWAP_AGE_MS &&
        timeSinceLastPoll >= POLLING_INTERVALS.MEDIUM_SWAP_POLL_MS) ||
      timeSinceLastPoll >= POLLING_INTERVALS.OLD_SWAP_POLL_MS

    if (shouldPoll) {
      this.lastPollTime = now
      await this.updatePendingSwapsStatuses()
    }
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
    this.startBackgroundPolling()
    await this._notifySwapChanges()
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
    this.startBackgroundPolling()
    await this.waitForSwapUntilState(lockupResponse.id, LdsSwapStatus.InvoiceSet)
    await this._notifySwapChanges()
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
    this.startBackgroundPolling()
    await this.waitForSwapUntilState(chainSwapResponse.id, LdsSwapStatus.SwapCreated)
    await this._notifySwapChanges()
    return chainSwap
  }

  autoClaimSwap = async (swapId: string): Promise<SomeSwap> => {
    const swap = await this.storageManager.getSwap(swapId)
    if (!swap) {
      throw new Error('Swap not found')
    }

    // Wait for Ponder to confirm lockup before claiming.
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
    // Update status locally since we know the claim succeeded
    // This ensures the UI shows completion even if backend status lags
    swap.status = LdsSwapStatus.TransactionClaimed
    await this.storageManager.setSwap(swapId, swap)
    this._notifySwapChanges()
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
    await this._notifySwapChanges()
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
    await this._notifySwapChanges()
  }

  syncSwapsWithIndexedData = async (userAddress: string): Promise<void> => {
    if (!userAddress) {
      return
    }

    const swaps = await this.storageManager.getSwaps()
    const swapsWithIncompleteTransactions = Object.values(swaps)
      .filter((swap) => !swap.claimTx && !swap.refundTx)
      .filter((swap) => swap.status && !localUserFinalStatuses.includes(swap.status))

    const preimageHashes = swapsWithIncompleteTransactions.map((swap) => swap.preimageHash)

    if (preimageHashes.length === 0) {
      return
    }

    const lockups = await fetchLockupsByPreimageHashes(preimageHashes)
    const lockupsItems = lockups.data.lockupss?.items
    if (!lockupsItems || lockupsItems.length === 0) {
      return
    }

    const claims = lockupsItems.filter((lockup) => lockup.claimAddress.toLowerCase() === userAddress.toLowerCase())
    const refunds = lockupsItems.filter((lockup) => lockup.refundAddress.toLowerCase() === userAddress.toLowerCase())

    // Update swaps with claim transactions
    const updatedClaims: SomeSwap[] = []
    for (const claim of claims) {
      const swapEntry = Object.entries(swaps).find(
        ([_, swap]) => prefix0x(swap.preimageHash) === prefix0x(claim.preimageHash),
      )

      if (swapEntry) {
        const [_swapId, swap] = swapEntry
        if (!swap.claimTx && claim.claimTxHash) {
          swap.claimTx = claim.claimTxHash
          swap.status = LdsSwapStatus.UserClaimed
          updatedClaims.push(swap)
        }
      }
    }

    if (updatedClaims.length > 0) {
      await this.storageManager.saveBulkSwaps(updatedClaims)
      await this._notifySwapChanges()
    }

    // Update swaps with refund transactions
    const updatedRefunds: SomeSwap[] = []
    for (const refund of refunds) {
      const swapEntry = Object.entries(swaps).find(
        ([_, swap]) => prefix0x(swap.preimageHash) === prefix0x(refund.preimageHash),
      )

      if (swapEntry) {
        const [_swapId, swap] = swapEntry
        if (!swap.refundTx && refund.refundTxHash) {
          swap.refundTx = refund.refundTxHash
          swap.status = LdsSwapStatus.UserRefunded
          updatedRefunds.push(swap)
        }
      }
    }

    if (updatedRefunds.length > 0) {
      await this.storageManager.saveBulkSwaps(updatedRefunds)
      await this._notifySwapChanges()
    }

    // Update expired EVM swaps with no transactions
    const updatedExpiredSwaps: SomeSwap[] = []
    const expiredSwaps = Object.values(swaps)
      .filter((swap) => swap.status && swap.status === LdsSwapStatus.SwapExpired)
      .filter((swap) => swap.type === SwapType.Chain)
      .filter((swap) => swap.assetSend !== 'BTC' && swap.assetReceive !== 'BTC')

    for (const expiredSwap of expiredSwaps) {
      const relatedLockups = lockupsItems.filter((lockup) => prefix0x(lockup.preimageHash) === prefix0x(expiredSwap.preimageHash))
      if (relatedLockups.length === 0) {
        expiredSwap.status = LdsSwapStatus.UserAbandoned
        updatedExpiredSwaps.push(expiredSwap)
      }
    }

    if (updatedExpiredSwaps.length > 0) {
      await this.storageManager.saveBulkSwaps(updatedExpiredSwaps)
      await this._notifySwapChanges()
    }
  }

  syncSwapsWithChainAndMempoolData = async (): Promise<void> => {
    const swaps = await this.storageManager.getSwaps()

    const btcSendBtcSwaps = Object.values(swaps)
      .filter((swap) => swap.assetSend === 'BTC')
      .filter((swap) => swap.status && !localUserFinalStatuses.includes(swap.status))
      .filter((swap) => swap.status && !Object.values(swapStatusPending).includes(swap.status))
      .filter((swap) => swap.status && Object.values(swapStatusFinal).includes(swap.status))
      .filter((swap) => swap.status !== LdsSwapStatus.TransactionLockupFailed)
      .filter((swap) => swap.type === SwapType.Chain)
      .filter((swap) => !swap.claimTx && !swap.refundTx)

    const updatedBtcSendBtcSwaps: SomeSwap[] = []
    for (const swap of btcSendBtcSwaps) {
      const lockupAddress = (swap as ChainSwap).lockupDetails.lockupAddress
      if (!lockupAddress) {
        continue
      }
      const swapTransactions = await fetchTransactionByAddress(lockupAddress)
      if (swapTransactions.length === 0) {
        swap.status = LdsSwapStatus.UserAbandoned
        updatedBtcSendBtcSwaps.push(swap)
        continue
      }
    }

    if (updatedBtcSendBtcSwaps.length > 0) {
      await this.storageManager.saveBulkSwaps(updatedBtcSendBtcSwaps)
      await this._notifySwapChanges()
    }

    const updatedBtcClaimBtcSwaps: SomeSwap[] = []
    const btcSwaps = Object.values(swaps)
      .filter((swap) => isBitcoinAddress(swap.claimAddress))
      .filter(swap => swap.status && swap.status === LdsSwapStatus.TransactionClaimPending)

    for (const swap of btcSwaps) {
      const swapTransactions = await fetchChainTransactionsBySwapId(swap.id)
      const lockupTx = swapTransactions.serverLock?.transaction.id

      // If still unknown, skip
      if (!lockupTx) {
        continue
      }

      swap.lockupTx = lockupTx
      const transactionChain = await fetchTransactionByAddress(swap.claimAddress)
      const claimTxData = transactionChain.find(tx => tx.vin.some(vin => vin.txid === lockupTx))

      if (!claimTxData) {
        updatedBtcClaimBtcSwaps.push(swap)
        continue
      }

      swap.claimTx = claimTxData.txid
      swap.status = LdsSwapStatus.UserClaimed
      updatedBtcClaimBtcSwaps.push(swap)
    }

    if (updatedBtcClaimBtcSwaps.length > 0) {
      await this.storageManager.saveBulkSwaps(updatedBtcClaimBtcSwaps)
      await this._notifySwapChanges()
    }
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
      await this._notifySwapChanges()
    }
    this.socketClient.subscribeToSwapUpdates(swapId, updateCallback)
  }

  private async _notifySwapChanges(): Promise<void> {
    const swaps = await this.storageManager.getSwaps()
    this.notifyListeners(swaps)
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

  getSwaps = async (): Promise<Record<string, SomeSwap>> => {
    return await this.storageManager.getSwaps()
  }

  getSwap = async (swapId: string): Promise<SomeSwap | undefined> => {
    return await this.storageManager.getSwap(swapId)
  }

  getPendingSwaps = async (): Promise<SomeSwap[]> => {
    const swaps = await this.storageManager.getSwaps()
    // Include swaps with missing status so they can be polled and recover
    return Object.values(swaps).filter((swap) => isSwapPending(swap.status))
  }

  updatePendingSwapsStatuses = async (): Promise<void> => {
    const swaps = await this.storageManager.getSwaps()
    // Include swaps with missing status so they can be polled and recover
    const pendingSwaps = Object.values(swaps).filter((swap) => isSwapPending(swap.status))

    if (pendingSwaps.length === 0) {
      return
    }

    const state = { hasChanges: false }

    await Promise.all(
      pendingSwaps.map(async (swap) => {
        try {
          const status = await fetchSwapCurrentStatus(swap.id)
          if (swap.status !== status.status) {
            swap.status = status.status
            await this.storageManager.setSwap(swap.id, swap)
            state.hasChanges = true
          }
        } catch (error) {
          // If swap not found on backend (expired/cleaned up), mark as expired
          const apiErrorMessage = getFetchErrorMessage(error)
          if (apiErrorMessage?.includes('could not find swap')) {
            // eslint-disable-next-line no-console
            console.warn(`[LdsBridgeManager] Swap ${swap.id} not found on backend, marking as expired`)
            swap.status = LdsSwapStatus.SwapExpired
            await this.storageManager.setSwap(swap.id, swap)
            state.hasChanges = true
          } else {
            // eslint-disable-next-line no-console
            console.error('[LdsBridgeManager] Error updating swap status:', error)
          }
        }
      }),
    )

    // Only notify once at the end if there were changes
    if (state.hasChanges) {
      await this._notifySwapChanges()
    }
  }

  suscribeAllPendingSwaps = async (): Promise<void> => {
    await this.updatePendingSwapsStatuses()
    const swaps = await this.storageManager.getSwaps()
    // Include swaps with missing status so they can be polled and recover
    const pendingSwaps = Object.values(swaps).filter((swap) => isSwapPending(swap.status))
    pendingSwaps.forEach((swap) => {
      this._subscribeToSwapUpdates(swap.id)
    })

    // Start background polling if there are pending swaps
    if (pendingSwaps.length > 0) {
      this.startBackgroundPolling()
    }
  }

  getLockupTransactions = async (
    swapId: string,
  ): Promise<{ id: string; hex: string; timeoutBlockHeight: number; timeoutEta?: number }> => {
    const swap = await this.storageManager.getSwap(swapId)
    if (!swap) {
      throw new Error('Swap not found')
    }

    switch (swap.type) {
      case SwapType.Chain: {
        const chainTransactionsResponse = await fetchChainTransactionsBySwapId(swapId)
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
        return fetchSubmarineTransactionsBySwapId(swapId)
      default:
        throw new Error('Swap type not supported')
    }
  }

  getChainRefundbleSwaps = async (): Promise<SomeSwap[]> => {
    const swaps = await this.getSwaps()
    const refundableCandidates = Object.values(swaps)
      .filter((swap) => !swap.refundTx && !swap.claimTx)
      .filter((swap) => swap.type === SwapType.Chain)
      .filter((swap) => swap.assetSend === 'BTC')
      .filter((swap) => swap.status !== LdsSwapStatus.SwapCreated)
      .filter((swap) => !Object.values(swapStatusPending).includes(swap.status!))

    const blockTipHeight = await fetchBlockTipHeight()
    const refundableSwaps = await Promise.all(
      refundableCandidates.map(async (swap) => {
        try {
          const { timeoutBlockHeight } = await this.getLockupTransactions(swap.id)
          if (timeoutBlockHeight < blockTipHeight) {
            return swap
          }
          return null
        } catch (error) {
          return null
        }
      }),
    )

    return refundableSwaps.filter((swap): swap is SomeSwap => swap !== null)
  }

  applyMigrations = async (): Promise<void> => {
    const swaps = await this.getSwaps()
    const migratedSwaps = applyMigrationV4(swaps)
    await this.storageManager.saveBulkSwaps(migratedSwaps)
    await this._notifySwapChanges()
  }
}

let ldsBridgeManager: LdsBridgeManager | null = null
export const getLdsBridgeManager = (): LdsBridgeManager => {
  if (!ldsBridgeManager) {
    ldsBridgeManager = new LdsBridgeManager()
  }
  return ldsBridgeManager
}