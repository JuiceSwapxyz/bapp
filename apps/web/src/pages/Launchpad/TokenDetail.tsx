import { PriceChart, type PriceChartData } from 'components/Charts/PriceChart'
import { PriceChartType } from 'components/Charts/utils'
import { useAccount } from 'hooks/useAccount'
import { useBondingCurveToken } from 'hooks/useBondingCurveToken'
import { useLaunchpadTokenPrice } from 'hooks/useLaunchpadTokenPrice'
import { useLaunchpadCandles, useLaunchpadToken, type LaunchpadCandleInterval } from 'hooks/useLaunchpadTokens'
import { useTokenInfo } from 'hooks/useTokenFactory'
import { getSocialLink, useTokenMetadata } from 'hooks/useTokenMetadata'
import type { UTCTimestamp } from 'lightweight-charts'
import { ActivityTable } from 'pages/Launchpad/components/ActivityTable'
import { BondingCurveHero } from 'pages/Launchpad/components/BondingCurveHero'
import { BuySellPanel } from 'pages/Launchpad/components/BuySellPanel'
import { TokenLogo } from 'pages/Launchpad/components/TokenLogo'
import {
  BackButton,
  GraduatedBadge,
  LaunchpadBackdrop,
  StatLabel,
  StatRow,
  StatValue,
} from 'pages/Launchpad/components/shared'
import { LAUNCHPAD_TOKEN_TOTAL_SUPPLY } from 'pages/Launchpad/constants'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Flex, ModalCloseIcon, Text, styled } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { formatUnits } from 'viem'

type SocialPlatform = 'Twitter' | 'Telegram'
type ChartPriceUnit = 'usd' | 'jusd'

const SOCIAL_URL_PATTERNS: Record<SocialPlatform, { check: (s: string) => boolean; regex: RegExp }> = {
  Twitter: {
    check: (s) => s.includes('twitter.com/') || s.includes('x.com/'),
    regex: /(?:twitter\.com|x\.com)\/(@?[\w]+)/i,
  },
  Telegram: {
    check: (s) => s.includes('t.me/'),
    regex: /t\.me\/(@?[\w]+)/i,
  },
}

function extractSocialHandle(value: string | null | undefined, platform: SocialPlatform): string | null {
  if (!value) {
    return null
  }
  const trimmed = value.trim()
  const { check, regex } = SOCIAL_URL_PATTERNS[platform]
  if (check(trimmed)) {
    const match = trimmed.match(regex)
    return match ? match[1].replace('@', '') : null
  }
  return trimmed.replace('@', '')
}

// ---------------------------------------------------------------------------
// Layout — clean, light, JuiceSwap-branded trading terminal.
// Citrus (#F7911A) is used only as an accent; surfaces stay clean with soft
// shadows for depth.
// ---------------------------------------------------------------------------

const PageContainer = styled(Flex, {
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  minHeight: '100vh',
  backgroundColor: '$surface1',
  paddingTop: '$spacing20',
  paddingBottom: '$spacing60',
  paddingHorizontal: '$spacing20',
})

const ContentWrapper = styled(Flex, {
  position: 'relative',
  zIndex: 1,
  maxWidth: 1200,
  width: '100%',
  alignSelf: 'center',
  gap: '$spacing16',
})

const Panel = styled(Flex, {
  backgroundColor: '$surface2',
  borderRadius: '$rounded20',
  borderWidth: 1,
  borderColor: '$surface3',
  padding: '$spacing20',
  gap: '$spacing16',
  animation: 'quick',
  enterStyle: { opacity: 0, y: 10 },
  '$platform-web': {
    boxShadow: '0 1px 2px rgba(16,16,16,0.04), 0 8px 24px rgba(16,16,16,0.05)',
  },
  variants: {
    accent: {
      true: { borderTopWidth: 2, borderTopColor: '$accent1' },
    },
  } as const,
})

const TokenName = styled(Text, {
  variant: 'heading2',
  color: '$neutral1',
  fontWeight: 'bold',
  numberOfLines: 1,
})

const TokenSymbol = styled(Text, {
  variant: 'body1',
  color: '$neutral2',
})

const CardTitle = styled(Text, {
  variant: 'subheading2',
  color: '$neutral1',
  fontWeight: '700',
})

const MainContent = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: '$spacing16',
  $md: { flexDirection: 'column', alignItems: 'stretch' },
})

const LeftColumn = styled(Flex, {
  flex: 2,
  flexShrink: 1,
  minWidth: 0,
  gap: '$spacing16',
  $md: { width: '100%' },
})

const RightColumn = styled(Flex, {
  flex: 1,
  flexShrink: 0,
  width: 372,
  maxWidth: '100%',
  gap: '$spacing16',
  $md: { width: '100%', flexShrink: 1 },
})

const StatGrid = styled(Flex, {
  flexDirection: 'row',
  gap: '$spacing12',
  flexWrap: 'wrap',
})

const StatCard = styled(Flex, {
  flex: 1,
  minWidth: 150,
  gap: '$spacing4',
  padding: '$spacing16',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  borderWidth: 1,
  borderColor: '$surface3',
})

const BigStatValue = styled(Text, {
  variant: 'subheading1',
  color: '$neutral1',
  fontWeight: '700',
  numberOfLines: 1,
})

const ChartHeaderRow = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '$spacing12',
  flexWrap: 'wrap',
})

const ChartControls = styled(Flex, {
  flexDirection: 'row',
  gap: '$spacing8',
  flexWrap: 'wrap',
  maxWidth: '100%',
  $md: { width: '100%', flexDirection: 'column' },
})

const SegmentedControl = styled(Flex, {
  flexDirection: 'row',
  gap: '$spacing4',
  padding: '$spacing4',
  borderRadius: '$rounded12',
  backgroundColor: '$surface1',
  borderWidth: 1,
  borderColor: '$surface3',
  maxWidth: '100%',
  $md: { width: '100%', justifyContent: 'space-between' },
})

const SegmentButton = styled(Flex, {
  minWidth: 40,
  minHeight: 32,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: '$spacing10',
  borderRadius: '$rounded8',
  cursor: 'pointer',
  animation: 'quick',
  $md: { flex: 1, minWidth: 0, paddingHorizontal: '$spacing6' },
  hoverStyle: { backgroundColor: '$surface3' },
  variants: {
    active: {
      true: { backgroundColor: '$accent1', hoverStyle: { backgroundColor: '$accent1' } },
    },
  } as const,
})

const ChartEmpty = styled(Flex, {
  height: 360,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$spacing8',
  paddingHorizontal: '$spacing24',
  borderRadius: '$rounded16',
  backgroundColor: '$surface1',
  borderWidth: 1,
  borderColor: '$surface3',
})

// Subtle moving citrus shimmer for the empty chart surface (high-end touch).
const CHART_SHIMMER = {
  backgroundImage:
    'linear-gradient(100deg, rgba(247,145,26,0) 35%, rgba(247,145,26,0.08) 50%, rgba(247,145,26,0) 65%)',
  backgroundSize: '220% 100%',
  animation: 'lp-shimmer 3.6s linear infinite',
} as const

const AddressRow = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing8',
  flexWrap: 'wrap',
})

const InlineLink = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing4',
  cursor: 'pointer',
  hoverStyle: { opacity: 0.7 },
})

export default function TokenDetail() {
  const { tokenAddress } = useParams<{ tokenAddress: string }>()
  const navigate = useNavigate()
  const account = useAccount()
  const [chartInterval, setChartInterval] = useState<LaunchpadCandleInterval>('5m')
  const [chartPriceUnit, setChartPriceUnit] = useState<ChartPriceUnit>('usd')

  const { data: launchpadData } = useLaunchpadToken(tokenAddress)
  const chainId = (launchpadData?.token.chainId as UniverseChainId | undefined) ?? UniverseChainId.CitreaTestnet

  const {
    name,
    symbol,
    graduated,
    canGraduate,
    progress,
    reserves,
    baseAsset,
    v2Pair,
    isLoading,
    refetch: refetchBondingCurve,
  } = useBondingCurveToken(tokenAddress, chainId)

  const { tokenInfo } = useTokenInfo(tokenAddress, chainId)
  const { data: metadata } = useTokenMetadata(launchpadData?.token.metadataURI)
  const { data: candlesData, isLoading: candlesLoading } = useLaunchpadCandles({
    address: tokenAddress,
    chainId: launchpadData?.token.chainId,
    interval: chartInterval,
    trader: account.address,
  })
  const [showBondingModal, setShowBondingModal] = useState(false)

  const {
    priceFormatted: currentPrice,
    marketCapFormatted: marketCap,
    liquidityFormatted: liquidity,
  } = useLaunchpadTokenPrice({
    tokenAddress,
    graduated,
    v2Pair,
    baseAsset,
    bondingCurveReserves: reserves,
    chainId,
  })

  const displayName = name || launchpadData?.token.name || 'Unknown Token'
  const displaySymbol = symbol || launchpadData?.token.symbol || '???'
  const displayGraduated = graduated || launchpadData?.token.graduated || false
  const displayCanGraduate = canGraduate || launchpadData?.token.canGraduate || false
  const displayBaseAsset = baseAsset || launchpadData?.token.baseAsset
  const displayV2Pair = v2Pair || launchpadData?.token.v2Pair || undefined
  const indexedProgress = launchpadData?.token.progress
    ? launchpadData.token.progress > 100
      ? launchpadData.token.progress / 100
      : launchpadData.token.progress
    : 0
  const displayProgress = displayGraduated ? 100 : progress || indexedProgress

  const handleBack = useCallback(() => {
    navigate('/launchpad')
  }, [navigate])

  const handleCopyAddress = useCallback(() => {
    if (tokenAddress) {
      navigator.clipboard.writeText(tokenAddress)
    }
  }, [tokenAddress])

  const handleOpenExplorer = useCallback(() => {
    if (tokenAddress) {
      window.open(getExplorerLink({ chainId, data: tokenAddress, type: ExplorerDataType.ADDRESS }), '_blank')
    }
  }, [tokenAddress, chainId])

  const volumeValue = useMemo(() => {
    if (!launchpadData?.token.totalVolumeBase) {
      return null
    }
    return Number(formatUnits(BigInt(launchpadData.token.totalVolumeBase), 18))
  }, [launchpadData?.token.totalVolumeBase])

  const volume = volumeValue?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '0'
  const totalTrades = (launchpadData?.token.totalBuys ?? 0) + (launchpadData?.token.totalSells ?? 0)
  const devBuyBaseAmount = launchpadData?.token.devBuyBaseAmount
    ? Number(formatUnits(BigInt(launchpadData.token.devBuyBaseAmount), 18)).toLocaleString(undefined, {
        maximumFractionDigits: 6,
      })
    : null
  const devBuyTokenAmount = launchpadData?.token.devBuyTokenAmount
    ? Number(formatUnits(BigInt(launchpadData.token.devBuyTokenAmount), 18)).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })
    : null

  const latestCandle = candlesData?.candles[candlesData.candles.length - 1]
  const latestChartPriceValue = candlesData?.latest?.price ?? latestCandle?.close ?? null

  const chartData = useMemo<PriceChartData[]>(() => {
    const real =
      candlesData?.candles.map((candle) => ({
        time: candle.time as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        value: candle.close,
      })) ?? []
    return real
  }, [candlesData?.candles])

  const latestChartPrice = latestChartPriceValue
    ? latestChartPriceValue.toLocaleString(undefined, { maximumSignificantDigits: 6 })
    : null
  const fallbackMarketCap = latestChartPriceValue ? latestChartPriceValue * LAUNCHPAD_TOKEN_TOTAL_SUPPLY : null
  const displayMarketCap =
    marketCap && !['0', 'N/A', '...'].includes(marketCap)
      ? marketCap
      : fallbackMarketCap?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? marketCap

  const chartValueFormatter = useCallback(
    (value: number | undefined) => {
      const formatted =
        chartPriceUnit === 'usd'
          ? typeof value === 'number' && Number.isFinite(value)
            ? `$${value.toLocaleString(undefined, { maximumSignificantDigits: 6 })}`
            : '-'
          : typeof value === 'number' && Number.isFinite(value)
            ? `${value.toLocaleString(undefined, { maximumSignificantDigits: 8 })} JUSD`
            : '-'
      return (
        <Text variant="heading2" color="$neutral1">
          {formatted}
        </Text>
      )
    },
    [chartPriceUnit],
  )

  const tokensRemaining = useMemo(() => {
    if (!reserves) {
      return '0'
    }
    return Number(formatUnits(reserves.realToken, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 })
  }, [reserves])

  const creatorAddress = tokenInfo?.creator ?? launchpadData?.token.creator
  const creatorShort = useMemo(() => {
    if (!creatorAddress) {
      return '...'
    }
    return `${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}`
  }, [creatorAddress])

  const createdDate = useMemo(() => {
    const timestamp =
      tokenInfo?.timestamp ?? (launchpadData?.token.createdAt ? Number(launchpadData.token.createdAt) : null)
    if (!timestamp) {
      return ''
    }
    return new Date(timestamp * 1000).toLocaleDateString()
  }, [launchpadData?.token.createdAt, tokenInfo?.timestamp])

  const displayPrice = latestChartPrice || currentPrice

  if (isLoading) {
    return (
      <PageContainer>
        <ContentWrapper>
          <Text variant="body1" color="$neutral2">
            Loading token...
          </Text>
        </ContentWrapper>
      </PageContainer>
    )
  }

  if (!tokenAddress) {
    return (
      <PageContainer>
        <ContentWrapper>
          <Text variant="body1" color="$neutral2">
            Token not found
          </Text>
        </ContentWrapper>
      </PageContainer>
    )
  }

  return (
    <Trace logImpression page={InterfacePageName.LaunchpadTokenDetailPage}>
      <PageContainer>
        <LaunchpadBackdrop />
        <ContentWrapper>
          <BackButton onPress={handleBack}>
            <BackArrow size="$icon.20" color="$neutral2" />
            <Text variant="body2" color="$neutral2">
              Back to Launchpad
            </Text>
          </BackButton>

          {/* Identity + headline price */}
          <Panel>
            <Flex flexDirection="row" justifyContent="space-between" alignItems="flex-start" gap="$spacing20" flexWrap="wrap">
              <Flex flexDirection="row" gap="$spacing16" flex={1} minWidth={240}>
                <TokenLogo metadataURI={launchpadData?.token.metadataURI} symbol={displaySymbol || '?'} size={64} />
                <Flex gap="$spacing4" minWidth={0} flex={1}>
                  <Flex flexDirection="row" alignItems="center" gap="$spacing8" flexWrap="wrap">
                    <TokenName>{displayName}</TokenName>
                    {displayGraduated ? (
                      <GraduatedBadge size="md">
                        <Text variant="body3" color="$statusSuccess" fontWeight="700">
                          Graduated
                        </Text>
                      </GraduatedBadge>
                    ) : displayCanGraduate ? (
                      <GraduatedBadge size="md" backgroundColor="$accent2">
                        <Text variant="body3" color="$accent1" fontWeight="700">
                          Graduating
                        </Text>
                      </GraduatedBadge>
                    ) : null}
                  </Flex>
                  <Flex flexDirection="row" alignItems="center" gap="$spacing12" flexWrap="wrap">
                    <TokenSymbol>${displaySymbol}</TokenSymbol>
                    <AddressRow>
                      <Text variant="body3" color="$neutral3">
                        {tokenAddress.slice(0, 8)}...{tokenAddress.slice(-6)}
                      </Text>
                      <InlineLink onPress={handleCopyAddress}>
                        <CopyAlt size="$icon.16" color="$neutral3" />
                      </InlineLink>
                      <InlineLink onPress={handleOpenExplorer}>
                        <ExternalLink size="$icon.16" color="$neutral3" />
                      </InlineLink>
                    </AddressRow>
                  </Flex>
                  {(metadata?.external_url ||
                    getSocialLink(metadata, 'Twitter') ||
                    getSocialLink(metadata, 'Telegram')) && (
                    <Flex flexDirection="row" gap="$spacing12" flexWrap="wrap" marginTop="$spacing2">
                      {metadata?.external_url && (
                        <InlineLink onPress={() => window.open(metadata.external_url, '_blank', 'noopener')}>
                          <Text variant="body3" color="$accent1">
                            Website
                          </Text>
                          <ExternalLink size="$icon.12" color="$accent1" />
                        </InlineLink>
                      )}
                      {getSocialLink(metadata, 'Twitter') && (
                        <InlineLink
                          onPress={() => {
                            const handle = extractSocialHandle(getSocialLink(metadata, 'Twitter'), 'Twitter')
                            if (handle) {
                              window.open(`https://x.com/${handle}`, '_blank', 'noopener')
                            }
                          }}
                        >
                          <Text variant="body3" color="$accent1">
                            Twitter
                          </Text>
                          <ExternalLink size="$icon.12" color="$accent1" />
                        </InlineLink>
                      )}
                      {getSocialLink(metadata, 'Telegram') && (
                        <InlineLink
                          onPress={() => {
                            const handle = extractSocialHandle(getSocialLink(metadata, 'Telegram'), 'Telegram')
                            if (handle) {
                              window.open(`https://t.me/${handle}`, '_blank', 'noopener')
                            }
                          }}
                        >
                          <Text variant="body3" color="$accent1">
                            Telegram
                          </Text>
                          <ExternalLink size="$icon.12" color="$accent1" />
                        </InlineLink>
                      )}
                    </Flex>
                  )}
                </Flex>
              </Flex>
              <Flex gap="$spacing2" alignItems="flex-end" minWidth={140}>
                <Text variant="body3" color="$neutral2">
                  Price
                </Text>
                <Text variant="heading2" color="$neutral1" fontWeight="700" numberOfLines={1}>
                  {displayPrice} <Text variant="body2" color="$neutral2">JUSD</Text>
                </Text>
              </Flex>
            </Flex>
          </Panel>

          {/* Key metrics */}
          <StatGrid>
            <StatCard>
              <StatLabel variant="body4" color="$neutral3">
                Market cap
              </StatLabel>
              <BigStatValue>{displayMarketCap} JUSD</BigStatValue>
            </StatCard>
            <StatCard>
              <StatLabel variant="body4" color="$neutral3">
                Liquidity
              </StatLabel>
              <BigStatValue>{liquidity} JUSD</BigStatValue>
            </StatCard>
            <StatCard>
              <StatLabel variant="body4" color="$neutral3">
                Volume
              </StatLabel>
              <BigStatValue>{volume} JUSD</BigStatValue>
            </StatCard>
            <StatCard>
              <StatLabel variant="body4" color="$neutral3">
                Trades
              </StatLabel>
              <BigStatValue>{totalTrades.toLocaleString()}</BigStatValue>
            </StatCard>
          </StatGrid>

          <MainContent>
            <LeftColumn>
              <BondingCurveHero
                progress={displayProgress}
                graduated={displayGraduated}
                tokensRemaining={tokensRemaining}
                onInfo={() => setShowBondingModal(true)}
              />

              {/* Chart */}
              <Panel>
                <ChartHeaderRow>
                  <Flex gap="$spacing2">
                    <CardTitle>Price chart</CardTitle>
                    <Text variant="body3" color="$neutral2">
                      {candlesData?.source === 'bonding_curve_pre_graduation'
                        ? 'Bonding curve history before graduation'
                        : 'Bonding curve execution price'}
                    </Text>
                  </Flex>
                  <ChartControls>
                    <SegmentedControl aria-label="Chart price unit" role="tablist">
                      {(['usd', 'jusd'] as const).map((unit) => (
                        <SegmentButton
                          key={unit}
                          aria-selected={chartPriceUnit === unit}
                          active={chartPriceUnit === unit}
                          onPress={() => setChartPriceUnit(unit)}
                          role="tab"
                        >
                          <Text variant="buttonLabel4" color={chartPriceUnit === unit ? '$white' : '$neutral2'}>
                            {unit === 'usd' ? 'USD' : 'JUSD'}
                          </Text>
                        </SegmentButton>
                      ))}
                    </SegmentedControl>
                    <SegmentedControl aria-label="Chart interval" role="tablist">
                      {(['1m', '5m', '15m', '1h', '4h', '1d'] as const).map((interval) => (
                        <SegmentButton
                          key={interval}
                          aria-selected={chartInterval === interval}
                          active={chartInterval === interval}
                          onPress={() => setChartInterval(interval)}
                          role="tab"
                        >
                          <Text variant="buttonLabel4" color={chartInterval === interval ? '$white' : '$neutral2'}>
                            {interval}
                          </Text>
                        </SegmentButton>
                      ))}
                    </SegmentedControl>
                  </ChartControls>
                </ChartHeaderRow>

                {chartData.length > 0 ? (
                  <PriceChart
                    data={chartData}
                    height={360}
                    type={PriceChartType.LINE}
                    stale={false}
                    variant="launchpad"
                    valueFormatter={chartValueFormatter}
                  />
                ) : (
                  <ChartEmpty style={CHART_SHIMMER}>
                    {candlesLoading ? (
                      <Text variant="body2" color="$neutral2">
                        Loading chart…
                      </Text>
                    ) : (
                      <>
                        <Text variant="subheading2" color="$neutral1" fontWeight="600">
                          Price history coming soon
                        </Text>
                        <Text variant="body3" color="$neutral3" textAlign="center">
                          Live candles appear here once trading data is indexed. Recent trades are shown below.
                        </Text>
                      </>
                    )}
                  </ChartEmpty>
                )}

                {candlesData?.userTrades?.length ? (
                  <Flex gap="$spacing8">
                    <Text variant="body3" color="$neutral2">
                      Your trades in this range
                    </Text>
                    {candlesData.userTrades.slice(-5).map((trade) => (
                      <StatRow key={`${trade.txHash}-${trade.time}`} paddingVertical="$spacing2">
                        <StatLabel variant="body3">{trade.side === 'buy' ? 'Buy' : 'Sell'}</StatLabel>
                        <StatValue variant="body3">
                          {trade.price.toLocaleString(undefined, { maximumSignificantDigits: 6 })} JUSD
                        </StatValue>
                      </StatRow>
                    ))}
                  </Flex>
                ) : null}
              </Panel>

              {/* Live activity (real trades) */}
              <Panel>
                <Flex flexDirection="row" justifyContent="space-between" alignItems="center">
                  <CardTitle>Recent activity</CardTitle>
                  <Text variant="body4" color="$neutral3">
                    {totalTrades.toLocaleString()} trades
                  </Text>
                </Flex>
                <ActivityTable address={tokenAddress} symbol={displaySymbol} chainId={chainId} />
              </Panel>
            </LeftColumn>

            <RightColumn>
              {displayBaseAsset && (
                <BuySellPanel
                  tokenAddress={tokenAddress}
                  tokenSymbol={displaySymbol}
                  baseAsset={displayBaseAsset}
                  graduated={displayGraduated}
                  canGraduate={displayCanGraduate}
                  chainId={chainId}
                  reserves={reserves}
                  onTransactionComplete={refetchBondingCurve}
                  onGraduateComplete={refetchBondingCurve}
                />
              )}

              {/* Token info */}
              <Panel>
                <CardTitle>Token info</CardTitle>
                <Flex gap="$spacing2">
                  <StatRow paddingVertical="$spacing4">
                    <StatLabel variant="body2">Total supply</StatLabel>
                    <StatValue variant="body2">1,000,000,000</StatValue>
                  </StatRow>
                  {launchpadData?.token.devBuyEnabled && (
                    <>
                      <StatRow paddingVertical="$spacing4">
                        <StatLabel variant="body2">Dev buy</StatLabel>
                        <StatValue variant="body2">{devBuyBaseAmount ?? '0'} JUSD</StatValue>
                      </StatRow>
                      <StatRow paddingVertical="$spacing4">
                        <StatLabel variant="body2">Dev buy tokens</StatLabel>
                        <StatValue variant="body2">{devBuyTokenAmount ?? '0'}</StatValue>
                      </StatRow>
                    </>
                  )}
                  <StatRow paddingVertical="$spacing4">
                    <StatLabel variant="body2">Creator</StatLabel>
                    <InlineLink
                      onPress={() => {
                        if (creatorAddress) {
                          window.open(
                            getExplorerLink({ chainId, data: creatorAddress, type: ExplorerDataType.ADDRESS }),
                            '_blank',
                          )
                        }
                      }}
                    >
                      <StatValue variant="body2">{creatorShort}</StatValue>
                      <ExternalLink size="$icon.16" color="$neutral2" />
                    </InlineLink>
                  </StatRow>
                  {createdDate && (
                    <StatRow paddingVertical="$spacing4">
                      <StatLabel variant="body2">Created</StatLabel>
                      <StatValue variant="body2">{createdDate}</StatValue>
                    </StatRow>
                  )}
                  {displayGraduated && displayV2Pair && (
                    <StatRow paddingVertical="$spacing4">
                      <StatLabel variant="body2">V2 pair</StatLabel>
                      <InlineLink
                        onPress={() => {
                          window.open(
                            getExplorerLink({ chainId, data: displayV2Pair, type: ExplorerDataType.ADDRESS }),
                            '_blank',
                          )
                        }}
                      >
                        <StatValue variant="body2">
                          {displayV2Pair.slice(0, 6)}...{displayV2Pair.slice(-4)}
                        </StatValue>
                        <ExternalLink size="$icon.16" color="$neutral2" />
                      </InlineLink>
                    </StatRow>
                  )}
                </Flex>
              </Panel>

              {/* About */}
              {metadata?.description && (
                <Panel>
                  <CardTitle>About</CardTitle>
                  <Text variant="body2" color="$neutral2">
                    {metadata.description}
                  </Text>
                </Panel>
              )}
            </RightColumn>
          </MainContent>
        </ContentWrapper>
      </PageContainer>

      <Modal
        name={ModalName.AccountEdit}
        maxWidth={420}
        isModalOpen={showBondingModal}
        onClose={() => setShowBondingModal(false)}
        padding={0}
      >
        <Flex gap="$spacing16" padding="$spacing24">
          <Flex flexDirection="row" justifyContent="space-between" alignItems="center">
            <Text variant="subheading1" color="$neutral1">
              About Bonding Curves
            </Text>
            <ModalCloseIcon onClose={() => setShowBondingModal(false)} />
          </Flex>
          <Text variant="body2" color="$neutral2">
            Tokens start on a bonding curve where price increases as more tokens are purchased. When 100% of tokens are
            sold from the curve, the token graduates to JuiceSwap V2 with permanently locked liquidity.
          </Text>
          <Flex gap="$spacing8">
            <Text variant="body3" color="$neutral2">
              • 1% of all trade volume flows to JUICE governance token holders
            </Text>
            <Text variant="body3" color="$neutral2">
              • ~79.31% sold on bonding curve
            </Text>
            <Text variant="body3" color="$neutral2">
              • ~20.69% reserved for DEX liquidity
            </Text>
            <Text variant="body3" color="$neutral2">
              • LP tokens burned forever
            </Text>
          </Flex>
        </Flex>
      </Modal>
    </Trace>
  )
}
