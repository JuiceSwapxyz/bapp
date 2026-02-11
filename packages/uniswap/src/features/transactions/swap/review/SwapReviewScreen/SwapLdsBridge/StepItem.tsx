import { Flex, SpinningLoader, Text } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { TimePast } from 'ui/src/components/icons/TimePast'
import { iconSizes } from 'ui/src/theme'

export type StepStatus = 'pending' | 'active' | 'completed'

interface StepItemProps {
  label: string
  status: StepStatus
}

export function StepItem({ label, status }: StepItemProps): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$spacing8">
      {status === 'completed' ? (
        <Check size={iconSizes.icon16} color="$accent1" />
      ) : status === 'active' ? (
        <SpinningLoader size={iconSizes.icon16} color="$accent1" />
      ) : (
        <Flex width={iconSizes.icon16} height={iconSizes.icon16} alignItems="center" justifyContent="center">
          <TimePast size={iconSizes.icon12} color="$neutral3" />
        </Flex>
      )}
      <Text
        variant="body3"
        color={status === 'completed' ? '$accent1' : status === 'active' ? '$neutral1' : '$neutral3'}
      >
        {label}
      </Text>
    </Flex>
  )
}

export function getStepStatus<T extends string>(
  order: T[],
  stepSubSteps: T[],
  currentSubStep: T | undefined,
): StepStatus {
  if (!currentSubStep) {
    return 'pending'
  }
  const currentIndex = order.indexOf(currentSubStep)
  const stepMinIndex = Math.min(...stepSubSteps.map((s) => order.indexOf(s)))
  const stepMaxIndex = Math.max(...stepSubSteps.map((s) => order.indexOf(s)))

  if (currentIndex > stepMaxIndex) {
    return 'completed'
  }
  if (currentIndex >= stepMinIndex && currentIndex <= stepMaxIndex) {
    return 'active'
  }
  return 'pending'
}
