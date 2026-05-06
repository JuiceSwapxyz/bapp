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
  return <style dangerouslySetInnerHTML={{ __html: LIQUID_BUBBLE_KEYFRAMES }} />
}
