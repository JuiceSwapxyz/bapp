import { Flex, Text, styled } from 'ui/src'

interface MetricCardProps {
  value: string
  label: string
  description?: string
}

const Card = styled(Flex, {
  flexDirection: 'column',
  alignItems: 'center',
  padding: '$spacing20',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  flex: 1,
  minWidth: 150,
  gap: '$spacing8',
})

const ValueText = styled(Text, {
  fontSize: 36,
  fontWeight: 'bold',
  color: '$accent1',

  $md: {
    fontSize: 28,
  },
})

export function MetricCard({ value, label, description }: MetricCardProps) {
  return (
    <Card>
      <ValueText>{value}</ValueText>
      <Text variant="subheading2" color="$neutral1" fontWeight="600" textAlign="center">
        {label}
      </Text>
      {description && (
        <Text variant="body3" color="$neutral2" textAlign="center">
          {description}
        </Text>
      )}
    </Card>
  )
}
