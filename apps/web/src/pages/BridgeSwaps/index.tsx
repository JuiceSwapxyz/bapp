import { useBridgeSwaps } from 'hooks/useBridgeSwaps'
import { useCrossChainSwapsEnabled } from 'hooks/useCrossChainSwapsEnabled'
import { useJuiceswapAuth } from 'hooks/useJuiceswapAuth'
import { useRefundsAndClaims } from 'hooks/useRefundsAndClaims'
import { AuthenticateSection } from 'pages/BridgeSwaps/AuthenticateSection'
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
import { useCallback, useMemo } from 'react'
import { Navigate } from 'react-router'
import { AnimatePresence, Flex, SpinningLoader } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'

export default function BridgeSwaps(): JSX.Element {
  const { isAuthenticated } = useJuiceswapAuth()
  const crossChainSwapsEnabled = useCrossChainSwapsEnabled()
  const {
    data: swaps = {
      summary: { total: 0, totalRefundable: 0, totalClaimable: 0, totalSuccess: 0, totalPending: 0 },
      swaps: [],
    },
    isLoading,
    refetch,
  } = useBridgeSwaps({ enabled: crossChainSwapsEnabled })

  const { data, isLoading: isLoadingRefundable, refetch: refetchRefundable } = useRefundsAndClaims()

  const refundableSwaps = useMemo(() => (data ? data.btc.readyToRefund : []), [data])
  const evmRefundableSwaps = useMemo(() => (data ? data.evm.readyToRefund : []), [data])
  const evmClaimableSwaps = useMemo(() => (data ? data.evm.readyToClaim : []), [data])

  const handleRefetch = useCallback(async () => {
    await Promise.all([refetch(), refetchRefundable()])
  }, [refetch, refetchRefundable])

  if (!crossChainSwapsEnabled) {
    return <Navigate to="/swap" replace />
  }

  if (!isAuthenticated) {
    return <AuthenticateSection />
  }

  if (isLoading) {
    return (
      <PageContainer justifyContent="center" alignItems="center">
        <AnimatePresence exitBeforeEnter>
          <Flex
            key="loading"
            gap="$spacing16"
            alignItems="center"
            animation="200ms"
            enterStyle={{ opacity: 0, y: 10 }}
            exitStyle={{ opacity: 0, y: -10 }}
          >
            <MainTitle textAlign="center">Bridge Swaps</MainTitle>
            <Subtitle textAlign="center">Syncing your bridge swaps...</Subtitle>
            <SpinningLoader />
          </Flex>
        </AnimatePresence>
      </PageContainer>
    )
  }

  const stats = {
    total: swaps.summary.total,
    refundable: swaps.summary.totalRefundable,
    claimable: swaps.summary.totalClaimable,
    pending: swaps.summary.totalPending,
    success: swaps.summary.totalSuccess,
  }

  return (
    <Trace logImpression page={InterfacePageName.BridgeSwapsPage}>
      <PageContainer>
        <AnimatePresence exitBeforeEnter>
          <ContentWrapper
            key="swaps-content"
            animation="200ms"
            enterStyle={{ opacity: 0, y: 10 }}
            exitStyle={{ opacity: 0, y: -10 }}
          >
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
              <StatItem>
                <StatValue>{stats.success}</StatValue>
                <StatLabel>Success</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{stats.pending}</StatValue>
                <StatLabel>Pending</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{stats.claimable}</StatValue>
                <StatLabel>Claimable</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{stats.refundable}</StatValue>
                <StatLabel>Refundable</StatLabel>
              </StatItem>
            </StatsBar>

            <ClaimableSwapsSection
              evmClaimableSwaps={evmClaimableSwaps}
              allSwaps={swaps.swaps}
              isLoading={isLoadingRefundable}
              onRefetch={handleRefetch}
            />

            <RefundableSwapsSection
              refundableSwaps={refundableSwaps}
              evmRefundableSwaps={evmRefundableSwaps}
              allSwaps={swaps.swaps}
              isLoading={isLoadingRefundable}
              onRefetch={handleRefetch}
            />

            <SwapsTable swaps={swaps.swaps} refundableSwaps={refundableSwaps} isLoading={isLoading} />
          </ContentWrapper>
        </AnimatePresence>
      </PageContainer>
    </Trace>
  )
}
