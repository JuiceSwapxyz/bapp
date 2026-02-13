import { useJuiceswapAuth } from 'hooks/useJuiceswapAuth'
import { MainTitle, PageContainer, Subtitle } from 'pages/BridgeSwaps/styles'
import { useCallback, useState } from 'react'
import { AnimatePresence, Flex } from 'ui/src'
import { Button } from 'ui/src/components/buttons/Button/Button'

export function AuthenticateSection(): JSX.Element {
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
    <PageContainer justifyContent="center" alignItems="center">
      <AnimatePresence exitBeforeEnter>
        <Flex
          key="auth"
          gap="$spacing16"
          alignItems="center"
          animation="200ms"
          enterStyle={{ opacity: 0, y: 10 }}
          exitStyle={{ opacity: 0, y: -10 }}
        >
          <MainTitle textAlign="center">Bridge Swaps</MainTitle>
          <Subtitle textAlign="center">Authenticate to view your bridge swaps history</Subtitle>
          <Button
            variant="branded"
            emphasis="primary"
            size="large"
            alignSelf="center"
            loading={isPending}
            isDisabled={isPending}
            onPress={onAuthenticate}
          >
            {isPending ? 'Signing message...' : 'Authenticate'}
          </Button>
        </Flex>
      </AnimatePresence>
    </PageContainer>
  )
}
