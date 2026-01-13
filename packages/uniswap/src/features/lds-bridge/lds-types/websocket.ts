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
}

export const swapStatusFinal = [
  swapStatusFailed.InvoiceExpired,
  swapStatusFailed.SwapExpired,
  swapStatusFailed.SwapRefunded,
  swapStatusFailed.InvoiceFailedToPay,
  swapStatusFailed.TransactionRefunded,
  swapStatusPending.TransactionClaimPending,
].concat(Object.values(swapStatusSuccess))

export interface SwapUpdateEvent {
  id?: string
  status: LdsSwapStatus
}

export interface WebSocketMessage {
  event: string
  channel: string
  args: SwapUpdateEvent[]
}
