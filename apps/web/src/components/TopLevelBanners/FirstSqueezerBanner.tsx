import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { X } from 'react-feather'
import { useNavigate } from 'react-router'
import {
  useIsFirstSqueezerCampaignEnded,
  useIsFirstSqueezerCampaignVisible,
} from 'services/firstSqueezerCampaign/hooks'
import { Anchor, Flex, Text, styled, useMedia } from 'ui/src'

const hideFirstSqueezerBannerAtom = atomWithStorage<boolean>('hideFirstSqueezerBanner', false)

const Wrapper = styled(Flex, {
  height: 64,
  width: '100%',
  background: 'linear-gradient(135deg, #FF9800 0%, #4CAF50 50%, #2196F3 100%)',
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

const NFTIcon = styled(Flex, {
  width: 40,
  height: 40,
  borderRadius: '$rounded12',
  backgroundColor: 'rgba(255, 255, 255, 0.25)',
  alignItems: 'center',
  justifyContent: 'center',
  $md: {
    width: 36,
    height: 36,
  },
})

const NFTEmoji = styled(Text, {
  fontSize: 24,
  lineHeight: 24,
  $md: {
    fontSize: 20,
    lineHeight: 20,
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
  cursor: 'pointer',
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

const GlowAnimation = styled(Flex, {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 300,
  height: 300,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
  pointerEvents: 'none',
})

export function useFirstSqueezerBannerEligible(): boolean {
  const [hideBanner] = useAtom(hideFirstSqueezerBannerAtom)
  const isCampaignVisible = useIsFirstSqueezerCampaignVisible()
  const isCampaignEnded = useIsFirstSqueezerCampaignEnded()

  // Banner should never show after campaign ends, even with URL override
  return isCampaignVisible && !hideBanner && !isCampaignEnded
}

export function FirstSqueezerBanner() {
  const [, setHideBanner] = useAtom(hideFirstSqueezerBannerAtom)
  const media = useMedia()
  const navigate = useNavigate()

  const handleClose = () => {
    setHideBanner(true)
  }

  const handleCTAClick = () => {
    navigate('/first-squeezer')
  }

  return (
    <Wrapper>
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 0.3;
              transform: translate(-50%, -50%) scale(1);
            }
            50% {
              opacity: 0.5;
              transform: translate(-50%, -50%) scale(1.1);
            }
          }
        `}
      </style>
      <GlowAnimation style={{ animation: 'pulse 3s ease-in-out infinite' }} />
      <ContentWrapper>
        <Flex row gap="$spacing12" alignItems="center">
          <NFTIcon>
            <NFTEmoji>🍋</NFTEmoji>
          </NFTIcon>
          <Flex shrink gap="$spacing4">
            <Text variant="body2" color="white" fontWeight="$semibold" $md={{ variant: 'body3' }}>
              {media.md ? 'Get First Squeezer NFT! 🎁' : 'Earn Your First Squeezer NFT! 🎁'}
            </Text>
            <Text variant="body3" color="rgba(255, 255, 255, 0.9)" $md={{ display: 'none' }}>
              Complete 3 simple tasks to claim your exclusive NFT
            </Text>
          </Flex>
        </Flex>
      </ContentWrapper>

      <Flex row gap="$spacing12" alignItems="center">
        <CTAButton onPress={handleCTAClick}>
          <Text variant="buttonLabel3" color="#FF9800" fontWeight="$bold">
            {media.md ? 'Claim' : 'Claim NFT'}
          </Text>
        </CTAButton>
        <CloseButton data-testid="first-squeezer-banner-close" onPress={handleClose}>
          <X size={20} color="white" />
        </CloseButton>
      </Flex>
    </Wrapper>
  )
}
