import citreaLogo from 'assets/images/coins/citrea.png'
import { FeatureFlags } from 'constants/featureFlags'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { X } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Anchor, Flex, Text, styled, useMedia } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const hideCitreaBAppsBannerAtom = atomWithStorage<boolean>('hideCitreaBAppsBanner', false)

const Wrapper = styled(Flex, {
  height: 64,
  width: '100%',
  background: 'linear-gradient(135deg, #FF6B35 0%, #4CAF50 50%, #FF9800 100%)',
  pl: '$spacing12',
  pr: '$spacing16',
  zIndex: '$sticky',
  row: true,
  justifyContent: 'space-between',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
  $md: {
    height: 72,
    pl: '$spacing16',
  },
})

const ContentWrapper = styled(Flex, {
  row: true,
  alignItems: 'center',
  gap: '$spacing12',
  flex: 1,
  $md: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '$spacing8',
  },
})

const CitreaIcon = styled(Flex, {
  width: 32,
  height: 32,
  borderRadius: '$rounded8',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  $md: {
    width: 28,
    height: 28,
  },
})

const CTAButton = styled(Anchor, {
  height: '$spacing36',
  background: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '$rounded20',
  px: '$spacing16',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  whiteSpace: 'nowrap',
  textDecorationLine: 'none',
  transition: 'all 0.2s ease',
  hoverStyle: {
    background: 'rgba(255, 255, 255, 1)',
    transform: 'translateY(-1px)',
  },
  $md: {
    height: '$spacing32',
    px: '$spacing12',
  },
})

const CloseButton = styled(Flex, {
  cursor: 'pointer',
  opacity: 0.8,
  transition: 'opacity 0.2s ease',
  hoverStyle: {
    opacity: 1,
  },
})

const PulseAnimation = styled(Flex, {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 200,
  height: 200,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
  pointerEvents: 'none',
})

export function useCitreaBAppsBannerEligible(): boolean {
  const { defaultChainId } = useEnabledChains()
  const [hideBanner] = useAtom(hideCitreaBAppsBannerAtom)

  return (
    FeatureFlags.CITREA_BAPPS_CAMPAIGN &&
    !hideBanner &&
    defaultChainId === UniverseChainId.CitreaTestnet
  )
}

export function CitreaBAppsBanner() {
  const { t } = useTranslation()
  const [, setHideBanner] = useAtom(hideCitreaBAppsBannerAtom)
  const media = useMedia()

  const handleClose = () => {
    setHideBanner(true)
  }

  return (
    <Wrapper>
      <PulseAnimation />
      <ContentWrapper>
        <Flex row gap="$spacing12" alignItems="center">
          <CitreaIcon>
            <img src={citreaLogo} alt="Citrea" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </CitreaIcon>
          <Flex shrink gap="$spacing4">
            <Text variant="body2" color="white" fontWeight="$semibold" $md={{ variant: 'body3' }}>
              {media.md ? '₿apps Campaign Live!' : 'Citrea ₿apps Campaign is Live!'}
            </Text>
            <Text variant="body3" color="rgba(255, 255, 255, 0.9)" $md={{ display: 'none' }}>
              {t('Complete swaps on JuiceSwap to earn rewards and qualify for the ₿apper Badge')}
            </Text>
          </Flex>
        </Flex>
      </ContentWrapper>

      <Flex row gap="$spacing12" alignItems="center">
        <CTAButton href="https://bapps.citrea.xyz" target="_blank" rel="noopener noreferrer">
          <Text variant="buttonLabel3" color="#FF6B35" fontWeight="$bold">
            {media.md ? 'Join' : 'Join Campaign'}
          </Text>
        </CTAButton>
        <CloseButton data-testid="citrea-bapps-banner-close" onPress={handleClose}>
          <X size={20} color="white" />
        </CloseButton>
      </Flex>
    </Wrapper>
  )
}
