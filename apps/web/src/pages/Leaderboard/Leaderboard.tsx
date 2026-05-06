import { POINTS_BRAND_COLOR, POINTS_TICKER } from 'components/AccountDrawer/Points/constants'
import {
  LEADERBOARD_PAGE_SIZE,
  LeaderboardEntry,
  usePointsLeaderboard,
} from 'components/AccountDrawer/Points/usePointsLeaderboard'
import { useAccount } from 'hooks/useAccount'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Loader, Text, Unicon, styled } from 'ui/src'
import { shortenAddress } from 'utilities/src/addresses'

const TABULAR: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum"',
}

const PageContainer = styled(Flex, {
  width: '100%',
  minHeight: '100vh',
  backgroundColor: '$surface1',
  paddingTop: 72,
  paddingBottom: 72,
  paddingHorizontal: '$spacing24',
})

const ContentWrapper = styled(Flex, {
  maxWidth: 1080,
  width: '100%',
  alignSelf: 'center',
  gap: '$spacing28',
})

const HeaderBlock = styled(Flex, {
  position: 'relative',
  alignItems: 'center',
  gap: '$spacing8',
})

const HeaderGlow = styled(Flex, {
  position: 'absolute',
  top: -80,
  left: '50%',
  width: 640,
  height: 320,
  borderRadius: 320,
  pointerEvents: 'none',
  background: 'radial-gradient(ellipse at center, rgba(247,145,26,0.30) 0%, transparent 60%)',
  transform: 'translateX(-50%)',
  zIndex: 0,
})

const HeaderInner = styled(Flex, {
  alignItems: 'center',
  gap: '$spacing8',
  zIndex: 1,
})

const StatsRow = styled(Flex, {
  row: true,
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '$spacing16',
  px: '$padding16',
  py: '$padding12',
  $sm: { flexDirection: 'column', alignItems: 'stretch', gap: '$spacing12' },
})

const StatBlock = styled(Flex, {
  flex: 1,
  gap: '$spacing2',
  alignItems: 'center',
})

const StatDivider = styled(Flex, {
  width: 1,
  height: 28,
  backgroundColor: '$surface3',
  opacity: 0.5,
  $sm: { display: 'none' },
})

const PodiumGrid = styled(Flex, {
  row: true,
  alignItems: 'stretch',
  justifyContent: 'center',
  gap: '$spacing16',
  width: '100%',
  $sm: { flexDirection: 'column' },
})

const PodiumCard = styled(Flex, {
  flex: 1,
  alignItems: 'center',
  gap: '$spacing16',
  borderRadius: '$rounded24',
  px: '$padding20',
  py: 36,
  position: 'relative',
  variants: {
    rank: {
      1: {
        background:
          'radial-gradient(ellipse at top, rgba(255,215,0,0.18) 0%, rgba(255,215,0,0) 70%), linear-gradient(180deg, rgba(255,215,0,0.06), rgba(255,215,0,0.02))',
      },
      2: {
        background: 'linear-gradient(180deg, rgba(192,192,192,0.10), rgba(192,192,192,0.02))',
      },
      3: {
        background: 'linear-gradient(180deg, rgba(205,127,50,0.10), rgba(205,127,50,0.02))',
      },
    },
  },
})

const RankNumber = styled(Text, {
  variant: 'heading2',
  fontWeight: '900',
  variants: {
    medal: {
      gold: { color: '#FFD700' },
      silver: { color: '#C0C0C0' },
      bronze: { color: '#CD7F32' },
      none: { color: '$neutral2' },
    },
  },
})

const AvatarRing = styled(Flex, {
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '$roundedFull',
  borderWidth: 3,
  borderStyle: 'solid',
  variants: {
    medal: {
      gold: { borderColor: '#FFD700' },
      silver: { borderColor: '#C0C0C0' },
      bronze: { borderColor: '#CD7F32' },
      none: { borderColor: '$surface3' },
    },
  },
})

const ListContainer = styled(Flex, {
  width: '100%',
})

const ListHeader = styled(Flex, {
  row: true,
  alignItems: 'center',
  gap: '$spacing16',
  px: '$padding20',
  pb: '$padding12',
})

const ListRow = styled(Flex, {
  row: true,
  alignItems: 'center',
  gap: '$spacing16',
  px: '$padding20',
  py: '$padding12',
  borderRadius: '$rounded12',
  position: 'relative',
  hoverStyle: { backgroundColor: '$surface2' },
})

const RowDivider = styled(Flex, {
  height: 1,
  mx: '$padding20',
  backgroundColor: '$surface3',
  opacity: 0.35,
})

const UserRowAccent = styled(Flex, {
  position: 'absolute',
  top: '15%',
  bottom: '15%',
  left: 0,
  width: 4,
  borderRadius: 2,
  backgroundColor: POINTS_BRAND_COLOR,
})

const PageButton = styled(Flex, {
  row: true,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$spacing6',
  px: '$padding16',
  height: 40,
  minWidth: 100,
  borderRadius: '$rounded12',
  backgroundColor: '$surface2',
  cursor: 'pointer',
  hoverStyle: { backgroundColor: '$surface3' },
})

type MedalRank = 1 | 2 | 3
const MEDAL_KEY: Record<MedalRank, 'gold' | 'silver' | 'bronze'> = {
  1: 'gold',
  2: 'silver',
  3: 'bronze',
}

function medalKeyForRank(rank: number): 'gold' | 'silver' | 'bronze' | 'none' {
  if (rank === 1) {
    return 'gold'
  }
  if (rank === 2) {
    return 'silver'
  }
  if (rank === 3) {
    return 'bronze'
  }
  return 'none'
}

function useTimeTick(intervalMs: number) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
}

function formatRefreshAge(updatedAt?: number): string {
  if (!updatedAt) {
    return ''
  }
  const seconds = Math.max(0, Math.floor((Date.now() - updatedAt) / 1000))
  if (seconds < 60) {
    return `${seconds}s`
  }
  return `${Math.floor(seconds / 60)}m`
}

function PodiumEntry({ entry, isUser }: { entry: LeaderboardEntry; isUser: boolean }) {
  const medal = medalKeyForRank(entry.rank)
  const rankVariant = (entry.rank as MedalRank) <= 3 ? (entry.rank as MedalRank) : undefined
  const avatarSize = 72
  const ringSize = avatarSize + 10
  return (
    <PodiumCard rank={rankVariant}>
      <RankNumber medal={medal} style={TABULAR}>
        #{entry.rank}
      </RankNumber>
      <AvatarRing medal={medal} width={ringSize} height={ringSize}>
        <Unicon address={entry.address} size={avatarSize} />
      </AvatarRing>
      <Flex alignItems="center" gap="$spacing4">
        <Text variant="body2" color={isUser ? POINTS_BRAND_COLOR : '$neutral1'}>
          {shortenAddress(entry.address)}
        </Text>
        <Text variant="heading3" color={POINTS_BRAND_COLOR} style={TABULAR}>
          {entry.points.toLocaleString()} {POINTS_TICKER}
        </Text>
      </Flex>
    </PodiumCard>
  )
}

function Row({ entry, isUser }: { entry: LeaderboardEntry; isUser: boolean }) {
  return (
    <ListRow
      backgroundColor={isUser ? 'rgba(247,145,26,0.07)' : undefined}
      data-testid={`leaderboard-row-${entry.rank}`}
    >
      {isUser && <UserRowAccent />}
      <Flex width={36}>
        <Text variant="body2" color="$neutral2" style={TABULAR}>
          {entry.rank}
        </Text>
      </Flex>
      <Unicon address={entry.address} size={32} />
      <Flex flex={1}>
        <Text variant="body2" color={isUser ? POINTS_BRAND_COLOR : '$neutral1'}>
          {shortenAddress(entry.address)}
        </Text>
      </Flex>
      <Text variant="body1" color={POINTS_BRAND_COLOR} style={TABULAR}>
        {entry.points.toLocaleString()} {POINTS_TICKER}
      </Text>
    </ListRow>
  )
}

export default function Leaderboard() {
  const { t } = useTranslation()
  const { data, isLoading } = usePointsLeaderboard()
  const account = useAccount()
  const [page, setPage] = useState(0)
  useTimeTick(15_000)

  const userAddress = account.address?.toLowerCase()

  const userEntry = useMemo(() => {
    if (!data || !userAddress) {
      return undefined
    }
    return data.entries.find((e) => e.address.toLowerCase() === userAddress)
  }, [data, userAddress])

  const totalPoints = useMemo(
    () => data?.entries.reduce((sum, e) => sum + e.points, 0) ?? 0,
    [data],
  )

  const podium = useMemo(() => data?.entries.slice(0, 3) ?? [], [data])
  const rest = useMemo(() => data?.entries.slice(3) ?? [], [data])

  const pageCount = Math.max(1, Math.ceil(rest.length / LEADERBOARD_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)

  const visible = useMemo(() => {
    const start = currentPage * LEADERBOARD_PAGE_SIZE
    return rest.slice(start, start + LEADERBOARD_PAGE_SIZE)
  }, [rest, currentPage])

  const refreshAge = formatRefreshAge(data?.updatedAt)
  const showSkeleton = isLoading && !data
  const totalParticipants = data?.entries.length ?? 0

  return (
    <PageContainer>
      <ContentWrapper>
        <HeaderBlock>
          <HeaderGlow />
          <HeaderInner>
            <Text
              variant="body3"
              color={POINTS_BRAND_COLOR}
              style={{ letterSpacing: 3, textTransform: 'uppercase' }}
            >
              <Trans i18nKey="leaderboard.eyebrow" />
            </Text>
            <Text variant="heading1" color="$neutral1" fontWeight="800">
              <Trans i18nKey="leaderboard.title" />
            </Text>
            <Flex row alignItems="center" gap="$spacing8" mt="$spacing4">
              <Text variant="body2" color="$neutral2">
                <Trans i18nKey="leaderboard.subtitle" />
              </Text>
              {refreshAge && (
                <Text variant="body3" color="$neutral3">
                  · <Trans i18nKey="leaderboard.updatedAgo" values={{ age: refreshAge }} />
                </Text>
              )}
            </Flex>
          </HeaderInner>
        </HeaderBlock>

        <StatsRow>
          <StatBlock>
            <Text variant="body4" color="$neutral2" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
              <Trans i18nKey="leaderboard.stats.participants" />
            </Text>
            <Text variant="heading3" color="$neutral1" style={TABULAR}>
              {totalParticipants}
            </Text>
          </StatBlock>
          <StatDivider />
          <StatBlock>
            <Text variant="body4" color="$neutral2" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
              <Trans i18nKey="leaderboard.stats.totalPoints" />
            </Text>
            <Text variant="heading3" color={POINTS_BRAND_COLOR} style={TABULAR}>
              {totalPoints.toLocaleString()} {POINTS_TICKER}
            </Text>
          </StatBlock>
          <StatDivider />
          <StatBlock>
            <Text variant="body4" color="$neutral2" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
              <Trans i18nKey="leaderboard.stats.yourRank" />
            </Text>
            {userEntry ? (
              <Flex row alignItems="baseline" gap="$spacing8">
                <Text variant="heading3" color="$neutral1" style={TABULAR}>
                  #{userEntry.rank}
                </Text>
                <Text variant="body2" color={POINTS_BRAND_COLOR} style={TABULAR}>
                  {userEntry.points.toLocaleString()} {POINTS_TICKER}
                </Text>
              </Flex>
            ) : (
              <Text variant="heading3" color="$neutral3">
                <Trans i18nKey="leaderboard.stats.unranked" />
              </Text>
            )}
          </StatBlock>
        </StatsRow>

        {showSkeleton ? (
          <Flex gap="$spacing12">
            {Array.from({ length: 6 }).map((_, i) => (
              <Loader.Box key={i} height={64} borderRadius={16} />
            ))}
          </Flex>
        ) : podium.length > 0 ? (
          <PodiumGrid>
            {podium.map((entry) => (
              <PodiumEntry
                key={entry.rank}
                entry={entry}
                isUser={!!userAddress && entry.address.toLowerCase() === userAddress}
              />
            ))}
          </PodiumGrid>
        ) : null}

        {!showSkeleton && rest.length > 0 && (
          <ListContainer>
            <ListHeader>
              <Flex width={48}>
                <Text variant="body4" color="$neutral2" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
                  <Trans i18nKey="leaderboard.column.rank" />
                </Text>
              </Flex>
              <Flex width={36} />
              <Flex flex={1}>
                <Text variant="body4" color="$neutral2" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
                  <Trans i18nKey="leaderboard.column.address" />
                </Text>
              </Flex>
              <Text variant="body4" color="$neutral2" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
                <Trans i18nKey="leaderboard.column.points" />
              </Text>
            </ListHeader>
            <RowDivider />
            {visible.map((entry, i) => (
              <Fragment key={entry.rank}>
                <Row
                  entry={entry}
                  isUser={!!userAddress && entry.address.toLowerCase() === userAddress}
                />
                {i < visible.length - 1 && <RowDivider />}
              </Fragment>
            ))}
          </ListContainer>
        )}

        {pageCount > 1 && (
          <Flex row alignItems="center" justifyContent="center" gap="$spacing12">
            <PageButton
              onPress={() => setPage((p) => Math.max(0, p - 1))}
              opacity={currentPage === 0 ? 0.4 : 1}
              data-testid="leaderboard-page-prev"
            >
              <ChevronLeft size={18} />
              <Text variant="buttonLabel3" color="$neutral1">
                <Trans i18nKey="leaderboard.prev" />
              </Text>
            </PageButton>
            <Text variant="body3" color="$neutral2" px="$spacing12" style={TABULAR}>
              {t('leaderboard.pageIndicator', { current: currentPage + 1, total: pageCount })}
            </Text>
            <PageButton
              onPress={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              opacity={currentPage === pageCount - 1 ? 0.4 : 1}
              data-testid="leaderboard-page-next"
            >
              <Text variant="buttonLabel3" color="$neutral1">
                <Trans i18nKey="leaderboard.next" />
              </Text>
              <ChevronRight size={18} />
            </PageButton>
          </Flex>
        )}
      </ContentWrapper>
    </PageContainer>
  )
}
