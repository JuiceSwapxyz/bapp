import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { ExpandoRow } from 'components/AccountDrawer/MiniPortfolio/ExpandoRow'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { LiquidityPositionCard, LiquidityPositionCardLoader } from 'components/Liquidity/LiquidityPositionCard'
import { PositionsHeader } from 'components/Liquidity/PositionsHeader'
import { PositionInfo } from 'components/Liquidity/types'
import { getPositionUrl } from 'components/Liquidity/utils/getPositionUrl'
import { parseRestPosition } from 'components/Liquidity/utils/parseFromRest'
import { getHardcodedPositionsForWallet } from 'constants/hardcodedPositions'
import { useAccount } from 'hooks/useAccount'
import { useInfiniteScroll } from 'hooks/useInfiniteScroll'
import { atom, useAtom } from 'jotai'
import { TopPools } from 'pages/Positions/TopPools'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { FixedSizeList } from 'react-window'
import { usePendingLPTransactionsChangeListener } from 'state/transactions/hooks'
import { useRequestPositionsForSavedPairs } from 'state/user/hooks'
import { Button, Flex, Text, useMedia } from 'ui/src'
import { CloseIconWithHover } from 'ui/src/components/icons/CloseIconWithHover'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Pools } from 'ui/src/components/icons/Pools'
import { Wallet } from 'ui/src/components/icons/Wallet'
import { useGetPositionsInfiniteQuery } from 'uniswap/src/data/rest/getPositions'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { usePositionVisibilityCheck } from 'uniswap/src/features/visibility/hooks/usePositionVisibilityCheck'

// The BE limits the number of positions by chain and protocol version.
// PAGE_SIZE=25 means the limit is at most 25 positions * x chains * y protocol versions.
// TODO: LP-4: Improve performance by loading pageSize limit positions at a time.
const PAGE_SIZE = 25

function DisconnectedWalletView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const accountDrawer = useAccountDrawer()

  return (
    <Flex gap="$spacing12">
      <Flex
        padding="$spacing24"
        centered
        gap="$gap16"
        borderRadius="$rounded12"
        borderColor="$surface3"
        borderWidth="$spacing1"
        borderStyle="solid"
      >
        <Flex padding="$padding12" borderRadius="$rounded12" backgroundColor="$surface3">
          <Wallet size="$icon.24" color="$neutral1" />
        </Flex>
        <Text variant="subheading1">{t('positions.welcome.connect.wallet')}</Text>
        <Text variant="body2" color="$neutral2">
          {t('positions.welcome.connect.description')}
        </Text>
        <Flex row gap="$gap8">
          <Button variant="default" size="small" emphasis="secondary" onPress={() => navigate('/positions/create/v3')}>
            {t('position.new')}
          </Button>
          <Button variant="default" size="small" width={160} onPress={accountDrawer.open}>
            {t('common.connectWallet.button')}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )
}

function EmptyPositionsView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <Flex gap="$spacing12">
      <Flex
        padding="$spacing24"
        centered
        gap="$gap16"
        borderRadius="$rounded12"
        borderColor="$surface3"
        borderWidth="$spacing1"
        borderStyle="solid"
        $platform-web={{
          textAlign: 'center',
        }}
      >
        <Flex padding="$padding12" borderRadius="$rounded12" backgroundColor="$surface3">
          <Pools size="$icon.24" color="$neutral1" />
        </Flex>
        <Text variant="subheading1">{t('positions.noPositions.title')}</Text>
        <Text variant="body2" color="$neutral2" maxWidth={420}>
          {t('positions.noPositions.description')}
        </Text>
        <Flex row gap="$gap8">
          <Button variant="default" size="small" emphasis="secondary" onPress={() => navigate('/explore/pools')}>
            {t('pools.explore')}
          </Button>
          <Button variant="default" size="small" width={160} onPress={() => navigate('/positions/create/v3')}>
            {t('position.new')}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )
}

const chainFilterAtom = atom<UniverseChainId | null>(null)
const statusFilterAtom = atom<PositionStatus[]>([PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE])

function VirtualizedPositionsList({
  positions,
  onLoadMore,
  hasNextPage,
  isFetching,
}: {
  positions: PositionInfo[]
  onLoadMore: () => void
  hasNextPage: boolean
  isFetching: boolean
}) {
  const { t } = useTranslation()
  const media = useMedia()
  const positionItemHeight = useMemo(() => {
    return media.sm ? 360 : media.md ? 290 : 200
  }, [media])

  const listHeight = useMemo(() => {
    return positions.length * positionItemHeight
  }, [positionItemHeight, positions.length])

  const { sentinelRef } = useInfiniteScroll({ onLoadMore, hasNextPage, isFetching })

  return (
    <Flex grow>
      <FixedSizeList
        height={listHeight}
        width="100%"
        itemCount={positions.length}
        itemSize={positionItemHeight}
        itemData={positions}
        itemKey={(index) => `${positions[index].poolId}-${positions[index].tokenId}-${positions[index].chainId}`}
      >
        {({ index, style, data }) => {
          const position = data[index]
          return (
            <Flex style={style}>
              <Link
                key={`${position.poolId}-${position.tokenId}-${position.chainId}`}
                style={{ textDecoration: 'none' }}
                to={getPositionUrl(position)}
              >
                <LiquidityPositionCard showVisibilityOption liquidityPosition={position} />
              </Link>
            </Flex>
          )
        }}
      </FixedSizeList>

      {/* Sentinel element to trigger loading more when it comes into view */}
      {hasNextPage && (
        <Flex ref={sentinelRef} height={20} justifyContent="center" alignItems="center">
          {isFetching && (
            <Text variant="body3" color="$neutral2">
              {t('liquidityPool.positions.loadingMore')}
            </Text>
          )}
        </Flex>
      )}
    </Flex>
  )
}

export default function Pool() {
  const account = useAccount()
  const { t } = useTranslation()
  const { address, isConnected } = account

  const [chainFilter, setChainFilter] = useAtom(chainFilterAtom)
  const { chains: currentModeChains } = useEnabledChains()
  const [statusFilter, setStatusFilter] = useAtom(statusFilterAtom)
  const [closedCTADismissed, setClosedCTADismissed] = useState(false)

  const isPositionVisible = usePositionVisibilityCheck()
  const [showHiddenPositions, setShowHiddenPositions] = useState(false)

  const { data, isPlaceholderData, refetch, isLoading, fetchNextPage, hasNextPage, isFetching } =
    useGetPositionsInfiniteQuery(
      {
        address,
        chainIds: chainFilter ? [chainFilter] : currentModeChains,
        positionStatuses: statusFilter,
        protocolVersions: [ProtocolVersion.V3],
        pageSize: PAGE_SIZE,
        pageToken: '',
        includeHidden: true,
      },
      !isConnected,
    )

  const loadedPositions = useMemo(() => {
    return data?.pages.flatMap((positionsResponse) => positionsResponse.positions) || []
  }, [data])

  const savedPositions = useRequestPositionsForSavedPairs()

  // Get hardcoded positions for the current wallet (all hardcoded positions are V3)
  const hardcodedPositions = useMemo(() => {
    return getHardcodedPositionsForWallet(account.address).filter((position) => {
      const matchesChain = !chainFilter || position.chainId === chainFilter
      const matchesStatus = statusFilter.includes(position.status)
      return matchesChain && matchesStatus
    })
  }, [account.address, chainFilter, statusFilter])

  const isLoadingPositions = !!account.address && (isLoading || !data)
  const combinedPositions = useMemo(() => {
    // Parse API positions
    const apiPositions = [
      ...loadedPositions,
      ...savedPositions
        .filter((position) => {
          const matchesChain = !chainFilter || position.data?.position?.chainId === chainFilter
          const matchesStatus = position.data?.position?.status && statusFilter.includes(position.data.position.status)
          const matchesVersion =
            position.data?.position?.protocolVersion && position.data.position.protocolVersion === ProtocolVersion.V3
          return matchesChain && matchesStatus && matchesVersion
        })
        .map((p) => p.data?.position),
    ]
      .map(parseRestPosition)
      .filter((position): position is PositionInfo => !!position)

    // Combine hardcoded positions (already in PositionInfo format) with parsed API positions
    const allPositions = [...hardcodedPositions, ...apiPositions]

    // Remove duplicates
    return allPositions.reduce<PositionInfo[]>((unique, position) => {
      const positionId = `${position.poolId}-${position.tokenId}-${position.chainId}`
      const exists = unique.some((p) => `${p.poolId}-${p.tokenId}-${p.chainId}` === positionId)
      if (!exists) {
        unique.push(position)
      }
      return unique
    }, [])
  }, [hardcodedPositions, loadedPositions, savedPositions, chainFilter, statusFilter])

  const { visiblePositions, hiddenPositions } = useMemo(() => {
    const visiblePositions: PositionInfo[] = []
    const hiddenPositions: PositionInfo[] = []

    combinedPositions.forEach((position) => {
      const isVisible = isPositionVisible({
        poolId: position.poolId,
        tokenId: position.tokenId,
        chainId: position.chainId,
        isFlaggedSpam: position.isHidden,
      })

      if (isVisible) {
        visiblePositions.push(position)
      } else {
        hiddenPositions.push(position)
      }
    })

    return { visiblePositions, hiddenPositions }
  }, [combinedPositions, isPositionVisible])

  usePendingLPTransactionsChangeListener(refetch)

  const loadMorePositions = () => {
    if (hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }

  return (
    <Trace logImpression page={InterfacePageName.Positions}>
      <Flex
        row
        justifyContent="space-between"
        $xl={{ flexDirection: 'column', gap: '$gap16' }}
        width="100%"
        gap={20}
        py="$spacing24"
        px="$spacing40"
        $lg={{ px: '$spacing20' }}
      >
        <Flex grow shrink gap="$spacing24" maxWidth={740} $xl={{ maxWidth: '100%' }}>
          <Flex row justifyContent="space-between" alignItems="center" mt={0}>
            <PositionsHeader
              showFilters={account.isConnected}
              selectedChain={chainFilter}
              selectedStatus={statusFilter}
              onChainChange={(selectedChain) => {
                setChainFilter(selectedChain ?? null)
              }}
              onStatusChange={(toggledStatus) => {
                setStatusFilter((prevStatusFilter) => {
                  if (prevStatusFilter.includes(toggledStatus)) {
                    return prevStatusFilter.filter((s) => s !== toggledStatus)
                  } else {
                    return [...prevStatusFilter, toggledStatus]
                  }
                })
              }}
            />
          </Flex>
          {!isLoadingPositions ? (
            combinedPositions.length > 0 ? (
              <Flex gap="$gap16" mb="$spacing16" opacity={isPlaceholderData ? 0.6 : 1}>
                <VirtualizedPositionsList
                  positions={visiblePositions}
                  onLoadMore={loadMorePositions}
                  hasNextPage={hasNextPage}
                  isFetching={isFetching}
                />
                <HiddenPositions
                  showHiddenPositions={showHiddenPositions}
                  setShowHiddenPositions={setShowHiddenPositions}
                  hiddenPositions={hiddenPositions}
                />
              </Flex>
            ) : isConnected ? (
              <EmptyPositionsView />
            ) : (
              <DisconnectedWalletView />
            )
          ) : (
            <Flex gap="$gap16">
              {Array.from({ length: 5 }, (_, index) => (
                <LiquidityPositionCardLoader key={index} />
              ))}
            </Flex>
          )}
          {!statusFilter.includes(PositionStatus.CLOSED) && !closedCTADismissed && account.address && (
            <Flex
              borderWidth="$spacing1"
              borderColor="$surface3"
              borderRadius="$rounded12"
              mb="$spacing24"
              p="$padding12"
              gap="$gap12"
              row
              centered
            >
              <Flex height="100%">
                <InfoCircleFilled color="$neutral2" size="$icon.20" />
              </Flex>
              <Flex grow flexBasis={0}>
                <Text variant="body3" color="$neutral1">
                  {t('pool.closedCTA.title')}
                </Text>
                <Text variant="body3" color="$neutral2">
                  {t('pool.closedCTA.description')}
                </Text>
              </Flex>
              <CloseIconWithHover onClose={() => setClosedCTADismissed(true)} size="$icon.20" />
            </Flex>
          )}
        </Flex>
        <Flex gap="$gap32">
          <TopPools chainId={chainFilter} />
          {isConnected && (
            <Flex gap="$gap20" mb="$spacing24">
              <Text variant="subheading1">{t('liquidity.learnMoreLabel')}</Text>
              {/* TODO: Re-enable once support.juiceswap.com is configured
              <ExternalArrowLink href={uniswapUrls.helpArticleUrls.positionsLearnMore}>
                {t('common.button.learn')}
              </ExternalArrowLink>
              */}
            </Flex>
          )}
        </Flex>
      </Flex>
    </Trace>
  )
}

interface HiddenPositionsProps {
  showHiddenPositions: boolean
  setShowHiddenPositions: (showHiddenPositions: boolean) => void
  hiddenPositions: PositionInfo[]
}

function HiddenPositions({ showHiddenPositions, setShowHiddenPositions, hiddenPositions }: HiddenPositionsProps) {
  const { t } = useTranslation()
  return (
    <ExpandoRow
      isExpanded={showHiddenPositions}
      toggle={() => setShowHiddenPositions(!showHiddenPositions)}
      numItems={hiddenPositions.length}
      title={t('common.hidden')}
      enableOverflow
    >
      <Flex gap="$gap16">
        {hiddenPositions.map((position) => (
          <Link
            key={`${position.poolId}-${position.tokenId}-${position.chainId}`}
            style={{ textDecoration: 'none' }}
            to={getPositionUrl(position)}
          >
            <LiquidityPositionCard showVisibilityOption liquidityPosition={position} isVisible={false} />
          </Link>
        ))}
      </Flex>
    </ExpandoRow>
  )
}
