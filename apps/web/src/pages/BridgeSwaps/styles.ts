import { Button, Flex, Input, Text, styled } from 'ui/src'

export const PageContainer = styled(Flex, {
  width: '100%',
  minHeight: '100vh',
  backgroundColor: '$surface1',
  paddingTop: '$spacing20',
  paddingBottom: '$spacing60',
  paddingHorizontal: '$spacing20',
})

export const ContentWrapper = styled(Flex, {
  maxWidth: 1200,
  width: '100%',
  alignSelf: 'center',
  gap: '$spacing32',
})

export const HeaderSection = styled(Flex, {
  gap: '$spacing16',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexDirection: 'row',
  flexWrap: 'wrap',
  paddingBottom: '$spacing24',
  borderBottomWidth: 1,
  borderBottomColor: '$surface3',
})

export const TitleSection = styled(Flex, {
  gap: '$spacing8',
  flex: 1,
  minWidth: 0,
})

export const MainTitle = styled(Text, {
  variant: 'heading2',
  color: '$neutral1',
  fontWeight: 'bold',
})

export const Subtitle = styled(Text, {
  variant: 'body2',
  color: '$neutral2',
})

export const StatsBar = styled(Flex, {
  flexDirection: 'row',
  gap: '$spacing24',
  padding: '$spacing20',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  flexWrap: 'wrap',
})

export const StatItem = styled(Flex, {
  gap: '$spacing4',
  alignItems: 'center',
})

export const StatValue = styled(Text, {
  variant: 'heading3',
  color: '$neutral1',
  fontWeight: 'bold',
})

export const StatLabel = styled(Text, {
  variant: 'body3',
  color: '$neutral2',
})

export const RefundableSection = styled(Flex, {
  gap: '$spacing16',
  padding: '$spacing20',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  borderWidth: 2,
  borderColor: '$DEP_accentWarning',
})

export const RefundableSwapCard = styled(Flex, {
  backgroundColor: '$surface3',
  borderRadius: '$rounded12',
  padding: '$spacing16',
  gap: '$spacing12',
  flexDirection: 'column',
})

export const RefundButton = styled(Button, {
  backgroundColor: '$DEP_accentWarning',
  borderRadius: '$rounded12',
  paddingHorizontal: '$spacing16',
  paddingVertical: '$spacing12',
  width: '100%',
  alignSelf: 'stretch',
  hoverStyle: {
    opacity: 0.9,
  },
  pressStyle: {
    opacity: 0.8,
  },
  disabledStyle: {
    opacity: 0.5,
    backgroundColor: '$surface3',
  },
})

export const AddressInput = styled(Input, {
  backgroundColor: '$surface1',
  borderWidth: 1,
  borderColor: '$surface3',
  borderRadius: '$rounded12',
  paddingHorizontal: '$spacing12',
  paddingVertical: '$spacing12',
  color: '$neutral1',
  fontSize: 14,
  width: '100%',
  minHeight: 44,
  focusStyle: {
    borderColor: '$accent1',
  },
})
