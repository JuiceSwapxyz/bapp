import { useJuiceswapAuth } from 'hooks/useJuiceswapAuth'
import { useCallback, useState } from 'react'
import { ThemedText } from 'theme/components'
import { Flex } from 'ui/src'
import { Button } from 'ui/src/components/buttons/Button/Button'

export function AuthenticateBridgePrompt(): JSX.Element {
  const { handleAuthenticate } = useJuiceswapAuth()
  const [isPending, setIsPending] = useState(false)

  const onAuthenticate = useCallback(async () => {
    setIsPending(true)
    try {
      await handleAuthenticate()
    } finally {
      setIsPending(false)
    }
  }, [handleAuthenticate])

  return (
    <Flex gap="$spacing16" alignItems="center" justifyContent="center" padding="$spacing24">
      <ThemedText.BodySecondary textAlign="center">
        Authenticate to view your bridge swaps history
      </ThemedText.BodySecondary>
      <Button
        variant="branded"
        emphasis="primary"
        size="medium"
        alignSelf="center"
        loading={isPending}
        isDisabled={isPending}
        onPress={onAuthenticate}
      >
        {isPending ? 'Signing message...' : 'Authenticate'}
      </Button>
    </Flex>
  )
}
