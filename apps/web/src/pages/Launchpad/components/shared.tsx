/**
 * Shared styled components for Launchpad pages.
 *
 * Design language follows the JuiceSwap brand: citrus-orange accent ($accent1
 * = #F7911A), the signature citrus gradient (green -> amber -> deep orange), the
 * Pacifico script for "juice" display accents, and Uniswap-grade clean surfaces.
 * Mirrors the patterns in pages/Landing/sections/Hero.tsx so the Launchpad reads
 * as the same product.
 */
import { Flex, Text, styled } from 'ui/src'

// ============================================================================
// Brand tokens (kept here so every Launchpad surface stays on-brand)
// ============================================================================

// Signature citrus gradient: fresh green -> amber -> deep orange. Same stops as
// the landing hero (HeroGradientTitle) and the "graduation" progress story.
export const CITRUS_GRADIENT = 'linear-gradient(90deg, #63C87A 0%, #FFB347 50%, #FF7C3A 100%)'

// Warm "juice pour" gradient for hero/section backdrops (deep -> light orange).
export const JUICE_GRADIENT = 'linear-gradient(135deg, #FF7C3A 0%, #F7911A 45%, #FFB62E 100%)'

// ============================================================================
// Page backdrop — the subtle citrus wash anchored to the top of every launchpad
// page. Single source of truth so the listing and Create read as one product.
//
// The glow MUST fade to zero alpha before the viewport edges: the page container
// clips with overflow:hidden, so any residual alpha at x=0/x=100% gets sliced
// into a hard vertical seam (most visible in dark mode). We therefore (a) keep
// the radial on a single hue fading to alpha 0, and (b) feather the left/right
// with a horizontal mask so the wash dissolves into the surface instead of
// hitting a wall.
// ============================================================================

const BACKDROP_MASK = 'linear-gradient(to right, transparent 0%, #000 18%, #000 82%, transparent 100%)'

export const LaunchpadBackdrop = styled(Flex, {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 560,
  zIndex: 0,
  pointerEvents: 'none',
  '$platform-web': {
    background:
      'radial-gradient(120% 90% at 50% 0%, rgba(247,145,26,0.13) 0%, rgba(255,179,71,0.05) 40%, rgba(247,145,26,0) 72%)',
    maskImage: BACKDROP_MASK,
    WebkitMaskImage: BACKDROP_MASK,
  },
})

// ============================================================================
// Display type — Pacifico script with the citrus gradient clipped to the text.
// Use for short "juice" accent words ("Squeeze", "Juice", "Graduated"). Web
// applies the gradient fill; native falls back to the accent color.
// ============================================================================

export const JuiceScriptText = styled(
  Text as any,
  {
    name: 'JuiceScriptText',
    color: '$accent1',
    fontWeight: '400',
    // Pacifico has tall ascenders/descenders; the gradient is clipped to the
    // text box, so a generous lineHeight is required or descenders (q, y, f)
    // fall outside the filled box and render transparent ("cut off"). The
    // landing hero uses ~1.77x for the same reason.
    '$platform-web': {
      fontFamily: '"Pacifico", sans-serif',
      color: 'transparent',
      backgroundImage: CITRUS_GRADIENT,
      backgroundRepeat: 'no-repeat',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      display: 'inline-block',
      overflow: 'visible',
      paddingBottom: '0.18em',
    },
  } as any,
) as any

// ============================================================================
// Stats Components (used in TokenCard, TokenDetail, Create)
// ============================================================================

export const StatRow = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
})

export const StatLabel = styled(Text, {
  color: '$neutral2',
})

export const StatValue = styled(Text, {
  color: '$neutral1',
  fontWeight: '500',
})

// A self-contained stat "tile" for headline metrics (launchpad header, chart
// stats grid). Bordered surface, big value over a muted label.
export const StatTile = styled(Flex, {
  flex: 1,
  minWidth: 132,
  gap: '$spacing4',
  padding: '$spacing16',
  backgroundColor: '$surface1',
  borderRadius: '$rounded16',
  borderWidth: 1,
  borderColor: '$surface3',
})

// ============================================================================
// Progress Bar Components (used in TokenCard, TokenDetail)
// ============================================================================

// Generate a gradient from deep citrus orange toward fresh green as a token
// fills its bonding curve and gets closer to graduation ("ripening").
export function getProgressGradient(progress: number): string {
  const clampedProgress = Math.min(Math.max(progress, 0), 100) / 100
  // Hero orange RGB: 255, 124, 58  ->  JuiceSwap green RGB: 99, 200, 122
  const r = Math.round(255 - (255 - 99) * clampedProgress)
  const g = Math.round(124 + (200 - 124) * clampedProgress)
  const b = Math.round(58 + (122 - 58) * clampedProgress)
  return `linear-gradient(to right, #FF7C3A, rgb(${r}, ${g}, ${b}))`
}

export const ProgressBar = styled(Flex, {
  backgroundColor: '$surface3',
  overflow: 'hidden',
  variants: {
    size: {
      sm: { height: 8, borderRadius: '$rounded4' },
      md: { height: 12, borderRadius: '$rounded8' },
      lg: { height: 16, borderRadius: '$rounded12' },
    },
  } as const,
  defaultVariants: { size: 'sm' },
})

export const ProgressFill = styled(Flex, {
  height: '100%',
  backgroundColor: '$accent1',
  variants: {
    size: {
      sm: { borderRadius: '$rounded4' },
      md: { borderRadius: '$rounded8' },
      lg: { borderRadius: '$rounded12' },
    },
  } as const,
  defaultVariants: { size: 'sm' },
})

// ============================================================================
// Card Component (used in TokenCard, TokenDetail)
// ============================================================================

export const Card = styled(Flex, {
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  borderWidth: 1,
  borderColor: '$surface3',
  padding: '$spacing16',
  gap: '$spacing12',
  variants: {
    interactive: {
      true: {
        cursor: 'pointer',
        animation: 'quick',
        hoverStyle: {
          borderColor: '$accent1',
          y: -2,
        },
        pressStyle: {
          scale: 0.98,
        },
      },
    },
    graduated: {
      true: {
        borderTopWidth: 2,
        borderTopColor: '$statusSuccess',
      },
    },
    emphasis: {
      // accent-edged card for the "primary" surface (e.g. chart card)
      true: {
        borderTopWidth: 2,
        borderTopColor: '$accent1',
      },
    },
  } as const,
})

// ============================================================================
// Buttons (unified primary/secondary, fixes hover that hid the label)
// ============================================================================

const ButtonBase = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$spacing8',
  borderRadius: '$rounded12',
  cursor: 'pointer',
  flexShrink: 0,
  animation: 'quick',
  userSelect: 'none',
  variants: {
    size: {
      sm: { height: 36, paddingHorizontal: '$spacing16' },
      md: { height: 44, paddingHorizontal: '$spacing20' },
      lg: { height: 48, paddingHorizontal: '$spacing24' },
    },
    fill: {
      true: { width: '100%' },
    },
    disabled: {
      true: { cursor: 'not-allowed', opacity: 0.6, pointerEvents: 'none' },
    },
  } as const,
  defaultVariants: { size: 'md' },
})

// Solid citrus button. Hover darkens (does NOT fade to a transparent fill,
// which previously made the white label disappear).
export const PrimaryButton = styled(ButtonBase, {
  backgroundColor: '$accent1',
  hoverStyle: { backgroundColor: '$accent1Hovered' },
  pressStyle: { backgroundColor: '$accent1Hovered', scale: 0.99 },
})

// Soft citrus button on a pale orange fill, for secondary actions.
export const SecondaryButton = styled(ButtonBase, {
  backgroundColor: '$accent2',
  borderWidth: 1,
  borderColor: '$accent1',
  hoverStyle: { backgroundColor: '$accent2Hovered' },
  pressStyle: { scale: 0.99 },
})

// ============================================================================
// Pills (filters, sort, segmented controls) — single source of truth so the
// launchpad listing and token detail controls look identical.
// ============================================================================

export const Pill = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing6',
  paddingHorizontal: '$spacing16',
  paddingVertical: '$spacing8',
  borderRadius: '$roundedFull',
  cursor: 'pointer',
  backgroundColor: '$surface2',
  borderWidth: 1,
  borderColor: '$surface3',
  animation: 'quick',
  hoverStyle: { borderColor: '$accent1' },
  variants: {
    active: {
      true: {
        backgroundColor: '$accent2',
        borderColor: '$accent1',
      },
    },
  } as const,
})

// ============================================================================
// Navigation Components (used in TokenDetail, Create)
// ============================================================================

export const BackButton = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing8',
  cursor: 'pointer',
  paddingVertical: '$spacing8',
  animation: 'quick',
  hoverStyle: {
    opacity: 0.7,
  },
})

// ============================================================================
// Badge Components (used in TokenCard, TokenDetail)
// ============================================================================

export const GraduatedBadge = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing4',
  backgroundColor: '$statusSuccess2',
  borderRadius: '$roundedFull',
  variants: {
    size: {
      sm: { paddingHorizontal: '$spacing8', paddingVertical: '$spacing4' },
      md: { paddingHorizontal: '$spacing12', paddingVertical: '$spacing6' },
    },
  } as const,
  defaultVariants: { size: 'sm' },
})

// Trust signal pill — the launchpad's anti-rug wedge (locked liquidity,
// immutable metadata, JUSD-backed). Success-tinted, icon + short label.
export const TrustBadge = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing6',
  paddingHorizontal: '$spacing12',
  paddingVertical: '$spacing6',
  borderRadius: '$roundedFull',
  backgroundColor: '$statusSuccess2',
})
