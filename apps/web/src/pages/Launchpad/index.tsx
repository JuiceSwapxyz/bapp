import { useAccount } from 'hooks/useAccount'
import {
  useLaunchpadStats,
  useLaunchpadTokens,
  type LaunchpadFilterType,
  type LaunchpadSortType,
} from 'hooks/useLaunchpadTokens'
import { LiveTicker } from 'pages/Launchpad/components/LiveTicker'
import { SpotlightCard } from 'pages/Launchpad/components/SpotlightCard'
import { TokenCard } from 'pages/Launchpad/components/TokenCard'
import { JuiceScriptText, LaunchpadBackdrop, Pill, PrimaryButton } from 'pages/Launchpad/components/shared'
import { FILTER_OPTIONS, SORT_OPTIONS } from 'pages/Launchpad/constants'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { Flex, Text, styled } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'

const PageContainer = styled(Flex, {
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  minHeight: '100vh',
  backgroundColor: '$surface1',
  paddingTop: '$spacing24',
  paddingBottom: '$spacing60',
  paddingHorizontal: '$spacing20',
})

const ContentWrapper = styled(Flex, {
  position: 'relative',
  zIndex: 1,
  maxWidth: 1200,
  width: '100%',
  alignSelf: 'center',
  gap: '$spacing24',
})

const TopBar = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: '$spacing20',
  flexWrap: 'wrap',
  animation: 'quick',
  enterStyle: { opacity: 0, y: 12 },
})

const Eyebrow = styled(Text, {
  variant: 'body3',
  color: '$accent1',
  fontWeight: '700',
  letterSpacing: 1.4,
})

const StatsLine = styled(Text, {
  variant: 'body2',
  color: '$neutral2',
})

const ControlsRow = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '$spacing12',
})

const PillGroup = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing8',
  flexWrap: 'wrap',
})

const GroupLabel = styled(Text, {
  variant: 'body3',
  color: '$neutral3',
  fontWeight: '600',
})

const TokenGrid = styled(Flex, {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: '$spacing16',
  animation: 'quick',
  enterStyle: { opacity: 0, y: 16 },
})

const TokenCardWrapper = styled(Flex, {
  width: 'calc(25% - 12px)',
  $lg: { width: 'calc(33.333% - 11px)' },
  $md: { width: 'calc(50% - 8px)' },
  $sm: { width: '100%' },
})

const SkeletonCard = styled(Flex, {
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  borderWidth: 1,
  borderColor: '$surface3',
  padding: '$spacing20',
  gap: '$spacing16',
})

const SkeletonBox = styled(Flex, {
  backgroundColor: '$surface3',
  borderRadius: '$rounded8',
  opacity: 0.7,
})

const EmptyState = styled(Flex, {
  alignItems: 'center',
  justifyContent: 'center',
  padding: '$spacing48',
  gap: '$spacing8',
})

const TOKENS_PER_PAGE = 20

function TokenCardSkeleton() {
  return (
    <SkeletonCard>
      <Flex flexDirection="row" alignItems="center" gap="$spacing12">
        <SkeletonBox width={44} height={44} borderRadius="$roundedFull" />
        <Flex flex={1} gap="$spacing8">
          <SkeletonBox width="60%" height={20} />
          <SkeletonBox width="40%" height={16} />
        </Flex>
      </Flex>
      <SkeletonBox width="100%" height={12} />
      <SkeletonBox width="100%" height={16} />
      <SkeletonBox width="70%" height={16} />
    </SkeletonCard>
  )
}

export default function Launchpad() {
  const navigate = useNavigate()
  const account = useAccount()
  const { defaultChainId } = useEnabledChains()
  const [filter, setFilter] = useState<LaunchpadFilterType>('all')
  const [sort, setSort] = useState<LaunchpadSortType>('volume')
  const [page, setPage] = useState(0)

  // Use the user's connected chain, or fall back to default chain if not connected,
  // so we never show mixed testnet/mainnet tokens.
  const chainId = account.chainId ?? defaultChainId

  const { data: tokensData, isLoading: tokensLoading } = useLaunchpadTokens({
    filter,
    page,
    limit: TOKENS_PER_PAGE,
    chainId,
    sort,
  })
  const { data: stats, isLoading: statsLoading } = useLaunchpadStats(chainId)

  // Featured "trending" token = the highest-volume active launch (independent of filters).
  const { data: featuredData } = useLaunchpadTokens({ filter: 'active', page: 0, limit: 1, chainId, sort: 'volume' })
  const featured = featuredData?.tokens[0]

  const tokens = tokensData?.tokens || []
  const pagination = tokensData?.pagination

  const handleCreateToken = useCallback(() => {
    navigate('/launchpad/create')
  }, [navigate])

  const handleFilterChange = useCallback((newFilter: LaunchpadFilterType) => {
    setFilter(newFilter)
    setPage(0)
  }, [])

  const handleSortChange = useCallback((newSort: LaunchpadSortType) => {
    setSort(newSort)
    setPage(0)
  }, [])

  const isLoading = tokensLoading || statsLoading

  return (
    <Trace logImpression page={InterfacePageName.LaunchpadPage}>
      <PageContainer>
        <LaunchpadBackdrop />
        <ContentWrapper>
          <TopBar>
            <Flex gap="$spacing4" flex={1} minWidth={240}>
              <Eyebrow>JUICESWAP LAUNCHPAD</Eyebrow>
              <JuiceScriptText fontSize={46} lineHeight={68} $md={{ fontSize: 40, lineHeight: 60 }} $sm={{ fontSize: 32, lineHeight: 48 }}>
                freshly squeezed
              </JuiceScriptText>
              <StatsLine>
                {(stats?.totalTokens ?? 0).toLocaleString()} launches · {(stats?.activeTokens ?? 0).toLocaleString()}{' '}
                active · {(stats?.graduatedTokens ?? 0).toLocaleString()} graduated
              </StatsLine>
            </Flex>
            <PrimaryButton size="lg" onPress={handleCreateToken}>
              <Plus size="$icon.20" color="$white" />
              <Text variant="buttonLabel2" color="$white">
                Create Token
              </Text>
            </PrimaryButton>
          </TopBar>

          {featured && <SpotlightCard token={featured} />}

          <LiveTicker chainId={chainId} />

          <Flex gap="$spacing20">
            <ControlsRow>
              <PillGroup>
                <GroupLabel>Show</GroupLabel>
                {FILTER_OPTIONS.map((opt) => (
                  <Pill key={opt.value} active={filter === opt.value} onPress={() => handleFilterChange(opt.value)}>
                    <Text variant="buttonLabel3" color={filter === opt.value ? '$accent1' : '$neutral2'}>
                      {opt.label}
                    </Text>
                  </Pill>
                ))}
              </PillGroup>
              <PillGroup>
                <GroupLabel>Sort</GroupLabel>
                {SORT_OPTIONS.map((opt) => (
                  <Pill key={opt.value} active={sort === opt.value} onPress={() => handleSortChange(opt.value)}>
                    <Text variant="buttonLabel3" color={sort === opt.value ? '$accent1' : '$neutral2'}>
                      {opt.label}
                    </Text>
                  </Pill>
                ))}
              </PillGroup>
            </ControlsRow>

            {isLoading ? (
              <TokenGrid>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TokenCardWrapper key={i}>
                    <TokenCardSkeleton />
                  </TokenCardWrapper>
                ))}
              </TokenGrid>
            ) : tokens.length === 0 ? (
              <EmptyState>
                <Text variant="heading3" color="$neutral1">
                  No tokens yet
                </Text>
                <Text variant="body2" color="$neutral2">
                  Be the first to squeeze a token onto the launchpad.
                </Text>
              </EmptyState>
            ) : (
              <TokenGrid>
                {tokens.map((token) => (
                  <TokenCardWrapper key={token.address}>
                    <TokenCard token={token} />
                  </TokenCardWrapper>
                ))}
              </TokenGrid>
            )}

            {pagination && pagination.totalPages > 1 && (
              <Flex flexDirection="row" justifyContent="center" alignItems="center" gap="$spacing8">
                <Pill
                  onPress={page === 0 ? undefined : () => setPage(Math.max(0, page - 1))}
                  opacity={page === 0 ? 0.5 : 1}
                  cursor={page === 0 ? 'not-allowed' : 'pointer'}
                >
                  <Text variant="buttonLabel3" color="$neutral2">
                    Previous
                  </Text>
                </Pill>
                <Text variant="body3" color="$neutral2">
                  Page {page + 1} of {pagination.totalPages}
                </Text>
                <Pill
                  onPress={page + 1 >= pagination.totalPages ? undefined : () => setPage(page + 1)}
                  opacity={page + 1 >= pagination.totalPages ? 0.5 : 1}
                  cursor={page + 1 >= pagination.totalPages ? 'not-allowed' : 'pointer'}
                >
                  <Text variant="buttonLabel3" color="$neutral2">
                    Next
                  </Text>
                </Pill>
              </Flex>
            )}
          </Flex>
        </ContentWrapper>
      </PageContainer>
    </Trace>
  )
}
