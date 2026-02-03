import { CompensationClaimSection } from 'components/CompensationClaim'
import { Flex, Text, styled } from 'ui/src'
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
  paddingBottom: '$spacing24',
  borderBottomWidth: 1,
  borderBottomColor: '$surface3',
})

const TitleSection = styled(Flex, {
  gap: '$spacing12',
  flex: 1,
  minWidth: 0,
  alignItems: 'center',
})

const PageIcon = styled(Text, {
  fontSize: 48,
  lineHeight: 48,
})

const MainTitle = styled(Text, {
  variant: 'heading2',
  color: '$neutral1',
  fontWeight: 'bold',
})

const Subtitle = styled(Text, {
  variant: 'body2',
  color: '$neutral2',
  $md: {
    maxWidth: '100%',
  },
})

export default function Compensation() {
  return (
    <Trace logImpression page={InterfacePageName.LandingPage}>
      <PageContainer>
        <ContentWrapper>
          <HeaderSection>
            <TitleSection>
              <Flex row gap="$spacing16" alignItems="center">
                <PageIcon>💰</PageIcon>
                <Flex gap="$spacing8" flex={1} minWidth={0}>
                  <MainTitle>Compensation Claim</MainTitle>
                  <Subtitle>Claim your compensation tokens for interchain swap issues on Citrea Mainnet</Subtitle>
                </Flex>
              </Flex>
            </TitleSection>
          </HeaderSection>

          <Flex alignItems="center" justifyContent="center" py="$spacing24">
            <CompensationClaimSection />
          </Flex>
        </ContentWrapper>
      </PageContainer>
    </Trace>
  )
}
