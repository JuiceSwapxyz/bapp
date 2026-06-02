import { getProgressGradient } from 'pages/Launchpad/components/shared'
import { useEffect, useRef, useState } from 'react'
import { Flex, Text, styled } from 'ui/src'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'

const Panel = styled(Flex, {
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: '$surface2',
  borderRadius: '$rounded20',
  borderWidth: 1,
  borderColor: '$surface3',
  borderTopWidth: 2,
  borderTopColor: '$accent1',
  padding: '$spacing20',
  gap: '$spacing12',
  animation: 'quick',
  enterStyle: { opacity: 0, y: 10 },
  '$platform-web': {
    boxShadow: '0 1px 2px rgba(16,16,16,0.04), 0 8px 24px rgba(16,16,16,0.05)',
  },
})

// Tall, prominent track + fill.
const Track = styled(Flex, {
  position: 'relative',
  height: 14,
  borderRadius: '$rounded8',
  backgroundColor: '$surface3',
  overflow: 'hidden',
})

const Marker = styled(Flex, {
  position: 'absolute',
  top: -4,
  bottom: -4,
  right: 0,
  width: 2,
  backgroundColor: '$neutral3',
  opacity: 0.35,
})

const SHEEN_STYLE = { animation: 'lp-sheen 2.8s ease-in-out infinite' } as const

// requestAnimationFrame count-up to `target`, eased.
function useCountUp(target: number, durationMs = 1100): number {
  const [val, setVal] = useState(0)
  const fromRef = useRef(0)
  useEffect(() => {
    const from = fromRef.current
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = from + (target - from) * eased
      setVal(next)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])
  return val
}

interface BondingCurveHeroProps {
  progress: number
  graduated: boolean
  tokensRemaining: string
  onInfo: () => void
}

export function BondingCurveHero({ progress, graduated, tokensRemaining, onInfo }: BondingCurveHeroProps) {
  const pct = graduated ? 100 : Math.min(Math.max(progress, 0), 100)
  const animatedPct = useCountUp(pct)

  // Animate the fill width from 0 -> pct on mount / change.
  const [fillW, setFillW] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setFillW(pct))
    return () => cancelAnimationFrame(id)
  }, [pct])

  const accentColor = graduated ? '$statusSuccess' : '$accent1'

  return (
    <Panel>
      <Flex flexDirection="row" justifyContent="space-between" alignItems="flex-end" gap="$spacing16" flexWrap="wrap">
        <Flex gap="$spacing2">
          <Text variant="subheading2" color="$neutral1" fontWeight="700">
            Bonding curve
          </Text>
          <Text variant="body2" color="$neutral2">
            {graduated ? 'Graduated to JuiceSwap V2' : 'Progress to graduation'}
          </Text>
        </Flex>
        <Flex flexDirection="row" alignItems="baseline" gap="$spacing2">
          <Text variant="heading2" color={accentColor} fontWeight="700" $sm={{ fontSize: 28, lineHeight: 32 }}>
            {animatedPct.toFixed(graduated ? 0 : 2)}
          </Text>
          <Text variant="subheading2" color={accentColor} fontWeight="700">
            %
          </Text>
        </Flex>
      </Flex>

      <Track>
        <Flex
          height="100%"
          borderRadius="$rounded8"
          overflow="hidden"
          position="relative"
          style={{
            width: `${fillW}%`,
            background: getProgressGradient(pct),
            transition: 'width 1.4s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <Flex
            position="absolute"
            top={0}
            bottom={0}
            width={60}
            style={{
              ...SHEEN_STYLE,
              background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)',
            }}
          />
        </Flex>
        {!graduated && <Marker />}
      </Track>

      <Flex flexDirection="row" justifyContent="space-between" alignItems="center" gap="$spacing8" flexWrap="wrap">
        {graduated ? (
          <Text variant="body3" color="$statusSuccess" fontWeight="600">
            Liquidity permanently locked in V2
          </Text>
        ) : (
          <Flex
            flexDirection="row"
            alignItems="center"
            gap="$spacing6"
            cursor="pointer"
            animation="quick"
            flexShrink={1}
            onPress={onInfo}
            hoverStyle={{ opacity: 0.7 }}
          >
            <Text variant="body3" color="$neutral3" numberOfLines={1}>
              Graduates at 100% · 1% fee
            </Text>
            <InfoCircle size={14} color="$neutral3" />
          </Flex>
        )}
        {!graduated && (
          <Text variant="body3" color="$neutral2" fontWeight="600">
            {tokensRemaining} tokens remaining
          </Text>
        )}
      </Flex>
    </Panel>
  )
}
