import { FeatureFlags } from 'constants/featureFlags'
import { useEffect, useState } from 'react'
import { Flex, Text, styled } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const CampaignCard = styled(Flex, {
  backgroundColor: '$surface1',
  borderRadius: '$rounded20',
  p: '$spacing16',
  gap: '$spacing8',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$surface3',
  maxWidth: 280,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  hoverStyle: {
    borderColor: '#FF9800',
    transform: 'translateY(-2px)',
  },
})

const TimerText = styled(Text, {
  fontVariantNumeric: 'tabular-nums',
  fontWeight: '$semibold',
})

function calculateTimeRemaining() {
  // Campaign end date - adjust this as needed
  const campaignEndDate = new Date('2025-02-28T23:59:59Z')
  const now = new Date()
  const difference = campaignEndDate.getTime() - now.getTime()

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0 }
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24))
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))

  return { days, hours, minutes }
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

  if (!FeatureFlags.CITREA_BAPPS_CAMPAIGN || defaultChainId !== UniverseChainId.CitreaTestnet) {
    return null
  }

  const handleClick = () => {
    window.open('https://bapps.citrea.xyz', '_blank', 'noopener,noreferrer')
  }

  return (
    <CampaignCard onPress={handleClick}>
      <Flex row gap="$spacing8" alignItems="center">
        <Text fontSize={20}>₿</Text>
        <Text variant="body2" fontWeight="$semibold" color="$neutral1">
          Citrea ₿apps Campaign
        </Text>
      </Flex>

      <Flex gap="$spacing4">
        <Text variant="body3" color="$neutral2">
          Campaign ends in:
        </Text>
        <TimerText variant="body2" color="#FF9800">
          {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
        </TimerText>
      </Flex>

      <Flex row gap="$spacing8" alignItems="center">
        <Text variant="body3" color="$accent1">
          Join now →
        </Text>
      </Flex>
    </CampaignCard>
  )
}