import { ActivityRow } from 'components/AccountDrawer/MiniPortfolio/Activity/ActivityRow'
import { useAllActivities } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { createGroups } from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
import { OpenLimitOrdersButton } from 'components/AccountDrawer/MiniPortfolio/Limits/OpenLimitOrdersButton'
import { PortfolioSkeleton } from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { MenuState, miniPortfolioMenuStateAtom } from 'components/AccountDrawer/constants'
import { LoadingBubble } from 'components/Tokens/loading'
import Column from 'components/deprecated/Column'
import { useJuiceswapAuth } from 'hooks/useJuiceswapAuth'
import { useUpdateAtom } from 'jotai/utils'
import styled from 'lib/styled-components'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useCallback, useMemo, useState } from 'react'
import { ThemedText } from 'theme/components'
import { AnimatePresence, Flex } from 'ui/src'
import { Button } from 'ui/src/components/buttons/Button/Button'
import { useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const ActivityGroupWrapper = styled(Column)`
  margin-top: 16px;
  gap: 8px;
`

const OpenLimitOrdersActivityButton = styled(OpenLimitOrdersButton)`
  width: calc(100% - 32px);
  margin: 0 16px -4px;
`

export function ActivityTab({ account }: { account: string }) {
  const accountDrawer = useAccountDrawer()
  const setMenu = useUpdateAtom(miniPortfolioMenuStateAtom)
  const { isAuthenticated, handleAuthenticate } = useJuiceswapAuth()
  const [isPending, setIsPending] = useState(false)

  const { activities, loading } = useAllActivities(account)
  const onAuthenticate = useCallback(async () => {
    setIsPending(true)
    try {
      await handleAuthenticate()
    } finally {
      setIsPending(false)
    }
  }, [handleAuthenticate])

  const hideSpam = useHideSpamTokensSetting()
  const activityGroups = useMemo(() => createGroups(activities, hideSpam), [activities, hideSpam])

  if (activityGroups.length === 0) {
    if (loading) {
      return (
        <>
          <LoadingBubble height="16px" width="80px" margin="16px 16px 8px" />
          <PortfolioSkeleton shrinkRight />
        </>
      )
    } else {
      if (!isAuthenticated) {
        return (
          <Flex gap="$spacing16" alignItems="center" justifyContent="center" padding="$spacing24">
            <ThemedText.BodySecondary textAlign="center">
              Authenticate to view your bridge swaps history
            </ThemedText.BodySecondary>
            <Button
              variant="branded"
              emphasis="primary"
              size="medium"
              loading={isPending}
              isDisabled={isPending}
              onPress={onAuthenticate}
            >
              {isPending ? 'Signing message...' : 'Authenticate'}
            </Button>
          </Flex>
        )
      }
      return (
        <>
          <OpenLimitOrdersActivityButton openLimitsMenu={() => setMenu(MenuState.LIMITS)} account={account} />
          <EmptyWalletModule type="activity" onNavigateClick={accountDrawer.close} />
        </>
      )
    }
  } else {
    return (
      <>
        <OpenLimitOrdersActivityButton openLimitsMenu={() => setMenu(MenuState.LIMITS)} account={account} />
        {!isAuthenticated && (
          <ActivityGroupWrapper>
            <Flex gap="$spacing16" alignItems="center" justifyContent="center" padding="$spacing24">
              <ThemedText.BodySecondary textAlign="center">
                Authenticate to view your activity history
              </ThemedText.BodySecondary>
              <Button
                variant="branded"
                emphasis="primary"
                size="medium"
                loading={isPending}
                isDisabled={isPending}
                onPress={onAuthenticate}
              >
                {isPending ? 'Signing message...' : 'Authenticate'}
              </Button>
            </Flex>
          </ActivityGroupWrapper>
        )}
        <AnimatePresence>
          {activityGroups.map((activityGroup) => (
            <ActivityGroupWrapper key={activityGroup.title}>
              <ThemedText.SubHeader color="neutral2" marginLeft="16px">
                {activityGroup.title}
              </ThemedText.SubHeader>
              <Flex data-testid={TestID.ActivityContent} width="100%">
                {activityGroup.transactions.map(
                  (activity) =>
                    !(hideSpam && activity.isSpam) && <ActivityRow key={activity.hash} activity={activity} />,
                )}
              </Flex>
            </ActivityGroupWrapper>
          ))}
        </AnimatePresence>
      </>
    )
  }
}
