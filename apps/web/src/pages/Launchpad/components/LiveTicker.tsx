import { useRecentLaunchpadTrades, type LaunchpadTrade } from 'hooks/useLaunchpadTokens'
import { useMemo } from 'react'
import { Flex, Text, styled } from 'ui/src'
import { formatUnits } from 'viem'

const Viewport = styled(Flex, {
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
  paddingVertical: '$spacing12',
  borderTopWidth: 1,
  borderBottomWidth: 1,
  borderColor: '$surface3',
  // fade both edges so items scroll in/out softly
  '$platform-web': {
    maskImage: 'linear-gradient(90deg, transparent 0%, #000 5%, #000 95%, transparent 100%)',
    WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 5%, #000 95%, transparent 100%)',
  },
})

const Track = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing20',
  width: 'max-content',
  pointerEvents: 'none',
})

// Tamagui intercepts the `animation` prop (even under $platform-web) and drops
// the raw CSS string, so the marquee is driven via an inline style instead,
// referencing the global `launchpad-ticker` keyframe in global.css.
const TICKER_ANIMATION = { animation: 'launchpad-ticker 75s linear infinite' } as const

const Dot = styled(Flex, {
  width: 7,
  height: 7,
  borderRadius: '$roundedFull',
})

const LivePulse = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing6',
  paddingRight: '$spacing16',
  marginRight: '$spacing4',
  borderRightWidth: 1,
  borderRightColor: '$surface3',
  flexShrink: 0,
})

function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

function compact(n: number): string {
  return Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

function TradeItem({ trade }: { trade: LaunchpadTrade }) {
  const amount = useMemo(() => {
    try {
      return compact(Number(formatUnits(BigInt(trade.tokenAmount), 18)))
    } catch {
      return '0'
    }
  }, [trade.tokenAmount])
  const color = trade.isBuy ? '$statusSuccess' : '$statusCritical'
  return (
    <Flex flexDirection="row" alignItems="center" gap="$spacing8" flexShrink={0}>
      <Dot backgroundColor={color} />
      <Text variant="body3" color="$neutral2">
        {shortAddr(trade.trader)}
      </Text>
      <Text variant="body3" color={color} fontWeight="600">
        {trade.isBuy ? 'bought' : 'sold'}
      </Text>
      <Text variant="body3" color="$neutral1" fontWeight="600">
        {amount} ${trade.tokenSymbol || trade.tokenName || '???'}
      </Text>
    </Flex>
  )
}

export function LiveTicker({ chainId }: { chainId?: number }) {
  const { data } = useRecentLaunchpadTrades({ limit: 24, chainId })
  const trades = useMemo(() => data?.trades ?? [], [data])

  // Duplicate the list so the -50% translate loops seamlessly.
  const loop = useMemo(() => [...trades, ...trades], [trades])

  if (trades.length === 0) {
    return null
  }

  return (
    <Viewport>
      <Track style={TICKER_ANIMATION}>
        <LivePulse>
          <Dot backgroundColor="$statusSuccess" />
          <Text variant="body3" color="$statusSuccess" fontWeight="700" letterSpacing={0.6}>
            LIVE
          </Text>
        </LivePulse>
        {loop.map((trade, i) => (
          <TradeItem key={`${trade.id}-${i}`} trade={trade} />
        ))}
      </Track>
    </Viewport>
  )
}
