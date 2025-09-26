import { useAccount } from 'hooks/useAccount'
import BappsContent from 'pages/Bapps/BappsContent'
import { useCallback, useEffect, useState } from 'react'
import { Button, Flex, Text, styled } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
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

const ExternalLinkButton = styled(Button, {
  gap: '$spacing8',
  paddingHorizontal: '$spacing16',
  paddingVertical: '$spacing12',
  backgroundColor: '$accent1',
  borderRadius: '$rounded12',
  variants: {
    hover: {
      true: {
        backgroundColor: '$accent2',
      },
    },
  },
})

export default function Bapps() {
  const account = useAccount()
  const [campaignProgress, setCampaignProgress] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleVisitBapps = useCallback(() => {
    window.open('https://bapps.citrea.xyz', '_blank', 'noopener,noreferrer')
  }, [])

  const fetchCampaignProgress = useCallback(async () => {
    if (!account.address) {
      return
    }

    setIsLoading(true)
    try {
      const baseUrl = process.env.REACT_APP_PONDER_JUICESWAP_URL || 'https://ponder.juiceswap.com'
      const response = await fetch(`${baseUrl}/campaign/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account.address,
          chainId: 5115, // Citrea Testnet
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCampaignProgress(data)
      }
    } catch (error) {
      // Silent error handling - campaign progress is optional
    } finally {
      setIsLoading(false)
    }
  }, [account.address])

  useEffect(() => {
    if (account.address) {
      fetchCampaignProgress()
    }
  }, [account.address, fetchCampaignProgress])

  return (
    <Trace logImpression page={InterfacePageName.LandingPage}>
      <PageContainer>
        <ContentWrapper>
          <HeaderSection>
            <TitleSection>
              <MainTitle>Citrea ₿Apps Campaign</MainTitle>
              <Subtitle>Complete swap tasks on Citrea Testnet to participate in the bApps campaign</Subtitle>
            </TitleSection>
            <ExternalLinkButton onPress={handleVisitBapps}>
              <Text variant="buttonLabel3" color="$white">
                Visit bApps.citrea.xyz
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
