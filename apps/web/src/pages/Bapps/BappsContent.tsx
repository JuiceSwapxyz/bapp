import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import CampaignAnalytics from 'pages/Bapps/CampaignAnalytics'
import { Button, Flex, Text, styled } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { Clock } from 'ui/src/components/icons/Clock'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'

const ContentContainer = styled(Flex, {
  gap: '$spacing32',
  width: '100%',
})

const Section = styled(Flex, {
  gap: '$spacing16',
  padding: '$spacing24',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  borderWidth: 1,
  borderColor: '$surface3',
})

const SectionTitle = styled(Text, {
  variant: 'heading3',
  color: '$neutral1',
  fontWeight: '600',
})

const TaskCard = styled(Flex, {
  gap: '$spacing16',
  padding: '$spacing20',
  backgroundColor: '$surface1',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderColor: '$surface3',
})

const TaskHeader = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '$spacing12',
})

const TaskInfo = styled(Flex, {
  gap: '$spacing8',
  flex: 1,
})

const TaskTitle = styled(Text, {
  variant: 'body1',
  color: '$neutral1',
  fontWeight: '600',
})

const TaskDescription = styled(Text, {
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
  variants: {
    completed: {
      true: {
        backgroundColor: '$statusSuccess',
      },
    },
    disabled: {
      true: {
        backgroundColor: '$surface3',
        opacity: 0.6,
      },
    },
  },
})

const ProgressBar = styled(Flex, {
  height: 8,
  flex: 1,
  backgroundColor: '$surface3',
  borderRadius: '$rounded4',
  overflow: 'hidden',
})

const ProgressFill = styled(Flex, {
  height: '100%',
  backgroundColor: '$accent1',
  borderRadius: '$rounded4',
})

const ProgressText = styled(Text, {
  variant: 'body3',
  color: '$neutral2',
  fontWeight: '500',
})

interface CampaignTask {
  id: number
  name: string
  description: string
  completed: boolean
  completedAt?: string
  txHash?: string
}

interface CampaignProgress {
  walletAddress: string
  chainId: number
  tasks: CampaignTask[]
  totalTasks: number
  completedTasks: number
  progress: number
  nftClaimed: boolean
  claimTxHash?: string
}

interface BappsContentProps {
  account: { address?: string; isConnected: boolean }
  campaignProgress: CampaignProgress | null
  isLoading: boolean
}

const TASK_SWAP_URLS = {
  1: 'https://bapp.juiceswap.xyz/swap?chain=citrea_testnet&inputCurrency=NATIVE&outputCurrency=0x9B28B690550522608890C3C7e63c0b4A7eBab9AA&value=0.00001',
  2: 'https://bapp.juiceswap.xyz/swap?chain=citrea_testnet&inputCurrency=NATIVE&outputCurrency=0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0&value=0.00001',
  3: 'https://bapp.juiceswap.xyz/swap?chain=citrea_testnet&inputCurrency=NATIVE&outputCurrency=0x36c16eaC6B0Ba6c50f494914ff015fCa95B7835F&value=0.00000000001',
}

export default function BappsContent({ account, campaignProgress, isLoading }: BappsContentProps) {
  const accountDrawer = useAccountDrawer()

  const handleConnectWallet = () => {
    accountDrawer.open()
  }

  if (!account.isConnected) {
    return (
      <ContentContainer>
        <Section>
          <SectionTitle>Connect Your Wallet</SectionTitle>
          <Text variant="body2" color="$neutral2">
            Connect your wallet to view your campaign progress and complete swap tasks.
          </Text>
          <Button
            onPress={handleConnectWallet}
            backgroundColor="$accent1"
            paddingHorizontal="$spacing16"
            paddingVertical="$spacing12"
            borderRadius="$rounded12"
          >
            <Text variant="buttonLabel3" color="$white">
              Connect Wallet
            </Text>
          </Button>
        </Section>
      </ContentContainer>
    )
  }

  const handleTaskAction = (taskId: number, completed: boolean) => {
    if (completed) {
      return // Already completed
    }

    const swapUrl = TASK_SWAP_URLS[taskId as keyof typeof TASK_SWAP_URLS]
    if (swapUrl) {
      window.open(swapUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const defaultTasks: CampaignTask[] = [
    {
      id: 1,
      name: 'Swap cBTC to NUSD',
      description: 'Complete a swap from cBTC to Nectra USD (NUSD)',
      completed: false,
    },
    {
      id: 2,
      name: 'Swap cBTC to cUSD',
      description: 'Complete a swap from cBTC to cUSD',
      completed: false,
    },
    {
      id: 3,
      name: 'Swap cBTC to USDC',
      description: 'Complete a swap from cBTC to USDC',
      completed: false,
    },
  ]

  const tasks = campaignProgress?.tasks || defaultTasks
  const progress = campaignProgress?.progress || 0
  const completedTasks = campaignProgress?.completedTasks || 0
  const totalTasks = campaignProgress?.totalTasks || 3

  return (
    <ContentContainer>
      {/* Campaign Analytics */}
      <CampaignAnalytics />

      {/* Progress Overview */}
      <Section>
        <SectionTitle>Your Campaign Progress</SectionTitle>
        <ProgressBar>
          <ProgressFill style={{ width: `${progress}%` }} />
        </ProgressBar>
        <ProgressText>
          {completedTasks} of {totalTasks} tasks completed ({progress.toFixed(1)}%)
        </ProgressText>
        {isLoading && (
          <Text variant="body3" color="$neutral2">
            Loading campaign progress...
          </Text>
        )}
      </Section>

      {/* Campaign Tasks */}
      <Section>
        <SectionTitle>Campaign Tasks</SectionTitle>
        <Text variant="body2" color="$neutral2">
          Complete all three swap tasks on Citrea Testnet to qualify for campaign rewards.
        </Text>

        {tasks.map((task) => (
          <TaskCard key={task.id}>
            <TaskHeader>
              <TaskInfo>
                <TaskTitle>{task.name}</TaskTitle>
                <TaskDescription>{task.description}</TaskDescription>
                {task.completedAt && (
                  <Text variant="body4" color="$statusSuccess">
                    Completed on {new Date(task.completedAt).toLocaleDateString()}
                  </Text>
                )}
              </TaskInfo>

              <StatusBadge>
                {task.completed ? (
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
            </TaskHeader>

            <ActionButton
              display={task.completed ? 'none' : 'flex'}
              onPress={() => handleTaskAction(task.id, task.completed)}
            >
              <Text variant="buttonLabel4" color="$white">
                Complete Task
              </Text>
              <ExternalLink size="$icon.16" color="$white" />
            </ActionButton>
          </TaskCard>
        ))}
      </Section>

      {/* Instructions */}
      <Section>
        <SectionTitle>How to Participate</SectionTitle>
        <Flex gap="$spacing12">
          <Text variant="body2" color="$neutral2">
            1. Ensure you&apos;re connected to Citrea Testnet
          </Text>
          <Text variant="body2" color="$neutral2">
            2. Have enough cBTC for gas fees
          </Text>
          <Text variant="body2" color="$neutral2">
            3. Complete all three swap tasks using the links above
          </Text>
          <Text variant="body2" color="$neutral2">
            4. Visit ₿apps.citrea.xyz to check your overall campaign progress
          </Text>
        </Flex>
      </Section>
    </ContentContainer>
  )
}
