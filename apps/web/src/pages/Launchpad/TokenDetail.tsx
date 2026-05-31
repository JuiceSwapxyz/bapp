import { PriceChart, type PriceChartData } from 'components/Charts/PriceChart'
import { PriceChartType } from 'components/Charts/utils'
import { useAccount } from 'hooks/useAccount'
import { useBondingCurveToken } from 'hooks/useBondingCurveToken'
import { useLaunchpadTokenPrice } from 'hooks/useLaunchpadTokenPrice'
import { useLaunchpadCandles, useLaunchpadToken, type LaunchpadCandleInterval } from 'hooks/useLaunchpadTokens'
import { useTokenInfo } from 'hooks/useTokenFactory'
import { getSocialLink, useTokenMetadata } from 'hooks/useTokenMetadata'
import type { UTCTimestamp } from 'lightweight-charts'
import { BuySellPanel } from 'pages/Launchpad/components/BuySellPanel'
import { TokenLogo } from 'pages/Launchpad/components/TokenLogo'
import {
  BackButton,
  Card,
  GraduatedBadge,
  ProgressBar,
  ProgressFill,
  StatLabel,
  StatRow,
  StatValue,
  getProgressGradient,
} from 'pages/Launchpad/components/shared'
import { LAUNCHPAD_TOKEN_TOTAL_SUPPLY } from 'pages/Launchpad/constants'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Flex, ModalCloseIcon, Text, styled } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
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

// Extract social handle from various formats: @handle, handle, or full URL
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

const USD_AMOUNT_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const USD_PRICE_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumSignificantDigits: 6,
})

function formatUsdAmount(value: number | null): string {
  return typeof value === 'number' && Number.isFinite(value) ? USD_AMOUNT_FORMATTER.format(value) : '-'
}

function formatUsdPrice(value: number | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? USD_PRICE_FORMATTER.format(value) : '-'
}

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
  gap: '$spacing24',
})

const HeaderSection = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: '$spacing24',
  flexWrap: 'wrap',
})

const TokenInfo = styled(Flex, {
  flex: 1,
  gap: '$spacing8',
  minWidth: 200,
})

const TokenName = styled(Text, {
  variant: 'heading2',
  color: '$neutral1',
  fontWeight: 'bold',
})

const TokenSymbol = styled(Text, {
  variant: 'body1',
  color: '$neutral2',
})

const MainContent = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'stretch',
  gap: '$spacing24',
  $md: {
    flexDirection: 'column',
  },
})

const LeftColumn = styled(Flex, {
  flex: 2,
  flexShrink: 1,
  minWidth: 0,
  gap: '$spacing24',
})

const RightColumn = styled(Flex, {
  flex: 1,
  flexShrink: 0,
  width: 360,
  maxWidth: '100%',
  alignSelf: 'stretch',
  gap: '$spacing24',
  overflow: 'hidden',
  $md: {
    width: '100%',
    flexShrink: 1,
  },
})

const FullWidthStack = styled(Flex, {
  gap: '$spacing24',
})

const ChartCard = styled(Card, {
  borderTopWidth: 2,
  borderTopColor: '$accent1',
})

const CardTitle = styled(Text, {
  variant: 'body1',
  color: '$neutral1',
  fontWeight: '600',
})

const ChartStatsGrid = styled(Flex, {
  flexDirection: 'row',
  gap: '$spacing12',
  flexWrap: 'wrap',
})

const ChartStat = styled(Flex, {
  flex: 1,
  minWidth: 150,
  minHeight: 76,
  justifyContent: 'center',
  gap: '$spacing6',
  backgroundColor: '$surface1',
  borderRadius: '$rounded16',
  borderWidth: 1,
  borderColor: '$surface3',
  padding: '$spacing16',
})

const ChartStatValue = styled(StatValue, {
  variant: 'subheading2',
  fontWeight: '700',
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
  $md: {
    width: '100%',
    flexDirection: 'column',
  },
})

const SegmentedControl = styled(Flex, {
  flexDirection: 'row',
  gap: '$spacing4',
  padding: '$spacing4',
  borderRadius: '$rounded16',
  borderWidth: 1,
  borderColor: '$surface3',
  backgroundColor: '$surface1',
  maxWidth: '100%',
  $md: {
    width: '100%',
    justifyContent: 'space-between',
  },
})

const SegmentButton = styled(Flex, {
  minWidth: 40,
  minHeight: 34,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: '$spacing10',
  borderRadius: '$rounded12',
  cursor: 'pointer',
  $md: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: '$spacing6',
  },
  hoverStyle: {
    backgroundColor: '$surface2',
  },
  variants: {
    active: {
      true: {
        backgroundColor: '$accent1',
      },
    },
  } as const,
})

const AddressRow = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing8',
})

const AddressLink = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing4',
  cursor: 'pointer',
  hoverStyle: {
    opacity: 0.7,
  },
})

export default function TokenDetail() {
  const { tokenAddress } = useParams<{ tokenAddress: string }>()
  const navigate = useNavigate()
  const account = useAccount()
  const [chartInterval, setChartInterval] = useState<LaunchpadCandleInterval>('5m')
  const [chartPriceUnit, setChartPriceUnit] = useState<ChartPriceUnit>('usd')

  // First, fetch the token data from API to get the correct chainId
  const { data: launchpadData } = useLaunchpadToken(tokenAddress)

  // Use the token's chainId (from API) for all operations - this ensures we read from the correct chain
  // even if the user is connected to a different network. Default to testnet while loading.
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

  // Use unified price hook for graduated/non-graduated tokens
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
      const url = getExplorerLink({
        chainId,
        data: tokenAddress,
        type: ExplorerDataType.ADDRESS,
      })
      window.open(url, '_blank')
    }
  }, [tokenAddress, chainId])

  // Format volume from indexed data
  const volumeValue = useMemo(() => {
    if (!launchpadData?.token.totalVolumeBase) {
      return null
    }
    return Number(formatUnits(BigInt(launchpadData.token.totalVolumeBase), 18))
  }, [launchpadData?.token.totalVolumeBase])

  const volume = volumeValue?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '0'
  const volumeUsd = formatUsdAmount(volumeValue)

  // Total trades from indexed data
  const totalTrades = (launchpadData?.token.totalBuys ?? 0) + (launchpadData?.token.totalSells ?? 0)

  const latestCandle = candlesData?.candles[candlesData.candles.length - 1]
  const latestChartPriceValue = candlesData?.latest?.price ?? latestCandle?.close ?? null

  const chartData = useMemo<PriceChartData[]>(() => {
    return (
      candlesData?.candles.map((candle) => ({
        time: candle.time as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        value: candle.close,
      })) ?? []
    )
  }, [candlesData?.candles])

  const latestChartPrice = latestChartPriceValue
    ? latestChartPriceValue.toLocaleString(undefined, { maximumSignificantDigits: 6 })
    : null
  const fallbackMarketCap = latestChartPriceValue ? latestChartPriceValue * LAUNCHPAD_TOKEN_TOTAL_SUPPLY : null
  const displayMarketCap =
    marketCap && !['0', 'N/A', '...'].includes(marketCap)
      ? marketCap
      : fallbackMarketCap?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? marketCap
  const displayMarketCapUsd = formatUsdAmount(fallbackMarketCap)

  const chartValueFormatter = useCallback(
    (value: number | undefined) => {
      const formatted =
        chartPriceUnit === 'usd'
          ? formatUsdPrice(value)
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
        <ContentWrapper>
          <BackButton onPress={handleBack}>
            <BackArrow size="$icon.20" color="$neutral2" />
            <Text variant="body2" color="$neutral2">
              Back to Launchpad
            </Text>
          </BackButton>

          <HeaderSection>
            <TokenLogo metadataURI={launchpadData?.token.metadataURI} symbol={displaySymbol || '?'} size={80} />
            <TokenInfo>
              <Flex flexDirection="row" alignItems="center" gap="$spacing12">
                <TokenName>{displayName}</TokenName>
                {displayGraduated && (
                  <GraduatedBadge size="md">
                    <Text variant="body3" color="$statusSuccess" fontWeight="600">
                      Graduated
                    </Text>
                  </GraduatedBadge>
                )}
              </Flex>
              <TokenSymbol>${displaySymbol}</TokenSymbol>
              <AddressRow>
                <Text variant="body3" color="$neutral3">
                  {tokenAddress.slice(0, 10)}...{tokenAddress.slice(-8)}
                </Text>
                <AddressLink onPress={handleCopyAddress}>
                  <CopyAlt size="$icon.16" color="$neutral3" />
                </AddressLink>
                <AddressLink onPress={handleOpenExplorer}>
                  <ExternalLink size="$icon.16" color="$neutral3" />
                </AddressLink>
              </AddressRow>
              {(metadata?.external_url ||
                getSocialLink(metadata, 'Twitter') ||
                getSocialLink(metadata, 'Telegram')) && (
                <Flex flexDirection="row" gap="$spacing12" flexWrap="wrap" marginTop="$spacing4">
                  {metadata?.external_url && (
                    <AddressLink onPress={() => window.open(metadata.external_url, '_blank', 'noopener')}>
                      <Text variant="body3" color="$accent1">
                        Website
                      </Text>
                      <ExternalLink size="$icon.12" color="$accent1" />
                    </AddressLink>
                  )}
                  {getSocialLink(metadata, 'Twitter') && (
                    <AddressLink
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
                    </AddressLink>
                  )}
                  {getSocialLink(metadata, 'Telegram') && (
                    <AddressLink
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
                    </AddressLink>
                  )}
                </Flex>
              )}
            </TokenInfo>
          </HeaderSection>

          <Card>
            <CardTitle>Bonding Curve Progress</CardTitle>
            <ProgressBar>
              <ProgressFill
                style={{
                  width: `${Math.min(displayProgress, 100)}%`,
                  background: getProgressGradient(displayProgress),
                }}
              />
            </ProgressBar>
            <Flex flexDirection="row" justifyContent="space-between">
              <Text variant="body2" color="$neutral2">
                {displayGraduated ? '100%' : `${displayProgress.toFixed(2)}%`} complete
              </Text>
              <Text variant="body2" color={displayGraduated ? '$statusSuccess' : '$neutral1'}>
                {displayGraduated ? 'Graduated to V2' : `${tokensRemaining} tokens remaining`}
              </Text>
            </Flex>

            {!displayGraduated && (
              <Flex
                flexDirection="row"
                alignItems="center"
                gap="$spacing6"
                marginTop="$spacing4"
                cursor="pointer"
                onPress={() => setShowBondingModal(true)}
                hoverStyle={{ opacity: 0.7 }}
              >
                <Text variant="body3" color="$neutral3">
                  Graduates to V2 at 100% · 1% fee
                </Text>
                <InfoCircle size={14} color="$neutral3" />
              </Flex>
            )}
          </Card>

          <MainContent>
            <LeftColumn>
              <ChartCard>
                <ChartStatsGrid>
                  <ChartStat>
                    <StatLabel variant="body3">Market Cap</StatLabel>
                    <ChartStatValue>{displayMarketCapUsd}</ChartStatValue>
                  </ChartStat>
                  <ChartStat>
                    <StatLabel variant="body3">Volume</StatLabel>
                    <ChartStatValue>{volumeUsd}</ChartStatValue>
                  </ChartStat>
                  <ChartStat>
                    <StatLabel variant="body3">Trades</StatLabel>
                    <ChartStatValue>{totalTrades}</ChartStatValue>
                  </ChartStat>
                </ChartStatsGrid>

                <ChartHeaderRow>
                  <Flex gap="$spacing4">
                    <CardTitle>Price Chart</CardTitle>
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
                  <Flex height={360} alignItems="center" justifyContent="center">
                    <Text variant="body2" color="$neutral2">
                      {candlesLoading ? 'Loading chart...' : 'No chart data yet'}
                    </Text>
                  </Flex>
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
              </ChartCard>
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
                  matchChartHeight
                  onTransactionComplete={refetchBondingCurve}
                  onGraduateComplete={refetchBondingCurve}
                />
              )}
            </RightColumn>
          </MainContent>

          <FullWidthStack>
            {metadata?.description && (
              <Card>
                <CardTitle>About</CardTitle>
                <Text variant="body2" color="$neutral2">
                  {metadata.description}
                </Text>
              </Card>
            )}

            <Card>
              <CardTitle>Token Info</CardTitle>
              <StatRow paddingVertical="$spacing4">
                <StatLabel variant="body2">Current Price</StatLabel>
                <StatValue variant="body2">{latestChartPrice || currentPrice} JUSD</StatValue>
              </StatRow>
              <StatRow paddingVertical="$spacing4">
                <StatLabel variant="body2">Market Cap</StatLabel>
                <StatValue variant="body2">{displayMarketCap} JUSD</StatValue>
              </StatRow>
              <StatRow paddingVertical="$spacing4">
                <StatLabel variant="body2">Liquidity</StatLabel>
                <StatValue variant="body2">{liquidity} JUSD</StatValue>
              </StatRow>
              <StatRow paddingVertical="$spacing4">
                <StatLabel variant="body2">Volume</StatLabel>
                <StatValue variant="body2">{volume} JUSD</StatValue>
              </StatRow>
              <StatRow paddingVertical="$spacing4">
                <StatLabel variant="body2">Trades</StatLabel>
                <StatValue variant="body2">{totalTrades}</StatValue>
              </StatRow>
              <StatRow paddingVertical="$spacing4">
                <StatLabel variant="body2">Total Supply</StatLabel>
                <StatValue variant="body2">1,000,000,000</StatValue>
              </StatRow>
              <StatRow paddingVertical="$spacing4">
                <StatLabel variant="body2">Creator</StatLabel>
                <AddressLink
                  onPress={() => {
                    if (creatorAddress) {
                      const url = getExplorerLink({
                        chainId,
                        data: creatorAddress,
                        type: ExplorerDataType.ADDRESS,
                      })
                      window.open(url, '_blank')
                    }
                  }}
                >
                  <StatValue variant="body2">{creatorShort}</StatValue>
                  <ExternalLink size="$icon.16" color="$neutral2" />
                </AddressLink>
              </StatRow>
              {createdDate && (
                <StatRow paddingVertical="$spacing4">
                  <StatLabel variant="body2">Created</StatLabel>
                  <StatValue variant="body2">{createdDate}</StatValue>
                </StatRow>
              )}
              {displayGraduated && displayV2Pair && (
                <StatRow paddingVertical="$spacing4">
                  <StatLabel variant="body2">V2 Pair</StatLabel>
                  <AddressLink
                    onPress={() => {
                      const url = getExplorerLink({
                        chainId,
                        data: displayV2Pair,
                        type: ExplorerDataType.ADDRESS,
                      })
                      window.open(url, '_blank')
                    }}
                  >
                    <StatValue variant="body2">
                      {displayV2Pair.slice(0, 6)}...{displayV2Pair.slice(-4)}
                    </StatValue>
                    <ExternalLink size="$icon.16" color="$neutral2" />
                  </AddressLink>
                </StatRow>
              )}
            </Card>
          </FullWidthStack>
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
