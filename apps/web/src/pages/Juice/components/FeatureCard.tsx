import { ReactNode } from 'react'
import { Flex, Text, styled } from 'ui/src'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  benefit?: string
}

const Card = styled(Flex, {
  flexDirection: 'column',
  padding: '$spacing20',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  flex: 1,
  minWidth: 250,
  gap: '$spacing12',
})

const IconContainer = styled(Flex, {
  width: 48,
  height: 48,
  borderRadius: '$rounded12',
  backgroundColor: '$surface3',
  alignItems: 'center',
  justifyContent: 'center',
})

export function FeatureCard({ icon, title, description, benefit }: FeatureCardProps) {
  return (
    <Card>
      <IconContainer>{icon}</IconContainer>
      <Text variant="subheading1" color="$neutral1" fontWeight="bold">
        {title}
      </Text>
      <Text variant="body2" color="$neutral2">
        {description}
      </Text>
      {benefit && (
        <Text variant="body3" color="$accent1" mt="auto">
          {benefit}
        </Text>
      )}
    </Card>
  )
}
