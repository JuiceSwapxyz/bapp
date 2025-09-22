import CitreaLogo from 'assets/images/coins/citrea.png'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { FeatureFlags } from 'constants/featureFlags'
import { useAccount } from 'hooks/useAccount'
import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useBAppsCampaignProgress } from 'services/bappsCampaign/hooks'
import { Anchor, Button, Flex, SpinningLoader, Text, styled } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const ProgressContainer = styled(Flex, {
  width: '100%',
  p: '$spacing16',
  gap: '$spacing12',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$surface3',
  position: 'relative',
  overflow: 'hidden',
})

const ProgressBar = styled(Flex, {
  height: 4,
  width: '100%',
  backgroundColor: '$surface3',
  borderRadius: '$rounded20',
  overflow: 'hidden',
  position: 'relative',
})

const ProgressFill = styled(Flex, {
  height: '100%',
  background: 'linear-gradient(90deg, #FF6B35 0%, #4CAF50 100%)',
  borderRadius: '$rounded20',
  transition: 'width 0.3s ease',
})

const TaskButton = styled(Button, {
  height: '$spacing28',
  px: '$spacing8',
  py: '$spacing4',
  backgroundColor: '$accent1',
  borderRadius: '$rounded12',
})

const CAMPAIGN_TASKS = [
  {
    id: 1,
    name: 'NUSD',
    url: '/swap?chain=citrea_testnet&inputCurrency=NATIVE&outputCurrency=0x9B28B690550522608890C3C7e63c0b4A7eBab9AA&value=0.00001',
  },
  {
    id: 2,
    name: 'cUSD',
    url: '/swap?chain=citrea_testnet&inputCurrency=NATIVE&outputCurrency=0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0&value=0.00001',
  },
  {
    id: 3,
    name: 'USDC',
    url: '/swap?chain=citrea_testnet&inputCurrency=NATIVE&outputCurrency=0x36c16eaC6B0Ba6c50f494914ff015fCa95B7835F&value=0.00000000001',
  },
]

export function CitreaCampaignProgress() {
  const { defaultChainId } = useEnabledChains()
  const account = useAccount()
  const navigate = useNavigate()
  const { progress: campaignProgress, loading, error } = useBAppsCampaignProgress()

  // Extract completed task IDs from API response
  const completedTasks = useMemo(() => {
    if (!campaignProgress) {
      return []
    }
    return campaignProgress.tasks.filter((task) => task.completed).map((task) => task.id)
  }, [campaignProgress])

  const progress = useMemo(() => {
    if (!campaignProgress) {
      return 0
    }
    return campaignProgress.progress
  }, [campaignProgress])

  const handleTaskClick = useCallback(
    (task: { url: string; name: string; isCompleted: boolean }) => {
      if (task.isCompleted) {
        popupRegistry.addPopup(
          {
            type: PopupType.CampaignTaskCompleted,
            taskName: task.name,
            progress,
          },
          `task-completed-${task.name}`,
          3000,
        )
        return
      }
      navigate(task.url)
    },
    [navigate, progress],
  )

  // Only show if feature flag is enabled, on Citrea Testnet, and wallet is connected
  if (!FeatureFlags.CITREA_BAPPS_CAMPAIGN || defaultChainId !== UniverseChainId.CitreaTestnet || !account.isConnected) {
    return null
  }

  // Show loading state
  if (loading && !campaignProgress) {
    return (
      <ProgressContainer>
        <Flex row gap="$spacing12" alignItems="center" justifyContent="center" width="100%">
          <SpinningLoader size={20} />
          <Text variant="body3" color="$neutral2">
            Loading campaign progress...
          </Text>
        </Flex>
      </ProgressContainer>
    )
  }

  // Show error state if API fails but still show UI with fallback data
  if (error && !campaignProgress) {
    return null
  }

  return (
    <ProgressContainer>
      <Flex row justifyContent="space-between" alignItems="center" width="100%">
        <Flex gap="$spacing4">
          <Flex row gap="$spacing8" alignItems="center">
            <img src={CitreaLogo} alt="Citrea" width={20} height={20} />
            <Text variant="body2" fontWeight="$semibold">
              ₿apps Campaign Progress
            </Text>
          </Flex>
          <Text variant="body4" color="$neutral2">
            Complete 3 swaps to earn rewards
          </Text>
        </Flex>

        <Flex row gap="$spacing8" alignItems="center">
          <Text variant="body3" color="$neutral2">
            {completedTasks.length}/3 completed
          </Text>
          <Anchor href="https://bapps.citrea.xyz" target="_blank" rel="noopener noreferrer" textDecorationLine="none">
            <Text variant="body4" color="$accent1">
              View Details →
            </Text>
          </Anchor>
        </Flex>
      </Flex>

      <ProgressBar>
        <ProgressFill width={`${progress}%`} />
      </ProgressBar>

      <Flex row gap="$spacing8" width="100%" justifyContent="space-between">
        {CAMPAIGN_TASKS.map((task) => {
          const isCompleted = completedTasks.includes(task.id)
          return (
            <TaskButton
              key={task.id}
              size="small"
              emphasis={isCompleted ? 'tertiary' : 'secondary'}
              onPress={() => handleTaskClick({ url: task.url, name: task.name, isCompleted })}
              flex={1}
            >
              <Flex row gap="$spacing4" alignItems="center">
                {isCompleted && <Text variant="body4">✓</Text>}
                <Text variant="buttonLabel4">{task.name}</Text>
              </Flex>
            </TaskButton>
          )
        })}
      </Flex>
    </ProgressContainer>
  )
}
