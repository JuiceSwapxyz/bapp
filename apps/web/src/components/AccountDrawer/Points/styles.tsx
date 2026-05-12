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
@keyframes juice-wave-drift {
  0% { transform: translateX(-18px); }
  50% { transform: translateX(18px); }
  100% { transform: translateX(-18px); }
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
.juice-wave-front {
  animation: juice-wave-drift 8s ease-in-out infinite;
}
.juice-wave-back {
  animation: juice-wave-drift 11s ease-in-out infinite reverse;
}
`

export function bubbleTextStyle(fontSize: number): CSSProperties {
  return {
    fontSize,
    fontWeight: 900,
    letterSpacing: 0,
    lineHeight: 1,
    backgroundImage:
      'linear-gradient(135deg, #FFE9C4 0%, #FFB35C 25%, #F7911A 50%, #C46800 75%, #FFB35C 100%)',
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

const GRADIENT_ID_HERO = 'juice-liquid-hero'
const GRADIENT_ID_COMPACT = 'juice-liquid-compact'

interface LiquidBgProps {
  variant?: 'hero' | 'compact'
}

/**
 * Animated orange liquid waves filling the bottom of a dark surface.
 * `hero` is for the big hero card in PointsMenu; `compact` is a wider
 * shallow version sized for the small PointsCard in the drawer.
 *
 * Each variant has its own viewBox/preserveAspectRatio so the waves
 * sit in the visible region of their respective container aspect ratio
 * (the hero card is roughly 2:1 tall, the drawer card is ~4:1 wide).
 */
export function LiquidBg({ variant = 'hero' }: LiquidBgProps) {
  const isHero = variant === 'hero'
  const gradientId = isHero ? GRADIENT_ID_HERO : GRADIENT_ID_COMPACT

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
        <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#FFE0A6" />
          <stop offset="36%" stopColor="#F7911A" />
          <stop offset="72%" stopColor="#C96100" />
          <stop offset="100%" stopColor="#5D2E00" />
        </linearGradient>
      </defs>
      <path
        d={
          isHero
            ? 'M0 218 C70 184 132 246 206 214 C282 181 346 246 430 210 C506 178 552 210 600 188 L600 300 L0 300 Z'
            : 'M0 116 C78 94 132 132 206 112 C292 88 360 134 438 108 C508 86 554 104 600 92 L600 160 L0 160 Z'
        }
        fill="#5A2B00"
        opacity={isHero ? 0.42 : 0.5}
        className="juice-wave-back"
      />
      <path
        d={
          isHero
            ? 'M0 246 C88 204 150 268 234 232 C322 194 390 264 482 224 C538 200 574 210 600 198 L600 300 L0 300 Z'
            : 'M0 132 C82 102 150 144 236 120 C318 96 388 148 474 120 C532 102 574 108 600 98 L600 160 L0 160 Z'
        }
        fill={`url(#${gradientId})`}
        opacity={isHero ? 0.9 : 0.95}
        className="juice-wave-front"
      />
      <path
        d={
          isHero
            ? 'M0 270 C90 238 172 284 266 252 C346 226 444 278 600 232 L600 300 L0 300 Z'
            : 'M0 144 C120 126 194 152 298 136 C402 120 500 148 600 126 L600 160 L0 160 Z'
        }
        fill="#F7A536"
        opacity={isHero ? 0.28 : 0.32}
      />
    </svg>
  )
}
