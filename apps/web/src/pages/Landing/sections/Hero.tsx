import { ColumnCenter } from 'components/deprecated/Column'
import { useCurrency } from 'hooks/Tokens'
import { useScroll } from 'hooks/useScroll'
import { Hover, RiseIn, RiseInText } from 'pages/Landing/components/animations'
import { CoinBubble, COIN_BUBBLE_ASSETS } from 'pages/Landing/components/CoinBubble'
import { Swap } from 'pages/Swap'
import { Fragment, useCallback, useMemo } from 'react'
import { ChevronDown } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useIsBAppsCampaignVisible } from 'services/bappsCampaign/hooks'
import { serializeSwapStateToURLParameters } from 'state/swap/hooks'
import { Flex, Text, styled, useMedia } from 'ui/src'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SwapRedirectFn } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'

interface HeroProps {
  scrollToRef: () => void
  transition?: boolean
}

// Gradient + font live here; backgroundSize/backgroundPosition come from props.
const HeroGradientTitle = styled(
  Text as any,
  {
    name: 'HeroGradientTitle',

    // heading sizing
    fontSize: 48,
    lineHeight: 85,

    $md: {
      fontSize: 40,
    },
    $sm: {
      fontSize: 32,
    },
    $short: {
      fontSize: 32,
    },

    // web-only visual styles
    '$platform-web': {
      fontFamily: '"Pacifico", sans-serif',
      color: 'transparent',
      backgroundImage: 'linear-gradient(90deg, #63C87A 0%, #FFB347 50%, #FF7C3A 100%)',
      backgroundRepeat: 'no-repeat',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      display: 'inline-block',
    },
  } as any,
) as any

const HeroBackground = styled(Flex, {
  name: 'HeroBackground',
  position: 'absolute',
  top: 472,
  left: 0,
  right: 0,
  height: 529,
  zIndex: -1,
  pointerEvents: 'none',

  '$platform-web': {
    backgroundImage: `url(/images/landing_page/LandingHero-bg.svg)`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: 'top center',
    height: 'min(529px, 80vh)',
  },
} as const)

// Floating coin bubble container
const CoinBubblesContainer = styled(Flex, {
  name: 'CoinBubblesContainer',
  position: 'absolute',
  top: 300,
  left: 0,
  right: 0,
  height: 700,
  zIndex: 0,
  pointerEvents: 'none',
  overflow: 'visible',

  $md: {
    display: 'none',
  },
})

// Individual bubble position wrapper
const BubblePosition = styled(Flex, {
  name: 'BubblePosition',
  position: 'absolute',

  '$platform-web': {
    animation: 'float 6s ease-in-out infinite',
  },

  variants: {
    delay: {
      0: { '$platform-web': { animationDelay: '0s' } },
      1: { '$platform-web': { animationDelay: '1s' } },
      2: { '$platform-web': { animationDelay: '2s' } },
      3: { '$platform-web': { animationDelay: '3s' } },
      4: { '$platform-web': { animationDelay: '4s' } },
      5: { '$platform-web': { animationDelay: '5s' } },
    },
  } as const,
})

export function Hero({ scrollToRef, transition }: HeroProps) {
  const media = useMedia()
  const { height: scrollPosition } = useScroll({ enabled: !media.sm })
  const { defaultChainId } = useEnabledChains()
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const showBAppsContent = useIsBAppsCampaignVisible()

  // Use native token (cBTC on Citrea) as default input currency
  const initialInputCurrency = useCurrency({
    address: 'ETH', // This will get the native token for any chain
    chainId: defaultChainId,
  })

  // Use cUSD as default output currency for Citrea and Sepolia
  const initialOutputCurrency = useCurrency({
    address:
      defaultChainId === UniverseChainId.CitreaTestnet || defaultChainId === UniverseChainId.Sepolia
        ? '0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0' // cUSD
        : undefined,
    chainId: defaultChainId,
  })

  const navigate = useNavigate()
  const { t } = useTranslation()

  const { translateY, opacityY } = useMemo(
    () => ({
      translateY: !media.sm ? -scrollPosition / 7 : 0,
      opacityY: !media.sm ? 1 - scrollPosition / 1000 : 1,
    }),
    [media.sm, scrollPosition],
  )

  const swapRedirectCallback = useCallback(
    ({ inputCurrency, outputCurrency, typedValue, independentField, chainId }: Parameters<SwapRedirectFn>[0]) => {
      navigate(
        `/swap${serializeSwapStateToURLParameters({
          inputCurrency,
          outputCurrency,
          typedValue,
          independentField,
          chainId,
        })}`,
      )
    },
    [navigate],
  )

  const renderRiseInText = useMemo(() => {
    const text = t('hero.swap.title')

    // Split on spaces only
    const words = text.split(/\s+/).filter(Boolean)
    const totalWords = words.length || 1

    return words.map((word, i) => {
      const backgroundSize = `${totalWords * 100}% 100%`
      const backgroundPosition = totalWords === 1 ? '0 0' : `${(i / (totalWords - 1)) * 100}% 0`

      const trailingSpace = i < totalWords - 1 ? '\u00A0' : ''

      return (
        <Fragment key={`${i}-${word}`}>
          <RiseInText as="span" delay={i * 0.1}>
            <HeroGradientTitle as="span" backgroundSize={backgroundSize} backgroundPosition={backgroundPosition}>
              {word}
              {trailingSpace}
            </HeroGradientTitle>
          </RiseInText>
        </Fragment>
      )
    })
  }, [t])

  return (
    <Flex
      position="relative"
      justifyContent="center"
      y={translateY}
      opacity={opacityY}
      minWidth="100%"
      minHeight="90vh"
      height="min-content"
      pt={INTERFACE_NAV_HEIGHT}
      pointerEvents="none"
    >
      <HeroBackground />

      {/* Floating Coin Bubbles */}
      <CoinBubblesContainer>
        {/* Above the wave */}
        <BubblePosition left="5.7%" top={-78} delay={0}>
          <CoinBubble src={COIN_BUBBLE_ASSETS.btcChain} alt="Bitcoin Chain" size={90} />
        </BubblePosition>
        <BubblePosition left="16%" top={-112} delay={2}>
          <CoinBubble src={COIN_BUBBLE_ASSETS.btcLightning} alt="Bitcoin Lightning" size={65} />
        </BubblePosition>
        <BubblePosition left="19.4%" top={-16} delay={3}>
          <CoinBubble src={COIN_BUBBLE_ASSETS.wbtcEth} alt="WBTC+ETH" size={73} />
        </BubblePosition>
        <BubblePosition right="13.2%" top={-105} delay={1}>
          <CoinBubble src={COIN_BUBBLE_ASSETS.tetherPolygon} alt="Tether+Polygon" size={75} />
        </BubblePosition>
        <BubblePosition right="20.8%" top={-38} delay={4}>
          <CoinBubble src={COIN_BUBBLE_ASSETS.tetherEth} alt="Tether+ETH" size={79} />
        </BubblePosition>
        <BubblePosition right="6.2%" top={-35} delay={5}>
          <CoinBubble src={COIN_BUBBLE_ASSETS.usdc} alt="USDC" size={66} />
        </BubblePosition>

        {/* Inside the wave */}
        <BubblePosition left="11.9%" top={178} delay={0}>
          <CoinBubble src={COIN_BUBBLE_ASSETS.waveBtcLarge} alt="Bitcoin" size={120} />
        </BubblePosition>
        <BubblePosition left="8.5%" top={325} delay={4}>
          <CoinBubble src={COIN_BUBBLE_ASSETS.waveBtcSmall} alt="Bitcoin" size={70} />
        </BubblePosition>
        <BubblePosition left="23%" top={317} delay={3}>
          <CoinBubble src={COIN_BUBBLE_ASSETS.waveWbtcCitrea} alt="WBTC+Citrea" size={70} />
        </BubblePosition>
        <BubblePosition right="21.3%" top={237} delay={2}>
          <CoinBubble src={COIN_BUBBLE_ASSETS.waveJuice} alt="Juice" size={80} />
        </BubblePosition>
        <BubblePosition right="5.8%" top={271} delay={3}>
          <CoinBubble src={COIN_BUBBLE_ASSETS.waveUsdSmall} alt="USD" size={80} />
        </BubblePosition>
        <BubblePosition right="9.9%" top={129} delay={1}>
          <CoinBubble src={COIN_BUBBLE_ASSETS.waveUsdLarge} alt="USD" size={109} />
        </BubblePosition>
      </CoinBubblesContainer>

      <Flex
        alignSelf="center"
        maxWidth="85vw"
        pointerEvents="none"
        pt={48}
        gap="$gap20"
        transform={`translate(0px, ${translateY}px)`}
        opacity={opacityY}
        $lg={{ pt: 24 }}
        $sm={{ pt: 8 }}
        $platform-web={{
          transition: transition ? 'shrinkAndFade 1s ease-in-out forwards' : undefined,
        }}
      >
        {/* Title */}
        <Flex maxWidth={920} alignItems="center" pointerEvents="none">
          <Text textAlign="center" overflow="visible">
            {renderRiseInText}
          </Text>
        </Flex>

        {/* Subtitle */}
        <RiseIn delay={0.2}>
          <Flex maxWidth={920} alignItems="center" pointerEvents="none">
            <Text
              variant="heading2"
              fontSize={16}
              lineHeight={22}
              textAlign="center"
              fontWeight="$book"
              $md={{ fontSize: 14 }}
              $sm={{ variant: 'heading2', fontSize: 12 }}
              $short={{ variant: 'heading2', fontSize: 12 }}
            >
              <Trans i18nKey="hero.swap.subtitle" />
            </Text>
          </Flex>
        </RiseIn>

        {/* Swap card */}
        <RiseIn delay={0.4}>
          <Flex
            pointerEvents="auto"
            width={480}
            p="$padding8"
            borderRadius="$rounded24"
            backgroundColor="$surface1"
            maxWidth="100%"
            enterStyle={{ opacity: 0 }}
          >
            <Swap
              hideHeader
              hideFooter
              syncTabToUrl={false}
              chainId={defaultChainId}
              initialInputCurrency={initialInputCurrency}
              initialOutputCurrency={initialOutputCurrency}
              swapRedirectCallback={swapRedirectCallback}
              usePersistedFilteredChainIds
            />
          </Flex>
        </RiseIn>

        {/* Secondary subtitle */}
        <RiseIn delay={0.3}>
          <Flex
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            pointerEvents="none"
            gap="$gap4"
            mt={4}
          >
            <Text variant="body2" color="$neutral2">
              <Trans i18nKey="hero.subtitle" />
            </Text>
            <img src="/images/logos/Citrea_Full_Logo.svg" alt="Citrea Logo" width={200} height="auto" />
          </Flex>
        </RiseIn>
      </Flex>

      <Flex flex={1} />

      {!showBAppsContent && (
        <Flex
          position="absolute"
          width="100%"
          centered
          pointerEvents="none"
          bottom={48}
          style={{ transform: `translate(0px, ${translateY}px), opacity: ${opacityY}` }}
          $lgHeight={{ display: 'none' }}
        >
          <RiseIn delay={0.3}>
            <Flex
              alignItems="center"
              justifyContent="flex-start"
              onPress={() => scrollToRef()}
              cursor="pointer"
              width={500}
            >
              <Hover>
                <ColumnCenter>
                  <Text variant="body2">
                    <Trans i18nKey="hero.scroll" />
                  </Text>
                  <ChevronDown />
                </ColumnCenter>
              </Hover>
            </Flex>
          </RiseIn>
        </Flex>
      )}
    </Flex>
  )
}
