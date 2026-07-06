import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import {
  MIN_LIQUIDITY_USD,
  POINTS_BRAND_COLOR,
  POINTS_PER_LIQUIDITY_DAY,
  POINTS_PER_SWAP,
  POINTS_TICKER,
} from 'components/AccountDrawer/Points/constants'
import {
  LIQUID_BUBBLE_CLASS,
  LiquidBg,
  LiquidBubbleStyleTag,
  bubbleTextStyle,
} from 'components/AccountDrawer/Points/styles'
import { usePoints } from 'components/AccountDrawer/Points/usePoints'
import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { ArrowUpRight, Award, Check, DollarSign, Droplet, Layers, TrendingUp, Zap } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button, Flex, Text, styled } from 'ui/src'
import { LiquidityProvisionCoins } from 'ui/src/components/icons/LiquidityProvisionCoins'
import { SwapCoin } from 'ui/src/components/icons/SwapCoin'

// External JuiceDollar dashboard surfaces (separate app, opens in new tab).
const JUSD_SAVINGS_URL = 'https://bapp.juicedollar.com/savings'
const JUSD_EQUITY_URL = 'https://bapp.juicedollar.com/equity'
const JUSD_MINT_URL = 'https://bapp.juicedollar.com/mint'

const JUICE_CREAM = '#FFE6B8'
const JUICE_BORDER = 'rgba(247, 165, 54, 0.28)'

const HeroCard = styled(Flex, {
  position: 'relative',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$spacing12',
  borderRadius: '$rounded20',
  px: '$padding24',
  py: '$padding28',
  minHeight: 244,
  overflow: 'hidden',
  background:
    'linear-gradient(180deg, rgba(255,196,100,0.12) 0%, rgba(247,145,26,0.04) 44%, rgba(9,6,4,0.98) 100%), linear-gradient(180deg, #1B1007 0%, #080503 100%)',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'rgba(255, 196, 100, 0.34)',
})

const HERO_BUBBLE_STYLE = bubbleTextStyle(60)

const HERO_LABEL_STYLE: React.CSSProperties = {
  letterSpacing: 1.6,
  textTransform: 'uppercase',
  fontSize: 11,
  fontWeight: 700,
  color: JUICE_CREAM,
  margin: 0,
  width: '100%',
  textAlign: 'center',
  display: 'block',
}

const BrandPill = styled(Flex, {
  row: true,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$spacing6',
  borderRadius: '$roundedFull',
  px: '$padding12',
  py: '$padding6',
  backgroundColor: 'rgba(247, 165, 54, 0.14)',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'rgba(255, 214, 153, 0.28)',
})

const SectionTitle = styled(Text, {
  variant: 'body4',
  color: JUICE_CREAM,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  fontWeight: '700',
})

const SectionHint = styled(Text, {
  variant: 'body4',
  color: '$neutral2',
  lineHeight: 18,
})

const StatsRow = styled(Flex, {
  row: true,
  gap: '$spacing8',
  width: '100%',
})

const StatCard = styled(Flex, {
  flex: 1,
  gap: '$spacing10',
  borderRadius: '$rounded16',
  minHeight: 118,
  background:
    'linear-gradient(180deg, rgba(255,214,153,0.06) 0%, rgba(247,145,26,0.03) 100%), linear-gradient(180deg, #17110C 0%, #0E0B08 100%)',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: JUICE_BORDER,
  p: '$padding16',
})

const IconBadge = styled(Flex, {
  width: 32,
  height: 32,
  borderRadius: '$roundedFull',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(247,165,54,0.16)',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'rgba(247,165,54,0.26)',
})

const LeaderboardCard = styled(Flex, {
  row: true,
  alignItems: 'center',
  gap: '$spacing16',
  borderRadius: '$rounded16',
  px: '$padding20',
  py: '$padding20',
  cursor: 'pointer',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'rgba(247,165,54,0.34)',
  background:
    'linear-gradient(135deg, rgba(247,165,54,0.17) 0%, rgba(88,146,255,0.06) 100%), linear-gradient(180deg, #17110C 0%, #0F0B08 100%)',
  hoverStyle: {
    borderColor: POINTS_BRAND_COLOR,
    background:
      'linear-gradient(135deg, rgba(247,165,54,0.24) 0%, rgba(88,146,255,0.08) 100%), linear-gradient(180deg, #1C1209 0%, #100B07 100%)',
  },
})

const LeaderboardIconWrap = styled(Flex, {
  width: 40,
  height: 40,
  borderRadius: '$roundedFull',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #FFCE78 0%, #F7911A 54%, #B35D00 100%)',
})

const HowToList = styled(Flex, {
  width: '100%',
  gap: '$spacing8',
})

const MethodRow = styled(Flex, {
  row: true,
  alignItems: 'center',
  gap: '$spacing16',
  borderRadius: '$rounded14',
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
  background: 'linear-gradient(135deg, rgba(247,165,54,0.24) 0%, rgba(247,145,26,0.08) 100%)',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'rgba(247,165,54,0.18)',
})

/**
 * Card layout for one-time + daily-earning bonuses. Column-oriented so the
 * title can wrap freely and the action button always sits flush at the
 * bottom edge (avoids the squashed look when the inline layout runs out of
 * horizontal room in the narrow drawer).
 */
const BonusCard = styled(Flex, {
  position: 'relative',
  gap: '$spacing12',
  borderRadius: '$rounded16',
  overflow: 'hidden',
  background:
    'linear-gradient(180deg, rgba(255,214,153,0.055) 0%, rgba(247,145,26,0.025) 100%), linear-gradient(180deg, #17110C 0%, #0F0B08 100%)',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'rgba(255,214,153,0.16)',
  px: '$padding20',
  py: '$padding16',
  hoverStyle: {
    borderColor: 'rgba(247,165,54,0.34)',
    background:
      'linear-gradient(180deg, rgba(255,214,153,0.08) 0%, rgba(247,145,26,0.04) 100%), linear-gradient(180deg, #1A120C 0%, #100B08 100%)',
  },
})

const BonusActionButton = styled(Button, {
  width: '100%',
  background: 'linear-gradient(135deg, #FFBE5C 0%, #F7911A 48%, #C96B05 100%)',
  borderRadius: '$rounded12',
  paddingVertical: '$spacing10',
  hoverStyle: { backgroundColor: '#FFA64D' },
})

const RewardBadge = styled(Flex, {
  alignItems: 'flex-end',
  gap: '$spacing2',
  borderRadius: '$rounded12',
  paddingVertical: '$spacing8',
  paddingHorizontal: '$spacing10',
  backgroundColor: 'rgba(247,165,54,0.1)',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'rgba(247,165,54,0.22)',
})

const EarnedPill = styled(Flex, {
  row: true,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$spacing6',
  borderRadius: '$rounded12',
  paddingVertical: '$spacing10',
  paddingHorizontal: '$spacing12',
  backgroundColor: 'rgba(76, 175, 80, 0.12)',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'rgba(76, 175, 80, 0.40)',
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

interface BonusRowProps {
  icon: React.ReactNode
  title: React.ReactNode
  hint: React.ReactNode
  /** Reward as a free-form short label (e.g. "+500 JP" or "1 JP / JUSD / day"). */
  rewardLabel: string
  /** State of the bonus — "active" shows the action CTA, "earned" shows a green pill. */
  state: 'active' | 'earned'
  /** Optional secondary right-aligned line (e.g. accrued total when in daily mode). */
  rewardSubLabel?: string
  ctaLabel?: string
  onAction?: () => void
}

function BonusRow({ icon, title, hint, rewardLabel, rewardSubLabel, state, ctaLabel, onAction }: BonusRowProps) {
  return (
    <BonusCard>
      <Flex row gap="$spacing12" alignItems="flex-start">
        <MethodIconWrap>{icon}</MethodIconWrap>
        <Flex flex={1} gap="$spacing2" minWidth={0}>
          <Text variant="body2" color="$neutral1" fontWeight="600">
            {title}
          </Text>
          <Text variant="body4" color="$neutral2">
            {hint}
          </Text>
        </Flex>
        <RewardBadge flexShrink={0}>
          <Text variant="body2" color={POINTS_BRAND_COLOR} fontWeight="600">
            {rewardLabel}
          </Text>
          {rewardSubLabel && (
            <Text variant="body4" color="$neutral3">
              {rewardSubLabel}
            </Text>
          )}
        </RewardBadge>
      </Flex>
      {state === 'earned' ? (
        <EarnedPill>
          <Check size={14} color="#4CAF50" />
          <Text variant="buttonLabel4" color="$statusSuccess">
            Earned
          </Text>
        </EarnedPill>
      ) : ctaLabel && onAction ? (
        <BonusActionButton onPress={onAction}>
          <Flex row alignItems="center" justifyContent="center" gap="$spacing8">
            <Text variant="buttonLabel3" color="$white">
              {ctaLabel}
            </Text>
            <ArrowUpRight size={15} color="white" />
          </Flex>
        </BonusActionButton>
      ) : null}
    </BonusCard>
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

  const memeTokenCreated = data?.bonuses?.memeTokenCreated ?? false
  const memeTokenGraduated = data?.bonuses?.memeTokenGraduated ?? false

  // Daily-earning balances (filled by indexer; defaults keep the UI honest
  // when the wallet has nothing yet or the backend hasn't responded).
  const jusdSaved = data?.bonuses?.savings?.jusdSaved ?? 0
  const jusdSavedPoints = data?.bonuses?.savings?.points ?? 0
  const juiceHeld = data?.bonuses?.juiceHold?.juiceHeld ?? 0
  const juiceHeldPoints = data?.bonuses?.juiceHold?.points ?? 0
  const usdLent = data?.bonuses?.lending?.usdLent ?? 0
  const lendingPoints = data?.bonuses?.lending?.points ?? 0

  const goLeaderboard = () => {
    accountDrawer.close()
    navigate('/leaderboard')
  }

  const goLaunchpadCreate = () => {
    accountDrawer.close()
    navigate('/launchpad/create')
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
          <Flex zIndex={1} alignItems="center" gap="$spacing10" width="100%">
            <BrandPill>
              <Droplet size={13} color={POINTS_BRAND_COLOR} />
              <Text variant="buttonLabel4" color={JUICE_CREAM}>
                JuiceSwap Rewards
              </Text>
            </BrandPill>
            <span style={HERO_LABEL_STYLE}>
              <Trans i18nKey="account.points.total" />
            </span>
            {isLoading ? (
              <span className={LIQUID_BUBBLE_CLASS} style={HERO_BUBBLE_STYLE}>
                —
              </span>
            ) : (
              <span className={LIQUID_BUBBLE_CLASS} style={HERO_BUBBLE_STYLE} data-testid="points-menu-total">
                {`${total.toLocaleString()} ${POINTS_TICKER}`}
              </span>
            )}
            <Text variant="body4" color="$neutral2" textAlign="center" maxWidth={300} lineHeight={18}>
              Stack Juice Points through real JuiceSwap activity, JUSD depth and JUICE alignment.
            </Text>
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
          <SectionTitle>One-time bonuses</SectionTitle>
          <SectionHint>High-signal JuiceSwap milestones earn the biggest single boosts.</SectionHint>
          <HowToList>
            <BonusRow
              icon={<Zap size={18} color={POINTS_BRAND_COLOR} />}
              title="Launch a meme token"
              hint="One-time bonus on first launch (Citrea Mainnet)."
              rewardLabel={`+500 ${POINTS_TICKER}`}
              state={memeTokenCreated ? 'earned' : 'active'}
              ctaLabel="Create token"
              onAction={goLaunchpadCreate}
            />
            <BonusRow
              icon={<TrendingUp size={18} color={POINTS_BRAND_COLOR} />}
              title="Graduate via bonding curve"
              hint="Token's bonding curve fills and graduates to a V2 pair."
              rewardLabel={`+10,000 ${POINTS_TICKER}`}
              state={memeTokenGraduated ? 'earned' : 'active'}
              ctaLabel="Open launchpad"
              onAction={() => {
                accountDrawer.close()
                navigate('/launchpad')
              }}
            />
          </HowToList>
        </Flex>

        <Flex gap="$spacing8">
          <SectionTitle>Daily rewards</SectionTitle>
          <SectionHint>Turn idle balances into a daily JP stream across JuiceDollar and JUICE.</SectionHint>
          <HowToList>
            <BonusRow
              icon={<DollarSign size={18} color={POINTS_BRAND_COLOR} />}
              title="Save JUSD"
              hint="Deposit JUSD into the Savings Vault — earn while protocol borrowers pay interest."
              rewardLabel={`1 ${POINTS_TICKER} / JUSD / day`}
              rewardSubLabel={
                jusdSaved > 0
                  ? `${jusdSaved.toLocaleString()} JUSD · +${jusdSavedPoints.toLocaleString()} ${POINTS_TICKER} today`
                  : undefined
              }
              state="active"
              ctaLabel="Start saving"
              onAction={() => window.open(JUSD_SAVINGS_URL, '_blank', 'noopener,noreferrer')}
            />
            <BonusRow
              icon={<Droplet size={18} color={POINTS_BRAND_COLOR} />}
              title="Hold JUICE"
              hint="Every 10 JUICE you hold earns 1 JP every 24h."
              rewardLabel={`1 ${POINTS_TICKER} / 10 JUICE / day`}
              rewardSubLabel={
                juiceHeld > 0
                  ? `${juiceHeld.toLocaleString()} JUICE · +${juiceHeldPoints.toLocaleString()} ${POINTS_TICKER} today`
                  : undefined
              }
              state="active"
              ctaLabel="Open JUICE"
              onAction={() => window.open(JUSD_EQUITY_URL, '_blank', 'noopener,noreferrer')}
            />
            <BonusRow
              icon={<Layers size={18} color={POINTS_BRAND_COLOR} />}
              title="Lend with a JUSD position"
              hint="Mint JUSD against collateral via the Minting Hub. $1 borrowed = 5 JP / 24h."
              rewardLabel={`5 ${POINTS_TICKER} / $1 / day`}
              rewardSubLabel={
                usdLent > 0
                  ? `$${usdLent.toLocaleString()} active · +${lendingPoints.toLocaleString()} ${POINTS_TICKER} today`
                  : undefined
              }
              state="active"
              ctaLabel="Open minting"
              onAction={() => window.open(JUSD_MINT_URL, '_blank', 'noopener,noreferrer')}
            />
          </HowToList>
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
