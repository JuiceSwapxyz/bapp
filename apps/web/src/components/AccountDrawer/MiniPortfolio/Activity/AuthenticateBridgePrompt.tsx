import { useJuiceswapAuth } from 'hooks/useJuiceswapAuth'
import { useCallback, useState } from 'react'
import { Button } from 'ui/src'
import { EmptyActivityIcon } from 'ui/src/components/icons/EmptyActivityIcon'
import { Flex } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'

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
    <Flex
      alignItems="center"
      justifyContent="center"
      height="100%"
      width="100%"
      paddingLeft="$spacing32"
      paddingRight="$spacing32"
      $sm={{ paddingTop: '$spacing8' }}
    >
      <EmptyActivityIcon size={115} />
      <Text variant="subheading1" textAlign="center" marginTop="$spacing12">
        Activity Swaps
      </Text>
      <Text
        variant="body2"
        textAlign="center"
        marginTop="$spacing8"
        color="$neutral2"
        $platform-web={{ textWrap: 'pretty' }}
      >
        Authenticate to view your Activity swaps history
      </Text>
      <Flex marginTop="$spacing20">
        <Button
          variant="branded"
          alignSelf="center"
          loading={isPending}
          isDisabled={isPending}
          onPress={onAuthenticate}
        >
          {isPending ? 'Signing message...' : 'Authenticate'}
        </Button>
      </Flex>
    </Flex>
  )
}
