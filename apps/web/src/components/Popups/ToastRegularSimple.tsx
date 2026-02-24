import { Flex, Text, TouchableArea, useShadowPropsMedium } from 'ui/src'
import { X } from 'ui/src/components/icons/X'

// Temporary Spore-ish implementation for mweb until Spore project makes toasts consistent across all platforms
export function ToastRegularSimple({
  icon,
  text,
  onDismiss,
}: {
  icon: JSX.Element
  text?: string | JSX.Element
  onDismiss?: () => void
}): JSX.Element {
  const shadowProps = useShadowPropsMedium()
  const isToastOneLine = typeof text === 'string'

  return (
    <Flex position="relative" mx="auto" width="fit-content" $sm={{ maxWidth: '100%', mx: 'auto' }}>
      <Flex
        row
        alignItems="center"
        animation="300ms"
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        left={0}
        {...shadowProps}
        p="$spacing16"
        opacity={1}
      >
        <Flex row alignItems={isToastOneLine ? 'center' : 'flex-start'} gap={12} minWidth={0}>
          <Flex>{icon}</Flex>
          {text ? isToastOneLine ? <Text variant="body2">{text}</Text> : text : null}
        </Flex>
      </Flex>
      {onDismiss ? (
        <TouchableArea
          onPress={onDismiss}
          position="absolute"
          top={-8}
          right={-8}
          backgroundColor="$surface1"
          borderRadius="$roundedFull"
          borderColor="$surface3"
          borderWidth="$spacing1"
          p="$spacing4"
          alignItems="center"
          justifyContent="center"
        >
          <X color="$neutral2" size={12} />
        </TouchableArea>
      ) : null}
    </Flex>
  )
}
