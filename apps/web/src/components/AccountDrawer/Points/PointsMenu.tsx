import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import {
  MIN_LIQUIDITY_USD,
  POINTS_BRAND_COLOR,
  POINTS_PER_LIQUIDITY_DAY,
  POINTS_PER_SWAP,
  POINTS_TICKER,
} from 'components/AccountDrawer/Points/constants'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import {
  LIQUID_BUBBLE_CLASS,
  LiquidBg,
  LiquidBubbleStyleTag,
  bubbleTextStyle,
} from 'components/AccountDrawer/Points/styles'
import { usePoints } from 'components/AccountDrawer/Points/usePoints'
import { ArrowUpRight, Award } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, Text, styled } from 'ui/src'
import { LiquidityProvisionCoins } from 'ui/src/components/icons/LiquidityProvisionCoins'
import { SwapCoin } from 'ui/src/components/icons/SwapCoin'

const HeroCard = styled(Flex, {
  position: 'relative',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$spacing12',
  borderRadius: '$rounded24',
  px: '$padding24',
  py: '$padding32',
  minHeight: 220,
  overflow: 'hidden',
  background: 'linear-gradient(180deg, #1a1208 0%, #0a0604 100%)',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '#3a2814',
})

const HERO_BUBBLE_STYLE = bubbleTextStyle(68)

const HERO_LABEL_STYLE: React.CSSProperties = {
  letterSpacing: 2,
  textTransform: 'uppercase',
  fontSize: 11,
  fontWeight: 600,
  color: '#F2C998',
  margin: 0,
  width: '100%',
  textAlign: 'center',
  display: 'block',
}

const SectionTitle = styled(Text, {
  variant: 'body4',
  color: '$neutral2',
  letterSpacing: 1.5,
  textTransform: 'uppercase',
})

const StatsRow = styled(Flex, {
  row: true,
  gap: '$spacing8',
  width: '100%',
})

const StatCard = styled(Flex, {
  flex: 1,
  gap: '$spacing12',
  borderRadius: '$rounded16',
  backgroundColor: '$surface2',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$surface3',
  p: '$padding16',
})

const IconBadge = styled(Flex, {
  width: 32,
  height: 32,
  borderRadius: '$roundedFull',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(247,145,26,0.15)',
})

const LeaderboardCard = styled(Flex, {
  row: true,
  alignItems: 'center',
  gap: '$spacing16',
  borderRadius: '$rounded20',
  px: '$padding20',
  py: '$padding20',
  cursor: 'pointer',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'rgba(247,145,26,0.35)',
  background: 'linear-gradient(135deg, rgba(247,145,26,0.18) 0%, rgba(247,145,26,0.06) 100%)',
  hoverStyle: {
    borderColor: POINTS_BRAND_COLOR,
    background: 'linear-gradient(135deg, rgba(247,145,26,0.28) 0%, rgba(247,145,26,0.10) 100%)',
  },
})

const LeaderboardIconWrap = styled(Flex, {
  width: 40,
  height: 40,
  borderRadius: '$roundedFull',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #F7911A 0%, #B05E00 100%)',
})

const HowToList = styled(Flex, {
  width: '100%',
  gap: '$spacing8',
})

const MethodRow = styled(Flex, {
  row: true,
  alignItems: 'center',
  gap: '$spacing16',
  borderRadius: '$rounded16',
  backgroundColor: '$surface2',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$surface3',
  px: '$padding20',
  py: '$padding16',
})

const MethodIconWrap = styled(Flex, {
  width: 36,
  height: 36,
  borderRadius: '$rounded12',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  background: 'linear-gradient(135deg, rgba(247,145,26,0.25) 0%, rgba(247,145,26,0.08) 100%)',
})

const WarningBanner = styled(Flex, {
  row: true,
  gap: '$spacing8',
  alignItems: 'center',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'rgba(255,191,23,0.35)',
  backgroundColor: 'rgba(255,191,23,0.08)',
  px: '$padding12',
  py: '$padding10',
})

interface StatProps {
  icon: React.ReactNode
  label: React.ReactNode
  value: number
  earned: number
}

function Stat({ icon, label, value, earned }: StatProps) {
  return (
    <StatCard>
      <IconBadge>{icon}</IconBadge>
      <Flex gap="$spacing4">
        <Text fontSize={28} fontWeight="700" lineHeight={32} color={POINTS_BRAND_COLOR}>
          +{earned.toLocaleString()}
        </Text>
        <Flex row alignItems="baseline" gap="$spacing4">
          <Text variant="body3" color="$neutral1">
            {value.toLocaleString()}
          </Text>
          <Text variant="body3" color="$neutral2">
            {label}
          </Text>
        </Flex>
      </Flex>
    </StatCard>
  )
}

interface MethodProps {
  icon: React.ReactNode
  title: React.ReactNode
  reward: string
  hint: React.ReactNode
}

function Method({ icon, title, reward, hint }: MethodProps) {
  return (
    <MethodRow>
      <MethodIconWrap>{icon}</MethodIconWrap>
      <Flex flex={1} gap="$spacing2">
        <Text variant="body3" color="$neutral1">
          {title}
        </Text>
        <Text variant="body4" color="$neutral2">
          {hint}
        </Text>
      </Flex>
      <Text variant="body2" color={POINTS_BRAND_COLOR}>
        {reward}
      </Text>
    </MethodRow>
  )
}

export function PointsMenu({ account, onClose }: { account: string; onClose: () => void }) {
  const { t } = useTranslation()
  const accountDrawer = useAccountDrawer()
  const navigate = useNavigate()
  const { data, isLoading } = usePoints(account)

  const total = data?.total ?? 0
  const swapCount = data?.swaps.count ?? 0
  const swapPoints = data?.swaps.points ?? 0
  const liquidityDays = data?.liquidity.days ?? 0
  const liquidityPoints = data?.liquidity.points ?? 0
  const meetsMinimum = data?.liquidity.meetsMinimum ?? false
  const showBelowMinWarning = !!data && !meetsMinimum && data.liquidity.currentUsdValue > 0

  const goLeaderboard = () => {
    accountDrawer.close()
    navigate('/leaderboard')
  }

  return (
    <SlideOutMenu
      title={
        <Text textAlign="center" variant="subheading1" color="$neutral1">
          <Trans i18nKey="account.points.title" />
        </Text>
      }
      onClose={onClose}
    >
      <Flex gap="$spacing20">
        <HeroCard>
          <LiquidBg />
          <LiquidBubbleStyleTag />
          <Flex zIndex={1} alignItems="center" gap="$spacing8" width="100%">
            <span style={HERO_LABEL_STYLE}>
              <Trans i18nKey="account.points.total" />
            </span>
            {isLoading ? (
              <span className={LIQUID_BUBBLE_CLASS} style={HERO_BUBBLE_STYLE}>
                —
              </span>
            ) : (
              <span
                className={LIQUID_BUBBLE_CLASS}
                style={HERO_BUBBLE_STYLE}
                data-testid="points-menu-total"
              >
                {`${total.toLocaleString()} ${POINTS_TICKER}`}
              </span>
            )}
          </Flex>
        </HeroCard>

        <LeaderboardCard onPress={goLeaderboard} data-testid="points-menu-leaderboard">
          <LeaderboardIconWrap>
            <Award size={20} color="white" />
          </LeaderboardIconWrap>
          <Flex flex={1} gap="$spacing2">
            <Text variant="body3" color="$neutral1">
              <Trans i18nKey="account.points.leaderboard" />
            </Text>
            <Text variant="body4" color="$neutral2">
              <Trans i18nKey="account.points.leaderboardSubtitle" />
            </Text>
          </Flex>
          <ArrowUpRight size={20} color={POINTS_BRAND_COLOR} />
        </LeaderboardCard>

        <Flex gap="$spacing8">
          <SectionTitle>
            <Trans i18nKey="account.points.section.activity" />
          </SectionTitle>
          <StatsRow>
            <Stat
              icon={<SwapCoin size={18} color={POINTS_BRAND_COLOR} />}
              label={<Trans i18nKey="account.points.swaps" />}
              value={swapCount}
              earned={swapPoints}
            />
            <Stat
              icon={<LiquidityProvisionCoins size={18} color={POINTS_BRAND_COLOR} />}
              label={<Trans i18nKey="account.points.liquidityDaysLabel" />}
              value={liquidityDays}
              earned={liquidityPoints}
            />
          </StatsRow>
          {showBelowMinWarning && (
            <WarningBanner>
              <Text variant="body4" color="$statusWarning">
                <Trans i18nKey="account.points.belowMinimum" values={{ minUsd: MIN_LIQUIDITY_USD }} />
              </Text>
            </WarningBanner>
          )}
        </Flex>

        <Flex gap="$spacing8">
          <SectionTitle>
            <Trans i18nKey="account.points.howTo.title" />
          </SectionTitle>
          <HowToList>
            <Method
              icon={<SwapCoin size={20} color={POINTS_BRAND_COLOR} />}
              title={<Trans i18nKey="account.points.howTo.swapTitle" />}
              reward={`+${POINTS_PER_SWAP} ${POINTS_TICKER}`}
              hint={t('account.points.howTo.swapHint')}
            />
            <Method
              icon={<LiquidityProvisionCoins size={20} color={POINTS_BRAND_COLOR} />}
              title={<Trans i18nKey="account.points.howTo.liquidityTitle" />}
              reward={`+${POINTS_PER_LIQUIDITY_DAY} ${POINTS_TICKER}`}
              hint={t('account.points.howTo.liquidityHint', { minUsd: MIN_LIQUIDITY_USD })}
            />
          </HowToList>
          <Text variant="body4" color="$neutral3" textAlign="center" mt="$spacing4">
            <Trans i18nKey="account.points.howTo.confirmation" />
          </Text>
        </Flex>
      </Flex>
    </SlideOutMenu>
  )
}
