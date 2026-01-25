import { Flex, Text, styled } from 'ui/src'

interface SectionHeaderProps {
  title: string
  subtitle?: string
}

const HeaderContainer = styled(Flex, {
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: '$spacing24',
  paddingTop: '$spacing48',
})

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <HeaderContainer>
      <Text variant="heading2" color="$neutral1" textAlign="center" fontWeight="bold">
        {title}
      </Text>
      {subtitle && (
        <Text variant="body1" color="$neutral2" textAlign="center" mt="$spacing8" maxWidth={700}>
          {subtitle}
        </Text>
      )}
    </HeaderContainer>
  )
}
