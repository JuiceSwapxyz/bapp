import { formatSatoshiAmount } from 'pages/BridgeSwaps/utils'
import { useState } from 'react'
import { Flex, Text, styled } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { Clock } from 'ui/src/components/icons/Clock'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { ChainSwap, SomeSwap, SwapType } from 'uniswap/src/features/lds-bridge/lds-types/storage'
import { LdsSwapStatus, swapStatusSuccess } from 'uniswap/src/features/lds-bridge/lds-types/websocket'

const Card = styled(Flex, {
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  padding: '$spacing16',
  gap: '$spacing12',
  cursor: 'pointer',
  pressStyle: {
    opacity: 0.9,
  },
  hoverStyle: {
    backgroundColor: '$surface3',
  },
})

const CardHeader = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
})

const SwapInfo = styled(Flex, {
  flex: 1,
  gap: '$spacing8',
})

const SwapAmounts = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing8',
  flexWrap: 'wrap',
})

const StatusBadge = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing4',
  paddingHorizontal: '$spacing12',
  paddingVertical: '$spacing4',
  borderRadius: '$rounded8',
  variants: {
    status: {
      pending: {
        backgroundColor: '$DEP_accentWarning',
      },
      completed: {
        backgroundColor: '$statusSuccess',
      },
      failed: {
        backgroundColor: '$statusCritical',
      },
    },
  },
})

const DetailRow = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: '$spacing4',
  gap: '$spacing8',
})

const DetailLabel = styled(Text, {
  variant: 'body3',
  color: '$neutral2',
})

const DetailValue = styled(Text, {
  variant: 'body3',
  color: '$neutral1',
  fontFamily: '$mono',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '60%',
})

const ExpandButton = styled(Flex, {
  padding: '$spacing8',
  borderRadius: '$rounded8',
  variants: {
    expanded: {
      true: {
        transform: [{ rotate: '180deg' }],
      },
    },
  },
})

interface SwapCardProps {
  swap: SomeSwap & { id: string }
}

function getStatusInfo(swap: SomeSwap): {
  label: string
  status: 'pending' | 'completed' | 'failed'
  icon: JSX.Element
} {
  if (!swap.status) {
    return {
      label: 'Pending',
      status: 'pending',
      icon: <Clock size="$icon.16" color="$neutral1" />,
    }
  }

  const userRefunded = swap.status === LdsSwapStatus.SwapWaitingForRefund && swap.refundTx
  const statusSuccess = Object.values(swapStatusSuccess).includes(swap.status)

  if (statusSuccess || userRefunded) {
    return {
      label: 'Completed',
      status: 'completed',
      icon: <CheckCircleFilled size="$icon.16" color="$statusSuccess" />,
    }
  }

  if (swap.status === LdsSwapStatus.TransactionRefunded && !swap.refundTx) {
    return {
      label: 'Awaiting Refund',
      status: 'failed',
      icon: <AlertTriangleFilled size="$icon.16" color="$statusCritical" />,
    }
  }

  switch (swap.status) {
    case LdsSwapStatus.TransactionClaimed:
    case LdsSwapStatus.InvoiceSettled:
    case LdsSwapStatus.UserClaimed:
      return {
        label: 'Completed',
        status: 'completed',
        icon: <CheckCircleFilled size="$icon.16" color="$statusSuccess" />,
      }

    case LdsSwapStatus.SwapRefunded:
    case LdsSwapStatus.UserRefunded:
      return {
        label: 'Refunded',
        status: 'failed',
        icon: <AlertTriangleFilled size="$icon.16" color="$statusCritical" />,
      }

    case LdsSwapStatus.TransactionFailed:
    case LdsSwapStatus.InvoiceFailedToPay:
    case LdsSwapStatus.TransactionLockupFailed:
      return {
        label: 'Failed',
        status: 'failed',
        icon: <AlertTriangleFilled size="$icon.16" color="$statusCritical" />,
      }

    case LdsSwapStatus.SwapExpired:
    case LdsSwapStatus.InvoiceExpired:
      return {
        label: 'Expired',
        status: 'failed',
        icon: <AlertTriangleFilled size="$icon.16" color="$statusCritical" />,
      }

    case LdsSwapStatus.SwapCreated:
      return {
        label: 'Created',
        status: 'pending',
        icon: <Clock size="$icon.16" color="$neutral1" />,
      }

    // Invoice pending states (submarine swaps waiting for payment)
    case LdsSwapStatus.InvoiceSet:
    case LdsSwapStatus.InvoicePending:
      return {
        label: 'Awaiting Payment',
        status: 'pending',
        icon: <Clock size="$icon.16" color="$neutral1" />,
      }

    // Claim is pending - swap nearly complete
    case LdsSwapStatus.TransactionClaimPending:
      return {
        label: 'Claiming',
        status: 'pending',
        icon: <Clock size="$icon.16" color="$neutral1" />,
      }

    // Zero-conf rejected needs more confirmations
    case LdsSwapStatus.TransactionZeroConfRejected:
      return {
        label: 'Confirming',
        status: 'pending',
        icon: <Clock size="$icon.16" color="$neutral1" />,
      }

    case LdsSwapStatus.TransactionMempool:
    case LdsSwapStatus.TransactionConfirmed:
    case LdsSwapStatus.TransactionServerMempool:
    case LdsSwapStatus.TransactionServerConfirmed:
      return {
        label: 'Processing',
        status: 'pending',
        icon: <Clock size="$icon.16" color="$neutral1" />,
      }

    default:
      return {
        label: 'Unknown',
        status: 'pending',
        icon: <Clock size="$icon.16" color="$neutral1" />,
      }
  }
}

function getSwapTypeLabel(type: SwapType): string {
  switch (type) {
    case SwapType.Chain:
      return 'Chain Swap'
    case SwapType.Reverse:
      return 'Reverse Swap'
    case SwapType.Submarine:
      return 'Submarine Swap'
    default:
      return 'Unknown'
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function shortenHash(hash: string, chars = 8): string {
  if (hash.length <= chars * 2) {
    return hash
  }
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`
}

function isChainSwap(swap: SomeSwap): swap is ChainSwap & { id: string } {
  return swap.type === SwapType.Chain
}

function getChainName(chainId: number | undefined): string {
  if (!chainId) {
    return 'Unknown'
  }
  switch (chainId) {
    case 1:
      return 'Ethereum'
    case 137:
      return 'Polygon'
    case 4114:
      return 'Citrea'
    case 5115:
      return 'Citrea Testnet'
    case 80002:
      return 'Polygon Amoy'
    default:
      return `Chain ${chainId}`
  }
}

export function SwapCard({ swap }: SwapCardProps): JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const statusInfo = getStatusInfo(swap)

  return (
    <Card onPress={() => setExpanded(!expanded)}>
      <CardHeader>
        <SwapInfo>
          <Flex flexDirection="row" alignItems="center" gap="$spacing8" flexWrap="wrap">
            <Text variant="body1" color="$neutral1" fontWeight="600">
              {getSwapTypeLabel(swap.type)}
            </Text>
            <StatusBadge status={statusInfo.status}>
              {statusInfo.icon}
              <Text variant="body4" color="$neutral1" fontWeight="600">
                {statusInfo.label}
              </Text>
            </StatusBadge>
          </Flex>
          <SwapAmounts>
            <Text variant="body2" color="$neutral1">
              {formatSatoshiAmount(swap.sendAmount)} {swap.assetSend}
            </Text>
            <Text variant="body2" color="$neutral2">
              →
            </Text>
            <Text variant="body2" color="$neutral1">
              {formatSatoshiAmount(swap.receiveAmount)} {swap.assetReceive}
            </Text>
          </SwapAmounts>
          <Text variant="body3" color="$neutral2">
            {formatDate(swap.date)}
          </Text>
        </SwapInfo>
        <ExpandButton expanded={expanded}>
          <RotatableChevron direction={expanded ? 'up' : 'down'} width={20} height={20} color="$neutral2" />
        </ExpandButton>
      </CardHeader>

      {expanded && (
        <Flex gap="$spacing4" paddingTop="$spacing8" borderTopWidth={1} borderTopColor="$surface3">
          <DetailRow>
            <DetailLabel>Swap ID:</DetailLabel>
            <DetailValue>{shortenHash(swap.id)}</DetailValue>
          </DetailRow>

          <DetailRow>
            <DetailLabel>Type:</DetailLabel>
            <DetailValue>{getSwapTypeLabel(swap.type)}</DetailValue>
          </DetailRow>

          <DetailRow>
            <DetailLabel>Status:</DetailLabel>
            <DetailValue>{swap.status || 'Unknown'}</DetailValue>
          </DetailRow>

          {/* Chain Swap: Show all 4 transactions with chain labels */}
          {isChainSwap(swap) ? (
            <>
              {/* Source Chain Transactions */}
              {(swap.sourceChainId || swap.sourceLockupTx || swap.sourceClaimTx) && (
                <Text variant="body3" color="$neutral2" fontWeight="600" paddingTop="$spacing8">
                  Source Chain ({getChainName(swap.sourceChainId)})
                </Text>
              )}

              {swap.sourceLockupTx && (
                <DetailRow>
                  <DetailLabel>User Lockup Tx:</DetailLabel>
                  <DetailValue>{shortenHash(swap.sourceLockupTx)}</DetailValue>
                </DetailRow>
              )}

              {swap.sourceClaimTx && (
                <DetailRow>
                  <DetailLabel>Boltz Claim Tx:</DetailLabel>
                  <DetailValue>{shortenHash(swap.sourceClaimTx)}</DetailValue>
                </DetailRow>
              )}

              {/* Destination Chain Transactions */}
              {(swap.destChainId || swap.destLockupTx || swap.destClaimTx) && (
                <Text variant="body3" color="$neutral2" fontWeight="600" paddingTop="$spacing8">
                  Destination Chain ({getChainName(swap.destChainId)})
                </Text>
              )}

              {swap.destLockupTx && (
                <DetailRow>
                  <DetailLabel>Boltz Lockup Tx:</DetailLabel>
                  <DetailValue>{shortenHash(swap.destLockupTx)}</DetailValue>
                </DetailRow>
              )}

              {swap.destClaimTx && (
                <DetailRow>
                  <DetailLabel>User Claim Tx:</DetailLabel>
                  <DetailValue>{shortenHash(swap.destClaimTx)}</DetailValue>
                </DetailRow>
              )}

              {/* Fallback: Show legacy fields if new fields not populated */}
              {!swap.sourceLockupTx && !swap.destLockupTx && swap.lockupTx && (
                <DetailRow>
                  <DetailLabel>Lockup Tx:</DetailLabel>
                  <DetailValue>{shortenHash(swap.lockupTx)}</DetailValue>
                </DetailRow>
              )}

              {!swap.sourceClaimTx && !swap.destClaimTx && swap.claimTx && (
                <DetailRow>
                  <DetailLabel>Claim Tx:</DetailLabel>
                  <DetailValue>{shortenHash(swap.claimTx)}</DetailValue>
                </DetailRow>
              )}
            </>
          ) : (
            <>
              {/* Non-Chain Swaps: Show legacy single tx fields */}
              {swap.lockupTx && (
                <DetailRow>
                  <DetailLabel>Lockup Tx:</DetailLabel>
                  <DetailValue>{shortenHash(swap.lockupTx)}</DetailValue>
                </DetailRow>
              )}

              {swap.claimTx && (
                <DetailRow>
                  <DetailLabel>Claim Tx:</DetailLabel>
                  <DetailValue>{shortenHash(swap.claimTx)}</DetailValue>
                </DetailRow>
              )}
            </>
          )}

          {swap.refundTx && (
            <DetailRow>
              <DetailLabel>Refund Tx:</DetailLabel>
              <DetailValue>{shortenHash(swap.refundTx)}</DetailValue>
            </DetailRow>
          )}

          <DetailRow>
            <DetailLabel>Preimage Hash:</DetailLabel>
            <DetailValue>{shortenHash(swap.preimageHash)}</DetailValue>
          </DetailRow>

          <DetailRow>
            <DetailLabel>Version:</DetailLabel>
            <DetailValue>{swap.version}</DetailValue>
          </DetailRow>
        </Flex>
      )}
    </Card>
  )
}
