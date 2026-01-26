import { Flex, styled } from 'ui/src'

export const FilterTabs = styled(Flex, {
  flexDirection: 'row',
  gap: '$spacing8',
  flexWrap: 'wrap',
})

export const FilterTab = styled(Flex, {
  paddingHorizontal: '$spacing16',
  paddingVertical: '$spacing8',
  borderRadius: '$rounded12',
  cursor: 'pointer',
  backgroundColor: '$surface2',
  variants: {
    active: {
      true: {
        backgroundColor: '$accent1',
      },
    },
  },
  pressStyle: {
    opacity: 0.8,
  },
  hoverStyle: {
    opacity: 0.9,
  },
})

export const SwapsList = styled(Flex, {
  gap: '$spacing16',
  width: '100%',
})

export const EmptyState = styled(Flex, {
  padding: '$spacing48',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  gap: '$spacing16',
})

export const SortButton = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing8',
  paddingHorizontal: '$spacing16',
  paddingVertical: '$spacing8',
  backgroundColor: '$surface2',
  borderRadius: '$rounded12',
  cursor: 'pointer',
  pressStyle: {
    opacity: 0.8,
  },
  hoverStyle: {
    opacity: 0.9,
  },
})
