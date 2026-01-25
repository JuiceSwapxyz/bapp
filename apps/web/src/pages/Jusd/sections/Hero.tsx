import { ChevronDown } from 'react-feather'
import { Trans } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, Text, styled } from 'ui/src'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'

const HeroContainer = styled(Flex, {
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: `calc(80vh - ${INTERFACE_NAV_HEIGHT}px)`,
  gap: '$spacing24',
  paddingTop: INTERFACE_NAV_HEIGHT,
  paddingBottom: '$spacing48',
})

const LogoContainer = styled(Flex, {
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '$spacing16',
})

const GradientTitle = styled(
  Text as any,
  {
    fontSize: 56,
    lineHeight: 70,
    fontWeight: 'bold',
    textAlign: 'center',

    '$platform-web': {
      color: 'transparent',
      backgroundImage: 'linear-gradient(90deg, #4A90D9 0%, #63C87A 50%, #FFB347 100%)',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '100% 100%',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      display: 'inline-block',
      overflow: 'visible',
      paddingBottom: 4,
    },

    $md: {
      fontSize: 42,
      lineHeight: 52,
    },
    $sm: {
      fontSize: 32,
      lineHeight: 40,
    },
  } as any,
) as any

const CTAButton = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing8',
  paddingHorizontal: '$spacing24',
  paddingVertical: '$spacing12',
  backgroundColor: '$accent1',
  borderRadius: '$rounded12',
  cursor: 'pointer',

  hoverStyle: {
    backgroundColor: '$accent2',
  },
})

const SecondaryCTAButton = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing8',
  paddingHorizontal: '$spacing24',
  paddingVertical: '$spacing12',
  backgroundColor: 'transparent',
  borderRadius: '$rounded12',
  borderWidth: 2,
  borderColor: '$accent1',
  cursor: 'pointer',

  hoverStyle: {
    backgroundColor: '$accent1',
  },
})

const ScrollIndicator = styled(Flex, {
  flexDirection: 'column',
  alignItems: 'center',
  gap: '$spacing8',
  marginTop: '$spacing32',
  cursor: 'pointer',
  opacity: 0.7,

  hoverStyle: {
    opacity: 1,
  },
})

const SWAP_JUSD_URL = '/swap?inputCurrency=cBTC&outputCurrency=JUSD'

export function Hero() {
  const navigate = useNavigate()

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' })
  }

  const handleGetJusd = () => {
    navigate(SWAP_JUSD_URL)
  }

  return (
    <HeroContainer>
      <LogoContainer>
        <img src="https://app.testnet.juicedollar.com/coin/jusd.svg" alt="JUSD Stablecoin" width={120} height={120} />
      </LogoContainer>

      <GradientTitle>
        <Trans i18nKey="jusd.hero.title" />
      </GradientTitle>

      <Text variant="subheading1" color="$neutral2" textAlign="center" maxWidth={600}>
        <Trans i18nKey="jusd.hero.tagline" />
      </Text>

      <Text variant="body1" color="$neutral2" textAlign="center" maxWidth={700}>
        <Trans i18nKey="jusd.hero.description" />
      </Text>

      <Flex flexDirection="row" gap="$spacing16" flexWrap="wrap" justifyContent="center">
        <CTAButton onPress={handleGetJusd}>
          <Text variant="buttonLabel3" color="$white">
            <Trans i18nKey="jusd.hero.getJusd" />
          </Text>
        </CTAButton>
        <SecondaryCTAButton onPress={scrollToContent}>
          <Text variant="buttonLabel3" color="$accent1">
            <Trans i18nKey="jusd.hero.learnMore" />
          </Text>
        </SecondaryCTAButton>
      </Flex>

      <ScrollIndicator onPress={scrollToContent}>
        <Text variant="body3" color="$neutral2">
          <Trans i18nKey="jusd.hero.scrollDown" />
        </Text>
        <ChevronDown size={20} color="var(--neutral2)" />
      </ScrollIndicator>
    </HeroContainer>
  )
}
