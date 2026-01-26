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
