import { useNavigate } from 'react-router'
import { CampaignCondition, ConditionStatus, ConditionType } from 'services/firstSqueezerCampaign/types'
import { Button, Flex, Text, styled } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { Clock } from 'ui/src/components/icons/Clock'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'

const Card = styled(Flex, {
  gap: '$spacing16',
  padding: '$spacing20',
  backgroundColor: '$surface1',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderColor: '$surface3',
  variants: {
    completed: {
      true: {
        borderColor: '$statusSuccess',
        borderWidth: 2,
        backgroundColor: 'rgba(76, 175, 80, 0.05)',
      },
    },
  },
})

const CardHeader = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '$spacing12',
})

const CardContent = styled(Flex, {
  gap: '$spacing8',
  flex: 1,
})

const ConditionNumber = styled(Flex, {
  width: 32,
  height: 32,
  borderRadius: '$roundedFull',
  backgroundColor: '$surface3',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  variants: {
    completed: {
      true: {
        backgroundColor: '$statusSuccess',
      },
    },
  },
})

const ConditionNumberText = styled(Text, {
  variant: 'body2',
  fontWeight: 'bold',
  color: '$neutral1',
  variants: {
    completed: {
      true: {
        color: '$white',
      },
    },
  },
})

const Title = styled(Text, {
  variant: 'body1',
  color: '$neutral1',
  fontWeight: '600',
})

const Description = styled(Text, {
  variant: 'body3',
  color: '$neutral2',
})

const StatusBadge = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing4',
  paddingHorizontal: '$spacing8',
  paddingVertical: '$spacing4',
  borderRadius: '$rounded8',
  backgroundColor: '$surface3',
  flexShrink: 0,
})

const StatusText = styled(Text, {
  variant: 'body4',
  fontWeight: '500',
})

const ActionButton = styled(Button, {
  gap: '$spacing8',
  paddingHorizontal: '$spacing16',
  paddingVertical: '$spacing10',
  minHeight: 40,
  backgroundColor: '$accent1',
  borderRadius: '$rounded8',
  hoverStyle: {
    backgroundColor: '$accent2',
  },
  variants: {
    completed: {
      true: {
        backgroundColor: '$statusSuccess',
        opacity: 0.7,
      },
    },
  },
})

interface ConditionCardProps {
  condition: CampaignCondition
  onAction?: () => void
  isLoading?: boolean
}

export function ConditionCard({ condition, onAction, isLoading }: ConditionCardProps) {
  const navigate = useNavigate()
  const isCompleted = condition.status === ConditionStatus.COMPLETED
  const isInternal = condition.type === ConditionType.BAPPS_COMPLETED

  const handleAction = () => {
    if (isCompleted) {
      return
    }

    if (onAction) {
      onAction()
    } else if (condition.ctaUrl) {
      if (isInternal) {
        navigate(condition.ctaUrl)
      } else {
        window.open(condition.ctaUrl, '_blank', 'noopener,noreferrer')
      }
    }
  }

  return (
    <Card completed={isCompleted}>
      <CardHeader>
        <Flex row gap="$spacing12" alignItems="flex-start" flex={1}>
          <ConditionNumber completed={isCompleted}>
            {isCompleted ? (
              <Check size="$icon.16" color="$white" />
            ) : (
              <ConditionNumberText completed={isCompleted}>{condition.id}</ConditionNumberText>
            )}
          </ConditionNumber>

          <CardContent>
            <Title>{condition.icon ? `${condition.icon} ${condition.name}` : condition.name}</Title>
            <Description>{condition.description}</Description>

            {condition.completedAt && (
              <Text variant="body4" color="$statusSuccess">
                ✓ Completed on {new Date(condition.completedAt).toLocaleDateString()}
              </Text>
            )}
          </CardContent>
        </Flex>

        <StatusBadge>
          {isCompleted ? (
            <>
              <Check size="$icon.12" color="$statusSuccess" />
              <StatusText color="$statusSuccess">Completed</StatusText>
            </>
          ) : (
            <>
              <Clock size="$icon.12" color="$neutral2" />
              <StatusText color="$neutral2">Pending</StatusText>
            </>
          )}
        </StatusBadge>
      </CardHeader>

      {!isCompleted && condition.ctaText && (
        <ActionButton onPress={handleAction} disabled={isLoading} completed={isCompleted}>
          <Text variant="buttonLabel4" color="$white">
            {isLoading ? 'Loading...' : condition.ctaText}
          </Text>
          {!isInternal && <ExternalLink size="$icon.16" color="$white" />}
        </ActionButton>
      )}
    </Card>
  )
}
