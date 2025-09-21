import CitreaLogo from 'assets/images/coins/citrea.png'
import { FeatureFlags } from 'constants/featureFlags'
import { PillButton } from 'pages/Landing/components/cards/PillButton'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { Anchor, Button, Flex, Text, styled, useMedia } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const BitcoinGradient = styled(Flex, {
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(76, 175, 80, 0.1) 50%, rgba(255, 152, 0, 0.1) 100%)',
  borderRadius: '$rounded20',
  pointerEvents: 'none',
})

const TaskList = styled(Flex, {
  gap: '$spacing12',
  width: '100%',
})

const TaskItem = styled(Flex, {
  row: true,
  alignItems: 'center',
  gap: '$spacing12',
  p: '$spacing12',
  backgroundColor: '$surface2',
  borderRadius: '$rounded12',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  hoverStyle: {
    backgroundColor: '$surface3',
    transform: 'translateX(4px)',
  },
})

const TaskNumber = styled(Flex, {
  width: 32,
  height: 32,
  borderRadius: '$rounded8',
  backgroundColor: '$accent1',
  alignItems: 'center',
  justifyContent: 'center',
})

const CAMPAIGN_TASKS = [
  {
    id: 1,
    title: 'Swap cBTC → NUSD',
    description: 'Nectra USD',
    url: 'https://bapp.juiceswap.xyz/swap?chain=citrea_testnet&inputCurrency=NATIVE&outputCurrency=0x9B28B690550522608890C3C7e63c0b4A7eBab9AA&value=0.00001',
  },
  {
    id: 2,
    title: 'Swap cBTC → cUSD',
    description: 'Citrea USD',
    url: 'https://bapp.juiceswap.xyz/swap?chain=citrea_testnet&inputCurrency=NATIVE&outputCurrency=0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0&value=0.00001',
  },
  {
    id: 3,
    title: 'Swap cBTC → USDC',
    description: 'USD Coin',
    url: 'https://bapp.juiceswap.xyz/swap?chain=citrea_testnet&inputCurrency=NATIVE&outputCurrency=0x36c16eaC6B0Ba6c50f494914ff015fCa95B7835F&value=0.00000000001',
  },
]

export function BAppsCard() {
  const { defaultChainId } = useEnabledChains()
  const [showModal, setShowModal] = useState(false)
  const media = useMedia()
  const navigate = useNavigate()

  const handleStartEarning = useCallback(() => {
    if (defaultChainId === UniverseChainId.CitreaTestnet) {
      setShowModal(true)
    } else {
      window.open('https://bapps.citrea.xyz', '_blank', 'noopener,noreferrer')
    }
  }, [defaultChainId])

  const handleTaskClick = useCallback(
    (url: string) => {
      const urlParams = new URL(url)
      const path = urlParams.pathname + urlParams.search
      navigate(path)
      setShowModal(false)
    },
    [navigate],
  )

  if (!FeatureFlags.CITREA_BAPPS_CAMPAIGN || defaultChainId !== UniverseChainId.CitreaTestnet) {
    return null
  }

  return (
    <>
      <Flex
        backgroundColor="$surface1"
        borderRadius="$rounded20"
        p="$spacing24"
        position="relative"
        overflow="hidden"
        width="100%"
      >
        <BitcoinGradient />
        <Flex gap="$spacing12" zIndex={1} width="100%">
          <Flex row gap="$spacing8" alignItems="center">
            <img src={CitreaLogo} alt="Citrea" width={28} height={28} />
            <Text variant="heading3" color="$neutral1">
              Citrea ₿apps Campaign
            </Text>
          </Flex>

          <Text variant="body2" color="$neutral2">
            Complete swaps on JuiceSwap and qualify for the ₿apper Badge NFT
          </Text>

          <Flex gap="$spacing8" width="100%">
            <Text variant="body3" color="$neutral2" fontWeight="$semibold">
              • Earn rewards while trading
            </Text>
            <Text variant="body3" color="$neutral2" fontWeight="$semibold">
              • Contribute to Citrea ecosystem
            </Text>
            <Text variant="body3" color="$neutral2" fontWeight="$semibold">
              • Qualify for future airdrops
            </Text>
          </Flex>

          <Flex row gap="$spacing12" mt="$spacing12">
            <PillButton label="Start Earning" onClick={handleStartEarning} color="$accent1" />
            <PillButton
              label="Learn More"
              onClick={() => window.open('https://bapps.citrea.xyz', '_blank')}
              color="$neutral2"
            />
          </Flex>
        </Flex>
      </Flex>

      <Modal name={ModalName.SwapReview} isModalOpen={showModal} onClose={() => setShowModal(false)}>
        <Flex p="$spacing24" gap="$spacing20" maxWidth={480}>
          <Flex gap="$spacing12">
            <Flex row alignItems="center" gap="$spacing8">
              <img src={CitreaLogo} alt="Citrea" width={24} height={24} />
              <Text variant="heading3">Complete Campaign Tasks</Text>
            </Flex>
            <Text variant="body3" color="$neutral2">
              Complete these 3 swaps to qualify for rewards
            </Text>
          </Flex>

          <TaskList>
            {CAMPAIGN_TASKS.map((task) => (
              <TaskItem key={task.id} onPress={() => handleTaskClick(task.url)}>
                <TaskNumber>
                  <Text variant="buttonLabel4" color="white">
                    {task.id}
                  </Text>
                </TaskNumber>
                <Flex flex={1} gap="$spacing4">
                  <Text variant="body2" fontWeight="$semibold">
                    {task.title}
                  </Text>
                  <Text variant="body4" color="$neutral2">
                    {task.description}
                  </Text>
                </Flex>
                <Text variant="body3" color="$accent1">
                  →
                </Text>
              </TaskItem>
            ))}
          </TaskList>

          <Flex gap="$spacing8" pt="$spacing8">
            <Text variant="body4" color="$neutral2">
              <strong>Note:</strong> Make sure you&apos;re connected to Citrea Testnet
            </Text>
            <Anchor
              href="https://github.com/JuiceSwapxyz/bapp/blob/main/docs/campaigns/citrea-bapps-user-guide.md"
              target="_blank"
              rel="noopener noreferrer"
              textDecorationLine="underline"
            >
              <Text variant="body4" color="$accent1">
                View detailed guide →
              </Text>
            </Anchor>
          </Flex>

          <Button size="large" emphasis="tertiary" onPress={() => setShowModal(false)} width="100%">
            Close
          </Button>
        </Flex>
      </Modal>
    </>
  )
}
