import { SwapCard } from 'pages/BridgeSwaps/SwapCard'
import { EmptyState, FilterTab, FilterTabs, SortButton, SwapsList } from 'pages/BridgeSwaps/SwapsTable.styles'
import { SwapFilterType, SwapSortOrder, SwapStatusCategory } from 'pages/BridgeSwaps/types'
import { useCallback, useMemo, useState } from 'react'
import { Flex, Text } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { SomeSwap } from 'uniswap/src/features/lds-bridge/lds-types/storage'
import { getSwapStatusCategory as getLdsStatusCategory } from 'uniswap/src/features/lds-bridge/lds-types/websocket'

interface SwapsTableProps {
  swaps: (SomeSwap & { id: string })[]
  refundableSwaps: (SomeSwap & { id: string })[]
  isLoading: boolean
}

function getSwapStatusCategory(swap: SomeSwap): SwapStatusCategory {
  // If we have a claim transaction, the swap is successful regardless of backend status
  // This handles cases where the backend status hasn't updated to 'transaction.claimed' yet
  if (swap.claimTx) {
    return SwapStatusCategory.Completed
  }

  const category = getLdsStatusCategory(swap.status)
  if (category === 'success') {
    return SwapStatusCategory.Completed
  }
  if (category === 'failed') {
    return SwapStatusCategory.Failed
  }
  return SwapStatusCategory.Pending
}

export function SwapsTable({ swaps, refundableSwaps, isLoading }: SwapsTableProps): JSX.Element {
  const [filter, setFilter] = useState<SwapFilterType>(SwapFilterType.All)
  const [sortOrder, setSortOrder] = useState<SwapSortOrder>(SwapSortOrder.Newest)

  const filteredAndSortedSwaps = useMemo(() => {
    let filtered = swaps

    if (filter === SwapFilterType.Refundable) {
      filtered = swaps.filter((swap) => refundableSwaps.some((rs) => rs.id === swap.id))
    } else if (filter === SwapFilterType.Pending) {
      filtered = swaps.filter((swap) => getSwapStatusCategory(swap) === SwapStatusCategory.Pending)
    } else if (filter === SwapFilterType.Completed) {
      filtered = swaps.filter((swap) => getSwapStatusCategory(swap) === SwapStatusCategory.Completed)
    } else if (filter === SwapFilterType.Failed) {
      filtered = swaps.filter((swap) => getSwapStatusCategory(swap) === SwapStatusCategory.Failed)
    }

    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortOrder === SwapSortOrder.Newest) {
        return b.date - a.date
      }
      return a.date - b.date
    })

    return sorted
  }, [swaps, filter, sortOrder, refundableSwaps])

  const stats = useMemo(() => {
    const pending = swaps.filter((swap) => getSwapStatusCategory(swap) === SwapStatusCategory.Pending).length
    const completed = swaps.filter((swap) => getSwapStatusCategory(swap) === SwapStatusCategory.Completed).length
    const failed = swaps.filter((swap) => getSwapStatusCategory(swap) === SwapStatusCategory.Failed).length
    const refundable = refundableSwaps.length

    return { pending, completed, failed, refundable }
  }, [swaps, refundableSwaps])

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === SwapSortOrder.Newest ? SwapSortOrder.Oldest : SwapSortOrder.Newest))
  }, [])

  return (
    <Flex gap="$spacing16">
      <Flex flexDirection="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$spacing12">
        <FilterTabs>
          <FilterTab active={filter === SwapFilterType.All} onPress={() => setFilter(SwapFilterType.All)}>
            <Text variant="buttonLabel4" color={filter === SwapFilterType.All ? '$white' : '$neutral2'}>
              All
            </Text>
          </FilterTab>
          <FilterTab active={filter === SwapFilterType.Refundable} onPress={() => setFilter(SwapFilterType.Refundable)}>
            <Text variant="buttonLabel4" color={filter === SwapFilterType.Refundable ? '$white' : '$neutral2'}>
              Refundable ({stats.refundable})
            </Text>
          </FilterTab>
          <FilterTab active={filter === SwapFilterType.Pending} onPress={() => setFilter(SwapFilterType.Pending)}>
            <Text variant="buttonLabel4" color={filter === SwapFilterType.Pending ? '$white' : '$neutral2'}>
              Pending ({stats.pending})
            </Text>
          </FilterTab>
          <FilterTab active={filter === SwapFilterType.Completed} onPress={() => setFilter(SwapFilterType.Completed)}>
            <Text variant="buttonLabel4" color={filter === SwapFilterType.Completed ? '$white' : '$neutral2'}>
              Completed ({stats.completed})
            </Text>
          </FilterTab>
          <FilterTab active={filter === SwapFilterType.Failed} onPress={() => setFilter(SwapFilterType.Failed)}>
            <Text variant="buttonLabel4" color={filter === SwapFilterType.Failed ? '$white' : '$neutral2'}>
              Failed ({stats.failed})
            </Text>
          </FilterTab>
        </FilterTabs>

        <SortButton onPress={toggleSortOrder}>
          <Text variant="body3" color="$neutral1">
            {sortOrder === SwapSortOrder.Newest ? 'Newest First' : 'Oldest First'}
          </Text>
          <RotatableChevron
            direction={sortOrder === SwapSortOrder.Newest ? 'down' : 'up'}
            color="$neutral1"
            width={16}
            height={16}
          />
        </SortButton>
      </Flex>

      {isLoading ? (
        <Flex gap="$spacing16">
          {Array.from({ length: 3 }).map((_, index) => (
            <Flex key={index} height={120} backgroundColor="$surface2" borderRadius="$rounded16" animation="quick" />
          ))}
        </Flex>
      ) : filteredAndSortedSwaps.length > 0 ? (
        <SwapsList>
          {filteredAndSortedSwaps.map((swap) => (
            <SwapCard key={swap.id} swap={swap} />
          ))}
        </SwapsList>
      ) : (
        <EmptyState>
          <Text variant="heading3" color="$neutral2">
            No swaps found
          </Text>
          <Text variant="body2" color="$neutral2">
            {filter === SwapFilterType.All ? "You haven't made any bridge swaps yet" : `No ${filter} swaps found`}
          </Text>
        </EmptyState>
      )}
    </Flex>
  )
}
