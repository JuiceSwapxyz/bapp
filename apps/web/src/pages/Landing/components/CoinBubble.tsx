import { Flex, styled } from 'ui/src'

interface CoinBubbleProps {
  src: string
  alt: string
  size?: number
  variant?: 'normal' | 'wave' | 'light'
  onClick?: () => void
}

// Glass bubble container with CSS effects
const BubbleContainer = styled(Flex, {
  name: 'BubbleContainer',
  position: 'relative',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 9999,
  overflow: 'hidden',

  variants: {
    variant: {
      normal: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'rgba(179, 179, 179, 0.5)',
        '$platform-web': {
          boxShadow: '0px 7px 20px 0px rgba(0, 0, 0, 0.08)',
        },
      },
      wave: {
        // Orange bubble matching the wave background (#FF7D14)
        backgroundColor: 'rgba(255, 125, 20, 0.35)',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'rgba(255, 125, 20, 0.5)',
        '$platform-web': {
          boxShadow: '0px 10px 27px 0px rgba(0, 0, 0, 0.12)',
        },
      },
      light: {
        // White background with blue border for wBTC+ETH
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#627EEA',
        '$platform-web': {
          boxShadow: '0px 7px 20px 0px rgba(98, 126, 234, 0.15)',
        },
      },
    },
  } as const,

  defaultVariants: {
    variant: 'normal',
  },
})

// Inner shadow overlay for glass effect
const InnerShadow = styled(Flex, {
  name: 'InnerShadow',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderRadius: 9999,
  pointerEvents: 'none',

  variants: {
    variant: {
      normal: {
        '$platform-web': {
          boxShadow: 'inset -1.3px -4.2px 9px 0px rgba(255, 255, 255, 0.2)',
        },
      },
      wave: {
        // Gold-tinted inner shadow for orange bubbles
        '$platform-web': {
          boxShadow: 'inset 4px 9px 20px 0px rgba(255, 197, 51, 0.35)',
        },
      },
      light: {
        // Subtle blue-tinted inner shadow
        '$platform-web': {
          boxShadow: 'inset -1.3px -4.2px 9px 0px rgba(98, 126, 234, 0.15)',
        },
      },
    },
  } as const,

  defaultVariants: {
    variant: 'normal',
  },
})

export function CoinBubble({ src, alt, size = 90, variant = 'normal', onClick }: CoinBubbleProps) {
  // Symbol takes up ~70% of the bubble size
  const symbolSize = Math.round(size * 0.7)
  const isClickable = !!onClick

  return (
    <BubbleContainer
      variant={variant}
      width={size}
      height={size}
      onPress={onClick}
      cursor={isClickable ? 'pointer' : undefined}
      hoverStyle={isClickable ? { scale: 1.05, opacity: 0.9 } : undefined}
      pressStyle={isClickable ? { scale: 0.95 } : undefined}
      animation={isClickable ? 'quick' : undefined}
    >
      <img
        src={src}
        alt={alt}
        width={symbolSize}
        height={symbolSize}
        style={{ display: 'block', maxWidth: 'none', objectFit: 'contain' }}
      />
      <InnerShadow variant={variant} />
    </BubbleContainer>
  )
}

// Symbol assets (SVG) - these are just the inner symbols, not the full bubble
export const COIN_SYMBOLS = {
  // Above the wave (colored)
  btcChain: '/images/landing_page/symbol-btc-chain.svg',
  btcLightning: '/images/landing_page/symbol-btc-lightning.svg',
  tether: '/images/landing_page/symbol-tether.svg', // Tether only (no badge)
  tetherEth: '/images/landing_page/symbol-tether-eth.svg',
  tetherPolygon: '/images/landing_page/symbol-tether-polygon.svg',
  wbtcEth: '/images/landing_page/symbol-wbtc-eth.svg',
  usdc: '/images/landing_page/symbol-usdc.svg',

  // Inside the wave (cream colored for orange bubble background)
  waveBtcLarge: '/images/landing_page/symbol-wave-btc-citrea.svg',
  waveBtcSmall: '/images/landing_page/symbol-wave-btc-citrea.svg',
  waveUsdLarge: '/images/landing_page/symbol-wave-usd.svg',
  waveUsdSmall: '/images/landing_page/symbol-wave-usd.svg',
  waveWbtcCitrea: '/images/landing_page/symbol-wave-wbtc-citrea.svg',
  waveJuice: '/images/landing_page/symbol-wave-juice.svg',
} as const

// Export for Hero.tsx
export const COIN_BUBBLE_ASSETS = COIN_SYMBOLS
