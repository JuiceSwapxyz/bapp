/**
 * Shared styled components for Launchpad pages
 */
import { Flex, Text, styled } from 'ui/src'

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

// ============================================================================
// Progress Bar Components (used in TokenCard, TokenDetail)
// ============================================================================

// Generate gradient from Hero orange to a color based on progress (orange -> green)
export function getProgressGradient(progress: number): string {
  const clampedProgress = Math.min(Math.max(progress, 0), 100) / 100
  // Hero orange RGB: 255, 124, 58
  // JuiceSwap green RGB: 99, 200, 122
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
        hoverStyle: {
          borderColor: '$accent1',
          backgroundColor: '$surface3',
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
  hoverStyle: {
    opacity: 0.7,
  },
})

// ============================================================================
// Badge Components (used in TokenCard, TokenDetail)
// ============================================================================

export const GraduatedBadge = styled(Flex, {
  backgroundColor: '$statusSuccess2',
  borderRadius: '$rounded8',
  variants: {
    size: {
      sm: { paddingHorizontal: '$spacing8', paddingVertical: '$spacing4' },
      md: { paddingHorizontal: '$spacing12', paddingVertical: '$spacing6' },
    },
  } as const,
  defaultVariants: { size: 'sm' },
})
