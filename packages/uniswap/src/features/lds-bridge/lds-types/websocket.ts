export enum LdsSwapStatus {
  // Pending statuses
  InvoiceSet = 'invoice.set',
  InvoicePending = 'invoice.pending',
  SwapCreated = 'swap.created',
  TransactionConfirmed = 'transaction.confirmed',
  TransactionMempool = 'transaction.mempool',
  TransactionZeroConfRejected = 'transaction.zeroconf.rejected',
  TransactionClaimPending = 'transaction.claim.pending',
  TransactionServerMempool = 'transaction.server.mempool',
  TransactionServerConfirmed = 'transaction.server.confirmed',
  // Failed statuses
  SwapExpired = 'swap.expired',
  SwapRefunded = 'swap.refunded',
  SwapWaitingForRefund = 'swap.waitingForRefund',
  InvoiceExpired = 'invoice.expired',
  InvoiceFailedToPay = 'invoice.failedToPay',
  TransactionFailed = 'transaction.failed',
  TransactionLockupFailed = 'transaction.lockupFailed',
  TransactionRefunded = 'transaction.refunded',
  // Success statuses
  InvoiceSettled = 'invoice.settled',
  TransactionClaimed = 'transaction.claimed',

  // Local user statuses (not from LDS)
  UserRefunded = 'local.userRefunded',
  UserClaimed = 'local.userClaimed',
  UserAbandoned = 'local.userAbandoned',
}

export const swapStatusPending = {
  InvoiceSet: LdsSwapStatus.InvoiceSet,
  InvoicePending: LdsSwapStatus.InvoicePending,
  SwapCreated: LdsSwapStatus.SwapCreated,
  TransactionConfirmed: LdsSwapStatus.TransactionConfirmed,
  TransactionMempool: LdsSwapStatus.TransactionMempool,
  TransactionZeroConfRejected: LdsSwapStatus.TransactionZeroConfRejected,
  TransactionClaimPending: LdsSwapStatus.TransactionClaimPending,
  TransactionServerMempool: LdsSwapStatus.TransactionServerMempool,
  TransactionServerConfirmed: LdsSwapStatus.TransactionServerConfirmed,
}

export const swapStatusFailed = {
  SwapExpired: LdsSwapStatus.SwapExpired,
  SwapRefunded: LdsSwapStatus.SwapRefunded,
  SwapWaitingForRefund: LdsSwapStatus.SwapWaitingForRefund,
  InvoiceExpired: LdsSwapStatus.InvoiceExpired,
  InvoiceFailedToPay: LdsSwapStatus.InvoiceFailedToPay,
  TransactionFailed: LdsSwapStatus.TransactionFailed,
  TransactionLockupFailed: LdsSwapStatus.TransactionLockupFailed,
  TransactionRefunded: LdsSwapStatus.TransactionRefunded,
}

export const swapStatusSuccess = {
  InvoiceSettled: LdsSwapStatus.InvoiceSettled,
  TransactionClaimed: LdsSwapStatus.TransactionClaimed,
  UserClaimed: LdsSwapStatus.UserClaimed,
}

export const swapStatusFinal = [
  ...Object.values(swapStatusFailed),
  ...Object.values(swapStatusSuccess),
  LdsSwapStatus.UserRefunded,
  LdsSwapStatus.UserClaimed,
  LdsSwapStatus.UserAbandoned,
  swapStatusPending.TransactionClaimPending, // Stop polling once claim is pending
]

export const localUserFinalStatuses = [
  LdsSwapStatus.UserRefunded,
  LdsSwapStatus.UserClaimed,
  LdsSwapStatus.UserAbandoned,
]

// Chain swap status progression order (for ERC20 chain swaps)
export const chainSwapStatusOrder: LdsSwapStatus[] = [
  LdsSwapStatus.SwapCreated,
  LdsSwapStatus.TransactionMempool,
  LdsSwapStatus.TransactionConfirmed,
  LdsSwapStatus.TransactionServerMempool,
  LdsSwapStatus.TransactionServerConfirmed,
  LdsSwapStatus.TransactionClaimed,
]

/**
 * Check if currentStatus has reached or passed targetStatus in the chain swap flow
 */
export function hasReachedStatus(currentStatus: LdsSwapStatus, targetStatus: LdsSwapStatus): boolean {
  const currentIndex = chainSwapStatusOrder.indexOf(currentStatus)
  const targetIndex = chainSwapStatusOrder.indexOf(targetStatus)

  // If either status is not in the progression, fall back to exact match
  if (currentIndex === -1 || targetIndex === -1) {
    return currentStatus === targetStatus
  }

  return currentIndex >= targetIndex
}

/** Check if a swap status is pending (not final) */
export function isSwapPending(status?: LdsSwapStatus): boolean {
  return !status || !swapStatusFinal.includes(status)
}

/** Get the high-level category for a swap status */
export function getSwapStatusCategory(status?: LdsSwapStatus): 'pending' | 'success' | 'failed' {
  if (!status) {
    return 'pending'
  }
  if (Object.values(swapStatusSuccess).includes(status)) {
    return 'success'
  }
  if (Object.values(swapStatusFailed).includes(status)) {
    return 'failed'
  }
  if(Object.values(swapStatusPending).includes(status)) {
    return 'pending'
  }
  return 'success'
}

export interface SwapUpdateEvent {
  id?: string
  status: LdsSwapStatus
  failureReason?: string
}

export interface WebSocketMessage {
  event: string
  channel: string
  args: SwapUpdateEvent[]
}
