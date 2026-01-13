import { useBridgeSwaps } from 'hooks/useBridgeSwaps'
import { useRefundableSwaps } from 'hooks/useRefundableSwaps'
import { useCallback } from 'react'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { RefundableSwapsSection } from './RefundableSwapsSection'
import { SwapsTable } from './SwapsTable'
import {
  ContentWrapper,
  HeaderSection,
  MainTitle,
  PageContainer,
  StatItem,
  StatLabel,
  StatValue,
  StatsBar,
  Subtitle,
  TitleSection,
} from './styles'

export default function BridgeSwaps(): JSX.Element {
  const { data: swaps = [], isLoading, refetch } = useBridgeSwaps()
  const {
    data: refundableSwaps = [],
    isLoading: isLoadingRefundable,
    refetch: refetchRefundable,
  } = useRefundableSwaps()

  const handleRefetch = useCallback(async () => {
    await Promise.all([refetch(), refetchRefundable()])
  }, [refetch, refetchRefundable])

  const stats = {
    total: swaps.length,
    refundable: refundableSwaps.length,
  }

  return (
    <Trace logImpression page={InterfacePageName.BridgeSwapsPage}>
      <PageContainer>
        <ContentWrapper>
          <HeaderSection>
            <TitleSection>
              <MainTitle>Bridge Swaps</MainTitle>
              <Subtitle>View and manage all your Bitcoin bridge transactions</Subtitle>
            </TitleSection>
          </HeaderSection>

          <StatsBar>
            <StatItem>
              <StatValue>{stats.total}</StatValue>
              <StatLabel>Total Swaps</StatLabel>
            </StatItem>
            {stats.refundable > 0 && (
              <StatItem>
                <StatValue>{stats.refundable}</StatValue>
                <StatLabel>Refundable</StatLabel>
              </StatItem>
            )}
          </StatsBar>

          <RefundableSwapsSection
            refundableSwaps={refundableSwaps}
            isLoading={isLoadingRefundable}
            onRefetch={handleRefetch}
          />

          <SwapsTable swaps={swaps} refundableSwaps={refundableSwaps} isLoading={isLoading} onRefresh={refetch} />
        </ContentWrapper>
      </PageContainer>
    </Trace>
  )
}
