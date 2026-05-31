import type { CSSProperties } from 'react'

export const LIQUID_BUBBLE_CLASS = 'juice-liquid-bubble'

export const LIQUID_BUBBLE_KEYFRAMES = `
@keyframes juice-liquid-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes juice-liquid-glow {
  0%, 100% {
    filter:
      drop-shadow(0 2px 0 rgba(120,60,0,0.6))
      drop-shadow(0 6px 10px rgba(0,0,0,0.55))
      drop-shadow(0 0 22px rgba(247,145,26,0.45));
  }
  50% {
    filter:
      drop-shadow(0 2px 0 rgba(120,60,0,0.6))
      drop-shadow(0 8px 14px rgba(0,0,0,0.55))
      drop-shadow(0 0 36px rgba(247,145,26,0.85));
  }
}
@keyframes juice-liquid-wobble {
  0%, 100% { transform: translateY(0) scaleY(1) scaleX(1); }
  25% { transform: translateY(-1px) scaleY(1.015) scaleX(0.99); }
  50% { transform: translateY(0) scaleY(0.985) scaleX(1.01); }
  75% { transform: translateY(1px) scaleY(1.015) scaleX(0.99); }
}
.${LIQUID_BUBBLE_CLASS} {
  background-size: 220% 220%;
  animation:
    juice-liquid-flow 7s ease-in-out infinite,
    juice-liquid-glow 3.5s ease-in-out infinite,
    juice-liquid-wobble 4.5s ease-in-out infinite;
  transform-origin: center bottom;
  will-change: background-position, filter, transform;
}
`

export function bubbleTextStyle(fontSize: number): CSSProperties {
  return {
    fontSize,
    fontWeight: 900,
    letterSpacing: -fontSize * 0.03,
    lineHeight: 1,
    backgroundImage: 'linear-gradient(135deg, #FFE9C4 0%, #FFB35C 25%, #F7911A 50%, #C46800 75%, #FFB35C 100%)',
    backgroundSize: '220% 220%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    WebkitTextStroke: '1px rgba(120,60,0,0.45)',
    margin: 0,
    fontFamily: 'inherit',
    display: 'inline-block',
  }
}

export function LiquidBubbleStyleTag() {
  return <style>{LIQUID_BUBBLE_KEYFRAMES}</style>
}

const FILTER_ID_HERO = 'juice-goo-hero'
const FILTER_ID_COMPACT = 'juice-goo-compact'
const ORB_ID_HERO = 'juice-orb-hero'
const ORB_ID_COMPACT = 'juice-orb-compact'

interface LiquidBgProps {
  variant?: 'hero' | 'compact'
}

/**
 * Animated orange goo blobs filling the bottom of a dark surface.
 * `hero` is for the big hero card in PointsMenu; `compact` is a wider
 * shallow version sized for the small PointsCard in the drawer.
 *
 * Each variant has its own viewBox/preserveAspectRatio so the blobs
 * sit in the visible region of their respective container aspect ratio
 * (the hero card is roughly 2:1 tall, the drawer card is ~4:1 wide).
 */
export function LiquidBg({ variant = 'hero' }: LiquidBgProps) {
  const isHero = variant === 'hero'
  const filterId = isHero ? FILTER_ID_HERO : FILTER_ID_COMPACT
  const orbId = isHero ? ORB_ID_HERO : ORB_ID_COMPACT
  const stdDev = isHero ? 22 : 12

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      viewBox={isHero ? '0 0 600 300' : '0 0 600 160'}
      preserveAspectRatio={isHero ? 'xMidYMid slice' : 'xMidYMax slice'}
      aria-hidden
    >
      <defs>
        <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={stdDev} result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8" result="goo" />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
        <radialGradient id={orbId} cx="50%" cy="40%">
          <stop offset="0%" stopColor="#FFD699" />
          <stop offset="60%" stopColor="#F7911A" />
          <stop offset="100%" stopColor="#9B5300" />
        </radialGradient>
      </defs>
      {isHero ? (
        <g filter={`url(#${filterId})`} opacity="0.85">
          <circle cx="80" cy="230" r="70" fill={`url(#${orbId})`} />
          <circle cx="180" cy="280" r="55" fill={`url(#${orbId})`} />
          <circle cx="340" cy="260" r="80" fill={`url(#${orbId})`} />
          <circle cx="470" cy="290" r="65" fill={`url(#${orbId})`} />
          <circle cx="540" cy="220" r="40" fill={`url(#${orbId})`} />
        </g>
      ) : (
        <g filter={`url(#${filterId})`} opacity="0.95">
          <circle cx="50" cy="160" r="55" fill={`url(#${orbId})`} />
          <circle cx="170" cy="170" r="65" fill={`url(#${orbId})`} />
          <circle cx="300" cy="155" r="60" fill={`url(#${orbId})`} />
          <circle cx="430" cy="170" r="58" fill={`url(#${orbId})`} />
          <circle cx="555" cy="160" r="50" fill={`url(#${orbId})`} />
        </g>
      )}
    </svg>
  )
}
