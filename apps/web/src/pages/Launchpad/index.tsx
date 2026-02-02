import { useAccount } from 'hooks/useAccount'
import {
  useLaunchpadStats,
  useLaunchpadTokens,
  type LaunchpadFilterType,
  type LaunchpadSortType,
} from 'hooks/useLaunchpadTokens'
import { TokenCard } from 'pages/Launchpad/components/TokenCard'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { Flex, Text, styled } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'

const PageContainer = styled(Flex, {
  width: '100%',
  minHeight: '100vh',
  backgroundColor: '$surface1',
  paddingTop: '$spacing20',
  paddingBottom: '$spacing60',
  paddingHorizontal: '$spacing20',
})

const ContentWrapper = styled(Flex, {
  maxWidth: 1200,
  width: '100%',
  alignSelf: 'center',
  gap: '$spacing32',
})

const HeaderSection = styled(Flex, {
  gap: '$spacing16',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexDirection: 'row',
  flexWrap: 'wrap',
  paddingBottom: '$spacing24',
  borderBottomWidth: 1,
  borderBottomColor: '$surface3',
  animation: 'quick',
  enterStyle: {
    opacity: 0,
    y: 20,
  },
})

const TitleSection = styled(Flex, {
  gap: '$spacing8',
  flex: 1,
  minWidth: 0,
})

const MainTitle = styled(Text, {
  variant: 'heading2',
  color: '$neutral1',
  fontWeight: 'bold',
})

const Subtitle = styled(Text, {
  variant: 'body2',
  color: '$neutral2',
})

const CreateButton = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing8',
  paddingHorizontal: '$spacing24',
  paddingVertical: '$spacing16',
  backgroundColor: '$accent1',
  borderRadius: '$rounded12',
  cursor: 'pointer',
  flexShrink: 0,
  pressStyle: {
    backgroundColor: '$accent2',
  },
  hoverStyle: {
    backgroundColor: '$accent2',
  },
})

const FilterTabs = styled(Flex, {
  flexDirection: 'row',
  gap: '$spacing8',
  flexWrap: 'wrap',
  animation: 'quick',
  enterStyle: {
    opacity: 0,
    y: 20,
  },
})

const FilterTab = styled(Flex, {
  paddingHorizontal: '$spacing16',
  paddingVertical: '$spacing8',
  borderRadius: '$rounded12',
  cursor: 'pointer',
  backgroundColor: '$surface2',
  borderWidth: 1,
  borderColor: '$surface3',
  hoverStyle: {
    borderColor: '$accent1',
  },
  variants: {
    active: {
      true: {
        backgroundColor: '$accent2',
        borderColor: '$accent1',
      },
    },
  } as const,
})

const TokenGrid = styled(Flex, {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: '$spacing16',
  animation: 'quick',
  enterStyle: {
    opacity: 0,
    y: 20,
  },
})

const TokenCardWrapper = styled(Flex, {
  width: 'calc(25% - 12px)',
  $lg: {
    width: 'calc(33.333% - 11px)',
  },
  $md: {
    width: 'calc(50% - 8px)',
  },
  $sm: {
    width: '100%',
  },
})

const SkeletonCard = styled(Flex, {
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  borderWidth: 1,
  borderColor: '$surface3',
  padding: '$spacing16',
  gap: '$spacing12',
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
  gap: '$spacing16',
})

const StatsBar = styled(Flex, {
  flexDirection: 'row',
  gap: '$spacing24',
  flexWrap: 'wrap',
  animation: 'quick',
  enterStyle: {
    opacity: 0,
    y: 20,
  },
})

const StatItem = styled(Flex, {
  gap: '$spacing4',
})

const StatValue = styled(Text, {
  variant: 'heading3',
  color: '$neutral1',
  fontWeight: '600',
})

const StatLabel = styled(Text, {
  variant: 'body3',
  color: '$neutral2',
})

const TOKENS_PER_PAGE = 20

function TokenCardSkeleton() {
  return (
    <SkeletonCard>
      <Flex flexDirection="row" alignItems="center" gap="$spacing12">
        <SkeletonBox width={48} height={48} borderRadius="$roundedFull" />
        <Flex flex={1} gap="$spacing8">
          <SkeletonBox width="60%" height={20} />
          <SkeletonBox width="40%" height={16} />
        </Flex>
      </Flex>
      <Flex gap="$spacing4">
        <SkeletonBox width="100%" height={8} />
      </Flex>
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

  // Use the user's connected chain, or fall back to default chain if not connected
  // This ensures we always filter by a specific chain and never show mixed testnet/mainnet tokens
  const chainId = account.chainId ?? defaultChainId

  // Fetch tokens from Ponder API with filtering by current chain
  const { data: tokensData, isLoading: tokensLoading } = useLaunchpadTokens({
    filter,
    page,
    limit: TOKENS_PER_PAGE,
    chainId,
    sort,
  })
  const { data: stats, isLoading: statsLoading } = useLaunchpadStats(chainId)

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
        <ContentWrapper>
          <HeaderSection>
            <TitleSection>
              <MainTitle>Launchpad</MainTitle>
              <Subtitle>Launch tokens with bonding curves. Graduate to JuiceSwap V2 with locked liquidity.</Subtitle>
            </TitleSection>
            <CreateButton onPress={handleCreateToken}>
              <Plus size="$icon.16" color="$white" />
              <Text variant="buttonLabel4" color="$white">
                Create Token
              </Text>
            </CreateButton>
          </HeaderSection>

          <StatsBar>
            <StatItem>
              <StatValue>{stats?.totalTokens || 0}</StatValue>
              <StatLabel>Total Tokens</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{stats?.activeTokens || 0}</StatValue>
              <StatLabel>Active</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{stats?.graduatingTokens || 0}</StatValue>
              <StatLabel>Graduating</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{stats?.graduatedTokens || 0}</StatValue>
              <StatLabel>Graduated</StatLabel>
            </StatItem>
          </StatsBar>

          <Flex gap="$spacing24">
            <Flex
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap="$spacing16"
            >
              <FilterTabs>
                <FilterTab active={filter === 'all'} onPress={() => handleFilterChange('all')}>
                  <Text variant="body2" color={filter === 'all' ? '$accent1' : '$neutral2'}>
                    All
                  </Text>
                </FilterTab>
                <FilterTab active={filter === 'active'} onPress={() => handleFilterChange('active')}>
                  <Text variant="body2" color={filter === 'active' ? '$accent1' : '$neutral2'}>
                    Active
                  </Text>
                </FilterTab>
                <FilterTab active={filter === 'graduating'} onPress={() => handleFilterChange('graduating')}>
                  <Text variant="body2" color={filter === 'graduating' ? '$accent1' : '$neutral2'}>
                    Graduating Soon
                  </Text>
                </FilterTab>
                <FilterTab active={filter === 'graduated'} onPress={() => handleFilterChange('graduated')}>
                  <Text variant="body2" color={filter === 'graduated' ? '$accent1' : '$neutral2'}>
                    Graduated
                  </Text>
                </FilterTab>
              </FilterTabs>

              <FilterTabs>
                <FilterTab active={sort === 'volume'} onPress={() => handleSortChange('volume')}>
                  <Text variant="body2" color={sort === 'volume' ? '$accent1' : '$neutral2'}>
                    Volume
                  </Text>
                </FilterTab>
                <FilterTab active={sort === 'newest'} onPress={() => handleSortChange('newest')}>
                  <Text variant="body2" color={sort === 'newest' ? '$accent1' : '$neutral2'}>
                    Newest
                  </Text>
                </FilterTab>
                <FilterTab active={sort === 'trades'} onPress={() => handleSortChange('trades')}>
                  <Text variant="body2" color={sort === 'trades' ? '$accent1' : '$neutral2'}>
                    Trades
                  </Text>
                </FilterTab>
              </FilterTabs>
            </Flex>

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
                  Be the first to create a token on the launchpad!
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
              <Flex flexDirection="row" justifyContent="center" gap="$spacing8">
                <FilterTab
                  onPress={page === 0 ? undefined : () => setPage(Math.max(0, page - 1))}
                  style={{ opacity: page === 0 ? 0.5 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer' }}
                >
                  <Text variant="body2" color="$neutral2">
                    Previous
                  </Text>
                </FilterTab>
                <FilterTab>
                  <Text variant="body2" color="$neutral1">
                    Page {page + 1} of {pagination.totalPages}
                  </Text>
                </FilterTab>
                <FilterTab
                  onPress={page + 1 >= pagination.totalPages ? undefined : () => setPage(page + 1)}
                  style={{
                    opacity: page + 1 >= pagination.totalPages ? 0.5 : 1,
                    cursor: page + 1 >= pagination.totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Text variant="body2" color="$neutral2">
                    Next
                  </Text>
                </FilterTab>
              </Flex>
            )}
          </Flex>
        </ContentWrapper>
      </PageContainer>
    </Trace>
  )
}
