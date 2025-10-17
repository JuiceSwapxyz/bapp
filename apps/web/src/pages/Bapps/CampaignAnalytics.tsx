import { Suspense, lazy, useEffect, useState } from 'react'
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

interface HourlyCompletionData {
  hour: string
  totalParticipants: number
  completedAllTasks: number
  completionRate: number
}

interface HourlyCompletionStatsResponse {
  chainId: number
  period: string
  data: HourlyCompletionData[]
  summary: {
    totalHours: number
    currentParticipants: number
    currentCompleted: number
    currentCompletionRate: number
  }
}

enum Timeframe {
  WEEK = '1W',
  MONTH = '1M',
  QUARTER = '1Q',
  ALL = 'All',
}

const getHoursByTimeframe = (timeframe: Timeframe): number => {
  switch (timeframe) {
    case Timeframe.WEEK:
      return 168 // 7 days
    case Timeframe.MONTH:
      return 720 // 30 days
    case Timeframe.QUARTER:
      return 2160 // 90 days
    case Timeframe.ALL:
      return 8760 // 365 days (max)
    default:
      return 720
  }
}

export default function CampaignAnalytics() {
  const [dailyGrowth, setDailyGrowth] = useState<DailyGrowthResponse | null>(null)
  const [hourlyCompletion, setHourlyCompletion] = useState<HourlyCompletionStatsResponse | null>(null)
  const [isLoadingGrowth, setIsLoadingGrowth] = useState(true)
  const [isLoadingCompletion, setIsLoadingCompletion] = useState(true)
  const [growthError, setGrowthError] = useState<string | null>(null)
  const [completionError, setCompletionError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<Timeframe>(Timeframe.ALL)

  useEffect(() => {
    const fetchDailyGrowth = async () => {
      try {
        setIsLoadingGrowth(true)
        setGrowthError(null)
        // Use proxy in development, direct URL in production
        const isDevelopment =
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        const baseUrl = isDevelopment
          ? '/api/ponder'
          : process.env.REACT_APP_PONDER_JUICESWAP_URL || 'https://ponder.juiceswap.com'

        const days = Math.ceil(getHoursByTimeframe(timeframe) / 24)
        const response = await fetch(`${baseUrl}/campaign/daily-growth?days=${days}&chainId=5115`)

        if (!response.ok) {
          throw new Error('Failed to fetch daily growth data')
        }

        const data = await response.json()
        setDailyGrowth(data)
      } catch (error: unknown) {
        setGrowthError('Unable to load daily growth data')
      } finally {
        setIsLoadingGrowth(false)
      }
    }

    const fetchHourlyCompletion = async () => {
      try {
        setIsLoadingCompletion(true)
        setCompletionError(null)
        // Use proxy in development, direct URL in production
        const isDevelopment =
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        const baseUrl = isDevelopment
          ? '/api/ponder'
          : process.env.REACT_APP_PONDER_JUICESWAP_URL || 'https://ponder.juiceswap.com'

        const hours = getHoursByTimeframe(timeframe)
        const response = await fetch(`${baseUrl}/campaign/hourly-completion-stats?chainId=5115&hours=${hours}`)

        if (!response.ok) {
          throw new Error('Failed to fetch hourly completion stats')
        }

        const data = await response.json()
        setHourlyCompletion(data)
      } catch (error: unknown) {
        setCompletionError('Unable to load completion stats')
      } finally {
        setIsLoadingCompletion(false)
      }
    }

    fetchDailyGrowth()
    fetchHourlyCompletion()
  }, [timeframe])

  const completionData = hourlyCompletion?.data || []

  const isLoading = isLoadingGrowth || isLoadingCompletion
  const hasError = growthError || completionError

  return (
    <AnalyticsContainer>
      {/* Combined Participants vs Completed */}
      <Section>
        <SectionHeader>
          <Chart size="$icon.20" color="$accent1" />
          <SectionTitle>Total Participants vs Completed Participants</SectionTitle>
        </SectionHeader>

        {isLoading && <LoadingText>Loading participant comparison data...</LoadingText>}
        {hasError && <ErrorText>{completionError}</ErrorText>}

        {!isLoading && !hasError && hourlyCompletion && (
          <>
            <StatsGrid>
              <StatCard>
                <StatLabel>Total Participants</StatLabel>
                <StatValue>{hourlyCompletion.summary.currentParticipants.toLocaleString()}</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Completed Participants</StatLabel>
                <StatValue>{hourlyCompletion.summary.currentCompleted.toLocaleString()}</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Completion Rate</StatLabel>
                <StatValue>{hourlyCompletion.summary.currentCompletionRate.toFixed(1)}%</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Days Running</StatLabel>
                <StatValue>{dailyGrowth?.summary.totalDays || 0}</StatValue>
              </StatCard>
            </StatsGrid>

            <ChartContainer>
              {typeof window !== 'undefined' && (
                <Suspense fallback={<LoadingText>Loading chart...</LoadingText>}>
                  <ApexChart
                    key={`combined-chart-${timeframe}`}
                    type="area"
                    height={300}
                    options={{
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
                      },
                      fill: {
                        type: 'gradient',
                        gradient: {
                          type: 'vertical',
                          opacityFrom: 0.8,
                          opacityTo: 0.2,
                        },
                      },
                      colors: ['#FF6B00', '#10B981'],
                      legend: {
                        show: true,
                        position: 'top',
                        horizontalAlign: 'left',
                        labels: {
                          colors: '#FFFFFF',
                        },
                      },
                      tooltip: {
                        enabled: true,
                        theme: 'dark',
                        style: {
                          fontSize: '14px',
                          fontFamily: 'inherit',
                        },
                        cssClass: 'apexcharts-tooltip-dark',
                        x: {
                          format: 'dd MMM yyyy HH:mm',
                        },
                        y: {
                          formatter: (value: number) => value.toLocaleString(),
                          title: {
                            formatter: (seriesName: string) => seriesName + ':',
                          },
                        },
                        marker: {
                          show: true,
                        },
                        fixed: {
                          enabled: false,
                        },
                      },
                    }}
                    series={[
                      {
                        name: 'Total Participants',
                        data: completionData.map((hour) => {
                          return [new Date(hour.hour).getTime(), hour.totalParticipants]
                        }),
                      },
                      {
                        name: 'Completed Participants',
                        data: completionData.map((hour) => {
                          return [new Date(hour.hour).getTime(), hour.completedAllTasks]
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
