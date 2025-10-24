import { useAccount } from 'hooks/useAccount'
import BappsContent from 'pages/Bapps/BappsContent'
import { useCallback } from 'react'
import { Flex, Text, styled } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { useCampaignProgressQuery } from 'uniswap/src/data/apiClients/ponderApi/PonderApi'
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

const ExternalLinkButton = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing8',
  paddingHorizontal: '$spacing24',
  paddingVertical: '$spacing20',
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

export default function Bapps() {
  const account = useAccount()
  const { data: campaignProgress, isLoading } = useCampaignProgressQuery(account.address ?? '')

  const handleVisitBapps = useCallback(() => {
    window.open('https://bapps.citrea.com', '_blank', 'noopener,noreferrer')
  }, [])

  return (
    <Trace logImpression page={InterfacePageName.LandingPage}>
      <PageContainer>
        <ContentWrapper>
          <HeaderSection>
            <TitleSection>
              <MainTitle>Citrea ₿apps Campaign</MainTitle>
              <Subtitle>Complete swap tasks on Citrea Testnet to participate in the ₿apps campaign</Subtitle>
            </TitleSection>
            <ExternalLinkButton onPress={handleVisitBapps}>
              <Text variant="buttonLabel4" color="$white">
                Visit ₿apps.citrea.xyz
              </Text>
              <ExternalLink size="$icon.16" color="$white" />
            </ExternalLinkButton>
          </HeaderSection>

          <BappsContent account={account} campaignProgress={campaignProgress} isLoading={isLoading} />
        </ContentWrapper>
      </PageContainer>
    </Trace>
  )
}
