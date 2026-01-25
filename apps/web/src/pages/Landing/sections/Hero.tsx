import { ColumnCenter } from 'components/deprecated/Column'
import { useCurrency } from 'hooks/Tokens'
import { useCrossChainSwapsEnabled } from 'hooks/useCrossChainSwapsEnabled'
import { useScroll } from 'hooks/useScroll'
import { COIN_BUBBLE_ASSETS, CoinBubble } from 'pages/Landing/components/CoinBubble'
import { Hover, RiseIn, RiseInText } from 'pages/Landing/components/animations'
import { Swap } from 'pages/Swap'
import { Fragment, useCallback, useMemo } from 'react'
import { ChevronDown } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useIsBAppsCampaignVisible } from 'services/bappsCampaign/hooks'
import { serializeSwapStateToURLParameters } from 'state/swap/hooks'
import { Flex, Text, styled, useMedia } from 'ui/src'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { JUSD_ADDRESSES } from 'uniswap/src/features/tokens/jusdAbstraction'
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
  overflow: 'visible',

  $lg: {
    display: 'none',
  },
})

// Individual bubble position wrapper
const BubblePosition = styled(Flex, {
  name: 'BubblePosition',
  position: 'absolute',
  pointerEvents: 'auto',

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
  const isCrossChainSwapsEnabled = useCrossChainSwapsEnabled()

  // Use native token (cBTC on Citrea) as default input currency
  const initialInputCurrency = useCurrency({
    address: getNativeAddress(defaultChainId),
    chainId: defaultChainId,
  })

  // Use JUSD as default output currency
  const initialOutputCurrency = useCurrency({
    address: JUSD_ADDRESSES[defaultChainId],
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

  // Click handler for BTC Chain bubble - navigates to cross-chain swap from Bitcoin BTC to Citrea cBTC
  // Chains are auto-inferred: BTC → Bitcoin, cBTC → Citrea
  const handleBtcChainClick = useCallback(() => {
    navigate('/swap?inputCurrency=BTC&outputCurrency=cBTC')
  }, [navigate])

  // Click handler for Lightning bubble - navigates to cross-chain swap from Lightning lnBTC to Citrea cBTC
  // Chains are auto-inferred: lnBTC → Lightning Network, cBTC → Citrea
  const handleLightningClick = useCallback(() => {
    navigate('/swap?inputCurrency=lnBTC&outputCurrency=cBTC')
  }, [navigate])

  // Click handler for Tether bubble (no badge) - navigates to cross-chain swap from Ethereum USDT to Citrea JUSD
  const handleTetherClick = useCallback(() => {
    navigate('/swap?chain=ethereum&inputCurrency=USDT&outputCurrency=JUSD&outputChain=citrea')
  }, [navigate])

  // Click handler for Tether+Polygon bubble - navigates to cross-chain swap from Polygon USDT to Citrea JUSD
  const handleTetherPolygonClick = useCallback(() => {
    navigate('/swap?chain=polygon&inputCurrency=USDT&outputCurrency=JUSD&outputChain=citrea')
  }, [navigate])

  // Click handler for USDC bubble - navigates to cross-chain swap from Ethereum USDC to Citrea JUSD
  const handleUsdcClick = useCallback(() => {
    navigate('/swap?chain=ethereum&inputCurrency=USDC&outputCurrency=JUSD&outputChain=citrea')
  }, [navigate])

  // Click handler for wBTC+ETH bubble - navigates to cross-chain swap from Ethereum wBTC to Citrea WBTC.e (via L0 bridge)
  const handleWbtcEthClick = useCallback(() => {
    navigate('/swap?chain=ethereum&inputCurrency=WBTC&outputCurrency=WBTC.e&outputChain=citrea')
  }, [navigate])

  // Click handler for cBTC bubble - navigates to cross-chain swap from Bitcoin BTC to Citrea cBTC
  const handleCbtcClick = useCallback(() => {
    navigate('/swap?inputCurrency=BTC&outputCurrency=cBTC')
  }, [navigate])

  // Click handler for JUICE bubble - navigates to swap cBTC to JUICE on Citrea
  const handleJuiceClick = useCallback(() => {
    navigate('/swap?chain=citrea&inputCurrency=cBTC&outputCurrency=JUICE')
  }, [navigate])

  // Click handler for JUSD bubble - navigates to swap cBTC to JUSD on Citrea
  const handleJusdClick = useCallback(() => {
    navigate('/swap?chain=citrea&inputCurrency=cBTC&outputCurrency=JUSD')
  }, [navigate])

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

      {/* Floating Coin Bubbles - only shown when cross-chain swaps are enabled */}
      {isCrossChainSwapsEnabled && (
        <CoinBubblesContainer>
          {/* Above the wave - 6 bubbles (positions and sizes match Figma) */}
          <BubblePosition left="6.7%" top={-78} delay={0}>
            <CoinBubble
              src={COIN_BUBBLE_ASSETS.btcChain}
              alt="Bitcoin Chain"
              size={170}
              onClick={handleBtcChainClick}
            />
          </BubblePosition>
          <BubblePosition left="13.5%" top={-112} delay={2}>
            <CoinBubble
              src={COIN_BUBBLE_ASSETS.btcLightning}
              alt="Bitcoin Lightning"
              size={55}
              onClick={handleLightningClick}
            />
          </BubblePosition>
          <BubblePosition right="10.2%" top={-104} delay={1}>
            <CoinBubble
              src={COIN_BUBBLE_ASSETS.tetherPolygon}
              alt="Tether+Polygon"
              size={65}
              onClick={handleTetherPolygonClick}
            />
          </BubblePosition>
          <BubblePosition left="16.5%" top={-15} delay={3}>
            <CoinBubble src={COIN_BUBBLE_ASSETS.wbtcEth} alt="wBTC+ETH" size={80} onClick={handleWbtcEthClick} />
          </BubblePosition>
          <BubblePosition right="16.8%" top={-38} delay={4}>
            <CoinBubble src={COIN_BUBBLE_ASSETS.tetherEth} alt="Tether+ETH" size={120} onClick={handleTetherClick} />
          </BubblePosition>
          <BubblePosition right="5.8%" top={-35} delay={5}>
            <CoinBubble src={COIN_BUBBLE_ASSETS.usdc} alt="USDC" size={55} onClick={handleUsdcClick} />
          </BubblePosition>

          {/* Inside the wave - 4 bubbles */}
          <BubblePosition left="11.9%" top={178} delay={0}>
            <CoinBubble
              src={COIN_BUBBLE_ASSETS.waveBtcLarge}
              alt="cBTC"
              size={120}
              variant="wave"
              onClick={handleCbtcClick}
            />
          </BubblePosition>
          <BubblePosition left="23.1%" top={317} delay={2}>
            <CoinBubble
              src={COIN_BUBBLE_ASSETS.waveWbtcCitrea}
              alt="wBTC+Citrea"
              size={70}
              variant="wave"
              onClick={handleWbtcEthClick}
            />
          </BubblePosition>
          <BubblePosition right="21.3%" top={237} delay={5}>
            <CoinBubble
              src={COIN_BUBBLE_ASSETS.waveJuice}
              alt="Juice"
              size={80}
              variant="wave"
              onClick={handleJuiceClick}
            />
          </BubblePosition>
          <BubblePosition right="9.9%" top={129} delay={1}>
            <CoinBubble
              src={COIN_BUBBLE_ASSETS.waveUsdLarge}
              alt="JUSD"
              size={109}
              variant="wave"
              onClick={handleJusdClick}
            />
          </BubblePosition>
        </CoinBubblesContainer>
      )}

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
