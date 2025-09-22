import CitreaLogo from 'assets/images/coins/citrea.png'
import { useAccount } from 'hooks/useAccount'
import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Anchor, Button, Flex, Text, styled } from 'ui/src'
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

  // Track completed tasks in localStorage (temporary solution until API integration)
  const completedTasks = useMemo(() => {
    if (!account.address) {
      return []
    }

    try {
      const stored = localStorage.getItem(`citrea_bapps_completed_${account.address}`)
      return stored ? JSON.parse(stored) : []
    } catch {
      // Return empty array if there's any error reading from localStorage
      return []
    }
  }, [account.address])

  const progress = useMemo(() => {
    return (completedTasks.length / CAMPAIGN_TASKS.length) * 100
  }, [completedTasks.length])

  const handleTaskClick = useCallback(
    (url: string) => {
      navigate(url)
    },
    [navigate],
  )

  // Only show on Citrea Testnet when wallet is connected
  if (defaultChainId !== UniverseChainId.CitreaTestnet || !account.isConnected) {
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
              onPress={() => !isCompleted && handleTaskClick(task.url)}
              disabled={isCompleted}
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
