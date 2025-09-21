import { ColumnCenter } from 'components/deprecated/Column'
import { FeatureFlags } from 'constants/featureFlags'
import { useCurrency } from 'hooks/Tokens'
import { useScroll } from 'hooks/useScroll'
import { Hover, RiseIn, RiseInText } from 'pages/Landing/components/animations'
import { Swap } from 'pages/Swap'
import { Fragment, useCallback, useMemo } from 'react'
import { ChevronDown } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { serializeSwapStateToURLParameters } from 'state/swap/hooks'
import { Flex, Text, useMedia } from 'ui/src'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SwapRedirectFn } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'

interface HeroProps {
  scrollToRef: () => void
  transition?: boolean
}

export function Hero({ scrollToRef, transition }: HeroProps) {
  const media = useMedia()
  const { height: scrollPosition } = useScroll({ enabled: !media.sm })
  const { defaultChainId } = useEnabledChains()
  const showBAppsContent = FeatureFlags.CITREA_BAPPS_CAMPAIGN && defaultChainId === UniverseChainId.CitreaTestnet
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
    return t('hero.swap.title')
      .split(/(<br\/>)|\s+/)
      .filter(Boolean) // splits the string by spaces but also captures "<br/>" as a separate element in the array
      .map((word, index) => {
        if (word === '<br/>') {
          return <br key={`${index}-${word}-br`} />
        } else {
          return (
            <Fragment key={`${index}-${word}`}>
              <RiseInText delay={index * 0.1}>{word}</RiseInText>{' '}
            </Fragment>
          )
        }
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
        <Flex maxWidth={920} alignItems="center" pointerEvents="none">
          <Text
            variant="heading1"
            fontSize={48}
            lineHeight={56}
            textAlign="center"
            fontWeight="$book"
            $md={{ fontSize: 40 }}
            $sm={{ variant: 'heading2', fontSize: 32 }}
            $short={{ variant: 'heading2', fontSize: 32 }}
          >
            {renderRiseInText}
          </Text>
        </Flex>

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


        <RiseIn delay={0.3}>
          <Text variant="body1" textAlign="center" maxWidth={430} color="$neutral2" $short={{ variant: 'body2' }}>
            <Trans i18nKey="hero.subtitle" />
          </Text>
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
          style={{ transform: `translate(0px, ${translateY}px)`, opacity: opacityY }}
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
