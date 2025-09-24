import CitreaLogo from 'assets/images/coins/citrea.png'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Confetti from 'react-confetti'
import { useNavigate } from 'react-router'
import { useWindowSize } from 'react-use'
import { useBAppsCampaignProgress, useIsBAppsCampaignAvailable } from 'services/bappsCampaign/hooks'
import { Button, Flex, SpinningLoader, Text, styled } from 'ui/src'

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
    name: 'SCP',
    url: '/swap?chain=citrea_testnet&inputCurrency=NATIVE&outputCurrency=0x946D666ABae75b3e7De0C95551c4E36c946eFd5A&value=0.00001',
  },
]

export function CitreaCampaignProgress() {
  const navigate = useNavigate()
  const { progress: campaignProgress, loading, error } = useBAppsCampaignProgress()
  const { width, height } = useWindowSize()
  const isCampaignAvailable = useIsBAppsCampaignAvailable()

  // State for confetti animation
  const [showConfetti, setShowConfetti] = useState(false)
  const previousCompletedCountRef = useRef(0)

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

  // Trigger confetti when tasks are completed
  useEffect(() => {
    const currentCompletedCount = completedTasks.length
    console.log('[Campaign Debug] Completed tasks count:', {
      current: currentCompletedCount,
      previous: previousCompletedCountRef.current,
      completedTasks,
    })

    // Check if we have new completed tasks
    if (currentCompletedCount > previousCompletedCountRef.current && previousCompletedCountRef.current > 0) {
      console.log('[Campaign Debug] Showing confetti!')
      setShowConfetti(true)
      // Auto-hide confetti after 5 seconds
      setTimeout(() => setShowConfetti(false), 5000)
    }

    previousCompletedCountRef.current = currentCompletedCount
  }, [completedTasks])

  const handleTaskClick = useCallback(
    (url: string) => {
      navigate(url)
    },
    [navigate],
  )

  // Only show if campaign is available (time + chain + wallet checks)
  if (!isCampaignAvailable) {
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
    <>
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={200}
          recycle={false}
          colors={['#FF6B35', '#4CAF50', '#2ABDFF', '#FC72FF', '#FFD700']}
          gravity={0.1}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 1000 }}
        />
      )}
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

          <Text variant="body3" color="$neutral2">
            {completedTasks.length}/3 completed
          </Text>
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
    </>
  )
}
