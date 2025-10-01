import { useEffect, useMemo, useState } from 'react'
import { lazy, Suspense } from 'react'
import { Flex, Text, styled } from 'ui/src'
import { Chart } from 'ui/src/components/icons/Chart'

const ApexChart = lazy(() => import('react-apexcharts'))

const AnalyticsContainer = styled(Flex, {
  gap: '$spacing32',
  width: '100%',
})

const Section = styled(Flex, {
  gap: '$spacing16',
  padding: '$spacing24',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  borderWidth: 1,
  borderColor: '$surface3',
})

const SectionHeader = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing12',
  paddingBottom: '$spacing12',
  borderBottomWidth: 1,
  borderBottomColor: '$surface3',
})

const SectionTitle = styled(Text, {
  variant: 'heading3',
  color: '$neutral1',
  fontWeight: '600',
})

const StatsGrid = styled(Flex, {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: '$spacing16',
})

const StatCard = styled(Flex, {
  flex: 1,
  minWidth: 200,
  gap: '$spacing8',
  padding: '$spacing16',
  backgroundColor: '$surface1',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderColor: '$surface3',
})

const StatLabel = styled(Text, {
  variant: 'body3',
  color: '$neutral2',
})

const StatValue = styled(Text, {
  variant: 'heading3',
  color: '$neutral1',
  fontWeight: 'bold',
})

const ChartContainer = styled(Flex, {
  position: 'relative',
  width: '100%',
  height: 300,
  backgroundColor: '$surface1',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderColor: '$surface3',
  overflow: 'hidden',
})

const ChartOverlay = styled(Flex, {
  position: 'absolute',
  top: '$spacing20',
  left: '$spacing20',
  zIndex: 10,
  gap: '$spacing8',
})

const TimeframeSelector = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '$spacing4',
  paddingVertical: '$spacing16',
})

const TimeframeButton = styled(Flex, {
  paddingHorizontal: '$spacing16',
  paddingVertical: '$spacing8',
  borderRadius: '$rounded8',
  cursor: 'pointer',
  backgroundColor: '$surface3',
  variants: {
    selected: {
      true: {
        backgroundColor: '$accent1',
      },
    },
  },
  hoverStyle: {
    opacity: 0.8,
  },
})

const TimeframeButtonText = styled(Text, {
  variant: 'body3',
  fontWeight: '500',
  variants: {
    selected: {
      true: {
        color: '$white',
      },
      false: {
        color: '$neutral2',
      },
    },
  },
})

const LoadingText = styled(Text, {
  variant: 'body2',
  color: '$neutral2',
  textAlign: 'center',
  paddingVertical: '$spacing24',
})

const ErrorText = styled(Text, {
  variant: 'body2',
  color: '$statusCritical',
  textAlign: 'center',
  paddingVertical: '$spacing16',
})

interface DailyGrowthData {
  date: string
  newUsers: number
  cumulative: number
  uniqueActiveUsers: number
}

interface DailyGrowthResponse {
  chainId: number
  period: string
  data: DailyGrowthData[]
  summary: {
    totalDays: number
    totalNewUsers: number
    averageDaily: number
  }
}

enum Timeframe {
  WEEK = '1W',
  MONTH = '1M',
  QUARTER = '1Q',
  ALL = 'All',
}

const getStartTimestampByTimeframe = (timeframe: Timeframe) => {
  switch (timeframe) {
    case Timeframe.ALL:
      return 0
    case Timeframe.WEEK:
      return Date.now() - 7 * 24 * 60 * 60 * 1000
    case Timeframe.MONTH:
      return Date.now() - 30 * 24 * 60 * 60 * 1000
    case Timeframe.QUARTER:
      return Date.now() - 90 * 24 * 60 * 60 * 1000
    default:
      return 0
  }
}

export default function CampaignAnalytics() {
  const [dailyGrowth, setDailyGrowth] = useState<DailyGrowthResponse | null>(null)
  const [isLoadingGrowth, setIsLoadingGrowth] = useState(true)
  const [growthError, setGrowthError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<Timeframe>(Timeframe.ALL)

  useEffect(() => {
    const fetchDailyGrowth = async () => {
      try {
        setIsLoadingGrowth(true)
        setGrowthError(null)
        const baseUrl = process.env.REACT_APP_PONDER_JUICESWAP_URL || 'https://ponder.juiceswap.com'
        const response = await fetch(`${baseUrl}/campaign/daily-growth?days=90&chainId=5115`)

        if (!response.ok) {
          throw new Error('Failed to fetch daily growth data')
        }

        const data = await response.json()
        setDailyGrowth(data)
      } catch (error) {
        setGrowthError('Unable to load daily growth data')
      } finally {
        setIsLoadingGrowth(false)
      }
    }

    fetchDailyGrowth()
  }, [])

  const startTrades = getStartTimestampByTimeframe(timeframe)

  const filteredGrowthData = useMemo(
    () =>
      dailyGrowth?.data.filter((day) => {
        return new Date(day.date).getTime() > startTrades
      }) || [],
    [dailyGrowth?.data, startTrades]
  )

  const maxCumulative = useMemo(
    () => Math.max(...filteredGrowthData.map((d) => d.cumulative), 1),
    [filteredGrowthData]
  )

  const currentTotalUsers = dailyGrowth?.data.length
    ? dailyGrowth.data[dailyGrowth.data.length - 1].cumulative
    : 0

  return (
    <AnalyticsContainer>
      {/* Campaign Participants Timeline */}
      <Section>
        <SectionHeader>
          <Chart size="$icon.20" color="$accent1" />
          <SectionTitle>Campaign Participants Over Time</SectionTitle>
        </SectionHeader>

        {isLoadingGrowth && <LoadingText>Loading campaign participation data...</LoadingText>}
        {growthError && <ErrorText>{growthError}</ErrorText>}

        {!isLoadingGrowth && !growthError && dailyGrowth && (
          <>
            <StatsGrid>
              <StatCard>
                <StatLabel>Total Campaign Participants</StatLabel>
                <StatValue>{currentTotalUsers.toLocaleString()}</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Average Daily Growth</StatLabel>
                <StatValue>{dailyGrowth.summary.averageDaily.toLocaleString()}</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Days Running</StatLabel>
                <StatValue>{dailyGrowth.summary.totalDays}</StatValue>
              </StatCard>
            </StatsGrid>

            <ChartContainer>
              <ChartOverlay>
                <StatValue>{currentTotalUsers.toLocaleString()}</StatValue>
                <StatLabel>Total Participants</StatLabel>
              </ChartOverlay>
              {typeof window !== 'undefined' && (
                <Suspense fallback={<LoadingText>Loading chart...</LoadingText>}>
                  <ApexChart
                    type="area"
                    height={300}
                    options={{
                    theme: {
                      monochrome: {
                        color: '#FF6B00',
                        enabled: true,
                      },
                    },
                    chart: {
                      type: 'area',
                      height: 300,
                      dropShadow: {
                        enabled: false,
                      },
                      toolbar: {
                        show: false,
                      },
                      zoom: {
                        enabled: false,
                      },
                      background: 'transparent',
                    },
                    stroke: {
                      width: 3,
                      curve: 'smooth',
                    },
                    dataLabels: {
                      enabled: false,
                    },
                    grid: {
                      show: false,
                    },
                    xaxis: {
                      type: 'datetime',
                      labels: {
                        show: false,
                      },
                      axisBorder: {
                        show: false,
                      },
                      axisTicks: {
                        show: false,
                      },
                    },
                    yaxis: {
                      show: false,
                      min: 0,
                      max: maxCumulative * 1.2,
                    },
                    fill: {
                      colors: ['#FF6B0099'],
                      type: 'gradient',
                      gradient: {
                        type: 'vertical',
                        opacityFrom: 1,
                        opacityTo: 0.95,
                        gradientToColors: ['#FFF5ED'],
                      },
                    },
                    tooltip: {
                      enabled: true,
                      theme: 'dark',
                      style: {
                        fontSize: '14px',
                      },
                      x: {
                        format: 'dd MMM yyyy',
                      },
                      y: {
                        formatter: (value: number) => value.toLocaleString(),
                      },
                    },
                  }}
                  series={[
                    {
                      name: 'Total Participants',
                      data: filteredGrowthData.map((day) => {
                        return [new Date(day.date).getTime(), day.cumulative]
                      }),
                    },
                  ]}
                  />
                </Suspense>
              )}
            </ChartContainer>

            <TimeframeSelector>
              {Object.values(Timeframe).map((_timeframe) => (
                <TimeframeButton
                  key={_timeframe}
                  selected={_timeframe === timeframe}
                  onPress={() => setTimeframe(_timeframe)}
                >
                  <TimeframeButtonText selected={_timeframe === timeframe}>{_timeframe}</TimeframeButtonText>
                </TimeframeButton>
              ))}
            </TimeframeSelector>
          </>
        )}
      </Section>

    </AnalyticsContainer>
  )
}
