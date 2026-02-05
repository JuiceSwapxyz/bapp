import { Flex, Text, styled } from 'ui/src'

export const Card = styled(Flex, {
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  padding: '$spacing16',
  gap: '$spacing12',
  cursor: 'pointer',
  pressStyle: {
    opacity: 0.9,
  },
  hoverStyle: {
    backgroundColor: '$surface3',
  },
})

export const CardHeader = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
})

export const SwapInfo = styled(Flex, {
  flex: 1,
  gap: '$spacing8',
})

export const SwapAmounts = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing8',
  flexWrap: 'wrap',
})

export const StatusBadge = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing4',
  paddingHorizontal: '$spacing12',
  paddingVertical: '$spacing4',
  borderRadius: '$rounded8',
  variants: {
    status: {
      pending: {
        backgroundColor: '$DEP_accentWarning',
      },
      completed: {
        backgroundColor: '$statusSuccess',
      },
      failed: {
        backgroundColor: '$statusCritical',
      },
      abandoned: {
        backgroundColor: '$neutral3',
      },
    },
  },
})

export const DetailRow = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: '$spacing4',
  gap: '$spacing8',
})

export const DetailLabel = styled(Text, {
  variant: 'body3',
  color: '$neutral2',
})

export const DetailValue = styled(Text, {
  variant: 'body3',
  color: '$neutral1',
  fontFamily: '$mono',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '60%',
})

export const TxLink = styled(Text, {
  variant: 'body3',
  color: '$accent1',
  fontFamily: '$mono',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '60%',
  cursor: 'pointer',
  textDecorationLine: 'none',
  hoverStyle: {
    textDecorationLine: 'underline',
  },
})

export const ExpandButton = styled(Flex, {
  padding: '$spacing8',
  borderRadius: '$rounded8',
  variants: {
    expanded: {
      true: {
        transform: [{ rotate: '180deg' }],
      },
    },
  },
})
