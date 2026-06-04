import { useLaunchpadTrades, type LaunchpadTrade } from 'hooks/useLaunchpadTokens'
import { useMemo } from 'react'
import { Flex, Text, styled } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { formatUnits } from 'viem'

const HeaderRow = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: '$spacing8',
  paddingHorizontal: '$spacing12',
  borderBottomWidth: 1,
  borderBottomColor: '$surface3',
})

const Row = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: '$spacing10',
  paddingHorizontal: '$spacing12',
  borderRadius: '$rounded8',
  cursor: 'pointer',
  animation: 'quick',
  enterStyle: { opacity: 0, x: -6 },
  hoverStyle: { backgroundColor: '$surface1' },
})

const HeadCell = styled(Text, {
  variant: 'body4',
  color: '$neutral3',
  fontWeight: '600',
})

// Column flex weights (kept in sync between header + rows)
const COL = {
  type: { flexBasis: 70, flexGrow: 0, flexShrink: 0 },
  amount: { flex: 1.4, minWidth: 0 },
  base: { flex: 1.2, minWidth: 0 },
  trader: { flex: 1, minWidth: 0, $sm: { display: 'none' } },
  age: { flexBasis: 64, flexGrow: 0, flexShrink: 0, alignItems: 'flex-end' },
} as const

function shortAddr(a: string): string {
  return `${a.slice(0, 5)}…${a.slice(-4)}`
}

function compact(n: number): string {
  return Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 2 }).format(n)
}

function ago(tsSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - tsSeconds
  if (diff < 60) {
    return `${Math.max(diff, 0)}s`
  }
  if (diff < 3600) {
    return `${Math.floor(diff / 60)}m`
  }
  if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h`
  }
  return `${Math.floor(diff / 86400)}d`
}

function TradeRow({ trade, symbol, chainId }: { trade: LaunchpadTrade; symbol: string; chainId: UniverseChainId }) {
  const tokenAmount = useMemo(() => {
    try {
      return compact(Number(formatUnits(BigInt(trade.tokenAmount), 18)))
    } catch {
      return '0'
    }
  }, [trade.tokenAmount])
  const baseAmount = useMemo(() => {
    try {
      return compact(Number(formatUnits(BigInt(trade.baseAmount), 18)))
    } catch {
      return '0'
    }
  }, [trade.baseAmount])
  const color = trade.isBuy ? '$statusSuccess' : '$statusCritical'

  const openTx = () => {
    window.open(getExplorerLink({ chainId, data: trade.txHash, type: ExplorerDataType.TRANSACTION }), '_blank')
  }

  return (
    <Row onPress={openTx}>
      <Flex {...COL.type}>
        <Flex
          flexDirection="row"
          alignItems="center"
          gap="$spacing6"
          paddingHorizontal="$spacing8"
          paddingVertical="$spacing2"
          borderRadius="$roundedFull"
          backgroundColor={trade.isBuy ? '$statusSuccess2' : '$statusCritical2'}
          alignSelf="flex-start"
        >
          <Text variant="body4" color={color} fontWeight="700">
            {trade.isBuy ? 'Buy' : 'Sell'}
          </Text>
        </Flex>
      </Flex>
      <Flex {...COL.amount}>
        <Text variant="body3" color="$neutral1" fontWeight="600" numberOfLines={1}>
          {tokenAmount} {symbol}
        </Text>
      </Flex>
      <Flex {...COL.base}>
        <Text variant="body3" color="$neutral2" numberOfLines={1}>
          {baseAmount} JUSD
        </Text>
      </Flex>
      <Flex {...COL.trader}>
        <Flex flexDirection="row" alignItems="center" gap="$spacing4">
          <Text variant="body3" color="$neutral2" numberOfLines={1}>
            {shortAddr(trade.trader)}
          </Text>
          <ExternalLink size="$icon.12" color="$neutral3" />
        </Flex>
      </Flex>
      <Flex {...COL.age}>
        <Text variant="body3" color="$neutral3">
          {ago(Number(trade.timestamp))}
        </Text>
      </Flex>
    </Row>
  )
}

export function ActivityTable({
  address,
  symbol,
  chainId,
}: {
  address: string
  symbol: string
  chainId: UniverseChainId
}) {
  const { data, isLoading } = useLaunchpadTrades({ address, limit: 25 })
  const trades = data?.trades ?? []

  return (
    <Flex gap="$spacing4">
      <HeaderRow>
        <HeadCell {...COL.type}>Type</HeadCell>
        <HeadCell {...COL.amount}>Amount</HeadCell>
        <HeadCell {...COL.base}>JUSD</HeadCell>
        <HeadCell {...COL.trader}>Trader</HeadCell>
        <HeadCell {...COL.age}>Age</HeadCell>
      </HeaderRow>

      {/* Rows scroll within a capped height on mobile so the long trade list
          doesn't dominate the page; desktop keeps its natural full height. */}
      <Flex gap="$spacing4" $md={{ maxHeight: 420, overflow: 'scroll' }}>
        {isLoading ? (
          <Flex padding="$spacing24" alignItems="center">
            <Text variant="body3" color="$neutral3">
              Loading activity…
            </Text>
          </Flex>
        ) : trades.length === 0 ? (
          <Flex padding="$spacing24" alignItems="center" gap="$spacing4">
            <Text variant="body2" color="$neutral1" fontWeight="600">
              No trades yet
            </Text>
            <Text variant="body3" color="$neutral3">
              Be the first to trade this token.
            </Text>
          </Flex>
        ) : (
          trades.map((trade) => (
            <TradeRow key={`${trade.txHash}-${trade.id}`} trade={trade} symbol={symbol} chainId={chainId} />
          ))
        )}
      </Flex>
    </Flex>
  )
}
