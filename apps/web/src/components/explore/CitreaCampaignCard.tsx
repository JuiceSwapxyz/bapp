import CitreaLogo from 'assets/images/coins/citrea.png'
import { FeatureFlags } from 'constants/featureFlags'
import { PillButton } from 'pages/Landing/components/cards/PillButton'
import { useEffect, useState } from 'react'
import { Flex, Text, styled } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const CampaignCard = styled(Flex, {
  backgroundColor: '$surface2',
  borderRadius: '$rounded32',
  p: '$spacing48',
  gap: '$spacing8',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  width: '100%',
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: 'auto',
  minHeight: 240,
  maxWidth: 'calc(50% - 8px)',
  position: 'relative',
  overflow: 'hidden',
  $xl: {
    p: '$spacing32',
  },
  $lg: {
    maxWidth: '100%',
  },
  $xs: {
    p: '$spacing20',
  },
  hoverStyle: {
    transform: 'translateY(-2px)',
  },
})

const BitcoinGradient = styled(Flex, {
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(135deg, rgba(255, 107, 53, 0.08) 0%, rgba(76, 175, 80, 0.08) 50%, rgba(255, 152, 0, 0.08) 100%)',
  pointerEvents: 'none',
})

const TimerText = styled(Text, {
  fontWeight: '$semibold',
})

function calculateTimeRemaining() {
  try {
    // Campaign end date - adjust this as needed
    const campaignEndDate = new Date('2025-12-31T23:59:59Z')
    const now = new Date()
    const difference = campaignEndDate.getTime() - now.getTime()

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0 }
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24))
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))

    return { days, hours, minutes }
  } catch {
    // Return zeros if there's any error with date calculation
    return { days: 0, hours: 0, minutes: 0 }
  }
}

export function CitreaCampaignCard() {
  const { defaultChainId } = useEnabledChains()
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!FeatureFlags.CITREA_BAPPS_CAMPAIGN || defaultChainId !== UniverseChainId.CitreaTestnet) {
    return null
  }

  const handleClick = () => {
    window.open('https://bapps.citrea.xyz', '_blank', 'noopener,noreferrer')
  }

  return (
    <CampaignCard onPress={handleClick} flexDirection="column" justifyContent="space-between">
      <BitcoinGradient />
      <Flex gap="$spacing12" zIndex={1}>
        <Flex row gap="$spacing8" alignItems="center">
          <img src={CitreaLogo} alt="Citrea" width={32} height={32} />
          <Text variant="heading3" color="$neutral1">
            Citrea ₿apps Campaign
          </Text>
        </Flex>

        <Text variant="body2" color="$neutral2">
          Earn rewards and qualify for the ₿apper Badge NFT
        </Text>

        <Flex flexDirection="column" gap="$spacing4" mt="$spacing12">
          <Text variant="body3" color="$neutral2">
            Campaign ends in:
          </Text>
          <TimerText variant="heading2" fontSize={32} color="#FF9800">
            {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
          </TimerText>
        </Flex>
      </Flex>

      <Flex alignSelf="flex-start" zIndex={1}>
        <PillButton backgroundColor="$surface1" color="#FF9800" label="Join now" />
      </Flex>
    </CampaignCard>
  )
}
