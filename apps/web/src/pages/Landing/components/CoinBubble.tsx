interface CoinBubbleProps {
  src: string
  alt: string
  size?: number
}

export function CoinBubble({ src, alt, size = 90 }: CoinBubbleProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ display: 'block', maxWidth: 'none', objectFit: 'contain' }}
    />
  )
}

// Pre-defined coin bubble assets (PNG with glass effect baked in)
export const COIN_BUBBLE_ASSETS = {
  // Above the wave
  btcChain: '/images/landing_page/coin-bubble-btc-chain.png',
  btcLightning: '/images/landing_page/coin-bubble-btc-lightning.png',
  tetherPolygon: '/images/landing_page/coin-bubble-tether-polygon.png',
  tetherEth: '/images/landing_page/coin-bubble-tether-eth.png',
  usdc: '/images/landing_page/coin-bubble-usdc.png',
  wbtcEth: '/images/landing_page/coin-bubble-wbtc-eth.png',

  // Inside the wave
  waveBtcLarge: '/images/landing_page/coin-bubble-wave-btc-large.png',
  waveBtcSmall: '/images/landing_page/coin-bubble-wave-btc-small.png',
  waveUsdLarge: '/images/landing_page/coin-bubble-wave-usd-large.png',
  waveUsdSmall: '/images/landing_page/coin-bubble-wave-usd-small.png',
  waveWbtcCitrea: '/images/landing_page/coin-bubble-wave-wbtc-citrea.png',
} as const
