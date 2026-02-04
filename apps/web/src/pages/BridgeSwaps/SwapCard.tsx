import { useQuery } from '@tanstack/react-query'
import { useChainTipBlockNumber } from 'hooks/useEvmRefundableSwaps'
import {
  Card,
  CardHeader,
  DetailLabel,
  DetailRow,
  DetailValue,
  ExpandButton,
  StatusBadge,
  SwapAmounts,
  SwapInfo,
  TxLink,
} from 'pages/BridgeSwaps/SwapCard.styles'
import { formatSatoshiAmount } from 'pages/BridgeSwaps/utils'
import { useState } from 'react'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { Clock } from 'ui/src/components/icons/Clock'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel, isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { ASSET_CHAIN_ID_MAP, getLdsBridgeManager } from 'uniswap/src/features/lds-bridge/LdsBridgeManager'
import { fetchChainTransactionsBySwapId, fetchSwapCurrentStatus } from 'uniswap/src/features/lds-bridge/api/client'
import { ChainSwap, SomeSwap, SwapType } from 'uniswap/src/features/lds-bridge/lds-types/storage'
import { LdsSwapStatus, swapStatusSuccess } from 'uniswap/src/features/lds-bridge/lds-types/websocket'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { ellipseMiddle } from 'utilities/src/addresses'

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
      icon: <CheckCircleFilled size="$icon.16" />,
    }
  }

  if (swap.status === LdsSwapStatus.TransactionRefunded && !swap.refundTx) {
    return {
      label: 'Awaiting Refund',
      status: 'failed',
      icon: <AlertTriangleFilled size="$icon.16" />,
    }
  }

  switch (swap.status) {
    case LdsSwapStatus.TransactionClaimed:
    case LdsSwapStatus.InvoiceSettled:
    case LdsSwapStatus.UserClaimed:
      return {
        label: 'Completed',
        status: 'completed',
        icon: <CheckCircleFilled size="$icon.16" />,
      }

    case LdsSwapStatus.SwapRefunded:
    case LdsSwapStatus.UserRefunded:
      return {
        label: 'Refunded',
        status: 'completed',
        icon: <CheckCircleFilled size="$icon.16" />,
      }

    case LdsSwapStatus.TransactionFailed:
    case LdsSwapStatus.InvoiceFailedToPay:
    case LdsSwapStatus.TransactionLockupFailed:
      return {
        label: 'Failed',
        status: 'failed',
        icon: <AlertTriangleFilled size="$icon.16" />,
      }

    case LdsSwapStatus.SwapExpired:
    case LdsSwapStatus.InvoiceExpired:
      return {
        label: 'Expired',
        status: 'failed',
        icon: <AlertTriangleFilled size="$icon.16" />,
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

    // Claim is pending - behavior depends on swap type
    case LdsSwapStatus.TransactionClaimPending:
      // Submarine Swaps (cBTC → Lightning): User has ALREADY received their Lightning payment
      // when this status is reached. Boltz is just claiming their cBTC from the lockup contract.
      // The user doesn't care about Boltz's internal settlement - their swap is complete!
      if (swap.type === SwapType.Submarine) {
        return {
          label: 'Completed',
          status: 'completed',
          icon: <CheckCircleFilled size="$icon.16" />,
        }
      }
      // Chain/Reverse Swaps: Claim is actually pending - user still needs to receive funds
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

function isChainSwap(swap: SomeSwap): swap is ChainSwap {
  return swap.type === SwapType.Chain
}

function getChainName(chainId: number | undefined): string {
  if (!chainId) {
    return 'Unknown'
  }
  if (isUniverseChainId(chainId)) {
    return getChainLabel(chainId)
  }
  return `Chain ${chainId}`
}

function getChainIdFromAsset(asset: string): UniverseChainId | undefined {
  const chainId = ASSET_CHAIN_ID_MAP[asset] as number | undefined
  if (chainId !== undefined && isUniverseChainId(chainId)) {
    return chainId
  }
  return undefined
}

function getChainNameFromAsset(asset: string): string {
  const chainId = getChainIdFromAsset(asset)
  if (chainId !== undefined) {
    return getChainName(chainId)
  }
  // Fallback: extract chain hint from asset name (e.g., USDT_POLYGON -> Polygon)
  if (asset.includes('_')) {
    const parts = asset.split('_')
    return parts[parts.length - 1]
  }
  return asset
}

function getExplorerUrl(txHash: string, chainId: UniverseChainId | undefined): string | undefined {
  if (!chainId) {
    return undefined
  }
  return getExplorerLink({ chainId, data: txHash, type: ExplorerDataType.TRANSACTION })
}

const useChainTxData = (swap: SomeSwap, enabled: boolean) => {
  return useQuery({
    queryKey: ['chain-tx-data', swap.id],
    queryFn: () => fetchChainTransactionsBySwapId(swap.id),
    enabled: isChainSwap(swap) && enabled,
  })
}

const useFailureReason = (swap: SomeSwap, enabled: boolean) => {
  return useQuery({
    queryKey: ['failure-reason', swap.id],
    queryFn: async () => fetchSwapCurrentStatus(swap.id),
    enabled,
  })
}

const useSwapLockupDetails = (swap: SomeSwap, enabled: boolean) => {
  return useQuery({
    queryKey: ['swap-lockup-details', swap.id],
    queryFn: () => getLdsBridgeManager().getLockupTransactions(swap.id),
    enabled,
  })
}

const useRefundEtaEstimate = (swap: SomeSwap) => {
  const isClaimedOrRefunded = swap.claimTx || swap.refundTx
  const isInSuccessState = Object.values(swapStatusSuccess).includes(swap.status as LdsSwapStatus)
  const isNonRefundableStatus = [LdsSwapStatus.SwapCreated].includes(swap.status as LdsSwapStatus)
  const isRefundable = swap.type === SwapType.Chain || swap.type === SwapType.Submarine
  const isPotentialRefundable = !isClaimedOrRefunded && !isInSuccessState && isRefundable && !isNonRefundableStatus
  const { data: lockupDetails } = useSwapLockupDetails(swap, isPotentialRefundable)
  const isEligibleForRefund = isPotentialRefundable && Boolean(lockupDetails?.timeoutBlockHeight)

  const currentTip = useChainTipBlockNumber(ASSET_CHAIN_ID_MAP[swap.assetSend], isEligibleForRefund)
  const timeoutBlockHeight = Number(lockupDetails?.timeoutBlockHeight)
  const remainingBlocks =
    Number(timeoutBlockHeight) - Number(currentTip.data) > 0 ? Number(timeoutBlockHeight) - Number(currentTip.data) : 0

  return {
    isEligibleForRefund: isEligibleForRefund && !isNonRefundableStatus,
    isAvailableForRefund: isEligibleForRefund && remainingBlocks === 0,
    currentBlockHeight: Number(currentTip.data),
    remainingBlocks,
  }
}

export function SwapCard({ swap }: SwapCardProps): JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const { data: chainTxData, isLoading: loadingTxData } = useChainTxData(swap, expanded)
  const statusInfo = getStatusInfo(swap)
  const { data: failureData } = useFailureReason(swap, expanded && statusInfo.status === 'failed')

  const { remainingBlocks, isAvailableForRefund, isEligibleForRefund } = useRefundEtaEstimate(swap)

  return (
    <Card onPress={() => setExpanded(!expanded)}>
      <CardHeader>
        <SwapInfo>
          <Flex flexDirection="row" alignItems="center" gap="$spacing8" flexWrap="wrap">
            <Text variant="body1" color="$neutral1" fontWeight="600">
              {getSwapTypeLabel(swap.type)}
            </Text>
            <Text variant="body3" color="$neutral2">
              <StatusBadge status={statusInfo.status}>
                {statusInfo.icon}
                <Text variant="body4" color="$neutral1" fontWeight="600">
                  {statusInfo.label}
                </Text>
              </StatusBadge>
            </Text>
            {isEligibleForRefund && (
              <Text variant="body3" color="$neutral2">
                {isAvailableForRefund ? 'Available for refund' : `Available for refund in ${remainingBlocks} blocks`}
              </Text>
            )}
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
          {failureData?.failureReason && expanded && (
            <Text variant="body4" color="$statusCritical" fontWeight="600">
              Reason:{' '}
              <Text variant="body3" color="$neutral2">
                {failureData.failureReason}
              </Text>
            </Text>
          )}
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

          <DetailRow>
            <DetailLabel>User Address:</DetailLabel>
            <DetailValue>
              <TxLink
                tag="a"
                href={getExplorerLink({
                  chainId: ASSET_CHAIN_ID_MAP[swap.assetReceive],
                  type: ExplorerDataType.ADDRESS,
                  data: swap.claimAddress,
                })}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                {ellipseMiddle({ str: swap.claimAddress, charsEnd: 7, charsStart: 7 })}
              </TxLink>
            </DetailValue>
          </DetailRow>

          {/* Chain Swap: Show all transactions from API data */}
          {isChainSwap(swap) ? (
            <>
              {/* Source Chain Transactions */}
              <Text variant="body3" color="$neutral2" fontWeight="600" paddingTop="$spacing8">
                Source Chain ({getChainNameFromAsset(swap.assetSend)})
              </Text>

              {loadingTxData ? (
                <DetailRow>
                  <DetailLabel>Loading transactions...</DetailLabel>
                </DetailRow>
              ) : (
                <>
                  {chainTxData?.userLock?.transaction.id ? (
                    <DetailRow>
                      <DetailLabel>User Lockup Tx:</DetailLabel>
                      <TxLink
                        tag="a"
                        href={getExplorerUrl(chainTxData.userLock.transaction.id, getChainIdFromAsset(swap.assetSend))}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        {shortenHash(chainTxData.userLock.transaction.id)}
                      </TxLink>
                    </DetailRow>
                  ) : swap.lockupTx ? (
                    <DetailRow>
                      <DetailLabel>User Lockup Tx:</DetailLabel>
                      <TxLink
                        tag="a"
                        href={getExplorerUrl(swap.lockupTx, getChainIdFromAsset(swap.assetSend))}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        {shortenHash(swap.lockupTx)}
                      </TxLink>
                    </DetailRow>
                  ) : null}
                </>
              )}

              {/* Destination Chain Transactions */}
              <Text variant="body3" color="$neutral2" fontWeight="600" paddingTop="$spacing8">
                Destination Chain ({getChainNameFromAsset(swap.assetReceive)})
              </Text>

              {loadingTxData ? (
                <DetailRow>
                  <DetailLabel>Loading transactions...</DetailLabel>
                </DetailRow>
              ) : (
                <>
                  {chainTxData?.serverLock?.transaction.id && (
                    <DetailRow>
                      <DetailLabel>Boltz Lockup Tx:</DetailLabel>
                      <TxLink
                        tag="a"
                        href={getExplorerUrl(
                          chainTxData.serverLock.transaction.id,
                          getChainIdFromAsset(swap.assetReceive),
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        {shortenHash(chainTxData.serverLock.transaction.id)}
                      </TxLink>
                    </DetailRow>
                  )}

                  {swap.claimTx && (
                    <DetailRow>
                      <DetailLabel>User Claim Tx:</DetailLabel>
                      <TxLink
                        tag="a"
                        href={getExplorerUrl(swap.claimTx, getChainIdFromAsset(swap.assetReceive))}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        {shortenHash(swap.claimTx)}
                      </TxLink>
                    </DetailRow>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {/* Non-Chain Swaps: Show legacy single tx fields */}
              {swap.lockupTx && (
                <DetailRow>
                  <DetailLabel>Lockup Tx:</DetailLabel>
                  <TxLink
                    tag="a"
                    href={getExplorerUrl(swap.lockupTx, getChainIdFromAsset(swap.assetSend))}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    {shortenHash(swap.lockupTx)}
                  </TxLink>
                </DetailRow>
              )}

              {swap.claimTx && (
                <DetailRow>
                  <DetailLabel>Claim Tx:</DetailLabel>
                  <TxLink
                    tag="a"
                    href={getExplorerUrl(swap.claimTx, getChainIdFromAsset(swap.assetReceive))}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    {shortenHash(swap.claimTx)}
                  </TxLink>
                </DetailRow>
              )}
            </>
          )}

          {swap.refundTx && (
            <DetailRow>
              <DetailLabel>Refund Tx:</DetailLabel>
              <TxLink
                tag="a"
                href={getExplorerUrl(swap.refundTx, getChainIdFromAsset(swap.assetSend))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                {shortenHash(swap.refundTx)}
              </TxLink>
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
