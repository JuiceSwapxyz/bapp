import { useBridgeSwaps } from 'hooks/useBridgeSwaps'
import { useCrossChainSwapsEnabled } from 'hooks/useCrossChainSwapsEnabled'
import { useEvmClaimableAndRefundableSwaps } from 'hooks/useEvmRefundableSwaps'
import { useRefundableSwaps } from 'hooks/useRefundableSwaps'
import { ClaimableSwapsSection } from 'pages/BridgeSwaps/ClaimableSwapsSection'
import { RefundableSwapsSection } from 'pages/BridgeSwaps/RefundableSwapsSection'
import { SwapsTable } from 'pages/BridgeSwaps/SwapsTable'
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
} from 'pages/BridgeSwaps/styles'
import { useCallback } from 'react'
import { Navigate } from 'react-router'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'

export default function BridgeSwaps(): JSX.Element {
  const crossChainSwapsEnabled = useCrossChainSwapsEnabled()
  const { data: swaps = [], isLoading, refetch } = useBridgeSwaps(crossChainSwapsEnabled)
  const {
    data: refundableSwaps = [],
    isLoading: isLoadingRefundable,
    refetch: refetchRefundable,
  } = useRefundableSwaps(crossChainSwapsEnabled)
  const {
    data: evmSwapsData = { refundable: [], locked: [], claimable: [] },
    isLoading: isLoadingEvmRefundable,
    refetch: refetchEvmRefundable,
  } = useEvmClaimableAndRefundableSwaps(crossChainSwapsEnabled)

  const evmRefundableSwaps = evmSwapsData.refundable
  const evmClaimableSwaps = evmSwapsData.claimable

  const handleRefetch = useCallback(async () => {
    await Promise.all([refetch(), refetchRefundable(), refetchEvmRefundable()])
  }, [refetch, refetchRefundable, refetchEvmRefundable])

  if (!crossChainSwapsEnabled) {
    return <Navigate to="/swap" replace />
  }

  const stats = {
    total: swaps.length,
    refundable: refundableSwaps.length + evmRefundableSwaps.length,
    claimable: evmClaimableSwaps.length,
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
            {stats.claimable > 0 && (
              <StatItem>
                <StatValue>{stats.claimable}</StatValue>
                <StatLabel>Claimable</StatLabel>
              </StatItem>
            )}
            {stats.refundable > 0 && (
              <StatItem>
                <StatValue>{stats.refundable}</StatValue>
                <StatLabel>Refundable</StatLabel>
              </StatItem>
            )}
          </StatsBar>

          <ClaimableSwapsSection
            evmClaimableSwaps={evmClaimableSwaps}
            allSwaps={swaps}
            isLoading={isLoadingEvmRefundable}
            onRefetch={handleRefetch}
          />

          <RefundableSwapsSection
            refundableSwaps={refundableSwaps}
            evmRefundableSwaps={evmRefundableSwaps}
            allSwaps={swaps}
            isLoading={isLoadingRefundable || isLoadingEvmRefundable}
            onRefetch={handleRefetch}
          />

          <SwapsTable swaps={swaps} refundableSwaps={refundableSwaps} isLoading={isLoading} />
        </ContentWrapper>
      </PageContainer>
    </Trace>
  )
}
