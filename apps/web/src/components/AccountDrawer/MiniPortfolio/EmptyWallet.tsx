import { useCallback, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Separator, Text, useIsDarkMode } from 'ui/src'
import { CRYPTO_PURCHASE_BACKGROUND_DARK, CRYPTO_PURCHASE_BACKGROUND_LIGHT } from 'ui/src/assets'
import { Buy as BuyIcon } from 'ui/src/components/icons/Buy'
import type { ActionCardItem } from 'uniswap/src/components/misc/ActionCard'
import { ActionCard } from 'uniswap/src/components/misc/ActionCard'
import { ElementName } from 'uniswap/src/features/telemetry/constants'

export const EmptyWallet = ({ handleBuyCryptoClick }: { handleBuyCryptoClick: () => void }) => {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()

  const BackgroundImageWrapperCallback = useCallback(
    ({ children }: { children: React.ReactNode }) => {
      return (
        <BackgroundImage image={isDarkMode ? CRYPTO_PURCHASE_BACKGROUND_DARK : CRYPTO_PURCHASE_BACKGROUND_LIGHT}>
          {children}
        </BackgroundImage>
      )
    },
    [isDarkMode],
  )

  const options: ActionCardItem[] = useMemo(
    () => [
      {
        title: t('home.tokens.empty.action.buy.title'),
        blurb: t('home.tokens.empty.action.buy.description'),
        elementName: ElementName.EmptyStateBuy,
        icon: <BuyIcon color="$accent1" size="$icon.28" />,
        onPress: handleBuyCryptoClick,
        BackgroundImageWrapperCallback,
      },
    ],
    [BackgroundImageWrapperCallback, handleBuyCryptoClick, t],
  )

  return (
    <Flex gap="$spacing20">
      <Separator />
      <Flex>
        <Text variant="subheading2" color="$neutral1">
          <Trans i18nKey="onboarding.welcome.title" />
        </Text>
        <Text variant="body3" color="$neutral2">
          <Trans i18nKey="home.tokens.empty.welcome.description" />
        </Text>
      </Flex>
      <Flex gap="$spacing12">
        {options.map((option) => (
          <ActionCard
            key={option.title}
            {...option}
            leftAlign
            hoverStyle={{
              backgroundColor: '$surface1Hovered',
              borderColor: '$surface3Hovered',
            }}
          />
        ))}
      </Flex>
    </Flex>
  )
}

const BackgroundImage = ({ children, image }: { children: React.ReactNode; image: string }): JSX.Element => {
  return (
    <Flex>
      <img
        src={image}
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          zIndex: -1,
          borderRadius: 24,
          objectFit: 'cover',
          filter: 'blur(2px)',
        }}
      />
      {children}
    </Flex>
  )
}
